'use strict';

const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');
const { fork } = require('node:child_process');
const { allowed, MESSAGE } = require('./read-only');
const { rewrite, scopeUrl } = require('./rewrite');

function register(app) {
  let child, starting, port, idle;
  function stop() { clearTimeout(idle); if (child) child.kill(); child = null; port = null; starting = null; }
  function touch() { clearTimeout(idle); idle = setTimeout(stop, 20 * 60 * 1000); idle.unref(); }
  process.once('exit', stop);
  function start() {
    touch();
    if (port) return Promise.resolve(port);
    if (starting) return starting;
    starting = new Promise((resolve, reject) => {
      // Do not inherit the LMS database, JWT secret, provider credentials,
      // upload directory, Node options, or .env into this process.
      const env = {};
      for (const key of ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'TMPDIR', 'HOME', 'USERPROFILE', 'LOCALAPPDATA']) if (process.env[key]) env[key] = process.env[key];
      Object.assign(env, { ECHOLENS_DEMO_WORKER: '1', JWT_SECRET: crypto.randomBytes(48).toString('hex'), APP_URL: (process.env.APP_URL || 'https://www.echolens.digital').replace(/\/$/, '') + '/demo' });
      const worker = child = fork(path.join(__dirname, 'worker.cjs'), [], { env, execArgv: ['--max-old-space-size=96'], stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
      worker.stderr.on('data', chunk => console.error('[demo]', String(chunk).trim()));
      const timer = setTimeout(() => { worker.kill(); reject(new Error('Demo startup timed out.')); }, 60000);
      worker.once('message', message => {
        if (message?.type !== 'ready' || !Number.isInteger(message.port)) return;
        clearTimeout(timer); port = message.port; resolve(port);
      });
      worker.once('error', err => { clearTimeout(timer); reject(err); });
      worker.once('exit', () => { clearTimeout(timer); if (child === worker) { child = null; port = null; starting = null; } reject(new Error('Demo process stopped.')); });
    });
    return starting;
  }
  app.use('/demo', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    // Express matches mounts without regard to case, while browsers match
    // cookie paths exactly. Keep every entry on the canonical cookie path.
    if (req.baseUrl !== '/demo') return res.redirect(308, '/demo' + req.url);
    if (!allowed(req.method, req.url)) return res.status(403).json({ error: MESSAGE, code: 'DEMO_READ_ONLY' });
    try {
      const target = await start();
      if (res.destroyed) return;
      // A demo request never receives a live account cookie, Authorization
      // header, forwarded host, or a caller-selected upstream destination.
      const headers = { host: '127.0.0.1:' + target, 'accept-encoding': 'identity' };
      for (const key of ['content-type', 'content-length', 'accept']) if (req.headers[key]) headers[key] = req.headers[key];
      const demoCookie = String(req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('el_demo_token='));
      if (demoCookie) headers.cookie = demoCookie;
      // req.url retains query strings; a leading // must remain a local path.
      const upstream = http.request({ hostname: '127.0.0.1', port: target, method: req.method, path: req.url, headers, timeout: 30000 }, response => {
        res.statusCode = response.statusCode;
        const type = String(response.headers['content-type'] || '');
        for (const key of ['content-type', 'content-disposition', 'x-content-type-options', 'x-frame-options']) if (response.headers[key]) res.setHeader(key, response.headers[key]);
        res.setHeader('X-EchoLens-Demo', 'read-only');
        if (response.headers.location) res.setHeader('Location', scopeUrl(response.headers.location));
        if (response.headers['set-cookie']) res.setHeader('Set-Cookie', response.headers['set-cookie'].filter(c => c.startsWith('el_demo_token=')).map(c => c.replace(/;\s*Path=[^;]*/i, '; Path=/demo') + (req.secure && !/;\s*Secure/i.test(c) ? '; Secure' : '')));
        if (/html|javascript|json|css|xml/i.test(type)) {
          const chunks = []; let size = 0;
          response.on('data', chunk => { size += chunk.length; if (size > 12 * 1024 * 1024) response.destroy(new Error('Demo response too large.')); else chunks.push(chunk); });
          response.on('end', () => res.end(rewrite(Buffer.concat(chunks).toString('utf8'), type)));
          response.on('error', () => { if (!res.headersSent) res.status(502).json({ error: 'Demo response could not finish. Please retry.' }); else res.destroy(); });
        } else response.pipe(res);
      });
      upstream.on('timeout', () => upstream.destroy(new Error('Demo request timed out.')));
      upstream.on('error', () => { if (!res.headersSent) res.status(503).json({ error: 'The demo is starting or restarting. Please retry shortly.' }); else res.destroy(); });
      res.once('close', () => upstream.destroy());
      req.pipe(upstream);
    } catch (err) {
      console.error('[demo] startup:', err.message);
      if (!res.headersSent) res.status(503).json({ error: 'The demo is starting or restarting. Please retry shortly.' });
    }
  });
  return { stop };
}
module.exports = { register };
