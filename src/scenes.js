export const SCENE = Object.freeze({ VILLAGE_OUTSKIRTS: 100, PLAYER_ROOM: 101, COMBAT_PROTOTYPE: 900 });

export const createPlayerRoomScene = (skip = false) => ({ id: SCENE.PLAYER_ROOM, elapsed: skip ? 10 : 0, phase: skip ? "play" : "fade", bubble: "" });

export const ROOM_PIXEL_SCALE=3;
export const ROOM_BOUNDS=Object.freeze({left:184,top:72,right:1096,bottom:696});
export const ROOM_EXIT=Object.freeze({left:592,right:736,top:648,bottom:720});

export const ROOM_OBJECTS=Object.freeze([
  {id:'bed',label:'旧床',text:'这张床……还有这双手，都不是我的。',image:'roomThings',source:{x:129,y:66,w:63,h:14},x:232,y:250,w:63,h:14,scale:ROOM_PIXEL_SCALE,alpha:{x:0,y:0,w:63,h:14},footStart:.58},
  {id:'cupboard',label:'空粮柜',text:'空的。连一粒麦子都没有。',image:'roomThings',source:{x:64,y:80,w:16,h:16},x:456,y:132,w:16,h:16,scale:ROOM_PIXEL_SCALE,alpha:{x:0,y:0,w:16,h:16},footStart:.55},
  {id:'fireplace',label:'壁炉',text:'冷透的灰。昨晚没有生火。',image:'roomThings',source:{x:80,y:80,w:16,h:16},x:744,y:132,w:16,h:16,scale:ROOM_PIXEL_SCALE,alpha:{x:0,y:0,w:16,h:16},footStart:.55},
  {id:'barrel',image:'roomThings',source:{x:64,y:50,w:16,h:14},x:948,y:154,w:16,h:14,scale:ROOM_PIXEL_SCALE,alpha:{x:0,y:0,w:16,h:14},footStart:.5},
  {id:'table',label:'空碗',text:'碗底的麦糊已经硬了。',image:'roomThings',source:{x:149,y:50,w:43,h:14},x:808,y:350,w:43,h:14,scale:ROOM_PIXEL_SCALE,alpha:{x:0,y:0,w:43,h:14},footStart:.55},
  {id:'chair',image:'roomThings',source:{x:130,y:16,w:12,h:29},x:856,y:405,w:12,h:29,scale:ROOM_PIXEL_SCALE,alpha:{x:0,y:0,w:12,h:29},footStart:.72},
  {id:'chest',image:'roomChests',source:{x:0,y:0,w:16,h:16},x:968,y:542,w:16,h:16,scale:ROOM_PIXEL_SCALE,alpha:{x:0,y:2,w:16,h:14},footStart:.55},
]);
for(const object of ROOM_OBJECTS){const a=object.alpha,s=object.scale,fy=a.y+a.h*object.footStart;object.collision=Object.freeze({x:object.x+a.x*s,y:object.y+fy*s,w:a.w*s,h:a.h*(1-object.footStart)*s});object.sortY=object.collision.y+object.collision.h}
const ROOM_WALL_COLLIDERS=Object.freeze([
  {x:0,y:0,w:1280,h:ROOM_BOUNDS.top+16*ROOM_PIXEL_SCALE},{x:0,y:0,w:ROOM_BOUNDS.left,h:720},{x:ROOM_BOUNDS.right,y:0,w:1280-ROOM_BOUNDS.right,h:720},
  {x:0,y:ROOM_BOUNDS.bottom-24,w:ROOM_EXIT.left,h:48},{x:ROOM_EXIT.right,y:ROOM_BOUNDS.bottom-24,w:1280-ROOM_EXIT.right,h:48},
]);
export const ROOM_COLLIDERS=Object.freeze([...ROOM_WALL_COLLIDERS,...ROOM_OBJECTS.map(object=>object.collision)]);

export const PLAYER_FOOTPRINT=Object.freeze({offsetY:27,radius:15});
export const playerFootPosition=(player)=>({x:player.x,y:player.y+PLAYER_FOOTPRINT.offsetY});

export function roomPositionBlocked(x, y, radius = PLAYER_FOOTPRINT.radius) {
  const footY=y+PLAYER_FOOTPRINT.offsetY;
  return ROOM_COLLIDERS.some((box) => x + radius > box.x && x - radius < box.x + box.w && footY + radius > box.y && footY - radius < box.y + box.h);
}

