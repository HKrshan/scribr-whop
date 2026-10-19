import test from 'node:test';
import assert from 'node:assert/strict';
import {frameAt} from '../web/src/scene/frames.js';
import {createScene} from '../web/src/scene/controller.js';

test('elapsed playback hits cells and clamps finite clips',()=>{
  const clip={frames:[0,1,2,3,4,5],fps:8,loop:true,motion:true};
  assert.equal(frameAt(0,clip),0); assert.equal(frameAt(.625,clip),5);
  assert.equal(frameAt(.75,clip),0); assert.equal(frameAt(10,{...clip,loop:false}),5);
  assert.equal(frameAt(-1,clip),0);
});

function fixture(){
  const listeners=new Map(),ticks=new Set(),observers=[],timelines=[],mediaCallbacks=[];
  const node=()=>({replaceChildren(...children){this.children=children;this.textContent=children.map(child=>child.textContent).join('');},style:{setProperty(){}},dataset:{},textContent:'',hidden:false,setAttribute(){},getBoundingClientRect:()=>({left:0,top:0,width:600,height:400})});
  const nodes={};
  const doc={createElement:()=>node(),createTextNode:text=>({textContent:text}),hidden:false,addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n),defaultView:{addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n)}};
  class Observer{constructor(cb){this.cb=cb;this.alive=true;observers.push(this);}observe(){}disconnect(){this.alive=false;}}
  doc.defaultView.ResizeObserver=Observer;doc.defaultView.IntersectionObserver=Observer;
  const root={...node(),ownerDocument:doc,querySelector:s=>nodes[s]??=(node()),querySelectorAll:()=>[]};
  const gsap={ticker:{add:f=>ticks.add(f),remove:f=>ticks.delete(f)},set(){},matchMedia:()=>({add(queries,callback){mediaCallbacks.push(callback);},revert(){}}),timeline(options){let time=0;const t={options,calls:[],to(){return this;},call(callback){this.calls.push(callback);return this;},kill(){},pause(){},resume(){},time(value){if(value!==undefined){time=value;return this;}return time;}};timelines.push(t);return t;}};
  const atlas={cell:{width:128,height:128,columns:4,rows:4,anchorX:.5,anchorY:.875},clips:Object.fromEntries(['idle','walk','work','present','reaction'].map(k=>[k,{frames:[0,1],fps:4,loop:true,motion:true}]))};
  const scene=createScene({root,gsap,atlas,demo:{original:'source',translation:'translated',targetLanguage:'es',answer:'answer'},theme:'light',reducedMotion:false});
  return {scene,nodes,listeners,ticks,observers,timelines,doc,root,mediaCallbacks};
}
test('cancel invalidates callbacks and disposal owns all resources',()=>{
  const f=fixture();f.scene.play();const old=f.timelines.at(-1).options.onComplete;
  f.scene.cancel();old();assert.equal(f.nodes['[data-demo-status]'].textContent,'Demo cancelled. Replay whenever you like.');
  f.scene.dispose();f.scene.dispose();assert.equal(f.ticks.size,0);assert.equal(f.listeners.size,0);assert.ok(f.observers.every(o=>!o.alive));
});

test('resize invalidates superseded route actions and retains active clock',()=>{
  const f=fixture();f.scene.play();const old=f.timelines.at(-1);
  [...f.ticks][0](0,80);f.observers[0].cb();
  old.calls[4]();
  assert.equal(f.nodes['[data-demo-output]'].textContent,'source','old question callback cannot replace current caption');
  assert.equal(f.timelines.at(-1).time(),.08,'reflow preserves active seconds');
  f.scene.dispose();
});

test('offscreen and user pause retain the clock, reduced motion chooses static demo',()=>{
  const f=fixture();f.scene.play();const tick=[...f.ticks][0];
  tick(0,80);f.observers[1].cb([{isIntersecting:false}]);tick(90,89000);
  assert.equal(f.timelines.at(-1).time(),.08);
  f.scene.pause();f.observers[1].cb([{isIntersecting:true}]);tick(91,50);
  assert.equal(f.timelines.at(-1).time(),.08);
  f.scene.resume();tick(92,50);assert.equal(f.timelines.at(-1).time(),.13);
  f.mediaCallbacks[0]({conditions:{reduce:true}});f.scene.play();
  assert.equal(f.root.dataset.static,'true');assert.match(f.nodes['[data-demo-output]'].textContent,/translated.*answer/);
  assert.equal(f.nodes['[data-demo-output]'].children[0].lang,'es');
  assert.equal(f.nodes['[data-demo-output]'].children[2].lang,'en');
  f.scene.dispose();
});
test('hidden clock time never advances poses; user pause survives visibility',()=>{
  const f=fixture();f.scene.play();const tick=[...f.ticks][0];tick(0,16);tick(1,250);
  const before=f.nodes['[data-actor-pose]'].style.backgroundPosition;
  f.doc.hidden=true;f.listeners.get('visibilitychange')();tick(90,89000);
  assert.equal(f.nodes['[data-actor-pose]'].style.backgroundPosition,before);
  f.scene.pause();f.doc.hidden=false;f.listeners.get('visibilitychange')();tick(91,1000);
  assert.equal(f.nodes['[data-actor-pose]'].style.backgroundPosition,before);f.scene.dispose();
});
