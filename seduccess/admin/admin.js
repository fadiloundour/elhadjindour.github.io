/* Seduccess — espace d'administration (interface). Données : admin/api.js */
(function () {
  'use strict';
  var A = window.API;
  var IMG = '../assets/img/';

  // ---------------------------------------------------------------- utilitaires
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(t) { return t === null || t === undefined ? '' : String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fcfa(n) { return (Math.round(n || 0)).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' FCFA'; }
  function dateFr(d, heure) {
    if (!d) return '—';
    var o = heure ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(d).toLocaleString('fr-FR', o);
  }
  function versLocal(iso) { if (!iso) return ''; var d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
  function depuisLocal(v) { return v ? new Date(v).toISOString() : null; }
  function aujourdhui() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  function telWa(t) { var d = String(t || '').replace(/\D/g, ''); if (d.length === 9) d = '221' + d; return d; }
  function slug(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); }
  function srcImage(v, petit) { if (!v) return IMG + 'symbole.svg'; return /^https?:/.test(v) ? v : IMG + v + (petit && /^(produit-|savoir-matieres|savoir-parfum|resine|fondatrice)/.test(v) ? '-640' : '') + '.jpg'; }
  function entier(v) { var n = parseInt(String(v).replace(/\s/g, ''), 10); return isNaN(n) ? null : n; }

  var STATUTS = [['nouvelle', 'Nouvelle'], ['confirmee', 'Confirmée'], ['payee', 'Payée'], ['en_livraison', 'En livraison'], ['livree', 'Livrée'], ['annulee', 'Annulée']];
  var LIB = {}; STATUTS.forEach(function (s) { LIB[s[0]] = s[1]; });
  var PAIEMENT = { en_attente: 'En attente', paye: 'Payé', rembourse: 'Remboursé' };
  var CATS = [['thiouraye', 'Thiouraye'], ['huiles', 'Huiles'], ['parfums', 'Parfums d’intérieur'], ['recharges', 'Recharges'], ['accessoires', 'Accessoires']];
  function pastille(statut) { return '<span class="pastille p-' + statut + '">' + esc(LIB[statut] || statut) + '</span>'; }

  // ---------------------------------------------------------------- notifications
  var tNotif;
  function notif(msg, ko) {
    var n = $('#notif'); n.textContent = msg; n.classList.toggle('ko', !!ko); n.classList.add('on');
    clearTimeout(tNotif); tNotif = setTimeout(function () { n.classList.remove('on'); }, ko ? 5000 : 2600);
  }
  function erreur(e) { notif(e && e.message ? e.message : 'Une erreur est survenue.', true); }

  // ---------------------------------------------------------------- dialogue
  var dlg, dlgValider;
  function ouvrir(o) {
    dlg = $('#dialogue');
    $('#dialogue-titre').textContent = o.titre;
    $('#dialogue-corps').innerHTML = o.corps;
    $('#dialogue-pied').innerHTML = o.pied || '<button class="btn" type="button" data-fermer>Annuler</button><button class="btn principal" type="submit">' + (o.bouton || 'Enregistrer') + '</button>';
    $('#dialogue-erreur').hidden = true;
    dlgValider = o.valider;
    if (!dlg.open) dlg.showModal();
    if (o.apres) o.apres($('#dialogue-corps'));
    var premier = $('#dialogue-corps input:not([type=hidden]):not([readonly]), #dialogue-corps select, #dialogue-corps textarea');
    if (premier && window.matchMedia('(hover: hover)').matches) premier.focus();
  }
  function fermer() { if (dlg && dlg.open) dlg.close(); }
  function erreurDialogue(m) { var e = $('#dialogue-erreur'); e.textContent = m; e.hidden = false; e.scrollIntoView({ block: 'nearest' }); }
  function lancerDialogue() {
    $('#dialogue-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!dlgValider) return fermer();
      var btn = $('#dialogue-pied button[type=submit]');
      if (btn) btn.disabled = true;
      try { var r = await dlgValider($('#dialogue-corps')); if (r !== false) fermer(); }
      catch (err) { erreurDialogue(err.message || String(err)); }
      finally { if (btn) btn.disabled = false; }
    });
    $('#dialogue').addEventListener('click', function (e) {
      if (e.target.closest('[data-fermer]')) { e.preventDefault(); fermer(); }
      if (e.target === e.currentTarget) fermer();   // clic sur le fond
    });
  }

  // ---------------------------------------------------------------- navigation
  var ICONES = {
    tableau: '<path d="M4 13h6V4H4zM14 20h6V11h-6zM4 20h6v-4H4zM14 7h6V4h-6z"/>',
    commandes: '<path d="M5 7h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 7z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    produits: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    stock: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    reductions: '<path d="M5 19L19 5"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    livraison: '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    promos: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    taches: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>'
  };
  var SECTIONS = [
    ['tableau', 'Tableau de bord'], ['commandes', 'Commandes'], ['produits', 'Produits'], ['stock', 'Stock'],
    ['reductions', 'Réductions'], ['livraison', 'Livraison'], ['promos', 'Codes promo'], ['taches', 'Tâches']
  ];
  var nbNouvelles = 0;
  function menu(actuelle) {
    $('#onglets').innerHTML = SECTIONS.map(function (s) {
      return '<a class="onglet" href="#' + s[0] + '"' + (s[0] === actuelle ? ' aria-current="page"' : '') + '><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONES[s[0]] + '</svg>' + s[1] +
        (s[0] === 'commandes' && nbNouvelles ? '<span class="compte" aria-label="' + nbNouvelles + ' nouvelles">' + nbNouvelles + '</span>' : '') + '</a>';
    }).join('');
    var a = $('.onglet[aria-current]'), o = $('#onglets');
    if (a && o.scrollWidth > o.clientWidth) o.scrollLeft = Math.max(0, a.offsetLeft - 16);
  }
  async function majCompteur() {
    try { var l = await A.compterCommandes(); nbNouvelles = l.filter(function (c) { return c.statut === 'nouvelle'; }).length; menu(courante); } catch (e) { /* silencieux */ }
  }
  var courante = 'tableau';
  async function aller() {
    var h = (location.hash || '#tableau').slice(1);
    if (!VUES[h]) h = 'tableau';
    courante = h;
    menu(h);
    $('#titre-section').textContent = SECTIONS.filter(function (s) { return s[0] === h; })[0][1];
    $('#actions-section').innerHTML = '';
    $('#vue').innerHTML = '<p class="chargement">Chargement…</p>';
    try { await VUES[h]($('#vue')); } catch (e) { $('#vue').innerHTML = '<div class="carte vide"><p>' + esc(e.message) + '</p><button class="btn" type="button" id="reessayer">Réessayer</button></div>'; $('#reessayer').onclick = aller; }
    document.title = $('#titre-section').textContent + ' — Seduccess';
  }
  function actions(html) { $('#actions-section').innerHTML = html; }

  // ================================================================ TABLEAU DE BORD
  var periode = 30;
  async function vueTableau(v) {
    actions('<div class="chips" role="group" aria-label="Période" style="margin:0">' + [7, 30, 90].map(function (j) { return '<button class="chip" type="button" data-j="' + j + '" aria-pressed="' + (j === periode) + '">' + j + ' jours</button>'; }).join('') + '</div>');
    $$('[data-j]').forEach(function (b) { b.onclick = function () { periode = +b.dataset.j; aller(); }; });
    var r = await Promise.all([A.tableau(periode), A.taches()]);
    var d = r[0], taches = r[1].filter(function (t) { return t.statut !== 'fait' && t.echeance && t.echeance <= aujourdhui(); });
    var max = Math.max.apply(null, d.par_jour.map(function (x) { return x.total; }).concat([1]));
    var topMax = Math.max.apply(null, (d.top_produits || []).map(function (x) { return x.quantite; }).concat([1]));
    var payTot = Object.keys(d.par_paiement || {}).reduce(function (a, k) { return a + d.par_paiement[k]; }, 0) || 1;
    v.innerHTML =
      '<div class="kpis">' +
        kpi(fcfa(d.chiffre_affaires), 'Chiffre d’affaires · ' + periode + ' j') + kpi(d.commandes, 'Commandes · ' + periode + ' j') +
        kpi(fcfa(d.panier_moyen), 'Panier moyen') + kpi('<a href="#commandes">' + d.a_traiter + '</a>', 'Commandes à traiter') +
        kpi(d.paiements_attente, 'Paiements en attente') + kpi(d.clients, 'Clients') +
      '</div>' +
      '<div class="grille">' +
        '<div class="carte" style="grid-column: 1 / -1"><h2>Ventes par jour</h2>' +
          '<div class="graph" role="img" aria-label="Chiffre d’affaires par jour">' + d.par_jour.map(function (x) {
            return '<div class="b" style="height:' + Math.max(2, Math.round(x.total / max * 100)) + '%" title="' + esc(dateFr(x.jour)) + ' : ' + fcfa(x.total) + ' (' + x.nb + ' commande' + (x.nb > 1 ? 's' : '') + ')"></div>';
          }).join('') + '</div>' +
          '<div class="graph-legende"><span>' + dateFr(d.par_jour[0] && d.par_jour[0].jour) + '</span><span>Aujourd’hui</span></div></div>' +
        '<div class="carte"><h2>Meilleures ventes</h2>' + ((d.top_produits || []).length ? d.top_produits.map(function (t) {
          return '<div class="barre-h"><span>' + esc(t.nom) + '</span><span class="aide">' + t.quantite + ' vendus · ' + fcfa(t.total) + '</span><div class="jauge"><i style="width:' + Math.round(t.quantite / topMax * 100) + '%"></i></div></div>';
        }).join('') : '<p class="aide">Aucune vente sur la période.</p>') + '</div>' +
        '<div class="carte"><h2>Moyens de paiement</h2>' + (Object.keys(d.par_paiement || {}).length ? Object.keys(d.par_paiement).map(function (k) {
          return '<div class="barre-h"><span>' + esc(k) + '</span><span class="aide">' + d.par_paiement[k] + '</span><div class="jauge"><i style="width:' + Math.round(d.par_paiement[k] / payTot * 100) + '%"></i></div></div>';
        }).join('') : '<p class="aide">Aucune commande sur la période.</p>') + '</div>' +
        '<div class="carte"><h2>Stock à surveiller</h2>' + ((d.stock_bas || []).length ? d.stock_bas.map(function (s) {
          return '<div class="barre-h"><span>' + esc(s.produit) + ' · ' + esc(s.format) + '</span>' + (s.stock === 0 ? '<span class="pastille p-rupture">Épuisé</span>' : '<span class="pastille p-alerte">' + s.stock + ' restants</span>') + '</div>';
        }).join('') + '<a href="#stock">Gérer le stock ›</a>' : '<p class="aide">Tout est en stock.</p>') + '</div>' +
        '<div class="carte"><h2>Tâches du jour</h2>' + (taches.length ? taches.slice(0, 6).map(function (t) {
          return '<div class="barre-h"><span>' + esc(t.titre) + '</span><span class="aide' + (t.echeance < aujourdhui() ? ' en-retard' : '') + '">' + (t.echeance < aujourdhui() ? 'En retard' : 'Aujourd’hui') + '</span></div>';
        }).join('') + '<a href="#taches">Toutes les tâches ›</a>' : '<p class="aide">Rien de prévu aujourd’hui.</p>') + '</div>' +
      '</div>';
  }
  function kpi(v, l) { return '<div class="kpi"><div class="v">' + v + '</div><div class="l">' + l + '</div></div>'; }

  // ================================================================ COMMANDES
  var filtreStatut = 'nouvelle', recherche = '';
  async function vueCommandes(v) {
    var r = await Promise.all([A.commandes(filtreStatut, recherche), A.compterCommandes()]);
    var liste = r[0], tous = r[1], comptes = {};
    tous.forEach(function (c) { comptes[c.statut] = (comptes[c.statut] || 0) + 1; });
    nbNouvelles = comptes.nouvelle || 0; menu('commandes');
    v.innerHTML =
      '<div class="chips" role="group" aria-label="Filtrer par statut">' +
        '<button class="chip" type="button" data-s="toutes" aria-pressed="' + (filtreStatut === 'toutes') + '">Toutes<b>' + tous.length + '</b></button>' +
        STATUTS.map(function (s) { return '<button class="chip" type="button" data-s="' + s[0] + '" aria-pressed="' + (filtreStatut === s[0]) + '">' + s[1] + '<b>' + (comptes[s[0]] || 0) + '</b></button>'; }).join('') +
      '</div>' +
      '<div class="barre-outils"><label class="sr-only" for="rech">Rechercher</label><input class="recherche" id="rech" type="search" placeholder="Rechercher un numéro, un nom, un téléphone" value="' + esc(recherche) + '"></div>' +
      (liste.length ? '<div class="liste">' + liste.map(function (c) {
        return '<button class="rangee" type="button" data-id="' + c.id + '">' +
          '<span><span class="t">' + esc(c.numero) + '</span><br><span class="s">' + esc(c.client_nom) + ' · ' + esc(c.client_tel) + '</span></span>' +
          '<span class="cache-mobile"><span class="s">' + dateFr(c.cree_le, true) + '</span><br><span class="s">' + (c.mode === 'livraison' ? 'Livraison · ' + esc(c.zones_livraison ? c.zones_livraison.nom : '') : 'Retrait') + ' · ' + esc(c.paiement) + '</span></span>' +
          '<span class="m cache-mobile">' + fcfa(c.total) + '<br><span class="s">' + (c.lignes_commande || []).reduce(function (a, l) { return a + l.quantite; }, 0) + ' article(s)</span></span>' +
          '<span style="text-align:right">' + pastille(c.statut) + '<br><span class="s">' + (c.paiement_statut === 'paye' ? 'Payé' : PAIEMENT[c.paiement_statut]) + '</span></span></button>';
      }).join('') + '</div>' : '<div class="carte vide">Aucune commande ' + (filtreStatut === 'toutes' ? '' : '« ' + esc(LIB[filtreStatut]) + ' » ') + (recherche ? 'pour « ' + esc(recherche) + ' »' : 'pour le moment') + '.</div>');
    $$('[data-s]', v).forEach(function (b) { b.onclick = function () { filtreStatut = b.dataset.s; aller(); }; });
    var t; $('#rech', v).oninput = function (e) { clearTimeout(t); t = setTimeout(function () { recherche = e.target.value.trim(); aller().then(function () { var i = $('#rech'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 350); };
    $$('.rangee', v).forEach(function (b) { b.onclick = function () { ouvrirCommande(b.dataset.id); }; });
  }

  async function ouvrirCommande(id) {
    var c = await A.commande(id).catch(erreur); if (!c) return;
    var lignes = c.lignes_commande || [];
    var hist = (c.historique_commande || []).sort(function (a, b) { return a.id - b.id; });
    var msgClient = 'Bonjour ' + c.client_nom + ', c’est Seduccess. Votre commande ' + c.numero + ' (' + fcfa(c.total) + ') ';
    ouvrir({
      titre: 'Commande ' + c.numero,
      corps:
        '<div class="grille" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))">' +
          '<div class="bloc"><h3>Client</h3><p style="margin:0;font-weight:600">' + esc(c.client_nom) + '</p><p style="margin:2px 0 10px">' + esc(c.client_tel) + '</p>' +
            '<a class="btn petit" href="tel:+' + telWa(c.client_tel) + '">Appeler</a> <a class="btn petit" target="_blank" rel="noopener" href="https://wa.me/' + telWa(c.client_tel) + '?text=' + encodeURIComponent(msgClient) + '">WhatsApp</a></div>' +
          '<div class="bloc"><h3>Réception</h3><p style="margin:0;font-weight:600">' + (c.mode === 'livraison' ? 'Livraison · ' + esc(c.zones_livraison ? c.zones_livraison.nom : '') : 'Retrait sur place') + '</p><p style="margin:2px 0 0">' + esc(c.adresse || '') + '</p><p class="aide" style="margin-top:8px">Reçue le ' + dateFr(c.cree_le, true) + '</p></div>' +
        '</div>' +
        '<div class="bloc"><h3>Articles</h3><table class="lignes-cmd">' + lignes.map(function (l) {
          return '<tr><td>' + l.quantite + ' × ' + esc(l.produit_nom) + ' <span class="aide">(' + esc(l.format_nom) + ' · ' + fcfa(l.prix_unitaire) + ')</span></td><td class="n">' + fcfa(l.total) + '</td></tr>';
        }).join('') +
          '<tr class="tot"><td>Sous-total</td><td class="n">' + fcfa(c.sous_total) + '</td></tr>' +
          (c.remise ? '<tr class="tot"><td>Remise' + (c.code_promo ? ' (' + esc(c.code_promo) + ')' : '') + '</td><td class="n">− ' + fcfa(c.remise) + '</td></tr>' : '') +
          (c.mode === 'livraison' ? '<tr class="tot"><td>Livraison</td><td class="n">' + fcfa(c.frais_livraison) + '</td></tr>' : '') +
          '<tr class="tot grand"><td>Total · ' + esc(c.paiement) + '</td><td class="n">' + fcfa(c.total) + '</td></tr></table>' +
          (c.note_client ? '<p style="margin:10px 0 0"><strong>Note du client :</strong> ' + esc(c.note_client) + '</p>' : '') + '</div>' +
        '<div class="bloc"><h3>Suivi</h3><div class="grille-champs">' +
          '<div class="champ"><label for="c-statut">Statut</label><select id="c-statut">' + STATUTS.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === c.statut ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div>' +
          '<div class="champ"><label for="c-pay">Paiement</label><select id="c-pay">' + Object.keys(PAIEMENT).map(function (k) { return '<option value="' + k + '"' + (k === c.paiement_statut ? ' selected' : '') + '>' + PAIEMENT[k] + '</option>'; }).join('') + '</select></div>' +
          '<div class="champ"><label for="c-livreur">Livreur</label><input id="c-livreur" value="' + esc(c.livreur || '') + '" placeholder="Nom du livreur"></div>' +
        '</div><p class="aide" id="c-avert" hidden style="margin-top:10px;color:var(--rouge)">En annulant, les articles reviennent automatiquement dans le stock.</p>' +
        '<div class="champ" style="margin-top:12px"><label for="c-note">Note interne</label><textarea id="c-note" placeholder="Visible uniquement par l’équipe">' + esc(c.note_interne || '') + '</textarea></div></div>' +
        '<div class="bloc"><h3>Historique</h3><ul class="chrono">' + hist.map(function (h) { return '<li>' + dateFr(h.cree_le, true) + ' · ' + esc(LIB[h.statut]) + (h.note ? ' — ' + esc(h.note) : '') + '</li>'; }).join('') + '</ul></div>',
      pied: '<button class="btn gauche" type="button" id="c-tache">Créer une tâche</button><button class="btn" type="button" data-fermer>Fermer</button><button class="btn principal" type="submit">Enregistrer</button>',
      apres: function (b) {
        var s = $('#c-statut', b);
        s.onchange = function () { $('#c-avert', b).hidden = !(s.value === 'annulee' && c.statut !== 'annulee'); };
        $('#c-tache').onclick = function () { editerTache({ titre: 'Commande ' + c.numero + ' — ', commande_id: c.id, priorite: 'normale', statut: 'a_faire', echeance: aujourdhui() }); };
      },
      valider: async function (b) {
        await A.majCommande(c.id, { statut: $('#c-statut', b).value, paiement_statut: $('#c-pay', b).value, livreur: $('#c-livreur', b).value.trim() || null, note_interne: $('#c-note', b).value.trim() || null });
        notif('Commande ' + c.numero + ' mise à jour'); majCompteur(); if (courante === 'commandes' || courante === 'livraison' || courante === 'tableau') aller();
      }
    });
  }

  // ================================================================ PRODUITS
  async function vueProduits(v) {
    actions('<button class="btn principal" type="button" id="nouveau-produit">+ Nouveau produit</button>');
    $('#nouveau-produit').onclick = function () { editerProduit(null); };
    var ps = await A.produits();
    v.innerHTML = ps.length ? '<div class="produits">' + ps.map(function (p) {
      var fs = (p.formats || []).filter(function (f) { return f.actif; });
      var stock = (p.formats || []).reduce(function (a, f) { return a + f.stock; }, 0);
      var prix = fs.length ? Math.min.apply(null, fs.map(function (f) { return f.prix; })) : 0;
      return '<div class="produit' + (p.visible ? '' : ' masque') + '"><img src="' + esc(srcImage(p.image, true)) + '" alt="" loading="lazy">' +
        '<div class="info"><div class="t">' + esc(p.nom) + '</div><div class="s">' + fs.length + ' format' + (fs.length > 1 ? 's' : '') + ' · dès ' + fcfa(prix) + '</div><div class="s">Stock : ' + stock + (p.visible ? '' : ' · <strong>masqué</strong>') + '</div></div>' +
        '<div style="display:flex;flex-direction:column;gap:6px"><button class="btn petit" type="button" data-edit="' + esc(p.id) + '">Modifier</button>' +
        '<button class="btn petit lien" type="button" data-vis="' + esc(p.id) + '">' + (p.visible ? 'Masquer' : 'Afficher') + '</button></div></div>';
    }).join('') + '</div>' : '<div class="carte vide">Aucun produit. Créez le premier.</div>';
    $$('[data-edit]', v).forEach(function (b) { b.onclick = function () { editerProduit(ps.filter(function (p) { return p.id === b.dataset.edit; })[0]); }; });
    $$('[data-vis]', v).forEach(function (b) {
      b.onclick = async function () {
        var p = ps.filter(function (x) { return x.id === b.dataset.vis; })[0];
        try { await A.majProduit(p.id, { visible: !p.visible }); notif(p.nom + (p.visible ? ' masqué de la boutique' : ' visible sur la boutique')); aller(); } catch (e) { erreur(e); }
      };
    });
  }

  function editerProduit(p) {
    var nouveau = !p;
    p = p || { id: '', nom: '', categorie: 'thiouraye', notes: [['Tête', ''], ['Cœur', ''], ['Fond', '']], composants: [], galerie: [], visible: true, ordre: 10, formats: [] };
    var galerie = (p.galerie || []).map(function (g) { return [g[0], g[1]]; });
    if (!galerie.length && p.image) galerie = [[p.image, p.nom]];
    var formats = (p.formats || []).slice().sort(function (a, b) { return a.ordre - b.ordre; }).map(function (f) { return Object.assign({}, f); });
    if (!formats.length) formats.push({ nom: '', note: '', prix: '', stock: 0, seuil_alerte: 5, actif: true });
    var supprimes = [];
    var notes = (p.notes && p.notes.length ? p.notes : [['Tête', ''], ['Cœur', ''], ['Fond', '']]);

    function htmlFormats() {
      return formats.map(function (f, i) {
        return '<div class="format-ligne" data-i="' + i + '">' +
          '<div class="champ"><label>Format</label><input data-k="nom" value="' + esc(f.nom) + '" placeholder="Pot · 500 g" required></div>' +
          '<div class="champ"><label>Prix (FCFA)</label><input data-k="prix" inputmode="numeric" value="' + esc(f.prix) + '" required></div>' +
          '<div class="champ"><label>' + (f.id ? 'Stock' : 'Stock initial') + '</label><input data-k="stock" inputmode="numeric" value="' + esc(f.stock) + '"' + (f.id ? ' readonly title="Modifiez le stock depuis la section Stock"' : '') + '></div>' +
          '<div class="champ"><label>Alerte à</label><input data-k="seuil_alerte" inputmode="numeric" value="' + esc(f.seuil_alerte) + '"></div>' +
          '<button class="icone" type="button" data-suppr="' + i + '" aria-label="Retirer ce format">✕</button>' +
          '<div class="champ" style="grid-column:1/-1"><label>Précision (facultatif)</label><input data-k="note" value="' + esc(f.note || '') + '" placeholder="Ex. Pour une pièce"></div>' +
          '<label class="case" style="grid-column:1/-1"><input type="checkbox" data-k="actif"' + (f.actif !== false ? ' checked' : '') + '> En vente</label></div>';
      }).join('');
    }
    function htmlGalerie() {
      return galerie.map(function (g, i) {
        return '<figure' + (i === 0 ? ' class="principale" title="Image principale"' : '') + '><img src="' + esc(srcImage(g[0], true)) + '" alt=""><button type="button" data-img-suppr="' + i + '" aria-label="Retirer cette image">✕</button></figure>';
      }).join('') + '<label class="ajout-image" title="Ajouter une image"><input type="file" accept="image/jpeg,image/png,image/webp" id="p-fichier" hidden>+</label>';
    }
    function lireFormats(b) {
      $$('.format-ligne', b).forEach(function (row) {
        var f = formats[+row.dataset.i];
        $$('[data-k]', row).forEach(function (inp) { f[inp.dataset.k] = inp.type === 'checkbox' ? inp.checked : inp.value; });
      });
    }
    function brancher(b) {
      $$('[data-suppr]', b).forEach(function (btn) {
        btn.onclick = function () {
          lireFormats(b);
          var f = formats.splice(+btn.dataset.suppr, 1)[0];
          if (f && f.id) supprimes.push(f.id);
          $('#p-formats', b).innerHTML = htmlFormats(); brancher(b);
        };
      });
      $$('[data-img-suppr]', b).forEach(function (btn) { btn.onclick = function () { galerie.splice(+btn.dataset.imgSuppr, 1); $('#p-galerie', b).innerHTML = htmlGalerie(); brancher(b); }; });
      $$('#p-galerie figure img', b).forEach(function (im, i) { im.onclick = function () { if (i) { galerie.unshift(galerie.splice(i, 1)[0]); $('#p-galerie', b).innerHTML = htmlGalerie(); brancher(b); } }; });
      var fi = $('#p-fichier', b);
      if (fi) fi.onchange = async function () {
        var f = fi.files[0]; if (!f) return;
        if (f.size > 4 * 1024 * 1024) return erreurDialogue('Image trop lourde (4 Mo maximum). Réduisez-la avant de l’envoyer.');
        fi.parentNode.textContent = '…';
        try { var url = await A.envoyerImage(f); galerie.push([url, ($('#p-nom', b).value || 'Produit Seduccess')]); }
        catch (e) { erreurDialogue(e.message); }
        $('#p-galerie', b).innerHTML = htmlGalerie(); brancher(b);
      };
    }

    ouvrir({
      titre: nouveau ? 'Nouveau produit' : 'Modifier · ' + p.nom,
      corps:
        '<div class="grille-champs">' +
          '<div class="champ" style="grid-column:1/-1"><label for="p-nom">Nom du produit</label><input id="p-nom" value="' + esc(p.nom) + '" required></div>' +
          '<div class="champ"><label for="p-id">Identifiant (adresse de la page)</label><input id="p-id" value="' + esc(p.id) + '"' + (nouveau ? '' : ' readonly') + ' pattern="[a-z0-9-]{2,40}"><p class="aide">' + (nouveau ? 'Rempli automatiquement.' : 'Ne peut plus être modifié.') + '</p></div>' +
          '<div class="champ"><label for="p-cat">Catégorie</label><select id="p-cat">' + CATS.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === p.categorie ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select></div>' +
          '<div class="champ"><label for="p-ordre">Ordre d’affichage</label><input id="p-ordre" inputmode="numeric" value="' + esc(p.ordre) + '"></div>' +
        '</div>' +
        '<div class="champ"><label for="p-acc">Accroche</label><input id="p-acc" value="' + esc(p.accroche || '') + '" placeholder="Encens parfumé d’exception."></div>' +
        '<div class="champ"><label for="p-desc">Description</label><textarea id="p-desc" rows="4">' + esc(p.description || '') + '</textarea></div>' +
        '<div><p class="etiquette" style="margin:0 0 6px">Images (la première est l’image principale ; touchez une image pour la mettre en premier)</p><div class="vignettes" id="p-galerie">' + htmlGalerie() + '</div></div>' +
        '<div><p class="etiquette" style="margin:0 0 6px">Formats, prix et stock</p><div class="formats-edit" id="p-formats">' + htmlFormats() + '</div>' +
          '<button class="btn petit" type="button" id="p-ajout-format" style="margin-top:10px">+ Ajouter un format</button></div>' +
        '<div><p class="etiquette" style="margin:0 0 6px">Notes olfactives</p><div class="grille-champs">' + notes.map(function (n, i) {
          return '<div class="champ"><label for="p-n' + i + '">' + esc(n[0]) + '</label><input id="p-n' + i + '" data-note="' + esc(n[0]) + '" value="' + esc(n[1]) + '"></div>';
        }).join('') + '</div></div>' +
        '<div class="champ"><label for="p-comp">Composants (un par ligne)</label><textarea id="p-comp" rows="4">' + esc((p.composants || []).join('\n')) + '</textarea></div>' +
        '<div class="champ"><label for="p-usage">Utilisation</label><textarea id="p-usage" rows="3">' + esc(p.usage || '') + '</textarea></div>' +
        '<div class="champ"><label for="p-prec">Précautions</label><textarea id="p-prec" rows="3">' + esc(p.precautions || '') + '</textarea></div>' +
        '<label class="case"><input type="checkbox" id="p-visible"' + (p.visible ? ' checked' : '') + '> Visible sur la boutique</label>',
      pied: (nouveau ? '' : '<button class="btn danger gauche" type="button" id="p-suppr">Supprimer</button>') + '<button class="btn" type="button" data-fermer>Annuler</button><button class="btn principal" type="submit">Enregistrer</button>',
      apres: function (b) {
        brancher(b);
        if (nouveau) $('#p-nom', b).oninput = function (e) { $('#p-id', b).value = slug(e.target.value); };
        $('#p-ajout-format', b).onclick = function () { lireFormats(b); formats.push({ nom: '', note: '', prix: '', stock: 0, seuil_alerte: 5, actif: true }); $('#p-formats', b).innerHTML = htmlFormats(); brancher(b); };
        var s = $('#p-suppr'); if (s) s.onclick = async function () {
          if (!window.confirm('Supprimer définitivement « ' + p.nom + ' » ? Les commandes passées restent enregistrées. Pour le retirer temporairement, utilisez plutôt « Masquer ».')) return;
          try { await A.supprimerProduit(p.id); fermer(); notif('Produit supprimé'); aller(); } catch (e) { erreurDialogue(e.message); }
        };
      },
      valider: async function (b) {
        lireFormats(b);
        var nom = $('#p-nom', b).value.trim(), id = $('#p-id', b).value.trim();
        if (nom.length < 2) throw new Error('Indiquez le nom du produit.');
        if (!/^[a-z0-9-]{2,40}$/.test(id)) throw new Error('L’identifiant ne doit contenir que des lettres minuscules, des chiffres et des tirets.');
        if (!formats.length) throw new Error('Ajoutez au moins un format avec son prix.');
        var fs = formats.map(function (f) {
          var prix = entier(f.prix), seuil = entier(f.seuil_alerte), stock = entier(f.stock);
          if (!String(f.nom).trim()) throw new Error('Chaque format doit avoir un nom (ex. « Pot · 500 g »).');
          if (prix === null || prix < 0) throw new Error('Prix invalide pour « ' + f.nom + ' ».');
          var o = { nom: String(f.nom).trim(), note: String(f.note || '').trim() || null, prix: prix, seuil_alerte: seuil === null ? 5 : Math.max(0, seuil), actif: !!f.actif };
          if (f.id) o.id = f.id; else o.stock = Math.max(0, stock || 0);
          if (f.prix_promo !== undefined && f.prix_promo !== null && f.prix_promo >= prix) o.prix_promo = null;   // réduction devenue incohérente
          return o;
        });
        var produit = {
          id: id, nom: nom, categorie: $('#p-cat', b).value, accroche: $('#p-acc', b).value.trim() || null,
          description: $('#p-desc', b).value.trim() || null,
          notes: $$('[data-note]', b).map(function (i) { return [i.dataset.note, i.value.trim()]; }).filter(function (n) { return n[1]; }),
          composants: $('#p-comp', b).value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
          usage: $('#p-usage', b).value.trim() || null, precautions: $('#p-prec', b).value.trim() || null,
          image: galerie.length ? galerie[0][0] : null, galerie: galerie, visible: $('#p-visible', b).checked, ordre: entier($('#p-ordre', b).value) || 0
        };
        await A.enregistrerProduit(produit, fs, supprimes);
        notif(nouveau ? 'Produit créé' : 'Produit enregistré'); aller();
      }
    });
  }

  // ================================================================ STOCK
  async function vueStock(v) {
    var r = await Promise.all([A.produits(), A.mouvements()]);
    var lignes = [];
    r[0].forEach(function (p) { (p.formats || []).forEach(function (f) { lignes.push({ p: p, f: f }); }); });
    lignes.sort(function (a, b) { return (a.f.stock - a.f.seuil_alerte) - (b.f.stock - b.f.seuil_alerte); });
    function etat(f) { return f.stock === 0 ? '<span class="pastille p-rupture">Épuisé</span>' : f.stock <= f.seuil_alerte ? '<span class="pastille p-alerte">Stock bas</span>' : '<span class="pastille p-ok">En stock</span>'; }
    v.innerHTML =
      '<div class="tab-wrap"><table class="tab"><thead><tr><th>Produit</th><th>Format</th><th class="n">Stock</th><th class="n">Alerte à</th><th>État</th><th></th></tr></thead><tbody>' +
      lignes.map(function (x, i) {
        return '<tr><td>' + esc(x.p.nom) + (x.f.actif ? '' : ' <span class="pastille p-neutre">Hors vente</span>') + '</td><td>' + esc(x.f.nom) + '</td><td class="n"><strong>' + x.f.stock + '</strong></td><td class="n">' + x.f.seuil_alerte + '</td><td>' + etat(x.f) + '</td>' +
          '<td><button class="btn petit" type="button" data-aj="' + i + '">Ajuster</button></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<h2 style="font-size:16px;font-weight:600;margin:28px 0 12px">Derniers mouvements</h2>' +
      (r[1].length ? '<div class="tab-wrap"><table class="tab"><thead><tr><th>Date</th><th>Article</th><th class="n">Quantité</th><th>Motif</th><th>Note</th></tr></thead><tbody>' + r[1].map(function (m) {
        var nomP = m.formats && m.formats.produits ? m.formats.produits.nom : '—';
        return '<tr><td>' + dateFr(m.cree_le, true) + '</td><td>' + esc(nomP) + ' · ' + esc(m.formats ? m.formats.nom : '') + '</td><td class="n" style="color:' + (m.delta < 0 ? 'var(--rouge)' : 'var(--vert)') + '">' + (m.delta > 0 ? '+' : '') + m.delta + '</td><td>' + esc({ vente: 'Vente', reassort: 'Réassort', correction: 'Correction', annulation: 'Commande annulée' }[m.motif]) + '</td><td>' + esc(m.note || '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="carte vide">Aucun mouvement pour le moment.</div>');
    $$('[data-aj]', v).forEach(function (b) { b.onclick = function () { ajuster(lignes[+b.dataset.aj]); }; });
  }
  function ajuster(x) {
    ouvrir({
      titre: 'Stock · ' + x.p.nom + ' · ' + x.f.nom,
      corps: '<p style="margin:0">Stock actuel : <strong>' + x.f.stock + '</strong></p>' +
        '<fieldset style="border:0;padding:0;margin:0"><legend class="etiquette" style="margin-bottom:6px">Opération</legend>' +
          '<label class="case"><input type="radio" name="op" value="reassort" checked> Réassort (ajouter)</label><br>' +
          '<label class="case"><input type="radio" name="op" value="retrait"> Correction (retirer : casse, perte, cadeau…)</label></fieldset>' +
        '<div class="grille-champs"><div class="champ"><label for="s-q">Quantité</label><input id="s-q" inputmode="numeric" value="1"></div>' +
        '<div class="champ"><label for="s-seuil">Alerte quand il reste</label><input id="s-seuil" inputmode="numeric" value="' + x.f.seuil_alerte + '"></div></div>' +
        '<div class="champ"><label for="s-note">Note (facultatif)</label><input id="s-note" placeholder="Ex. livraison du fournisseur"></div>',
      valider: async function (b) {
        var q = entier($('#s-q', b).value), op = $('input[name=op]:checked', b).value, seuil = entier($('#s-seuil', b).value);
        if (!q || q < 1) throw new Error('Indiquez une quantité supérieure à zéro.');
        if (seuil !== null && seuil !== x.f.seuil_alerte) await A.majFormat(x.f.id, { seuil_alerte: Math.max(0, seuil) });
        var n = await A.ajusterStock(x.f.id, op === 'reassort' ? q : -q, op === 'reassort' ? 'reassort' : 'correction', $('#s-note', b).value.trim());
        notif('Nouveau stock : ' + n); aller();
      }
    });
  }

  // ================================================================ RÉDUCTIONS
  function etatPromo(f) {
    if (f.prix_promo === null || f.prix_promo === undefined) return ['aucune', '<span class="pastille p-neutre">Aucune</span>'];
    var n = Date.now();
    if (f.promo_fin && new Date(f.promo_fin) <= n) return ['expiree', '<span class="pastille p-neutre">Terminée</span>'];
    if (f.promo_debut && new Date(f.promo_debut) > n) return ['prog', '<span class="pastille p-alerte">Programmée</span>'];
    return ['active', '<span class="pastille p-ok">En cours</span>'];
  }
  async function vueReductions(v) {
    actions('<button class="btn principal" type="button" id="nv-red">+ Nouvelle réduction</button>');
    var ps = await A.produits(), lignes = [];
    ps.forEach(function (p) { (p.formats || []).forEach(function (f) { lignes.push({ p: p, f: f }); }); });
    $('#nv-red').onclick = function () { editerReduction(lignes, null); };
    var avec = lignes.filter(function (x) { return x.f.prix_promo !== null && x.f.prix_promo !== undefined; });
    v.innerHTML = '<p class="aide" style="margin:0 0 14px">Une réduction affiche un prix barré sur la boutique pendant la période choisie. Pour une remise avec un code, utilisez « Codes promo ».</p>' +
      (avec.length ? '<div class="tab-wrap"><table class="tab"><thead><tr><th>Article</th><th class="n">Prix</th><th class="n">Prix réduit</th><th class="n">Remise</th><th>Période</th><th>État</th><th></th></tr></thead><tbody>' + avec.map(function (x) {
        var i = lignes.indexOf(x);
        return '<tr><td>' + esc(x.p.nom) + ' · ' + esc(x.f.nom) + '</td><td class="n" style="text-decoration:line-through;color:var(--faible)">' + fcfa(x.f.prix) + '</td><td class="n"><strong>' + fcfa(x.f.prix_promo) + '</strong></td><td class="n">−' + Math.round((1 - x.f.prix_promo / x.f.prix) * 100) + ' %</td>' +
          '<td>' + (x.f.promo_debut ? dateFr(x.f.promo_debut) : 'Dès maintenant') + ' → ' + (x.f.promo_fin ? dateFr(x.f.promo_fin) : 'sans fin') + '</td><td>' + etatPromo(x.f)[1] + '</td>' +
          '<td><button class="btn petit" type="button" data-ed="' + i + '">Modifier</button> <button class="btn petit danger" type="button" data-rm="' + i + '">Retirer</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="carte vide">Aucune réduction en cours. Créez-en une pour afficher un prix barré.</div>');
    $$('[data-ed]', v).forEach(function (b) { b.onclick = function () { editerReduction(lignes, lignes[+b.dataset.ed]); }; });
    $$('[data-rm]', v).forEach(function (b) {
      b.onclick = async function () {
        var x = lignes[+b.dataset.rm];
        try { await A.majFormat(x.f.id, { prix_promo: null, promo_debut: null, promo_fin: null }); notif('Réduction retirée'); aller(); } catch (e) { erreur(e); }
      };
    });
  }
  function editerReduction(lignes, x) {
    ouvrir({
      titre: x ? 'Réduction · ' + x.p.nom + ' · ' + x.f.nom : 'Nouvelle réduction',
      corps:
        '<div class="champ"><label for="r-f">Article</label><select id="r-f"' + (x ? ' disabled' : '') + '>' + lignes.map(function (l, i) { return '<option value="' + i + '"' + (l === x ? ' selected' : '') + '>' + esc(l.p.nom + ' · ' + l.f.nom + ' — ' + fcfa(l.f.prix)) + '</option>'; }).join('') + '</select></div>' +
        '<div class="grille-champs"><div class="champ"><label for="r-type">Type</label><select id="r-type"><option value="pct">Pourcentage</option><option value="prix">Nouveau prix</option></select></div>' +
        '<div class="champ"><label for="r-val">Valeur</label><input id="r-val" inputmode="numeric" value="' + (x ? Math.round((1 - x.f.prix_promo / x.f.prix) * 100) : 10) + '"></div></div>' +
        '<p class="aide" id="r-apercu"></p>' +
        '<div class="grille-champs"><div class="champ"><label for="r-deb">Début</label><input id="r-deb" type="datetime-local" value="' + versLocal(x && x.f.promo_debut) + '"><p class="aide">Vide : tout de suite.</p></div>' +
        '<div class="champ"><label for="r-fin">Fin</label><input id="r-fin" type="datetime-local" value="' + versLocal(x && x.f.promo_fin) + '"><p class="aide">Vide : sans date de fin.</p></div></div>',
      apres: function (b) {
        function calc() {
          var l = lignes[+$('#r-f', b).value], v = entier($('#r-val', b).value) || 0;
          var p = $('#r-type', b).value === 'pct' ? Math.round(l.f.prix * (1 - v / 100) / 50) * 50 : v;
          $('#r-apercu', b).textContent = l ? 'Prix affiché : ' + fcfa(p) + ' au lieu de ' + fcfa(l.f.prix) : '';
          return { l: l, p: p };
        }
        ['#r-f', '#r-type', '#r-val'].forEach(function (s) { $(s, b).oninput = calc; $(s, b).onchange = calc; }); calc();
        b._calc = calc;
      },
      valider: async function (b) {
        var c = b._calc();
        if (!(c.p > 0) || c.p >= c.l.f.prix) throw new Error('Le prix réduit doit être inférieur au prix normal (' + fcfa(c.l.f.prix) + ').');
        var deb = depuisLocal($('#r-deb', b).value), fin = depuisLocal($('#r-fin', b).value);
        if (deb && fin && fin <= deb) throw new Error('La date de fin doit être après la date de début.');
        await A.majFormat(c.l.f.id, { prix_promo: c.p, promo_debut: deb, promo_fin: fin });
        notif('Réduction enregistrée'); aller();
      }
    });
  }

  // ================================================================ LIVRAISON
  async function vueLivraison(v) {
    actions('<button class="btn principal" type="button" id="nv-zone">+ Nouvelle zone</button>');
    $('#nv-zone').onclick = function () { editerZone(null); };
    var r = await Promise.all([A.zones(), A.commandes('toutes', '')]);
    var zones = r[0];
    var aLivrer = r[1].filter(function (c) { return c.mode === 'livraison' && ['nouvelle', 'confirmee', 'payee', 'en_livraison'].indexOf(c.statut) >= 0; });
    v.innerHTML =
      '<h2 style="font-size:16px;font-weight:600;margin:0 0 12px">Livraisons à faire (' + aLivrer.length + ')</h2>' +
      (aLivrer.length ? '<div class="liste">' + aLivrer.map(function (c) {
        return '<div class="rangee" style="cursor:default"><span><span class="t">' + esc(c.numero) + ' · ' + esc(c.client_nom) + '</span><br><span class="s">' + esc(c.zones_livraison ? c.zones_livraison.nom : '') + ' — ' + esc(c.adresse || '') + '</span></span>' +
          '<span class="cache-mobile s">' + (c.livreur ? 'Livreur : ' + esc(c.livreur) : 'Pas de livreur') + '<br>' + esc(c.client_tel) + '</span>' +
          '<span class="cache-mobile">' + pastille(c.statut) + '</span>' +
          '<span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">' +
            (c.statut !== 'en_livraison' ? '<button class="btn petit" type="button" data-st="en_livraison" data-id="' + c.id + '">En livraison</button>' : '') +
            '<button class="btn petit principal" type="button" data-st="livree" data-id="' + c.id + '">Livrée</button>' +
            '<button class="btn petit lien" type="button" data-voir="' + c.id + '">Détails</button></span></div>';
      }).join('') + '</div>' : '<div class="carte vide">Aucune livraison en attente.</div>') +
      '<h2 style="font-size:16px;font-weight:600;margin:28px 0 12px">Zones et frais de livraison</h2>' +
      '<div class="tab-wrap"><table class="tab"><thead><tr><th>Zone</th><th class="n">Frais</th><th>Délai</th><th>État</th><th></th></tr></thead><tbody>' + zones.map(function (z, i) {
        return '<tr><td>' + esc(z.nom) + '</td><td class="n">' + fcfa(z.frais) + '</td><td>' + esc(z.delai || '—') + '</td><td>' + (z.actif ? '<span class="pastille p-ok">Proposée</span>' : '<span class="pastille p-neutre">Désactivée</span>') + '</td><td><button class="btn petit" type="button" data-z="' + i + '">Modifier</button></td></tr>';
      }).join('') + '</tbody></table></div>';
    $$('[data-st]', v).forEach(function (b) {
      b.onclick = async function () {
        try { await A.majCommande(b.dataset.id, { statut: b.dataset.st }); notif(b.dataset.st === 'livree' ? 'Commande marquée livrée' : 'Commande en livraison'); aller(); } catch (e) { erreur(e); }
      };
    });
    $$('[data-voir]', v).forEach(function (b) { b.onclick = function () { ouvrirCommande(b.dataset.voir); }; });
    $$('[data-z]', v).forEach(function (b) { b.onclick = function () { editerZone(zones[+b.dataset.z]); }; });
  }
  function editerZone(z) {
    var nouveau = !z; z = z || { nom: '', frais: 1000, delai: '24 h', actif: true, ordre: 10 };
    ouvrir({
      titre: nouveau ? 'Nouvelle zone de livraison' : 'Zone · ' + z.nom,
      corps: '<div class="champ"><label for="z-nom">Nom de la zone</label><input id="z-nom" value="' + esc(z.nom) + '" placeholder="Ex. Almadies, Ngor, Ouakam"></div>' +
        '<div class="grille-champs"><div class="champ"><label for="z-frais">Frais (FCFA)</label><input id="z-frais" inputmode="numeric" value="' + esc(z.frais) + '"></div>' +
        '<div class="champ"><label for="z-delai">Délai annoncé</label><input id="z-delai" value="' + esc(z.delai || '') + '"></div>' +
        '<div class="champ"><label for="z-ordre">Ordre</label><input id="z-ordre" inputmode="numeric" value="' + esc(z.ordre) + '"></div></div>' +
        '<label class="case"><input type="checkbox" id="z-actif"' + (z.actif ? ' checked' : '') + '> Proposée aux clients</label>',
      pied: (nouveau ? '' : '<button class="btn danger gauche" type="button" id="z-suppr">Supprimer</button>') + '<button class="btn" type="button" data-fermer>Annuler</button><button class="btn principal" type="submit">Enregistrer</button>',
      apres: function () {
        var s = $('#z-suppr'); if (s) s.onclick = async function () {
          if (!window.confirm('Supprimer la zone « ' + z.nom + ' » ?')) return;
          try { await A.supprimerZone(z.id); fermer(); notif('Zone supprimée'); aller(); } catch (e) { erreurDialogue(e.message); }
        };
      },
      valider: async function (b) {
        var o = { nom: $('#z-nom', b).value.trim(), frais: entier($('#z-frais', b).value), delai: $('#z-delai', b).value.trim() || null, ordre: entier($('#z-ordre', b).value) || 0, actif: $('#z-actif', b).checked };
        if (o.nom.length < 2) throw new Error('Indiquez le nom de la zone.');
        if (o.frais === null || o.frais < 0) throw new Error('Frais invalides.');
        if (!nouveau) o.id = z.id;
        await A.enregistrerZone(o); notif('Zone enregistrée'); aller();
      }
    });
  }

  // ================================================================ CODES PROMO
  async function vuePromos(v) {
    actions('<button class="btn principal" type="button" id="nv-promo">+ Nouveau code</button>');
    $('#nv-promo').onclick = function () { editerPromo(null); };
    var ps = await A.promos();
    function etat(c) {
      var n = Date.now();
      if (!c.actif) return '<span class="pastille p-neutre">Désactivé</span>';
      if (c.fin && new Date(c.fin) <= n) return '<span class="pastille p-neutre">Expiré</span>';
      if (c.debut && new Date(c.debut) > n) return '<span class="pastille p-alerte">Programmé</span>';
      if (c.utilisations_max && c.utilisations >= c.utilisations_max) return '<span class="pastille p-neutre">Épuisé</span>';
      return '<span class="pastille p-ok">Actif</span>';
    }
    v.innerHTML = ps.length ? '<div class="tab-wrap"><table class="tab"><thead><tr><th>Code</th><th>Remise</th><th class="n">Minimum</th><th>Période</th><th class="n">Utilisations</th><th>État</th><th></th></tr></thead><tbody>' + ps.map(function (c, i) {
      return '<tr><td><strong>' + esc(c.code) + '</strong><br><span class="aide">' + esc(c.description || '') + '</span></td><td>' + (c.type === 'pourcentage' ? c.valeur + ' %' : fcfa(c.valeur)) + '</td><td class="n">' + (c.minimum ? fcfa(c.minimum) : '—') + '</td>' +
        '<td>' + (c.debut ? dateFr(c.debut) : 'Dès maintenant') + ' → ' + (c.fin ? dateFr(c.fin) : 'sans fin') + '</td><td class="n">' + c.utilisations + (c.utilisations_max ? ' / ' + c.utilisations_max : '') + '</td><td>' + etat(c) + '</td>' +
        '<td><button class="btn petit" type="button" data-p="' + i + '">Modifier</button></td></tr>';
    }).join('') + '</tbody></table></div>' : '<div class="carte vide">Aucun code promo.</div>';
    $$('[data-p]', v).forEach(function (b) { b.onclick = function () { editerPromo(ps[+b.dataset.p]); }; });
  }
  function editerPromo(c) {
    var nouveau = !c; c = c || { code: '', description: '', type: 'pourcentage', valeur: 10, minimum: 0, actif: true };
    ouvrir({
      titre: nouveau ? 'Nouveau code promo' : 'Code · ' + c.code,
      corps: '<div class="grille-champs"><div class="champ"><label for="cp-code">Code</label><input id="cp-code" value="' + esc(c.code) + '" placeholder="TABASKI2027" autocapitalize="characters"' + (!nouveau && c.utilisations ? ' readonly' : '') + '><p class="aide">Lettres, chiffres, - ou _.</p></div>' +
        '<div class="champ"><label for="cp-type">Type</label><select id="cp-type"><option value="pourcentage"' + (c.type === 'pourcentage' ? ' selected' : '') + '>Pourcentage</option><option value="montant"' + (c.type === 'montant' ? ' selected' : '') + '>Montant en FCFA</option></select></div>' +
        '<div class="champ"><label for="cp-val">Valeur</label><input id="cp-val" inputmode="numeric" value="' + esc(c.valeur) + '"></div>' +
        '<div class="champ"><label for="cp-min">Achat minimum (FCFA)</label><input id="cp-min" inputmode="numeric" value="' + esc(c.minimum) + '"></div></div>' +
        '<div class="champ"><label for="cp-desc">Message affiché au client</label><input id="cp-desc" value="' + esc(c.description || '') + '" placeholder="10 % offerts pour la Tabaski"></div>' +
        '<div class="grille-champs"><div class="champ"><label for="cp-deb">Début</label><input id="cp-deb" type="datetime-local" value="' + versLocal(c.debut) + '"></div>' +
        '<div class="champ"><label for="cp-fin">Fin</label><input id="cp-fin" type="datetime-local" value="' + versLocal(c.fin) + '"></div>' +
        '<div class="champ"><label for="cp-max">Utilisations max.</label><input id="cp-max" inputmode="numeric" value="' + esc(c.utilisations_max || '') + '" placeholder="Illimité"></div></div>' +
        '<label class="case"><input type="checkbox" id="cp-actif"' + (c.actif ? ' checked' : '') + '> Actif</label>',
      pied: (nouveau ? '' : '<button class="btn danger gauche" type="button" id="cp-suppr">Supprimer</button>') + '<button class="btn" type="button" data-fermer>Annuler</button><button class="btn principal" type="submit">Enregistrer</button>',
      apres: function () {
        var s = $('#cp-suppr'); if (s) s.onclick = async function () {
          if (!window.confirm('Supprimer le code ' + c.code + ' ?')) return;
          try { await A.supprimerPromo(c.code); fermer(); notif('Code supprimé'); aller(); } catch (e) { erreurDialogue(e.message); }
        };
      },
      valider: async function (b) {
        var o = {
          code: $('#cp-code', b).value.trim().toUpperCase(), type: $('#cp-type', b).value, valeur: entier($('#cp-val', b).value),
          minimum: entier($('#cp-min', b).value) || 0, description: $('#cp-desc', b).value.trim() || null,
          debut: depuisLocal($('#cp-deb', b).value), fin: depuisLocal($('#cp-fin', b).value),
          utilisations_max: entier($('#cp-max', b).value) || null, actif: $('#cp-actif', b).checked
        };
        if (!/^[A-Z0-9_-]{3,30}$/.test(o.code)) throw new Error('Le code doit faire 3 à 30 caractères : lettres, chiffres, - ou _.');
        if (!o.valeur || o.valeur < 1) throw new Error('Indiquez la valeur de la remise.');
        if (o.type === 'pourcentage' && o.valeur > 90) throw new Error('Un pourcentage ne peut pas dépasser 90 %.');
        if (o.debut && o.fin && o.fin <= o.debut) throw new Error('La date de fin doit être après la date de début.');
        await A.enregistrerPromo(o, nouveau ? null : c.code); notif('Code ' + o.code + ' enregistré'); aller();
      }
    });
  }

  // ================================================================ TÂCHES
  var COLS = [['a_faire', 'À faire'], ['en_cours', 'En cours'], ['fait', 'Fait']];
  async function vueTaches(v) {
    actions('<button class="btn principal" type="button" id="nv-tache">+ Nouvelle tâche</button>');
    $('#nv-tache').onclick = function () { editerTache(null); };
    var ts = await A.taches(), auj = aujourdhui();
    v.innerHTML = '<div class="colonnes">' + COLS.map(function (col, ci) {
      var liste = ts.filter(function (t) { return t.statut === col[0]; });
      return '<div class="colonne"><h2>' + col[1] + '<span>' + liste.length + '</span></h2>' + (liste.length ? liste.map(function (t) {
        var retard = t.echeance && t.echeance < auj && t.statut !== 'fait';
        return '<div class="tache prio-' + t.priorite + '"><div class="t">' + esc(t.titre) + '</div>' + (t.details ? '<div class="aide" style="margin-bottom:6px">' + esc(t.details).slice(0, 140) + '</div>' : '') +
          '<div class="meta">' + (t.echeance ? '<span class="' + (retard ? 'en-retard' : '') + '">' + (retard ? 'En retard · ' : '') + dateFr(t.echeance) + '</span>' : '') +
          (t.assigne_a ? '<span>· ' + esc(t.assigne_a) + '</span>' : '') + (t.commandes ? '<span>· ' + esc(t.commandes.numero) + '</span>' : '') + '</div>' +
          '<div class="actions">' + (ci > 0 ? '<button class="btn petit" type="button" data-mv="' + t.id + '" data-to="' + COLS[ci - 1][0] + '" aria-label="Déplacer vers ' + COLS[ci - 1][1] + '">←</button>' : '') +
          (ci < 2 ? '<button class="btn petit" type="button" data-mv="' + t.id + '" data-to="' + COLS[ci + 1][0] + '" aria-label="Déplacer vers ' + COLS[ci + 1][1] + '">' + (ci === 1 ? 'Terminer ✓' : 'Commencer →') + '</button>' : '') +
          '<button class="btn petit lien" type="button" data-ed="' + t.id + '">Modifier</button></div></div>';
      }).join('') : '<p class="aide" style="padding:6px">Rien ici.</p>') + '</div>';
    }).join('') + '</div>';
    $$('[data-mv]', v).forEach(function (b) {
      b.onclick = async function () {
        var t = ts.filter(function (x) { return String(x.id) === b.dataset.mv; })[0];
        try { await A.enregistrerTache({ id: t.id, titre: t.titre, statut: b.dataset.to }); aller(); } catch (e) { erreur(e); }
      };
    });
    $$('[data-ed]', v).forEach(function (b) { b.onclick = function () { editerTache(ts.filter(function (x) { return String(x.id) === b.dataset.ed; })[0]); }; });
  }
  async function editerTache(t) {
    var nouveau = !t || !t.id; t = t || { titre: '', priorite: 'normale', statut: 'a_faire', echeance: aujourdhui() };
    var cmds = []; try { cmds = (await A.commandes('toutes', '')).slice(0, 60); } catch (e) { /* liste facultative */ }
    ouvrir({
      titre: nouveau ? 'Nouvelle tâche' : 'Modifier la tâche',
      corps: '<div class="champ"><label for="t-titre">Titre</label><input id="t-titre" value="' + esc(t.titre) + '" placeholder="Ex. Préparer les coffrets de la commande"></div>' +
        '<div class="champ"><label for="t-det">Détails</label><textarea id="t-det" rows="3">' + esc(t.details || '') + '</textarea></div>' +
        '<div class="grille-champs"><div class="champ"><label for="t-prio">Priorité</label><select id="t-prio">' + [['haute', 'Haute'], ['normale', 'Normale'], ['basse', 'Basse']].map(function (p) { return '<option value="' + p[0] + '"' + (p[0] === t.priorite ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select></div>' +
        '<div class="champ"><label for="t-ech">Échéance</label><input id="t-ech" type="date" value="' + esc(t.echeance || '') + '"></div>' +
        '<div class="champ"><label for="t-ass">Assignée à</label><input id="t-ass" value="' + esc(t.assigne_a || '') + '" placeholder="Prénom"></div>' +
        '<div class="champ"><label for="t-st">Statut</label><select id="t-st">' + COLS.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === t.statut ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="champ"><label for="t-cmd">Commande liée</label><select id="t-cmd"><option value="">Aucune</option>' + cmds.map(function (c) { return '<option value="' + c.id + '"' + (c.id === t.commande_id ? ' selected' : '') + '>' + esc(c.numero + ' · ' + c.client_nom) + '</option>'; }).join('') + '</select></div>',
      pied: (nouveau ? '' : '<button class="btn danger gauche" type="button" id="t-suppr">Supprimer</button>') + '<button class="btn" type="button" data-fermer>Annuler</button><button class="btn principal" type="submit">Enregistrer</button>',
      apres: function () {
        var s = $('#t-suppr'); if (s) s.onclick = async function () {
          if (!window.confirm('Supprimer cette tâche ?')) return;
          try { await A.supprimerTache(t.id); fermer(); notif('Tâche supprimée'); aller(); } catch (e) { erreurDialogue(e.message); }
        };
      },
      valider: async function (b) {
        var o = { titre: $('#t-titre', b).value.trim(), details: $('#t-det', b).value.trim() || null, priorite: $('#t-prio', b).value, echeance: $('#t-ech', b).value || null, assigne_a: $('#t-ass', b).value.trim() || null, statut: $('#t-st', b).value, commande_id: $('#t-cmd', b).value || null };
        if (o.titre.length < 2) throw new Error('Indiquez un titre.');
        if (!nouveau) o.id = t.id;
        await A.enregistrerTache(o); notif('Tâche enregistrée'); if (courante === 'taches' || courante === 'tableau') aller();
      }
    });
  }

  var VUES = { tableau: vueTableau, commandes: vueCommandes, produits: vueProduits, stock: vueStock, reductions: vueReductions, livraison: vueLivraison, promos: vuePromos, taches: vueTaches };

  // ================================================================ CONNEXION ET DÉMARRAGE
  function afficherApp(moi) {
    $('#ecran-connexion').hidden = true; $('#app').hidden = false;
    $('#deconnexion').title = moi ? 'Connecté : ' + moi.email : '';
    aller(); majCompteur();
  }
  function afficherConnexion() { $('#app').hidden = true; $('#ecran-connexion').hidden = false; }

  document.addEventListener('DOMContentLoaded', async function () {
    lancerDialogue();
    if (!A) {
      afficherConnexion();
      $('#config-manquante').hidden = false;
      $$('#form-connexion input, #form-connexion button').forEach(function (e) { e.disabled = true; });
      return;
    }
    window.addEventListener('hashchange', function () { if (!$('#app').hidden) aller(); });
    $('#form-connexion').addEventListener('submit', async function (e) {
      e.preventDefault();
      var err = $('#erreur-connexion'), btn = e.target.querySelector('[type=submit]');
      err.hidden = true; btn.disabled = true; btn.textContent = 'Connexion…';
      try { afficherApp(await A.connexion($('#email').value.trim(), $('#mdp').value)); }
      catch (x) { err.textContent = x.message; err.hidden = false; }
      finally { btn.disabled = false; btn.textContent = 'Se connecter'; }
    });
    $('#mdp-oublie').onclick = async function () {
      var em = $('#email').value.trim(), err = $('#erreur-connexion');
      if (!/^\S+@\S+\.\S+$/.test(em)) { err.textContent = 'Saisissez d’abord votre adresse e-mail ci-dessus.'; err.hidden = false; return; }
      try { await A.motDePasseOublie(em); err.hidden = true; notif('E-mail de réinitialisation envoyé à ' + em); } catch (x) { err.textContent = x.message; err.hidden = false; }
    };
    $('#deconnexion').onclick = async function () { await A.deconnexion(); afficherConnexion(); };
    A.surAuth(function (evt) {
      if (evt === 'PASSWORD_RECOVERY') {
        ouvrir({
          titre: 'Nouveau mot de passe', bouton: 'Valider',
          corps: '<div class="champ"><label for="n-mdp">Nouveau mot de passe (8 caractères minimum)</label><input id="n-mdp" type="password" autocomplete="new-password"></div>',
          valider: async function (b) { var m = $('#n-mdp', b).value; if (m.length < 8) throw new Error('8 caractères minimum.'); await A.nouveauMotDePasse(m); notif('Mot de passe modifié'); }
        });
      }
    });
    try { var moi = await A.session(); if (moi) afficherApp(moi); else afficherConnexion(); }
    catch (x) { afficherConnexion(); var err = $('#erreur-connexion'); err.textContent = x.message; err.hidden = false; }
    setInterval(function () { if (!$('#app').hidden && !document.hidden) majCompteur(); }, 60000);
  });
})();
