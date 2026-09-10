'use strict';
const base=require('../qa-audit/browser-lib.cjs');
module.exports={...base,async login(ctx,role){const r=await ctx.request.post(base.BASE+'/api/auth/login',{data:{login:role+'@qa.invalid',password:'LocalQa!2026'}});if(!r.ok())throw new Error('Login '+role+': '+r.status());}};
