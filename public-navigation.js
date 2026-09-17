'use strict';
// One public navigation definition for server pages and static page generation.
const links = [
  ['Home','/','home'],
  ['Live Tech Courses','/open#paid','courses','paid'],
  ['Free Certified Courses','/open#free','courses','free'],
  ['Events','/open#events','events'],
  ['Announcements','/open#announcements','announcements'],
  ['Feedback','/open#feedback','feedback'],
  ['Compiler','/compiler'],
  ['FAQ','/#faq'],
];
function render(auth = '') {
  return '<nav class="open-nav public-navigation" aria-label="Main navigation">' +
    '<a class="public-brand" href="/" aria-label="EchoLens Home"><img src="/img/logo.png" alt="EchoLens"><span>EchoLens<small>Digital</small></span></a>' +
    links.map(([label,href,tab,mode]) => '<a class="nlink" href="' + href + '"' + (tab ? ' data-tab="' + tab + '"' : '') + (mode ? ' data-catnav="' + mode + '"' : '') + '>' + label + '</a>').join('') +
    '<span class="public-nav-account">' + (auth || '<a class="btn btn-ghost btn-sm" id="signinBtn" data-public-login href="/login">Login</a><a class="btn btn-primary btn-sm" href="/open#signup">Get Started</a>') + '</span></nav>';
}
module.exports = {links,render};
