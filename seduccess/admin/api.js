/* Seduccess — accès aux données (Supabase) pour l'espace d'administration.
   Toutes les fonctions renvoient une promesse et lèvent une Error avec un message en français. */
(function () {
  'use strict';
  var cfg = window.SEDUCCESS_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) { window.API = null; return; }
  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true } });

  function ok(res) {
    if (res.error) {
      var m = res.error.message || 'Erreur inconnue';
      if (/Invalid login credentials/i.test(m)) m = 'E-mail ou mot de passe incorrect.';
      else if (/Failed to fetch|NetworkError/i.test(m)) m = 'Connexion impossible. Vérifiez votre accès internet.';
      else if (/violates foreign key/i.test(m)) m = 'Impossible : cet élément est utilisé par des commandes. Désactivez-le plutôt.';
      else if (/duplicate key/i.test(m)) m = 'Cet élément existe déjà.';
      else if (/check constraint/i.test(m)) m = 'Une valeur n’est pas acceptée (vérifiez les prix, quantités et codes).';
      throw new Error(m);
    }
    return res.data;
  }
  async function verifierEquipe() {
    var u = ok(await sb.auth.getUser()).user;
    if (!u) return null;
    var lignes = ok(await sb.from('admins').select('nom, role').eq('user_id', u.id));
    if (!lignes.length) { await sb.auth.signOut(); throw new Error('Ce compte n’a pas accès à l’administration.'); }
    return { email: u.email, nom: lignes[0].nom || u.email, role: lignes[0].role };
  }

  window.API = {
    // ---- connexion ----
    session: async function () { var s = ok(await sb.auth.getSession()).session; return s ? verifierEquipe() : null; },
    connexion: async function (email, mdp) { ok(await sb.auth.signInWithPassword({ email: email, password: mdp })); return verifierEquipe(); },
    deconnexion: async function () { await sb.auth.signOut(); },
    motDePasseOublie: async function (email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] })); },
    nouveauMotDePasse: async function (mdp) { ok(await sb.auth.updateUser({ password: mdp })); },
    surAuth: function (fn) { sb.auth.onAuthStateChange(function (evt) { fn(evt); }); },

    // ---- tableau de bord ----
    tableau: async function (jours) { return ok(await sb.rpc('tableau_de_bord', { p_jours: jours })); },

    // ---- commandes ----
    commandes: async function (statut, recherche) {
      var q = sb.from('commandes').select('*, lignes_commande(*), zones_livraison(nom)').order('cree_le', { ascending: false }).limit(300);
      if (statut && statut !== 'toutes') q = q.eq('statut', statut);
      if (recherche) { var r = recherche.replace(/[%,()]/g, ' ').trim(); q = q.or('numero.ilike.%' + r + '%,client_nom.ilike.%' + r + '%,client_tel.ilike.%' + r + '%'); }
      return ok(await q);
    },
    compterCommandes: async function () { return ok(await sb.from('commandes').select('statut')); },
    commande: async function (id) { return ok(await sb.from('commandes').select('*, lignes_commande(*), historique_commande(*), zones_livraison(nom)').eq('id', id).single()); },
    majCommande: async function (id, patch) { return ok(await sb.from('commandes').update(patch).eq('id', id).select().single()); },

    // ---- produits et formats ----
    produits: async function () { return ok(await sb.from('produits').select('*, formats(*)').order('ordre').order('nom')); },
    enregistrerProduit: async function (p, formats, supprimes) {
      ok(await sb.from('produits').upsert(p));
      for (var i = 0; i < formats.length; i++) {
        var f = Object.assign({}, formats[i], { produit_id: p.id, ordre: i + 1 });
        if (!f.id) delete f.id;
        ok(await sb.from('formats').upsert(f));
      }
      if (supprimes && supprimes.length) ok(await sb.from('formats').delete().in('id', supprimes));
    },
    majProduit: async function (id, patch) { return ok(await sb.from('produits').update(patch).eq('id', id)); },
    supprimerProduit: async function (id) { return ok(await sb.from('produits').delete().eq('id', id)); },
    envoyerImage: async function (fichier) {
      var ext = (fichier.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      var chemin = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      ok(await sb.storage.from('produits').upload(chemin, fichier, { cacheControl: '31536000', upsert: false, contentType: fichier.type }));
      return sb.storage.from('produits').getPublicUrl(chemin).data.publicUrl;
    },

    // ---- stock et réductions ----
    majFormat: async function (id, patch) { return ok(await sb.from('formats').update(patch).eq('id', id)); },
    ajusterStock: async function (formatId, delta, motif, note) { return ok(await sb.rpc('ajuster_stock', { p_format: formatId, p_delta: delta, p_motif: motif, p_note: note || null })); },
    mouvements: async function () { return ok(await sb.from('mouvements_stock').select('*, formats(nom, produits(nom))').order('cree_le', { ascending: false }).limit(40)); },

    // ---- livraison ----
    zones: async function () { return ok(await sb.from('zones_livraison').select('*').order('ordre').order('nom')); },
    enregistrerZone: async function (z) { return ok(await sb.from('zones_livraison').upsert(z)); },
    supprimerZone: async function (id) { return ok(await sb.from('zones_livraison').delete().eq('id', id)); },

    // ---- codes promo ----
    promos: async function () { return ok(await sb.from('codes_promo').select('*').order('cree_le', { ascending: false })); },
    enregistrerPromo: async function (c, ancien) {
      if (ancien && ancien !== c.code) return ok(await sb.from('codes_promo').update(c).eq('code', ancien));
      return ok(await sb.from('codes_promo').upsert(c));
    },
    supprimerPromo: async function (code) { return ok(await sb.from('codes_promo').delete().eq('code', code)); },

    // ---- tâches ----
    taches: async function () { return ok(await sb.from('taches').select('*, commandes(numero)').order('echeance', { ascending: true, nullsFirst: false }).order('cree_le', { ascending: false })); },
    enregistrerTache: async function (t) { return ok(await sb.from('taches').upsert(t)); },
    supprimerTache: async function (id) { return ok(await sb.from('taches').delete().eq('id', id)); }
  };
})();
