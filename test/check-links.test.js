'use strict';
const { test } = require('node:test'), assert = require('node:assert/strict');
const http = require('node:http'), { once } = require('node:events');
test('crawler resolves internal URLs and reports HTTP errors and placeholders without submitting forms', async t => {
  const { anchors, crawl } = await import('../scripts/check-links.mjs');
  assert.deepEqual(anchors(`<a href='/terms'>Terms</a><!-- <a href='/hidden'> --><script>"<a href='/fake'>"</script><a href="/x?a=1&amp;b=2">X</a>`), ['/terms', '/x?a=1&b=2']);
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push(req.url); res.setHeader('Content-Type', 'text/html');
    if (req.url === '/missing') { res.statusCode = 404; return res.end('Missing'); }
    if (req.url === '/') return res.end(`<a href="/ok">OK</a><a href="/missing">Missing</a><a href="#">Placeholder</a><a href="/api/delete">API excluded</a><form action="/form" method="post"></form><a href="mailto:info@echolens.digital">Email</a>`);
    res.end('<a href="/">Home</a>');
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening'); t.after(() => new Promise(resolve => server.close(resolve)));
  const result = await crawl('http://127.0.0.1:' + server.address().port, { log() {} });
  assert.equal(result.checked, 3); assert.equal(result.failures.length, 1); assert.equal(result.failures[0].status, 404);
  assert.equal(result.warnings.length, 1); assert.equal(result.warnings[0].reason, 'placeholder link');
  assert.ok(!hits.includes('/api/delete')); assert.ok(!hits.includes('/form'));
});
