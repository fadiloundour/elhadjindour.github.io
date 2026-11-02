-- =====================================================================
--  SEDUCCESS — base de données de la boutique (Supabase / PostgreSQL)
--  À coller en entier dans Supabase › SQL Editor › New query › Run.
--  Le script peut être relancé : il ne casse pas les données existantes.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Équipe d'administration
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  nom       text,
  role      text not null default 'equipe' check (role in ('proprietaire', 'equipe')),
  cree_le   timestamptz not null default now()
);

create or replace function public.est_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- mise à jour automatique de la colonne maj_le
create or replace function public.touche_maj()
returns trigger language plpgsql as $$
begin new.maj_le := now(); return new; end $$;

-- ---------------------------------------------------------------------
-- 2. Catalogue : produits et formats (prix, réductions, stock)
-- ---------------------------------------------------------------------
create table if not exists public.produits (
  id          text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  nom         text not null,
  categorie   text not null check (categorie in ('thiouraye', 'huiles', 'parfums', 'recharges', 'accessoires')),
  accroche    text,
  description text,
  notes       jsonb not null default '[]'::jsonb,   -- [["Tête","Gowé poivré"], ...]
  composants  text[] not null default '{}',
  usage       text,
  precautions text,
  image       text,                                 -- nom d'image du site (ex. produit-thiouraye) ou adresse https
  galerie     jsonb not null default '[]'::jsonb,   -- [["produit-thiouraye","Texte alternatif"], ...]
  visible     boolean not null default true,
  ordre       int not null default 0,
  cree_le     timestamptz not null default now(),
  maj_le      timestamptz not null default now()
);

create table if not exists public.formats (
  id           uuid primary key default gen_random_uuid(),
  produit_id   text not null references public.produits(id) on delete cascade,
  nom          text not null,
  note         text,
  prix         int  not null check (prix >= 0),
  prix_promo   int  check (prix_promo is null or (prix_promo >= 0 and prix_promo < prix)),  -- réduction
  promo_debut  timestamptz,
  promo_fin    timestamptz,
  stock        int  not null default 0 check (stock >= 0),
  seuil_alerte int  not null default 5 check (seuil_alerte >= 0),
  actif        boolean not null default true,
  ordre        int  not null default 0,
  maj_le       timestamptz not null default now(),
  unique (produit_id, nom)
);
create index if not exists formats_produit_idx on public.formats(produit_id);

create table if not exists public.mouvements_stock (
  id          bigserial primary key,
  format_id   uuid not null references public.formats(id) on delete cascade,
  delta       int  not null,
  motif       text not null check (motif in ('vente', 'reassort', 'correction', 'annulation')),
  commande_id uuid,
  note        text,
  par         uuid default auth.uid(),
  cree_le     timestamptz not null default now()
);
create index if not exists mouvements_format_idx on public.mouvements_stock(format_id, cree_le desc);

-- prix réellement appliqué (réduction active ou prix normal)
create or replace function public.prix_effectif(f public.formats)
returns int language sql stable as $$
  select case
    when f.prix_promo is not null
     and (f.promo_debut is null or f.promo_debut <= now())
     and (f.promo_fin   is null or f.promo_fin   >  now())
    then f.prix_promo else f.prix end;
$$;

-- ---------------------------------------------------------------------
-- 3. Livraison
-- ---------------------------------------------------------------------
create table if not exists public.zones_livraison (
  id     serial primary key,
  nom    text not null unique,
  frais  int  not null default 0 check (frais >= 0),
  delai  text,
  actif  boolean not null default true,
  ordre  int not null default 0
);

-- ---------------------------------------------------------------------
-- 4. Codes promo
-- ---------------------------------------------------------------------
create table if not exists public.codes_promo (
  code             text primary key check (code ~ '^[A-Z0-9_-]{3,30}$'),
  description      text,
  type             text not null check (type in ('pourcentage', 'montant')),
  valeur           int  not null check (valeur > 0),
  minimum          int  not null default 0 check (minimum >= 0),
  debut            timestamptz,
  fin              timestamptz,
  utilisations_max int  check (utilisations_max is null or utilisations_max > 0),
  utilisations     int  not null default 0,
  actif            boolean not null default true,
  cree_le          timestamptz not null default now(),
  check (type <> 'pourcentage' or valeur <= 90)
);

