// Portfolio 3D — Elhadji Ndour · v2 (fluide, interactif, lisible). Three.js r160.
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
const easeIO = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/* ---------------- WebGL ---------------- */
const canvas = $('#gl');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { $('#nogl').hidden = false; $('#loader').classList.add('done'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, isSmall() ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight, false);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0f0e0d, 9, 30);
const FOV = () => (isSmall() ? 62 : 48);
const camera = new THREE.PerspectiveCamera(FOV(), innerWidth / innerHeight, 0.1, 120);

scene.add(new THREE.HemisphereLight(0xf2ece2, 0x14100c, 0.8));
const key = new THREE.DirectionalLight(0xffe2c8, 1.6); key.position.set(3, 5, 7); scene.add(key);
const rim = new THREE.PointLight(0x43deff, 28, 16, 2); scene.add(rim);
const warm = new THREE.PointLight(0xe65013, 22, 12, 2); warm.position.set(2.5, -0.6, 2.5); scene.add(warm);

/* ---------------- chargement ---------------- */
const clock = new THREE.Clock();
const manager = new THREE.LoadingManager();
manager.onProgress = (_, l, t) => { $('#pct').textContent = Math.round((l / t) * 100); };
let ready = false, introT0 = 0;
const finish = () => { if (ready) return; ready = true; $('#loader').classList.add('done'); document.body.classList.add('ready'); introT0 = clock.elapsedTime; };
manager.onLoad = () => setTimeout(finish, 250);
setTimeout(finish, 6000);
const texLoader = new THREE.TextureLoader(manager);

/* ---------------- logo « en. » en volume ---------------- */
const LG = { cx: 256.3, cy: 187.02, hx: 310.2, hy: 135.32, r: 5.94, sw: 2.42, left: 7.26, right: 316.14, top: 76.8, bottom: 200 };
const DEPTH = 26;
function buildLogo(svgText) {
  const root = new THREE.Group(); const inner = new THREE.Group(); root.add(inner);
  const data = new SVGLoader().parse(svgText);
  const cream = new THREE.MeshPhysicalMaterial({ color: 0xf2ece2, roughness: 0.36, metalness: 0.04, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xe65013, emissive: 0xe65013, emissiveIntensity: 0.28, roughness: 0.42 });
  const parts = {};
  data.paths.forEach((p) => {
    const id = p.userData.node.id;
    const geo = new THREE.ExtrudeGeometry(SVGLoader.createShapes(p), { depth: DEPTH, bevelEnabled: true, bevelThickness: 3, bevelSize: 1.4, bevelSegments: 4, curveSegments: 14 });
    geo.computeBoundingBox(); const c = new THREE.Vector3(); geo.boundingBox.getCenter(c); geo.translate(-c.x, -c.y, -c.z);
    const g = new THREE.Group(); g.position.copy(c); g.add(new THREE.Mesh(geo, id === 'd' ? orange : cream)); inner.add(g);
    parts[id] = g; g.userData.home = c.clone();
  });
  const h = new THREE.Group(); h.position.set(LG.cx, LG.cy, DEPTH / 2); inner.add(h);
  const dx = LG.hx - LG.cx, dy = LG.hy - LG.cy, len = Math.hypot(dx, dy);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(LG.sw * 0.75, LG.sw * 0.75, len, 16), orange);
  stem.rotation.z = Math.atan2(dy, dx) - Math.PI / 2; h.add(stem);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(LG.r * 1.25, 32, 16), orange); h.add(knob);
  Object.assign(parts, { h, stem, knob });
  inner.scale.set(0.017, -0.017, 0.017);
  inner.position.set(-((LG.left + LG.right) / 2) * 0.017, ((LG.top + LG.bottom) / 2) * 0.017, -DEPTH * 0.017 / 2);
  root.userData.parts = parts; root.userData.kick = -10;
  return root;
}
let logo = null, logoEnd = null;
fetch('logo3d.svg').then((r) => r.text()).then((t) => {
  logo = buildLogo(t); scene.add(logo); placeHero();
  logoEnd = buildLogo(t); scene.add(logoEnd); placeEnd();
});
const back = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const out = (x) => 1 - Math.pow(1 - x, 3);
const pullCurve = (pq) => (pq <= 0 || pq >= 1 ? 0 : pq < .3 ? -0.7 * out(pq / .3) : pq < .6 ? -0.7 + 0.95 * ((pq - .3) / .3) : 0.25 * (1 - (pq - .6) / .4));
function animLogo(L, t, now) {
  if (!L) return;
  const P = L.userData.parts; const q = (a, d) => clamp((t - a) / d);
  const d = q(0, 0.6); P.d.scale.setScalar(Math.max(1e-4, back(d))); P.d.rotation.z = (1 - out(d)) * -Math.PI;
  P.d.position.z = P.d.userData.home.z + (1 - out(d)) * 80;
  const s = out(q(0.35, 0.45));
  P.stem.scale.y = Math.max(1e-4, s); P.stem.position.set((LG.hx - LG.cx) / 2 * s, (LG.hy - LG.cy) / 2 * s, 0);
  P.knob.scale.setScalar(Math.max(1e-4, back(q(0.7, 0.4)))); P.knob.position.set((LG.hx - LG.cx) * s, (LG.hy - LG.cy) * s, 0);
  const idle = t > 2.2 ? Math.sin((t - 2.2) * 1.4) * 0.12 : 0;
  P.h.rotation.z = -(pullCurve(q(0.85, 1.2)) + pullCurve((now - L.userData.kick) / 1.2) + idle);
  const le = out(q(0.9, 0.8)), ln = out(q(1.0, 0.8)), w = back(q(1.55, 0.5));
  P.e.position.x = P.e.userData.home.x - (1 - le) * 120 - (1 - clamp(w)) * 14; P.e.position.z = P.e.userData.home.z + (1 - le) * 160; P.e.rotation.y = (1 - le) * 0.9;
  P.n.position.x = P.n.userData.home.x + (1 - ln) * 120 + (1 - clamp(w)) * 14; P.n.position.z = P.n.userData.home.z + (1 - ln) * 160; P.n.rotation.y = (1 - ln) * -0.9;
  P.e.visible = t > 0.9; P.n.visible = t > 1.0;
}

