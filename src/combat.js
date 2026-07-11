export const RULES={attackDamage:28,enemyDamage:18};
export const damage=(a,n,invincible=false)=>invincible?false:(a.hp=Math.max(0,a.hp-n),true);