-- ---------------------------------------------------------------------
-- 5. Commandes
-- ---------------------------------------------------------------------
do $$ begin
  create type public.statut_commande as enum ('nouvelle', 'confirmee', 'payee', 'en_livraison', 'livree', 'annulee');
exception when duplicate_object then null; end $$;

create sequence if not exists public.commande_seq;

create table if not exists public.commandes (
  id               uuid primary key default gen_random_uuid(),
  numero           text not null unique default ('SDC-' || to_char(now() at time zone 'Africa/Dakar', 'YYMMDD') || '-' || lpad(nextval('public.commande_seq')::text, 4, '0')),
  client_nom       text not null check (length(client_nom) between 2 and 80),
  client_tel       text not null check (client_tel ~ '^\+?[0-9 ]{8,20}$'),
  adresse          text check (adresse is null or length(adresse) <= 300),
  mode             text not null check (mode in ('livraison', 'retrait')),
  zone_id          int references public.zones_livraison(id),
  frais_livraison  int not null default 0,
  paiement         text not null check (paiement in ('Wave', 'Orange Money', 'Free Money', 'Carte Visa')),
  paiement_statut  text not null default 'en_attente' check (paiement_statut in ('en_attente', 'paye', 'rembourse')),
  code_promo       text references public.codes_promo(code) on update cascade,
  remise           int not null default 0,
  sous_total       int not null default 0,
  total            int not null default 0,
  statut           public.statut_commande not null default 'nouvelle',
  livreur          text,
  note_client      text check (note_client is null or length(note_client) <= 500),
  note_interne     text,
  stock_rendu      boolean not null default false,
  cree_le          timestamptz not null default now(),
  maj_le           timestamptz not null default now()
);
create index if not exists commandes_statut_idx on public.commandes(statut, cree_le desc);

create table if not exists public.lignes_commande (
  id             bigserial primary key,
  commande_id    uuid not null references public.commandes(id) on delete cascade,
  format_id      uuid references public.formats(id) on delete set null,
  produit_id     text,
  produit_nom    text not null,
  format_nom     text not null,
  prix_unitaire  int  not null,
  quantite       int  not null check (quantite between 1 and 50),
  total          int  not null
);
create index if not exists lignes_commande_idx on public.lignes_commande(commande_id);

