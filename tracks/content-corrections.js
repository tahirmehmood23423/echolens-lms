'use strict';
// Narrow corrections verified during the QA implementation. The original
// inventory and review evidence remain in qa-implementation/.
module.exports=function applyContentCorrections(track){
  if(track.key==='cs105-javascript'){
    const refs={5:['MDN: JavaScript template literals','https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals'],6:['MDN: JavaScript loops and iteration','https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration']};
    for(const l of track.levels)if(refs[l.no])for(const p of l.problems)p.refs=[...(p.refs||[]),refs[l.no]];
  }
  if(track.key==='js-advanced'){
    const lesson=track.levels.find(l=>l.no===12);
    if(lesson){
      lesson.video_url=null;
      lesson.resource_url='https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function*';
      lesson.resource_note='Read the JavaScript async-generator guide. A replacement video is awaiting review; the previous video taught Python.';
      for(const p of lesson.problems)p.refs=[...(p.refs||[]),['MDN: JavaScript async generators',lesson.resource_url]];
    }
  }
};
