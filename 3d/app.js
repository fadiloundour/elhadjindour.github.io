// Portfolio 3D — Elhadji Ndour. Three.js r160, sans dépendance de build.
import * as THREE from 'three';
import { SVGLoader } from './vendor/SVGLoader.js';
import { PROJECTS, CHAPTERS } from './data.js';

const $ = (s) => document.querySelector(s);
const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
const isSmall = () => innerWidth < 860;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const damp = (cur, target, lambda, dt) => cur + (target - cur) * (1 - Math.exp(-lambda * dt));

/* ---------------- WebGL ---------------- */
const canvas = $('#gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  $('#nogl').hidden = false; $('#loader').classList.add('done');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, isSmall() ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const BG = 0x0f0e0d;
const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 7, 26);
const camera = new THREE.PerspectiveCamera(isSmall() ? 62 : 48, innerWidth / innerHeight, 0.1, 120);

scene.add(new THREE.HemisphereLight(0xf2ece2, 0x14100c, 0.75));
const key = new THREE.DirectionalLight(0xffe2c8, 1.6); key.position.set(3, 5, 7); scene.add(key);
const rim = new THREE.PointLight(0x43deff, 28, 16, 2); scene.add(rim);
const warm = new THREE.PointLight(0xe65013, 22, 12, 2); warm.position.set(2.5, -0.6, 2.5); scene.add(warm);

/* ---------------- chargement ---------------- */
const manager = new THREE.LoadingManager();
const pct = $('#pct');
manager.onProgress = (_, l, t) => { pct.textContent = Math.round((l / t) * 100); };
let ready = false;
const finish = () => { if (ready) return; ready = true; $('#loader').classList.add('done'); introT0 = clock.elapsedTime; };
manager.onLoad = () => setTimeout(finish, 250);
setTimeout(finish, 6000); // sécurité : on n'attend jamais plus de 6 s
const texLoader = new THREE.TextureLoader(manager);

/* ---------------- logo « en. » en volume ---------------- */
const LG = { cx: 256.3, cy: 187.02, hx: 310.2, hy: 135.32, r: 5.94, sw: 2.42, left: 7.26, right: 316.14, top: 76.8, bottom: 200 };
const DEPTH = 26;
function buildLogo(svgText) {
  const root = new THREE.Group();
  const inner = new THREE.Group(); root.add(inner);
  const data = new SVGLoader().parse(svgText);
  const cream = new THREE.MeshPhysicalMaterial({ color: 0xf2ece2, roughness: 0.36, metalness: 0.04, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xe65013, emissive: 0xe65013, emissiveIntensity: 0.28, roughness: 0.42 });
  const parts = {};
  data.paths.forEach((p) => {
    const id = p.userData.node.id;
    const geo = new THREE.ExtrudeGeometry(SVGLoader.createShapes(p), { depth: DEPTH, bevelEnabled: true, bevelThickness: 3, bevelSize: 1.4, bevelSegments: 4, curveSegments: 14 });
    geo.computeBoundingBox();
    const c = new THREE.Vector3(); geo.boundingBox.getCenter(c); geo.translate(-c.x, -c.y, -c.z);
    const m = new THREE.Mesh(geo, id === 'd' ? orange : cream);
    const g = new THREE.Group(); g.position.copy(c); g.add(m); inner.add(g);
    parts[id] = g; g.userData.home = c.clone();
  });
  // poignée de Bézier
  const h = new THREE.Group(); h.position.set(LG.cx, LG.cy, DEPTH / 2); inner.add(h);
  const dx = LG.hx - LG.cx, dy = LG.hy - LG.cy, len = Math.hypot(dx, dy);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(LG.sw * 0.75, LG.sw * 0.75, len, 16), orange);
  stem.position.set(dx / 2, dy / 2, 0); stem.rotation.z = Math.atan2(dy, dx) - Math.PI / 2; h.add(stem);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(LG.r * 1.25, 32, 16), orange); knob.position.set(dx, dy, 0); h.add(knob);
  parts.h = h; parts.stem = stem; parts.knob = knob;
  inner.scale.set(0.017, -0.017, 0.017);
  inner.position.set(-((LG.left + LG.right) / 2) * 0.017, ((LG.top + LG.bottom) / 2) * 0.017, -DEPTH * 0.017 / 2);
  root.userData.parts = parts;
  return root;
}
let logo = null, logoEnd = null;
fetch('logo3d.svg').then((r) => r.text()).then((t) => {
  logo = buildLogo(t); scene.add(logo); placeHero();
  logoEnd = buildLogo(t); scene.add(logoEnd); placeEnd();
});