/* ---------------- galerie ---------------- */
const SP = isSmall() ? 4.6 : 4.4, CH_GAP = 3.2, Z0 = -9;
const planeH = isSmall() ? 1.9 : 2.5;
const items = []; let zCursor = Z0; const chapterZ = [];
const roundedRect = (w, h, r) => { const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
function uvFit(geo, w, h) { const pos = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5); uv.needsUpdate = true; }
const cubeGeo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
const orangeMat = new THREE.MeshStandardMaterial({ color: 0xe65013, emissive: 0xe65013, emissiveIntensity: 0.5 });
const labels = $('#labels');
PROJECTS.forEach((p, i) => {
  if (i > 0 && p.ch !== PROJECTS[i - 1].ch) zCursor -= CH_GAP;
  if (chapterZ[p.ch] === undefined) chapterZ[p.ch] = zCursor;
  const side = i % 2 === 0 ? -1 : 1;
  const x = side * (isSmall() ? 1.05 : 2.35), y = Math.sin(i * 1.7) * (isSmall() ? 0.3 : 0.4), z = zCursor;
  const group = new THREE.Group(); group.position.set(x, y, z);
  const card = new THREE.Group(); group.add(card);
  const mat = new THREE.MeshBasicMaterial({ color: 0x222222, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); card.add(mesh);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 }));
  shadow.position.set(0.1, -0.12, -0.06); card.add(shadow);
  const anchor = new THREE.Mesh(cubeGeo, orangeMat); card.add(anchor);
  scene.add(group);
  const lab = document.createElement('button'); lab.className = 'lab';
  lab.innerHTML = `<small>${String(i + 1).padStart(2, '0')} · ${p.label}</small><b>${p.title}</b><span>Ouvrir le projet ↗</span>`;
  labels.appendChild(lab);
  const it = { p, i, group, card, mesh, shadow, anchor, lab, x, y, z, side, hover: 0, tx: 0, ty: 0, vx: 0, w: planeH * 1.33, h: planeH, near: 0 };
  lab.addEventListener('click', () => focusOn(it));
  const setSize = (aspect) => {
    let h = planeH, w = h * aspect; const maxW = isSmall() ? 2.1 : 3.5; if (w > maxW) { w = maxW; h = w / aspect; }
    it.w = w; it.h = h;
    const g = new THREE.ShapeGeometry(roundedRect(w, h, 0.05), 6); uvFit(g, w, h); mesh.geometry.dispose(); mesh.geometry = g;
    shadow.scale.set(w, h, 1); anchor.position.set(side * -(w / 2) - side * 0.16, -h / 2 - 0.12, 0.02);
  };
  setSize(4 / 3);
  if (p.video) {
    const v = document.createElement('video'); Object.assign(v, { src: p.video, muted: true, loop: true, playsInline: true, preload: 'metadata' });
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    const vt = new THREE.VideoTexture(v); vt.colorSpace = THREE.SRGBColorSpace; it.video = v; it.vtex = vt;
    v.addEventListener('loadedmetadata', () => setSize(v.videoWidth / v.videoHeight));
  }
  texLoader.load(p.img, (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (!mat.map) { mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true; }
    if (!p.video) setSize(t.image.width / t.image.height);
  });
  items.push(it); zCursor -= SP;
});
const Z_END = zCursor - 4;
function placeEnd() { if (!logoEnd) return; logoEnd.position.set(0, isSmall() ? 2.5 : 1.85, Z_END - 5.5); logoEnd.scale.setScalar(isSmall() ? 0.42 : 0.6); }
function placeHero() { if (!logo) return; if (isSmall()) logo.position.set(0, 1.45, 0); else logo.position.set(1.9, 0.15, 0); }

