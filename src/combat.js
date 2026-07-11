export const RULES={attackCost:24,rollCost:30,attackDamage:34,enemyDamage:28};
export const spend=(a,n)=>a.stamina>=n?(a.stamina-=n,true):false;
export const damage=(a,n,invincible=false)=>invincible?false:(a.hp=Math.max(0,a.hp-n),true);
export const regen=(a,dt,blocked=false)=>{if(!blocked)a.stamina=Math.min(a.maxStamina,a.stamina+34*dt)};
