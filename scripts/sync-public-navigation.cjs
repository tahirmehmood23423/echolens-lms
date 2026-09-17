'use strict';
// Regenerate checked-in static headers from the server page's shared definition.
const fs = require('node:fs'), path = require('node:path');
const {render} = require('../public-navigation');
const pages = ['landing','open','compiler','login','reset-password','registration-status','privacy','recruiter-signup','showcase','showcase-post','talent-search','talent-profile','talent-project','talent-projects','talent-interest','profile'];
for (const page of pages) {
  const file = path.join(__dirname,'../public',page+'.html');
  let html = fs.readFileSync(file,'utf8');
  const auth = ['open','compiler'].includes(page) ? '<span id="userBox"></span>' : '';
  html = html.replace(/<nav class="open-nav public-navigation"[^>]*>[\s\S]*?<\/nav>/,render(auth));
  fs.writeFileSync(file,html);
}
