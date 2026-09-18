'use strict';
// Shared public footer: existing Home destinations plus discoverable legal pages.
const groups = [
  ['Courses', [['Live Tech Courses & Bootcamps', '/courses'], ['Free Certified Courses', '/open#free'], ['All Courses', '/courses']]],
  ['Learn Free', [['Free Online Courses', '/open#free'], ['Browser Compiler', '/compiler'], ['Hackathons & Webinars', '/open#events'], ['Verify a Certificate', '/cert']]],
  ['Community', [['Announcements', '/open#announcements'], ['Feedback', '/open#feedback'], ['Open Portal', '/open'], ['Student Login', '/login'], ['Enroll in a Course', '/open#register'], ['Student Projects', '/talent/projects'], ['For Recruiters', '/recruiter-signup']]],
  ['Company & Legal', [['About EchoLens', '/about'], ['Contact & Support', '/contact'], ['Privacy Policy', '/privacy-policy'], ['Terms of Use', '/terms'], ['Cookie Policy', '/cookie-policy']]],
];
const escape = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
function render() {
  return `<footer class="public-footer" aria-label="Site footer">
  <div class="foot-in">
    <div class="foot-brand">
      <a class="brand" href="/"><img src="/img/logo.png" alt="EchoLens Digital logo"><span>EchoLens<small>Digital</small></span></a>
      <p>Empowering the next generation of AI engineers and tech leaders in Pakistan and beyond.</p>
      <a href="mailto:info@echolens.digital">info@echolens.digital</a>
      <a href="https://wa.me/923141479109" target="_blank" rel="noopener">WhatsApp: 0314 1479109</a>
    </div>
    ${groups.map(([label, links]) => `<div class="foot-col"><h5>${label}</h5>${links.map(([text, href]) => `<a href="${escape(href)}"${href === '/login' ? ' data-public-login' : ''}>${escape(text)}</a>`).join('')}</div>`).join('\n    ')}
  </div>
  <div class="foot-bottom"><div class="foot-bottom-in"><span>&copy; ${new Date().getFullYear()} EchoLens Digital. All rights reserved.</span><a href="/privacy">Privacy</a><span>EchoLens (SMC-Private) Limited</span><span>Made with &#9829; in Pakistan</span></div></div>
</footer>`;
}
module.exports = { groups, render };