export function drawRoomCollisionDebug(ctx, player) {
  const foot=playerFootPosition(player);ctx.save();ctx.lineWidth=3;ctx.strokeStyle='#ff4059';ctx.fillStyle='rgba(255,40,72,.18)';for(const box of ROOM_COLLIDERS){ctx.fillRect(box.x,box.y,box.w,box.h);ctx.strokeRect(box.x,box.y,box.w,box.h)}ctx.strokeStyle='#42e8ff';ctx.fillStyle='rgba(66,232,255,.18)';ctx.beginPath();ctx.arc(foot.x,foot.y,PLAYER_FOOTPRINT.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([10,7]);ctx.strokeStyle='#65ff72';ctx.strokeRect(ROOM_EXIT.left,ROOM_EXIT.top,ROOM_EXIT.right-ROOM_EXIT.left,ROOM_EXIT.bottom-ROOM_EXIT.top);ctx.setLineDash([]);ctx.fillStyle='#fff';ctx.font='bold 15px monospace';ctx.textAlign='left';ctx.fillText('RED: collision  CYAN: player feet  GREEN: exit',215,28);ctx.restore();
}

export function updatePlayerRoomScene(scene, dt, player, keys) {
  scene.elapsed += dt;
  scene.phase = scene.elapsed < 2 ? "fade" : scene.elapsed < 6 ? "sleep" : scene.elapsed < 9 ? "wake" : "play";
  if (scene.phase !== "play") return false;
  if (!scene.leftBed) { player.x = 520; player.y = 430; scene.leftBed = true; }
  let x=(keys.has("KeyD")?1:0)-(keys.has("KeyA")?1:0),y=(keys.has("KeyS")?1:0)-(keys.has("KeyW")?1:0),l=Math.hypot(x,y)||1;
  const nextX=player.x+x/l*145*dt,nextY=player.y+y/l*145*dt;
  player.moving=!!(x||y);if(!roomPositionBlocked(nextX,player.y))player.x=nextX;if(!roomPositionBlocked(player.x,nextY))player.y=nextY;if(x||y)player.facing=Math.atan2(y,x);
  const foot=playerFootPosition(player);return foot.x>ROOM_EXIT.left&&foot.x<ROOM_EXIT.right&&foot.y>ROOM_EXIT.top;
}

export const createVillageWakeScene = (skip = false) => ({
  id: SCENE.VILLAGE_OUTSKIRTS,
  elapsed: skip ? 13 : 0,
  phase: skip ? "play" : "fade",
  objective: "想办法填饱肚子",
});

export function updateVillageWakeScene(scene, dt, player, keys) {
  scene.elapsed += dt;
  scene.phase = scene.elapsed < 2 ? "fade" : scene.elapsed < 6 ? "sleep" : scene.elapsed < 10 ? "wake" : "play";
  if (scene.phase !== "play") return;
  let x = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0), y = (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0);
  const length = Math.hypot(x, y) || 1;
  player.moving = !!(x || y);
  player.x = Math.max(70, Math.min(1210, player.x + x / length * 150 * dt));
  player.y = Math.max(100, Math.min(660, player.y + y / length * 150 * dt));
  if (x || y) player.facing = Math.atan2(y, x);
}

function sprite(ctx, sheet, sx, sy, sw, sh, x, y, scale = 4) {
  ctx.drawImage(sheet, sx, sy, sw, sh, x, y, sw * scale, sh * scale);
}

function bubble(ctx, x, y, text) {
  ctx.save();
  ctx.font = "17px system-ui";
  const width = Math.max(130, ctx.measureText(text).width + 34), height = 42, left = x - width / 2, top = y - 94;
  ctx.fillStyle = "rgba(250,244,226,.95)";
  ctx.strokeStyle = "#4b3a27";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(left, top, width, height, 12); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 8, top + height); ctx.lineTo(x + 2, top + height + 12); ctx.lineTo(x + 10, top + height); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#30271d"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, x, top + height / 2);
  ctx.restore();
}

