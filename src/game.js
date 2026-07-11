import {
  RULES,
  damage,
  grantXp,
  xpNeeded,
  attackAtLevel as baseAttackAtLevel,
} from "./combat.js?v=20";
import { sfx, unlockAudio, getAudioSettings, setAudioSettings, startMenuMusic, stopMenuMusic } from "./audio.js?v=20";
import {
  POTION,
  createInventory,
  createGear,
  createStack,
  addItem,
  moveItem,
  splitStack,
  consumeItem,
  countItem,
  equipItem,
  toggleLocked,
  toggleJunk,
  sortInventory,
  filteredSlots,
  itemSellValue,
  sellItem,
  sellAll,
  equipmentAttack,
  equipmentHp,
} from "./inventory.js?v=20";
import { createGmRegistry } from "./gm.js?v=20";
import { SCENE, createVillageWakeScene, updateVillageWakeScene, drawVillageWakeScene } from "./scenes.js?v=20";

const canvas = document.querySelector("#game"),
  ctx = canvas.getContext("2d"),
  keys = new Set();
const input = { x: 640, y: 360, attack: false, dash: false };
const load = (src) => {
  const image = new Image();
  image.src = src;
  return image;
};
const art = {
  hero: load("assets/characters/warrior-blue.png"),
  orc: load("assets/characters/orc-soldier-red.png"),
  grunt: load("assets/characters/orc-grunt.png"),
  dirt: load("assets/environment/puny/Dirt.png"),
  grass: load("assets/environment/puny/Grass1.png"),
  tree: load("assets/environment/puny/Tree.png"),
  world: load("assets/environment/puny/punyworld-overworld-tileset.png"),
  potions: load("assets/items/shade/potions.png"),
  weapons: load("assets/items/shade/weapons.png"),
  armours: load("assets/items/shade/armours.png"),
};
const player = {
  x: 640,
  y: 360,
  hp: 100,
  maxHp: 100,
  state: "idle",
  time: 0,
  facing: 0,
  hit: new Set(),
  moving: false,
  gold: 0,
  potions: 0,
  level: 1,
  xp: 0,
};
let inventory = createInventory(20);
const attackAtLevel = (level) =>
  baseAttackAtLevel(level) + equipmentAttack(inventory);
Object.defineProperty(player, "potions", {
  get: () => countItem(inventory, POTION.definitionId),
  set: (value) => {
    const amount = Math.max(
      0,
      Math.floor(value) - countItem(inventory, POTION.definitionId),
    );
    if (amount) addItem(inventory, createStack(POTION, amount));
  },
  configurable: true,
});
const spawnZone = { x: 930, y: 360, radius: 235 };
const merchant = {
  x: 185,
  y: 360,
  state: "idle",
  time: 0,
  facing: 0,
  moving: false,
  name: "灰篷商人",
};
let enemies = [],
  drops = [],
  particles = [],
  floaters = [],
  wave = 1,
  nextWave = 0,
  spawned = 0,
  defeated = 0,
  message = "",
  running = false,
  inventoryOpen = false,
  merchantOpen = false,
  last = 0;
let currentSceneId = SCENE.COMBAT_PROTOTYPE,
  villageScene = createVillageWakeScene(true);
const gmEnabled = new URLSearchParams(location.search).get("gm") === "1";
let gmOpen = false;
let inventoryFilter = "all",
  dragSlot = -1;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  normal = (x, y) => {
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  };