create table if not exists public.historique_commande (
  id          bigserial primary key,
  commande_id uuid not null references public.commandes(id) on delete cascade,
  statut      public.statut_commande not null,
  note        text,
  par         uuid default auth.uid(),
  cree_le     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. Tâches de l'équipe
-- ---------------------------------------------------------------------
create table if not exists public.taches (
  id          bigserial primary key,
  titre       text not null check (length(titre) between 2 and 160),
  details     text,
  statut      text not null default 'a_faire' check (statut in ('a_faire', 'en_cours', 'fait')),
  priorite    text not null default 'normale' check (priorite in ('basse', 'normale', 'haute')),
  echeance    date,
  assigne_a   text,
  commande_id uuid references public.commandes(id) on delete set null,
  cree_le     timestamptz not null default now(),
  maj_le      timestamptz not null default now()
);

-- déclencheurs maj_le
drop trigger if exists t_maj on public.produits;   create trigger t_maj before update on public.produits  for each row execute function public.touche_maj();
drop trigger if exists t_maj on public.formats;    create trigger t_maj before update on public.formats   for each row execute function public.touche_maj();
drop trigger if exists t_maj on public.commandes;  create trigger t_maj before update on public.commandes for each row execute function public.touche_maj();
drop trigger if exists t_maj on public.taches;     create trigger t_maj before update on public.taches    for each row execute function public.touche_maj();

-- ---------------------------------------------------------------------
-- 7. Règles automatiques sur les commandes
--    - historique à chaque changement de statut
--    - annulation : le stock revient (une seule fois)
--    - « payée » : le paiement passe à « payé »
-- ---------------------------------------------------------------------
create or replace function public.suivi_commande()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into historique_commande(commande_id, statut, note) values (new.id, new.statut, 'Commande reçue');
    return new;
  end if;
  if new.statut is distinct from old.statut then
    insert into historique_commande(commande_id, statut) values (new.id, new.statut);
    if new.statut = 'payee' and new.paiement_statut = 'en_attente' then
      new.paiement_statut := 'paye';
    end if;
    if new.statut = 'annulee' and not old.stock_rendu then
      update formats f set stock = f.stock + l.quantite
        from lignes_commande l where l.commande_id = new.id and l.format_id = f.id;
      insert into mouvements_stock(format_id, delta, motif, commande_id)
        select l.format_id, l.quantite, 'annulation', new.id from lignes_commande l
        where l.commande_id = new.id and l.format_id is not null;
      new.stock_rendu := true;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists t_suivi_ins on public.commandes;
create trigger t_suivi_ins after insert on public.commandes for each row execute function public.suivi_commande();
drop trigger if exists t_suivi_upd on public.commandes;
create trigger t_suivi_upd before update on public.commandes for each row execute function public.suivi_commande();

-- ---------------------------------------------------------------------
-- 8. Fonctions publiques (utilisées par la boutique)
-- ---------------------------------------------------------------------

-- Catalogue visible, avec prix réduits et disponibilité
create or replace function public.catalogue_public()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'produits', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'cat', p.categorie, 'nom', p.nom, 'accroche', p.accroche, 'description', p.description,
        'notes', p.notes, 'composants', to_jsonb(p.composants), 'usage', p.usage, 'precautions', p.precautions,
        'image', p.image, 'galerie', p.galerie,
        'formats', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', f.id, 'nom', f.nom, 'note', f.note,
            'prix', prix_effectif(f),
            'prix_barre', case when prix_effectif(f) < f.prix then f.prix end,
            'disponible', f.stock > 0,
            'stock_faible', f.stock > 0 and f.stock <= f.seuil_alerte
          ) order by f.ordre, f.prix)
          from formats f where f.produit_id = p.id and f.actif), '[]'::jsonb)
      ) order by p.ordre, p.nom)
      from produits p where p.visible), '[]'::jsonb),
    'zones', coalesce((
      select jsonb_agg(jsonb_build_object('id', z.id, 'nom', z.nom, 'frais', z.frais, 'delai', z.delai) order by z.ordre, z.nom)
      from zones_livraison z where z.actif), '[]'::jsonb)
  );
$$;

-- Calcul de la remise d'un code promo (sans le consommer)
create or replace function public.verifier_code_promo(p_code text, p_sous_total int)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c codes_promo; r int;
begin
  select * into c from codes_promo where code = upper(trim(p_code));
  if not found or not c.actif then return jsonb_build_object('valide', false, 'message', 'Ce code n’existe pas.'); end if;
  if c.debut is not null and c.debut > now() then return jsonb_build_object('valide', false, 'message', 'Ce code n’est pas encore actif.'); end if;
  if c.fin is not null and c.fin <= now() then return jsonb_build_object('valide', false, 'message', 'Ce code a expiré.'); end if;
  if c.utilisations_max is not null and c.utilisations >= c.utilisations_max then return jsonb_build_object('valide', false, 'message', 'Ce code a atteint sa limite d’utilisation.'); end if;
  if p_sous_total < c.minimum then return jsonb_build_object('valide', false, 'message', 'Ce code demande un minimum de ' || c.minimum || ' FCFA d’achat.'); end if;
  r := case when c.type = 'pourcentage' then (p_sous_total * c.valeur) / 100 else least(c.valeur, p_sous_total) end;
  return jsonb_build_object('valide', true, 'code', c.code, 'remise', r, 'message', coalesce(c.description, 'Code appliqué'));
end $$;

