import test from "node:test";import assert from "node:assert/strict";import{HUNGER_RULES,updateHunger}from"../src/hunger.js";
test("饥饿随时间增长并限制在百分百",()=>{const actor={hunger:HUNGER_RULES.start};assert.ok(updateHunger(actor,10)>HUNGER_RULES.start);actor.hunger=99.9;updateHunger(actor,10);assert.equal(actor.hunger,100)});
test("旧存档缺少饥饿值时使用初始值",()=>{const actor={};updateHunger(actor,0);assert.equal(actor.hunger,HUNGER_RULES.start)});