// animation du logo : point d'ancrage → poignée → tirage → lettres → soudure
function animLogo(L, t, mouse) {
  if (!L) return;
  const P = L.userData.parts; const q = (a, d) => clamp((t - a) / d);
  const back = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const out = (x) => 1 - Math.pow(1 - x, 3);
  const d = q(0, 0.6); P.d.scale.setScalar(Math.max(0.0001, back(d))); P.d.rotation.z = (1 - out(d)) * -Math.PI;
  P.d.position.z = P.d.userData.home.z + (1 - out(d)) * 80;
  const s = q(0.35, 0.45); P.stem.scale.y = Math.max(0.0001, out(s)); P.stem.position.set((LG.hx - LG.cx) / 2 * out(s), (LG.hy - LG.cy) / 2 * out(s), 0);
  P.knob.scale.setScalar(Math.max(0.0001, back(q(0.7, 0.4)))); P.knob.position.set((LG.hx - LG.cx) * out(s), (LG.hy - LG.cy) * out(s), 0);
  // tirage de la poignée (ressort) puis respiration
  const pq = q(0.85, 1.2); let pull = 0;
  if (pq > 0 && pq < 1) pull = pq < .3 ? -0.7 * out(pq / .3) : pq < .6 ? -0.7 + 0.95 * ((pq - .3) / .3) : 0.25 * (1 - (pq - .6) / .4);
  const idle = t > 2.2 ? Math.sin((t - 2.2) * 1.4) * 0.12 : 0;
  P.h.rotation.z = -(pull + idle) * (mouse ? 1 : 1);
  // lettres : arrivent en profondeur, se soudent
  const le = out(q(0.9, 0.8)), ln = out(q(1.0, 0.8)), w = back(q(1.55, 0.5));
  P.e.position.x = P.e.userData.home.x - (1 - le) * 120 - (1 - clamp(w)) * 14; P.e.position.z = P.e.userData.home.z + (1 - le) * 160; P.e.rotation.y = (1 - le) * 0.9;
  P.n.position.x = P.n.userData.home.x + (1 - ln) * 120 + (1 - clamp(w)) * 14; P.n.position.z = P.n.userData.home.z + (1 - ln) * 160; P.n.rotation.y = (1 - ln) * -0.9;
  P.e.visible = t > 0.9; P.n.visible = t > 1.0;
}

/* ---------------- galerie ---------------- */
const SP = isSmall() ? 4.6 : 4.4;           // écart entre projets
const CH_GAP = 3.2;                          // respiration entre chapitres
const Z0 = -9;                               // début de la galerie
const items = [];
const planeH = isSmall() ? 1.9 : 2.4;
let zCursor = Z0;
const roundedRect = (w, h, r) => { const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
function uvFit(geo, w, h) { const pos = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5); uv.needsUpdate = true; }
const cubeGeo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
const orangeMat = new THREE.MeshStandardMaterial({ color: 0xe65013, emissive: 0xe65013, emissiveIntensity: 0.5 });
const chapterZ = [];
PROJECTS.forEach((p, i) => {
  if (i > 0 && p.ch !== PROJECTS[i - 1].ch) zCursor -= CH_GAP;
  if (chapterZ[p.ch] === undefined) chapterZ[p.ch] = zCursor;
  const side = i % 2 === 0 ? -1 : 1;
  const x = side * (isSmall() ? 1.05 : 2.35), y = Math.sin(i * 1.7) * (isSmall() ? 0.35 : 0.45), z = zCursor;
  const group = new THREE.Group(); group.position.set(x, y, z); group.rotation.y = -side * (isSmall() ? 0.18 : 0.32);
  const mat = new THREE.MeshBasicMaterial({ color: 0x222222, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); group.add(mesh);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 }));
  shadow.position.set(0.08, -0.1, -0.05); group.add(shadow);
  const anchor = new THREE.Mesh(cubeGeo, orangeMat); group.add(anchor);
  scene.add(group);
  const it = { p, i, group, mesh, shadow, anchor, x, y, z, side, hover: 0, w: planeH * 1.33, h: planeH };
  const setSize = (aspect) => {
    let h = planeH, w = h * aspect; const maxW = isSmall() ? 2.1 : 3.4; if (w > maxW) { w = maxW; h = w / aspect; }
    it.w = w; it.h = h;
    const g = new THREE.ShapeGeometry(roundedRect(w, h, 0.05), 6); uvFit(g, w, h); mesh.geometry.dispose(); mesh.geometry = g;
    shadow.scale.set(w, h, 1); anchor.position.set(side * -(w / 2) - side * 0.16, -h / 2 - 0.12, 0.02);
  };
  setSize(4 / 3);
  if (p.video) {
    const v = document.createElement('video'); v.src = p.video; v.muted = true; v.loop = true; v.playsInline = true; v.crossOrigin = 'anonymous'; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    const vt = new THREE.VideoTexture(v); vt.colorSpace = THREE.SRGBColorSpace;
    it.video = v; it.vtex = vt;
    v.addEventListener('loadedmetadata', () => setSize(v.videoWidth / v.videoHeight));
  }
  texLoader.load(p.img, (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    it.tex = t; if (!p.video) { mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true; setSize(t.image.width / t.image.height); }
    else if (!mat.map) { mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true; }
  });
  items.push(it);
  zCursor -= SP;
});
const Z_END = zCursor - 4;
function placeEnd() { if (!logoEnd) return; logoEnd.position.set(0, isSmall() ? 2.5 : 1.85, Z_END - 5.5); logoEnd.scale.setScalar(isSmall() ? 0.42 : 0.6); }
function placeHero() { if (!logo) return; if (isSmall()) { logo.position.set(0, 1.45, 0); logo.scale.setScalar(0.62); } else { logo.position.set(1.9, 0.15, 0); logo.scale.setScalar(1); } }