-- Enregistrement d'une commande : prix, stock, promo et livraison calculés côté serveur
create or replace function public.passer_commande(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_mode text := p->>'mode';
  v_zone zones_livraison;
  v_frais int := 0;
  v_sous int := 0;
  v_remise int := 0;
  v_code text := nullif(upper(trim(coalesce(p->>'code_promo', ''))), '');
  v_promo jsonb;
  v_cmd commandes;
  l jsonb;
  f formats;
  pr produits;
  q int;
  v_lignes jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p->'lignes') <> 'array' or jsonb_array_length(p->'lignes') = 0 then
    raise exception 'Votre sac est vide.' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p->>'nom', ''))) < 2 then
    raise exception 'Indiquez votre nom.' using errcode = 'P0001';
  end if;
  if coalesce(p->>'tel', '') !~ '^\+?[0-9 ]{8,20}$' then
    raise exception 'Indiquez un numéro de téléphone valide.' using errcode = 'P0001';
  end if;
  if coalesce(p->>'paiement', '') not in ('Wave', 'Orange Money', 'Free Money', 'Carte Visa') then
    raise exception 'Choisissez un moyen de paiement.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p->'lignes') > 20 then
    raise exception 'Trop d’articles différents dans une seule commande.' using errcode = 'P0001';
  end if;
  if v_mode = 'livraison' then
    select * into v_zone from zones_livraison where id = (p->>'zone_id')::int and actif;
    if not found then raise exception 'Choisissez votre zone de livraison.' using errcode = 'P0001'; end if;
    if coalesce(trim(p->>'adresse'), '') = '' then raise exception 'Indiquez votre adresse de livraison.' using errcode = 'P0001'; end if;
    v_frais := v_zone.frais;
  elsif v_mode <> 'retrait' or v_mode is null then
    raise exception 'Mode de réception inconnu.' using errcode = 'P0001';
  end if;

  -- vérifie chaque ligne et réserve le stock (verrou pour éviter les ventes en double)
  for l in select * from jsonb_array_elements(p->'lignes') loop
    q := (l->>'quantite')::int;
    if q is null or q < 1 or q > 20 then raise exception 'Quantité invalide.' using errcode = 'P0001'; end if;
    select * into f from formats where id = (l->>'format_id')::uuid and actif for update;
    if not found then raise exception 'Un article de votre sac n’est plus disponible.' using errcode = 'P0001'; end if;
    select * into pr from produits where id = f.produit_id and visible;
    if not found then raise exception 'Un article de votre sac n’est plus disponible.' using errcode = 'P0001'; end if;
    if f.stock < q then
      raise exception '% (%) : il ne reste que % en stock.', pr.nom, f.nom, f.stock using errcode = 'P0001';
    end if;
    v_sous := v_sous + prix_effectif(f) * q;
    v_lignes := v_lignes || jsonb_build_object('format_id', f.id, 'produit_id', pr.id, 'produit_nom', pr.nom, 'format_nom', f.nom, 'prix', prix_effectif(f), 'quantite', q);
  end loop;

  if v_code is not null then
    v_promo := verifier_code_promo(v_code, v_sous);
    if not (v_promo->>'valide')::boolean then raise exception '%', v_promo->>'message' using errcode = 'P0001'; end if;
    v_remise := (v_promo->>'remise')::int;
    update codes_promo set utilisations = utilisations + 1 where code = v_code;
  end if;

  insert into commandes(client_nom, client_tel, adresse, mode, zone_id, frais_livraison, paiement, code_promo, remise, sous_total, total, note_client)
  values (trim(p->>'nom'), trim(p->>'tel'), nullif(trim(coalesce(p->>'adresse', '')), ''), v_mode,
          case when v_mode = 'livraison' then v_zone.id end, v_frais, p->>'paiement', v_code, v_remise,
          v_sous, v_sous - v_remise + v_frais, nullif(trim(coalesce(p->>'note', '')), ''))
  returning * into v_cmd;

  for l in select * from jsonb_array_elements(v_lignes) loop
    insert into lignes_commande(commande_id, format_id, produit_id, produit_nom, format_nom, prix_unitaire, quantite, total)
    values (v_cmd.id, (l->>'format_id')::uuid, l->>'produit_id', l->>'produit_nom', l->>'format_nom', (l->>'prix')::int, (l->>'quantite')::int, (l->>'prix')::int * (l->>'quantite')::int);
    update formats set stock = stock - (l->>'quantite')::int where id = (l->>'format_id')::uuid;
    insert into mouvements_stock(format_id, delta, motif, commande_id) values ((l->>'format_id')::uuid, -(l->>'quantite')::int, 'vente', v_cmd.id);
  end loop;

  return jsonb_build_object('numero', v_cmd.numero, 'sous_total', v_sous, 'remise', v_remise, 'frais', v_frais, 'total', v_cmd.total,
                            'zone', case when v_mode = 'livraison' then v_zone.nom end);
