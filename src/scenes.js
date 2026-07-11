export const SCENE = Object.freeze({ VILLAGE_OUTSKIRTS: 100, PLAYER_ROOM: 101, COMBAT_PROTOTYPE: 900 });

export const createPlayerRoomScene = (skip = false) => ({ id: SCENE.PLAYER_ROOM, elapsed: skip ? 10 : 0, phase: skip ? "play" : "fade", bubble: "" });

export function updatePlayerRoomScene(scene, dt, player, keys) {
  scene.elapsed += dt;
  scene.phase = scene.elapsed < 2 ? "fade" : scene.elapsed < 6 ? "sleep" : scene.elapsed < 9 ? "wake" : "play";
  if (scene.phase !== "play") return false;
  let x=(keys.has("KeyD")?1:0)-(keys.has("KeyA")?1:0),y=(keys.has("KeyS")?1:0)-(keys.has("KeyW")?1:0),l=Math.hypot(x,y)||1;
  player.moving=!!(x||y);player.x=Math.max(225,Math.min(1065,player.x+x/l*145*dt));player.y=Math.max(120,Math.min(650,player.y+y/l*145*dt));if(x||y)player.facing=Math.atan2(y,x);
  return player.x>850&&player.y>625;
}

export function interactPlayerRoom(scene, player) {
  const points=[{x:300,y:205,text:"空的。连一粒麦子都没有。"},{x:880,y:390,text:"碗底的麦糊已经硬了。"},{x:930,y:160,text:"冷透的灰。昨晚没有生火。"},{x:400,y:430,text:"这张床……还有这双手，都不是我的。"}];
  const hit=points.find(p=>Math.hypot(player.x-p.x,player.y-p.y)<125);scene.bubble=hit?.text||"没什么值得带走的。";scene.bubbleUntil=scene.elapsed+3.5;
}

export function drawPlayerRoomScene(ctx,scene,player,art){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(art.room,0,0,1280,720);const wake=Math.max(0,Math.min(1,(scene.elapsed-6)/3));ctx.fillStyle="rgba(0,0,0,.24)";ctx.beginPath();ctx.ellipse(player.x,player.y+24,15,5,0,0,7);ctx.fill();ctx.save();ctx.translate(player.x,player.y);ctx.rotate((1-wake)*Math.PI/2);ctx.drawImage(art.hero,0,0,32,32,-37,-37,74,74);ctx.restore();let words="";if(scene.phase==='sleep'&&scene.elapsed>3)words="肚子饿饿的……";else if(scene.phase==='wake')words="这是……谁的房间？";else if(scene.bubbleUntil>scene.elapsed)words=scene.bubble;else if(scene.phase==='play'&&scene.elapsed<14)words="先下床看看。";if(words)bubble(ctx,player.x,player.y,words);if(scene.phase==='play'&&scene.elapsed<16){ctx.fillStyle='rgba(17,20,15,.72)';ctx.fillRect(455,672,370,28);ctx.fillStyle='#eadbbd';ctx.textAlign='center';ctx.font='13px system-ui';ctx.fillText('WASD 移动 · E 调查 · 从右下方房门离开',640,692)}const fade=Math.max(0,1-scene.elapsed/2);ctx.fillStyle=`rgba(0,0,0,${fade})`;ctx.fillRect(0,0,1280,720);ctx.restore()}

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

const ROOM_HOTSPOTS = [
  { x: 270, y: 210, label: "空粮柜", text: "空的。连一粒麦子都没有。" },
  { x: 870, y: 410, label: "空碗", text: "碗底的麦糊已经硬了。" },
  { x: 910, y: 210, label: "壁炉", text: "冷透的灰。昨晚没有生火。" },
  { x: 400, y: 440, label: "旧床", text: "这张床……还有这双手，都不是我的。" },
];

const nearestRoomHotspot = (player) => ROOM_HOTSPOTS.map((point) => ({ ...point, distance: Math.hypot(player.x - point.x, player.y - point.y) })).sort((a,b) => a.distance - b.distance)[0];

export function interactPlayerRoomV2(scene, player) {
  const hit = nearestRoomHotspot(player);
  scene.bubble = hit?.distance < 150 ? hit.text : "没什么值得带走的。";
  scene.bubbleUntil = scene.elapsed + 3.5;
}

function interactionPrompt(ctx, point) {
  const pulse = 1 + Math.sin(performance.now() / 180) * .08;
  ctx.save(); ctx.translate(point.x, point.y - 58); ctx.scale(pulse,pulse);
  ctx.fillStyle = "rgba(32,26,19,.92)"; ctx.strokeStyle = "#efd18d"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0,0,20,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff0c8"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "bold 17px system-ui"; ctx.fillText("E",0,1);
  ctx.font = "12px system-ui"; ctx.fillStyle = "#fff4d7"; ctx.fillText(point.label,0,32); ctx.restore();
}

function roomOcclusion(ctx, image, x, y, w, h) {
  const sx = x * image.naturalWidth / 1280, sy = y * image.naturalHeight / 720, sw = w * image.naturalWidth / 1280, sh = h * image.naturalHeight / 720;
  ctx.drawImage(image,sx,sy,sw,sh,x,y,w,h);
}

export function drawPlayerRoomSceneV2(ctx, scene, player, art) {
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(art.room,0,0,1280,720);
  const wake=Math.max(0,Math.min(1,(scene.elapsed-6)/3)), size=118;
  ctx.fillStyle="rgba(0,0,0,.24)";ctx.beginPath();ctx.ellipse(player.x,player.y+34,22,7,0,0,7);ctx.fill();
  ctx.save();ctx.translate(player.x,player.y);ctx.rotate((1-wake)*Math.PI/2);ctx.drawImage(art.hero,0,0,32,32,-size/2,-size/2,size,size);ctx.restore();
  // 从底图重新绘制家具前缘，建立角色与床、桌、柜子、壁炉的纵深遮挡。
  if(player.y<590&&player.x>185&&player.x<350)roomOcclusion(ctx,art.room,185,520,180,92);
  if(player.y<505&&player.x>650&&player.x<965)roomOcclusion(ctx,art.room,650,430,310,95);
  if(player.y<340&&player.x>760&&player.x<1040)roomOcclusion(ctx,art.room,760,270,285,80);
  if(player.y<320&&player.x>75&&player.x<360)roomOcclusion(ctx,art.room,75,250,300,75);
  let words="";if(scene.phase==='sleep'&&scene.elapsed>3)words="肚子饿饿的……";else if(scene.phase==='wake')words="这是……谁的房间？";else if(scene.bubbleUntil>scene.elapsed)words=scene.bubble;else if(scene.phase==='play'&&scene.elapsed<14)words="先下床看看。";if(words)bubble(ctx,player.x,player.y,words);
  if(scene.phase==='play'){const near=nearestRoomHotspot(player);if(near.distance<165)interactionPrompt(ctx,near);if(player.x>790&&player.y>565)interactionPrompt(ctx,{x:900,y:650,label:'离开房间'})}
  if(scene.phase==='play'&&scene.elapsed<16){ctx.fillStyle='rgba(17,20,15,.72)';ctx.fillRect(500,672,280,28);ctx.fillStyle='#eadbbd';ctx.textAlign='center';ctx.font='13px system-ui';ctx.fillText('WASD 移动 · E 调查',640,692)}
  const fade=Math.max(0,1-scene.elapsed/2);ctx.fillStyle=`rgba(0,0,0,${fade})`;ctx.fillRect(0,0,1280,720);ctx.restore();
}
