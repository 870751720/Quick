let context, master;
let menuMusic;
const ctx=()=>{if(!context){context=new AudioContext();master=context.createGain();master.connect(context.destination);applyAudioSettings()}return context};
const settings=()=>{try{return JSON.parse(localStorage.getItem('codename-world.audio')||'{}')}catch{return {}}};
function applyAudioSettings(){if(!master)return;const value=settings();master.gain.value=value.muted?0:Math.max(0,Math.min(1,value.volume??.7))}
export function setAudioSettings(value){localStorage.setItem('codename-world.audio',JSON.stringify(value));applyAudioSettings()}
export function getAudioSettings(){const value=settings();return {volume:value.volume??.7,muted:!!value.muted}}
export function unlockAudio(){const c=ctx();if(c.state==='suspended')c.resume()}
function tone(from,to,duration,type='sine',gain=.08,delay=0){const c=ctx(),o=c.createOscillator(),g=c.createGain(),start=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(from,start);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),start+duration);g.gain.setValueAtTime(gain,start);g.gain.exponentialRampToValueAtTime(.001,start+duration);o.connect(g).connect(master);o.start(start);o.stop(start+duration)}
export const sfx={
  menuHover(){tone(310,360,.055,'sine',.018)},
  menuSelect(){tone(260,520,.16,'triangle',.035);tone(390,780,.18,'sine',.022,.06)},
  attack(){tone(520,110,.13,'sawtooth',.045)},
  hit(){tone(120,45,.11,'square',.09);tone(900,180,.07,'sawtooth',.025)},
  dash(){tone(240,70,.1,'triangle',.035)},
  hurt(){tone(170,55,.2,'sawtooth',.07)},
  drop(){tone(760,420,.09,'square',.025);tone(980,520,.12,'triangle',.025,.05)},
  coin(){tone(880,1320,.1,'square',.035);tone(1320,1760,.08,'triangle',.025,.07)},
  heal(){tone(420,720,.18,'sine',.05);tone(620,980,.24,'triangle',.035,.1)},
  pickup(){tone(520,760,.12,'triangle',.035)},
  level(){tone(330,660,.18,'square',.04);tone(520,1040,.24,'triangle',.05,.14);tone(780,1560,.3,'sine',.04,.3)},
  victory(){tone(330,440,.18,'triangle',.05);tone(440,660,.28,'triangle',.05,.16)},
  defeat(){tone(180,120,.25,'triangle',.06);tone(120,55,.45,'sawtooth',.045,.2)}
};
export function startMenuMusic(){
  if(menuMusic)return;
  const c=ctx(),bus=c.createGain(),filter=c.createBiquadFilter();
  bus.gain.value=.055;filter.type='lowpass';filter.frequency.value=1250;bus.connect(filter).connect(master);
  let step=0;
  const notes=[110,146.83,164.81,130.81,110,146.83,196,164.81];
  const play=()=>{const now=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=notes[step++%notes.length];g.gain.setValueAtTime(.001,now);g.gain.linearRampToValueAtTime(.55,now+.25);g.gain.exponentialRampToValueAtTime(.001,now+2.8);o.connect(g).connect(bus);o.start(now);o.stop(now+2.9)};
  play();menuMusic={timer:setInterval(play,1600),bus};
}
export function stopMenuMusic(){if(!menuMusic)return;clearInterval(menuMusic.timer);menuMusic.bus.gain.setTargetAtTime(.001,ctx().currentTime,.35);menuMusic=null}