addEventListener("keydown", (event) => {
  if (currentSceneId === SCENE.VILLAGE_WAKE && villageScene.phase !== "play" && (event.code === "Space" || event.code === "Escape")) {
    event.preventDefault();
    villageScene.elapsed = 10;
    return;
  }
  if (event.code === "F1" && gmEnabled) {
    event.preventDefault();
    gmOpen = !gmOpen;
    inventoryOpen = merchantOpen = false;
    return;
  }
  keys.add(event.code);
  if (gmOpen) return;
  if (event.code === "Space") input.attack = true;
  if (event.code.startsWith("Shift")) input.dash = true;
  if (event.code === "KeyQ") usePotion();
  if (event.code === "KeyB") {
    inventoryOpen = !inventoryOpen;
    merchantOpen = false;
  }
  if (event.code === "KeyE" && distance(player, merchant) < 105) {
    merchantOpen = !merchantOpen;
    inventoryOpen = false;
  }
  if (event.code === "Escape") {
    inventoryOpen = false;
    merchantOpen = false;
  }
  if (event.code === "KeyR") reset();
});
addEventListener("keyup", (event) => keys.delete(event.code));
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  input.x = ((event.clientX - rect.left) * 1280) / rect.width;
  input.y = ((event.clientY - rect.top) * 720) / rect.height;
});
canvas.addEventListener("mousedown", (event) =>
  event.button ? (input.dash = true) : (input.attack = true),
);
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
const inventorySlotAt = (x, y) => {
  const col = Math.floor((x - 360) / 64),
    row = Math.floor((y - 250) / 64);
  return col < 0 || col >= 5 || row < 0 || row >= 4 ? -1 : row * 5 + col;
};
const canvasPoint = (event) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * 1280) / rect.width,
    y: ((event.clientY - rect.top) * 720) / rect.height,
  };
};
canvas.addEventListener(
  "mousedown",
  (event) => {
    if (!inventoryOpen) return;
    event.stopImmediatePropagation();
    const { x, y } = canvasPoint(event),
      slot = inventorySlotAt(x, y);
    if (slot < 0) return;
    if (event.shiftKey) {
      const item = inventory.slots[slot];
      if (item?.stackMax) {
        const value = prompt(
          `拆分数量（1-${item.quantity - 1}）`,
          String(Math.floor(item.quantity / 2)),
        );
        if (value !== null) {
          const result = splitStack(inventory, slot, value);
          message = result.ok ? `已拆分 ${value} 个${item.name}` : result.error;
        }
      }
      return;
    }
    if (event.altKey) {
      const locked = toggleLocked(inventory, slot);
      message = locked ? "物品已锁定" : "物品已解锁";
      return;
    }
    if (event.button === 2) {
      const junk = toggleJunk(inventory, slot);
      message = junk ? "已标记为废品" : "已取消废品标记";
      return;
    }
    dragSlot = slot;
  },
  { capture: true },
);
canvas.addEventListener(
  "mouseup",
  (event) => {
    if (!inventoryOpen || dragSlot < 0) return;
    event.stopImmediatePropagation();
    const { x, y } = canvasPoint(event),
      target = inventorySlotAt(x, y);
    if (target >= 0 && target !== dragSlot) {
      moveItem(inventory, dragSlot, target);
      message = "背包位置已调整";
    }
    dragSlot = -1;
  },
  { capture: true },
);
addEventListener("mouseup", () => {
  dragSlot = -1;
});
canvas.addEventListener(
  "click",
  (event) => {
    if (!inventoryOpen) return;
    event.stopImmediatePropagation();
    const { x, y } = canvasPoint(event);
    if (y >= 190 && y <= 228) {
      const filters = [
        ["all", 340, 415],
        ["weapon", 425, 500],
        ["armor", 510, 585],
        ["consumable", 595, 690],
      ];
      const found = filters.find(([, a, b]) => x >= a && x <= b);
      if (found) {
        inventoryFilter = found[0];
        return;
      }
      if (x >= 710 && x <= 790) sortInventory(inventory, "quality");
    }
  },
  { capture: true },
);
canvas.addEventListener(
  "dblclick",
  (event) => {
    if (!inventoryOpen) return;
    event.stopImmediatePropagation();
    const { x, y } = canvasPoint(event),
      slot = inventorySlotAt(x, y),
      item = inventory.slots[slot];
    if (item?.type === "consumable") usePotion();
    else if (item) {
      const result = equipItem(inventory, slot);
      if (result) {
        const hpChange = equipmentHp(inventory) - (result.previous?.maxHp || 0);
        player.maxHp += hpChange;
        player.hp = Math.min(player.maxHp, player.hp + Math.max(0, hpChange));
        message = `已装备 ${result.item.name}`;
        sfx.pickup();
      }
    }
  },
  { capture: true },
);
canvas.addEventListener(
  "click",
  (event) => {
    if (!merchantOpen) return;
    const { x, y } = canvasPoint(event);
    if (x >= 545 && x <= 675 && y >= 515 && y <= 560) {
      event.stopImmediatePropagation();
      const sold = sellAll(inventory, { junkOnly: true });
      player.gold += sold.gold;
      message = sold.count
        ? `出售 ${sold.count} 件废品 · 获得 ${sold.gold} 金币`
        : "没有可出售的废品";
      if (sold.count) sfx.coin();
    }
  },
  { capture: true },
);
canvas.addEventListener("click", (event) => {
  if (!gmOpen) return;
  const rect = canvas.getBoundingClientRect(),
    x = ((event.clientX - rect.left) * 1280) / rect.width,
    y = ((event.clientY - rect.top) * 720) / rect.height,
    col = Math.floor((x - 250) / 160),
    row = Math.floor((y - 180) / 55),
    button = gmButtons[row * 5 + col];
  if (!button || col < 0 || col > 4) return;
  let command = button[1];
  if (command === "prompt")
    command =
      prompt(
        "输入 GM 命令：\ngold 1000 / level 10 / gear weapon rare / spawn elite 3 / preset growth",
      ) || "";
  if (command) {
    const result = gm.execute(command);
    message = result.message;
  }
});
canvas.addEventListener("click", (event) => {
  if (!inventoryOpen) return;
  const rect = canvas.getBoundingClientRect(),
    x = ((event.clientX - rect.left) * 1280) / rect.width,
    y = ((event.clientY - rect.top) * 720) / rect.height,
    col = Math.floor((x - 470) / 62),
    row = Math.floor((y - 285) / 62);
  if (col < 0 || col >= 5 || row < 0 || row >= 4) return;
  const cell = row * 5 + col;
  if (cell === 0) return usePotion();
  const result = equipItem(inventory, cell - 1);
  if (result) {
    const hpChange = equipmentHp(inventory) - (result.previous?.maxHp || 0);
    player.maxHp += hpChange;
    player.hp = Math.min(player.maxHp, player.hp + Math.max(0, hpChange));
    message = `已装备 ${result.item.name}`;
    sfx.pickup();
  }
});
canvas.addEventListener("click", (event) => {
  if (!merchantOpen) return;
  const rect = canvas.getBoundingClientRect(),
    x = ((event.clientX - rect.left) * 1280) / rect.width,
    y = ((event.clientY - rect.top) * 720) / rect.height;
  if (x >= 690 && x <= 820 && y >= 515 && y <= 560) {
    const sold = sellAll(inventory);
    player.gold += sold.gold;
    message = sold.count
      ? `出售 ${sold.count} 件装备 · 获得 ${sold.gold} 金币`
      : "背包里没有可出售装备";
    if (sold.count) sfx.coin();
    return;
  }
  const col = Math.floor((x - 460) / 62),
    row = Math.floor((y - 275) / 62);
  if (col < 0 || col >= 5 || row < 0 || row >= 4) return;
  const sold = sellItem(inventory, row * 5 + col);
  if (sold.item) {
    player.gold += sold.gold;
    message = `出售 ${sold.item.name} · 获得 ${sold.gold} 金币`;
    sfx.coin();
  }
});
const SAVE_KEY = "codename-world.save.v1";
const menu = document.querySelector("#main-menu"),
  continueButton = document.querySelector("#continue-game"),
  menuHint = document.querySelector("#menu-hint"),
  settingsPanel = document.querySelector("#settings-panel"),
  volumeInput = document.querySelector("#master-volume"),
  volumeValue = document.querySelector("#volume-value"),
  muteInput = document.querySelector("#mute-audio");
