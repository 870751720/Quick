export const RULES={attackDamage:28,enemyDamage:18};
export const damage=(a,n,invincible=false)=>invincible?false:(a.hp=Math.max(0,a.hp-n),true);
export const xpNeeded=level=>20+level*10;
export const attackAtLevel=level=>28+(level-1)*4;
export function grantXp(actor,amount){actor.xp+=amount;let gained=0;while(actor.xp>=xpNeeded(actor.level)){actor.xp-=xpNeeded(actor.level);actor.level++;actor.maxHp+=10;actor.hp=actor.maxHp;gained++}return gained}
