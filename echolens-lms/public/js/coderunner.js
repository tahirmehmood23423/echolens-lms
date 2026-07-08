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
  async function execute(code, { term, onStatus }) {
    if (busy) throw new Error('A program is already running - stop it first.');
    busy = true;
    const status = (t) => { try { onStatus && onStatus(t); } catch {} };
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
          worker.postMessage({ type: 'run', code: String(code), stdin: stdinLines.slice(), url: PYODIDE_URL });
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

  window.EchoTerm = { mount };
  window.EchoRun = { execute, cancel, isRunning: () => busy, wireEditor };
})();
