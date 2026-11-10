// Portfolio 3D — Elhadji Ndour · v5
// Mouvements à ressort interruptibles (principes « Designing Fluid Interfaces ») : la caméra suit un ressort,
// hérite de la vitesse du geste, projette l'élan et se pose sur le projet le plus proche.
import * as THREE from 'three';
import { SVGLoader } from './vendor/SVGLoader.js';
import { PROJECTS, CHAPTERS } from './data.js';

const $ = (s) => document.querySelector(s);
const N = PROJECTS.length;
const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
const isSmall = () => innerWidth < 860;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// mode léger pour téléphones et tablettes : textures réduites, pas d'anticrénelage matériel, pas de vidéo sur les cartes
const LITE = isTouch || innerWidth < 860 || (navigator.hardwareConcurrency || 8) <= 4;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const damp = (c, t, l, dt) => c + (t - c) * (1 - Math.exp(-l * dt));
const P_MIN = -2, P_MAX = N;                 // -2 accueil · -1 présentation · 0..N-1 projets · N contact

/* ---------------- ressort (amortissement + réponse, comme UIKit) ---------------- */
const spring = { x: P_MIN, v: 0, target: P_MIN, zeta: 1, response: 0.62 };
function stepSpring(dt) {
  const w = (2 * Math.PI) / (reduce ? 0.18 : spring.response), k = w * w, c = 2 * spring.zeta * w;
  const n = Math.ceil(dt / (1 / 240)); const h = dt / n;
  for (let i = 0; i < n; i++) { const a = -k * (spring.x - spring.target) - c * spring.v; spring.v += a * h; spring.x += spring.v * h; }
}
function setTarget(t, { zeta = 1, response = 0.62 } = {}) { spring.target = clamp(t, P_MIN, P_MAX); spring.zeta = zeta; spring.response = response; }
const rubber = (x) => { // élastique aux extrémités
  if (x < P_MIN) { const o = P_MIN - x; return P_MIN - (o * 0.55) / (1 + 0.55 * o); }
  if (x > P_MAX) { const o = x - P_MAX; return P_MAX + (o * 0.55) / (1 + 0.55 * o); }
  return x;
};

/* ---------------- WebGL ---------------- */
const canvas = $('#gl'); canvas.setAttribute('role', 'img');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !LITE, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { $('#nogl').hidden = false; $('#loader').classList.add('done'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, LITE ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight, false);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0f0e0d, 7, 24);
const FOV = () => (isSmall() ? 56 : 44);
const camera = new THREE.PerspectiveCamera(FOV(), innerWidth / innerHeight, 0.1, 120);
scene.add(new THREE.HemisphereLight(0xf2ece2, 0x14100c, 0.85));
const key = new THREE.DirectionalLight(0xffe2c8, 1.6); key.position.set(3, 5, 7); scene.add(key);
const rim = new THREE.PointLight(0x43deff, 26, 16, 2); scene.add(rim);
const warm = new THREE.PointLight(0xe65013, 22, 12, 2); warm.position.set(2.5, -0.6, 2.5); scene.add(warm);

/* ---------------- chargement ---------------- */
const clock = new THREE.Clock();
const manager = new THREE.LoadingManager();
manager.onProgress = (_, l, t) => { $('#pct').textContent = Math.round((l / t) * 100); };
let ready = false, introT0 = 0;
const finish = () => { if (ready) return; ready = true; $('#loader').classList.add('done'); introT0 = clock.elapsedTime; if (!moved) $('#hint').style.opacity = 1; };
manager.onLoad = () => setTimeout(finish, 200);
setTimeout(finish, 6000);
const bmpOK = typeof createImageBitmap === 'function' && !/^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const bmpLoader = new THREE.ImageBitmapLoader(manager); bmpLoader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' });
const texLoader = new THREE.TextureLoader(manager);
// image décodée hors du fil principal puis envoyée au GPU dès le chargement : aucune saccade quand la carte apparaît
function loadTex(url, cb) {
  const done = (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(LITE ? 2 : 8, renderer.capabilities.getMaxAnisotropy()); renderer.initTexture(t); cb(t); };
  if (bmpOK) bmpLoader.load(url, (bmp) => { const t = new THREE.Texture(bmp); t.flipY = false; t.needsUpdate = true; t.userData.w = bmp.width; t.userData.h = bmp.height; done(t); }, undefined, () => texLoader.load(url, (t) => { t.userData.w = t.image.width; t.userData.h = t.image.height; done(t); }));
  else texLoader.load(url, (t) => { t.userData.w = t.image.width; t.userData.h = t.image.height; done(t); });
}

