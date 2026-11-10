// Portfolio « La roue » — Elhadji Ndour
// Une roue de cartes en 3D (CSS) : on la fait tourner au doigt, à la molette ou au clavier.
// Mouvement à ressort interruptible : la roue hérite de la vitesse du geste et se pose sur la carte la plus proche.
import { PROJECTS, CHAPTERS } from '../3d/data.js';

const $ = (s) => document.querySelector(s);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const full = (u) => (u.startsWith('img/') ? '../3d/' + u : u);
const small = (u) => '../3d/img/s/' + u.replace(/^(\.\.\/assets\/|img\/)/, '').replace(/\//g, '_').replace(/\.[a-z]+$/i, '.webp');
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const NP = PROJECTS.length;

/* ---------------- les cartes ---------------- */
const BIO = 'J’ai commencé par le graphisme et la vidéo à Dakar, avec une licence de chef de projet web. Deux ans à l’ONFP comme community manager et graphiste, puis Paris : un master en stratégie digitale et trois ans chez IFE Marketing. Aujourd’hui je crée des marques, des vidéos et des applications, de l’idée jusqu’à la mise en ligne.';
const LOGO_TXT = 'Un « e » et un « n » soudés, et un point orange qui porte une poignée de Bézier : l’outil plume du graphiste. Le point final devient une signature, celle de quelqu’un qui dessine, anime et code.';
const cards = [
  { kind: 'logo', slug: 'logo', title: 'en.', sub: 'Mon identité' },
  { kind: 'me', slug: 'moi', title: 'Moi', sub: 'Qui suis-je ?' },
  ...PROJECTS.map((p, k) => ({ kind: 'p', p, k, slug: slugify(p.title), title: p.title, sub: `${String(k + 1).padStart(2, '0')} / ${NP} · ${CHAPTERS[p.ch].title}` })),
  { kind: 'end', slug: 'contact', title: 'Contact', sub: 'Travaillons ensemble' },
];
const N = cards.length, START = 1;
const bySlug = Object.fromEntries(cards.map((c, i) => [c.slug, i]));
const wheel = $('#wheel'), logoTpl = $('#logoTpl').innerHTML;
cards.forEach((c, i) => {
  const el = document.createElement('div'); el.className = 'card card--' + c.kind; el.dataset.i = i; el.hidden = true;
  if (c.kind === 'p') { el.innerHTML = `<div class="card__img"><img alt="" decoding="async"></div><div class="card__meta"><b>${c.title}</b><span>${String(c.k + 1).padStart(2, '0')}</span></div>`; c.src = small(c.p.img); }
  if (c.kind === 'me') { el.innerHTML = `<img alt="Portrait d’Elhadji Ndour" decoding="async"><small>Elhadji<br>Ndour</small>`; c.src = '../assets/img/projets/portrait.webp'; }
  if (c.kind === 'logo') el.innerHTML = `<span class="tri tri--t"></span>${logoTpl}<small>Graphiste · Motion</small><span class="tri tri--b"></span>`;
  if (c.kind === 'end') el.innerHTML = `<p class="end__t">Travaillons<br>ensemble<i>.</i></p><small>Pour toute collaboration</small><span class="end__a" aria-hidden="true">→</span>`;
  el.setAttribute('role', 'button'); el.setAttribute('aria-label', c.kind === 'p' ? `${c.title}, ${c.p.label}` : c.title);
  wheel.appendChild(el); c.el = el; c.img = el.querySelector('img');
  if (c.img) c.img.addEventListener('load', () => c.img.classList.add('ok'));
});

/* ---------------- ressort (amortissement + réponse) ---------------- */
const spring = { x: reduce ? START : START - 7, v: 0, target: START, zeta: 0.86, response: 0.9 };
function stepSpring(dt) {
  const w = (2 * Math.PI) / (reduce ? 0.18 : spring.response), k = w * w, c = 2 * spring.zeta * w;
  const n = Math.ceil(dt / (1 / 240)), h = dt / n;
  for (let i = 0; i < n; i++) { const a = -k * (spring.x - spring.target) - c * spring.v; spring.v += a * h; spring.x += spring.v * h; }
}
const setTarget = (t, { zeta = 1, response = 0.55 } = {}) => { spring.target = clamp(Math.round(t), 0, N - 1); spring.zeta = zeta; spring.response = response; };
const rubber = (x) => (x < 0 ? -(-x * 0.5) / (1 + 0.5 * -x) : x > N - 1 ? N - 1 + ((x - N + 1) * 0.5) / (1 + 0.5 * (x - N + 1)) : x);
let moved = false; const firstMove = () => { if (!moved) { moved = true; $('#hint').style.opacity = 0; } };
const go = (i, o) => { firstMove(); setTarget(i, o); };

/* ---------------- géométrie de la roue ---------------- */
const G = {};
function layout() {
  const W = innerWidth, H = innerHeight, hb = $('.hero').getBoundingClientRect().bottom;
  let cw = Math.min(H * 0.36 * 0.74, W * 0.44, 330); let ch = cw / 0.74;
  const room = H - hb - 36; if (ch > room * 0.62) { ch = Math.max(150, room * 0.62); cw = ch * 0.74; }
  const top = hb + 34 + ch * 0.62;                 // marge pour la carte soulevée au sommet
  G.W = W; G.H = H; G.cw = cw; G.ch = ch; G.cx = W / 2; G.cy = H + H * 0.03; G.R = Math.max(ch * 0.9, G.cy - top);
  G.step = (cw * 0.88) / G.R;                       // angle entre deux cartes
  G.arc = G.R * G.step;                             // pixels de glisser pour passer d'une carte à l'autre
  G.rh = Math.max(70, G.R - ch / 2 - 12);           // rayon du moyeu
  cards.forEach((c) => { c.el.style.width = cw + 'px'; c.el.style.height = ch + 'px'; });
  const hub = $('#hub'); hub.style.top = G.cy + 'px';
  $('#ring').style.width = $('#ring').style.height = G.rh * 2 + 'px';
  $('#hubBtn').style.top = Math.min(-G.rh * 0.6, H - 92 - G.cy) + 'px';   // toujours lisible, même sur écran bas
}
layout(); addEventListener('resize', layout);

/* ---------------- entrées : glisser, molette, clavier ---------------- */
const stage = $('#stage');
const drag = { on: false, active: false, id: 0, x0: 0, y0: 0, p0: 0, axis: null, hist: [] };
stage.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || e.target.closest('.hub__btn')) return;
  Object.assign(drag, { on: true, active: false, id: e.pointerId, x0: e.clientX, y0: e.clientY, p0: spring.x, axis: null, hist: [{ x: e.clientX, y: e.clientY, t: performance.now() }] });
  stage.setPointerCapture(e.pointerId);
  const c = e.target.closest('.card'); drag.card = c; if (c) c.style.filter = 'brightness(.96)';   // retour dès l'appui (on retient la carte : avec la capture du pointeur, le relâché vise la scène)
});
stage.addEventListener('pointermove', (e) => {
  if (!drag.on || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.active) { if (Math.hypot(dx, dy) < 8) return; drag.active = true; drag.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'; stage.classList.add('grabbing'); firstMove(); }
  const d = drag.axis === 'x' ? -dx : dy;
  spring.x = rubber(drag.p0 + d / G.arc); spring.target = spring.x; spring.v = 0;
  drag.hist.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (drag.hist.length > 6) drag.hist.shift();
});
const endDrag = (e) => {
  if (!drag.on || e.pointerId !== drag.id) return; drag.on = false; stage.classList.remove('grabbing');
  wheel.querySelectorAll('.card').forEach((c) => (c.style.filter = ''));
  const was = drag.active; drag.active = false;
  if (!was) { if (drag.card) tapCard(+drag.card.dataset.i); return; }
  const a = drag.hist[0], b = drag.hist[drag.hist.length - 1], dt = Math.max(16, b.t - a.t) / 1000;
  const v = (drag.axis === 'x' ? -(b.x - a.x) : b.y - a.y) / dt / G.arc;          // cartes par seconde
  let t = Math.round(spring.x + v * 0.25); t = clamp(t, Math.round(spring.x) - 4, Math.round(spring.x) + 4);
  spring.v = v; setTarget(t, { zeta: Math.abs(v) > 1.5 ? 0.8 : 1, response: 0.5 });
};
stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
function tapCard(i) { // un clic sur n'importe quelle carte : la roue l'amène au sommet, puis sa fiche s'ouvre
  if (Math.abs(i - spring.x) < 0.4) return openCard(i);
  go(i, { response: 0.5 }); const t0 = performance.now();
  const land = () => (Math.abs(spring.x - i) < 0.05 || performance.now() - t0 > 1200 ? openCard(i) : requestAnimationFrame(land)); land();
}
let wheelT = 0, lastStep = 0;
addEventListener('wheel', (e) => {
  if (modalOpen()) return; e.preventDefault(); firstMove();
  let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (e.deltaMode === 1) d *= 40;
  const discrete = e.deltaMode === 1 || (Math.abs(d) >= 50 && Number.isInteger(d) && Math.abs(d) % 10 === 0);
  if (discrete) { const now = performance.now(); if (now - lastStep > 160) { lastStep = now; setTarget(spring.target + Math.sign(d)); } return; }
  spring.target = clamp(spring.target + d / 420, -0.3, N - 0.7); spring.zeta = 1; spring.response = 0.42;   // pavé tactile : suivi direct
  clearTimeout(wheelT); wheelT = setTimeout(() => setTarget(spring.target, { response: 0.55 }), 150);
}, { passive: false });
addEventListener('keydown', (e) => {
  if (contact.open || grid.open || zoom.open) return;
  if (sheet.open) { if (e.key === 'ArrowRight') sheetStep(1); if (e.key === 'ArrowLeft') sheetStep(-1); if (e.key === 'Escape') { e.preventDefault(); closeSheet(); } return; }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(spring.target + 1); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(spring.target - 1); }
  if (e.key === 'Home') go(0); if (e.key === 'End') go(N - 1);
  if (e.key === 'Enter' && !e.target.closest('button,a')) openCard(Math.round(spring.x));
  if ((e.key === 'g' || e.key === 'G') && !e.metaKey && !e.ctrlKey) openGrid();
});
$('#prev').addEventListener('click', () => go(spring.target - 1));
$('#next').addEventListener('click', () => go(spring.target + 1));
$('#hubBtn').addEventListener('click', () => openCard(Math.round(spring.x)));
document.querySelectorAll('[data-to]').forEach((b) => b.addEventListener('click', () => go(bySlug[b.dataset.to])));

