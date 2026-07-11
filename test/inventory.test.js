import test from'node:test';
import assert from'node:assert/strict';
import{RARITIES,createInventory,createGear,addItem,equipItem,itemSellValue,sellItem,sellAll,equipmentAttack,equipmentHp}from'../src/inventory.js';
test('装备进入第一个空背包格',()=>{const bag=createInventory(2),gear=createGear('weapon',1,()=>0);assert.equal(addItem(bag,gear),true);assert.equal(bag.slots[0],gear)});
test('背包满时拒绝新物品',()=>{const bag=createInventory(1);addItem(bag,{type:'weapon'});assert.equal(addItem(bag,{type:'armor'}),false)});
test('点击装备后穿戴并将旧装备换回原格',()=>{const bag=createInventory(),first={type:'weapon',attack:3},next={type:'weapon',attack:7};addItem(bag,first);equipItem(bag,0);bag.slots[0]=next;equipItem(bag,0);assert.equal(bag.equipment.weapon,next);assert.equal(bag.slots[0],first);assert.equal(equipmentAttack(bag),7);assert.equal(equipmentHp(bag),0)});
test('稀有装备使用紫色品质表现',()=>assert.equal(RARITIES[2].color,'#b76cff'));
test('出售单件装备会清空格子并返回售价',()=>{const bag=createInventory(2),item={type:'weapon',attack:5,rarity:'普通'};addItem(bag,item);assert.deepEqual(sellItem(bag,0),{gold:15,item});assert.equal(bag.slots[0],null)});
test('一键出售只清空背包而不出售已穿戴装备',()=>{const bag=createInventory(3),equipped={type:'weapon',attack:5,rarity:'普通'};bag.equipment.weapon=equipped;addItem(bag,{type:'armor',maxHp:8,rarity:'普通'});addItem(bag,{type:'weapon',attack:4,rarity:'精良'});assert.deepEqual(sellAll(bag),{gold:32,count:2});assert.equal(bag.equipment.weapon,equipped);assert.ok(bag.slots.every(item=>item===null));assert.equal(itemSellValue(null),0)});
