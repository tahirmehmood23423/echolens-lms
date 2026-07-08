'use strict';

/**
 * EchoLens login3d - live 3D gem field behind the sign-in card.
 * A dozen faceted gems drift in deep space with pointer parallax and fog.
 * Falls back to the plain gradient if WebGL is missing; honors reduced motion.
 */

(function () {
  if (typeof THREE === 'undefined') return;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const test = document.createElement('canvas');
    if (!(test.getContext('webgl') || test.getContext('experimental-webgl'))) return;
  } catch { return; }

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '0', pointerEvents: 'none' });
  document.body.prepend(canvas);
  const wrap = document.querySelector('.auth-wrap');
  if (wrap) { wrap.style.position = 'relative'; wrap.style.zIndex = '1'; }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b1530, 6, 17);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 40);
  camera.position.z = 9;

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(3, 4, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0x38bdf8, 0.55); rim.position.set(-3, -2, -2); scene.add(rim);

  const COLORS = ['#0FBFA8', '#38BDF8', '#7C6CF5', '#14B8A6', '#8B5CF6', '#F0A82A'];
  function gemMesh(colorHex) {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(colorHex), flatShading: true, shininess: 110, specular: 0xffffff,
      emissive: new THREE.Color(colorHex).multiplyScalar(0.12),
    });
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1, 0.55, 8, 1), mat); crown.position.y = 0.275;
    const pav = new THREE.Mesh(new THREE.ConeGeometry(1, 1.15, 8, 1), mat); pav.rotation.x = Math.PI; pav.position.y = -0.575;
    g.add(crown, pav);
    return g;
  }

  const gems = [];
  for (let i = 0; i < 12; i++) {
    const g = gemMesh(COLORS[i % COLORS.length]);
    const s = 0.25 + Math.random() * 0.55;
    g.scale.setScalar(s);
    g.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, -2 - Math.random() * 9);
    g.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * 0.6);
    g.userData = {
      spinY: 0.002 + Math.random() * 0.006, spinX: (Math.random() - 0.5) * 0.003,
      floatSpeed: 0.3 + Math.random() * 0.5, floatAmp: 0.15 + Math.random() * 0.3,
      baseY: g.position.y, phase: Math.random() * Math.PI * 2, depth: g.position.z,
    };
    scene.add(g); gems.push(g);
  }

  let px = 0, py = 0;
  window.addEventListener('pointermove', (e) => {
    px = (e.clientX / window.innerWidth) * 2 - 1;
    py = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  let t = 0;
  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden) return;
    t += 0.016;
    for (const g of gems) {
      g.rotation.y += g.userData.spinY;
      g.rotation.x += g.userData.spinX;
      g.position.y = g.userData.baseY + Math.sin(t * g.userData.floatSpeed + g.userData.phase) * g.userData.floatAmp;
    }
    // camera parallax: nearer gems shift more, giving true depth
    camera.position.x += ((px * 0.7) - camera.position.x) * 0.03;
    camera.position.y += ((-py * 0.45) - camera.position.y) * 0.03;
    camera.lookAt(0, 0, -4);
    renderer.render(scene, camera);
  }
  if (reduceMotion) { renderer.render(scene, camera); } else tick();
})();
