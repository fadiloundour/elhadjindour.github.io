# Seduccess — mise en service du backend (Supabase)

Ce guide relie la boutique à une vraie base de données et ouvre l’espace d’administration.
Comptez **20 minutes**. Tout est gratuit pour démarrer.

| Ce qui est prêt dans le dépôt | Où |
|---|---|
| Base de données complète (tables, sécurité, calculs) | `seduccess/backend/schema.sql` |
| Espace d’administration | `seduccess/admin/` → en ligne à l’adresse `…/seduccess/admin/` |
| Boutique branchée sur la base | `seduccess/assets/js/app.js` (s’active dès que l’étape 3 est faite) |
| Réglage de connexion (à remplir) | `seduccess/assets/js/config.js` |

Tant que l’étape 3 n’est pas faite, la boutique continue de fonctionner comme aujourd’hui (commande par WhatsApp, prix du site).

---

## Étape 1 — Créer le projet Supabase (5 min)

1. Allez sur **https://supabase.com** → **Start your project** → connectez-vous avec votre compte GitHub (`fadiloundour`).
2. Cliquez **New project** et remplissez :
   - **Name** : `seduccess`
   - **Database Password** : cliquez **Generate a password**, puis **copiez-le et gardez-le** (gestionnaire de mots de passe).
   - **Region** : `West EU (Paris)` — la plus proche de Dakar.
3. Cliquez **Create new project** et attendez 1 à 2 minutes.

## Étape 2 — Installer la base de données (3 min)

1. Ouvrez ce fichier et copiez **tout** son contenu :
   `https://github.com/fadiloundour/elhadjindour.github.io/blob/main/seduccess/backend/schema.sql` → bouton **Copy raw file** (icône de copie en haut à droite).
2. Dans Supabase, menu de gauche : **SQL Editor** → **New query**.
3. Collez, puis cliquez **Run** (ou `Ctrl` + `Entrée`).
4. Résultat attendu en bas : **Success. No rows returned**.

Le script crée les tables, la sécurité, les 4 produits avec leurs prix et stocks, 4 zones de livraison et le code promo `BIENVENUE10`.
Il peut être relancé sans risque (il ne supprime rien).

## Étape 3 — Relier la boutique (3 min)

1. Dans Supabase : **Project Settings** (roue dentée) → **Data API** (ou **API**). Copiez :
   - **Project URL** — ressemble à `https://abcdefghijkl.supabase.co`
   - la clé **anon public** (onglet **API Keys** → *Legacy API keys* si besoin) — une longue chaîne qui commence par `eyJ…`
     *Ne copiez jamais la clé `service_role` : elle doit rester secrète.*
2. Sur GitHub, ouvrez `seduccess/assets/js/config.js` → icône **crayon** (Edit this file).
3. Remplacez les deux lignes par vos valeurs :

```js
window.SEDUCCESS_CONFIG = {
  supabaseUrl: 'https://VOTRE-PROJET.supabase.co',
  supabaseAnonKey: 'eyJ...VOTRE-CLE-ANON...'
};
```

4. **Commit changes**. Après 1 à 2 minutes, la boutique lit les prix et le stock dans la base.

> La clé *anon public* est faite pour être visible : la base refuse toute lecture ou modification directe venant des visiteurs. Ils ne peuvent que consulter le catalogue et passer commande.

## Étape 4 — Créer le compte de la propriétaire (4 min)

1. **Authentication** → **Sign In / Providers** (ou **Providers** → **Email**) → désactivez **Allow new users to sign up** → **Save**.
   (Ainsi personne ne peut se créer un compte tout seul.)
2. **Authentication** → **Users** → **Add user** → **Create new user** :
   - e-mail de Ndeye Sadio Ndour, un mot de passe solide (12 caractères ou plus),
   - cochez **Auto Confirm User** → **Create user**.
3. **SQL Editor** → **New query**, collez en remplaçant l’e-mail, puis **Run** :

```sql
insert into public.admins (user_id, nom, role)
select id, 'Ndeye Sadio Ndour', 'proprietaire' from auth.users where email = 'EMAIL-DE-NDEYE@exemple.com';
```

   Résultat attendu : **Success. 1 row affected** (si c’est `0 rows`, l’e-mail ne correspond pas exactement).