/* ---------------- fiche (projet, à propos, logo) ---------------- */
const sheet = $('#sheet'); let cur = -1, sheetPushed = false, closing = false;
const openable = (i) => cards[i] && cards[i].kind !== 'end';
function renderMedia(c) {
  const stageEl = $('#pStage'), thumbs = $('#pThumbs');
  if (c.kind === 'logo') { stageEl.innerHTML = `<div style="width:100%;height:100%;min-height:300px;display:grid;place-items:center;background:var(--orange)"><div style="width:52%">${logoTpl}</div></div>`; stageEl.querySelectorAll('.nl-e,.nl-n').forEach((n) => (n.style.fill = '#f2ece2')); stageEl.querySelectorAll('.nl-d,.nl-k').forEach((n) => (n.style.fill = '#131211')); stageEl.querySelector('.nl-l').style.stroke = '#131211'; thumbs.innerHTML = ''; return; }
  if (c.kind === 'me') { stageEl.innerHTML = `<img src="../assets/img/projets/portrait.webp" alt="Portrait d’Elhadji Ndour">`; thumbs.innerHTML = ''; return; }
  const p = c.p, g = (p.gallery || []).map(full);
  const list = [...(p.panelVideo ? [{ v: p.panelVideo }] : []), ...(g.length ? g : p.panelVideo ? [] : [full(p.img)])];
  const show = (k) => { const m = list[k];
    stageEl.innerHTML = m.v ? `<video src="${m.v}" poster="${full(p.img)}" controls autoplay muted playsinline></video>` : `<img src="${m}" alt="${p.title}" class="zoomable" title="Voir en grand">`;
    if (!reduce) stageEl.firstChild.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    [...thumbs.children].forEach((b, j) => b.classList.toggle('on', j === k)); };
  thumbs.innerHTML = list.length > 1 ? list.map((m) => `<button aria-label="Voir l’image"><img src="${m.v ? full(p.img) : m}" alt="" loading="lazy" decoding="async"></button>`).join('') : '';
  [...thumbs.children].forEach((b, j) => b.addEventListener('click', () => show(j)));
  show(0);
}
function fillSheet(i) {
  cur = i; const c = cards[i], cas = c.kind === 'p' ? c.p.cas : null;
  $('#pLabel').textContent = c.kind === 'p' ? `${CHAPTERS[c.p.ch].n} · ${c.p.label}` : c.kind === 'me' ? 'À propos' : 'Identité personnelle';
  $('#pTitle').textContent = c.kind === 'me' ? 'Elhadji Ndour' : c.kind === 'logo' ? 'Le logo « en. »' : c.title;
  const pd = $('#pDesc'), pc = $('#pCase'), pr = $('#pRole');
  pd.hidden = !!cas; pd.textContent = cas ? '' : c.kind === 'p' ? c.p.desc : c.kind === 'me' ? BIO : LOGO_TXT;
  pc.hidden = pr.hidden = !cas;
  if (cas) { pr.innerHTML = `<span>Mon rôle</span>${cas.role}`;
    pc.innerHTML = [['Contexte', cas.ctx], ['Enjeu', cas.pb], ['Réponse', cas.sol], ['Résultat', cas.res]].map(([k, v], j) => `<li${j === 3 ? ' class="res"' : ''}><b>${k}</b><p>${v}</p></li>`).join(''); }
  const tags = c.kind === 'p' ? c.p.tags || [] : c.kind === 'me' ? ['Graphisme', 'Motion design', 'UX/UI', 'Social media', 'Ads', 'Code'] : ['Monogramme', 'Bézier', 'Animation'];
  $('#pTags').innerHTML = tags.map((t) => `<span>${t}</span>`).join('');
  const cta = $('#pCta');
  if (c.kind === 'p') cta.innerHTML = c.p.link ? `<a class="btn btn--o" href="${c.p.link}" ${c.p.link.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${c.p.linkLabel || 'Voir le projet'}</a>` : '';
  else if (c.kind === 'me') cta.innerHTML = `<a class="btn btn--o" href="../assets/docs/CV-Elhadji-Ndour-Graphiste-Motion.pdf" download>CV graphiste &amp; motion</a><a class="btn" href="../assets/docs/CV-Elhadji-Ndour-Communication-Digitale.pdf" download>CV communication digitale</a>`;
  else cta.innerHTML = `<a class="btn btn--ink" href="../assets/docs/Book-Elhadji-Ndour.pdf" target="_blank" rel="noopener">Voir le book</a>`;
  $('#pN').textContent = c.kind === 'p' ? `${String(c.k + 1).padStart(2, '0')} / ${NP}` : '';
  renderMedia(c); $('#pBody').scrollTop = 0; sheet.scrollTop = 0;
}
function openCard(i) {
  const c = cards[i]; if (!c) return;
  if (c.kind === 'end') return openDlg(contact, c.el);
  openSheet(i);
}
function openSheet(i, { push = true } = {}) {
  if (sheet.open || !openable(i)) return; go(i); fillSheet(i); sheet.showModal(); $('#pClose').focus({ preventScroll: true });
  if (push) { history.pushState({ sheet: 1 }, '', '#' + cards[i].slug); sheetPushed = true; } else setHash('#' + cards[i].slug);
  const r = sheet.getBoundingClientRect(), b = cards[i].el.getBoundingClientRect();
  sheet.style.transformOrigin = `${b.left + b.width / 2 - r.left}px ${b.top + b.height / 2 - r.top}px`;   // la fiche naît de la carte
  if (!reduce) sheet.animate([{ opacity: 0, transform: 'scale(.5)', filter: 'blur(8px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
}
function closeSheet(fromPop) {
  if (!sheet.open || closing) return;
  if (sheetPushed && fromPop !== true) { sheetPushed = false; history.back(); return; }
  sheetPushed = false; closing = true;
  if (reduce) { closing = false; return sheet.close(); }
  const a = sheet.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'scale(.5)', filter: 'blur(8px)' }], { duration: 320, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
  a.onfinish = () => { sheet.close(); a.cancel(); closing = false; };
}
function sheetStep(d) {
  let i = cur; do { i = (i + d + N) % N; } while (!openable(i));
  go(i); fillSheet(i); setHash('#' + cards[i].slug);
  if (!reduce) $('#pBody').animate([{ opacity: 0, transform: `translateX(${d * 16}px)` }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' });
}
$('#pClose').addEventListener('click', () => closeSheet());
sheet.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(); });
sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
sheet.addEventListener('close', () => { if (!sheetPushed) syncHash(true); });
$('#pPrev').addEventListener('click', () => sheetStep(-1)); $('#pNext').addEventListener('click', () => sheetStep(1));

/* ---------------- image en grand ---------------- */
const zoom = $('#zoom'), zImg = $('#zoomImg');
$('#pStage').addEventListener('click', (e) => {
  const im = e.target.closest('img.zoomable'); if (!im) return;
  zImg.src = im.src; zImg.alt = im.alt; zoom.showModal();
  if (!reduce) zImg.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
});
zoom.addEventListener('click', () => zoom.close());

/* ---------------- adresse par carte (#slug) et retour navigateur ---------------- */
let hashT = 0;
function setHash(h) { if (location.hash === h || (!h && !location.hash)) return; history.replaceState(history.state, '', h || location.pathname + location.search); }
const hashFor = (i) => (i === START ? '' : '#' + cards[i].slug);
let pendingH = null;
function syncHash(now) {
  const h = hashFor(clamp(Math.round(spring.target), 0, N - 1));
  if (now) { clearTimeout(hashT); pendingH = null; if (!sheet.open) setHash(h); return; }
  if (pendingH === h) return; clearTimeout(hashT); pendingH = h;      // on n'inscrit l'adresse qu'une fois posé
  hashT = setTimeout(() => { pendingH = null; if (!sheet.open) setHash(h); }, 300);
}
addEventListener('hashchange', () => { const i = bySlug[decodeURIComponent(location.hash.slice(1))]; if (i !== undefined && !sheet.open) go(i); });
addEventListener('popstate', (e) => {
  const want = e.state && e.state.sheet;
  if (sheet.open && !want) closeSheet(true);
  else if (!sheet.open && want) { const i = bySlug[location.hash.slice(1)]; if (i !== undefined) { openSheet(i, { push: false }); sheetPushed = true; } }
});
{ const i = bySlug[decodeURIComponent(location.hash.slice(1))];
  if (i !== undefined) { spring.x = i - (reduce ? 0 : 5); spring.target = i; moved = true; $('#hint').style.opacity = 0;
    if (openable(i) && i !== START) setTimeout(() => openSheet(i, { push: false }), reduce ? 50 : 1100); } }

/* ---------------- « Me contacter » et « Tous les projets » ---------------- */
const contact = $('#contactDlg'), grid = $('#gridDlg');
function modalOpen() { return sheet.open || contact.open || grid.open; }
function materialize(dlg, from, out) {
  if (reduce) return null;
  const r = dlg.getBoundingClientRect(), b = from.getBoundingClientRect();
  dlg.style.transformOrigin = `${b.left + b.width / 2 - r.left}px ${b.top + b.height / 2 - r.top}px`;
  const k = [{ opacity: 0, transform: 'scale(.86)', filter: 'blur(8px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }];
  return dlg.animate(out ? k.reverse() : k, { duration: out ? 220 : 420, easing: out ? 'cubic-bezier(.4,0,1,1)' : 'cubic-bezier(.22,1,.36,1)', fill: out ? 'forwards' : 'none' });
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
$('#contactBtn').addEventListener('click', (e) => openDlg(contact, e.currentTarget));
$('#copyMail').addEventListener('click', async (e) => {
  const b = e.currentTarget, mail = b.dataset.mail; let ok = false;
  try { await navigator.clipboard.writeText(mail); ok = true; } catch (_) {
    const t = document.createElement('textarea'); t.value = mail; contact.appendChild(t); t.select(); try { ok = document.execCommand('copy'); } catch (__) {} t.remove(); }
  b.classList.toggle('ok', ok); b.querySelector('span').textContent = ok ? 'Copié ✓' : 'Copier';
  clearTimeout(b._t); b._t = setTimeout(() => { b.classList.remove('ok'); b.querySelector('span').textContent = 'Copier'; }, 2200);
});
const gridList = $('#gridList'), chips = $('#gridChips');
const proj = cards.filter((c) => c.kind === 'p');
gridList.innerHTML = proj.map((c) => `<li data-ch="${c.p.ch}"><button data-i="${cards.indexOf(c)}"><span class="g__img"><img src="${small(c.p.img)}" alt="" loading="lazy" decoding="async"></span><span class="g__meta"><small>${String(c.k + 1).padStart(2, '0')} · ${c.p.label}</small><b>${c.title}</b></span></button></li>`).join('');
chips.innerHTML = `<button aria-pressed="true" data-f="-1">Tout <i>${NP}</i></button>` + CHAPTERS.map((ch, i) => `<button aria-pressed="false" data-f="${i}"><b>${ch.n}</b> ${ch.title} <i>${proj.filter((c) => c.p.ch === i).length}</i></button>`).join('');
chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const f = +b.dataset.f; let k = 0;
  chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.f === f)));
  gridList.querySelectorAll('li').forEach((li) => { const on = f < 0 || +li.dataset.ch === f; li.hidden = !on;
    if (on && !reduce) li.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: Math.min(k++, 12) * 22, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }); }); });
