'use strict';
/* EchoLens tilt - lightweight pointer-driven 3D tilt for cards.
   Applies to .course-card, .stat-card, .prism-card and .path-card. Skips
   touch devices and reduced-motion users; costs nothing when idle. */
(function () {
  if (window.matchMedia && (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.matchMedia('(hover: none)').matches)) return;
  const SEL = '.course-card, .stat-card, .prism-card, .path-card';
  const MAX = 5; // degrees
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest && e.target.closest(SEL);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateX(${(-y * MAX).toFixed(2)}deg) rotateY(${(x * MAX).toFixed(2)}deg) translateZ(6px)`;
    el.classList.add('tilt');
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    const el = e.target.closest && e.target.closest(SEL);
    if (el && !el.contains(e.relatedTarget)) el.style.transform = '';
  }, { passive: true });
})();
