'use strict';

/**
 * EchoLens gem3d - real-time 3D gemstones (Three.js / WebGL)
 *
 * Drop-in: finds every `.prism-gem` and `.pub-gem` SVG the dashboard renders
 * and replaces it with a live, faceted, rotating 3D gem in the stage's color.
 * Zero changes needed in dashboard.js - a MutationObserver catches every
 * re-render.
 *
 * Built-in care:
 *  - Falls back silently to the existing SVG if WebGL is unavailable.
 *  - Respects prefers-reduced-motion (renders one still frame, no animation).
 *  - Pauses when the tab is hidden; disposes contexts when gems leave the DOM
 *    (browsers cap WebGL contexts, so this matters on long sessions).
 *  - Caps device pixel ratio at 2 to stay light on low-end phones.
 */

(function () {
  if (typeof THREE === 'undefined') return; // Three.js failed to load: SVGs stay.

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function webglOK() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch { return false; }
  }
  if (!webglOK()) return;

  /* ------------------------- gem geometry (brilliant cut) ------------------------- */
  // Crown (flat table on top, sloping facets) + pavilion (cone to a point below).
  function buildGem(color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({
      color, flatShading: true, shininess: 100,
      specular: 0xffffff, emissive: new THREE.Color(color).multiplyScalar(0.14),
    });
    const rimMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.35),
      flatShading: true, shininess: 130, specular: 0xffffff,
    });

    const SEGMENTS = 8; // 8 facets reads as a classic cut gem
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 1.0, 0.55, SEGMENTS, 1), mat);
    crown.position.y = 0.275;
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.06, SEGMENTS, 1), rimMat);
    table.position.y = 0.58;
    const pavilion = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.15, SEGMENTS, 1), mat);
    pavilion.rotation.x = Math.PI; // point downward
    pavilion.position.y = -0.575;

    group.add(crown, table, pavilion);
    group.rotation.z = 0.14; // slight tilt so facets catch the light
    return group;
  }

  /* ------------------------------- scene per gem ------------------------------- */
  const instances = new Set();
  let pointerX = 0, pointerY = 0;
  window.addEventListener('pointermove', (e) => {
    pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    pointerY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function mountGem(el, colorHex, size) {
    const canvas = document.createElement('canvas');
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.className = el.className; // keep .prism-gem / .pub-gem layout styles
    canvas.setAttribute('aria-hidden', 'true');

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    camera.position.set(0, 0.15, 4.1);

    scene.add(new THREE.AmbientLight(0xffffff, 0.62));
    const key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(2.4, 3, 2.2); scene.add(key);
    const rim = new THREE.DirectionalLight(0x8fd8ff, 0.5); rim.position.set(-2.6, -1.2, -1.6); scene.add(rim);
    const glint = new THREE.PointLight(0xffffff, 0.55, 12); glint.position.set(-1.4, 2.2, 2.6); scene.add(glint);

    const gem = buildGem(new THREE.Color(colorHex));
    scene.add(gem);

    const inst = {
      canvas, renderer, scene, camera, gem,
      t: Math.random() * Math.PI * 2, visible: true, alive: true,
    };
    const io = new IntersectionObserver((entries) => { inst.visible = entries[0].isIntersecting; });
    io.observe(canvas);
    inst.io = io;
    instances.add(inst);

    el.replaceWith(canvas);
    if (reduceMotion) { renderer.render(scene, camera); } // one crisp still frame
    return inst;
  }

  /* ------------------------------- animation loop ------------------------------- */
  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden || reduceMotion) return;
    for (const inst of instances) {
      if (!inst.alive) continue;
      if (!inst.canvas.isConnected) { dispose(inst); continue; }
      if (!inst.visible) continue;
      inst.t += 0.016;
      inst.gem.rotation.y += 0.008;
      inst.gem.position.y = Math.sin(inst.t * 0.9) * 0.07;                       // gentle float
      inst.gem.rotation.x += ((pointerY * 0.22) - inst.gem.rotation.x) * 0.05;   // pointer parallax
      inst.gem.rotation.z += ((0.14 + pointerX * 0.18) - inst.gem.rotation.z) * 0.05;
      inst.renderer.render(inst.scene, inst.camera);
    }
  }
  function dispose(inst) {
    inst.alive = false;
    instances.delete(inst);
    try {
      inst.io.disconnect();
      inst.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      inst.renderer.dispose();
      inst.renderer.forceContextLoss && inst.renderer.forceContextLoss();
    } catch {}
  }

  /* ----------------------- find gems the dashboard renders ----------------------- */
  function svgColor(svg) {
    const poly = svg.querySelector('polygon');
    return (poly && poly.getAttribute('fill')) || '#0FBFA8';
  }
  function upgradeAll(root) {
    (root.querySelectorAll ? root.querySelectorAll('svg.prism-gem, svg.pub-gem') : []).forEach((svg) => {
      const size = svg.classList.contains('pub-gem') ? 78 : 96;
      mountGem(svg, svgColor(svg), size);
    });
  }
  upgradeAll(document);
  new MutationObserver((muts) => {
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.nodeType !== 1) continue;
      if (n.matches && n.matches('svg.prism-gem, svg.pub-gem')) upgradeAll(n.parentNode);
      else if (n.querySelectorAll) upgradeAll(n);
    }
  }).observe(document.body, { childList: true, subtree: true });

  tick();
})();