/* ---------------- logo « en. » en volume ---------------- */
const LG = { cx: 256.3, cy: 187.02, hx: 310.2, hy: 135.32, r: 5.94, sw: 2.42, left: 7.26, right: 316.14, top: 76.8, bottom: 200 };
const DEPTH = 26;
function buildLogo(svgText) {
  const root = new THREE.Group(); const inner = new THREE.Group(); root.add(inner);
  const cream = new THREE.MeshPhysicalMaterial({ color: 0xf2ece2, roughness: 0.36, metalness: 0.04, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xe65013, emissive: 0xe65013, emissiveIntensity: 0.28, roughness: 0.42 });
  const parts = {};
  new SVGLoader().parse(svgText).paths.forEach((p) => {
    const id = p.userData.node.id;
    const geo = new THREE.ExtrudeGeometry(SVGLoader.createShapes(p), { depth: DEPTH, bevelEnabled: true, bevelThickness: 3, bevelSize: 1.4, bevelSegments: LITE ? 2 : 4, curveSegments: LITE ? 8 : 14 });
    geo.computeBoundingBox(); const c = new THREE.Vector3(); geo.boundingBox.getCenter(c); geo.translate(-c.x, -c.y, -c.z);
    const g = new THREE.Group(); g.position.copy(c); g.add(new THREE.Mesh(geo, id === 'd' ? orange : cream)); inner.add(g);
    parts[id] = g; g.userData.home = c.clone();
  });
  const h = new THREE.Group(); h.position.set(LG.cx, LG.cy, DEPTH / 2); inner.add(h);
  const dx = LG.hx - LG.cx, dy = LG.hy - LG.cy;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(LG.sw * 0.75, LG.sw * 0.75, Math.hypot(dx, dy), 16), orange);
  stem.rotation.z = Math.atan2(dy, dx) - Math.PI / 2; h.add(stem);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(LG.r * 1.25, 32, 16), orange); h.add(knob);
  Object.assign(parts, { h, stem, knob });
  inner.scale.set(0.017, -0.017, 0.017);
  inner.position.set(-((LG.left + LG.right) / 2) * 0.017, ((LG.top + LG.bottom) / 2) * 0.017, -DEPTH * 0.017 / 2);
  root.userData = { parts, kick: -10, rx: 0, ry: 0 };
  return root;
}
const back = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const out = (x) => 1 - Math.pow(1 - x, 3);
const pull = (q) => (q <= 0 || q >= 1 ? 0 : q < .3 ? -0.7 * out(q / .3) : q < .6 ? -0.7 + 0.95 * ((q - .3) / .3) : 0.25 * (1 - (q - .6) / .4));
function animLogo(L, t, now) {
  const P = L.userData.parts; const q = (a, d) => clamp((t - a) / d);
  const d = q(0, 0.6); P.d.scale.setScalar(Math.max(1e-4, back(d))); P.d.rotation.z = (1 - out(d)) * -Math.PI; P.d.position.z = P.d.userData.home.z + (1 - out(d)) * 80;
  const s = out(q(0.35, 0.45));
  P.stem.scale.y = Math.max(1e-4, s); P.stem.position.set((LG.hx - LG.cx) / 2 * s, (LG.hy - LG.cy) / 2 * s, 0);
  P.knob.scale.setScalar(Math.max(1e-4, back(q(0.7, 0.4)))); P.knob.position.set((LG.hx - LG.cx) * s, (LG.hy - LG.cy) * s, 0);
  P.h.rotation.z = -(pull(q(0.85, 1.2)) + pull((now - L.userData.kick) / 1.2) + (t > 2.2 ? Math.sin((t - 2.2) * 1.1) * 0.1 : 0));
  const le = out(q(0.9, 0.8)), ln = out(q(1.0, 0.8)), w = back(q(1.55, 0.5));
  P.e.position.x = P.e.userData.home.x - (1 - le) * 120 - (1 - clamp(w)) * 14; P.e.position.z = P.e.userData.home.z + (1 - le) * 160; P.e.rotation.y = (1 - le) * 0.9;
  P.n.position.x = P.n.userData.home.x + (1 - ln) * 120 + (1 - clamp(w)) * 14; P.n.position.z = P.n.userData.home.z + (1 - ln) * 160; P.n.rotation.y = (1 - ln) * -0.9;
  P.e.visible = t > 0.9; P.n.visible = t > 1.0;
}
let logo = null, logoEnd = null;
fetch('logo3d.svg').then((r) => r.text()).then((t) => { logo = buildLogo(t); logoEnd = buildLogo(t); scene.add(logo, logoEnd); place(); });

