export const HUNGER_RULES=Object.freeze({min:0,max:100,start:72,ratePerSecond:.18,warnAt:65});

export function updateHunger(actor,dt){
  actor.hunger=Math.min(HUNGER_RULES.max,Math.max(HUNGER_RULES.min,(Number.isFinite(actor.hunger)?actor.hunger:HUNGER_RULES.start)+HUNGER_RULES.ratePerSecond*dt));
  return actor.hunger;
}

export function drawHungerHud(ctx,value,now=performance.now()){
  const hunger=Math.min(100,Math.max(0,value)),danger=hunger>=HUNGER_RULES.warnAt;
  const beat=danger?Math.pow(Math.max(0,Math.sin(now/230)),8):0;
  ctx.save();ctx.translate(34,30+beat*2);ctx.scale(1+beat*.018,1+beat*.018);
  ctx.fillStyle=`rgba(20,16,12,${.82+beat*.1})`;ctx.strokeStyle=danger?`rgba(238,123,65,${.72+beat*.28})`:'#887256';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(0,0,252,52,8);ctx.fill();ctx.stroke();
  ctx.fillStyle=danger?'#f2a064':'#d8c6a5';ctx.font='bold 13px system-ui';ctx.textAlign='left';ctx.fillText(danger?'饥饿 · 腹中空空':'饥饿',16,20);
  ctx.fillStyle='#32271e';ctx.fillRect(16,30,218,8);
  const gradient=ctx.createLinearGradient(16,0,234,0);gradient.addColorStop(0,'#b17a3f');gradient.addColorStop(.66,'#d05e35');gradient.addColorStop(1,'#ef382d');ctx.fillStyle=gradient;ctx.fillRect(16,30,218*hunger/100,8);
  if(danger){const shine=(now/7)%250-30;ctx.fillStyle='rgba(255,224,168,.35)';ctx.fillRect(Math.max(16,shine),30,Math.min(18,234-Math.max(16,shine)),8)}
  ctx.fillStyle='#cdbda4';ctx.font='11px system-ui';ctx.textAlign='right';ctx.fillText(`${Math.round(hunger)}%`,234,20);ctx.restore();
}