end $$;

-- ---------------------------------------------------------------------
-- 9. Fonctions réservées à l'équipe
-- ---------------------------------------------------------------------
create or replace function public.ajuster_stock(p_format uuid, p_delta int, p_motif text, p_note text default null)
returns int language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if not est_admin() then raise exception 'Accès réservé à l’équipe.' using errcode = '42501'; end if;
  if p_motif not in ('reassort', 'correction') then raise exception 'Motif invalide.'; end if;
  update formats set stock = stock + p_delta where id = p_format returning stock into v;
  if v is null then raise exception 'Format introuvable.'; end if;
  insert into mouvements_stock(format_id, delta, motif, note) values (p_format, p_delta, p_motif, p_note);
  return v;
exception when check_violation then
  raise exception 'Le stock ne peut pas devenir négatif.' using errcode = 'P0001';
end $$;

create or replace function public.tableau_de_bord(p_jours int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare depuis timestamptz := date_trunc('day', now() at time zone 'Africa/Dakar') at time zone 'Africa/Dakar' - make_interval(days => greatest(p_jours, 1) - 1);
begin
  if not est_admin() then raise exception 'Accès réservé à l’équipe.' using errcode = '42501'; end if;
  return jsonb_build_object(
    'chiffre_affaires', (select coalesce(sum(total), 0) from commandes where statut <> 'annulee' and cree_le >= depuis),
    'commandes',        (select count(*) from commandes where statut <> 'annulee' and cree_le >= depuis),
    'panier_moyen',     (select coalesce(round(avg(total)), 0) from commandes where statut <> 'annulee' and cree_le >= depuis),
    'a_traiter',        (select count(*) from commandes where statut in ('nouvelle', 'confirmee', 'payee', 'en_livraison')),
    'paiements_attente',(select count(*) from commandes where paiement_statut = 'en_attente' and statut <> 'annulee'),
    'clients',          (select count(distinct regexp_replace(client_tel, '\D', '', 'g')) from commandes where statut <> 'annulee'),
    'par_jour', (
      select coalesce(jsonb_agg(jsonb_build_object('jour', j.jour, 'total', j.total, 'nb', j.nb) order by j.jour), '[]'::jsonb) from (
        select to_char(d, 'YYYY-MM-DD') as jour,
               coalesce(sum(c.total) filter (where c.id is not null), 0) as total,
               count(c.id) as nb
        from generate_series(depuis at time zone 'Africa/Dakar', now() at time zone 'Africa/Dakar', interval '1 day') d
        left join commandes c on c.statut <> 'annulee' and (c.cree_le at time zone 'Africa/Dakar')::date = d::date
        group by d) j),
    'top_produits', (
      select coalesce(jsonb_agg(t order by t.quantite desc), '[]'::jsonb) from (
        select l.produit_nom as nom, sum(l.quantite) as quantite, sum(l.total) as total
        from lignes_commande l join commandes c on c.id = l.commande_id
        where c.statut <> 'annulee' and c.cree_le >= depuis
        group by l.produit_nom order by sum(l.quantite) desc limit 5) t),
    'par_paiement', (
      select coalesce(jsonb_object_agg(paiement, n), '{}'::jsonb) from (
        select paiement, count(*) n from commandes where statut <> 'annulee' and cree_le >= depuis group by paiement) x),
    'stock_bas', (
      select coalesce(jsonb_agg(jsonb_build_object('produit', p.nom, 'format', f.nom, 'stock', f.stock, 'seuil', f.seuil_alerte) order by f.stock), '[]'::jsonb)
      from formats f join produits p on p.id = f.produit_id where f.actif and f.stock <= f.seuil_alerte)
  );
end $$;

-- ---------------------------------------------------------------------
-- 10. Sécurité : les visiteurs ne passent que par les fonctions publiques,
--     l'équipe (table admins) a accès à tout.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['admins', 'produits', 'formats', 'mouvements_stock', 'zones_livraison', 'codes_promo', 'commandes', 'lignes_commande', 'historique_commande', 'taches'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists equipe_tout on public.%I', t);
    execute format('create policy equipe_tout on public.%I for all to authenticated using (public.est_admin()) with check (public.est_admin())', t);
  end loop;