/* ---------------- chemin de la caméra ---------------- */
const pts = isSmall()
  ? [new THREE.Vector3(0, 0.25, 8.2), new THREE.Vector3(0, -0.4, 5), new THREE.Vector3(0, -0.9, 1.5), new THREE.Vector3(0, -0.2, -2), new THREE.Vector3(0, 0, Z0 + 5)]
  : [new THREE.Vector3(0, 0.25, 8.2), new THREE.Vector3(-0.9, 0.1, 4.6), new THREE.Vector3(-2.2, 0, 0.8), new THREE.Vector3(-0.8, 0, -3), new THREE.Vector3(0, 0, Z0 + 5)];
const CAM_OFF = isSmall() ? 3.6 : 3.2;
items.forEach((it, i) => pts.push(new THREE.Vector3(Math.sin(i * 0.55) * (isSmall() ? 0.12 : 0.3), it.y * 0.25 + 0.05, it.z + CAM_OFF)));
pts.push(new THREE.Vector3(0, 0.15, Z_END + 2.5), new THREE.Vector3(0, 0.15, Z_END + 0.4));
const path = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
const guidePts = path.getSpacedPoints(400).map((v) => new THREE.Vector3(v.x * 0.6, v.y - (isSmall() ? 1.55 : 1.75), v.z - 1.5));
scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(guidePts), 600, 0.009, 6, false), new THREE.MeshBasicMaterial({ color: 0xe65013, transparent: true, opacity: 0.85 })));
let dust;
{
  const n = isSmall() ? 500 : 1100, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = (Math.random() - 0.5) * 16; arr[i * 3 + 1] = (Math.random() - 0.5) * 9; arr[i * 3 + 2] = 9 - Math.random() * (9 - Z_END + 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  dust = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xf2ece2, size: 0.02, transparent: true, opacity: 0.5, depthWrite: false })); scene.add(dust);
}
const SAMPLES = 1600; const zs = [];
for (let i = 0; i <= SAMPLES; i++) zs.push(path.getPointAt(i / SAMPLES).z);
const uAtZ = (z) => { let best = 0, bd = 1e9; for (let i = 0; i <= SAMPLES; i++) { const d = Math.abs(zs[i] - z); if (d < bd) { bd = d; best = i; } } return best / SAMPLES; };
items.forEach((it) => { it.u = uAtZ(it.z + CAM_OFF); });
const chU = chapterZ.map((z) => uAtZ(z + 6.5));
const chEndU = CHAPTERS.map((_, c) => items.filter((it) => it.p.ch === c).pop().u + 0.012);
const S_INTRO = 0.13, U_G = chU[0] - 0.006;
const s2u = (s) => (s < S_INTRO ? (s / S_INTRO) * U_G : U_G + ((s - S_INTRO) / (1 - S_INTRO)) * (1 - U_G));
const u2s = (u) => (u < U_G ? (u / U_G) * S_INTRO : S_INTRO + ((u - U_G) / (1 - U_G)) * (1 - S_INTRO));

