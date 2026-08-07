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

  /* ------------------------------ the worker ------------------------------
   * workerMain is stringified via toString() below and run standalone inside
   * the Worker (see makeWorker()) - it cannot see any variable declared
   * outside itself, so everything it needs, including MICROPIP_FALLBACK,
   * must be declared inside this function.
   */
  function workerMain() {
    let bootPromise = null;
    const dec = new TextDecoder();
    // Python calls this the moment a figure is finished (plt.show(), or the
    // end of the run) so plots appear in the terminal in the order the
    // program drew them instead of all at once at the very end.
    self.echoEmitFigure = function (b64) { postMessage({ type: 'image', b64: String(b64) }); };
    // numpy, pandas, matplotlib and scikit-learn all ship inside Pyodide's
    // own package index, so loadPackagesFromImports() (below) finds them
    // straight away. A few other pure-Python packages assignments commonly
    // need (seaborn especially) are NOT in that index - install those from
    // PyPI with micropip instead, exactly like `pip install` would on a
    // laptop.
    const MICROPIP_FALLBACK = { seaborn: 'seaborn' };
    /* ---------------------- the Python-side runtime (v21) ----------------------
     * Two things every data-science lesson needs, installed into the
     * interpreter before the student's code runs:
     *
     * 1. Working downloads. Pyodide's Python has no sockets, so the stdlib
     *    urlopen() dies with "unknown url type: https" - which is what
     *    sns.load_dataset("tips") and pd.read_csv("https://...") hit. We
     *    reimplement urlopen()/urlretrieve() on top of a synchronous
     *    XMLHttpRequest (legal inside a Worker), trying the URL directly
     *    first and falling back to the server's /api/fetch-dataset proxy
     *    when the host refuses cross-origin browser requests (CORS).
     *
     * 2. Honest plt.show(). Under the AGG backend show() does nothing, so a
     *    script with two plots drew both onto the SAME axes and produced one
     *    muddled image. Here show() renders the open figures, streams them
     *    to the terminal and closes them - so plot #2 starts on a clean
     *    canvas, exactly like on a laptop.
     */
    const PY_RUNTIME = [
      'import io as _eio, os as _eos, sys as _esys, base64 as _eb64, email.message as _emsg',
      'import urllib.request as _ereq, urllib.error as _eerr',
      'from urllib.parse import quote as _equote',
      'import js as _ejs',
      '',
      '_ECHO_PROXY = (_ECHO_ORIGIN + "/api/fetch-dataset?url=") if _ECHO_ORIGIN else ""',
      '',
      'class _EchoResponse(_eio.BytesIO):',
      '    """What urlopen() hands back: a file-like object that also answers the',
      '    handful of attributes pandas and seaborn read off a real response."""',
      '    def __init__(self, payload, url, ctype):',
      '        _eio.BytesIO.__init__(self, payload)',
      '        self.url = url; self.status = 200; self.code = 200; self.reason = "OK"',
      '        self.headers = _emsg.Message()',
      '        self.headers["Content-Type"] = ctype or "application/octet-stream"',
      '    def info(self): return self.headers',
      '    def geturl(self): return self.url',
      '    def getcode(self): return self.status',
      '    def __enter__(self): return self',
      '    def __exit__(self, *a): self.close(); return False',
      '',
      'def _echo_download(target):',
      '    xhr = _ejs.XMLHttpRequest.new()',
      '    xhr.open("GET", target, False)',
      '    binary = True',
      '    try:',
      '        xhr.responseType = "arraybuffer"',
      '    except Exception:',
      '        binary = False',
      '        xhr.overrideMimeType("text/plain; charset=x-user-defined")',
      '    xhr.send(None)',
      '    code = int(xhr.status)',
      '    if code < 200 or code >= 300:',
      '        raise _eerr.HTTPError(target, code, "HTTP " + str(code), None, None)',
      '    ctype = xhr.getResponseHeader("Content-Type") or ""',
      '    if binary and xhr.response is not None:',
      '        payload = bytes(_ejs.Uint8Array.new(xhr.response).to_py())',
      '    else:',
      '        payload = bytes((ord(ch) & 0xFF) for ch in str(xhr.responseText))',
      '    return payload, ctype',
      '',
      '_echo_real_urlopen = _ereq.urlopen',
      '_echo_real_urlretrieve = _ereq.urlretrieve',
      '',
      'def _echo_urlopen(url, data=None, timeout=None, *args, **kwargs):',
      '    target = url.full_url if hasattr(url, "full_url") else str(url)',
      '    if data is not None or not target.lower().startswith(("http://", "https://")):',
      '        return _echo_real_urlopen(url, data, *args, **kwargs)',
      '    routes = [target]',
      '    if _ECHO_PROXY: routes.append(_ECHO_PROXY + _equote(target, safe=""))',
      '    last = None',
      '    for route in routes:',
      '        try:',
      '            payload, ctype = _echo_download(route)',
      '            return _EchoResponse(payload, target, ctype)',
      '        except Exception as exc:',
      '            last = exc',
      '    if isinstance(last, _eerr.HTTPError): raise last',
      '    raise _eerr.URLError(',
      '        "could not download " + target + " (" + str(last) + "). The site may block browser '
        + 'downloads, or you may be offline - attach the file to this task or upload it instead.")',
      '',
      'def _echo_urlretrieve(url, filename=None, reporthook=None, data=None):',
      '    resp = _echo_urlopen(url, data)',
      '    payload = resp.read()',
      '    if filename is None:',
      '        import tempfile as _etmp',
      '        fd, filename = _etmp.mkstemp()',
      '        _eos.close(fd)',
      '    with open(filename, "wb") as fh: fh.write(payload)',
      '    if reporthook is not None:',
      '        try: reporthook(1, len(payload), len(payload))',
      '        except Exception: pass',
      '    return filename, resp.headers',
      '',
      '_ereq.urlopen = _echo_urlopen',
      '_ereq.urlretrieve = _echo_urlretrieve',
      '# Modules imported before this patch kept their own reference (they did',
      '# "from urllib.request import urlopen") - repoint those too.',
      'for _mod in list(_esys.modules.values()):',
      '    try:',
      '        if getattr(_mod, "urlopen", None) is _echo_real_urlopen: _mod.urlopen = _echo_urlopen',
      '        if getattr(_mod, "urlretrieve", None) is _echo_real_urlretrieve: _mod.urlretrieve = _echo_urlretrieve',
      '    except Exception: pass',
      '',
      'def _echo_flush_figures():',
      '    """Render every open matplotlib figure, stream it to the terminal and',
      '    close it. Called by plt.show() and once more when the program ends."""',
      '    if "matplotlib" not in _esys.modules: return',
      '    try:',
      '        import matplotlib.pyplot as _eplt',
      '    except Exception:',
      '        return',
      '    for num in _eplt.get_fignums():',
      '        fig = _eplt.figure(num)',
      '        if not fig.get_axes(): continue',
      '        buf = _eio.BytesIO()',
      '        try:',
      '            fig.savefig(buf, format="png", dpi=120, bbox_inches="tight", facecolor=fig.get_facecolor())',
      '        except Exception:',
      '            continue',
      '        _ejs.echoEmitFigure(_eb64.b64encode(buf.getvalue()).decode())',
      '    _eplt.close("all")',
      '',
      'def _echo_install_plot_hook():',
      '    try:',
      '        import matplotlib',
      '        matplotlib.use("AGG", force=True)',
      '        import matplotlib.pyplot as _eplt',
      '    except Exception:',
      '        return',
      '    if getattr(_eplt.show, "_echolens", False): return',
      '    def show(*args, **kwargs):',
      '        _echo_flush_figures()',
      '    show._echolens = True',
      '    _eplt.show = show',
    ].join('\n');
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
        // Fill in the gap above for packages Pyodide doesn't index itself
        // (seaborn, ...): pull them straight from PyPI with micropip before
        // the student's code - which imports them - ever runs.
        const neededFallbacks = Object.keys(MICROPIP_FALLBACK).filter((name) => new RegExp('(^|\\n)\\s*(import\\s+' + name + '\\b|from\\s+' + name + '\\b)').test(m.code));
        if (neededFallbacks.length) {
          try {
            postMessage({ type: 'status', text: 'Installing ' + neededFallbacks.join(', ') + '...' });
            await py.loadPackage('micropip');
            const micropip = py.pyimport('micropip');
            await micropip.install(neededFallbacks.map((n) => MICROPIP_FALLBACK[n]));
          } catch (mpErr) { /* falls through to a normal ModuleNotFoundError in Python */ }
        }
        // Headless matplotlib inside the worker. Library DeprecationWarnings
        // (e.g. pandas' pyarrow notice) are about future library versions,
        // not the student's code - silence them so they don't look like
        // errors in the terminal. sys.path gets the working directory so
        // sibling .py files (other tabs in a multi-file project) are
        // importable, exactly like separate files on a real machine.
        await py.runPythonAsync('import os as _os\n_os.environ.setdefault("MPLBACKEND","AGG")\nimport warnings as _warnings\n_warnings.filterwarnings("ignore", category=DeprecationWarning)\n_warnings.filterwarnings("ignore", category=PendingDeprecationWarning)\nimport sys as _sys\nif "/home/pyodide" not in _sys.path: _sys.path.insert(0, "/home/pyodide")');
        // Downloads + live figures (see PY_RUNTIME). The origin comes from the
        // page because a Worker created from a blob: URL cannot resolve the
        // "/api/..." shorthand on its own.
        try {
          py.globals.set('_ECHO_ORIGIN', String(m.origin || ''));
          await py.runPythonAsync(PY_RUNTIME);
          // Patching plt.show() means importing pyplot, which is not free -
          // only do it for code that actually plots.
          if (/matplotlib|seaborn|pyplot|\bplt\b|\bsns\b/.test(m.code)) {
            await py.runPythonAsync('_echo_install_plot_hook()');
          }
        } catch (rtErr) { /* the run still works, just without these extras */ }
        postMessage({ type: 'status', text: 'Running...' });
        try {
          await py.runPythonAsync(m.code);
        } finally {
          // Figures the student never passed to plt.show() (and anything drawn
          // before an error) still belong on screen.
          try { await py.runPythonAsync('_echo_flush_figures()'); } catch (figErr) {}
        }
        postMessage({ type: 'done', ok: true, images: [] });
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

  /* ------------------------------ figure viewer ------------------------------
   * A plot is worth looking at properly: click any figure to blow it up to
   * full screen, Esc or a click anywhere closes it.
   */
  function openLightbox(src, name) {
    const box = document.createElement('div');
    box.className = 'fig-lightbox';
    box.innerHTML = `<img src="${src}" alt="${name}"><a class="fig-lb-dl" href="${src}" download="${name}">Download PNG</a><button class="fig-lb-x" aria-label="Close">&times;</button>`;
    const close = () => { box.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    box.addEventListener('click', (e) => { if (!e.target.closest('.fig-lb-dl')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(box);
  }
  function downloadDataUrl(src, name) {
    const a = document.createElement('a');
    a.href = src; a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* --------------------------- terminal component --------------------------- */
  // EchoTerm.mount(el) -> { clear, print, askInput, showImages, focus }
  function mount(el) {
    el.classList.add('term');
    el.innerHTML = `
      <div class="term-body">
        <pre class="term-out"></pre>
        <div class="term-in-row" style="display:none"><span class="term-caret">&#8250;</span><input class="term-in" autocomplete="off" spellcheck="false" placeholder="type your answer and press Enter"></div>
        <div class="term-figbar" style="display:none"><span class="term-figbar-label"></span><button type="button" class="term-fig-btn term-dl-all">Download all</button></div>
        <div class="term-imgs"></div>
      </div>`;
    const out = el.querySelector('.term-out');
    const row = el.querySelector('.term-in-row');
    const inp = el.querySelector('.term-in');
    const imgs = el.querySelector('.term-imgs');
    const figbar = el.querySelector('.term-figbar');
    const figbarLabel = el.querySelector('.term-figbar-label');
    const body = el.querySelector('.term-body');
    let figCount = 0;
    // Browsers throttle rapid programmatic downloads - space them out a touch.
    el.querySelector('.term-dl-all').addEventListener('click', () => {
      const all = Array.from(imgs.querySelectorAll('img.term-img'));
      all.forEach((im, i) => setTimeout(() => downloadDataUrl(im.src, `figure-${i + 1}.png`), i * 350));
    });
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
      clear() {
        out.textContent = ''; imgs.innerHTML = ''; row.style.display = 'none';
        figCount = 0; figbar.style.display = 'none'; el.classList.remove('has-figs');
        if (pendingResolve) { const r = pendingResolve; pendingResolve = null; r(null); }
      },
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
      // Each figure gets its own card with a Download PNG button, and the
      // whole set gets a "Download all" once there is more than one.
      showImages(list) {
        for (const b64 of list || []) {
          const src = 'data:image/png;base64,' + b64;
          const name = `figure-${++figCount}.png`;
          const fig = document.createElement('figure');
          fig.className = 'term-fig';
          const im = document.createElement('img');
          im.className = 'term-img';
          im.src = src;
          im.alt = 'Figure ' + figCount;
          im.title = 'Click to view full size';
          im.addEventListener('click', () => openLightbox(src, name));
          const bar = document.createElement('figcaption');
          bar.className = 'term-fig-bar';
          const label = document.createElement('span');
          label.className = 'term-fig-name';
          label.textContent = 'Figure ' + figCount;
          const dl = document.createElement('button');
          dl.type = 'button';
          dl.className = 'term-fig-btn';
          dl.textContent = 'Download PNG';
          dl.addEventListener('click', () => downloadDataUrl(src, name));
          bar.appendChild(label);
          bar.appendChild(dl);
          fig.appendChild(im);
          fig.appendChild(bar);
          imgs.appendChild(fig);
        }
        if (figCount) {
          el.classList.add('has-figs');
          figbarLabel.textContent = figCount === 1 ? '1 figure' : figCount + ' figures';
          figbar.style.display = figCount > 1 ? 'flex' : 'none';
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
    let figuresShown = 0;  // same idea for plots: a re-run redraws them all
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

        let skip = streamPrinted;      // suppress replayed output on re-runs
        let skipFigs = figuresShown;   // ...and replayed figures
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
            if (m.type === 'image') {
              if (skipFigs > 0) { skipFigs--; return; }
              figuresShown++;
              term.showImages([m.b64]);
              return;
            }
            if (m.type === 'need_input') { clearInterval(tick); worker.removeEventListener('message', onMsg); resolve({ kind: 'need_input' }); }
            if (m.type === 'done') { clearInterval(tick); worker.removeEventListener('message', onMsg); resolve({ kind: 'done', ok: m.ok, images: m.images }); }
          };
          worker.addEventListener('message', onMsg);
          worker.postMessage({ type: 'run', code: String(code), stdin: stdinLines.slice(), url: PYODIDE_URL, files: fileBytes, origin: location.origin });
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
  // after a line ending in ':'), so Python editing feels natural. Every wired
  // editor also gets a synced line-number gutter, like a real code editor.
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
    addLineGutter(box);
  }
  function addLineGutter(box) {
    if (box.dataset.gutterWired) return;
    box.dataset.gutterWired = '1';
    const wrap = document.createElement('div');
    wrap.className = 'editor-wrap' + (box.classList.contains('ide-editor') ? ' ide' : '');
    box.parentNode.insertBefore(wrap, box);
    const gutter = document.createElement('div');
    gutter.className = 'editor-gutter';
    wrap.appendChild(gutter);
    wrap.appendChild(box);
    const render = () => {
      const n = box.value.split('\n').length;
      let s = '';
      for (let i = 1; i <= n; i++) s += i + '\n';
      gutter.textContent = s;
    };
    box.addEventListener('input', render);
    box.addEventListener('scroll', () => { gutter.scrollTop = box.scrollTop; });
    render();
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

  /* ============================== v19: C / C++ / Java ==============================
   * Compiled and run through Compiler Explorer's public execution API
   * (godbolt.org) - real gcc/g++/OpenJDK, stdin supported, nothing installed
   * on the EchoLens server. This replaced the emkc.org Piston API, which
   * went whitelist-only (HTTP 401 on every request) and can no longer serve
   * anonymous traffic; Compiler Explorer is free, keyless and built to
   * absorb heavy public load. A couple of automatic retries smooth over the
   * rare transient network blip so students don't have to click Run twice.
   */
  const CE_URL = 'https://godbolt.org/api/compiler';
  const CE_LANG = {
    c: { id: 'cg132', lang: 'c', label: 'gcc 13.2' },
    cpp: { id: 'g132', lang: 'c++', label: 'gcc 13.2' },
    java: { id: 'java2102', lang: 'java', label: 'OpenJDK 21' },
  };
  const ANSI_RE = /\x1b\[[0-9;]*[a-zA-Z]/g; // strip terminal colour codes from CE's diagnostics
  function ceText(lines) { return (lines || []).map((l) => String(l.text || '').replace(ANSI_RE, '')).join('\n'); }
  async function ceCompile(compilerId, body, tries) {
    let lastErr;
    for (let i = 0; i < (tries || 2); i++) {
      try {
        const r = await fetch(CE_URL + '/' + compilerId + '/compile', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) throw new Error('The compile service answered ' + r.status + ' - try again in a minute.');
        return await r.json();
      } catch (e) { lastErr = e; if (i < tries - 1) await new Promise((res) => setTimeout(res, 1200)); }
    }
    throw lastErr;
  }
  async function runNative(lang, code, { term, onStatus, extraFiles }) {
    const status = (t) => { try { onStatus && onStatus(t); } catch {} };
    const cfg = CE_LANG[lang];
    // If the program reads input, collect it up-front (compiled programs run
    // remotely, so input is provided as stdin lines before the run).
    let stdin = '';
    if (/\b(scanf|cin\s*>>|getline|gets|fgets|getchar|Scanner|nextInt|nextLine|nextDouble)\b/.test(code)) {
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
    status(lang === 'c' ? 'Compiling & running C (gcc)...' : lang === 'java' ? 'Compiling & running Java (OpenJDK)...' : 'Compiling & running C++ (g++)...');
    // Sibling files (other tabs in the same project) ride along by being
    // concatenated ahead of the active file - Compiler Explorer's execute
    // endpoint compiles a single translation unit, so this is a best-effort
    // stand-in for the real multi-file compile a native toolchain would do.
    const siblingSrc = (extraFiles || []).map((f) => `// ---- ${f.name} ----\n${f.content}`).join('\n\n');
    let source = siblingSrc ? `${siblingSrc}\n\n// ---- main ----\n${code}` : String(code);
    // Compiler Explorer always compiles as a fixed filename, so a top-level
    // `public class Main` (Piston's old convention, still what students type)
    // would fail the "public class must match filename" check - strip the
    // public modifier transparently, the student's own code is untouched.
    if (lang === 'java') source = source.replace(/\bpublic(\s+)class\b/, 'class');
    try {
      const d = await ceCompile(cfg.id, {
        source,
        options: { userArguments: '', filters: { execute: true }, executeParameters: { args: [], stdin } },
        lang: cfg.lang,
      }, 2);
      if (d.code !== 0 && !d.execResult) {
        // Compile failed - CE's own diagnostics are on the top-level stderr array.
        const msg = ceText(d.stderr) || ceText((d.buildResult || {}).stderr) || 'Compilation failed.';
        term.print(msg + '\n');
        status('Compilation failed - read the errors above.');
        return { ok: false };
      }
      const ex = d.execResult || {};
      const out = ceText(ex.stdout);
      const err = ceText(ex.stderr);
      if (out) term.print(out.endsWith('\n') ? out : out + '\n');
      if (err) term.print(err.endsWith('\n') ? err : err + '\n');
      if (ex.timedOut) term.print('\n[Stopped: the program ran too long. Check for infinite loops.]\n');
      status(ex.code === 0 ? 'Done.' : 'Finished with exit code ' + ex.code + '.');
      return { ok: ex.code === 0 };
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
    if (lang === 'c' || lang === 'cpp' || lang === 'java') return runNative(lang, code, opts);
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
