'use strict';

/**
 * EchoLens code runner v2 (v10)
 *
 * A complete in-browser Python environment:
 *  - Pyodide inside a Web Worker: nothing runs on the server, and a stuck
 *    loop can never freeze the page - it is terminated at the watchdog.
 *  - Real terminal: output streams live, and input() works interactively -
 *    the prompt appears in the terminal and the student types right there.
 *  - Scientific stack: numpy, pandas, matplotlib, scikit-learn (and any
 *    other Pyodide package) auto-load from the imports in the code.
 *  - matplotlib figures render as images below the terminal output.
 *
 * How interactive input works without SharedArrayBuffer: when the program
 * calls input() and no answer is queued, the run pauses and the terminal
 * shows an input field. The answer is queued and the program re-runs from
 * the start with all answers so far - already-seen output is suppressed, so
 * to the student it looks like the program simply continued. Package loads
 * are cached, so re-runs are fast.
 */
(function () {
  const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
  const SILENCE_LIMIT_MS = 45000;   // no signal from the worker for this long -> stop
  const HARD_LIMIT_MS = 240000;     // absolute cap per run incl. package downloads

  /* ------------------------------ the worker ------------------------------ */
  function workerMain() {
    let bootPromise = null;
    const dec = new TextDecoder();
    function boot(url) {
      if (!bootPromise) {
        bootPromise = (async () => {
          importScripts(url);
          self.pyodide = await loadPyodide();
        })();
      }
      return bootPromise;
    }
    self.onmessage = async (e) => {
      const m = e.data;
      if (m.type === 'init') {
        try { await boot(m.url); postMessage({ type: 'ready' }); }
        catch (err) { postMessage({ type: 'fatal', error: String(err) }); }
        return;
      }
      if (m.type !== 'run') return;
      let needInput = false;
      try {
        await boot(m.url);
        const py = self.pyodide;
        // Stream stdout/stderr byte-for-byte so input() prompts (no trailing
        // newline) appear immediately.
        py.setStdout({ write: (buf) => { postMessage({ type: 'out', text: dec.decode(buf, { stream: true }) }); return buf.length; } });
        py.setStderr({ write: (buf) => { postMessage({ type: 'out', text: dec.decode(buf, { stream: true }) }); return buf.length; } });
        const lines = m.stdin || [];
        let li = 0;
        py.setStdin({
          stdin: () => {
            if (li < lines.length) return lines[li++] + '\n';
            needInput = true;
            throw new Error('ECHO_NEED_INPUT');
          },
        });
        // Mount attached datasets into Python's filesystem so
        // pd.read_csv('sales.csv') works exactly like on a laptop.
        for (const f of m.files || []) {
          try { py.FS.writeFile('/home/pyodide/' + f.name, new Uint8Array(f.bytes)); } catch (fsErr) {}
        }
        // Auto-load packages from the imports (numpy, pandas, matplotlib,
        // scikit-learn, ...). Progress lines go to the status bar.
        postMessage({ type: 'status', text: 'Checking packages...' });
        try {
          await py.loadPackagesFromImports(m.code, {
            messageCallback: (t) => postMessage({ type: 'status', text: String(t).slice(0, 120) }),
            errorCallback: () => {},
          });
        } catch (pkgErr) { /* unknown imports fail in Python with a clear error */ }
        // Headless matplotlib inside the worker.
        await py.runPythonAsync('import os as _os\n_os.environ.setdefault("MPLBACKEND","AGG")');
        postMessage({ type: 'status', text: 'Running...' });
        await py.runPythonAsync(m.code);
        // Capture any matplotlib figures as PNGs.
        let images = [];
        try {
          const cap = [
            'import sys as _sys, json as _json',
            '_imgs = []',
            'if "matplotlib" in _sys.modules:',
            '    import io as _io, base64 as _b64',
            '    import matplotlib.pyplot as _plt',
            '    for _n in _plt.get_fignums():',
            '        _buf = _io.BytesIO()',
            '        _plt.figure(_n).savefig(_buf, format="png", dpi=110, bbox_inches="tight")',
            '        _imgs.append(_b64.b64encode(_buf.getvalue()).decode())',
            '    _plt.close("all")',
            '_json.dumps(_imgs)',
          ].join('\n');
          images = JSON.parse(await py.runPythonAsync(cap));
        } catch (capErr) { images = []; }
        postMessage({ type: 'done', ok: true, images });
      } catch (err) {
        if (needInput) { postMessage({ type: 'need_input' }); return; }
        let msg = String((err && err.message) || err);
        // Trim Pyodide's internal frames from the traceback - students should
        // see their own code's error, not the plumbing.
        msg = msg.split('\n').filter((l) => !/pyodide\/|_pyodide\//.test(l)).join('\n');
        postMessage({ type: 'out', text: (msg.endsWith('\n') ? msg : msg + '\n') });
        postMessage({ type: 'done', ok: false, images: [] });
      }
    };
  }

  let worker = null;
  let busy = false;
  let cancelCurrent = null;

  function makeWorker() {
    const blob = new Blob(['(' + workerMain.toString() + ')()'], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
  }
  function killWorker() {
    if (worker) { try { worker.terminate(); } catch {} }
    worker = null;
  }

  /* --------------------------- terminal component --------------------------- */
  // EchoTerm.mount(el) -> { clear, print, askInput, showImages, focus }
  function mount(el) {
    el.classList.add('term');
    el.innerHTML = `
      <div class="term-body">
        <pre class="term-out"></pre>
        <div class="term-in-row" style="display:none"><span class="term-caret">&#8250;</span><input class="term-in" autocomplete="off" spellcheck="false" placeholder="type your answer and press Enter"></div>
        <div class="term-imgs"></div>
      </div>`;
    const out = el.querySelector('.term-out');
    const row = el.querySelector('.term-in-row');
    const inp = el.querySelector('.term-in');
    const imgs = el.querySelector('.term-imgs');
    const body = el.querySelector('.term-body');
    const scroll = () => { body.scrollTop = body.scrollHeight; };
    let pendingResolve = null;
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && pendingResolve) {
        const v = inp.value;
        inp.value = '';
        row.style.display = 'none';
        out.textContent += v + '\n'; // echo, like a real terminal
        const r = pendingResolve; pendingResolve = null;
        scroll(); r(v);
      }
    });
    return {
      clear() { out.textContent = ''; imgs.innerHTML = ''; row.style.display = 'none'; if (pendingResolve) { const r = pendingResolve; pendingResolve = null; r(null); } },
      print(text) { out.textContent += text; scroll(); },
      askInput() {
        return new Promise((resolve) => {
          pendingResolve = resolve;
          row.style.display = 'flex';
          scroll();
          inp.focus();
        });
      },
      cancelInput() { if (pendingResolve) { const r = pendingResolve; pendingResolve = null; row.style.display = 'none'; r(null); } },
      showImages(list) {
        for (const b64 of list || []) {
          const im = document.createElement('img');
          im.className = 'term-img';
          im.src = 'data:image/png;base64,' + b64;
          imgs.appendChild(im);
        }
        scroll();
      },
      isEmpty() { return !out.textContent && !imgs.children.length; },
    };
  }

  /* ------------------------------ run session ------------------------------ */
  // Orchestrates the run: package status, streamed output, interactive
  // input via re-run with suppressed replay, images, watchdogs.
  async function execute(code, { term, onStatus, files }) {
    if (busy) throw new Error('A program is already running - stop it first.');
    busy = true;
    const status = (t) => { try { onStatus && onStatus(t); } catch {} };
    // Fetch attached datasets once per run (same-origin, signed-in cookie).
    let fileBytes = [];
    if (files && files.length) {
      status('Loading dataset' + (files.length > 1 ? 's' : '') + '...');
      try {
        fileBytes = await Promise.all(files.map(async (f) => {
          if (f.bytes) return { name: f.name, bytes: f.bytes }; // v12: local uploads / URL datasets arrive pre-loaded
          const r = await fetch(f.url, { credentials: 'same-origin' });
          if (!r.ok) throw new Error('Could not load ' + f.name);
          return { name: f.name, bytes: await r.arrayBuffer() };
        }));
      } catch (e) { busy = false; throw new Error(e.message + ' - refresh and try again.'); }
    }
    const stdinLines = [];
    let streamPrinted = 0; // python-stream chars already shown (for replay suppression)
    let stopped = false;
    cancelCurrent = () => {
      stopped = true;
      killWorker();
      term.cancelInput();
      term.print('\n[Stopped. Python restarts on the next run.]\n');
      status('Stopped.');
    };
    term.clear();
    try {
      for (let attempt = 0; attempt < 60; attempt++) { // up to 60 input answers
        if (stopped) return { ok: false, stopped: true };
        if (!worker) {
          worker = makeWorker();
          status('Loading Python (first run only, ~7 MB)...');
          await new Promise((resolve, reject) => {
            const onMsg = (e) => {
              if (e.data.type === 'ready') { worker.removeEventListener('message', onMsg); resolve(); }
              if (e.data.type === 'fatal') { worker.removeEventListener('message', onMsg); reject(new Error('Could not load Python: ' + e.data.error)); }
            };
            worker.addEventListener('message', onMsg);
            worker.onerror = () => reject(new Error('Python failed to load - check your internet connection and try again.'));
            worker.postMessage({ type: 'init', url: PYODIDE_URL });
          });
        }
        if (stopped) return { ok: false, stopped: true };

        let skip = streamPrinted; // suppress replayed output on re-runs
        const result = await new Promise((resolve) => {
          let lastSignal = Date.now();
          const started = Date.now();
          const tick = setInterval(() => {
            if (stopped) { clearInterval(tick); resolve({ kind: 'stopped' }); return; }
            const quiet = Date.now() - lastSignal > SILENCE_LIMIT_MS;
            const over = Date.now() - started > HARD_LIMIT_MS;
            if (quiet || over) {
              clearInterval(tick);
              killWorker();
              term.print('\n[Stopped: the program ran too long' + (quiet ? ' without responding' : '') + '. Check for infinite loops (a while loop that never ends) and try again.]\n');
              resolve({ kind: 'timeout' });
            }
          }, 1000);
          const onMsg = (e) => {
            const m = e.data;
            lastSignal = Date.now();
            if (m.type === 'status') { status(m.text); return; }
            if (m.type === 'out') {
              let text = m.text;
              if (skip > 0) {
                if (text.length <= skip) { skip -= text.length; return; }
                text = text.slice(skip); skip = 0;
              }
              streamPrinted += text.length;
              term.print(text);
              return;
            }
            if (m.type === 'need_input') { clearInterval(tick); worker.removeEventListener('message', onMsg); resolve({ kind: 'need_input' }); }
            if (m.type === 'done') { clearInterval(tick); worker.removeEventListener('message', onMsg); resolve({ kind: 'done', ok: m.ok, images: m.images }); }
          };
          worker.addEventListener('message', onMsg);
          worker.postMessage({ type: 'run', code: String(code), stdin: stdinLines.slice(), url: PYODIDE_URL, files: fileBytes });
        });

        if (result.kind === 'stopped') return { ok: false, stopped: true };
        if (result.kind === 'timeout') { status('Stopped at time limit.'); return { ok: false, timedOut: true }; }
        if (result.kind === 'need_input') {
          status('Waiting for your input...');
          const answer = await term.askInput();
          if (answer == null || stopped) return { ok: false, stopped: true };
          stdinLines.push(answer);
          status('Continuing...');
          continue; // re-run with the new answer; replayed output is suppressed
        }
        // done
        term.showImages(result.images);
        status(result.ok ? 'Done.' : 'Finished with an error - read the message above.');
        return { ok: result.ok };
      }
      status('Stopped: too many input() calls in one run.');
      return { ok: false };
    } finally {
      busy = false;
      cancelCurrent = null;
    }
  }

  function cancel() { if (cancelCurrent) cancelCurrent(); else killWorker(); }

  /* ------------------------------ editor helper ------------------------------ */
  // Tab inserts 4 spaces; Enter keeps the current indentation (plus one level
  // after a line ending in ':'), so Python editing feels natural.
  function wireEditor(box) {
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const st = box.selectionStart;
        box.value = box.value.slice(0, st) + '    ' + box.value.slice(box.selectionEnd);
        box.selectionStart = box.selectionEnd = st + 4;
      }
      if (e.key === 'Enter') {
        const st = box.selectionStart;
        const before = box.value.slice(0, st);
        const line = before.slice(before.lastIndexOf('\n') + 1);
        const indent = (line.match(/^\s*/) || [''])[0] + (/:\s*$/.test(line) ? '    ' : '');
        if (indent) {
          e.preventDefault();
          box.value = before + '\n' + indent + box.value.slice(box.selectionEnd);
          box.selectionStart = box.selectionEnd = st + 1 + indent.length;
        }
      }
    });
  }

  /* --------------------------- web runner (v11) --------------------------- */
  // HTML / CSS / JavaScript run in a sandboxed live preview. A full page
  // (with <html> or <!doctype>) renders as-is; a fragment gets wrapped.
  // console.log / errors are forwarded to the terminal-style log below.
  function webPreview(iframe, code, onLog) {
    const raw = String(code || '');
    const isFullPage = /<\s*html|<!doctype/i.test(raw);
    const bridge = `<script>
      (function(){
        function send(kind, args){ parent.postMessage({ echoweb: true, kind: kind, text: args.map(function(a){ try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e){ return String(a); } }).join(' ') }, '*'); }
        ['log','warn','error','info'].forEach(function(k){ var orig = console[k]; console[k] = function(){ send(k, [].slice.call(arguments)); orig.apply(console, arguments); }; });
        window.addEventListener('error', function(e){ send('error', [e.message + ' (line ' + e.lineno + ')']); });
      })();
    <\/script>`;
    const doc = isFullPage
      ? raw.replace(/<head(\s[^>]*)?>/i, (m2) => m2 + bridge) || bridge + raw
      : `<!doctype html><html><head><meta charset="utf-8">${bridge}<style>body{font-family:system-ui,sans-serif;margin:12px;color:#16233A}</style></head><body>${raw}</body></html>`;
    if (iframe._echoLogHandler) window.removeEventListener('message', iframe._echoLogHandler);
    iframe._echoLogHandler = (e) => {
      if (e.data && e.data.echoweb && onLog) onLog(e.data.kind, e.data.text);
    };
    window.addEventListener('message', iframe._echoLogHandler);
    iframe.srcdoc = isFullPage && !/<head/i.test(raw) ? bridge + raw : doc;
  }

  /* ============================== v12: SQL ==============================
   * SQLite compiled to WebAssembly (sql.js) - a full SQL engine in the
   * browser, free for everyone, zero server load. CSV datasets (attached to
   * a task, uploaded by the student, or pulled from a URL) are imported as
   * tables automatically: data.csv -> table `data`.
   */
  const SQLJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/';
  let sqlModule = null;
  async function loadSql(status) {
    if (sqlModule) return sqlModule;
    status && status('Loading SQL engine (first run only)...');
    await new Promise((resolve, reject) => {
      if (window.initSqlJs) return resolve();
      const s = document.createElement('script');
      s.src = SQLJS_URL + 'sql-wasm.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Could not load the SQL engine - check your internet connection.'));
      document.head.appendChild(s);
    });
    sqlModule = await window.initSqlJs({ locateFile: (f) => SQLJS_URL + f });
    return sqlModule;
  }
  // Small dependency-free CSV parser (handles quoted fields and embedded commas).
  function parseCsv(text) {
    const rows = []; let row = [], cur = '', inQ = false;
    const s = String(text).replace(/\r\n/g, '\n');
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inQ) {
        if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
        else cur += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''));
  }
  function tableNameFor(fileName) {
    return String(fileName).replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, 't$1') || 'data';
  }
  async function runSql(code, { term, onStatus, files }) {
    const status = (t) => { try { onStatus && onStatus(t); } catch {} };
    const SQL = await loadSql(status);
    const db = new SQL.Database();
    const dec = new TextDecoder();
    const imported = [];
    for (const f of files || []) {
      try {
        if (!/\.(csv|tsv|txt)$/i.test(f.name)) continue;
        const text = f.bytes ? dec.decode(f.bytes) : await (await fetch(f.url, { credentials: 'same-origin' })).text();
        const rows = parseCsv(/\.tsv$/i.test(f.name) ? text.replace(/\t/g, ',') : text);
        if (rows.length < 2) continue;
        const table = tableNameFor(f.name);
        const cols = rows[0].map((c, i) => (String(c).trim().replace(/[^a-zA-Z0-9_]/g, '_') || 'col' + i));
        db.run(`CREATE TABLE ${table} (${cols.map((c) => '"' + c + '"').join(', ')});`);
        const stmt = db.prepare(`INSERT INTO ${table} VALUES (${cols.map(() => '?').join(',')})`);
        for (const r of rows.slice(1)) stmt.run(cols.map((_, i) => (r[i] !== undefined ? r[i] : null)));
        stmt.free();
        imported.push(`${table} (${rows.length - 1} rows)`);
      } catch (e) { term.print(`[Could not import ${f.name}: ${e.message}]\n`); }
    }
    if (imported.length) term.print(`-- Datasets loaded as tables: ${imported.join(', ')}\n\n`);
    status('Running SQL...');
    try {
      const results = db.exec(String(code));
      if (!results.length) term.print('Query OK (no rows returned).\n');
      for (const r of results) {
        const widths = r.columns.map((c, i) => Math.max(String(c).length, ...r.values.map((v) => String(v[i] ?? 'NULL').length)));
        const line = (cells) => '| ' + cells.map((c, i) => String(c ?? 'NULL').padEnd(widths[i])).join(' | ') + ' |\n';
        term.print(line(r.columns));
        term.print('|' + widths.map((w) => '-'.repeat(w + 2)).join('|') + '|\n');
        for (const v of r.values.slice(0, 200)) term.print(line(v));
        if (r.values.length > 200) term.print(`... ${r.values.length - 200} more rows\n`);
        term.print(`(${r.values.length} row${r.values.length === 1 ? '' : 's'})\n\n`);
      }
      status('Done.');
      return { ok: true };
    } catch (e) {
      term.print('SQL error: ' + e.message + '\n');
      status('Finished with an error - read the message above.');
      return { ok: false };
    } finally { db.close(); }
  }

  /* ============================== v12: C / C++ ==============================
   * Compiled and run through the free public Piston execution API
   * (emkc.org) - real gcc/g++, stdin supported, nothing installed on the
   * EchoLens server. If the API is unreachable, the student gets a clear
   * message instead of a hang.
   */
  const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';
  const PISTON_LANG = { c: { language: 'c', version: '10.2.0', file: 'main.c' }, cpp: { language: 'c++', version: '10.2.0', file: 'main.cpp' } };
  async function runNative(lang, code, { term, onStatus }) {
    const status = (t) => { try { onStatus && onStatus(t); } catch {} };
    const cfg = PISTON_LANG[lang];
    // If the program reads input, collect it up-front (compiled programs run
    // remotely, so input is provided as stdin lines before the run).
    let stdin = '';
    if (/\b(scanf|cin\s*>>|getline|gets|fgets|getchar)\b/.test(code)) {
      term.print('This program reads input. Type ALL input lines below (press Enter after each, empty line to finish):\n');
      const lines = [];
      for (let i = 0; i < 30; i++) {
        const v = await term.askInput();
        if (v == null || v === '') break;
        lines.push(v);
      }
      stdin = lines.join('\n');
      term.print('\n');
    }
    status(lang === 'c' ? 'Compiling & running C (gcc)...' : 'Compiling & running C++ (g++)...');
    try {
      const r = await fetch(PISTON_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: cfg.language, version: cfg.version, files: [{ name: cfg.file, content: String(code) }], stdin, compile_timeout: 10000, run_timeout: 8000 }),
      });
      if (!r.ok) throw new Error('The compile service answered ' + r.status + ' - try again in a minute.');
      const d = await r.json();
      if (d.compile && d.compile.stderr) term.print(d.compile.stderr + '\n');
      if (d.compile && d.compile.code !== 0 && d.compile.code != null) { status('Compilation failed - read the errors above.'); return { ok: false }; }
      if (d.run) {
        if (d.run.stdout) term.print(d.run.stdout);
        if (d.run.stderr) term.print(d.run.stderr);
        if (d.run.signal === 'SIGKILL') term.print('\n[Stopped: the program ran too long. Check for infinite loops.]\n');
        status(d.run.code === 0 ? 'Done.' : 'Finished with exit code ' + d.run.code + '.');
        return { ok: d.run.code === 0 };
      }
      status('Done.');
      return { ok: true };
    } catch (e) {
      term.print('[' + e.message + ']\n');
      status('Could not reach the compiler service.');
      return { ok: false };
    }
  }

  /* ----------------------- v12: one runner, every language -----------------------
   * EchoRun.executeAny('python'|'sql'|'c'|'cpp', code, opts) - opts.files may
   * be {name, url} (fetched with the signed-in cookie) or {name, bytes}
   * (already-loaded local uploads / URL datasets).
   */
  async function executeAny(lang, code, opts) {
    const files = [];
    for (const f of (opts.files || [])) {
      if (f.bytes) files.push(f);
      else if (f.url) {
        try {
          const r = await fetch(f.url, { credentials: 'same-origin' });
          if (r.ok) files.push({ name: f.name, bytes: await r.arrayBuffer() });
        } catch {}
      }
    }
    if (lang === 'sql') return runSql(code, { ...opts, files });
    if (lang === 'c' || lang === 'cpp') return runNative(lang, code, opts);
    return execute(code, { ...opts, files });
  }
  // Pull a dataset from a URL through the server proxy (avoids CORS) and
  // return { name, bytes } ready to mount into any language's run.
  async function fetchDataset(url) {
    const r = await fetch('/api/fetch-dataset?url=' + encodeURIComponent(url), { credentials: 'same-origin' });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || 'Could not fetch that URL.');
    }
    const name = r.headers.get('X-Dataset-Name') || (url.split('/').pop() || 'dataset.csv').split('?')[0];
    return { name, bytes: await r.arrayBuffer() };
  }

  window.EchoTerm = { mount };
  window.EchoRun = { execute, executeAny, fetchDataset, cancel, isRunning: () => busy, wireEditor };
  window.EchoWeb = { preview: webPreview };
})();