const hasSave = () => !!localStorage.getItem(SAVE_KEY);
const persistGame = () => {
  if (!running) return;
  localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, sceneId: currentSceneId, villageScene, player: { x: player.x, y: player.y, hp: player.hp, maxHp: player.maxHp, gold: player.gold, level: player.level, xp: player.xp }, inventory }));
};
const restoreGame = () => {
  try {
    const save = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (save?.version !== 1 || !save.player || !save.inventory) return false;
    reset();
    Object.assign(player, save.player);
    inventory = save.inventory;
    currentSceneId = save.sceneId || SCENE.COMBAT_PROTOTYPE;
    if (save.villageScene) villageScene = save.villageScene;
    return true;
  } catch { return false; }
};
const enterGame = () => {
  unlockAudio();
  sfx.menuSelect();
  stopMenuMusic();
  menu.classList.add("hidden");
  running = true;
  last = performance.now();
  requestAnimationFrame(loop);
};
continueButton.hidden = !hasSave();
continueButton.onclick = () => {
  if (restoreGame()) enterGame();
  else menuHint.textContent = "存档无法读取，请开始新游戏";
};
document.querySelector("#new-game").onclick = () => {
  if (hasSave() && !confirm("开始新游戏将覆盖当前进度，是否继续？")) return;
  localStorage.removeItem(SAVE_KEY);
  unlockAudio();
  reset();
  currentSceneId = SCENE.VILLAGE_WAKE;
  villageScene = createVillageWakeScene(false);
  player.x = 585; player.y = 545;
  message = "第一幕 · 饥饿";
  enterGame();
};
document.querySelector("#open-settings").onclick = () => { settingsPanel.classList.remove("hidden"); settingsPanel.setAttribute("aria-hidden", "false"); };
document.querySelector("#close-settings").onclick = () => { settingsPanel.classList.add("hidden"); settingsPanel.setAttribute("aria-hidden", "true"); };
const audioSettings = getAudioSettings();
volumeInput.value = Math.round(audioSettings.volume * 100); muteInput.checked = audioSettings.muted; volumeValue.value = `${volumeInput.value}%`;
const updateAudioSettings = () => { volumeValue.value = `${volumeInput.value}%`; setAudioSettings({ volume: Number(volumeInput.value) / 100, muted: muteInput.checked }); };
volumeInput.oninput = updateAudioSettings; muteInput.onchange = updateAudioSettings;
document.querySelectorAll(".menu-actions button, .settings-card button").forEach((button) => {
  button.addEventListener("pointerenter", () => { unlockAudio(); startMenuMusic(); sfx.menuHover(); }, { once: true });
  button.addEventListener("click", () => sfx.menuSelect());
});
document.addEventListener("pointerdown", () => { unlockAudio(); startMenuMusic(); }, { once: true });
addEventListener("beforeunload", persistGame);
setInterval(persistGame, 5000);

function spawnEnemy() {
  spawned++;
  wave = 1 + Math.floor(defeated / 8);
  const angle = Math.random() * Math.PI * 2,
    radius = 150 + Math.random() * 70,
    elite = spawned % 7 === 0,
    baseHp = 70 + wave * 10,
    maxHp = Math.round(baseHp * (elite ? 2.4 : 1));
  enemies.push({
    id: `zone-${spawned}`,
    x: spawnZone.x + Math.cos(angle) * radius,
    y: spawnZone.y + Math.sin(angle) * radius,
    hp: maxHp,
    maxHp,
    state: "idle",
    time: 0,
    cooldown: 0.4 + Math.random(),
    facing: 0,
    moving: false,
    hit: false,
    hurt: 0,
    shake: 0,
    elite,
    name: elite ? "赤牙督军" : "",
    art: elite ? "grunt" : spawned % 3 ? "orc" : "grunt",
  });
  message = elite ? "区域异动 · 精英「赤牙督军」出现" : "荒兽正在从区域中涌出";
}
const gm = createGmRegistry({
  player,
  god: false,
  aiPaused: false,
  setLevel(level) {
    player.level = level;
    player.maxHp = 100 + (level - 1) * 10 + equipmentHp(inventory);
    player.hp = player.maxHp;
    player.xp = 0;
    return `等级设为 ${level}`;
  },
  giveGear(type, rarity) {
    if (!["weapon", "armor"].includes(type))
      throw Error("类型应为 weapon 或 armor");
    const item = createGear(
      type,
      wave,
      () => ({ normal: 0.1, fine: 0.7, rare: 0.99 })[rarity] ?? 0.99,
    );
    if (!addItem(inventory, item)) throw Error("背包已满");
    return `获得 ${item.rarity}${item.name}`;
  },
  spawn(kind, count) {
    for (let i = 0; i < count; i++) {
      if (kind === "elite") spawned = 6;
      spawnEnemy();
    }
    return `生成 ${count} 只怪物`;
  },
  clearEnemies() {
    const count = enemies.length;
    enemies = [];
    return `清除 ${count} 只怪物`;
  },
  teleport(target) {
    const point = target === "merchant" ? merchant : spawnZone;
    player.x = point.x;
    player.y = point.y;
    return `传送至${target === "merchant" ? "商人" : "侵蚀区域"}`;
  },
  preset(name) {
    if (name === "growth") {
      player.gold += 1000;
      player.potions += 10;
      this.setLevel(10);
    } else if (name === "loot") {
      for (let i = 0; i < 6; i++)
        this.giveGear(i % 2 ? "armor" : "weapon", i > 3 ? "rare" : "fine");
    } else if (name === "elite") {
      this.clearEnemies();
      this.spawn("elite", 3);
      this.teleport("zone");
    } else if (name === "full") {
      while (
        addItem(
          inventory,
          createGear("weapon", wave, () => 0.7),
        )
      );
    } else throw Error("预设：growth / loot / elite / full");
    return `已加载 ${name} 预设`;
  },
});
const gmButtons = [
  ["无敌", "god"],
  ["满血", "heal"],
  ["+1000 金", "gold 1000"],
  ["Lv.10", "level 10"],
  ["+10 药水", "potion 10"],
  ["紫武器", "gear weapon rare"],
  ["紫护甲", "gear armor rare"],
  ["5 普通怪", "spawn normal 5"],
  ["3 精英怪", "spawn elite 3"],
  ["清怪", "clear"],
  ["暂停 AI", "ai"],
  ["传送商人", "tp merchant"],
  ["传送战区", "tp zone"],
  ["成长预设", "preset growth"],
  ["掉落预设", "preset loot"],
  ["精英预设", "preset elite"],
  ["满包预设", "preset full"],
  ["输入命令", "prompt"],
];
gm.context.addPotion = (amount) => {
  if (!addItem(inventory, createStack(POTION, amount)))
    throw Error("背包空间不足，剩余药水未加入");
  return `获得 ${amount} 瓶药水`;
};
const gmPreset = gm.context.preset.bind(gm.context);
gm.context.preset = (name) => {
  const result = gmPreset(name);
  if (name === "growth") gm.context.addPotion(10);
  return result;
};
function reset() {
  Object.assign(player, {
    x: 640,
    y: 360,
    hp: 100,
    maxHp: 100,
    state: "idle",
    time: 0,
    gold: 0,
    level: 1,
    xp: 0,
    hit: new Set(),
    hurtFlash: 0,
  });
  inventory = createInventory(20);
  addItem(inventory, createStack(POTION, 3));
  enemies = [];
  drops = [];
  particles = [];
  floaters = [];
  wave = 1;
  spawned = 0;
  defeated = 0;
  nextWave = 0.3;
  inventoryOpen = false;
  merchantOpen = false;
  message = "进入右侧侵蚀区域开始战斗";
}
function burst(x, y, type, count = 12) {
  const color = type === "coin" ? "#ffd35a" : "#65e889";
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2,
      speed = 60 + Math.random() * 170;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 80,
      life: 0.45 + Math.random() * 0.45,
      color,
      size: 2 + Math.random() * 4,
    });
  }
}
function kill(enemy) {
  const index = enemies.indexOf(enemy);
  if (index < 0) return;
  enemies.splice(index, 1);
  defeated++;
  const reward = (5 + Math.floor(Math.random() * 8)) * (enemy.elite ? 4 : 1);
  drops.push({ x: enemy.x, y: enemy.y, type: "coin", amount: reward, time: 0 });
  burst(enemy.x, enemy.y, "coin", enemy.elite ? 30 : 16);
  if (enemy.elite || Math.random() < 0.38) {
    drops.push({
      x: enemy.x + 25,
      y: enemy.y,
      type: "heal",
      amount: 25,
      time: 0,
    });
    burst(enemy.x + 25, enemy.y, "heal", 12);
  }
  if (enemy.elite || Math.random() < 0.22) {
    const item = createGear(Math.random() < 0.55 ? "weapon" : "armor", wave);
    drops.push({ x: enemy.x - 25, y: enemy.y, type: "gear", item, time: 0 });
    burst(enemy.x - 25, enemy.y, "coin", 18);
  }
  const levels = grantXp(player, (10 + wave * 2) * (enemy.elite ? 3 : 1));
  if (levels) {
    burst(player.x, player.y, "coin", 28);
    message = `升级！Lv.${player.level}　攻击 ${attackAtLevel(player.level)}`;
    sfx.level();
  }
  sfx.drop();
}