/* ---------------- défilement & navigation ---------------- */
const setHeight = () => { $('#scroller').style.height = `${Math.round(innerHeight * (PROJECTS.length * 0.8 + 7))}px`; };
setHeight();
let target = 0, prog = 0, vel = 0;
const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
addEventListener('scroll', () => { target = clamp(scrollY / Math.max(1, maxScroll())); }, { passive: true });
const goTo = (s) => scrollTo({ top: clamp(s) * maxScroll(), behavior: reduce ? 'auto' : 'smooth' });
document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', (e) => {
  e.preventDefault(); const g = b.dataset.go; goTo(g === '0' ? 0 : g === '1' ? 1 : u2s(chU[+g.slice(1)] + 0.004));
}));
let curIdx = -1;
const step = (d) => { const nxt = clamp(curIdx + d, -1, items.length); goTo(nxt < 0 ? 0 : nxt >= items.length ? 1 : u2s(items[nxt].u)); };
$('#prev').addEventListener('click', () => step(-1));
$('#next').addEventListener('click', () => step(1));
const panel = $('#panel');
addEventListener('keydown', (e) => {
  if (panel.open) return;
  if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); step(1); }
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1); }
  if (e.key === 'Enter' && curIdx >= 0 && items[curIdx].near > 0.5) focusOn(items[curIdx]);
});

/* ---------------- calques HTML ---------------- */
const chWrap = $('#chapters');
CHAPTERS.forEach((c, i) => {
  const s = document.createElement('section'); s.className = 'ov ov--ch'; s.dataset.ov = 'c' + i;
  s.innerHTML = `<div class="n">${c.n}</div><h2>${c.title}</h2><p>${c.sub}</p>`; chWrap.appendChild(s);
});
chU.forEach((u) => { const i = document.createElement('i'); i.style.top = `${u2s(u) * 100}%`; $('#railTicks').appendChild(i); });
const OV = [...document.querySelectorAll('[data-ov]')];
const window01 = (x, a, b, f = 0.012) => Math.min(smooth(a - f, a, x), 1 - smooth(b, b + f, x));
const navBtns = [...document.querySelectorAll('.chap button')];
const TINTS = ['#3a2614', '#14516a', '#4a1215', '#0f3a52'];
const tint = new THREE.Color('#14516a'), tintTarget = new THREE.Color();
function updateOverlays(u, s) {
  OV.forEach((el) => {
    const k = el.dataset.ov; let o = 0;
    if (k === 'hero') o = 1 - smooth(0.008, 0.035, s);
    else if (k === 'hint') o = (ready ? 1 : 0) * (1 - smooth(0.002, 0.012, s));
    else if (k === 'about') o = window01(s, 0.045, 0.095, 0.012);
    else if (k === 'end') o = smooth(0.975, 0.995, u);
    else if (k[0] === 'c') { const a = u2s(chU[+k.slice(1)]); o = window01(s, a - 0.004, a + 0.026, 0.01); }
    el.style.opacity = o.toFixed(3);
    const base = k === 'about' && !isSmall() ? 'translateY(-50%) ' : k === 'end' ? 'translate(-50%,-50%) ' : k === 'hint' ? 'translateX(-50%) ' : '';
    el.style.transform = base + `translateY(${(1 - o) * 22}px)`;
    el.classList.toggle('live', o > 0.6);
  });
  const cur = CHAPTERS.findIndex((_, c) => u >= chU[c] - 0.015 && u < chEndU[c]);
  navBtns.forEach((b, i) => b.classList.toggle('on', i === cur || (i === 4 && u > 0.97)));
  $('#railFill').style.height = `${s * 100}%`; $('#railA').style.top = `${s * 100}%`;
  $('#cnt').textContent = String(Math.max(0, curIdx + 1)).padStart(2, '0');
  return cur;
}

