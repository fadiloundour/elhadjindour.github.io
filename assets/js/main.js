/* =========================================================
   Elhadji Ndour — Portfolio · interactions
   Aucune dépendance externe.
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;

  const scroller = $('.h-scroll');
  const track = $('#track');
  const panels = $$('.panel', track);
  const navLinks = $$('[data-goto]');
  const hudCur = $('#hud-cur'), hudTot = $('#hud-tot'), hudBar = $('#hud-bar');
  const hudPrev = $('#hud-prev'), hudNext = $('#hud-next'), hudHint = $('#hud-hint');

  const mqDesktop = matchMedia('(min-width:1024px) and (min-height:600px) and (hover:hover) and (pointer:fine)');
  const mqReduce = matchMedia('(prefers-reduced-motion:reduce)');
  const mqTouch = matchMedia('(hover:none), (pointer:coarse)');
  let HM = false;         // mode horizontal tactile (téléphone / tablette) ?

  let H = false;          // mode horizontal actif ?
  let maxX = 0;           // translation max
  let cur = 0, target = 0, raf = 0;
  let offsets = [];       // offsetLeft de chaque panneau
  let current = -1;

  hudTot.textContent = String(panels.length).padStart(2, '0');

  /* ---------- Mise en page ---------- */
  function layout() {
    root.style.setProperty('--vw', root.clientWidth + 'px');
    if (H) {
      track.style.transform = 'translate3d(0,0,0)';
      const total = track.scrollWidth;
      maxX = Math.max(0, total - root.clientWidth);
      scroller.style.height = (maxX + innerHeight) + 'px';
      offsets = panels.map(p => p.offsetLeft);
      measureParallax();
      onScroll(true);
    } else {
      scroller.style.height = '';
      track.style.transform = '';
      pxItems.forEach(it => { it.el.style.translate = ''; });
      cur = target = 0;
      if (HM) setCurrent(Math.min(panels.length - 1, Math.round(track.scrollLeft / (track.clientWidth || 1))));
    }
  }

  function setMode() {
    const want = mqDesktop.matches && !mqReduce.matches;
    const wantM = !want && mqTouch.matches;
    const changed = want !== H || wantM !== HM;
    const keep = changed ? currentId() : null;
    H = want; HM = wantM;
    root.classList.toggle('is-h', H);
    root.classList.toggle('is-hm', HM);
    layout();
    if (changed && keep) goTo(keep, false);
  }

  /* ---------- Mode tactile : glisser d'une section à l'autre ---------- */
  let hmRaf = 0;
  track.addEventListener('scroll', () => {
    if (!HM || hmRaf) return;
    hmRaf = requestAnimationFrame(() => {
      hmRaf = 0;
      const w = track.clientWidth || 1;
      const max = Math.max(1, track.scrollWidth - w);
      hudBar.style.transform = `scaleX(${track.scrollLeft / max})`;
      setCurrent(Math.min(panels.length - 1, Math.round(track.scrollLeft / w)));
      if (hudHint && track.scrollLeft > 20) hudHint.style.opacity = '0';
    });
  }, { passive: true });

  /* ---------- Défilement horizontal piloté par le scroll natif ---------- */
  function onScroll(immediate) {
    if (!H) return;
    target = Math.min(maxX, Math.max(0, scrollY - scroller.offsetTop));
    if (immediate === true) cur = target;
    if (!raf) raf = requestAnimationFrame(tick);
    if (hudHint && scrollY > 40) hudHint.style.opacity = '0';
  }

  let last = 0;
  function tick(now) {
    raf = 0;
    const dt = last ? Math.min(64, (now || performance.now()) - last) : 16.7;
    last = cur === target ? 0 : (now || performance.now());
    const k = 1 - Math.pow(1 - 0.09, dt / 16.7);   // lissage indépendant du nombre d'images/s
    const d = target - cur;
    cur = Math.abs(d) < 0.3 ? target : cur + d * k;
    track.style.transform = `translate3d(${-cur.toFixed(2)}px,0,0)`;
    hudBar.style.transform = `scaleX(${maxX ? cur / maxX : 0})`;
    parallax();
    const probe = cur + root.clientWidth * 0.45;
    let idx = 0;
    for (let i = 0; i < offsets.length; i++) if (offsets[i] <= probe) idx = i;
    setCurrent(idx);
    if (cur !== target) raf = requestAnimationFrame(tick); else last = 0;
  }

  function setCurrent(idx) {
    if (idx === current) return;
    current = idx;
    hudCur.textContent = String(idx + 1).padStart(2, '0');
    hudPrev.disabled = idx === 0;
    hudNext.disabled = idx === panels.length - 1;
    const nav = panels[idx].dataset.nav;
    $$('.nav a').forEach(a => a.dataset.goto === nav ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
  }

  function currentId() {
    const p = panels[Math.max(0, current)];
    return p && (p.id || null);
  }

  /* ---------- Navigation ---------- */
  function goTo(idOrIndex, smooth = true) {
    const el = typeof idOrIndex === 'number' ? panels[idOrIndex] : document.getElementById(idOrIndex);
    if (!el) return;
    if (el.tagName === 'DIALOG') { openCase(el); return; }
    if (H) {
      const x = Math.min(el.offsetLeft, maxX);
      window.scrollTo({ top: scroller.offsetTop + x, behavior: 'auto' });
      if (!smooth) { cur = target = x; tick(); }
    } else if (HM) {
      track.scrollTo({ left: el.offsetLeft, behavior: smooth && !mqReduce.matches ? 'smooth' : 'auto' });
    } else {
      el.scrollIntoView({ behavior: smooth && !mqReduce.matches ? 'smooth' : 'auto', block: 'start' });
    }
    if (el.id) history.replaceState(null, '', '#' + el.id);
  }

  navLinks.forEach(a => a.addEventListener('click', e => {
    if (a.closest('dialog.case')) return;
    e.preventDefault();
    closeMenu();
    goTo(a.dataset.goto);
    const t = document.getElementById(a.dataset.goto);
    if (t) setTimeout(() => { const h = t.querySelector('h1,h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }, 600);
  }));

  hudPrev.addEventListener('click', () => goTo(Math.max(0, current - 1)));
  hudNext.addEventListener('click', () => goTo(Math.min(panels.length - 1, current + 1)));

  // Trackpad : un geste horizontal fait aussi avancer la page
  window.addEventListener('wheel', e => {
    if (!H || lightbox.open || caseOpen()) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      window.scrollBy(0, e.deltaX);
    }
  }, { passive: false });

  document.addEventListener('keydown', e => {
    if (caseOpen()) return;
    if (lightbox.open) {
      if (e.key === 'ArrowRight') { e.preventDefault(); lbStep(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); lbStep(-1); }
      return;
    }
    if (e.key === 'Escape') closeMenu();
    if (!H && !HM) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(Math.min(panels.length - 1, current + 1)); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(Math.max(0, current - 1)); }
  });

  // Quand un élément reçoit le focus au clavier, on le ramène à l'écran
  document.addEventListener('focusin', e => {
    if (!H || !track.contains(e.target)) return;
    const p = e.target.closest('.panel');
    if (!p) return;
    const r = e.target.getBoundingClientRect();
    if (r.left < 0 || r.right > root.clientWidth) {
      const x = Math.min(maxX, Math.max(0, cur + r.left - root.clientWidth * 0.2));
      window.scrollTo({ top: scroller.offsetTop + x, behavior: 'auto' });
    }
  });

  addEventListener('scroll', onScroll, { passive: true });
  // Sécurité : si le navigateur fait défiler le conteneur (ancre, focus), on convertit en scroll vertical
  const sticky = $('.h-sticky');
  sticky.addEventListener('scroll', () => {
    if (!H || !sticky.scrollLeft) return;
    const x = Math.min(maxX, cur + sticky.scrollLeft);
    sticky.scrollLeft = 0;
    window.scrollTo({ top: scroller.offsetTop + x, behavior: 'auto' });
  });
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
  mqDesktop.addEventListener('change', setMode);
  mqReduce.addEventListener('change', setMode);
  mqTouch.addEventListener('change', setMode);

  // Section active en mode vertical
  const navIO = new IntersectionObserver(entries => {
    if (H || HM) return;
    entries.forEach(en => { if (en.isIntersecting) setCurrent(panels.indexOf(en.target)); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  panels.forEach(p => navIO.observe(p));

  /* ---------- Apparitions ---------- */
  const rvIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); rvIO.unobserve(en.target); } });
  }, { threshold: 0.12 });
  $$('.rv').forEach(el => rvIO.observe(el));

  /* ---------- Signature ---------- */
  const sig = $('.signature');
  if (sig) {
    const last = sig.querySelector('path:last-child');
    // boucle de tracé gérée en CSS (comme anime.js sur le site d'origine)
  }

  /* ---------- Menu mobile ---------- */
  const burger = $('.burger'), menu = $('#mobile-menu');
  function closeMenu() {
    if (!menu.classList.contains('open')) return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('open');
    if (!open) return closeMenu();
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
    document.body.style.overflow = 'hidden';
  });

  /* ---------- Vidéos SenFly ---------- */
  const videos = $$('video[data-autoplay]');
  const vIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      const v = en.target;
      if (en.isIntersecting) {
        if (v.preload === 'none') v.preload = 'auto';
        if (!v.dataset.userPaused) v.play().catch(() => {});
      } else v.pause();
    });
  }, { threshold: 0.35 });
  videos.forEach(v => {
    vIO.observe(v);
    const box = v.parentElement;
    const bPlay = $('.v-play', box), bSound = $('.v-sound', box);
    const sync = () => {
      bPlay.querySelector('use').setAttribute('href', v.paused ? '#i-play' : '#i-pause');
      bPlay.setAttribute('aria-label', v.paused ? 'Lire la vidéo' : 'Mettre en pause la vidéo');
    };
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    bPlay.addEventListener('click', () => {
      if (v.paused) { delete v.dataset.userPaused; v.play().catch(() => {}); }
      else { v.dataset.userPaused = '1'; v.pause(); }
    });
    bSound.addEventListener('click', () => {
      const unmute = v.muted;
      videos.forEach(o => { o.muted = true; const b = $('.v-sound', o.parentElement); b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Activer le son'); b.querySelector('use').setAttribute('href', '#i-mute'); });
      if (unmute) {
        v.muted = false; v.play().catch(() => {});
        bSound.setAttribute('aria-pressed', 'true'); bSound.setAttribute('aria-label', 'Couper le son');
        bSound.querySelector('use').setAttribute('href', '#i-vol');
      }
    });
  });

  /* ---------- Filtres projets ---------- */
  const cards = $$('#grid .card');
  const filterBtns = $$('[data-filter]');
  filterBtns.forEach(b => {
    const n = b.dataset.filter === 'all' ? cards.length : cards.filter(c => c.dataset.cat === b.dataset.filter).length;
    b.insertAdjacentHTML('beforeend', `<span>${n}</span>`);
    b.addEventListener('click', () => {
      filterBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const f = b.dataset.filter;
      cards.forEach(c => {
        const show = f === 'all' || c.dataset.cat === f;
        c.hidden = !show;
        c.classList.remove('is-filtered-in');
        if (show) { void c.offsetWidth; c.classList.add('is-filtered-in'); c.classList.add('in'); }
      });
      if (H) { const keep = $('#projets').offsetLeft; layout(); window.scrollTo({ top: scroller.offsetTop + Math.min(keep, maxX), behavior: 'auto' }); }
    });
  });

  /* ---------- Lightbox ---------- */
  const lightbox = $('#lightbox'), lbGal = $('#lb-gallery');
  const lbCount = $('#lb-count');
  let lbN = 0;
  function lbIndex() { return Math.round(lbGal.scrollLeft / Math.max(1, lbGal.clientWidth)); }
  function lbUpdate() { lbCount.textContent = lbN > 1 ? `${lbIndex() + 1} / ${lbN}` : ''; }
  function lbStep(d) { lbGal.scrollTo({ left: (lbIndex() + d) * lbGal.clientWidth, behavior: mqReduce.matches ? 'auto' : 'smooth' }); }
  lbGal.addEventListener('scroll', () => requestAnimationFrame(lbUpdate), { passive: true });
  $('#lb-prev').addEventListener('click', () => lbStep(-1));
  $('#lb-next').addEventListener('click', () => lbStep(1));
  $('#lb-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('close', () => { document.body.style.overflow = ''; $$('video', lbGal).forEach(v => v.pause()); });
  // une seule vidéo à la fois dans la visionneuse
  lbGal.addEventListener('play', e => { $$('video', lbGal).forEach(v => { if (v !== e.target) v.pause(); }); }, true);
  lbGal.addEventListener('scroll', () => { const i = lbIndex(); $$('figure', lbGal).forEach((f, k) => { const v = f.querySelector('video'); if (v && k !== i) v.pause(); }); }, { passive: true });
  // aperçu vidéo au survol des cartes
  $$('#grid .card--video').forEach(c => {
    const v = c.querySelector('.card__preview'); if (!v) return;
    const on = () => { if (mqReduce.matches) return; v.play().then(() => c.classList.add('playing')).catch(() => {}); };
    const off = () => { c.classList.remove('playing'); v.pause(); };
    c.addEventListener('pointerenter', on); c.addEventListener('pointerleave', off);
    c.addEventListener('focus', on); c.addEventListener('blur', off);
  });

  cards.forEach(c => c.dataset.project && c.addEventListener('click', () => {
    const d = JSON.parse(c.dataset.project);
    $('#lb-title').textContent = d.title;
    $('#lb-cat').textContent = d.label;
    $('#lb-desc').textContent = d.desc;
    const facts = $('#lb-facts');
    if (facts) facts.innerHTML = (d.details || []).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('#lb-tags').innerHTML = (d.tags || []).map(t => `<span class="chip">${t}</span>`).join('');
    lbGal.classList.toggle('tall', !!d.tall);
    lbGal.innerHTML = d.gallery.map((src, i) => (src && src.video)
      ? `<figure class="is-video"><video src="${src.video}" poster="${src.poster || ''}" controls playsinline preload="${i ? 'none' : 'metadata'}" aria-label="${d.title} — vidéo ${i + 1}"></video></figure>`
      : `<figure><img src="${src}" alt="${d.title} — visuel ${i + 1}" ${i ? 'loading="lazy"' : ''}></figure>`).join('');
    lbN = d.gallery.length;
    $('#lb-prev').hidden = $('#lb-next').hidden = lbN < 2;
    const link = $('#lb-link');
    link.href = d.link; $('#lb-link-label').textContent = d.linkLabel || 'Behance';
    lightbox.showModal();
    document.body.style.overflow = 'hidden';
    lbGal.scrollLeft = 0; lbUpdate();
  }));

  /* ---------- Copier ---------- */
  const toast = $('#toast'); let tt;
  function showToast(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200); }
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const v = b.dataset.copy;
    try { await navigator.clipboard.writeText(v); }
    catch { const t = document.createElement('textarea'); t.value = v; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
    b.classList.add('ok'); b.textContent = 'Copié'; showToast('Copié dans le presse-papiers');
    setTimeout(() => { b.classList.remove('ok'); b.textContent = 'Copier'; }, 2000);
  }));

  /* ---------- Formulaire (mailto) ---------- */
  const form = $('#contact-form');
  const EMAIL = ($('[data-copy*="@"]') || {}).dataset?.copy || '';
  function check(field) {
    const input = field.querySelector('input,textarea'); if (!input) return true;
    const err = field.querySelector('.err');
    let msg = '';
    if (input.required && !input.value.trim()) msg = 'Ce champ est requis.';
    else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) msg = 'Adresse e-mail invalide.';
    field.classList.toggle('invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
    return !msg;
  }
  $$('.field', form).forEach(f => { const i = f.querySelector('input,textarea'); i && i.addEventListener('blur', () => check(f)); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fields = $$('.field', form);
    const ok = fields.map(check).every(Boolean);
    if (!ok) { const bad = $('.invalid input, .invalid textarea', form); bad && bad.focus(); return; }
    const v = n => form.elements[n].value.trim();
    const subject = `[Portfolio] ${v('type')} — ${v('name')}`;
    const body = `${v('message')}\n\n—\n${v('name')}\n${v('email')}`;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    showToast('Ouverture de votre messagerie…');
  });

  /* ---------- Divers ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Parallaxe (mode horizontal) ---------- */
  var pxItems = $$('[data-px]').map(el => ({ el, f: parseFloat(el.dataset.px) || 0, x: 0, w: 0 }));
  function measureParallax() {
    pxItems.forEach(it => {
      it.el.style.translate = '0px 0';
      const r = it.el.getBoundingClientRect();
      it.x = r.left + r.width / 2; it.w = r.width;
    });
  }
  function parallax() {
    if (!H || mqReduce.matches) return;
    const vw = root.clientWidth;
    for (const it of pxItems) {
      const d = it.x - cur - vw / 2;
      if (Math.abs(d) > vw * 1.4) continue;
      const lim = it.w * 0.08;
      const px = Math.max(-lim, Math.min(lim, -d * it.f));
      it.el.style.translate = px.toFixed(1) + 'px 0';
    }
  }

  /* ---------- Intro (volet orange du site d'origine) ---------- */
  if (root.classList.contains('has-intro')) {
    try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}
    setTimeout(() => { const i = $('.intro'); if (i) i.style.display = 'none'; }, 2500);
  }

  /* ---------- Zoom à l'entrée dans l'écran (comme l'IntersectionObserver d'origine) ---------- */
  const zoomEls = $$('#grid .card, .phone, .about__grid .stats');
  zoomEls.forEach(el => el.classList.add('zoom'));
  const zIO = new IntersectionObserver(entries => {
    entries.forEach(en => en.target.classList.toggle('zin', en.isIntersecting));
  }, { threshold: 0.2 });
  zoomEls.forEach(el => zIO.observe(el));

  /* ---------- Titres révélés mot par mot ---------- */
  let wi = 0;
  function glue(node) {
    // colle la ponctuation à l'élément qui la précède (ex. <em>stratégie</em>,) pour éviter un retour à la ligne avant la virgule
    [...node.children].forEach(el => {
      const nx = el.nextSibling;
      if (nx && nx.nodeType === 3) {
        const m = nx.textContent.match(/^[,.;:!?»)]+/);
        if (m) { el.append(m[0]); el.normalize(); nx.textContent = nx.textContent.slice(m[0].length); }
      }
      glue(el);
    });
  }
  function splitNode(node) {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.textContent = t; i.style.setProperty('--wi', wi++);
          w.append(i); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') splitNode(n);
    });
  }
  const splitIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); splitIO.unobserve(en.target); } });
  }, { threshold: 0.3 });
  if (!mqReduce.matches) {
    $$('h2.h-l, h2.h-xl, h2.h-m').forEach(h => {
      wi = 0; h.setAttribute('aria-label', h.textContent.trim());
      glue(h); splitNode(h); h.classList.remove('rv'); h.classList.add('split');
      $$('.w', h).forEach(w => w.setAttribute('aria-hidden', 'true'));
      splitIO.observe(h);
    });
  }

  /* ---------- Compteurs animés ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const tn = [...en.target.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.textContent));
      if (!tn || mqReduce.matches) return;
      const m = tn.textContent.match(/(\D*)(\d+)(.*)/); const end = +m[2]; const t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0) / 1200); const e = 1 - Math.pow(1 - k, 3);
        tn.textContent = m[1] + Math.round(end * e) + m[3]; if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('.stat b').forEach(b => countIO.observe(b));

  /* ---------- Curseur personnalisé ---------- */
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const cursor = $('.cursor');
  if (cursor && fine.matches && !mqReduce.matches) {
    let cx = -100, cy = -100, tx = -100, ty = -100, craf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      craf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.2) ? requestAnimationFrame(loop) : 0;
    };
    const hoverState = t => {
      t = t && t.closest ? t : null;
      const view = !!(t && t.closest('#grid .card, .screen'));
      cursor.classList.toggle('view', view);
      cursor.classList.toggle('link', !!(t && !view && t.closest('a, button, input, select, textarea, label')));
    };
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY; cursor.classList.add('on');
      hoverState(e.target);
      if (!craf) craf = requestAnimationFrame(loop);
    }, { passive: true });
    let hs = 0;
    addEventListener('scroll', () => { if (hs) return; hs = requestAnimationFrame(() => { hs = 0; hoverState(document.elementFromPoint(tx, ty)); }); }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('on'));
    document.addEventListener('pointerdown', () => cursor.animate([{ scale: 1 }, { scale: .8 }, { scale: 1 }], { duration: 300 }));
  }

  /* ---------- Boutons magnétiques ---------- */
  if (fine.matches && !mqReduce.matches) {
    $$('.btn--solid, .socials a, .hud__nav button, .header-cta .btn').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25, y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });
  }

  /* ---------- Libellés flottants (classe "filled" comme sur le site d'origine) ---------- */
  $$('.field.fl').forEach(f => {
    const i = f.querySelector('input,textarea');
    const sync = () => f.classList.toggle('filled', !!i.value);
    i.addEventListener('input', sync); i.addEventListener('blur', sync); sync();
  });

  /* ---------- Étude de cas SenFly (plein écran) ---------- */
  function caseOpen() { return !!document.querySelector('dialog.case[open]'); }
  function openCase(dlg) {
    if (typeof dlg === 'string') dlg = document.getElementById(dlg);
    if (!dlg || dlg.open) return;
    dlg.scrollTop = 0;
    dlg.showModal();
    root.classList.add('case-open');
    history.replaceState(null, '', '#' + dlg.id);
    const cur = $('.cursor'); cur && cur.classList.remove('view', 'link');
  }
  function closeCase(dlg, then) {
    if (!dlg.open) return;
    dlg.classList.add('closing');
    setTimeout(() => {
      dlg.classList.remove('closing'); dlg.close();
      if (then) then();
    }, mqReduce.matches ? 0 : 320);
  }
  $$('dialog.case').forEach(dlg => {
    dlg.addEventListener('close', () => {
      root.classList.remove('case-open');
      $$('video', dlg).forEach(v => v.pause());
      if (location.hash === '#' + dlg.id) history.replaceState(null, '', '#projets');
    });
    dlg.addEventListener('cancel', e => { e.preventDefault(); closeCase(dlg); });
    $$('[data-close-case]', dlg).forEach(b => b.addEventListener('click', e => {
      const target = b.dataset.goto;
      e.preventDefault(); e.stopImmediatePropagation();
      closeCase(dlg, () => goTo(target || 'projets', !!target));
    }));
  });
  $$('[data-open-case]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openCase(b.dataset.openCase); }));

  /* ---------- Accueil : photo qui suit la souris ---------- */
  (() => {
    const vis = $('.hero__visual'); if (!vis) return;
    $$('.hand-note svg path', vis).forEach(p => p.setAttribute('pathLength', '1'));
    // compteur du badge « +4 ans »
    const badge = $('.float-card--b b', vis);
    if (badge && !mqReduce.matches) {
      const m = badge.textContent.match(/(\D*)(\d+)(.*)/);
      if (m) {
        const end = +m[2]; badge.textContent = m[1] + '0' + m[3];
        const start = () => { const t0 = performance.now();
          const step = now => { const k = Math.min(1, (now - t0) / 1400), e = 1 - Math.pow(1 - k, 3);
            badge.textContent = m[1] + Math.round(end * e) + m[3]; if (k < 1) requestAnimationFrame(step); };
          requestAnimationFrame(step); };
        setTimeout(start, root.classList.contains('has-intro') ? 2600 : 900);
      }
    }
    const fineP = matchMedia('(hover:hover) and (pointer:fine)');
    if (!fineP.matches || mqReduce.matches) return;
    root.classList.add('has-pointer');
    const hero = $('#accueil');
    let tx = 0, ty = 0, x = 0, y = 0, raf2 = 0;
    const loop = () => {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      vis.style.setProperty('--mx', x.toFixed(3));
      vis.style.setProperty('--my', y.toFixed(3));
      vis.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
      vis.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
      raf2 = (Math.abs(tx - x) + Math.abs(ty - y) > 0.001) ? requestAnimationFrame(loop) : 0;
    };
    hero.addEventListener('pointermove', e => {
      const r = vis.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 1.2)));
      if (!raf2) raf2 = requestAnimationFrame(loop);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf2) raf2 = requestAnimationFrame(loop); });
  })();

  // Démarrage
  H = root.classList.contains('is-h');
  HM = root.classList.contains('is-hm');
  setMode();
  addEventListener('load', () => {
    layout();
    const id = location.hash.slice(1);
    if (id && document.getElementById(id)) goTo(id, false);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  addEventListener('hashchange', () => { const id = location.hash.slice(1); if (id && document.getElementById(id)) goTo(id); });
})();
