import test from'node:test';
import assert from'node:assert/strict';
import{createInventory,createGear,addItem,equipItem,equipmentAttack,equipmentHp}from'../src/inventory.js';
test('装备进入第一个空背包格',()=>{const bag=createInventory(2),gear=createGear('weapon',1,()=>0);assert.equal(addItem(bag,gear),true);assert.equal(bag.slots[0],gear)});
test('背包满时拒绝新物品',()=>{const bag=createInventory(1);addItem(bag,{type:'weapon'});assert.equal(addItem(bag,{type:'armor'}),false)});
test('点击装备后穿戴并将旧装备换回原格',()=>{const bag=createInventory(),first={type:'weapon',attack:3},next={type:'weapon',attack:7};addItem(bag,first);equipItem(bag,0);bag.slots[0]=next;equipItem(bag,0);assert.equal(bag.equipment.weapon,next);assert.equal(bag.slots[0],first);assert.equal(equipmentAttack(bag),7);assert.equal(equipmentHp(bag),0)});