/* ---------------- chemin de la caméra (une courbe de Bézier, comme le logo) ---------------- */
const pts = isSmall()
  ? [new THREE.Vector3(0, 0.25, 8.2), new THREE.Vector3(0, -0.4, 5), new THREE.Vector3(0, -0.9, 1.5), new THREE.Vector3(0, -0.2, -2), new THREE.Vector3(0, 0, Z0 + 5)]
  : [new THREE.Vector3(0, 0.25, 8.2), new THREE.Vector3(-0.9, 0.1, 4.6), new THREE.Vector3(-2.2, 0, 0.8), new THREE.Vector3(-0.8, 0, -3), new THREE.Vector3(0, 0, Z0 + 5)];
items.forEach((it, i) => pts.push(new THREE.Vector3(Math.sin(i * 0.55) * (isSmall() ? 0.12 : 0.35), it.y * 0.25 + 0.05, it.z + (isSmall() ? 3.6 : 3.1))));
pts.push(new THREE.Vector3(0, 0.15, Z_END + 2.5), new THREE.Vector3(0, 0.15, Z_END + 0.4));
const path = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
// le « trait » orange qui guide la visite
const guidePts = path.getSpacedPoints(400).map((v) => new THREE.Vector3(v.x * 0.6, v.y - (isSmall() ? 1.55 : 1.75), v.z - 1.5));
const guide = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(guidePts), 600, 0.008, 6, false), new THREE.MeshBasicMaterial({ color: 0xe65013, transparent: true, opacity: 0.85 }));
scene.add(guide);
// poussière d'atelier
{
  const n = isSmall() ? 500 : 1100, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = (Math.random() - 0.5) * 16; arr[i * 3 + 1] = (Math.random() - 0.5) * 9; arr[i * 3 + 2] = 9 - Math.random() * (9 - Z_END + 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xf2ece2, size: 0.018, transparent: true, opacity: 0.45, depthWrite: false })));
}

// progression (0→1) à laquelle la caméra est face à chaque projet
const SAMPLES = 1600; const zs = [];
for (let i = 0; i <= SAMPLES; i++) zs.push(path.getPointAt(i / SAMPLES).z);
const uAtZ = (z) => { let best = 0, bd = 1e9; for (let i = 0; i <= SAMPLES; i++) { const d = Math.abs(zs[i] - z); if (d < bd) { bd = d; best = i; } } return best / SAMPLES; };
items.forEach((it) => { it.u = uAtZ(it.z + (isSmall() ? 3.6 : 3.1)); });
const chU = chapterZ.map((z) => uAtZ(z + 6.5));
const S_INTRO = 0.13, U_G = chU[0] - 0.006;
const s2u = (s) => (s < S_INTRO ? (s / S_INTRO) * U_G : U_G + ((s - S_INTRO) / (1 - S_INTRO)) * (1 - U_G));
const u2s = (u) => (u < U_G ? (u / U_G) * S_INTRO : S_INTRO + ((u - U_G) / (1 - U_G)) * (1 - S_INTRO));
const chEndU = CHAPTERS.map((_, c) => { const last = items.filter((it) => it.p.ch === c).pop(); return last.u + 0.012; });