/* ---------------- cartes des projets ---------------- */
const GAP = isSmall() ? 3.0 : 3.3, CH_EXTRA = 1.8, Z0 = -5;
const D = isSmall() ? 4.5 : 4.4;              // distance caméra → carte au repos
const items = []; let z = Z0;
const cardUrl = (u) => (LITE ? 'img/s/' + u.replace(/^(\.\.\/assets\/|img\/)/, '').replace(/\//g, '_').replace(/\.[a-z]+$/i, '.webp') : u);
const roundedRect = (w, h, r) => { const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
const uvFit = (g, w, h) => { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5); uv.needsUpdate = true; };
const cubeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const orangeMat = new THREE.MeshStandardMaterial({ color: 0xe65013, emissive: 0xe65013, emissiveIntensity: 0.5 });
PROJECTS.forEach((p, i) => {
  if (i > 0 && p.ch !== PROJECTS[i - 1].ch) z -= CH_EXTRA;
  const side = i % 2 === 0 ? -1 : 1;
  const x = side * (isSmall() ? 0.12 : 0.55), y = Math.sin(i * 1.3) * (isSmall() ? 0.08 : 0.16);
  const group = new THREE.Group(); group.position.set(x, y, z); scene.add(group);
  const mat = new THREE.MeshBasicMaterial({ color: 0x1e1c1a, toneMapped: false, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); group.add(mesh);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shadowMat); shadow.position.set(0.09, -0.11, -0.05); group.add(shadow);
  const anchor = new THREE.Mesh(cubeGeo, orangeMat); group.add(anchor);
  const it = { p, i, group, mesh, mat, shadow, shadowMat, anchor, x, y, z, side, w: 1, h: 1, hover: 0, press: 0 };
  const maxH = isSmall() ? 2.25 : 2.35, maxW = isSmall() ? 1.95 : 3.6;
  const setSize = (aspect) => {
    let h = maxH, w = h * aspect; if (w > maxW) { w = maxW; h = w / aspect; }
    it.w = w; it.h = h; const g = new THREE.ShapeGeometry(roundedRect(w, h, 0.045), 6); uvFit(g, w, h);
    mesh.geometry.dispose(); mesh.geometry = g; shadow.scale.set(w, h, 1); anchor.position.set(-w / 2 - 0.14, -h / 2 - 0.12, 0.02);
  };
  setSize(4 / 3);
  if (p.video && !LITE) {
    const v = document.createElement('video'); Object.assign(v, { src: p.video, muted: true, loop: true, playsInline: true, preload: 'metadata' });
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    const vt = new THREE.VideoTexture(v); vt.colorSpace = THREE.SRGBColorSpace; it.video = v; it.vtex = vt;
    v.addEventListener('loadedmetadata', () => setSize(v.videoWidth / v.videoHeight));
  }
  it.load = (next) => loadTex(cardUrl(p.img), (t) => {
    if (!mat.map) { mat.map = t; mat.color.set(0x1e1c1a); mat.needsUpdate = true; it.fadeIn = 0; }
    if (!it.video) setSize(t.userData.w / t.userData.h);
    next();
  });
  items.push(it); z -= GAP;
});
const Z_END = items[N - 1].z - 5;
// chargement progressif : toujours la carte non chargée la plus proche, deux à la fois, jamais toutes d'un coup
function pump() {
  let best = null, bd = 1e9;
  for (const it of items) if (!it.loading) { const d = Math.abs(it.i - Math.max(0, spring.target)); if (d < bd) { bd = d; best = it; } }
  if (!best) return; best.loading = true;
  best.load(() => setTimeout(pump, LITE ? 60 : 16));
}
pump(); pump();
function place() {
  if (logo) { if (isSmall()) logo.position.set(0, 1.75, 0); else logo.position.set(1.75, 0.1, 0); }
  if (logoEnd) { logoEnd.position.set(0, isSmall() ? 1.9 : 1.55, Z_END - 5); logoEnd.scale.setScalar(isSmall() ? 0.42 : 0.58); }
}

/* ---------------- trajectoire : une position caméra et un point visé par état ---------------- */
const camPts = [], lookPts = [];
if (isSmall()) { camPts.push(new THREE.Vector3(0, 0.1, 7.6), new THREE.Vector3(0, -0.3, 3.8)); lookPts.push(new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(0, -0.2, -4)); }
else { camPts.push(new THREE.Vector3(0, 0.2, 7.8), new THREE.Vector3(-0.6, 0, 3.6)); lookPts.push(new THREE.Vector3(0.7, 0.05, 0), new THREE.Vector3(0.6, 0, -4)); }
items.forEach((it) => { camPts.push(new THREE.Vector3(it.x * 0.8, it.y * 0.6 + 0.02, it.z + D)); lookPts.push(new THREE.Vector3(it.x, it.y, it.z)); });
camPts.push(new THREE.Vector3(0, 0.15, Z_END + 1.2)); lookPts.push(new THREE.Vector3(0, 0.15, Z_END - 5));
const camCurve = new THREE.CatmullRomCurve3(camPts, false, 'catmullrom', 0.35);
const lookCurve = new THREE.CatmullRomCurve3(lookPts, false, 'catmullrom', 0.35);
const at = (curve, p, v) => curve.getPoint(clamp((p - P_MIN) / (P_MAX - P_MIN)), v);
// fil orange sous la trajectoire
scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(camCurve.getPoints(300).map((v) => new THREE.Vector3(v.x * 0.5, v.y - 1.7, v.z - 1.2))), 500, 0.008, 6, false),
  new THREE.MeshBasicMaterial({ color: 0xe65013, transparent: true, opacity: 0.8 })));
{ // poussière, presque immobile
  const n = isSmall() ? 400 : 900, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = (Math.random() - .5) * 14; arr[i * 3 + 1] = (Math.random() - .5) * 8; arr[i * 3 + 2] = 9 - Math.random() * (14 - Z_END); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xf2ece2, size: 0.018, transparent: true, opacity: 0.4, depthWrite: false })));
}