end $$;
-- chaque membre peut lire sa propre ligne admin (pour savoir s'il a accès)
drop policy if exists moi on public.admins;
create policy moi on public.admins for select to authenticated using (user_id = auth.uid());

revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.catalogue_public() to anon, authenticated;
grant execute on function public.verifier_code_promo(text, int) to anon, authenticated;
grant execute on function public.passer_commande(jsonb) to anon, authenticated;
grant execute on function public.est_admin() to authenticated;
grant execute on function public.prix_effectif(public.formats) to authenticated;
grant execute on function public.ajuster_stock(uuid, int, text, text) to authenticated;
grant execute on function public.tableau_de_bord(int) to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------
-- 11. Photos des produits (Supabase Storage, dossier public « produits »)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('produits', 'produits', true)
on conflict (id) do nothing;
drop policy if exists produits_lecture on storage.objects;
create policy produits_lecture on storage.objects for select using (bucket_id = 'produits');
drop policy if exists produits_equipe on storage.objects;
create policy produits_equipe on storage.objects for all to authenticated
  using (bucket_id = 'produits' and public.est_admin()) with check (bucket_id = 'produits' and public.est_admin());

-- ---------------------------------------------------------------------
-- 12. Données de départ (uniquement si la boutique est vide)
-- ---------------------------------------------------------------------
insert into public.produits (id, nom, categorie, accroche, description, notes, composants, usage, precautions, image, galerie, ordre) values
('thiouraye', 'Thiouraye au gowé', 'thiouraye', 'Encens parfumé d’exception.',
 'Notre thiouraye signature, préparé selon la tradition sénégalaise et sublimé par le gowé. Posé sur la braise, il libère une fumée boisée, poivrée et légèrement ambrée qui habille la maison, le linge et les tenues pendant des heures.',
 '[["Tête","Gowé poivré"],["Cœur","Bois précieux"],["Fond","Ambre et musc"]]',
 array['Copeaux de bois parfumés','Gowé broyé','Résines naturelles (oliban, myrrhe)','Huiles parfumées','Musc blanc','Sucre de cuisson, pour la fixation traditionnelle'],
 'Déposez quelques morceaux sur un charbon bien incandescent dans l’encensoir. Laissez la fumée se diffuser dans la pièce, puis aérez légèrement.',
 'Ne laissez jamais un encensoir allumé sans surveillance. Tenez hors de portée des enfants. Placez l’encensoir sur un support résistant à la chaleur, loin des tissus.',
 'produit-thiouraye', '[["produit-thiouraye","Pot de thiouraye au gowé et son écrin"],["savoir-melange","Morceaux de thiouraye"],["savoir-braise","Le thiouraye se consume dans un encensoir"],["savoir-matieres","Grains de gowé dans une coupe en bois"]]', 1),
('huile', 'Huile parfumée', 'huiles', 'Concentrée, longue tenue.',
 'L’essence du gowé en huile concentrée. Quelques gouttes suffisent pour parfumer la peau, les cheveux et les vêtements, ou pour raviver un thiouraye. Sa tenue se prolonge toute la journée.',
 '[["Tête","Gowé et épices douces"],["Cœur","Bois de santal"],["Fond","Oud, ambre et musc"]]',
 array['Huile végétale de base','Extrait parfumé de gowé','Notes de bois de santal et d’oud','Ambre','Musc blanc'],
 'Appliquez une à deux gouttes sur les poignets, le cou ou les vêtements. Pour le linge, déposez quelques gouttes sur un tissu avant de le ranger.',
 'Usage externe uniquement. Faites un essai sur une petite zone de peau avant la première utilisation. Évitez le contact avec les yeux. Tenez hors de portée des enfants.',
 'produit-huile', '[["produit-huile","Flacon d’huile parfumée et son écrin"],["resine","Résine ambrée sur un bois sombre"],["savoir-parfum","Volutes de fumée parfumée"],["savoir-matieres","Grains de gowé"]]', 2),
('parfum', 'Parfum d’intérieur', 'parfums', 'Ambiance raffinée et durable.',
 'Le rituel sans braise : une vaporisation, et la pièce s’habille des notes boisées et poivrées du gowé. Idéal pour le salon, la chambre, les rideaux et le linge de maison.',
 '[["Tête","Gowé poivré"],["Cœur","Bois et fleurs blanches"],["Fond","Ambre"]]',
 array['Eau purifiée','Alcool','Composition parfumée gowé, bois et ambre','Fixateur de parfum'],
 'Vaporisez deux à trois fois dans l’air, ou à 30 cm des rideaux et du linge. Agitez avant emploi.',
 'Produit inflammable : ne vaporisez pas près d’une flamme ou d’un encensoir allumé. Ne vaporisez pas directement sur la peau. Ne pas ingérer. Tenez hors de portée des enfants.',
 'produit-parfum', '[["produit-parfum","Parfum d’intérieur et son écrin"],["savoir-parfum","Volutes de fumée parfumée"],["savoir-braise","Un encensoir allumé"],["resine","Résine ambrée"]]', 3),
('recharge', 'Recharge gowé · thiouraye', 'recharges', 'Encens naturel de qualité pour diffusion.',
 'Le même thiouraye au gowé, en grand format. Pour remplir votre pot signature ou parfumer les grandes occasions : baptêmes, mariages, réceptions. Le sachet refermable préserve le parfum.',
 '[["Tête","Gowé poivré"],["Cœur","Bois précieux"],["Fond","Ambre et musc"]]',
 array['Copeaux de bois parfumés','Gowé broyé','Résines naturelles (oliban, myrrhe)','Huiles parfumées','Musc blanc','Sucre de cuisson, pour la fixation traditionnelle'],
 'Refermez bien le sachet après chaque utilisation et conservez-le à l’abri de la chaleur et de la lumière. Utilisez comme le thiouraye en pot.',
 'Ne laissez jamais un encensoir allumé sans surveillance. Tenez hors de portée des enfants.',
 'produit-recharge', '[["produit-recharge","Sachet recharge 1 kg"],["savoir-melange","Morceaux de thiouraye"],["savoir-matieres","Grains de gowé"],["savoir-braise","Un encensoir allumé"]]', 4)
on conflict (id) do nothing;

insert into public.formats (produit_id, nom, note, prix, stock, seuil_alerte, ordre) values
('thiouraye', 'Pot · 500 g', 'Le pot signature, en écrin', 22000, 20, 5, 1),
('huile', 'Flacon · 100 ml', 'Compte-gouttes doré', 12500, 30, 5, 1),
('parfum', '250 ml', 'Pour une pièce', 6500, 40, 8, 1),
('parfum', '500 ml', 'Pour toute la maison', 14000, 25, 5, 2),
('recharge', 'Sachet rechargeable · 1 kg', 'Le grand format', 35000, 10, 3, 1)
on conflict (produit_id, nom) do nothing;

insert into public.zones_livraison (nom, frais, delai, ordre) values
('Golf Cambérène et environs', 1000, 'Le jour même', 1),
('Dakar centre et Plateau', 2000, '24 h', 2),
('Parcelles, Guédiawaye, Pikine', 1500, '24 h', 3),
('Rufisque, Keur Massar, Diamniadio', 3000, '24 à 48 h', 4)
on conflict (nom) do nothing;

insert into public.codes_promo (code, description, type, valeur, minimum, actif) values
('BIENVENUE10', '10 % offerts sur votre première commande', 'pourcentage', 10, 10000, true)
on conflict (code) do nothing;

-- =====================================================================
-- Dernière étape (voir le guide) : déclarer votre compte comme propriétaire
--   insert into public.admins (user_id, nom, role)
--   select id, 'Ndeye Sadio Ndour', 'proprietaire' from auth.users where email = 'VOTRE-EMAIL@exemple.com';
-- =====================================================================
