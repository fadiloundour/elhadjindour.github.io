/* Seduccess — logique du site : catalogue, panier, animations, commande WhatsApp. */
(function () {
  'use strict';

  var WHATSAPP = '221772701516';
  var CLE = 'seduccess-panier';
  var IMG = 'assets/img/';

  // ---------- catalogue ----------
  var PRODUITS = [
    {
      id: 'thiouraye', cat: 'thiouraye', nom: 'Thiouraye au gowé', accroche: 'Encens parfumé d’exception.',
      formats: [{ nom: 'Pot · 500 g', note: 'Le pot signature, en écrin', prix: 22000 }],
      image: 'produit-thiouraye', alt: 'Pot de thiouraye au gowé Seduccess et son écrin noir et cuivre',
      galerie: [['produit-thiouraye', 'Pot de thiouraye au gowé et son écrin'], ['savoir-melange', 'Morceaux de thiouraye'], ['savoir-braise', 'Le thiouraye se consume dans un encensoir'], ['savoir-matieres', 'Grains de gowé dans une coupe en bois']],
      description: 'Notre thiouraye signature, préparé selon la tradition sénégalaise et sublimé par le gowé. Posé sur la braise, il libère une fumée boisée, poivrée et légèrement ambrée qui habille la maison, le linge et les tenues pendant des heures.',
      notes: [['Tête', 'Gowé poivré'], ['Cœur', 'Bois précieux'], ['Fond', 'Ambre et musc']],
      composants: ['Copeaux de bois parfumés', 'Gowé broyé', 'Résines naturelles (oliban, myrrhe)', 'Huiles parfumées', 'Musc blanc', 'Sucre de cuisson, pour la fixation traditionnelle'],
      usage: 'Déposez quelques morceaux sur un charbon bien incandescent dans l’encensoir. Laissez la fumée se diffuser dans la pièce, puis aérez légèrement.',
      precautions: 'Ne laissez jamais un encensoir allumé sans surveillance. Tenez hors de portée des enfants. Placez l’encensoir sur un support résistant à la chaleur, loin des tissus.'
    },
    {
      id: 'huile', cat: 'huiles', nom: 'Huile parfumée', accroche: 'Concentrée, longue tenue.',
      formats: [{ nom: 'Flacon · 100 ml', note: 'Compte-gouttes doré', prix: 12500 }],
      image: 'produit-huile', alt: 'Flacon d’huile parfumée Seduccess 100 ml et son écrin',
      galerie: [['produit-huile', 'Flacon d’huile parfumée et son écrin'], ['resine', 'Résine ambrée sur un bois sombre'], ['savoir-parfum', 'Volutes de fumée parfumée'], ['savoir-matieres', 'Grains de gowé']],
      description: 'L’essence du gowé en huile concentrée. Quelques gouttes suffisent pour parfumer la peau, les cheveux et les vêtements, ou pour raviver un thiouraye. Sa tenue se prolonge toute la journée.',
      notes: [['Tête', 'Gowé et épices douces'], ['Cœur', 'Bois de santal'], ['Fond', 'Oud, ambre et musc']],
      composants: ['Huile végétale de base', 'Extrait parfumé de gowé', 'Notes de bois de santal et d’oud', 'Ambre', 'Musc blanc'],
      usage: 'Appliquez une à deux gouttes sur les poignets, le cou ou les vêtements. Pour le linge, déposez quelques gouttes sur un tissu avant de le ranger.',
      precautions: 'Usage externe uniquement. Faites un essai sur une petite zone de peau avant la première utilisation. Évitez le contact avec les yeux. Tenez hors de portée des enfants.'
    },
    {
      id: 'parfum', cat: 'parfums', nom: 'Parfum d’intérieur', accroche: 'Ambiance raffinée et durable.',
      formats: [{ nom: '250 ml', note: 'Pour une pièce', prix: 6500 }, { nom: '500 ml', note: 'Pour toute la maison', prix: 14000 }],
      image: 'produit-parfum', alt: 'Parfum d’intérieur Seduccess 250 ml et son écrin',
      galerie: [['produit-parfum', 'Parfum d’intérieur et son écrin'], ['savoir-parfum', 'Volutes de fumée parfumée'], ['savoir-braise', 'Un encensoir allumé'], ['resine', 'Résine ambrée']],
      description: 'Le rituel sans braise : une vaporisation, et la pièce s’habille des notes boisées et poivrées du gowé. Idéal pour le salon, la chambre, les rideaux et le linge de maison.',
      notes: [['Tête', 'Gowé poivré'], ['Cœur', 'Bois et fleurs blanches'], ['Fond', 'Ambre']],
      composants: ['Eau purifiée', 'Alcool', 'Composition parfumée gowé, bois et ambre', 'Fixateur de parfum'],
      usage: 'Vaporisez deux à trois fois dans l’air, ou à 30 cm des rideaux et du linge. Agitez avant emploi.',
      precautions: 'Produit inflammable : ne vaporisez pas près d’une flamme ou d’un encensoir allumé. Ne vaporisez pas directement sur la peau. Ne pas ingérer. Tenez hors de portée des enfants.'
    },
    {
      id: 'recharge', cat: 'recharges', nom: 'Recharge gowé · thiouraye', accroche: 'Encens naturel de qualité pour diffusion.',
      formats: [{ nom: 'Sachet rechargeable · 1 kg', note: 'Le grand format', prix: 35000 }],
      image: 'produit-recharge', alt: 'Sachet recharge Seduccess gowé thiouraye 1 kg',
      galerie: [['produit-recharge', 'Sachet recharge 1 kg'], ['savoir-melange', 'Morceaux de thiouraye'], ['savoir-matieres', 'Grains de gowé'], ['savoir-braise', 'Un encensoir allumé']],
      description: 'Le même thiouraye au gowé, en grand format. Pour remplir votre pot signature ou parfumer les grandes occasions : baptêmes, mariages, réceptions. Le sachet refermable préserve le parfum.',
      notes: [['Tête', 'Gowé poivré'], ['Cœur', 'Bois précieux'], ['Fond', 'Ambre et musc']],
      composants: ['Copeaux de bois parfumés', 'Gowé broyé', 'Résines naturelles (oliban, myrrhe)', 'Huiles parfumées', 'Musc blanc', 'Sucre de cuisson, pour la fixation traditionnelle'],
      usage: 'Refermez bien le sachet après chaque utilisation et conservez-le à l’abri de la chaleur et de la lumière. Utilisez comme le thiouraye en pot.',
      precautions: 'Ne laissez jamais un encensoir allumé sans surveillance. Tenez hors de portée des enfants.'
    }
  ];
  var parId = {};
  PRODUITS.forEach(function (p) { parId[p.id] = p; });

  // ---------- backend Supabase (facultatif : voir assets/js/config.js) ----------
  var CFG = window.SEDUCCESS_CONFIG || {};
  var BACK = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  var ZONES = [];
  var enLigne = false;   // vrai quand le catalogue vient de la base
  var rendu = false;     // la page est affichée : un catalogue arrivé trop tard est ignoré
  function rpc(nom, args) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, 10000) : 0;
    return fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/' + nom, {
      method: 'POST', signal: ctrl ? ctrl.signal : undefined,
      headers: { apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + CFG.supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(args || {})
    }).then(function (r) {
      clearTimeout(t);
      return r.json().catch(function () { return null; }).then(function (d) {
        if (!r.ok) { var e = new Error((d && d.message) || 'Le serveur ne répond pas.'); e.metier = r.status >= 400 && r.status < 500; throw e; }
        return d;
      });
    });
  }
  function chargerCatalogue() {
    if (!BACK) return Promise.resolve();
    return rpc('catalogue_public').then(function (d) {
      if (!d || !d.produits || !d.produits.length) return;
      var liste = d.produits.map(function (p) {
        return {
          id: p.id, cat: p.cat, nom: p.nom, accroche: p.accroche || '', description: p.description || '',
          notes: p.notes || [], composants: p.composants || [], usage: p.usage || '', precautions: p.precautions || '',
          image: p.image || 'produit-thiouraye', alt: p.nom,
          galerie: (p.galerie && p.galerie.length) ? p.galerie : [[p.image || 'produit-thiouraye', p.nom]],
          formats: (p.formats || []).map(function (f) { return { id: f.id, nom: f.nom, note: f.note || '', prix: f.prix, prix_barre: f.prix_barre, disponible: f.disponible !== false, stock_faible: !!f.stock_faible }; })
        };
      }).filter(function (p) { return p.formats.length; });
      if (!liste.length || rendu) return;
      PRODUITS = liste; parId = {}; PRODUITS.forEach(function (p) { parId[p.id] = p; });
      ZONES = d.zones || []; enLigne = true;
    }).catch(function () { /* hors ligne : on garde le catalogue du site */ });
  }
  function delai(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // ---------- utilitaires ----------
  function fcfa(n) { return n.toLocaleString('fr-FR').replace(/ | /g, ' ') + ' FCFA'; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function prixMin(p) { return Math.min.apply(null, p.formats.map(function (f) { return f.prix; })); }
  function srcImg(name, petit) {
    if (/^https?:/.test(name)) return name;
    return IMG + name + (petit && /^(produit-|savoir-matieres|savoir-parfum|resine|fondatrice)/.test(name) ? '-640' : '') + '.jpg';
  }
  function picture(name, alt, cls, sizes) {
    if (/^https?:/.test(name)) return '<img src="' + esc(name) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async"' + (cls ? ' class="' + cls + '"' : '') + ' width="1200" height="1200">';
    return '<picture><source type="image/webp" srcset="' + IMG + name + '-640.webp 640w, ' + IMG + name + '.webp 1200w" sizes="' + (sizes || '(max-width: 700px) 100vw, 400px') + '">' +
      '<img src="' + IMG + name + '-640.jpg" srcset="' + IMG + name + '-640.jpg 640w, ' + IMG + name + '.jpg 1200w" sizes="' + (sizes || '(max-width: 700px) 100vw, 400px') + '" alt="' + esc(alt) + '" loading="lazy" decoding="async"' + (cls ? ' class="' + cls + '"' : '') + ' width="1200" height="1200"></picture>';
  }
  function prixHtml(f, total) {
    var q = total || 1;
    return (f.prix_barre ? '<s class="barre-prix">' + fcfa(f.prix_barre * q) + '</s> ' : '') + fcfa(f.prix * q);
  }
  function disponibles(p) { return p.formats.filter(function (f) { return f.disponible !== false; }); }
  function formatDe(x) {
    var p = parId[x.id]; if (!p) return null;
    var f = null;
    if (x.fid) p.formats.forEach(function (g) { if (g.id === x.fid) f = g; });
    return f || p.formats[x.fmt] || p.formats[0];
  }
  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- panier (localStorage) ----------
  function lire() { try { return JSON.parse(localStorage.getItem(CLE)) || []; } catch (e) { return memoire; } }
  var memoire = [];
  function ecrire(l) { memoire = l; try { localStorage.setItem(CLE, JSON.stringify(l)); } catch (e) { /* navigation privée */ } majBadge(true); }
  function nbArticles() { return lire().reduce(function (a, x) { return a + x.qte; }, 0); }
  function ajouter(id, fmt, qte) {
    var l = lire(), trouve = false;
    var fid = parId[id] && parId[id].formats[fmt] ? parId[id].formats[fmt].id || null : null;
    l.forEach(function (x) { if (x.id === id && (fid ? x.fid === fid : x.fmt === fmt)) { x.qte = Math.min(20, x.qte + qte); trouve = true; } });
    if (!trouve) l.push({ id: id, fmt: fmt, fid: fid, qte: qte });
    ecrire(l);
    var p = parId[id];
    toast('Ajouté au sac · ' + p.nom);
  }
  function majBadge(pop) {
    var n = nbArticles();
    $$('[data-badge]').forEach(function (b) {
      b.textContent = n; b.classList.toggle('on', n > 0);
      if (pop && n > 0) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    });
    $$('[data-panier-lien]').forEach(function (a) { a.setAttribute('aria-label', n ? 'Panier, ' + n + (n > 1 ? ' articles' : ' article') : 'Panier'); });
  }

  // ---------- toast ----------
  var tToast;
  function toast(msg) {
    var t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a9561f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>' + esc(msg) + '</span><a href="panier.html">Voir le sac</a>';
    var wa = $('.wa-flottant');
    requestAnimationFrame(function () { t.classList.add('on'); if (wa) wa.classList.add('cache'); });
    clearTimeout(tToast);
    tToast = setTimeout(function () { t.classList.remove('on'); if (wa) wa.classList.remove('cache'); }, 3200);
  }

  // ---------- apparition au défilement ----------
  var io = ('IntersectionObserver' in window && !reduit) ? new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  function observer(racine) {
    $$('.reveal:not(.vu)', racine).forEach(function (el) {
      if (io) { el.style.transitionDelay = (el.dataset.delai || 0) + 'ms'; io.observe(el); } else el.classList.add('vu');
    });
  }
  // filet de sécurité : tout ce qui est déjà passé à l'écran (défilement rapide, ancre) apparaît
  var verifPrevue = false;
  function verifier() {
    verifPrevue = false;
    var h = window.innerHeight;
    $$('.reveal:not(.vu)').forEach(function (el) { if (el.getBoundingClientRect().top < h * 0.96) { el.classList.add('vu'); if (io) io.unobserve(el); } });
  }
  window.addEventListener('scroll', function () { if (!verifPrevue) { verifPrevue = true; requestAnimationFrame(verifier); } }, { passive: true });

  // ---------- glisser pour changer d'image (souris, doigt, stylet) ----------
  function glisser(el, prec, suiv) {
    var x0 = null, y0 = 0, t0 = 0;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; x0 = e.clientX; y0 = e.clientY; t0 = performance.now(); });
    el.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0, v = Math.abs(dx) / Math.max(1, performance.now() - t0);
      x0 = null;
      if (Math.abs(dx) < Math.abs(dy)) return;
      if (Math.abs(dx) > 40 || (v > 0.35 && Math.abs(dx) > 12)) (dx < 0 ? suiv : prec)();
    });
    el.addEventListener('pointercancel', function () { x0 = null; });
    el.addEventListener('pointerleave', function () { x0 = null; });
  }

  // ---------- retour visuel sur le bouton ----------
  function confirmer(btn, texte) {
    if (!btn) return;
    var orig = btn.dataset.orig || btn.innerHTML;
    btn.dataset.orig = orig;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' + texte;
    btn.classList.add('ok');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () { btn.innerHTML = orig; btn.classList.remove('ok'); }, 1600);
  }

  // ---------- menu mobile ----------
  function menu() {
    var b = $('[data-menu-btn]'), m = $('#menu-mobile');
    if (!b || !m) return;
    function fermer(rendreFocus) {
      if (!m.classList.contains('open')) return;
      m.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); document.body.classList.remove('no-scroll');
      if (rendreFocus) b.focus();
    }
    b.addEventListener('click', function () {
      var ouvert = m.classList.toggle('open');
      b.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      document.body.classList.toggle('no-scroll', ouvert);
      if (ouvert) { var a = $('a', m); if (a) a.focus({ preventScroll: true }); }
    });
    $$('a', m).forEach(function (a) { a.addEventListener('click', function () { fermer(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermer(true); });
    document.addEventListener('click', function (e) { if (!m.contains(e.target) && !b.contains(e.target)) fermer(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 760) fermer(false); });
  }

  // ---------- carte produit ----------
  function carte(p, i) {
    var dispo = disponibles(p), fmin = p.formats.reduce(function (a, f) { return f.prix < a.prix ? f : a; }, p.formats[0]);
    return '<article class="carte reveal" data-delai="' + (i * 90) + '">' +
      '<a class="carte-img" href="produit.html?p=' + p.id + '" aria-label="' + esc(p.nom) + ', voir le produit">' + picture(p.image, p.alt) + '</a>' +
      '<div class="carte-corps"><p class="eyebrow">' + esc(p.formats.map(function (f) { return f.nom; }).join(' / ')) + '</p>' +
      '<h3 class="h3"><a href="produit.html?p=' + p.id + '" style="color:inherit">' + esc(p.nom) + '</a></h3><p>' + esc(p.accroche) + '</p>' +
      '<div class="carte-bas"><span class="prix">' + (p.formats.length > 1 ? 'Dès ' : '') + prixHtml(fmin) + '</span>' +
      (dispo.length ? '<button class="btn btn-ligne btn-sm" type="button" data-ajout="' + p.id + '" data-fmt="' + p.formats.indexOf(dispo[0]) + '" aria-label="Ajouter ' + esc(p.nom) + ' au sac">Ajouter</button>' : '<span class="epuise">Épuisé</span>') + '</div></div></article>';
  }
  function brancherAjouts(racine) {
    $$('[data-ajout]', racine).forEach(function (b) { b.addEventListener('click', function () { ajouter(b.dataset.ajout, +(b.dataset.fmt || 0), 1); confirmer(b, 'Ajouté'); }); });
  }

  // ---------- accueil : produits qui défilent ----------
  function heros() {
    var stage = $('[data-stage]');
    if (!stage) return;
    var imgs = $$('img', stage), dots = $$('.dot'), nom = $('[data-stage-nom]'), fmt = $('[data-stage-fmt]'), i = 0, iv;
    function aller(n) {
      i = n;
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
      dots.forEach(function (d, k) { d.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      var pr = parId[imgs[i].dataset.id];
      nom.textContent = pr ? pr.nom : imgs[i].dataset.nom;
      if (pr) { var fm = pr.formats.reduce(function (a, f) { return f.prix < a.prix ? f : a; }, pr.formats[0]); fmt.textContent = pr.formats.map(function (f) { return f.nom; }).join(' / ') + ' · ' + (pr.formats.length > 1 ? 'dès ' : '') + fcfa(fm.prix) + (disponibles(pr).length ? '' : ' · épuisé'); }
      else fmt.textContent = imgs[i].dataset.fmt;
    }
    function lancer() { clearInterval(iv); if (!reduit) iv = setInterval(function () { aller((i + 1) % imgs.length); }, 5200); }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { aller(k); lancer(); }); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearInterval(iv); else lancer(); });
    var zone = stage.parentNode;
    zone.addEventListener('mouseenter', function () { clearInterval(iv); });
    zone.addEventListener('mouseleave', lancer);
    zone.addEventListener('focusin', function () { clearInterval(iv); });
    zone.addEventListener('focusout', lancer);
    glisser(stage, function () { aller((i - 1 + imgs.length) % imgs.length); lancer(); }, function () { aller((i + 1) % imgs.length); lancer(); });
    aller(0); lancer();
  }

  // ---------- grilles de produits ----------
  function grilles() {
    var acc = $('[data-produits="accueil"]');
    if (acc) { acc.innerHTML = PRODUITS.map(carte).join(''); brancherAjouts(acc); observer(acc); }
    var bout = $('[data-produits="boutique"]');
    if (!bout) return;
    var compte = $('[data-compte]');
    function afficher(cat) {
      var liste = PRODUITS.filter(function (p) { return cat === 'tout' || p.cat === cat; });
      bout.innerHTML = liste.map(carte).join('');
      brancherAjouts(bout); observer(bout);
      compte.textContent = liste.length + (liste.length > 1 ? ' créations' : ' création');
    }
    $$('.chip').forEach(function (c) {
      c.addEventListener('click', function () {
        $$('.chip').forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        afficher(c.dataset.cat);
      });
    });
    afficher('tout');
  }

  // ---------- fiche produit ----------
  function fiche() {
    var zone = $('[data-fiche]');
    if (!zone) return;
    var id = new URLSearchParams(location.search).get('p');
    var p = parId[id] || PRODUITS[0];
    document.title = p.nom + ' — Seduccess';
    var fmt = Math.max(0, p.formats.indexOf(disponibles(p)[0])), qte = 1, img = 0;
    $('[data-fil-nom]').textContent = p.nom;
    zone.innerHTML =
      '<div class="rise"><div class="galerie-main">' + p.galerie.map(function (g, k) {
        return '<img src="' + esc(srcImg(g[0])) + '" alt="' + esc(g[1]) + '"' + (k === 0 ? ' class="on"' : ' loading="lazy"') + ' width="1200" height="1200">';
      }).join('') + '</div>' +
      '<div class="vignettes" role="group" aria-label="Choisir une image">' + p.galerie.map(function (g, k) {
        return '<button class="vignette" type="button" aria-pressed="' + (k === 0) + '" aria-label="Voir : ' + esc(g[1]) + '" data-img="' + k + '"><img src="' + esc(srcImg(g[0], true)) + '" alt="" loading="lazy"></button>';
      }).join('') + '</div></div>' +
      '<div class="achat">' +
        '<div><p class="eyebrow rise d1">Collection Signature</p><h1 class="display rise d1" style="font-size:clamp(42px,5vw,72px)">' + esc(p.nom) + '</h1>' +
        '<p class="lead rise d2" style="margin:16px 0 0">' + esc(p.accroche) + '</p></div>' +
        '<p class="rise d2" style="margin:0;color:var(--texte-doux)">' + esc(p.description) + '</p>' +
        (p.formats.length > 1 ? '<fieldset class="rise d2"><legend style="font-size:14px;font-weight:600">Format</legend><div class="formats">' + p.formats.map(function (f, k) {
          return '<button class="format" type="button" aria-pressed="' + (k === fmt) + '" data-fmt="' + k + '"' + (f.disponible === false ? ' disabled' : '') + '><strong>' + esc(f.nom) + ' · ' + prixHtml(f) + '</strong><span>' + (f.disponible === false ? 'Épuisé' : esc(f.note)) + '</span></button>';
        }).join('') + '</div></fieldset>' : '<p class="eyebrow rise d2" style="margin:0">' + esc(p.formats[0].nom) + '</p>') +
        '<div class="ligne-prix rise d3"><span class="prix" data-prix>' + prixHtml(p.formats[fmt]) + '</span>' +
          '<div class="qte" role="group" aria-label="Quantité"><button type="button" data-moins aria-label="Retirer un">−</button><output data-qte aria-live="polite">1</output><button type="button" data-plus aria-label="Ajouter un">+</button></div></div>' +
        '<p class="muted rise d3" data-dispo style="margin:-12px 0 0;font-size:14px" aria-live="polite"></p>' +
        '<button class="btn btn-or rise d3" type="button" data-ajouter style="min-height:58px;font-size:17px">Ajouter au sac</button>' +
        '<a class="btn btn-wa rise d4" href="#" data-wa-produit><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.7 2.3.7 3.1.6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>Commander sur WhatsApp</a>' +
        '<div class="accordeon rise d4">' +
          '<details open><summary>Notes olfactives<span class="plus" aria-hidden="true">+</span></summary><div class="contenu"><ul>' + p.notes.map(function (n) { return '<li><strong style="color:var(--sable);font-weight:500">' + esc(n[0]) + '</strong> · ' + esc(n[1]) + '</li>'; }).join('') + '</ul></div></details>' +
          '<details><summary>Composants<span class="plus" aria-hidden="true">+</span></summary><div class="contenu"><ul>' + p.composants.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></div></details>' +
          '<details><summary>Utilisation<span class="plus" aria-hidden="true">+</span></summary><div class="contenu"><p style="margin:0">' + esc(p.usage) + '</p></div></details>' +
          '<details><summary>Précautions<span class="plus" aria-hidden="true">+</span></summary><div class="contenu"><p style="margin:0">' + esc(p.precautions) + '</p></div></details>' +
          '<details><summary>Livraison et paiement<span class="plus" aria-hidden="true">+</span></summary><div class="contenu"><p style="margin:0 0 12px">Livraison à Dakar et environs, frais confirmés sur WhatsApp selon votre quartier. Retrait possible à la Cité Alioune Sow, Golf Cambérène.</p><p style="margin:0">Paiement par Wave, Orange Money, Free Money ou carte Visa.</p></div></details>' +
        '</div>' +
      '</div>';

    var principales = $$('.galerie-main img', zone), vign = $$('.vignette', zone);
    function montrer(n) {
      img = (n + principales.length) % principales.length;
      principales.forEach(function (im, k) { im.classList.toggle('on', k === img); });
      vign.forEach(function (x, k) { x.setAttribute('aria-pressed', k === img ? 'true' : 'false'); });
    }
    vign.forEach(function (v) { v.addEventListener('click', function () { montrer(+v.dataset.img); }); });
    glisser($('.galerie-main', zone), function () { montrer(img - 1); }, function () { montrer(img + 1); });
    function majPrix() {
      var f = p.formats[fmt], dispo = f.disponible !== false, b = $('[data-ajouter]', zone);
      $('[data-prix]', zone).innerHTML = prixHtml(f, qte); $('[data-qte]', zone).textContent = qte;
      $('[data-dispo]', zone).textContent = !dispo ? 'Ce format est épuisé pour le moment. Écrivez-nous sur WhatsApp pour être prévenu.' : f.stock_faible ? 'Plus que quelques pièces en stock.' : '';
      b.disabled = !dispo; if (!b.classList.contains('ok')) b.textContent = dispo ? 'Ajouter au sac' : 'Épuisé';
      majWa();
    }
    function majWa() {
      var msg = 'Bonjour Seduccess, je souhaite commander : ' + qte + ' × ' + p.nom + ' (' + p.formats[fmt].nom + ') — ' + fcfa(p.formats[fmt].prix * qte) + '.';
      $('[data-wa-produit]', zone).href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
      $('[data-wa-produit]', zone).target = '_blank'; $('[data-wa-produit]', zone).rel = 'noopener';
    }
    $$('.format', zone).forEach(function (b) {
      b.addEventListener('click', function () {
        fmt = +b.dataset.fmt;
        $$('.format', zone).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        majPrix();
      });
    });
    $('[data-moins]', zone).addEventListener('click', function () { qte = Math.max(1, qte - 1); majPrix(); });
    $('[data-plus]', zone).addEventListener('click', function () { qte = Math.min(20, qte + 1); majPrix(); });
    $('[data-ajouter]', zone).addEventListener('click', function () { ajouter(p.id, fmt, qte); confirmer($('[data-ajouter]', zone), 'Ajouté au sac'); });
    majPrix();

    var autres = $('[data-autres]');
    if (autres) {
      autres.innerHTML = PRODUITS.filter(function (x) { return x.id !== p.id; }).slice(0, 3).map(carte).join('');
      brancherAjouts(autres); observer(autres);
    }
  }

  // ---------- panier et commande ----------
  function panier() {
    var zone = $('[data-panier]');
    if (!zone) return;
    var liste = $('[data-lignes]'), vide = $('[data-vide]'), form = $('[data-commande]');
    var premier = true, sousTotal = 0, promo = null;
    var selZone = $('#zone'), blocZones = $('[data-zones-bloc]'), blocPromo = $('[data-promo-bloc]');
    if (enLigne && ZONES.length) {
      blocZones.hidden = false;
      selZone.innerHTML = '<option value="">Choisissez votre zone</option>' + ZONES.map(function (z) { return '<option value="' + z.id + '">' + esc(z.nom) + ' · ' + fcfa(z.frais) + (z.delai ? ' · ' + esc(z.delai) : '') + '</option>'; }).join('');
      $('[data-livraison-note]').textContent = 'Frais selon votre zone';
    }
    if (enLigne) blocPromo.hidden = false;
    function zoneChoisie() { var id = +selZone.value; var z = null; ZONES.forEach(function (x) { if (x.id === id) z = x; }); return z; }
    function totaux() {
      var mode = (form.querySelector('input[name="mode"]:checked') || {}).value, z = zoneChoisie();
      var frais = mode === 'livraison' ? (z ? z.frais : null) : 0;
      var remise = promo ? (promo.remise || 0) : 0;
      $('[data-remise-l]').hidden = !remise;
      $('[data-remise]').textContent = '− ' + fcfa(remise);
      $('[data-remise-code]').textContent = promo ? promo.code : '';
      $('[data-mode-label]').textContent = mode === 'livraison' ? 'Livraison' + (z ? ' · ' + z.nom : '') : 'Retrait';
      $('[data-mode-prix]').textContent = mode === 'livraison' ? (frais === null ? (enLigne && ZONES.length ? 'Choisissez la zone' : 'Selon le quartier') : fcfa(frais)) : 'Offert';
      $('[data-total-label]').textContent = frais === null ? 'Total articles' : 'Total à payer';
      $('[data-total]').textContent = fcfa(sousTotal - remise + (frais || 0));
    }
    function rendre() {
      var l = lire().filter(function (x) { return formatDe(x); });
      var n = l.reduce(function (a, x) { return a + x.qte; }, 0);
      $('[data-nb]').textContent = n ? n + (n > 1 ? ' articles' : ' article') : 'Aucun article';
      vide.hidden = l.length > 0;
      form.hidden = l.length === 0;
      liste.innerHTML = l.map(function (x, k) {
        var p = parId[x.id], f = formatDe(x);
        return '<li class="ligne' + (premier ? ' entree' : '') + '"><img src="' + esc(srcImg(p.image, true)) + '" alt="' + esc(p.alt) + '" width="104" height="104">' +
          '<div><div class="ligne-haut"><div><p style="font-size:18px;font-weight:500">' + esc(p.nom) + '</p><p class="muted" style="font-size:14px">' + esc(f.nom) + ' · ' + fcfa(f.prix) + (f.disponible === false ? ' · <strong style="color:#f2b8a0">épuisé</strong>' : '') + '</p></div><p class="prix" style="font-size:18px">' + fcfa(f.prix * x.qte) + '</p></div>' +
          '<div class="ligne-bas"><div class="qte" role="group" aria-label="Quantité de ' + esc(p.nom) + '"><button type="button" data-l="' + k + '" data-d="-1" aria-label="Retirer un">−</button><output>' + x.qte + '</output><button type="button" data-l="' + k + '" data-d="1" aria-label="Ajouter un">+</button></div>' +
          '<button class="retirer" type="button" data-retirer="' + k + '">Retirer</button></div></div></li>';
      }).join('');
      var sous = l.reduce(function (a, x) { return a + formatDe(x).prix * x.qte; }, 0);
      premier = false;
      sousTotal = sous;
      $('[data-sous-total]').textContent = fcfa(sous);
      totaux();
      $$('[data-l]', liste).forEach(function (b) {
        b.addEventListener('click', function () {
          var l2 = lire().filter(function (x) { return formatDe(x); }), it = l2[+b.dataset.l];
          it.qte = Math.max(1, Math.min(20, it.qte + (+b.dataset.d))); ecrire(l2); rendre(); if (promo) appliquerPromo();
        });
      });
      $$('[data-retirer]', liste).forEach(function (b) {
        b.addEventListener('click', function () { var l2 = lire().filter(function (x) { return formatDe(x); }); l2.splice(+b.dataset.retirer, 1); ecrire(l2); rendre(); if (promo) appliquerPromo(); });
      });
      return sous;
    }
    rendre();
    selZone.addEventListener('change', totaux);
    function appliquerPromo() {
      var code = form.code.value.trim(), msg = $('[data-promo-msg]');
      if (!code) { promo = null; msg.textContent = ''; totaux(); return Promise.resolve(); }
      msg.textContent = 'Vérification…';
      return rpc('verifier_code_promo', { p_code: code, p_sous_total: sousTotal }).then(function (r) {
        if (r && r.valide) { promo = r; msg.textContent = '✓ ' + r.message + ' : − ' + fcfa(r.remise); }
        else { promo = null; msg.textContent = (r && r.message) || 'Code non valable.'; }
        totaux();
      }).catch(function () { promo = null; msg.textContent = 'Impossible de vérifier le code pour le moment.'; totaux(); });
    }
    $('[data-promo-appliquer]').addEventListener('click', appliquerPromo);
    form.code.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); appliquerPromo(); } });

    // livraison / retrait
    function majMode() {
      var mode = (form.querySelector('input[name="mode"]:checked') || {}).value;
      $('[data-adresse]').hidden = mode !== 'livraison';
      blocZones.hidden = !(enLigne && ZONES.length && mode === 'livraison');
      totaux();
    }
    $$('input[name="mode"]', form).forEach(function (r) { r.addEventListener('change', majMode); });
    majMode();

    form.addEventListener('input', function () { $('[data-erreur]').hidden = true; });
    form.addEventListener('change', function () { $('[data-erreur]').hidden = true; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('[data-erreur]');
      var nom = form.nom.value.trim(), tel = form.tel.value.trim(), adr = form.adresse.value.trim();
      var mode = (form.querySelector('input[name="mode"]:checked') || {}).value;
      var pay = (form.querySelector('input[name="paiement"]:checked') || {}).value;
      var manque = [];
      if (!nom) manque.push('votre nom');
      if (!/^[+\d][\d\s]{7,}$/.test(tel)) manque.push('un numéro de téléphone valide');
      if (mode === 'livraison' && enLigne && ZONES.length && !zoneChoisie()) manque.push('votre zone de livraison');
      if (mode === 'livraison' && !adr) manque.push('votre quartier et adresse');
      if (!pay) manque.push('un moyen de paiement');
      if (manque.length) { err.textContent = 'Merci d’indiquer ' + manque.join(', ') + '.'; err.hidden = false; err.focus(); return; }
      err.hidden = true;
      var l = lire().filter(function (x) { return formatDe(x); });
      var z = zoneChoisie();
      var lignes = l.map(function (x) { var p = parId[x.id], f = formatDe(x); return '• ' + x.qte + ' × ' + p.nom + ' (' + f.nom + ') — ' + fcfa(f.prix * x.qte); });
      var btn = form.querySelector('[type=submit]');

      function terminer(r) {
        var total = l.reduce(function (a, x) { return a + formatDe(x).prix * x.qte; }, 0);
        var lignesMsg = r ? [
          '', 'Sous-total : ' + fcfa(r.sous_total),
          r.remise ? 'Remise (' + (promo ? promo.code : 'code promo') + ') : − ' + fcfa(r.remise) : null,
          mode === 'livraison' ? 'Livraison (' + (r.zone || '') + ') : ' + fcfa(r.frais) : null,
          'Total à payer : ' + fcfa(r.total)
        ] : ['', 'Total articles : ' + fcfa(total)];
        var msg = [r ? 'Bonjour Seduccess, voici ma commande n° ' + r.numero + ' :' : 'Bonjour Seduccess, je souhaite passer commande :', ''].concat(lignes).concat(lignesMsg).concat([
          'Réception : ' + (mode === 'livraison' ? 'Livraison — ' + (z ? z.nom + ', ' : '') + adr : 'Retrait à la Cité Alioune Sow, Golf Cambérène'),
          'Paiement : ' + pay,
          'Nom : ' + nom, 'Téléphone : ' + tel, '', 'Merci !'
        ]).filter(function (x) { return x !== null; }).join('\n');
        var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
        window.open(url, '_blank', 'noopener');
        var secours = $('[data-wa-secours]'); if (secours) secours.href = url;
        var num = $('[data-merci-num]'); if (num) { num.hidden = !r; if (r) num.textContent = 'Commande n° ' + r.numero + ' · ' + fcfa(r.total); }
        ecrire([]);
        zone.hidden = true;
        var m = $('[data-merci]'); m.hidden = false; m.querySelector('h2').focus();
        window.scrollTo({ top: 0, behavior: reduit ? 'auto' : 'smooth' });
      }

      var avecIds = l.every(function (x) { return formatDe(x).id; });
      if (!(enLigne && avecIds)) return terminer(null);
      btn.disabled = true; var txt = btn.innerHTML; btn.textContent = 'Enregistrement…';
      rpc('passer_commande', { p: {
        nom: nom, tel: tel, adresse: adr, mode: mode, zone_id: z ? z.id : null, paiement: pay,
        code_promo: promo ? promo.code : null,
        lignes: l.map(function (x) { return { format_id: formatDe(x).id, quantite: x.qte }; })
      } }).then(function (r) { terminer(r); })
        .catch(function (e2) {
          if (e2.metier) { err.textContent = e2.message; err.hidden = false; err.focus(); }
          else terminer(null);   // réseau indisponible : la commande part quand même sur WhatsApp
        })
        .then(function () { btn.disabled = false; btn.innerHTML = txt; });
    });
  }

  // ---------- Le Cercle ----------
  function cercle() {
    var f = $('[data-cercle]');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = f.email.value.trim(), err = $('[data-cercle-err]');
      if (!/^\S+@\S+\.\S+$/.test(v)) { err.hidden = false; err.textContent = 'Indiquez une adresse e-mail valide, par exemple vous@exemple.com.'; return; }
      f.outerHTML = '<p role="status" class="rise" style="margin:14px 0 0;font-size:18px;color:var(--miel)">Merci. Vous faites désormais partie du Cercle.</p>';
      err.hidden = true;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    menu(); cercle();
    Promise.race([chargerCatalogue(), delai(3500)]).then(function () {
      rendu = true;
      heros(); grilles(); fiche(); panier();
      observer(document); verifier(); majBadge(false);
    });
    var nav = $('.nav');
    function bord() { if (nav) nav.classList.toggle('defile', window.scrollY > 8); }
    window.addEventListener('scroll', bord, { passive: true }); bord();
    // le bouton WhatsApp s'efface pendant la lecture (défilement vers le bas) et revient en remontant
    var wa = $('.wa-flottant'), dernierY = window.scrollY;
    if (wa) window.addEventListener('scroll', function () {
      var y = window.scrollY, d = y - dernierY;
      if (Math.abs(d) < 8) return;
      if (!$('#toast.on')) wa.classList.toggle('cache', d > 0 && y > 200);
      dernierY = y;
    }, { passive: true });
    setTimeout(verifier, 300);
    observer(document);
    majBadge(false);
    $$('[data-annee]').forEach(function (s) { s.textContent = new Date().getFullYear(); });
  });
})();
