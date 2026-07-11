export const INVENTORY_SIZE=20;
export const RARITIES=[
  {name:'普通',color:'#d8d2c4',multiplier:1},
  {name:'精良',color:'#63d58a',multiplier:1.45},
  {name:'稀有',color:'#b76cff',multiplier:2}
];
const NAMES={weapon:['缺口短剑','兽骨战斧','荒原长剑'],armor:['旧皮甲','兽皮战衣','赤铁胸甲']};
export function createInventory(size=INVENTORY_SIZE){return{slots:Array(size).fill(null),equipment:{weapon:null,armor:null}}}
export function createGear(type,wave=1,roll=Math.random){const rarityIndex=roll()>.92?2:roll()>.68?1:0,rarity=RARITIES[rarityIndex],tier=Math.max(1,Math.ceil(wave/2)),value=Math.round((type==='weapon'?3:8)*tier*rarity.multiplier);return{id:`${type}-${Date.now()}-${Math.floor(roll()*1e6)}`,type,name:NAMES[type][Math.min(2,tier-1)],rarity:rarity.name,color:rarity.color,attack:type==='weapon'?value:0,maxHp:type==='armor'?value:0}}
export function addItem(inventory,item){const index=inventory.slots.indexOf(null);if(index<0)return false;inventory.slots[index]=item;return true}
export function equipItem(inventory,index){const item=inventory.slots[index];if(!item||!['weapon','armor'].includes(item.type))return null;const previous=inventory.equipment[item.type];inventory.equipment[item.type]=item;inventory.slots[index]=previous;return{item,previous}}
export function itemSellValue(item){if(!item)return 0;const rarity=item.rarity==='稀有'?3:item.rarity==='精良'?2:1;return Math.max(3,Math.round(((item.attack||0)*3+(item.maxHp||0))*rarity))}
export function sellItem(inventory,index){const item=inventory.slots[index];if(!item)return{gold:0,item:null};inventory.slots[index]=null;return{gold:itemSellValue(item),item}}
export function sellAll(inventory){let gold=0,count=0;for(let i=0;i<inventory.slots.length;i++){const sold=sellItem(inventory,i);if(sold.item){gold+=sold.gold;count++}}return{gold,count}}
export const equipmentAttack=inventory=>inventory.equipment.weapon?.attack||0;
export const equipmentHp=inventory=>inventory.equipment.armor?.maxHp||0;
