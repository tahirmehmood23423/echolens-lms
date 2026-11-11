'use strict';
// Select only accepted canonical packages; never widens a requested test batch.
function selectCourses(available,requested){
 if(!Array.isArray(available)||available.some(id=>!/^[-a-z0-9]+$/.test(id))||new Set(available).size!==available.length)throw Error('Invalid accepted browser-test inventory.');
 if(requested===undefined)return [...available];
 const ids=String(requested).split(',');
 if(!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!/^[-a-z0-9]+$/.test(id)||!available.includes(id)))throw Error('Browser test IDs must uniquely select accepted packages from the chosen wave.');
 return available.filter(id=>ids.includes(id));
}
module.exports={selectCourses};
