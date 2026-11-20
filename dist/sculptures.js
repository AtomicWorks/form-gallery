// FORM — the three procedural sculptures, their materials and the studio they are lit in.
// Shared by the site (app.js) and the poster renderer, so previews always match the live objects.
import * as THREE from 'three';

export const catalogue = [
  {name:'Fibre', material:'chrome', grade:0x9db6cf, css:'#9db6cf', rotation:[1.0,0.15,-0.4],
    description:'Twenty-three circles, each one linked through every other. A map of the four-dimensional sphere brought down into ours: no two rings touch, yet none can be pulled free.'},
  {name:'Bloom', material:'ceramic', grade:0xd99a6a, css:'#d99a6a', rotation:[0.85,0,0.15],
    description:'Two hundred petals, each turned by the golden angle from the last. The rule that packs a sunflower’s seeds grows this glazed rosette from a closed bud to an open crown.'},
  {name:'Paradox', material:'glass', grade:0x86cbb3, css:'#86cbb3', rotation:[0.08,0.28,0.04],
    description:'A bottle with no inside. The Klein surface passes through itself and returns, so its single face is both interior and exterior. Glass lets you watch it happen.'}
];

// Hopf fibration: the circle in S³ over the point (a,b,c) of S², stereographically projected to 3D.
export function hopfFibre(a, b, c, steps = 160) {
  const k = 1 / Math.sqrt(2 * (1 + c)), pts = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps * Math.PI * 2;
    const x0 = k * (1 + c) * Math.cos(t), x1 = k * (a * Math.sin(t) - b * Math.cos(t));
    const x2 = k * (a * Math.cos(t) + b * Math.sin(t)), x3 = k * (1 + c) * Math.sin(t), d = 1 - x0;
    pts.push(new THREE.Vector3(x1 / d, x3 / d, x2 / d));
  }
  return pts;
}
// Two nested tori of fibres; the outer ring is offset by half a step so the links interleave.
export const fibreLayers = [{c:-.86, count:9, offset:0}, {c:-.5, count:14, offset:.5}];

// Fit any object inside a sphere of the given radius, centred on the origin.
function fit(object, radius) {
  const box = new THREE.Box3().setFromObject(object), sphere = box.getBoundingSphere(new THREE.Sphere());
  const s = radius / sphere.radius, wrapper = new THREE.Group();
  object.position.sub(sphere.center).multiplyScalar(s); object.scale.multiplyScalar(s);
  wrapper.add(object); return wrapper;
}

function makeFibre(materials) {
  const group = new THREE.Group();
  for (const {c, count, offset} of fibreLayers) {
    const s = Math.sqrt(1 - c * c);
    for (let j = 0; j < count; j++) {
      const p = (j + offset) / count * Math.PI * 2;
      const curve = new THREE.CatmullRomCurve3(hopfFibre(s * Math.cos(p), s * Math.sin(p), c), true, 'centripetal');
      group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 220, c < -.7 ? .05 : .058, 16, true), materials.chrome));
    }
  }
  return fit(group, 1.6);
}

// One cupped, tapering petal, 1 unit long, pointing along +z with its inner face toward +y.
function petalGeometry() {
  const g = new THREE.SphereGeometry(1, 32, 20);
  g.scale(.19, .05, .5); g.translate(0, 0, .5);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const nx = x * (1 - .55 * z * z);
    p.setXYZ(i, nx, y + .07 * (nx / .19) ** 2 + .14 * z * z, z);
  }
  g.computeVertexNormals(); return g;
}

function makeBloom(materials) {
  const N = 200, golden = Math.PI * (3 - Math.sqrt(5));
  const mesh = new THREE.InstancedMesh(petalGeometry(), materials.ceramic, N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scale = new THREE.Vector3();
  const x = new THREE.Vector3(), y = new THREE.Vector3(), z = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const t = (i + .5) / N, r = Math.sqrt(t), a = i * golden;
    const e = 1.35 * (1 - Math.pow(r, .6)) + .04; // elevation: upright at the bud, splayed at the rim
    z.set(Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)).normalize();
    y.copy(up).addScaledVector(z, -z.y);
    if (y.lengthSq() < 1e-6) y.set(Math.cos(a), 0, Math.sin(a));
    y.normalize(); x.crossVectors(y, z);
    m.makeBasis(x, y, z); q.setFromRotationMatrix(m);
    pos.set(Math.cos(a) * r * .5, .85 * (1 - r * r) - .2, Math.sin(a) * r * .5);
    const s = .3 + .78 * r; scale.set(s, s, s);
    mesh.setMatrixAt(i, m.compose(pos, q, scale));
  }
  mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.frustumCulled = false;
  const group = new THREE.Group(); group.add(mesh);
  return fit(group, 1.5);
}