function openGrid(from = $('#gridBtn')) {
  const ci = clamp(Math.round(spring.target), 0, N - 1);
  gridList.querySelectorAll('button').forEach((b) => b.classList.toggle('cur', +b.dataset.i === ci));
  openDlg(grid, from); const c = gridList.querySelector('.cur'); if (c && !c.closest('li').hidden) c.scrollIntoView({ block: 'center' });
}
$('#gridBtn').addEventListener('click', (e) => openGrid(e.currentTarget));
gridList.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-i]'); if (!b) return; const i = +b.dataset.i;
  closeDlg(grid, () => { go(i, { response: 0.7 }); const t0 = performance.now();
    const land = () => (Math.abs(spring.x - i) < 0.04 || performance.now() - t0 > 1600 ? openSheet(i) : requestAnimationFrame(land)); land(); });
});

/* ---------------- boucle ---------------- */
const letters = [...document.querySelectorAll('.word .l')], band = $('.hero__band'), ring = $('#ring');
const hubTitle = $('#hubTitle'), hubSub = $('#hubSub');
const css = (el, k, v) => { const c = el.__c || (el.__c = {}); if (c[k] !== v) { c[k] = v; el.style[k] = v; } };
let last = performance.now(), t = 0, shown = -1, focusEl = null;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
  if (!drag.active) stepSpring(dt);
  const x = spring.x, v = spring.v;
  // cartes disposées sur l'arc : rotation autour du moyeu, puis légère profondeur pour la carte au sommet
  for (let i = 0; i < N; i++) {
    const c = cards[i], d = i - x, ad = Math.abs(d), a = d * G.step;
    const vis = Math.abs(a) < 1.95 && ad < 9;
    if (!vis) { if (!c.el.hidden) c.el.hidden = true; continue; }
    if (c.el.hidden) c.el.hidden = false;
    if (c.src && !c.loaded && ad < 6) { c.loaded = true; c.img.src = c.src; }
    const f = Math.max(0, 1 - ad), s = 1 + 0.07 * ease(f);
    const tr = `translate3d(${(G.cx - G.cw / 2).toFixed(1)}px,${(G.cy - G.ch / 2).toFixed(1)}px,0) rotate(${a.toFixed(4)}rad) translate3d(0,${(-G.R - 16 * f).toFixed(1)}px,${(70 * f).toFixed(1)}px) rotateY(${(-a * 18).toFixed(2)}deg) scale(${s.toFixed(4)})`;
    css(c.el, 'transform', tr); css(c.el, 'zIndex', String(100 - Math.round(ad * 10)));
  }
  const idx = clamp(Math.round(x), 0, N - 1);
  if (idx !== shown) {
    const dir = idx > shown ? 1 : -1; shown = idx; const c = cards[idx];
    hubTitle.textContent = c.title; hubSub.textContent = c.sub;
    if (focusEl) focusEl.classList.remove('is-on'); focusEl = c.el; focusEl.classList.add('is-on');
    if (!reduce) $('#hubBtn').animate([{ opacity: 0, transform: `translateX(-50%) translateY(${dir * 8}px)` }, { opacity: 1, transform: 'translateX(-50%)' }], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  if (!sheet.open && Math.abs(v) < 0.05 && Math.abs(x - spring.target) < 0.02 && moved) syncHash();
  css(ring, 'transform', `translate(-50%,-50%) rotate(${(-x * G.step * 0.55).toFixed(4)}rad)`);
  // le mot se retourne comme un ruban : une vague toutes les 7 s, et il s'incline avec la vitesse de la roue
  if (!reduce) {
    const tc = (t + 6.2) % 7, lean = clamp(v * 7, -28, 28);
    letters.forEach((l, i) => { const k = ease(clamp((tc - i * 0.085) / 1.05)); css(l, 'transform', `rotateX(${(k * 360 + lean).toFixed(1)}deg)`); });
    css(band, 'transform', `translateX(calc(-30% + ${(-v * 5).toFixed(1)}px))`);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
setTimeout(() => { if (!moved) $('#hint').style.opacity = 1; }, 1600);
window.__s = spring; window.__go = (i) => go(i);
