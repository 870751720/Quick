import test from "node:test";
import assert from "node:assert/strict";
import { SCENE, createVillageWakeScene, updateVillageWakeScene, roomPositionBlocked, roomActorFrame } from "../src/scenes.js";

test("场景编号稳定且互不重复", () => assert.equal(new Set(Object.values(SCENE)).size, Object.values(SCENE).length));
test("村庄苏醒演出结束后才允许移动", () => { const scene=createVillageWakeScene(),player={x:100,y:100},keys=new Set(["KeyD"]);updateVillageWakeScene(scene,1,player,keys);assert.equal(player.x,100);updateVillageWakeScene(scene,10,player,keys);assert.ok(player.x>100);assert.equal(scene.phase,"play"); });
test("房间碰撞按原画边界阻止家具并保留门口", () => { assert.equal(roomPositionBlocked(850,200),true);assert.equal(roomPositionBlocked(860,680),false);assert.equal(roomPositionBlocked(600,500),false);assert.equal(roomPositionBlocked(100,400),true); });
test("房间角色按八方向选择行走与待机帧", () => {
  assert.deepEqual(roomActorFrame(-Math.PI/2,false,0),{row:0,column:0});
  assert.deepEqual(roomActorFrame(0,true,0),{row:2,column:1});
  assert.deepEqual(roomActorFrame(Math.PI/2,true,140),{row:4,column:2});
  assert.deepEqual(roomActorFrame(Math.PI,true,420),{row:6,column:4});
});