// Klein bottle, the classic immersion: a swelling body whose neck bends back and passes
// through its own wall to join the base from inside. u runs along the body, v around it.
function makeParadox(materials) {
  const positions = [], uvs = [], indices = [], us = 220, vs = 64;
  for (let i = 0; i <= us; i++) for (let j = 0; j <= vs; j++) {
    const u = i / us * Math.PI * 2, v = j / vs * Math.PI * 2;
    const cu = Math.cos(u), su = Math.sin(u), r = 2 * (1 - cu / 2);
    let x, z;
    if (u < Math.PI) { x = 3 * cu * (1 + su) + r * cu * Math.cos(v); z = -8 * su - r * su * Math.cos(v); }
    else { x = 3 * cu * (1 + su) + r * Math.cos(v + Math.PI); z = -8 * su; }
    const y = -r * Math.sin(v);
    positions.push(x, -z, y); uvs.push(i / us, j / vs);
    if (i < us && j < vs) { const k = i * (vs + 1) + j; indices.push(k, k + vs + 1, k + 1, k + 1, k + vs + 1, k + vs + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices); geo.computeVertexNormals();
  const group = new THREE.Group(); group.add(new THREE.Mesh(geo, materials.glass));
  return fit(group, 1.62);
}

function studioEnvironment(pmrem, cool = false) {
  const room = new THREE.Scene(); room.background = new THREE.Color(cool ? 0x242d36 : 0x343128);
  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const addPanel = (color, intensity, x, y, z, w, h) => {
    const mat = new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity), side:THREE.DoubleSide});
    const plane = new THREE.Mesh(planeGeo, mat); plane.position.set(x, y, z); plane.scale.set(w, h, 1); plane.lookAt(0, 0, 0); room.add(plane);
  };
  addPanel(cool ? 0xd9ebff : 0xfff7e6, 7, -3.5, 3.8, 3, 2.2, 5);
  addPanel(0xffffff, 8, 3, 1, 2.8, .8, 5);
  addPanel(cool ? 0x7ca9ed : 0xc7a679, 4, 0, 1.2, -4.5, 5, 2);
  addPanel(0xe5eadb, 5, 0, 5, 0, 5, 1.6);
  addPanel(cool ? 0x89b3f2 : 0xffdb9c, 2, -4, -1, 1, 1, 2);
  const target = pmrem.fromScene(room, .035, .1, 100);
  room.traverse((o) => { if (o.material) o.material.dispose(); }); planeGeo.dispose();
  return target.texture;
}

// Builds the lit scene with all three sculptures inside a shared rig.
export function createStudio(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envWarm = studioEnvironment(pmrem), envCool = studioEnvironment(pmrem, true);
  const scene = new THREE.Scene(); scene.environment = envWarm; scene.environmentIntensity = 1.25;
  const materials = {
    chrome:new THREE.MeshPhysicalMaterial({color:0xcaccc4, metalness:1, roughness:.16, clearcoat:.3, clearcoatRoughness:.15, side:THREE.DoubleSide}),
    ceramic:new THREE.MeshPhysicalMaterial({color:0xae7f5f, metalness:0, roughness:.5, clearcoat:.3, clearcoatRoughness:.4, side:THREE.DoubleSide}),
    glass:new THREE.MeshPhysicalMaterial({color:0xffffff, metalness:0, roughness:.03, transmission:1, thickness:.9, ior:1.5, dispersion:3, iridescence:.35, iridescenceIOR:1.3, clearcoat:1, clearcoatRoughness:.05, attenuationColor:new THREE.Color(0x7fc7ae), attenuationDistance:1.4, side:THREE.DoubleSide})
  };
  const key = new THREE.DirectionalLight(0xfff1df, 3.2); key.position.set(-3, 4, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xc9e2e4, 1.5); fill.position.set(3, -1, 2); scene.add(fill);
  // Graded rim light from behind; app.js eases it toward each sculpture's grade.
  const rim = new THREE.DirectionalLight(catalogue[0].grade, 2.4); rim.position.set(2.5, 2, -4); scene.add(rim);
  // On a transparent canvas three.js clears the glass refraction buffer to half-white, which
  // turns glass milky. This dark studio backdrop is drawn only into that refraction pass
  // (any off-screen target) and stays invisible on screen, so the page gradient still shows.
  const backdropGeo = new THREE.SphereGeometry(30, 32, 16), colors = [], p = backdropGeo.attributes.position, c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const t = (p.getY(i) / 30 + 1) / 2; c.setRGB(.025 + .07 * t, .03 + .075 * t, .028 + .07 * t); colors.push(c.r, c.g, c.b); }
  backdropGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const backdrop = new THREE.Mesh(backdropGeo, new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.BackSide, depthWrite:false, toneMapped:false}));
  backdrop.frustumCulled = false; backdrop.renderOrder = -1;
  backdrop.onBeforeRender = (r) => { backdrop.material.colorWrite = r.getRenderTarget() !== null; };
  scene.add(backdrop);
  const rig = new THREE.Group(); scene.add(rig);
  const objects = [makeFibre(materials), makeBloom(materials), makeParadox(materials)];
  objects.forEach((o) => rig.add(o));
  return {scene, materials, envWarm, envCool, rim, rig, objects};
}
