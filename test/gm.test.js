import test from'node:test';import assert from'node:assert/strict';import{createGmRegistry}from'../src/gm.js';
const context=()=>({player:{hp:1,maxHp:100,gold:0,potions:0},god:false,aiPaused:false,setLevel:n=>`等级 ${n}`,giveGear:()=>'',spawn:()=>'',clearEnemies:()=>'',teleport:()=>'',preset:()=>''});
test('GM 注册表执行命令并保留日志',()=>{const gm=createGmRegistry(context(),()=> 'time');assert.equal(gm.execute('gold 250').ok,true);assert.equal(gm.context.player.gold,250);assert.equal(gm.logs[0].time,'time')});
test('未知 GM 命令返回可见错误',()=>assert.equal(createGmRegistry(context()).execute('missing').ok,false));
test('GM 无敌和 AI 指令可切换',()=>{const gm=createGmRegistry(context());gm.execute('god');gm.execute('ai');assert.equal(gm.context.god,true);assert.equal(gm.context.aiPaused,true)});