/* ---------------- curseur, survol, clic ---------------- */
const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2(9, 9); const mpx = { x: innerWidth / 2, y: innerHeight / 2 }; const cur = { x: mpx.x, y: mpx.y };
const cursor = $('#cursor');
addEventListener('pointermove', (e) => { mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); mpx.x = e.clientX; mpx.y = e.clientY; });
let focus = { it: null, f: 0, to: 0, opened: false };
function focusOn(it) { if (!it) return; focus = { it, f: focus.it === it ? focus.f : 0, to: 1, opened: false }; }
function openProject(it) {
  const p = it.p;
  $('#pLabel').textContent = p.label; $('#pTitle').textContent = p.title; $('#pDesc').textContent = p.desc;
  $('#pTags').innerHTML = (p.tags || []).map((t) => `<span>${t}</span>`).join('');
  $('#pMedia').innerHTML = p.video ? `<video src="${p.video}" autoplay muted loop playsinline poster="${p.img}"></video>` : `<img src="${p.img}" alt="${p.title}">`;
  const l = $('#pLink'); if (p.link) { l.hidden = false; l.href = p.link; l.textContent = p.linkLabel || 'Voir le projet'; l.target = p.link.startsWith('http') ? '_blank' : '_self'; } else l.hidden = true;
  $('#pN').textContent = `${String(it.i + 1).padStart(2, '0')} / ${items.length}`;
  panel.showModal();
}
panel.addEventListener('close', () => { focus.to = 0; });
$('#pClose').addEventListener('click', () => panel.close());
panel.addEventListener('click', (e) => { if (e.target === panel) panel.close(); });
const jump = (d) => { const i = (focus.it.i + d + items.length) % items.length; panel.close(); goTo(u2s(items[i].u)); setTimeout(() => focusOn(items[i]), 60); };
$('#pPrev').addEventListener('click', () => jump(-1));
$('#pNext').addEventListener('click', () => jump(1));
let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', (e) => {
  if (!downAt) return; const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  if (moved > 8 || performance.now() - downAt.t > 500) return;
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObjects(items.map((it) => it.mesh))[0];
  if (hit) return focusOn(items.find((it) => it.mesh === hit.object));
  if (logo && logo.visible && ray.intersectObject(logo, true).length) logo.userData.kick = clock.elapsedTime - introT0;
});

