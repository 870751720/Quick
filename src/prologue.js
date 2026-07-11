export const PROLOGUE_SCENES = Object.freeze([
  { id: "dark", kicker: "", text: "……好饿。", thought: "肚子饿饿的。", duration: 2600 },
  { id: "wake", kicker: "陌生的清晨", text: "风穿过麦田。远处有人生火，面包的香气顺着烟飘过来。", thought: "这不是我的手。", duration: 5200 },
  { id: "body", kicker: "村外 · 破屋", text: "这具身体记得怎样弯腰，怎样握住锄头，也记得饿着肚子入睡。", thought: "可它不记得，自己为什么会倒在这里。", duration: 5600 },
  { id: "choice", kicker: "第一幕 · 饥饿", text: "村里有食物。商店里有种子。窗台上，也放着没人看守的面包。", thought: "先想办法填饱肚子。", duration: 6200 },
]);
export function createPrologue(root, { onFinish, onScene } = {}) {
  const kicker=root.querySelector('.prologue-kicker'),text=root.querySelector('.prologue-text'),thought=root.querySelector('.prologue-thought'),progress=root.querySelector('.prologue-progress');let index=0,timer=0,active=false;
  const show=()=>{const scene=PROLOGUE_SCENES[index];root.dataset.scene=scene.id;kicker.textContent=scene.kicker;text.textContent=scene.text;thought.textContent=scene.thought;progress.style.setProperty('--progress',`${(index+1)/PROLOGUE_SCENES.length*100}%`);onScene?.(scene,index);clearTimeout(timer);timer=setTimeout(next,scene.duration)};
  const next=()=>{if(!active)return;if(++index<PROLOGUE_SCENES.length)show();else finish()};
  const finish=()=>{if(!active)return;active=false;clearTimeout(timer);root.classList.add('hidden');root.setAttribute('aria-hidden','true');onFinish?.()};
  root.querySelector('.prologue-next').onclick=next;root.querySelector('.prologue-skip').onclick=finish;
  return{start(){index=0;active=true;root.classList.remove('hidden');root.setAttribute('aria-hidden','false');show()},next,finish,get active(){return active}};
}