export function drawVillageWakeScene(ctx, scene, player, art) {
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < 720; y += 64) for (let x = 0; x < 1280; x += 64) ctx.drawImage(art.grass, x, y, 64, 64);
  // Puny World 原生道路、建筑和资源物件，统一为 16px 像素网格的 4 倍显示。
  for (let x = 0; x < 1280; x += 64) ctx.drawImage(art.world, 48, 0, 16, 16, x, 544, 64, 64);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 9; col++) {
    ctx.fillStyle = (row + col) % 2 ? "#7f6333" : "#8d6e39"; ctx.fillRect(660 + col * 48, 120 + row * 44, 42, 38);
    sprite(ctx, art.world, 48 + (col % 4) * 16, 432, 16, 16, 649 + col * 48, 109 + row * 44, 4);
  }
  sprite(ctx, art.world, 144, 416, 48, 48, 90, 92, 4.2);
  sprite(ctx, art.world, 192, 416, 48, 48, 330, 70, 4.1);
  sprite(ctx, art.world, 336, 416, 48, 48, 1000, 300, 4.2);
  sprite(ctx, art.world, 128, 464, 32, 32, 790, 380, 4.5);
  sprite(ctx, art.world, 80, 448, 16, 16, 930, 432, 4);
  [[25,35],[1140,18],[10,290],[1160,175],[535,18]].forEach(([x,y]) => ctx.drawImage(art.tree, x, y, 128, 128));
  const wake = Math.max(0, Math.min(1, (scene.elapsed - 6) / 4)), px = player.x, py = player.y;
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(px, py + 25, 16, 5, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(px, py); ctx.rotate((1 - wake) * Math.PI / 2); ctx.drawImage(art.hero, 0, 0, 32, 32, -38, -38, 76, 76); ctx.restore();
  let words = "";
  if (scene.phase === "sleep" && scene.elapsed > 3) words = "肚子饿饿的……";
  else if (scene.phase === "wake") words = "……这不是我的手。";
  else if (scene.phase === "play" && scene.elapsed < 18) words = "得去村里找点吃的。";
  if (words) bubble(ctx, px, py, words);
  if (scene.phase === "play" && scene.elapsed < 18) {
    ctx.fillStyle = "rgba(17,20,15,.72)"; ctx.fillRect(500, 672, 280, 28); ctx.fillStyle = "#eadbbd"; ctx.textAlign = "center"; ctx.font = "13px system-ui"; ctx.fillText("WASD 移动", 640, 692);
  }
  const fade = Math.max(0, 1 - scene.elapsed / 2); ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, 1280, 720); ctx.restore();
}

const ROOM_HOTSPOTS = ROOM_OBJECTS.filter((object)=>object.label).map((object)=>({
  x:object.x+object.w*object.scale/2,
  y:object.y+object.h*object.scale/2,
  label:object.label,
  text:object.text,
}));

const nearestRoomHotspot = (player) => ROOM_HOTSPOTS.map((point) => ({ ...point, distance: Math.hypot(player.x - point.x, player.y - point.y) })).sort((a,b) => a.distance - b.distance)[0];

export function interactPlayerRoomV2(scene, player) {
  const hit = nearestRoomHotspot(player);
  if (!hit || hit.distance >= 150) return false;
  scene.bubble = hit.text;
  scene.bubbleUntil = scene.elapsed + 3.5;
  return true;
}

export const interactionPromptOffset=(now)=>Math.sin(now/700)*1.5;

function interactionPrompt(ctx, point) {
  const offset=interactionPromptOffset(performance.now());
  ctx.save();ctx.translate(point.x,point.y-28+offset);
  ctx.shadowColor='rgba(240,201,120,.42)';ctx.shadowBlur=7;
  ctx.fillStyle='rgba(25,22,17,.94)';ctx.strokeStyle='#c9a665';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(-18,-14,36,28,6);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle='#fff1cb';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 15px system-ui';ctx.fillText('E',0,0);
  ctx.font='12px system-ui';ctx.fillStyle='#fff4d7';ctx.fillText(point.label,0,23);ctx.restore();
}

export function roomActorFrame(facing, moving, now=performance.now()) {
  const walkColumns=[1,2,3,2];
  return { row:(2-Math.round(facing/(Math.PI/4))+8)%8, column:moving?walkColumns[Math.floor(now/140)%walkColumns.length]:0 };
}