/* ---------------- boucle ---------------- */
const look = new THREE.Vector3(), camPos = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), fPos = new THREE.Vector3(), fLook = new THREE.Vector3(), q = new THREE.Quaternion();
const par = { x: 0, y: 0 }; let roll = 0, fovK = 0;
const bg = $('#bg'); const bgTint = $('#bgTint');
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05); const t = clock.elapsedTime;
  const prevProg = prog;
  prog = damp(prog, target, reduce ? 30 : 3.4, dt);
  vel = damp(vel, (prog - prevProg) / Math.max(dt, 1e-3), 6, dt);
  const s = clamp(prog, 0, 0.9999); const u = s2u(s);
  path.getPointAt(u, camPos); path.getPointAt(Math.min(1, u + 0.018), look);
  const atStart = 1 - smooth(0.0, 0.035, u), atEnd = smooth(0.95, 0.995, u);
  look.lerp(tmp.set(isSmall() ? 0 : 0.9, isSmall() ? 0.5 : 0.05, 0), atStart);
  look.lerp(tmp.set(0, 0.15, Z_END - 5.5), atEnd);
  if (!isTouch) { par.x = damp(par.x, mouse.x === 9 ? 0 : mouse.x, 2.5, dt); par.y = damp(par.y, mouse.y === 9 ? 0 : mouse.y, 2.5, dt); }
  camPos.add(tmp.set(par.x * 0.35, par.y * 0.22, 0));
  focus.f = damp(focus.f, focus.to, 3.2, dt);
  if (focus.it) {
    const it = focus.it; it.group.getWorldPosition(fLook);
    it.group.getWorldQuaternion(q); fPos.set(0, 0, isSmall() ? 3.6 : 3.0).applyQuaternion(q).add(fLook);
    const k = easeIO(clamp(focus.f));
    camPos.lerp(fPos, k); look.lerp(fLook, k);
    if (focus.to === 1 && focus.f > 0.9 && !focus.opened) { focus.opened = true; openProject(it); }
    if (focus.to === 0 && focus.f < 0.01) focus.it = null;
  }
  camera.position.copy(camPos); camera.lookAt(look);
  roll = damp(roll, clamp(vel * (isSmall() ? 1.2 : 2.2), -0.06, 0.06), 5, dt); camera.rotateZ(roll);
  fovK = damp(fovK, clamp(Math.abs(vel) * 60, 0, 7), 4, dt);
  camera.fov = FOV() + fovK; camera.updateProjectionMatrix();
  rim.position.copy(camera.position).add(tmp.set(-3, 2, -4));
  const lt = ready ? t - introT0 : 0;
  if (logo) {
    animLogo(logo, reduce ? 9 : lt, lt);
    const g = smooth(0.012, 0.045, s); const base = isSmall() ? 0.62 : 1;
    logo.scale.setScalar(Math.max(1e-4, base * (1 - g))); logo.visible = g < 0.999;
    logo.rotation.y = damp(logo.rotation.y, par.x * 0.5 + Math.sin(t * 0.4) * 0.08, 4, dt);
    logo.rotation.x = damp(logo.rotation.x, -par.y * 0.3, 4, dt);
  }
  if (logoEnd) { const et = Math.max(0, (u - 0.955) / 0.03 * 2.4); animLogo(logoEnd, reduce ? 9 : et, lt); logoEnd.rotation.y = Math.sin(t * 0.5) * 0.15 + par.x * 0.3; }
  ray.setFromCamera(mouse, camera);
  const hit = !isTouch && !panel.open ? ray.intersectObjects(items.map((it) => it.mesh))[0] : null;
  const h = hit ? items.find((it) => it.mesh === hit.object) : null;
  cursor.classList.toggle('big', !!h); canvas.style.cursor = h ? 'none' : '';
  let best = -1, bd = 1e9;
  items.forEach((it) => {
    const ad = Math.abs(camera.position.z - CAM_OFF - it.z);
    if (ad < bd) { bd = ad; best = it.i; }
    it.near = damp(it.near, clamp(1 - ad / 5.5), 6, dt);
    it.hover = damp(it.hover, it === h ? 1 : 0, 8, dt);
    const uv = it === h && hit.uv ? hit.uv : { x: 0.5, y: 0.5 };
    it.tx = damp(it.tx, (uv.y - 0.5) * -0.32 * it.hover, 8, dt); it.ty = damp(it.ty, (uv.x - 0.5) * 0.4 * it.hover, 8, dt);
    it.vx = damp(it.vx, clamp(-vel * 9, -0.3, 0.3), 5, dt);
    it.group.rotation.set(it.vx, -it.side * (isSmall() ? 0.18 : 0.34) * (1 - it.near * 0.85), 0);
    it.card.rotation.set(it.tx, it.ty, 0);
    it.group.scale.setScalar(1 + it.hover * 0.05 + it.near * 0.05);
    it.group.position.y = it.y + Math.sin(t * 0.6 + it.i) * 0.05;
    it.anchor.rotation.set(t * 0.8 + it.i, t * 0.6, 0);
    tmp2.set(0, -it.h / 2 - 0.08, 0); it.card.localToWorld(tmp2); tmp2.project(camera);
    const vis = tmp2.z < 1 && it.near > 0.12 && !panel.open && focus.f < 0.3 ? clamp((it.near - 0.12) / 0.4) : 0;
    it.lab.style.opacity = vis.toFixed(3); it.lab.style.pointerEvents = vis > 0.6 ? 'auto' : 'none';
    it.lab.style.transform = `translate(${((tmp2.x + 1) / 2) * innerWidth}px,${((1 - tmp2.y) / 2) * innerHeight}px) translate(-50%,0) translateY(${(1 - vis) * 12}px)`;
    if (it.video) {
      const close = ad < 11;
      if (close && it.video.paused) it.video.play().then(() => { it.mesh.material.map = it.vtex; it.mesh.material.needsUpdate = true; }).catch(() => {});
      else if (!close && !it.video.paused) it.video.pause();
    }
  });
  curIdx = u < U_G ? -1 : best;
  const chap = updateOverlays(u, s);
  tintTarget.set(chap >= 0 ? TINTS[chap] : '#14516a'); tint.lerp(tintTarget, 1 - Math.exp(-2 * dt));
  bgTint.style.background = `#${tint.getHexString()}`;
  bg.style.transform = `translate(${-par.x * 14}px,${par.y * 10 - s * 40}px) scale(1.12)`;
  dust.rotation.y = Math.sin(t * 0.05) * 0.05; dust.position.y = Math.sin(t * 0.2) * 0.1;
  cur.x = damp(cur.x, mpx.x, 18, dt); cur.y = damp(cur.y, mpx.y, 18, dt);
  cursor.style.transform = `translate(${cur.x}px,${cur.y}px)`;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(frame);
document.addEventListener('visibilitychange', () => renderer.setAnimationLoop(document.hidden ? null : frame));

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false); setHeight(); placeHero(); placeEnd(); target = clamp(scrollY / Math.max(1, maxScroll()));
});
window.__setProgress = (s) => { target = prog = s; };
