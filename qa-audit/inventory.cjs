'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const files = ['server.js', 'coursepages.js', 'talent.js', 'talent-hiring.js', 'showcase.js'];
const routes = [];
for (const file of files) {
  fs.readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/).forEach((line, index) => {
    const m = line.match(/(app|router)\.(get|post|put|patch|delete|use)\(\s*(['"`])(.+?)\3(.*)/);
    if (m) routes.push({ file, line: index + 1, method: m[2].toUpperCase(), route: (m[1] === 'router' && file === 'showcase.js' ? '/api/showcase' : '') + m[4], handler: m[5].slice(0, 200) });
  });
}
const csv = rows => rows.map(row => row.map(v => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n');
fs.writeFileSync(path.join(__dirname, 'route-inventory.csv'), csv([['File', 'Line', 'Method', 'Route', 'Middleware / handler'], ...routes.map(r => [r.file, r.line, r.method, r.route, r.handler])]));
fs.writeFileSync(path.join(__dirname, 'route-inventory.json'), JSON.stringify(routes, null, 2));
const dashboard = fs.readFileSync(path.join(ROOT, 'public/dashboard.html'), 'utf8');
const views = [...dashboard.matchAll(/id="view-([^"]+)"/g)].map(m => m[1]);
fs.writeFileSync(path.join(__dirname, 'dashboard-views.json'), JSON.stringify(views, null, 2));
console.log(JSON.stringify({ routes: routes.length, pages: routes.filter(r => r.method === 'GET' && !r.route.startsWith('/api')).map(r => r.route), dashboardViews: views }, null, 2));
