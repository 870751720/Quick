let context;
const ctx=()=>context??=new AudioContext();
export function unlockAudio(){const c=ctx();if(c.state==='suspended')c.resume()}
function tone(from,to,duration,type='sine',gain=.08,delay=0){const c=ctx(),o=c.createOscillator(),g=c.createGain(),start=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(from,start);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),start+duration);g.gain.setValueAtTime(gain,start);g.gain.exponentialRampToValueAtTime(.001,start+duration);o.connect(g).connect(c.destination);o.start(start);o.stop(start+duration)}
export const sfx={
  attack(){tone(520,110,.13,'sawtooth',.045)},
  hit(){tone(120,45,.11,'square',.09);tone(900,180,.07,'sawtooth',.025)},
  dash(){tone(240,70,.1,'triangle',.035)},
  hurt(){tone(170,55,.2,'sawtooth',.07)},
  victory(){tone(330,440,.18,'triangle',.05);tone(440,660,.28,'triangle',.05,.16)},
  defeat(){tone(180,120,.25,'triangle',.06);tone(120,55,.45,'sawtooth',.045,.2)}
};
