import * as THREE from 'three';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const heroHost = $('#hero-render');
const dialog = $('#inspector');
const stage = $('#inspect-stage');
const status = $('#scene-status');
const catalogue = [
  {name:'Fold', material:'chrome', description:'One continuous ribbon, folded back through itself. A quiet study in movement — where every reflection reveals another turn.', background:0x1a1c18, rotation:[0.2,0.5,-0.32]},
  {name:'Void', material:'ceramic', description:'A generous volume shaped around an absence. Its soft, irregular surface asks whether the object or the space inside it holds our attention.', background:0x27231e, rotation:[0.25,-0.45,-0.18]},
  {name:'Tension', material:'glass', description:'Two independent curves held in a delicate relationship. Separate, yet inseparable — an exploration of balance, transparency, and the space between.', background:0x18211f, rotation:[0.25,0.45,-0.3]}
];

// The construction drawing uses the same parametric centerline as Fold.
function foldPoint(t){return new THREE.Vector3((1.02+.36*Math.cos(3*t))*Math.cos(2*t),(1.02+.36*Math.cos(3*t))*Math.sin(2*t),.58*Math.sin(3*t));}
const wireGroup = $('#wire-lines');
for(let strand=0;strand<19;strand++){
  const path = document.createElementNS('http://www.w3.org/2000/svg','path');
  const points=[];
  for(let j=0;j<=240;j++){
    const t=j/240*Math.PI*2,p=foldPoint(t),offset=(strand-9)*.025;
    points.push(`${j?'L':'M'}${(210+92*(p.x+offset*Math.cos(t))).toFixed(1)},${(125+58*p.y+25*p.z+strand*.8-7).toFixed(1)}`);
  }
  path.setAttribute('d',points.join(' '));wireGroup.append(path);
}

let renderer,scene,camera,objects,materials,envWarm,envCool,pmrem;
let current=0,inInspector=false,paused=reducedMotion.matches,heroVisible=true,dirty=true,wireframe=false;
let pointer=null,lastTrigger=null,lastTime=0;
const heroLabel='Interactive Fold sculpture. Drag or use arrow keys to rotate. Spins automatically when released. Home resets the view.';
const baseRotation=new THREE.Euler();
const environments=[];

