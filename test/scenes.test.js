import test from "node:test";
import assert from "node:assert/strict";
import { SCENE, ROOM_PIXEL_SCALE, ROOM_OBJECTS, ROOM_COLLIDERS, PLAYER_FOOTPRINT, playerFootPosition, interactionPromptOffset, createPlayerRoomScene, createVillageWakeScene, updateVillageWakeScene, roomPositionBlocked, roomActorFrame, interactPlayerRoomV2 } from "../src/scenes.js";

test("场景编号稳定且互不重复", () => assert.equal(new Set(Object.values(SCENE)).size, Object.values(SCENE).length));
test("村庄苏醒演出结束后才允许移动", () => { const scene=createVillageWakeScene(),player={x:100,y:100},keys=new Set(["KeyD"]);updateVillageWakeScene(scene,1,player,keys);assert.equal(player.x,100);updateVillageWakeScene(scene,10,player,keys);assert.ok(player.x>100);assert.equal(scene.phase,"play"); });
test("房间碰撞按脚点阻止实体并保留通道", () => {
  assert.equal(roomPositionBlocked(768,140),true,"壁炉底座阻挡脚点");
  assert.equal(roomPositionBlocked(664,690),false,"下墙出口保持开放");
  assert.equal(roomPositionBlocked(600,500),false);
  assert.equal(roomPositionBlocked(100,400),true);
  assert.equal(roomPositionBlocked(220,430),false,"床下方可以行走");
  assert.equal(roomPositionBlocked(600,100),true,"角色不能走进上墙");
  assert.equal(roomPositionBlocked(550,300),false,"床与柜子之间保留通道");
  assert.equal(roomPositionBlocked(805,300),false,"壁炉与桌子之间保留通道");
  assert.equal(roomPositionBlocked(850,350),true,"桌脚区域不可穿越");
  assert.equal(roomPositionBlocked(900,310),false,"桌后区域按 Y 排序表现");
});
test("玩家碰撞体仅覆盖立绘脚部",()=>{
  assert.deepEqual(playerFootPosition({x:500,y:300}),{x:500,y:327});
  assert.equal(PLAYER_FOOTPRINT.radius,15);
  assert.equal(roomPositionBlocked(600,68),true,"脚部接触上墙时阻止");
  assert.equal(roomPositionBlocked(800,430),false,"角色上半身可与桌面视觉重叠");
});
test("房间角色按八方向选择行走与待机帧", () => {
  assert.deepEqual(roomActorFrame(-Math.PI/2,false,0),{row:4,column:0});
  assert.deepEqual(roomActorFrame(0,true,0),{row:2,column:1});
  assert.deepEqual(roomActorFrame(Math.PI/2,true,140),{row:0,column:2});
  assert.deepEqual(roomActorFrame(Math.PI,true,420),{row:6,column:2});
  assert.notEqual(roomActorFrame(0,true,420).column,4);
});
test("房间调查仅在交互点有效距离内响应",()=>{
  const scene=createPlayerRoomScene(true);
  assert.equal(interactPlayerRoomV2(scene,{x:700,y:600}),false);
  assert.equal(scene.bubble,"", "空按 E 不产生兜底气泡");
  assert.equal(interactPlayerRoomV2(scene,{x:520,y:220}),true);
  assert.ok(scene.bubble.length>0);
});
test("交互键帽仅作慢速小幅上下浮动",()=>{
  assert.equal(interactionPromptOffset(0),0);
  assert.equal(interactionPromptOffset(350),Math.sin(.5)*1.5);
  assert.ok(interactionPromptOffset(700*Math.PI/2)<=1.5);
  assert.ok(interactionPromptOffset(700*Math.PI*1.5)>=-1.5);
});
test("家具碰撞由场景对象数据生成",()=>{
  assert.equal(ROOM_PIXEL_SCALE,3);
  for(const object of ROOM_OBJECTS){
    assert.equal(object.scale,ROOM_PIXEL_SCALE,`${object.id} 使用统一整数像素倍率`);
    assert.ok(ROOM_COLLIDERS.includes(object.collision),`${object.id} 使用同一碰撞对象`);
    assert.equal(object.collision.x,object.x+object.alpha.x*object.scale);
    assert.equal(object.collision.w,object.alpha.w*object.scale);
    assert.equal(object.sortY,object.collision.y+object.collision.h);
  }
});
