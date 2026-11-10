// La roue en 3D (WebGL) : cartes en volume avec ombres portées, titre « PORTFOLIO » sculpté qui se retourne.
// Unité du monde = 1 pixel CSS sur le plan z = 0, pour caler la 3D exactement sur la mise en page.
import * as THREE from 'three';
import { SVGLoader } from '../3d/vendor/SVGLoader.js';

const C = { paper: '#fbf8f3', paper2: '#e8e0d2', ink: '#131211', ink2: '#3a3633', orange: '#e65013', petrol: '#14516a', cyan: '#43deff', cream: '#f2ece2' };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export async function initGL({ canvas, cards, G, wordEl, logoSvg, reduce, isTouch }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch, alpha: true, powerPreference: 'high-performance' });
  const MAXDPR = Math.min(devicePixelRatio, isTouch ? 1.5 : 2); let dpr = MAXDPR;
  renderer.setPixelRatio(dpr); renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const FOV = 30, camera = new THREE.PerspectiveCamera(FOV, 1, 10, 20000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cfbf, 1.6));
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.2); sun.position.set(-0.5, 1, 0.9); scene.add(sun);

  /* ---------- formes partagées ---------- */
  const rrect = (w, h, r) => { const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const uvFit = (g, w, h) => { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5); uv.needsUpdate = true; };
  const T = 6;                                                     // épaisseur d'une carte (px)
  let frontGeo, bodyGeo, shadowGeo;
  const shadowTex = (() => { const c = document.createElement('canvas'); c.width = 96; c.height = 124; const x = c.getContext('2d');
    x.filter = 'blur(7px)'; x.fillStyle = 'rgba(19,18,17,1)'; x.beginPath(); x.roundRect ? x.roundRect(14, 14, 68, 96, 8) : x.rect(14, 14, 68, 96); x.fill();
    if (!('filter' in x) || x.filter === 'none') { const g = x.createRadialGradient(48, 62, 10, 48, 62, 60); g.addColorStop(0, 'rgba(19,18,17,.9)'); g.addColorStop(1, 'rgba(19,18,17,0)'); x.clearRect(0, 0, 96, 124); x.fillStyle = g; x.fillRect(0, 0, 96, 124); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  function buildGeos() {
    [frontGeo, bodyGeo, shadowGeo].forEach((g) => g && g.dispose());
    const s = rrect(G.cw, G.ch, Math.min(18, G.cw * 0.075));
    frontGeo = new THREE.ShapeGeometry(s, 8); uvFit(frontGeo, G.cw, G.ch);
    bodyGeo = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 8 }); bodyGeo.translate(0, 0, -T);
    shadowGeo = new THREE.PlaneGeometry(G.cw * 96 / 68, G.ch * 124 / 96);
  }
  buildGeos();

  /* ---------- textures des cartes, dessinées comme la maquette ---------- */
  await Promise.race([document.fonts.load('800 20px "Plus Jakarta Sans"'), new Promise((r) => setTimeout(r, 1500))]);
  const texW = () => Math.min(isTouch ? 440 : 640, Math.round(G.cw * Math.max(2, dpr)));
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const cover = (x, img, X, Y, W, H, py = 0.5) => { const s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s; x.drawImage(img, X + (W - w) / 2, Y + (H - h) * py, w, h); };
  const logoImg = loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(logoSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    .replace(/class="nl-e"/, `fill="${C.cream}"`).replace(/class="nl-n"/, `fill="${C.cream}"`).replace(/<circle class="nl-k"/, `<circle fill="${C.ink}"`).replace(/<rect class="nl-d"/, `<rect fill="${C.ink}"`).replace(/class="nl-l"/, `stroke="${C.ink}"`)));
  async function drawCard(c) {
    const w = texW(), h = Math.round(w / 0.74), k = w / G.cw, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d');
    const font = (px, wgt = 800) => `${wgt} ${Math.round(px * k)}px "Plus Jakarta Sans", sans-serif`;
    const track = (str, px, X, Y, sp, align = 'left') => { x.font = font(px); let tw = 0; const ws = [...str].map((ch) => { const m = x.measureText(ch).width; tw += m + sp * k; return m; }); tw -= sp * k;
      let cx = align === 'right' ? X - tw : X; [...str].forEach((ch, j) => { x.fillText(ch, cx, Y); cx += ws[j] + sp * k; }); };
    if (c.kind === 'p') {
      const band = (G.cw < 200 ? 38 : 46) * k; x.fillStyle = C.paper; x.fillRect(0, 0, w, h); x.fillStyle = C.paper2; x.fillRect(0, 0, w, h - band);
      try { cover(x, await loadImg(c.src), 0, 0, w, h - band); } catch (_) {}
      x.textBaseline = 'middle'; x.fillStyle = C.ink; x.font = font(G.cw < 200 ? 10.5 : 12.5);
      let title = c.title.toUpperCase(); const maxW = w - 70 * k; while (x.measureText(title).width > maxW && title.length > 3) title = title.slice(0, -2) + '…';
      x.fillText(title, 14 * k, h - band / 2); x.fillStyle = C.orange; track(String(c.k + 1).padStart(2, '0'), 10.5, w - 14 * k, h - band / 2, 1.2, 'right');
    } else if (c.kind === 'me') {
      x.fillStyle = '#222'; x.fillRect(0, 0, w, h);
      try { cover(x, await loadImg(c.src), 0, 0, w, h, 0.22); const d = x.getImageData(0, 0, w, h), a = d.data;
        for (let i = 0; i < a.length; i += 4) { const l = Math.min(255, (a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11 - 128) * 1.06 + 128); a[i] = a[i + 1] = a[i + 2] = l; } x.putImageData(d, 0, 0); } catch (_) {}
      x.fillStyle = '#fff'; x.textBaseline = 'top'; track('ELHADJI', 9.5, w - 12 * k, 12 * k, 1.5, 'right'); track('NDOUR', 9.5, w - 12 * k, 25 * k, 1.5, 'right');
    } else if (c.kind === 'logo') {
      x.fillStyle = C.orange; x.fillRect(0, 0, w, h);
      try { const L = await logoImg, lw = w * 0.72, lh = lw * (134.3 / 314.9); x.drawImage(L, (w - lw) / 2, (h - lh) / 2, lw, lh); } catch (_) {}
      x.fillStyle = C.ink; const tri = (X, Y, up) => { x.beginPath(); x.moveTo(X, Y + (up ? 0 : 7 * k)); x.lineTo(X + 4 * k, Y + (up ? 7 * k : 0)); x.lineTo(X - 4 * k, Y + (up ? 7 * k : 0)); x.fill(); };
      tri(w / 2, 12 * k, false); tri(w - 20 * k, h - 21 * k, true);
      x.textBaseline = 'alphabetic'; track('GRAPHISTE · MOTION', 9, 14 * k, h - 13 * k, 1.4);
    } else {
      x.fillStyle = C.petrol; x.fillRect(0, 0, w, h); x.fillStyle = C.cream; x.textBaseline = 'top';
      const fs = G.cw < 200 ? 20 : 26; x.font = font(fs); x.fillText('Travaillons', 16 * k, 18 * k); x.fillText('ensemble', 16 * k, 18 * k + fs * k);
      const ew = x.measureText('ensemble').width; x.fillStyle = C.orange; x.fillText('.', 16 * k + ew, 18 * k + fs * k);
      x.fillStyle = C.cyan; x.textBaseline = 'alphabetic'; track('POUR TOUTE COLLABORATION', 8, 16 * k, h - 20 * k, 1.3);
      x.fillStyle = C.orange; x.beginPath(); x.arc(w - 38 * k, h - 36 * k, 22 * k, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff'; x.font = font(18, 700); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('→', w - 38 * k, h - 35 * k); x.textAlign = 'left';
    }
    x.strokeStyle = 'rgba(19,18,17,.14)'; x.lineWidth = 1.5 * k; x.beginPath();   // liseré : les cartes se détachent les unes des autres
    if (x.roundRect) x.roundRect(0.75 * k, 0.75 * k, w - 1.5 * k, h - 1.5 * k, Math.min(18, G.cw * 0.075) * k); else x.rect(0, 0, w, h); x.stroke();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = isTouch ? 1 : Math.min(4, renderer.capabilities.getMaxAnisotropy());
    renderer.initTexture(t); return t;
  }

  /* ---------- les cartes en volume ---------- */
  const edge = { p: '#efe8dc', me: '#2a2826', logo: '#c9440f', end: '#0f3f53' };
  const world = new THREE.Group(); scene.add(world);
  const hub = new THREE.Group(); world.add(hub);
  const fronts = [];
  cards.forEach((c, i) => {
    const pivot = new THREE.Group(), lift = new THREE.Group(); pivot.add(lift); hub.add(pivot);
    const fm = new THREE.MeshBasicMaterial({ color: c.kind === 'logo' ? C.orange : c.kind === 'end' ? C.petrol : C.paper2, transparent: false });
    const front = new THREE.Mesh(frontGeo, fm); front.position.z = 0.6; front.userData.i = i;
    const body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: edge[c.kind] })); body.userData.i = i;
    const sh = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.32, depthWrite: false })); sh.position.z = -3.5; sh.renderOrder = -1;
    lift.add(sh, body, front);
    c.gl = { pivot, lift, front, body, sh, fm, fade: 0 }; fronts.push(front, body);
  });

  /* ---------- le mot PORTFOLIO sculpté ---------- */
  const word = new THREE.Group(); scene.add(word);
  const LJ = await (await fetch('letters.json')).json(); const loader = new SVGLoader();
  const inkMat = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), sideMat = new THREE.MeshLambertMaterial({ color: C.petrol });
  const letters = LJ.letters.map((L) => {
    const shapes = SVGLoader.createShapes(loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${L.d}"/></svg>`).paths[0]);
    const D = 150, g = new THREE.Group();
    const ex = new THREE.ExtrudeGeometry(shapes, { depth: D, bevelEnabled: true, bevelThickness: 10, bevelSize: 8, bevelSegments: isTouch ? 1 : 2, curveSegments: isTouch ? 4 : 6 });
    const fr = new THREE.ShapeGeometry(shapes, isTouch ? 4 : 6);
    [ex, fr].forEach((geo) => geo.translate(-L.adv / 2, -LJ.cap / 2, -D / 2));
    const m1 = new THREE.Mesh(ex, sideMat), m2 = new THREE.Mesh(fr, inkMat); m2.position.z = D + 12; g.add(m1, m2); word.add(g); return g;   // forme décalée de -D/2 : la face encre se pose juste devant le chapeau extrudé
  });
  wordEl.querySelectorAll('.l').forEach((l) => (l.style.visibility = 'hidden'));
  function placeWord() {
    const fs = parseFloat(getComputedStyle(wordEl).fontSize), s = fs / LJ.upm, spans = wordEl.querySelectorAll('.l');
    spans.forEach((sp, j) => { const r = sp.getBoundingClientRect(); const g = letters[j]; g.scale.setScalar(s);
      g.position.set(r.left + r.width / 2 - G.W / 2, G.H / 2 - (r.top + r.height * 0.52), 0); });
  }

  /* ---------- mise en page, pointeur, rendu ---------- */
  function layout() {
    renderer.setSize(G.W, G.H, false); camera.aspect = G.W / G.H;
    camera.position.set(0, 0, (G.H / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2))); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
    buildGeos(); cards.forEach((c) => { c.gl.front.geometry = frontGeo; c.gl.body.geometry = bodyGeo; c.gl.sh.geometry = shadowGeo; });
    hub.position.set(G.cx - G.W / 2, G.H / 2 - G.cy, 0); placeWord();
  }
  layout();
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(sx, sy) { ndc.set((sx / G.W) * 2 - 1, -(sy / G.H) * 2 + 1); ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(fronts.filter((m) => m.parent.parent.visible), false)[0]; return h ? h.object.userData.i : -1; }
  const v3 = new THREE.Vector3();
  function rectOf(i) { const g = cards[i].gl.lift; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [px, py] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { v3.set(px * G.cw / 2, py * G.ch / 2, 0); g.localToWorld(v3); v3.project(camera);
      const sx = (v3.x + 1) / 2 * G.W, sy = (1 - v3.y) / 2 * G.H; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); }
    return { left: x0, top: y0, width: x1 - x0, height: y1 - y0, right: x1, bottom: y1 }; }
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 }; let hover = -1;
  if (!isTouch) addEventListener('pointermove', (e) => { mouse.x = (e.clientX / G.W) * 2 - 1; mouse.y = -(e.clientY / G.H) * 2 + 1; hover = pick(e.clientX, e.clientY); canvas.style.cursor = hover >= 0 ? 'pointer' : ''; });
  let ftAvg = 1 / 60, ftN = 0, lastSig = '', dirty = 2;
  addEventListener('resize', () => (dirty = 2));
  function frame(dt, t, x, v, dragging) {
    // on ne redessine que si quelque chose bouge : roue, vague du titre, souris, carte qui apparaît
    const tcW = (t + 6.2) % 7, waving = !reduce && tcW < 1.9;
    const sig = `${x.toFixed(4)}|${hover}|${mouse.x.toFixed(3)},${mouse.y.toFixed(3)}`;
    const fading = cards.some((c) => c.gl.pivot.visible && c.tex && c.gl.fade < 1);
    const settling = Math.abs(mouse.sx - mouse.x) > 0.002 || Math.abs(mouse.sy - mouse.y) > 0.002 || cards.some((c) => c.gl.hv !== undefined && Math.abs(c.gl.hv - (c.gl.hvT || 0)) > 0.01);
    if (sig === lastSig && !waving && !fading && !settling && !dragging && dirty <= 0) return;
    lastSig = sig; dirty--;
    ftAvg = ftAvg * 0.95 + dt * 0.05; if (++ftN > 90) { ftN = 0; if (ftAvg > 1 / 48 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); renderer.setSize(G.W, G.H, false); } }
    if (!reduce && !isTouch) { mouse.sx += (mouse.x - mouse.sx) * (1 - Math.exp(-3 * dt)); mouse.sy += (mouse.y - mouse.sy) * (1 - Math.exp(-3 * dt)); }
    hub.rotation.x = -0.18 + mouse.sy * 0.05;                       // la roue est légèrement couchée : on la voit en perspective
    hub.rotation.y = mouse.sx * 0.08;
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i], g = c.gl, d = i - x, ad = Math.abs(d), a = d * G.step;
      const vis = Math.abs(a) < 1.95 && ad < 9; g.pivot.visible = vis; if (!vis) continue;
      if (!c.tex && !c.texLoading && ad < 7) { c.texLoading = true; drawCard(c).then((tx) => { dirty = 2; c.tex = tx; g.fm.map = tx; g.fm.color.set('#ffffff'); g.fm.needsUpdate = true; g.fade = 0; }); }
      if (c.tex && g.fade < 1) g.fade = Math.min(1, g.fade + dt / 0.4);
      const f = Math.max(0, 1 - ad), e = ease(f), hv = i === hover && !dragging ? 1 : 0;
      g.hvT = hv; g.hv = (g.hv || 0) + (hv - (g.hv || 0)) * (1 - Math.exp(-12 * dt));
      g.pivot.rotation.z = -a;
      g.lift.position.set(0, G.R + 16 * e + 6 * g.hv, 90 * e + 22 * g.hv - ad * 7);
      g.lift.rotation.y = -a * 0.42 + mouse.sx * 0.1 * e;            // les cartes s'ouvrent en éventail dans l'espace
      g.lift.rotation.x = 0.16 * (1 - e) - mouse.sy * 0.08 * e + clamp(v * 0.02, -0.12, 0.12);
      g.lift.scale.setScalar(1 + 0.05 * e);
      g.sh.position.set(5 + 10 * e, -9 - 16 * e, -3.5); g.sh.visible = ad < 3.2; g.sh.material.opacity = (0.3 + 0.2 * e) * clamp(3.2 - ad);   // ombre portée sur les cartes de dessous, plus diffuse quand la carte se soulève
      g.sh.scale.setScalar(1 + 0.06 * e);
      const shade = 1 - Math.min(0.12, ad * 0.035); if (c.tex) g.fm.color.setScalar(shade * (0.85 + 0.15 * g.fade));
    }
    // le mot : vague de retournement toutes les 7 s, inclinaison avec la vitesse de la roue, parallaxe
    const tc = (t + 6.2) % 7, lean = clamp(v * 0.12, -0.5, 0.5);
    letters.forEach((g, j) => { const k = reduce ? 0 : ease(clamp((tc - j * 0.085) / 1.05)); g.rotation.x = k * Math.PI * 2 + lean; g.rotation.y = mouse.sx * 0.25; });
    word.rotation.x = -mouse.sy * 0.06;
    renderer.render(scene, camera);
  }
  window.__gl = { rectOf };
  return { frame, pick, rectOf, layout };
}