/* ---------------- interface : chapitres, barre, rail ---------------- */
const chStart = CHAPTERS.map((_, c) => items.findIndex((it) => it.p.ch === c));
const seg = $('.seg'), pill = $('#segPill');
const segBtns = CHAPTERS.map((c, i) => { const b = document.createElement('button'); b.innerHTML = `<b>${c.n}</b>${c.title.split(' ')[0]}`; b.addEventListener('click', () => go(chStart[i])); seg.appendChild(b); return b; });
const contactBtn = document.createElement('button'); contactBtn.innerHTML = '<b>✉</b>Contact'; contactBtn.addEventListener('click', () => go(P_MAX)); seg.appendChild(contactBtn); segBtns.push(contactBtn);
const pillS = { x: 0, w: 0 };
items.forEach((it, i) => { const t = document.createElement('i'); t.style.top = `${((i - P_MIN) / (P_MAX - P_MIN)) * 100}%`; if (chStart.includes(i)) t.className = 'ch'; $('#railTicks').appendChild(t); });
$('#nProj').textContent = N;
const bar = $('#bar'), barTxt = $('#barTxt');
let shownIdx = -1;
function showBar(i, dir) {
  if (i === shownIdx) return; shownIdx = i; const it = items[i];
  $('#bLabel').textContent = `${CHAPTERS[it.p.ch].n} · ${it.p.label}`; $('#bTitle').textContent = it.p.title; $('#bN').textContent = `${String(i + 1).padStart(2, '0')} / ${N}`;
  if (!reduce) barTxt.animate([{ opacity: 0, transform: `translateY(${dir * 10}px)` }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
}
const go = (i, opts) => { firstMove(); setTarget(i, opts); };
document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { const g = b.dataset.go; go(g === 'hero' ? -2 : g === 'about' ? -1 : +g); }));
$('#prev').addEventListener('click', () => go(Math.round(spring.target) - 1));
$('#next').addEventListener('click', () => go(Math.round(spring.target) + 1));
$('#bOpen').addEventListener('click', () => openSheet(items[clamp(Math.round(spring.x), 0, N - 1)]));
let moved = false; const firstMove = () => { if (!moved) { moved = true; $('#hint').style.opacity = 0; } };

/* ---------------- entrées : molette, glisser, clavier ---------------- */
let wheelTimer = 0, lastStep = 0;
addEventListener('wheel', (e) => {
  if (sheet.open || modalOpen()) return; e.preventDefault(); firstMove();
  let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (e.deltaMode === 1) d *= 40;
  const discrete = e.deltaMode === 1 || (Math.abs(d) >= 50 && Number.isInteger(d) && Math.abs(d) % 10 === 0);
  if (discrete) { const now = performance.now(); if (now - lastStep > 180) { lastStep = now; setTarget(Math.round(spring.target) + Math.sign(d), { zeta: 1, response: 0.55 }); } return; }
  // pavé tactile : suivi direct (1:1), puis on se pose sur le projet le plus proche
  spring.target = clamp(spring.target + d / (isSmall() ? 420 : 520), P_MIN - 0.3, P_MAX + 0.3); spring.zeta = 1; spring.response = 0.42;
  clearTimeout(wheelTimer); wheelTimer = setTimeout(() => setTarget(Math.round(spring.target), { zeta: 1, response: 0.6 }), 160);
}, { passive: false });
const drag = { on: false, active: false, id: 0, x0: 0, y0: 0, p0: 0, axis: null, hist: [] };
const pxPerItem = () => (drag.axis === 'x' ? innerWidth * 0.42 : innerHeight * 0.38);
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  Object.assign(drag, { on: true, active: false, id: e.pointerId, x0: e.clientX, y0: e.clientY, p0: spring.x, axis: null, hist: [{ x: e.clientX, y: e.clientY, t: performance.now() }] });
  canvas.setPointerCapture(e.pointerId);
  const h = pick(e.clientX, e.clientY); if (h) h.press = 1;   // retour visuel dès l'appui
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag.on || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.active) { if (Math.hypot(dx, dy) < 8) return; drag.active = true; drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; canvas.classList.add('grabbing'); firstMove(); items.forEach((it) => (it.press = 0)); }
  const delta = drag.axis === 'x' ? -dx : -dy;
  spring.x = rubber(drag.p0 + delta / pxPerItem()); spring.target = spring.x; spring.v = 0;
  drag.hist.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (drag.hist.length > 6) drag.hist.shift();
});
const endDrag = (e) => {
  if (!drag.on || e.pointerId !== drag.id) return; drag.on = false; canvas.classList.remove('grabbing');
  items.forEach((it) => (it.press = 0));
  const wasDrag = drag.active; drag.active = false;
  if (!wasDrag) return tap(e.clientX, e.clientY);
  const a = drag.hist[0], b = drag.hist[drag.hist.length - 1]; const dt = Math.max(16, b.t - a.t) / 1000;
  const vPx = drag.axis === 'x' ? -(b.x - a.x) / dt : -(b.y - a.y) / dt;
  const v = vPx / pxPerItem();                                  // projets / seconde
  const projected = spring.x + v * 0.22;                        // projection de l'élan
  let t = Math.round(projected); t = clamp(t, Math.round(spring.x) - 3, Math.round(spring.x) + 3);
  spring.v = v;                                                 // passage de vitesse geste → ressort
  setTarget(t, { zeta: Math.abs(v) > 1.6 ? 0.82 : 1, response: 0.5 });
};
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
addEventListener('keydown', (e) => {
  if (modalOpen()) return;
  if (e.key === 'g' || e.key === 'G') { if (!sheet.open && !e.metaKey && !e.ctrlKey) openGrid(); return; }
  if (sheet.open) { if (e.key === 'ArrowRight') sheetStep(1); if (e.key === 'ArrowLeft') sheetStep(-1); if (e.key === 'Escape') { e.preventDefault(); closeSheet(); } return; }
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(Math.round(spring.target) + 1); }
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(Math.round(spring.target) - 1); }
  if (e.key === 'Home') go(P_MIN); if (e.key === 'End') go(P_MAX);
  if (e.key === 'Enter' && spring.x > -0.4 && spring.x < N - 0.6) openSheet(items[Math.round(spring.x)]);
});
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); const meshes = items.map((it) => it.mesh);
function pick(x, y) { ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(meshes); for (const h of hits) { const it = items[meshes.indexOf(h.object)]; if (it.group.visible && it.mat.opacity > 0.4) return it; } return null; }
function tap(x, y) {
  const it = pick(x, y);
  if (it) { if (Math.abs(it.i - spring.x) < 0.35) openSheet(it); else go(it.i); return; }
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  if (logo && logo.visible && ray.intersectObject(logo, true).length) logo.userData.kick = clock.elapsedTime - introT0;
}
const mouse = { x: 0, y: 0, in: false };
addEventListener('pointermove', (e) => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = -(e.clientY / innerHeight) * 2 + 1; mouse.in = true; });

