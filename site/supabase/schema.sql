-- le radeau du radotage — schéma de la base
--
-- À coller dans Supabase : SQL Editor → New query → Run.
--
-- Lui seul écrit. Tout le monde lit. C'est tout.
--
-- Important : être connecté ne suffit pas pour écrire. Il faut être inscrit
-- dans la table `auteurs`. Ainsi, même si quelqu'un parvenait à se créer un
-- compte, il ne pourrait rien publier. La porte ne tient pas à un seul
-- réglage du tableau de bord.

-- ---------------------------------------------------------------- auteurs

create table if not exists auteurs (
  id        uuid primary key references auth.users (id) on delete cascade,
  ajoute_le timestamptz not null default now()
);

-- Aucune politique sur cette table : avec RLS active et zéro politique,
-- personne ne peut la lire ni la modifier depuis le site. Elle ne se
-- gère que depuis le tableau de bord Supabase.
alter table auteurs enable row level security;

-- La fonction, elle, a le droit de la consulter (security definer).
create or replace function est_auteur()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from auteurs where id = auth.uid());
$$;

revoke all on function est_auteur() from public;
grant execute on function est_auteur() to authenticated;

-- ----------------------------------------------------------------- poèmes

create table if not exists poemes (
  slug         text primary key,
  titre        text not null check (length(trim(titre)) > 0),
  texte        text not null check (length(trim(texte)) > 0),
  date         date not null default current_date,
  publie       boolean not null default true,
  auteur       uuid not null references auth.users (id) default auth.uid(),
  cree_le      timestamptz not null default now(),
  modifie_le   timestamptz not null default now()
);

-- On affiche presque toujours « les plus récents d'abord ».
create index if not exists poemes_date_idx on poemes (date desc, cree_le desc);

-- Horodatage de la dernière retouche, tenu par la base et non par le client.
create or replace function touche_modifie_le()
returns trigger
language plpgsql
as $$
begin
  new.modifie_le = now();
  return new;
end;
$$;

drop trigger if exists poemes_modifie_le on poemes;
create trigger poemes_modifie_le
  before update on poemes
  for each row execute function touche_modifie_le();

-- Sécurité au niveau des lignes : sans ces règles, la table serait ouverte.
alter table poemes enable row level security;

-- Lecture : tout le monde, y compris les visiteurs non connectés,
-- mais uniquement ce qui est publié.
drop policy if exists "lecture publique" on poemes;
create policy "lecture publique"
  on poemes for select
  to anon, authenticated
  using (publie = true);

-- Il relit ses propres brouillons.
drop policy if exists "il relit ses brouillons" on poemes;
create policy "il relit ses brouillons"
  on poemes for select
  to authenticated
  using (est_auteur() and auteur = auth.uid());

-- Écriture : un auteur déclaré, et seulement en son nom.
drop policy if exists "il ecrit" on poemes;
create policy "il ecrit"
  on poemes for insert
  to authenticated
  with check (est_auteur() and auteur = auth.uid());

drop policy if exists "il corrige" on poemes;
create policy "il corrige"
  on poemes for update
  to authenticated
  using (est_auteur() and auteur = auth.uid())
  with check (est_auteur() and auteur = auth.uid());

drop policy if exists "il supprime" on poemes;
create policy "il supprime"
  on poemes for delete
  to authenticated
  using (est_auteur() and auteur = auth.uid());

-- ------------------------------------------------------------------------
-- UNE FOIS SON COMPTE CRÉÉ (Authentication → Users → Add user),
-- revenez ici, remplacez l'adresse ci-dessous par la sienne, et exécutez
-- ces deux lignes. Sans elles, il pourra se connecter mais pas publier.
-- ------------------------------------------------------------------------

-- insert into auteurs (id)
-- select id from auth.users where email = 'son-adresse@exemple.fr'
-- on conflict do nothing;
