'use strict';
// Additive curated waves: prior manifests and repository defaults stay intact.
const waves=[require('./wave1/manifest.json'),require('./wave2/manifest.json')];
const ids=waves.flatMap(w=>w.courses);
if(new Set(ids).size!==ids.length)throw Error('A canonical learning package occurs in more than one curated wave.');
module.exports={waves,ids};