4. **Authentication** → **URL Configuration** → **Site URL** :
   `https://fadiloundour.github.io/elhadjindour.github.io/seduccess/admin/` → **Save**
   (sert au lien « Mot de passe oublié »).

## Étape 5 — Se connecter

Ouvrez **https://fadiloundour.github.io/elhadjindour.github.io/seduccess/admin/** et connectez-vous.
Ajoutez cette page à l’écran d’accueil du téléphone (Safari : Partager → *Sur l’écran d’accueil* ; Chrome : ⋮ → *Ajouter à l’écran d’accueil*).

### Ajouter un membre de l’équipe
Même chose qu’à l’étape 4 (points 2 et 3), avec `'equipe'` au lieu de `'proprietaire'` :

```sql
insert into public.admins (user_id, nom, role)
select id, 'Prénom Nom', 'equipe' from auth.users where email = 'email@exemple.com';
```

Pour retirer l’accès : **Authentication → Users** → le compte → **Delete user**.

---

## Ce que fait chaque section

| Section | À quoi elle sert |
|---|---|
| **Tableau de bord** | Chiffre d’affaires, commandes, panier moyen, ventes par jour (7, 30 ou 90 jours), meilleures ventes, moyens de paiement, stock à surveiller, tâches du jour. |
| **Commandes** | Chaque commande du site arrive ici avec un numéro (ex. `SDC-261102-0001`). Filtres par statut, recherche par numéro, nom ou téléphone. Dans la fiche : appeler ou écrire au client sur WhatsApp, changer le statut (Nouvelle → Confirmée → Payée → En livraison → Livrée), le paiement, le livreur, une note interne, l’historique. **Annuler une commande remet automatiquement les articles en stock.** |
| **Produits** | Créer, modifier, masquer ou supprimer un produit : nom, catégorie, description, notes olfactives, composants, utilisation, précautions, photos (envoyées depuis le téléphone), formats et prix. |
| **Stock** | Stock de chaque format, alertes (stock bas, épuisé), réassort ou correction avec note, historique des mouvements (ventes, réassorts, annulations). Le stock baisse tout seul à chaque commande. |
| **Réductions** | Prix barré sur un format, en pourcentage ou en nouveau prix, avec dates de début et de fin (ex. Tabaski, Korité, Saint-Valentin). |
| **Livraison** | Les livraisons à faire (boutons *En livraison* / *Livrée*), les zones et leurs frais. Le client choisit sa zone au moment de commander, les frais s’ajoutent au total. |
| **Codes promo** | Codes en % ou en FCFA, minimum d’achat, dates, nombre d’utilisations maximum. Le client saisit le code dans son panier. |
| **Tâches** | Liste de l’équipe en 3 colonnes (À faire, En cours, Fait), priorité, échéance, personne assignée, lien vers une commande. |

## Comment une commande circule

1. Le client remplit son panier, choisit sa zone, son moyen de paiement (Wave, Orange Money, Free Money, Visa) et, s’il en a un, un code promo.
2. La base **vérifie et calcule tout elle-même** : prix réels, réductions, code promo, frais de livraison, stock disponible. Un client ne peut pas modifier un prix depuis son navigateur.
3. La commande est enregistrée, le stock baisse, puis WhatsApp s’ouvre avec le numéro de commande et le total à payer.
4. Vous confirmez sur WhatsApp, envoyez le numéro Wave / Orange Money / Free Money ou le lien de paiement Visa, puis passez la commande à **Payée** dans l’administration.

> Le site n’encaisse pas l’argent lui-même. Pour un paiement automatique en ligne, il faudra plus tard un prestataire (PayDunya, CinetPay, Wave Business…) : la base est déjà prête à recevoir le statut « payé ».

## Bon à savoir

- **Projet gratuit et mise en pause** : Supabase met en pause un projet gratuit qui a très peu d’activité sur 7 jours. Les visites de la boutique et l’usage de l’administration comptent comme activité. S’il est en pause : tableau de bord Supabase → le projet → **Resume project** (les données sont conservées).
- **Sauvegardes** : sur le plan gratuit, exportez de temps en temps vos commandes : **Table Editor** → `commandes` → **Export to CSV**.
- **Modifier la base plus tard** : relancer `schema.sql` est sans danger ; il n’efface pas les données.
