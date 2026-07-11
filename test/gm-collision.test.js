import test from "node:test";
import assert from "node:assert/strict";
import { createGmRegistry } from "../src/gm.js";

const context = () => ({ player: { hp: 1, maxHp: 1, gold: 0, potions: 0 }, collisionDebug: false, setLevel:()=>'', giveGear:()=>'', spawn:()=>'', clearEnemies:()=>'', teleport:()=>'', preset:()=>'' });

test("collision GM 指令支持开关和切换", () => {
  const gm = createGmRegistry(context());
  gm.execute("collision on"); assert.equal(gm.context.collisionDebug, true);
  gm.execute("collision off"); assert.equal(gm.context.collisionDebug, false);
  gm.execute("collision"); assert.equal(gm.context.collisionDebug, true);
});
