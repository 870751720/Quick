import test from "node:test";import assert from "node:assert/strict";import{SCENE,createVillageWakeScene,updateVillageWakeScene,roomPositionBlocked}from"../src/scenes.js";
test('场景编号稳定且互不重复',()=>assert.equal(new Set(Object.values(SCENE)).size,Object.values(SCENE).length));
test('村庄苏醒演出结束后才允许移动',()=>{const s=createVillageWakeScene(),p={x:100,y:100},k=new Set(['KeyD']);updateVillageWakeScene(s,1,p,k);assert.equal(p.x,100);updateVillageWakeScene(s,10,p,k);assert.ok(p.x>100);assert.equal(s.phase,'play')});
test('房间碰撞阻止进入家具并保留门口通道',()=>{assert.equal(roomPositionBlocked(850,200),true);assert.equal(roomPositionBlocked(900,680),false);assert.equal(roomPositionBlocked(600,500),false)});