/* ---------------- fiche projet (naît de la carte, repart vers elle) ---------------- */
const sheet = $('#sheet'); let sheetIt = null, gIdx = 0, sheetPushed = false;
function renderMedia(it) {
  const p = it.p; const g = p.gallery || []; const stage = $('#pStage'), thumbs = $('#pThumbs');
  const list = [...(p.panelVideo ? [{ v: p.panelVideo }] : []), ...(g.length ? g : p.panelVideo ? [] : [p.img])];
  const show = (k) => { gIdx = k; const m = list[k];
    stage.innerHTML = m.v ? `<video src="${m.v}" poster="${p.img}" controls autoplay muted playsinline></video>` : `<img src="${m}" alt="${p.title}">`;
    if (!reduce) stage.firstChild.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    [...thumbs.children].forEach((b, j) => b.classList.toggle('on', j === k)); };
  thumbs.innerHTML = list.length > 1 ? list.map((m) => `<button aria-label="Voir l’image"><img src="${m.v ? p.img : m}" alt="" loading="lazy" decoding="async"></button>`).join('') : '';
  [...thumbs.children].forEach((b, j) => b.addEventListener('click', () => show(j)));
  show(0);
}
function fillSheet(it) {
  sheetIt = it; const p = it.p;
  $('#pLabel').textContent = `${CHAPTERS[p.ch].n} · ${p.label}`; $('#pTitle').textContent = p.title;
  const c = p.cas, pc = $('#pCase'), pd = $('#pDesc'), pr = $('#pRole');
  pd.hidden = !!c; pd.textContent = c ? '' : p.desc; pc.hidden = pr.hidden = !c;
  if (c) {
    pr.innerHTML = `<span>Mon rôle</span>${c.role}`;
    pc.innerHTML = [['Contexte', c.ctx], ['Enjeu', c.pb], ['Réponse', c.sol], ['Résultat', c.res]]
      .map(([k, v], j) => `<li${j === 3 ? ' class="res"' : ''}><b>${k}</b><p>${v}</p></li>`).join('');
  }
  $('#pBody').scrollTop = 0;
  $('#pTags').innerHTML = (p.tags || []).map((t) => `<span>${t}</span>`).join('');
  const l = $('#pLink'); if (p.link) { l.hidden = false; l.href = p.link; l.textContent = p.linkLabel || 'Voir le projet'; l.target = p.link.startsWith('http') ? '_blank' : '_self'; } else l.hidden = true;
  $('#pN').textContent = `${String(it.i + 1).padStart(2, '0')} / ${N}`;
  renderMedia(it);
}
const v3 = new THREE.Vector3();
function cardScreen(it) { it.group.getWorldPosition(v3); v3.project(camera); return { x: ((v3.x + 1) / 2) * innerWidth, y: ((1 - v3.y) / 2) * innerHeight }; }
function openSheet(it, { push = true } = {}) {
  if (!it || sheet.open) return; go(it.i); fillSheet(it); sheet.showModal(); $('#pClose').focus({ preventScroll: true }); $('#pBody').scrollTop = 0; sheet.scrollTop = 0;
  if (push) { history.pushState({ sheet: 1 }, '', '#' + it.slug); sheetPushed = true; } else setHash('#' + it.slug);
  const r = sheet.getBoundingClientRect(), c = cardScreen(it);
  sheet.style.transformOrigin = `${c.x - r.left}px ${c.y - r.top}px`;
  if (!reduce) sheet.animate([{ opacity: 0, transform: 'scale(.62)', filter: 'blur(10px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
}
let closing = false;
function closeSheet(fromPop) {
  if (!sheet.open || closing) return;
  if (sheetPushed && fromPop !== true) { sheetPushed = false; history.back(); return; } // le bouton retour du navigateur ferme aussi la fiche
  sheetPushed = false; closing = true;
  if (reduce) { closing = false; return sheet.close(); }
  const a = sheet.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'scale(.62)', filter: 'blur(10px)' }], { duration: 340, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
  a.onfinish = () => { sheet.close(); a.cancel(); closing = false; };
}
function sheetStep(d) { const i = (sheetIt.i + d + N) % N; go(i); fillSheet(items[i]); setHash('#' + items[i].slug); if (!reduce) sheet.querySelector('.sheet__body').animate([{ opacity: 0, transform: `translateX(${d * 16}px)` }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' }); }
$('#pClose').addEventListener('click', () => closeSheet());
sheet.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(); });
sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
sheet.addEventListener('close', () => { if (!sheetPushed) syncHash(true); });
$('#pPrev').addEventListener('click', () => sheetStep(-1)); $('#pNext').addEventListener('click', () => sheetStep(1));

/* ---------------- boucle ---------------- */
const OV = { hero: $('[data-ov="hero"]'), about: $('[data-ov="about"]'), end: $('[data-ov="end"]') };
const TINTS = ['#3a2614', '#14516a', '#4a1215', '#0f3a52'];
const tint = new THREE.Color('#14516a'), tintT = new THREE.Color();
const camPos = new THREE.Vector3(), look = new THREE.Vector3(), tmp = new THREE.Vector3();
const par = { x: 0, y: 0 }; let lastIdx = -1;
const bg = $('#bg'), bgTint = $('#bgTint'), railFill = $('#railFill'), railA = $('#railA');
const css = (el, k, v) => { const c = el.__c || (el.__c = {}); if (c[k] !== v) { c[k] = v; el.style[k] = v; } };
function ov(el, o, base) { const r = Math.round(o * 1000) / 1000; css(el, 'opacity', String(r)); css(el, 'transform', `${base} translateY(${((1 - r) * 16).toFixed(1)}px)`); css(el, 'pointerEvents', r > 0.6 ? 'auto' : 'none'); }
const MAX_DPR = Math.min(devicePixelRatio, LITE ? 1.5 : 1.75); let dpr = MAX_DPR, ftAvg = 1 / 60, ftN = 0, good = 0;
function adapt(dt) { // garde 60 i/s : baisse la résolution si l'appareil peine, la remonte s'il est à l'aise
  ftAvg = ftAvg * 0.95 + dt * 0.05; if (++ftN < 90) return; ftN = 0;
  // on baisse vite, on remonte lentement (jamais sur mobile) : pas de va-et-vient qui ferait saccader
  if (ftAvg > 1 / 48 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); good = 0; }
  else if (!LITE && ftAvg < 1 / 58 && dpr < MAX_DPR && ++good >= 4) { dpr = Math.min(MAX_DPR, dpr + 0.25); renderer.setPixelRatio(dpr); good = 0; }
}
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime; adapt(dt);
  if (!drag.active) stepSpring(dt);
  const p = spring.x;
  at(camCurve, p, camPos); at(lookCurve, p, look);
  if (!isTouch && !reduce) { par.x = damp(par.x, mouse.in ? mouse.x : 0, 2.2, dt); par.y = damp(par.y, mouse.in ? mouse.y : 0, 2.2, dt); }
  camPos.x += par.x * 0.28; camPos.y += par.y * 0.16;
  camera.position.copy(camPos); camera.lookAt(look);
  rim.position.copy(camPos).add(tmp.set(-3, 2, -4));
  // logos
  const lt = ready ? t - introT0 : 0;
  if (logo) {
    animLogo(logo, reduce ? 9 : lt, lt);
    const g = smooth(-1.9, -1.35, p); logo.scale.setScalar(Math.max(1e-4, (isSmall() ? 0.6 : 1) * (1 - g))); logo.visible = g < 0.999;
    logo.rotation.y = damp(logo.rotation.y, par.x * 0.45 + Math.sin(t * 0.35) * 0.06, 4, dt); logo.rotation.x = damp(logo.rotation.x, -par.y * 0.25, 4, dt);
  }
  if (logoEnd) { const et = Math.max(0, (p - (N - 0.7)) / 0.7 * 2.4); animLogo(logoEnd, reduce ? 9 : et, lt); logoEnd.visible = p > N - 1; logoEnd.rotation.y = Math.sin(t * 0.4) * 0.12 + par.x * 0.3; }
  // cartes
  const hov = !isTouch && !drag.active && !sheet.open && mouse.in ? pick((mouse.x + 1) / 2 * innerWidth, (1 - mouse.y) / 2 * innerHeight) : null;
  css(canvas, 'cursor', drag.active ? '' : hov ? 'pointer' : '');
  const heroHide = isSmall() && p < -1.2;
  items.forEach((it) => {
    const d = it.i - p, ad = Math.abs(d);
    let o = d < 0 ? clamp(1 + (d + 0.3) / 0.45) : 1 - smooth(5, 7.5, d);   // la carte dépassée s'efface avant de traverser la caméra
    if (heroHide) o *= smooth(-1.75, -1.25, p);                       // sur téléphone, l'accueil reste dégagé derrière le titre
    it.mat.opacity = o; it.shadowMat.opacity = 0.45 * o; it.group.visible = o > 0.01;
    it.hover = damp(it.hover, it === hov ? 1 : 0, 10, dt);
    it.pressS = damp(it.pressS || 0, it.press, 18, dt);
    it.group.rotation.y = -it.side * Math.min(1, ad) * 0.28 + (it === hov ? par.x * 0.08 : 0);
    const lean = clamp(spring.v * 0.035, -0.12, 0.12);
    it.group.rotation.x = (it === hov ? -par.y * 0.06 : 0) + lean * 0.6;
    it.group.position.z = it.z - Math.abs(lean) * 0.25;
    if (it.fadeIn !== undefined && it.fadeIn < 1) { it.fadeIn = Math.min(1, it.fadeIn + dt / 0.45); it.mat.color.setScalar(0.12 + 0.88 * (1 - Math.pow(1 - it.fadeIn, 3))); }
    it.group.scale.setScalar((1 - Math.min(1, ad) * 0.04) * (1 + it.hover * 0.025) * (1 - it.pressS * 0.03));
    it.anchor.rotation.set(t * 0.7 + it.i, t * 0.5, 0);
    if (it.video) { const near = ad < 2.5; if (near && it.video.paused) it.video.play().then(() => { it.mat.map = it.vtex; it.mat.needsUpdate = true; }).catch(() => {}); else if (!near && !it.video.paused) it.video.pause(); }
  });
  // calques et barre
  ov(OV.hero, 1 - smooth(-1.85, -1.5, p), '');
  ov(OV.about, 1 - smooth(0.22, 0.55, Math.abs(p + 1)), isSmall() ? '' : 'translateY(-50%)');
  ov(OV.end, smooth(N - 0.45, N - 0.08, p), 'translate(-50%,-50%)');
  const bo = smooth(-0.55, -0.2, p) * (1 - smooth(N - 0.55, N - 0.2, p)) * (sheet.open ? 0 : 1);
  const br = Math.round(bo * 1000) / 1000; css(bar, 'opacity', String(br)); css(bar, 'transform', `translate(-50%,${((1 - br) * 120).toFixed(1)}%)`); css(bar, 'pointerEvents', br > 0.6 ? 'auto' : 'none');
  const idx = clamp(Math.round(p), 0, N - 1); if (bo > 0.05) showBar(idx, idx >= lastIdx ? 1 : -1); lastIdx = idx;
  if (!sheet.open && Math.abs(spring.v) < 0.05 && Math.abs(p - spring.target) < 0.02) syncHash();
  // chapitre actif : contrôle segmenté, teinte du fond
  const ch = p < -0.5 ? -1 : p > N - 0.5 ? 4 : items[idx].p.ch;
  segBtns.forEach((b, i) => b.classList.toggle('on', i === ch));
  const ab = segBtns[ch]; if (ab && seg.offsetParent) { pillS.x = damp(pillS.x, ab.offsetLeft, 12, dt); pillS.w = damp(pillS.w, ab.offsetWidth, 12, dt); css(pill, 'transform', `translateX(${pillS.x.toFixed(1)}px)`); css(pill, 'width', `${pillS.w.toFixed(1)}px`); css(pill, 'opacity', '1'); } else css(pill, 'opacity', '0');
  tintT.set(ch >= 0 && ch < 4 ? TINTS[ch] : '#14516a'); tint.lerp(tintT, 1 - Math.exp(-2 * dt)); css(bgTint, 'background', `#${tint.getHexString()}`);
  const fr = (p - P_MIN) / (P_MAX - P_MIN); css(railFill, 'height', `${(fr * 100).toFixed(2)}%`); css(railA, 'top', `${(fr * 100).toFixed(2)}%`);
  if (!LITE) css(bg, 'transform', `translate3d(${(-par.x * 12).toFixed(1)}px,${(par.y * 8 - fr * 30).toFixed(1)}px,0)`);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(frame);
document.addEventListener('visibilitychange', () => renderer.setAnimationLoop(document.hidden ? null : frame));
addEventListener('resize', () => { camera.fov = FOV(); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); place(); });
/* ---------------- v5 · liens par projet (#slug), retour navigateur ---------------- */
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
items.forEach((it) => { it.slug = slugify(it.p.title); });
const bySlug = Object.fromEntries(items.map((it) => [it.slug, it]));
const hashFor = (x) => { const r = Math.round(x); return r <= P_MIN ? '' : r === -1 ? '#a-propos' : r >= P_MAX ? '#contact' : '#' + items[r].slug; };
let hashT = 0;
function setHash(h) { if (location.hash === h || (!h && !location.hash)) return; history.replaceState(history.state, '', h || location.pathname + location.search); }
function syncHash(now) { // remplacement différé : on n'inscrit l'adresse qu'une fois posé sur un projet
  clearTimeout(hashT); const h = hashFor(spring.target);
  if (now) return setHash(h); hashT = setTimeout(() => { if (!sheet.open) setHash(hashFor(spring.target)); }, 300);
}
addEventListener('popstate', (e) => {
  const want = e.state && e.state.sheet;
  if (sheet.open && !want) closeSheet(true);
  else if (!sheet.open && want) { const it = bySlug[location.hash.slice(1)]; if (it) { openSheet(it, { push: false }); sheetPushed = true; } }
});
{ // arrivée par un lien partagé : on se place directement sur le projet et on ouvre sa fiche
  const h = decodeURIComponent(location.hash.slice(1)); const it = bySlug[h];
  const start = it ? it.i : h === 'contact' ? P_MAX : h === 'a-propos' ? -1 : null;
  if (start !== null) {
    spring.x = spring.target = start; spring.v = 0; moved = true; $('#hint').style.opacity = 0;
    if (it) { const wait = () => (ready ? setTimeout(() => openSheet(it, { push: false }), 450) : setTimeout(wait, 120)); wait(); }
  }
}

/* ---------------- v5 · fenêtres « Me contacter » et « Tous les projets » ---------------- */
const contact = $('#contactDlg'), grid = $('#gridDlg');
function modalOpen() { return contact.open || grid.open; }
function materialize(dlg, from, closingOut) { // la fenêtre naît du bouton qui l'a ouverte
  if (reduce) return null;
  const r = dlg.getBoundingClientRect(), b = from.getBoundingClientRect();
  dlg.style.transformOrigin = `${b.left + b.width / 2 - r.left}px ${b.top + b.height / 2 - r.top}px`;
  const k = [{ opacity: 0, transform: 'scale(.86)', filter: 'blur(8px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }];
  return dlg.animate(closingOut ? k.reverse() : k, { duration: closingOut ? 220 : 420, easing: closingOut ? 'cubic-bezier(.4,0,1,1)' : 'cubic-bezier(.22,1,.36,1)', fill: closingOut ? 'forwards' : 'none' });
}
function openDlg(dlg, from) { if (dlg.open) return; dlg._from = from; dlg.showModal(); materialize(dlg, from); }
function closeDlg(dlg, then) {
  if (!dlg.open || dlg._closing) return; dlg._closing = true;
  const a = materialize(dlg, dlg._from || dlg, true);
  const done = () => { dlg.close(); if (a) a.cancel(); dlg._closing = false; if (then) then(); };
  if (a) a.onfinish = done; else done();
}
[contact, grid].forEach((d) => {
  d.addEventListener('cancel', (e) => { e.preventDefault(); closeDlg(d); });
  d.addEventListener('click', (e) => { if (e.target === d) closeDlg(d); });
  d.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => closeDlg(d)));
});
// Me contacter
$('#contactBtn').addEventListener('click', (e) => openDlg(contact, e.currentTarget));
$('#copyMail').addEventListener('click', async (e) => {
  const b = e.currentTarget, mail = b.dataset.mail; let ok = false;
  try { await navigator.clipboard.writeText(mail); ok = true; } catch (_) {
    const t = document.createElement('textarea'); t.value = mail; contact.appendChild(t); t.select(); try { ok = document.execCommand('copy'); } catch (__) {} t.remove();
  }
  b.classList.toggle('ok', ok); b.querySelector('span').textContent = ok ? 'Copié ✓' : 'Copier';
  clearTimeout(b._t); b._t = setTimeout(() => { b.classList.remove('ok'); b.querySelector('span').textContent = 'Copier'; }, 2200);
});
// Tous les projets
const gridList = $('#gridList'), chips = $('#gridChips');
gridList.innerHTML = items.map((it) => `<li data-ch="${it.p.ch}"><button data-i="${it.i}">
  <span class="g__img"><img src="${it.p.img}" alt="" loading="lazy" decoding="async"></span>
  <span class="g__meta"><small>${String(it.i + 1).padStart(2, '0')} · ${it.p.label}</small><b>${it.p.title}</b></span></button></li>`).join('');
chips.innerHTML = `<button aria-pressed="true" data-f="-1">Tout <i>${N}</i></button>` + CHAPTERS.map((c, i) =>
  `<button aria-pressed="false" data-f="${i}"><b>${c.n}</b> ${c.title} <i>${items.filter((it) => it.p.ch === i).length}</i></button>`).join('');
function filterGrid(f) {
  chips.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.f === f)));
  let k = 0;
  gridList.querySelectorAll('li').forEach((li) => {
    const on = f < 0 || +li.dataset.ch === f; li.hidden = !on;
    if (on && !reduce) li.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: Math.min(k++, 12) * 22, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
  });
}
chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) filterGrid(+b.dataset.f); });
function openGrid(from = $('#gridBtn')) {
  const cur = clamp(Math.round(spring.target), 0, N - 1);
  gridList.querySelectorAll('button').forEach((b) => b.classList.toggle('cur', +b.dataset.i === cur && spring.target > -0.5 && spring.target < N - 0.5));
  openDlg(grid, from);
  const c = gridList.querySelector('.cur'); if (c && !c.closest('li').hidden) c.scrollIntoView({ block: 'center' });
}
$('#gridBtn').addEventListener('click', (e) => openGrid(e.currentTarget));
gridList.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-i]'); if (!b) return; const it = items[+b.dataset.i];
  closeDlg(grid, () => { // on voyage jusqu'à la carte, puis sa fiche s'ouvre depuis elle
    go(it.i, { zeta: 1, response: 0.7 }); const t0 = performance.now();
    const land = () => (Math.abs(spring.x - it.i) < 0.04 || performance.now() - t0 > 1600 ? openSheet(it) : requestAnimationFrame(land)); land();
  });
});

window.__go = (x) => { spring.x = spring.target = x; spring.v = 0; };
window.__s = spring; window.__close = () => closeSheet();
