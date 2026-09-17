(() => {
  const nav = document.querySelector('.public-navigation');
  if (!nav) return;
  function update() {
    const page = location.pathname.split('/').filter(Boolean).filter(part => part !== 'demo');
    const route = location.hash.slice(1).split('?')[0];
    nav.querySelectorAll('.nlink').forEach(link => {
      const url = new URL(link.href,location.href);
      const active = url.pathname === location.pathname && url.hash === location.hash ||
        page[0] === 'open' && link.dataset.tab === (route.startsWith('course/') ? '' : route || 'home') ||
        page[0] === 'courses' && link.dataset.catnav === 'paid';
      link.classList.toggle('active',Boolean(active));
      if (active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    });
    nav.querySelectorAll('[data-public-login]').forEach(link => {
      const target = new URL(link.href,location.href);
      if (target.pathname.split('/').at(-1) === 'login' && !['login','reset-password'].includes(page[0])) link.href = target.pathname + '?returnTo=' + encodeURIComponent(location.pathname + location.search + location.hash);
    });
  }
  update(); window.addEventListener('popstate',update); window.addEventListener('hashchange',update);
})();