/* ---------------- défilement ---------------- */
const scroller = $('#scroller');
const setHeight = () => { scroller.style.height = `${Math.round(innerHeight * (PROJECTS.length * 0.75 + 7))}px`; };
setHeight();
let target = 0, prog = 0;
const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
addEventListener('scroll', () => { target = clamp(scrollY / Math.max(1, maxScroll())); }, { passive: true });
const goTo = (u) => scrollTo({ top: u * maxScroll(), behavior: reduce ? 'auto' : 'smooth' });
document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', (e) => {
  e.preventDefault(); const g = b.dataset.go;
  goTo(g === '0' ? 0 : g === '1' ? 1 : u2s(chU[+g.slice(1)] + 0.004));
}));

/* ---------------- calques HTML ---------------- */
const chWrap = $('#chapters');
CHAPTERS.forEach((c, i) => {
  const s = document.createElement('section'); s.className = 'ov ov--ch'; s.dataset.ov = 'c' + i;
  s.innerHTML = `<div class="n">${c.n}</div><h2>${c.title}</h2><p>${c.sub}</p>`; chWrap.appendChild(s);
});
const ticks = $('#railTicks');
chU.forEach((u) => { const i = document.createElement('i'); i.style.top = `${u2s(u) * 100}%`; ticks.appendChild(i); });
const OV = [...document.querySelectorAll('[data-ov]')];
function window01(u, a, b, fade = 0.012) { return Math.min(smooth(a - fade, a, u), 1 - smooth(b, b + fade, u)); }
const navBtns = [...document.querySelectorAll('.chap button')];
function updateOverlays(u, s) {
  OV.forEach((el) => {
    const k = el.dataset.ov; let o = 0;
    if (k === 'hero') o = 1 - smooth(0.008, 0.035, s);
    else if (k === 'hint') o = (ready ? 1 : 0) * (1 - smooth(0.002, 0.012, s));
    else if (k === 'about') o = window01(s, 0.045, 0.095, 0.012);
    else if (k === 'end') o = smooth(0.975, 0.995, u);
    else if (k[0] === 'c') { const c = +k.slice(1); const a = u2s(chU[c]); o = window01(s, a - 0.004, a + 0.026, 0.01); }
    el.style.opacity = o.toFixed(3);
    const base = k === 'about' && !isSmall() ? 'translateY(-50%) ' : k === 'end' ? 'translate(-50%,-50%) ' : k === 'hint' ? 'translateX(-50%) ' : '';
    el.style.transform = base + `translateY(${(1 - o) * 18}px)`;
    el.classList.toggle('live', o > 0.6);
  });
  const cur = CHAPTERS.findIndex((_, c) => u >= chU[c] - 0.015 && u < chEndU[c]);
  navBtns.forEach((b, i) => b.classList.toggle('on', i === cur || (i === 4 && u > 0.97)));
  $('#railFill').style.height = `${s * 100}%`; $('#railA').style.top = `${s * 100}%`;
  let n = 0; items.forEach((it) => { if (u >= it.u - 0.01) n = it.i + 1; });
  $('#cnt').textContent = String(n).padStart(2, '0');
}

/* ---------------- survol & clic ---------------- */
const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2(9, 9); const mpx = { x: 0, y: 0 };
let hovered = null;
const tip = $('#tip');
addEventListener('pointermove', (e) => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  mpx.x = e.clientX; mpx.y = e.clientY;
});
const panel = $('#panel');
function openProject(it) {
  const p = it.p;
  $('#pLabel').textContent = p.label; $('#pTitle').textContent = p.title; $('#pDesc').textContent = p.desc;
  $('#pTags').innerHTML = (p.tags || []).map((t) => `<span>${t}</span>`).join('');
  $('#pMedia').innerHTML = p.video ? `<video src="${p.video}" autoplay muted loop playsinline poster="${p.img}"></video>` : `<img src="${p.img}" alt="${p.title}">`;
  const l = $('#pLink'); if (p.link) { l.hidden = false; l.href = p.link; l.textContent = p.linkLabel || 'Voir le projet'; l.target = p.link.startsWith('http') ? '_blank' : '_self'; } else l.hidden = true;
  panel.showModal();
}
$('#pClose').addEventListener('click', () => panel.close());
panel.addEventListener('click', (e) => { if (e.target === panel) panel.close(); });
let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', (e) => {
  if (!downAt) return; const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  if (moved > 8 || performance.now() - downAt.t > 500) return;
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObjects(items.map((it) => it.mesh))[0];
  if (hit) openProject(items.find((it) => it.mesh === hit.object));
});

