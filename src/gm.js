export function createGmRegistry(context,now=()=>new Date().toISOString()){
  const commands=new Map(),logs=[];
  const register=(name,description,run)=>commands.set(name,{name,description,run});
  const execute=(line)=>{const [name,...args]=String(line).trim().split(/\s+/);const command=commands.get(name);let result;if(!command)result={ok:false,message:`未知命令：${name||'空命令'}`};else try{result={ok:true,message:String(command.run(args)||'执行成功')}}catch(error){result={ok:false,message:error.message}}logs.unshift({time:now(),command:line,result:result.message,ok:result.ok});logs.length=Math.min(logs.length,50);return result};
  const api={register,execute,commands,logs,context};
  register('god','切换无敌',()=>{context.god=!context.god;return`无敌模式：${context.god?'开启':'关闭'}`});
  register('heal','恢复全部生命',()=>{context.player.hp=context.player.maxHp;return'生命已恢复'});
  register('gold','增加金币',([value='1000'])=>{const amount=Math.max(0,Number(value)||0);context.player.gold+=amount;return`获得 ${amount} 金币`});
  register('level','设置等级',([value='10'])=>context.setLevel(Math.max(1,Number(value)||1)));
  register('potion','增加药水',([value='10'])=>{const amount=Math.max(0,Number(value)||0);context.player.potions+=amount;return`获得 ${amount} 瓶药水`});
  register('gear','生成装备',([type='weapon',rarity='rare'])=>context.giveGear(type,rarity));
  register('spawn','生成怪物',([kind='normal',count='1'])=>context.spawn(kind,Math.min(20,Math.max(1,Number(count)||1))));
  register('clear','清空怪物',()=>context.clearEnemies());
  register('ai','切换怪物 AI',()=>{context.aiPaused=!context.aiPaused;return`怪物 AI：${context.aiPaused?'暂停':'运行'}`});
  register('tp','传送',([target='zone'])=>context.teleport(target));
  register('preset','加载测试预设',([name='growth'])=>context.preset(name));
  return api;
}