function usePotion() {
  if (!running || player.hp <= 0) return;
  if (!countItem(inventory, POTION.definitionId)) {
    message = "背包里没有回血药";
    return;
  }
  if (player.hp >= player.maxHp) {
    message = "生命已满，未消耗药瓶";
    return;
  }
  const healed = Math.min(POTION.heal, player.maxHp - player.hp);
  player.hp += healed;
  consumeItem(inventory, POTION.definitionId);
  message = `使用回血药 · 恢复 ${healed} 生命`;
  burst(player.x, player.y, "heal", 16);
  sfx.heal();
}

function updatePlayer(dt) {
  player.facing = Math.atan2(input.y - player.y, input.x - player.x);
  player.time += dt;
  player.hurtFlash = Math.max(0, player.hurtFlash - dt);
  player.moving = false;
  if (player.state === "dash") {
    player.x += Math.cos(player.facing) * 520 * dt;
    player.y += Math.sin(player.facing) * 520 * dt;
    if (player.time > 0.18) player.state = "idle";
  } else if (player.state === "attack") {
    for (const enemy of [...enemies]) {
      if (player.hit.has(enemy.id) || distance(player, enemy) > 105) continue;
      const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
      if (
        Math.cos(angle - player.facing) > 0.15 &&
        player.time > 0.06 &&
        player.time < 0.19
      ) {
        const amount = attackAtLevel(player.level);
        damage(enemy, amount);
        player.hit.add(enemy.id);
        enemy.hurt = 0.14;
        enemy.shake = 0.16;
        enemy.x += Math.cos(angle) * 18;
        enemy.y += Math.sin(angle) * 18;
        floaters.push({
          x: enemy.x,
          y: enemy.y - 35,
          text: `-${amount}`,
          color: enemy.elite ? "#ffe06a" : "#fff2d0",
          life: 0.75,
        });
        sfx.hit();
        if (enemy.hp <= 0) kill(enemy);
      }
    }
    if (player.time > 0.24) {
      player.state = "idle";
      if (input.attack) startAttack();
    }
  } else {
    const direction = normal(
      (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0),
      (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0),
    );
    player.moving = !!(direction.x || direction.y);
    player.x += direction.x * 210 * dt;
    player.y += direction.y * 210 * dt;
    if (input.dash) {
      Object.assign(player, { state: "dash", time: 0 });
      sfx.dash();
    } else if (input.attack) startAttack();
  }
  input.attack = input.dash = false;
  player.x = Math.max(70, Math.min(1210, player.x));
  player.y = Math.max(65, Math.min(655, player.y));
}
function startAttack() {
  Object.assign(player, { state: "attack", time: 0, hit: new Set() });
  sfx.attack();
}
function updateEnemies(dt) {
  for (const enemy of enemies) {
    enemy.hurt = Math.max(0, enemy.hurt - dt);
    enemy.shake = Math.max(0, enemy.shake - dt);
    enemy.facing = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    enemy.cooldown -= dt;
    enemy.time += dt;
    enemy.moving = false;
    const range = distance(player, enemy);
    if (enemy.state === "attack") {
      if (
        !enemy.hit &&
        enemy.time > 0.38 &&
        enemy.time < 0.55 &&
        range < (enemy.elite ? 120 : 100)
      ) {
        const amount = Math.round(RULES.enemyDamage * (enemy.elite ? 1.6 : 1));
        if (
          damage(
            player,
            amount,
            player.state === "dash" || player.hurtFlash > 0,
          )
        ) {
          enemy.hit = true;
          player.hurtFlash = 0.32;
          floaters.push({
            x: player.x,
            y: player.y - 38,
            text: `-${amount}`,
            color: "#ff6860",
            life: 0.8,
          });
          sfx.hurt();
        }
      }
      if (enemy.time > 0.7)
        Object.assign(enemy, {
          state: "idle",
          time: 0,
          cooldown: 0.65,
          hit: false,
        });
    } else if (range < (enemy.elite ? 110 : 95) && enemy.cooldown <= 0)
      Object.assign(enemy, { state: "attack", time: 0, hit: false });
    else {
      const direction = normal(player.x - enemy.x, player.y - enemy.y);
      enemy.moving = true;
      enemy.x += direction.x * (72 + wave * 2) * (enemy.elite ? 0.88 : 1) * dt;
      enemy.y += direction.y * (72 + wave * 2) * (enemy.elite ? 0.88 : 1) * dt;
    }
  }
}
function updateDrops(dt) {
  for (const drop of [...drops]) {
    drop.time += dt;
    if (distance(player, drop) < 55) {
      if (drop.type === "coin") {
        player.gold += drop.amount;
        sfx.coin();
      } else if (drop.type === "heal") {
        if (!addItem(inventory, createStack(POTION, 1))) {
          message = "背包已满，回血药留在地上";
          continue;
        }
        message = `获得回血药 · 背包共有 ${countItem(inventory, POTION.definitionId)} 个`;
        sfx.pickup();
      } else if (!addItem(inventory, drop.item)) {
        message = "背包已满，装备留在地上";
        continue;
      } else {
        message = `获得${drop.item.rarity}装备 · ${drop.item.name}`;
        sfx.pickup();
      }
      drops.splice(drops.indexOf(drop), 1);
    }
  }
}
function updateParticles(dt) {
  for (const p of particles) {
    p.life -= dt;
    p.vy += 260 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
  }
  particles = particles.filter((p) => p.life > 0);
}
function updateFloaters(dt) {
  for (const f of floaters) {
    f.life -= dt;
    f.y -= 45 * dt;
  }
  floaters = floaters.filter((f) => f.life > 0);
}
function update(dt) {
  updatePlayer(dt);
  updateEnemies(dt);
  updateDrops(dt);
  updateParticles(dt);
  updateFloaters(dt);
  if (player.hp <= 0) {
    message = "冒险失败 · 按 R 重试";
    sfx.defeat();
    return;
  }
  const inside = distance(player, spawnZone) < spawnZone.radius;
  if (inside && enemies.length < Math.min(4 + wave, 10)) {
    nextWave -= dt;
    if (nextWave <= 0) {
      spawnEnemy();
      nextWave = Math.max(0.65, 1.45 - wave * 0.06);
    }
  } else nextWave = Math.min(nextWave, 0.4);
}