function tubeGeometry(curve,segments=256,sides=24,width=.28,depth=.13){
  const frames=curve.computeFrenetFrames(segments,true),positions=[],uvs=[],indices=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments,p=curve.getPointAt(t),twist=.45*Math.sin(t*Math.PI*6);
    const n=frames.normals[i].clone().multiplyScalar(Math.cos(twist)).addScaledVector(frames.binormals[i],Math.sin(twist));
    const b=frames.binormals[i].clone().multiplyScalar(Math.cos(twist)).addScaledVector(frames.normals[i],-Math.sin(twist));
    for(let j=0;j<=sides;j++){
      const a=j/sides*Math.PI*2,v=p.clone().addScaledVector(n,Math.cos(a)*width).addScaledVector(b,Math.sin(a)*depth);
      positions.push(v.x,v.y,v.z);uvs.push(t,j/sides);
      if(i<segments&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

function makeFold(){
  const points=Array.from({length:240},(_,i)=>foldPoint(i/240*Math.PI*2));
  const curve=new THREE.CatmullRomCurve3(points,true,'centripetal');
  return new THREE.Mesh(tubeGeometry(curve,360,32,.30,.125),materials.chrome);
}

function makeVoid(){
  const positions=[],uvs=[],indices=[],us=180,vs=64;
  for(let i=0;i<=us;i++)for(let j=0;j<=vs;j++){
    const u=i/us*Math.PI*2,v=j/vs*Math.PI*2;
    const radius=.91+.12*Math.cos(3*u+.5),tube=.43*(1+.16*Math.sin(2*u-.4));
    const radial=radius+tube*Math.cos(v),z=tube*Math.sin(v)*1.02+.11*Math.sin(2*u);
    positions.push(radial*Math.cos(u),radial*Math.sin(u)*1.1,z);uvs.push(i/us,j/vs);
    if(i<us&&j<vs){const k=i*(vs+1)+j;indices.push(k,k+vs+1,k+1,k+1,k+vs+1,k+vs+2);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();return new THREE.Mesh(geo,materials.ceramic);
}

function makeTension(){
  const group=new THREE.Group();
  for(let k=0;k<2;k++){
    const pts=[];
    for(let i=0;i<180;i++){
      const t=i/180*Math.PI*2;pts.push(new THREE.Vector3(.83*Math.cos(t),1.07*Math.sin(t),.14*Math.sin(2*t)));
    }
    const mesh=new THREE.Mesh(tubeGeometry(new THREE.CatmullRomCurve3(pts,true),240,28,.21,.21),materials.glass);
    mesh.rotation.y=k===0?-.48:1.1;mesh.rotation.z=k===0?-.40:.40;mesh.position.x=k===0?-.42:.42;group.add(mesh);
  }
  return group;
}

function studioEnvironment(cool=false){
  const room=new THREE.Scene();room.background=new THREE.Color(cool?0x242d36:0x343128);
  const planeGeo=new THREE.PlaneGeometry(1,1);
  const addPanel=(color,intensity,x,y,z,w,h)=>{
    const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity),side:THREE.DoubleSide});
    const plane=new THREE.Mesh(planeGeo,mat);plane.position.set(x,y,z);plane.scale.set(w,h,1);plane.lookAt(0,0,0);room.add(plane);
  };
  addPanel(cool?0xd9ebff:0xfff7e6,7,-3.5,3.8,3,2.2,5);
  addPanel(0xffffff,8,3,1,2.8,.8,5);
  addPanel(cool?0x7ca9ed:0xc7a679,4,0,1.2,-4.5,5,2);
  addPanel(0xe5eadb,5,0,5,0,5,1.6);
  addPanel(cool?0x89b3f2:0xffdb9c,2,-4,-1,1,1,2);
  const target=pmrem.fromScene(room,.035,.1,100);
  room.traverse(o=>{if(o.material)o.material.dispose();});planeGeo.dispose();environments.push(target);return target.texture;
}

function applyMaterial(name){
  objects[current].traverse(o=>{if(o.isMesh)o.material=materials[name];});
  Object.values(materials).forEach(m=>m.wireframe=wireframe);
  $$('#material-choices button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.material===name)));
  dirty=true;announce(`${catalogue[current].name}, ${name} surface`);
}
function setAtmosphere(name){
  scene.environment=name==='cool'?envCool:envWarm;
  $$('#light-choices button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.light===name)));dirty=true;
}
function setObject(index){
  current=(index+catalogue.length)%catalogue.length;
  objects.forEach((obj,i)=>{obj.visible=i===current;});
  wireframe=false;$('#wire-toggle').setAttribute('aria-pressed','false');$('#wire-toggle').innerHTML='View wireframe <span>⌗</span>';
  const data=catalogue[current];
  objects[current].rotation.set(...data.rotation);baseRotation.copy(objects[current].rotation);
  $('#inspect-title').textContent=data.name;$('#inspect-number').textContent=String(current+1).padStart(3,'0');$('#object-position').textContent=`0${current+1} / 03`;$('#inspect-description').textContent=data.description;
  applyMaterial(data.material);setAtmosphere('warm');dirty=true;
}
function announce(text){$('#inspector-announcement').textContent=text;}
function resize(){
  if(!renderer)return;
  const host=inInspector?stage:heroHost,w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<650?1.5:1.75));renderer.setSize(w,h);
  camera.aspect=w/h;camera.position.z=inInspector?5.6:5.05;
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
  inInspector=false;document.body.classList.remove('modal-open');heroHost.prepend(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label',heroLabel);setObject(0);resize();lastTrigger?.focus({preventScroll:true});
}

function animate(time){
  requestAnimationFrame(animate);
  const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
  if(document.hidden||(!heroVisible&&!inInspector))return;
  if(!inInspector&&!paused&&!pointer){objects[0].rotation.y+=dt*.095;dirty=true;}
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
    renderer.setClearColor(0x111210,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
    renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',heroLabel);renderer.domElement.tabIndex=0;
    heroHost.prepend(renderer.domElement);scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.set(0,0,5.05);
    pmrem=new THREE.PMREMGenerator(renderer);envWarm=studioEnvironment();envCool=studioEnvironment(true);scene.environment=envWarm;scene.environmentIntensity=1.25;
    materials={
      chrome:new THREE.MeshPhysicalMaterial({color:0xcaccc4,metalness:1,roughness:.19,clearcoat:.3,clearcoatRoughness:.15,side:THREE.DoubleSide}),
      ceramic:new THREE.MeshPhysicalMaterial({color:0xb58b6b,metalness:0,roughness:.55,clearcoat:.17,clearcoatRoughness:.6,side:THREE.DoubleSide}),
      glass:new THREE.MeshPhysicalMaterial({color:0xf5fff9,metalness:0,roughness:.065,transmission:1,thickness:.35,ior:1.45,clearcoat:1,attenuationColor:new THREE.Color(0xc2dfd2),attenuationDistance:4,side:THREE.DoubleSide})
    };
    const key=new THREE.DirectionalLight(0xfff1df,3.2);key.position.set(-3,4,4);scene.add(key);
    const fill=new THREE.DirectionalLight(0xc9e2e4,1.5);fill.position.set(3,-1,2);scene.add(fill);
    objects=[makeFold(),makeVoid(),makeTension()];objects.forEach(obj=>scene.add(obj));
    setObject(0);resize();renderer.render(scene,camera);heroHost.classList.add('is-ready');status.textContent='';
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
      pointer={id:e.pointerId,x:e.clientX,y:e.clientY};
      canvas.setPointerCapture(e.pointerId);canvas.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove',e=>{
      if(!pointer||pointer.id!==e.pointerId)return;
      const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
      objects[current].rotation.y+=dx*.008;objects[current].rotation.x+=dy*.008;
      pointer.x=e.clientX;pointer.y=e.clientY;dirty=true;
    });
    const release=e=>{
      if(e?.pointerId!==undefined&&pointer&&e.pointerId!==pointer.id)return;
      const id=pointer?.id;pointer=null;canvas.classList.remove('is-dragging');
      if(id!==undefined&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
    };
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
    window.addEventListener('blur',()=>release());
    canvas.addEventListener('keydown',e=>{const o=objects[current];if(e.key==='ArrowLeft')o.rotation.y-=.12;else if(e.key==='ArrowRight')o.rotation.y+=.12;else if(e.key==='ArrowUp')o.rotation.x-=.12;else if(e.key==='ArrowDown')o.rotation.x+=.12;else if(e.key==='Home')o.rotation.copy(baseRotation);else return;e.preventDefault();dirty=true;});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;status.textContent='3D paused — reload the page to restore the exhibition';if(dialog.open)dialog.close();});
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
