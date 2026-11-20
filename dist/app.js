import * as THREE from 'three';
import {catalogue, createStudio} from '/sculptures.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const heroHost = $('#hero-render');
const dialog = $('#inspector');
const stage = $('#inspect-stage');
const status = $('#scene-status');
let renderer,scene,camera,objects,materials,envWarm,envCool,rig,rim;
let current=0,inInspector=false,paused=reducedMotion.matches,heroVisible=true,dirty=true,wireframe=false;
let pointer=null,lastTrigger=null,lastTime=0;
// Motion state: intro (lights come up), object swap, drag inertia and hero pointer tilt.
const EXPOSURE=.95;
const ease=t=>1-Math.pow(1-t,4);
let introStart=-1,swapStart=-1,spin={x:0,y:0};
const tilt={x:0,y:0,tx:0,ty:0};
const gradeColor=new THREE.Color(),gradeTarget=new THREE.Color();
const heroLabel='Interactive Fibre sculpture. Drag or use arrow keys to rotate. Spins automatically when released. Home resets the view.';
const baseRotation=new THREE.Euler();

function applyMaterial(name){
  objects[current].traverse(o=>{if(o.isMesh)o.material=materials[name];});
  Object.values(materials).forEach(m=>m.wireframe=wireframe);
  $$('#material-choices button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.material===name)));
  dirty=true;announce(`${catalogue[current].name}, ${name} surface`);
}
function setAtmosphere(name){
  scene.environment=name==='cool'?envCool:envWarm;stage.dataset.light=name;
  $$('#light-choices button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.light===name)));dirty=true;
}
function setObject(index){
  current=(index+catalogue.length)%catalogue.length;
  objects.forEach((obj,i)=>{obj.visible=i===current;});
  wireframe=false;$('#wire-toggle').setAttribute('aria-pressed','false');$('#wire-toggle').innerHTML='View wireframe <span>⌗</span>';
  const data=catalogue[current];
  objects[current].rotation.set(...data.rotation);baseRotation.copy(objects[current].rotation);
  $('#inspect-title').textContent=data.name;$('#inspect-number').textContent=String(current+1).padStart(3,'0');$('#object-position').textContent=`0${current+1} / 03`;$('#inspect-description').textContent=data.description;
  applyMaterial(data.material);setAtmosphere('warm');
  gradeTarget.setHex(data.grade);dialog.style.setProperty('--grade',data.css);
  spin.x=spin.y=0;
  if(inInspector&&!reducedMotion.matches){swapStart=performance.now();const t=$('#inspect-title');t.classList.remove('is-swapping');void t.offsetWidth;t.classList.add('is-swapping');}
  dirty=true;
}
function announce(text){$('#inspector-announcement').textContent=text;}
function resize(){
  if(!renderer)return;
  const host=inInspector?stage:heroHost,w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<650?1.5:1.75));renderer.setSize(w,h);
  camera.aspect=w/h;camera.position.z=inInspector?5.6:4.35;
  if(camera.aspect<.9)camera.position.z+=1.2;
  camera.updateProjectionMatrix();dirty=true;
}