/* ---------------- boucle ---------------- */
const clock = new THREE.Clock();
let introT0 = 0;
const look = new THREE.Vector3(), camPos = new THREE.Vector3(), tmp = new THREE.Vector3();
const par = { x: 0, y: 0 };
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05); const t = clock.elapsedTime;
  prog = damp(prog, target, reduce ? 30 : 4.2, dt);
  const s = clamp(prog, 0, 0.9999); const u = s2u(s);
  path.getPointAt(u, camPos);
  path.getPointAt(Math.min(1, u + 0.018), look);
  // en ouverture et à la fin, on regarde le logo
  const atStart = 1 - smooth(0.0, 0.035, u); const atEnd = smooth(0.95, 0.995, u);
  look.lerp(tmp.set(isSmall() ? 0 : 0.9, isSmall() ? 0.5 : 0.05, 0), atStart);
  if (logoEnd) look.lerp(tmp.set(0, 0.15, Z_END - 5.5), atEnd);
  if (!isTouch) { par.x = damp(par.x, mouse.x === 9 ? 0 : mouse.x, 3, dt); par.y = damp(par.y, mouse.y === 9 ? 0 : mouse.y, 3, dt); }
  camera.position.copy(camPos).add(tmp.set(par.x * 0.35, par.y * 0.22, 0));
  camera.lookAt(look);
  rim.position.copy(camera.position).add(tmp.set(-3, 2, -4));
  // logos
  const lt = ready ? t - introT0 : 0;
  if (logo) {
    animLogo(logo, reduce ? 9 : lt, true);
    { const g = smooth(0.012, 0.045, s); const base = isSmall() ? 0.62 : 1; logo.scale.setScalar(Math.max(0.0001, base * (1 - g))); logo.visible = g < 0.999; }
    logo.rotation.y = damp(logo.rotation.y, par.x * 0.45 + Math.sin(t * 0.4) * 0.06, 4, dt);
    logo.rotation.x = damp(logo.rotation.x, -par.y * 0.25, 4, dt);
  }
  if (logoEnd) { const et = (u - 0.955) / 0.03 * 2.4; animLogo(logoEnd, reduce ? 9 : Math.max(0, et) + (et > 2.4 ? t * 0 : 0), false); logoEnd.rotation.y = Math.sin(t * 0.5) * 0.15 + par.x * 0.3; }
  // projets : survol, regard vers la caméra, vidéos
  ray.setFromCamera(mouse, camera);
  const hit = !isTouch && !panel.open ? ray.intersectObjects(items.map((it) => it.mesh))[0] : null;
  const h = hit ? items.find((it) => it.mesh === hit.object) : null;
  if (h !== hovered) { hovered = h; canvas.style.cursor = h ? 'pointer' : ''; tip.style.opacity = h ? 1 : 0; if (h) tip.innerHTML = `<small>${h.p.label}</small><b>${h.p.title}</b>Cliquer pour ouvrir`; }
  if (h) tip.style.transform = `translate(${mpx.x + 16}px,${mpx.y + 16}px)`;
  items.forEach((it) => {
    it.hover = damp(it.hover, it === hovered ? 1 : 0, 8, dt);
    const near = clamp(1 - Math.abs(camera.position.z - 3 - it.z) / 9);
    it.group.scale.setScalar(1 + it.hover * 0.06 + near * 0.04);
    it.group.position.y = it.y + Math.sin(t * 0.6 + it.i) * 0.05;
    it.group.rotation.y = -it.side * (isSmall() ? 0.18 : 0.32) * (1 - near * 0.35) + it.hover * it.side * -0.06;
    it.anchor.rotation.set(t * 0.8 + it.i, t * 0.6, 0);
    if (it.video) {
      const close = Math.abs(camera.position.z - it.z) < 11;
      if (close && it.video.paused) { it.video.play().then(() => { it.mesh.material.map = it.vtex; it.mesh.material.needsUpdate = true; }).catch(() => {}); }
      else if (!close && !it.video.paused) it.video.pause();
    }
  });
  updateOverlays(u, s);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.fov = isSmall() ? 62 : 48; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false); setHeight(); placeHero(); placeEnd(); target = clamp(scrollY / Math.max(1, maxScroll()));
});
// test / capture : window.__setProgress(u)
window.__setProgress = (s) => { target = prog = s; };
