'use strict';
// Run after changing public-footer.js; static HTML and server pages share it.
const fs = require('node:fs'), path = require('node:path');
const { render } = require('../public-footer');
const pages = ['landing', 'open', 'compiler', 'login', 'reset-password', 'registration-status', 'privacy', 'recruiter-signup', 'showcase', 'showcase-post', 'talent-search', 'talent-profile', 'talent-project', 'talent-projects', 'talent-interest', 'profile'];
for (const page of pages) {
  const file = path.join(__dirname, '../public', page + '.html');
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('/css/public-footer.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/css/public-footer.css?v1">\n</head>');
  const old = /<footer\b[^>]*>[\s\S]*?<\/footer>/;
  if (old.test(html)) html = html.replace(old, render());
  else html = html.replace('</body>', render() + '\n</body>');
  fs.writeFileSync(file, html);
}
// /privacy.html remains a working legacy destination with the complete policy.
fs.writeFileSync(path.join(__dirname, '../public/privacy.html'), require('../legal-pages').render('/privacy-policy'));