function directionRow(angle) {
  return (Math.round(angle / (Math.PI / 4)) + 10) % 8;
}
function drawActor(actor, image, duration) {
  const scale = actor.elite ? 1.28 : 1,
    row = directionRow(actor.facing),
    column =
      actor.state === "attack"
        ? 6 + Math.min(5, Math.floor((actor.time / duration) * 6))
        : actor.moving
          ? 1 + (Math.floor(performance.now() / 140) % 4)
          : 0,
    shake = actor.shake ? Math.sin(actor.shake * 180) * 5 : 0;
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(actor.x, actor.y + 25, 15 * scale, 5.5 * scale, 0, 0, 7);
  ctx.fill();
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.globalAlpha = actor.hurt || actor.hurtFlash ? 0.65 : 1;
  if (actor.hurt) {
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 18;
  }
  ctx.drawImage(
    image,
    column * 32,
    row * 32,
    32,
    32,
    actor.x - 40 * scale + shake,
    actor.y - 40 * scale,
    80 * scale,
    80 * scale,
  );
  ctx.restore();
}
function bar(x, y, width, value, max, color) {
  ctx.fillStyle = "#080908dd";
  ctx.fillRect(x, y, width, 18);
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, ((width - 4) * value) / max, 14);
}
function rarityColumn(item) {
  return item?.rarity === "稀有" ? 2 : item?.rarity === "精良" ? 1 : 0;
}
function itemIcon(item, x, y, size = 32) {
  const potion = !item || item.type === "consumable",
    image = potion
      ? art.potions
      : item.type === "weapon"
        ? art.weapons
        : art.armours,
    sourceX = potion ? 64 : rarityColumn(item) * 16;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    sourceX,
    0,
    16,
    16,
    x - size / 2,
    y - size / 2,
    size,
    size,
  );
}
function drawItemDrops() {
  for (const drop of drops) {
    if (drop.type === "coin") continue;
    const bob = Math.sin(drop.time * 6) * 5,
      item = drop.item,
      color = item?.color || "#62e88a",
      rare = item?.rarity === "稀有",
      height = rare ? 82 : item?.rarity === "精良" ? 54 : 30;
    const glow = ctx.createLinearGradient(0, drop.y - height, 0, drop.y + 8);
    glow.addColorStop(0, "#0000");
    glow.addColorStop(1, `${color}aa`);
    ctx.fillStyle = glow;
    ctx.fillRect(
      drop.x - (rare ? 16 : 9),
      drop.y - height,
      rare ? 32 : 18,
      height,
    );
    ctx.globalAlpha = 0.55 + Math.sin(drop.time * 8) * 0.2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(drop.x, drop.y + 12, rare ? 24 : 16, rare ? 8 : 5, 0, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
    itemIcon(item, drop.x, drop.y + bob, 34);
  }
}
function drawSpawnZone() {
  const inside = distance(player, spawnZone) < spawnZone.radius;
  ctx.save();
  ctx.strokeStyle = inside ? "#d96262" : "#92514f";
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 10]);
  ctx.beginPath();
  ctx.arc(spawnZone.x, spawnZone.y, spawnZone.radius, 0, 7);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = "center";
  ctx.font = "bold 17px system-ui";
  ctx.fillStyle = inside ? "#ffaaa2" : "#d79891";
  ctx.fillText(
    inside ? "侵蚀区域 · 怪物持续生成" : "侵蚀区域 · 进入后开始生成",
    spawnZone.x,
    spawnZone.y - spawnZone.radius + 25,
  );
  ctx.fillStyle = "#102016";
  ctx.fillRect(520, 64, 240, 24);
  ctx.fillStyle = "#f0dfbd";
  ctx.font = "16px system-ui";
  ctx.fillText(`区域等级 ${wave}　场上 ${enemies.length}`, 640, 82);
  ctx.restore();
}
function drawMerchant() {
  merchant.facing = Math.atan2(player.y - merchant.y, player.x - merchant.x);
  drawActor(merchant, art.hero, 0.7);
  ctx.textAlign = "center";
  ctx.font = "bold 15px system-ui";
  ctx.fillStyle = "#ffd977";
  ctx.fillText(merchant.name, merchant.x, merchant.y - 47);
  if (distance(player, merchant) < 105 && !merchantOpen) {
    ctx.fillStyle = "#17140fe8";
    ctx.fillRect(merchant.x - 72, merchant.y + 42, 144, 30);
    ctx.strokeStyle = "#b68b4c";
    ctx.strokeRect(merchant.x - 72, merchant.y + 42, 144, 30);
    ctx.fillStyle = "#f5e4bc";
    ctx.font = "15px system-ui";
    ctx.fillText("[E] 交谈", merchant.x, merchant.y + 63);
  }
}
function drawMerchantPanel() {
  if (!merchantOpen) return;
  ctx.fillStyle = "#050706dd";
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = "#17140ff2";
  ctx.fillRect(410, 120, 460, 480);
  ctx.strokeStyle = "#b68b4c";
  ctx.lineWidth = 3;
  ctx.strokeRect(410, 120, 460, 480);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ead5a5";
  ctx.font = "bold 28px Georgia";
  ctx.fillText("灰篷商人的收购铺", 640, 165);
  ctx.fillStyle = "#a99878";
  ctx.font = "15px system-ui";
  ctx.fillText(
    "点击背包装备出售 · 已穿戴装备不会出售 · [E/Esc] 关闭",
    640,
    195,
  );
  for (let cell = 0; cell < 20; cell++) {
    const col = cell % 5,
      row = Math.floor(cell / 5),
      x = 460 + col * 62,
      y = 275 + row * 62,
      item = inventory.slots[cell];
    ctx.fillStyle = "#24231f";
    ctx.fillRect(x, y, 54, 54);
    ctx.strokeStyle = item?.color || "#514b40";
    ctx.strokeRect(x, y, 54, 54);
    if (item) {
      itemIcon(item, x + 27, y + 27);
      ctx.fillStyle = "#f0cf67";
      ctx.font = "bold 11px system-ui";
      ctx.fillText(`${itemSellValue(item)} 金`, x + 27, y + 50);
    }
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "#d9bb67";
  ctx.font = "bold 17px system-ui";
  ctx.fillText(`持有金币：${player.gold}`, 460, 545);
  ctx.fillStyle = "#6b351f";
  ctx.fillRect(690, 515, 130, 45);
  ctx.strokeStyle = "#d5ae68";
  ctx.strokeRect(690, 515, 130, 45);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe4a3";
  ctx.font = "bold 16px system-ui";
  ctx.fillText("一键全部出售", 755, 544);
}
function draw() {
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < 720; y += 64)
    for (let x = 0; x < 1280; x += 64)
      ctx.drawImage((x + y) % 128 ? art.dirt : art.grass, x, y, 64, 64);
  for (const [x, y] of [
    [10, 5],
    [1150, 5],
    [10, 585],
    [1150, 585],
  ])
    ctx.drawImage(art.tree, x, y, 128, 128);
  ctx.fillStyle = "#06100a30";
  ctx.fillRect(0, 0, 1280, 720);
  for (const drop of drops) {
    const bob = Math.sin(drop.time * 6) * 5;
    ctx.fillStyle = drop.type === "coin" ? "#ffd54d" : "#52dc78";
    ctx.beginPath();
    ctx.arc(drop.x, drop.y + bob, drop.type === "coin" ? 9 : 11, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff9";
    ctx.fillRect(drop.x - 2, drop.y + bob - 6, 4, 12);
    if (drop.type === "heal") ctx.fillRect(drop.x - 6, drop.y + bob - 2, 12, 4);
  }
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 1.7);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  for (const enemy of enemies) {
    drawActor(enemy, art[enemy.art], 0.7);
    bar(
      enemy.x - (enemy.elite ? 42 : 28),
      enemy.y - (enemy.elite ? 62 : 42),
      enemy.elite ? 84 : 56,
      enemy.hp,
      enemy.maxHp,
      enemy.elite ? "#d1872f" : "#a43732",
    );
    if (enemy.elite) {
      ctx.textAlign = "center";
      ctx.font = "bold 15px system-ui";
      ctx.fillStyle = "#ffd977";
      ctx.fillText(enemy.name, enemy.x, enemy.y - 68);
    }
  }
  if (player.hp) drawActor(player, art.hero, 0.24);
  for (const f of floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 2);
    ctx.textAlign = "center";
    ctx.font = "bold 22px system-ui";
    ctx.strokeStyle = "#24150d";
    ctx.lineWidth = 4;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  bar(32, 30, 300, player.hp, player.maxHp, "#b43e3b");
  bar(32, 52, 260, player.xp, xpNeeded(player.level), "#4e84c4");
  ctx.fillStyle = "#f4d45a";
  ctx.font = "bold 19px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(
    `Lv.${player.level}　攻击 ${attackAtLevel(player.level)}　金币 ${player.gold}`,
    35,
    94,
  );
  ctx.fillStyle = "#75e49a";
  ctx.fillText(`背包：回血药 × ${player.potions}　[Q] 使用`, 35, 121);
  ctx.fillStyle = "#f0dfbd";
  ctx.textAlign = "center";
  ctx.font = "22px Georgia";
  ctx.fillText(message, 640, 54);
  ctx.font = "16px system-ui";
  ctx.fillText(`第 ${wave} 波　剩余 ${enemies.length}`, 640, 82);
}
function drawGm() {
  if (!gmEnabled) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 14px system-ui";
  ctx.fillStyle = "#c43b36";
  ctx.fillRect(1160, 14, 100, 30);
  ctx.fillStyle = "#fff";
  ctx.fillText("GM MODE · F1", 1210, 35);
  if (gmOpen) {
    ctx.fillStyle = "#050706ee";
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = "#17140f";
    ctx.fillRect(210, 90, 860, 555);
    ctx.strokeStyle = "#d75c50";
    ctx.lineWidth = 3;
    ctx.strokeRect(210, 90, 860, 555);
    ctx.fillStyle = "#ffe0b0";
    ctx.font = "bold 28px system-ui";
    ctx.fillText("GM 控制台", 640, 135);
    ctx.font = "14px system-ui";
    ctx.fillStyle = "#a99878";
    ctx.fillText("F1 关闭 · 游戏已暂停 · 所有操作记录在本次会话日志", 640, 160);
    gmButtons.forEach(([label], i) => {
      const col = i % 5,
        row = Math.floor(i / 5),
        x = 250 + col * 160,
        y = 180 + row * 55;
      ctx.fillStyle = "#342921";
      ctx.fillRect(x, y, 145, 40);
      ctx.strokeStyle = "#8c6650";
      ctx.strokeRect(x, y, 145, 40);
      ctx.fillStyle = "#f4dfbd";
      ctx.fillText(label, x + 72, y + 25);
    });
    ctx.textAlign = "left";
    ctx.fillStyle = "#d75c50";
    ctx.font = "bold 15px monospace";
    ctx.fillText(
      `god=${gm.context.god}  aiPaused=${gm.context.aiPaused}`,
      250,
      425,
    );
    ctx.fillStyle = "#d8d2c4";
    ctx.font = "13px monospace";
    gm.logs
      .slice(0, 7)
      .forEach((log, i) =>
        ctx.fillText(
          `${log.ok ? "✓" : "×"} ${log.command} → ${log.result}`,
          250,
          460 + i * 23,
        ),
      );
  }
  ctx.restore();
}
function drawInventoryV2() {
  if (!inventoryOpen) return;
  ctx.save();
  ctx.fillStyle = "#050706e8";
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = "#17140ff5";
  ctx.fillRect(300, 90, 680, 555);
  ctx.strokeStyle = "#b68b4c";
  ctx.lineWidth = 3;
  ctx.strokeRect(300, 90, 680, 555);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ead5a5";
  ctx.font = "bold 28px Georgia";
  ctx.fillText("旅者背包", 640, 132);
  ctx.font = "13px system-ui";
  ctx.fillStyle = "#a99878";
  ctx.fillText(
    "拖放换位/合并 · 双击使用/装备 · Shift+点击拆分 · Alt+点击锁定 · 右键标记废品",
    640,
    158,
  );
  const filters = [
    ["全部", "all", 340, 75],
    ["武器", "weapon", 425, 75],
    ["护甲", "armor", 510, 75],
    ["药品", "consumable", 595, 95],
  ];
  for (const [label, key, x, w] of filters) {
    ctx.fillStyle = inventoryFilter === key ? "#76512f" : "#29231c";
    ctx.fillRect(x, 190, w, 38);
    ctx.strokeStyle = "#70573b";
    ctx.strokeRect(x, 190, w, 38);
    ctx.fillStyle = "#ead5a5";
    ctx.fillText(label, x + w / 2, 214);
  }
  for (const [label, x] of [["品质排序", 710]]) {
    ctx.fillStyle = "#3b3024";
    ctx.fillRect(x, 190, 80, 38);
    ctx.strokeRect(x, 190, 80, 38);
    ctx.fillStyle = "#ead5a5";
    ctx.fillText(label, x + 40, 214);
  }
  const visible = new Set(
    filteredSlots(inventory, inventoryFilter).map((e) => e.index),
  );
  for (let i = 0; i < 20; i++) {
    const col = i % 5,
      row = Math.floor(i / 5),
      x = 360 + col * 64,
      y = 250 + row * 64,
      item = inventory.slots[i];
    ctx.globalAlpha = inventoryFilter === "all" || visible.has(i) ? 1 : 0.18;
    ctx.fillStyle = "#24231f";
    ctx.fillRect(x, y, 56, 56);
    ctx.strokeStyle = item?.color || "#514b40";
    ctx.lineWidth = item?.rarity === "稀有" ? 3 : 1;
    ctx.strokeRect(x, y, 56, 56);
    if (item) {
      itemIcon(item, x + 28, y + 28, 34);
      if (item.quantity) {
        ctx.fillStyle = "#080908dd";
        ctx.fillRect(x + 31, y + 38, 23, 16);
        ctx.fillStyle = "#fff1cc";
        ctx.font = "bold 12px system-ui";
        ctx.fillText(item.quantity, x + 43, y + 51);
      }
      if (item.new) {
        ctx.fillStyle = "#eac85a";
        ctx.beginPath();
        ctx.arc(x + 49, y + 8, 5, 0, 7);
        ctx.fill();
      }
      if (item.locked) {
        ctx.fillStyle = "#f1c95a";
        ctx.font = "14px system-ui";
        ctx.fillText("🔒", x + 9, y + 16);
      }
      if (item.junk) {
        ctx.fillStyle = "#e85c50";
        ctx.font = "bold 12px system-ui";
        ctx.fillText("废", x + 47, y + 16);
      }
    }
  }
  ctx.globalAlpha = 1;
  const hover = inventorySlotAt(input.x, input.y),
    item = inventory.slots[hover];
  if (item) {
    item.new = false;
    ctx.textAlign = "left";
    ctx.fillStyle = "#0c0d0cf2";
    ctx.fillRect(700, 460, 245, 150);
    ctx.strokeStyle = item.color || "#777";
    ctx.strokeRect(700, 460, 245, 150);
    ctx.fillStyle = item.color || "#eee";
    ctx.font = "bold 18px system-ui";
    ctx.fillText(
      `${item.name}${item.quantity ? ` × ${item.quantity}` : ""}`,
      720,
      490,
    );
    ctx.fillStyle = "#c9b99b";
    ctx.font = "14px system-ui";
    ctx.fillText(
      `${item.rarity} · ${item.type === "weapon" ? "武器" : item.type === "armor" ? "护甲" : "消耗品"}`,
      720,
      516,
    );
    if (item.type === "weapon") {
      const old = inventory.equipment.weapon?.attack || 0,
        delta = item.attack - old;
      ctx.fillText(`攻击 +${item.attack}`, 720, 544);
      ctx.fillStyle = delta >= 0 ? "#63d58a" : "#e56b61";
      ctx.fillText(`相比已装备 ${delta >= 0 ? "+" : ""}${delta}`, 720, 570);
    } else if (item.type === "armor") {
      const old = inventory.equipment.armor?.maxHp || 0,
        delta = item.maxHp - old;
      ctx.fillText(`最大生命 +${item.maxHp}`, 720, 544);
      ctx.fillStyle = delta >= 0 ? "#63d58a" : "#e56b61";
      ctx.fillText(`相比已装备 ${delta >= 0 ? "+" : ""}${delta}`, 720, 570);
    } else
      ctx.fillText(
        `使用后恢复 ${item.heal} 生命 · 每格上限 ${item.stackMax}`,
        720,
        544,
      );
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "#d9bb67";
  ctx.font = "16px system-ui";
  ctx.fillText(
    `金币 ${player.gold}　药水总数 ${countItem(inventory, POTION.definitionId)}　空格 ${inventory.slots.filter((x) => !x).length}/20`,
    360,
    535,
  );
  const weapon = inventory.equipment.weapon,
    armor = inventory.equipment.armor;
  ctx.fillStyle = "#d8d2c4";
  ctx.font = "14px system-ui";
  ctx.fillText(
    `已装备：${weapon ? `${weapon.name} 攻击+${weapon.attack}` : "无武器"}　|　${armor ? `${armor.name} 生命+${armor.maxHp}` : "无护甲"}`,
    360,
    565,
  );
  ctx.fillStyle = "#a99878";
  ctx.fillText("[B / Esc] 关闭", 360, 600);
  ctx.restore();
}
function drawInventoryHud() {
  ctx.fillStyle = "#06100ae8";
  ctx.fillRect(30, 100, 330, 28);
  ctx.fillStyle = "#75e49a";
  ctx.textAlign = "left";
  ctx.font = "bold 19px system-ui";
  ctx.fillText(
    `背包：回血药 × ${countItem(inventory, POTION.definitionId)}　[Q] 使用`,
    35,
    121,
  );
}
function drawMerchantJunk() {
  if (!merchantOpen) return;
  ctx.fillStyle = "#493b25";
  ctx.fillRect(545, 515, 130, 45);
  ctx.strokeStyle = "#d5ae68";
  ctx.strokeRect(545, 515, 130, 45);
  ctx.fillStyle = "#ffe4a3";
  ctx.textAlign = "center";
  ctx.font = "bold 16px system-ui";
  ctx.fillText("出售废品", 610, 544);
}
function drawDraggedItem() {
  const item = inventory.slots[dragSlot];
  if (!inventoryOpen || dragSlot < 0 || !item) return;
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#24231f";
  ctx.fillRect(input.x - 30, input.y - 30, 60, 60);
  ctx.strokeStyle = item.color || "#d8d2c4";
  ctx.lineWidth = 3;
  ctx.strokeRect(input.x - 30, input.y - 30, 60, 60);
  itemIcon(item, input.x, input.y, 42);
  if (item.quantity) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#080908dd";
    ctx.fillRect(input.x + 4, input.y + 10, 25, 18);
    ctx.fillStyle = "#fff1cc";
    ctx.textAlign = "center";
    ctx.font = "bold 13px system-ui";
    ctx.fillText(item.quantity, input.x + 16, input.y + 24);
  }
  ctx.restore();
}
const drawWorld = draw;
draw = () => {
  if (currentSceneId === SCENE.VILLAGE_WAKE) {
    drawVillageWakeScene(ctx, villageScene, player, art, performance.now());
    drawGm();
    return;
  }
  drawWorld();
  drawInventoryHud();
  drawMerchant();
  drawSpawnZone();
  drawItemDrops();
  drawInventoryV2();
  drawDraggedItem();
  drawMerchantPanel();
  drawMerchantJunk();
  drawGm();
};
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  if (currentSceneId === SCENE.VILLAGE_WAKE) {
    if (!gmOpen) updateVillageWakeScene(villageScene, dt, player, keys);
  } else if (!merchantOpen && !gmOpen && !inventoryOpen) {
    if (player.hp > 0) {
      if (gm.context.aiPaused) {
        updatePlayer(dt);
        updateDrops(dt);
        updateParticles(dt);
        updateFloaters(dt);
      } else update(dt);
      if (gm.context.god) player.hp = player.maxHp;
    } else {
      updateParticles(dt);
      updateFloaters(dt);
    }
  }
  draw();
  if (running) requestAnimationFrame(loop);
}
reset();
draw();