function showInspector(index,trigger){
  if(!renderer)return;
  lastTrigger=trigger;inInspector=true;dialog.showModal();document.body.classList.add('modal-open');
  stage.appendChild(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Interactive sculpture. Drag or use arrow keys to rotate. Home resets the view.');
  setObject(index);resize();$('#close-inspector').focus();
}
function returnToHero(){
  if(!inInspector)return;
  inInspector=false;swapStart=-1;document.body.classList.remove('modal-open');heroHost.prepend(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label',heroLabel);setObject(0);resize();lastTrigger?.focus({preventScroll:true});
}

function animate(time){
  requestAnimationFrame(animate);
  const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
  if(document.hidden||(!heroVisible&&!inInspector))return;
  const still=reducedMotion.matches;
  if(!inInspector&&!paused&&!pointer){objects[0].rotation.y+=dt*.095;dirty=true;}
  // Momentum after a drag, decaying smoothly.
  if(!pointer&&(Math.abs(spin.x)+Math.abs(spin.y))>1e-4){
    const o=objects[current];o.rotation.y+=spin.y*dt;o.rotation.x+=spin.x*dt;
    const k=Math.pow(.04,dt);spin.x*=k;spin.y*=k;dirty=true;
  }
  // Hero pointer tilt on the rig (never in the inspector).
  const ttx=inInspector?0:tilt.tx,tty=inInspector?0:tilt.ty;
  tilt.x+=(ttx-tilt.x)*Math.min(1,dt*3.2);tilt.y+=(tty-tilt.y)*Math.min(1,dt*3.2);
  let introSpin=0,scale=1,exposure=EXPOSURE;
  if(introStart>=0){
    const p=Math.min(1,(time-introStart)/2200),e=ease(p);
    exposure=EXPOSURE*(.08+.92*e);introSpin=(1-e)*-1.35;scale=.9+.1*e;
    if(p>=1)introStart=-1;dirty=true;
  }
  if(swapStart>=0){
    const p=Math.min(1,(time-swapStart)/900),e=ease(p);
    exposure=EXPOSURE*(.35+.65*e);introSpin=(1-e)*-.9;scale=.86+.14*e;
    if(p>=1)swapStart=-1;dirty=true;
  }
  const bob=still||paused||inInspector?0:Math.sin(time*.0007)*.045;
  rig.rotation.set(tilt.y,tilt.x+introSpin,0);rig.scale.setScalar(scale);
  if(Math.abs(rig.position.y-bob)>1e-4){rig.position.y=bob;dirty=true;}
  if(Math.abs(ttx-tilt.x)+Math.abs(tty-tilt.y)>1e-4)dirty=true;
  renderer.toneMappingExposure=exposure;
  if(!gradeColor.equals(gradeTarget)){gradeColor.lerp(gradeTarget,Math.min(1,dt*2.5));if(Math.abs(gradeColor.r-gradeTarget.r)+Math.abs(gradeColor.g-gradeTarget.g)+Math.abs(gradeColor.b-gradeTarget.b)<.002)gradeColor.copy(gradeTarget);rim.color.copy(gradeColor);dirty=true;}
  if(dirty){renderer.render(scene,camera);dirty=false;}
}

function fallback(error){
  console.error('FORM renderer unavailable:',error);
  if(renderer){renderer.domElement.remove();renderer.dispose();renderer=null;}
  heroHost.classList.remove('is-ready');status.textContent='3D unavailable on this device · artwork preview shown';
  $$('.scene-tools button,[data-inspect]').forEach(b=>{b.disabled=true;b.title='Interactive 3D is unavailable on this device';});
  $$('.art-hint').forEach(e=>e.textContent='ARTWORK PREVIEW');
  $('#inspector-announcement').textContent='Interactive 3D unavailable';
}

async function init(){
  try{
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.setClearColor(0x111210,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=EXPOSURE;
    renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',heroLabel);renderer.domElement.tabIndex=0;
    heroHost.prepend(renderer.domElement);camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.set(0,0,5.05);
    ({scene,materials,envWarm,envCool,rim,rig,objects}=createStudio(renderer));
    setObject(0);gradeColor.copy(gradeTarget);rim.color.copy(gradeColor);resize();
    if(!reducedMotion.matches){introStart=performance.now();renderer.toneMappingExposure=0;}
    renderer.render(scene,camera);heroHost.classList.add('is-ready');status.textContent='';
    $$('#material-choices button').forEach(b=>b.addEventListener('click',()=>applyMaterial(b.dataset.material)));
    $$('#light-choices button').forEach(b=>b.addEventListener('click',()=>{setAtmosphere(b.dataset.light);announce(`${b.textContent} lighting`);}));
    $$('[data-inspect]').forEach(b=>b.addEventListener('click',()=>showInspector(Number(b.dataset.inspect),b)));
    $('#close-inspector').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',returnToHero);
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    $('#previous-object').addEventListener('click',()=>setObject(current-1));$('#next-object').addEventListener('click',()=>setObject(current+1));
    $('#reset-view').addEventListener('click',()=>{objects[current].rotation.copy(baseRotation);dirty=true;announce('View reset');});
    $('#wire-toggle').addEventListener('click',()=>{wireframe=!wireframe;Object.values(materials).forEach(m=>m.wireframe=wireframe);$('#wire-toggle').setAttribute('aria-pressed',String(wireframe));$('#wire-toggle').innerHTML=`${wireframe?'View surface':'View wireframe'} <span>⌗</span>`;dirty=true;announce(wireframe?'Wireframe enabled':'Surface restored');});
    const canvas=renderer.domElement;
    canvas.addEventListener('pointerdown',e=>{
      if(!e.isPrimary||e.button!==0||pointer)return;
      pointer={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};spin.x=spin.y=0;
      canvas.setPointerCapture(e.pointerId);canvas.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove',e=>{
      if(!pointer||pointer.id!==e.pointerId)return;
      const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
      objects[current].rotation.y+=dx*.008;objects[current].rotation.x+=dy*.008;
      const now=performance.now(),dt=Math.max(8,now-(pointer.t||now-16))/1000;
      if(!reducedMotion.matches){spin.y=spin.y*.5+(dx*.008/dt)*.5;spin.x=spin.x*.5+(dy*.008/dt)*.5;}
      pointer.x=e.clientX;pointer.y=e.clientY;pointer.t=now;dirty=true;
    });
    const release=e=>{
      if(e?.pointerId!==undefined&&pointer&&e.pointerId!==pointer.id)return;
      if(pointer&&performance.now()-pointer.t>90){spin.x=spin.y=0;}
      spin.x=Math.max(-6,Math.min(6,spin.x));spin.y=Math.max(-6,Math.min(6,spin.y));
      const id=pointer?.id;pointer=null;canvas.classList.remove('is-dragging');
      if(id!==undefined&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
    };
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
    window.addEventListener('blur',()=>release());
    canvas.addEventListener('keydown',e=>{const o=objects[current];if(e.key==='ArrowLeft')o.rotation.y-=.12;else if(e.key==='ArrowRight')o.rotation.y+=.12;else if(e.key==='ArrowUp')o.rotation.x-=.12;else if(e.key==='ArrowDown')o.rotation.x+=.12;else if(e.key==='Home')o.rotation.copy(baseRotation);else return;e.preventDefault();dirty=true;});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;status.textContent='3D paused — reload the page to restore the exhibition';if(dialog.open)dialog.close();});
    const heroSection=heroHost.closest('.hero');
    heroSection.addEventListener('pointermove',e=>{
      if(e.pointerType!=='mouse'||reducedMotion.matches||inInspector)return;
      const r=heroSection.getBoundingClientRect();
      tilt.tx=((e.clientX-r.left)/r.width-.5)*.32;tilt.ty=((e.clientY-r.top)/r.height-.5)*.2;
    });
    heroSection.addEventListener('pointerleave',()=>{tilt.tx=tilt.ty=0;});
    new ResizeObserver(resize).observe(heroHost);new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;if(heroVisible)dirty=true;}).observe(heroHost);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)release();dirty=true;});
    updateMotionButton();requestAnimationFrame(animate);
  }catch(error){fallback(error);}
}
function updateMotionButton(){ $('#motion-toggle').setAttribute('aria-pressed',String(paused));$('#motion-toggle').setAttribute('aria-label',paused?'Resume sculpture rotation':'Pause sculpture rotation');$('#motion-icon').textContent=paused?'▷':'Ⅱ';}
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;updateMotionButton();});
reducedMotion.addEventListener('change',e=>{paused=e.matches;updateMotionButton();});
// Let the layout and typographic introduction paint before compiling 3D materials.
requestAnimationFrame(()=>setTimeout(init,60));
