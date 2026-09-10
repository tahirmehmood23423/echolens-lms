'use strict';
function createGradingWorker({attempts,persist,enabled,grade,onComplete,timeoutMs=45000,log=console.error}) {
  let busy=false,timer;
  async function tick(){
    if(busy)return;busy=true;
    try{
      const next=attempts.due();if(!next)return;
      if(!enabled()){attempts.fail(next.id,'Grading is unavailable. Your attempt is saved. Retry when the service returns or ask staff to review it.');await persist();return;}
      const a=attempts.start(next.id);if(!a)return;
      await persist(); // Work must be durable before calling the provider.
      let timeout;
      try{
        const result=await Promise.race([grade(a),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Grading timed out')),timeoutMs);})]);
        attempts.complete(a.id,result.score,result.feedback);
        await onComplete(a);await persist();
      }catch(e){log('Grading attempt '+a.id+': '+e.message);attempts.fail(a.id,'Grading could not finish. Your saved attempt will retry up to three times.',true);await persist();}
      finally{clearTimeout(timeout);}
    }catch(e){log('Grading queue: '+e.message);}finally{busy=false;}
  }
  return {tick,start(){attempts.recover();timer=setInterval(tick,2000);timer.unref();void tick();},stop(){clearInterval(timer);}};
}
module.exports={createGradingWorker};