function drawRoomObject(ctx,object,art){
  const source=object.source;ctx.drawImage(art[object.image],source.x,source.y,source.w,source.h,object.x,object.y,object.w*object.scale,object.h*object.scale);
}
function drawRoomActor(ctx,player,art,wake){
  const size=32*ROOM_PIXEL_SCALE,{row,column}=roomActorFrame(player.facing,player.moving);
  ctx.fillStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.ellipse(player.x,player.y+PLAYER_FOOTPRINT.offsetY,18,6,0,0,7);ctx.fill();
  ctx.save();ctx.translate(player.x,player.y);ctx.rotate((1-wake)*Math.PI/2);ctx.drawImage(art.hero,column*32,row*32,32,32,-size/2,-size/2,size,size);ctx.restore();
}
export function drawPlayerRoomSceneV2(ctx,scene,player,art){
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#11100d';ctx.fillRect(0,0,1280,720);
  const tile=16*ROOM_PIXEL_SCALE;
  ctx.fillStyle='#382723';ctx.fillRect(ROOM_BOUNDS.left,ROOM_BOUNDS.top,ROOM_BOUNDS.right-ROOM_BOUNDS.left,ROOM_BOUNDS.bottom-ROOM_BOUNDS.top);
  for(let y=ROOM_BOUNDS.top+tile;y<ROOM_BOUNDS.bottom;y+=tile)for(let x=ROOM_BOUNDS.left;x<ROOM_BOUNDS.right;x+=tile)ctx.drawImage(art.roomWalls,240,144,16,16,x,y,tile,tile);
  for(let x=ROOM_BOUNDS.left;x<ROOM_BOUNDS.right;x+=tile){ctx.drawImage(art.roomWalls,336,144,16,16,x,ROOM_BOUNDS.top,tile,tile);if(x<ROOM_EXIT.left||x>=ROOM_EXIT.right)ctx.drawImage(art.roomWalls,336,144,16,16,x,ROOM_BOUNDS.bottom-tile,tile,tile)}
  for(let y=ROOM_BOUNDS.top;y<ROOM_BOUNDS.bottom;y+=tile){ctx.drawImage(art.roomWalls,336,144,16,16,ROOM_BOUNDS.left,y,tile,tile);ctx.drawImage(art.roomWalls,336,144,16,16,ROOM_BOUNDS.right-tile,y,tile,tile)}
  ctx.fillStyle='#15110f';ctx.fillRect(ROOM_EXIT.left,ROOM_EXIT.top,ROOM_EXIT.right-ROOM_EXIT.left,720-ROOM_EXIT.top);ctx.strokeStyle='#8a653d';ctx.lineWidth=3;ctx.strokeRect(ROOM_EXIT.left+6,ROOM_EXIT.top-6,ROOM_EXIT.right-ROOM_EXIT.left-12,78);
  const wake=Math.max(0,Math.min(1,(scene.elapsed-6)/3));
  const foot=playerFootPosition(player),layers=[...ROOM_OBJECTS.map(object=>({sortY:object.sortY,draw:()=>drawRoomObject(ctx,object,art)})),{sortY:foot.y,draw:()=>drawRoomActor(ctx,player,art,wake)}].sort((a,b)=>a.sortY-b.sortY);
  for(const layer of layers)layer.draw();
  let words='';if(scene.phase==='sleep'&&scene.elapsed>3)words='肚子饿饿的……';else if(scene.phase==='wake')words='这是……谁的房间？';else if(scene.bubbleUntil>scene.elapsed)words=scene.bubble;else if(scene.phase==='play'&&scene.elapsed<14)words='先下床看看。';if(words)bubble(ctx,player.x,player.y,words);
  if(scene.phase==='play'){const near=nearestRoomHotspot(player);if(near.distance<150)interactionPrompt(ctx,near);if(player.x>ROOM_EXIT.left-45&&player.x<ROOM_EXIT.right+45&&player.y>570)interactionPrompt(ctx,{x:(ROOM_EXIT.left+ROOM_EXIT.right)/2,y:ROOM_EXIT.top,label:'离开房间'})}
  if(scene.phase==='play'&&scene.elapsed<16){ctx.fillStyle='rgba(17,20,15,.72)';ctx.fillRect(500,672,280,28);ctx.fillStyle='#eadbbd';ctx.textAlign='center';ctx.font='13px system-ui';ctx.fillText('WASD 移动 · E 调查',640,692)}
  const fade=Math.max(0,1-scene.elapsed/2);ctx.fillStyle=`rgba(0,0,0,${fade})`;ctx.fillRect(0,0,1280,720);ctx.restore();
}
