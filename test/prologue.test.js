import test from "node:test";
import assert from "node:assert/strict";
import { PROLOGUE_SCENES } from "../src/prologue.js";
test("第一幕过场具有完整且唯一的分镜",()=>{assert.equal(PROLOGUE_SCENES.length,4);assert.equal(new Set(PROLOGUE_SCENES.map(scene=>scene.id)).size,4);assert.ok(PROLOGUE_SCENES.every(scene=>scene.text&&scene.thought&&scene.duration>=2000))});
test("过场以饥饿开场并以生存目标结束",()=>{assert.match(PROLOGUE_SCENES[0].thought,/饿/);assert.match(PROLOGUE_SCENES.at(-1).thought,/填饱肚子/)});
