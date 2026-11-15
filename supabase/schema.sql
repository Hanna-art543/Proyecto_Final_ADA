-- =====================================================================
-- schema.sql  |  Base de datos (Supabase / PostgreSQL)
-- Correo y contraseña los gestiona Supabase Auth (auth.users).
-- =====================================================================

-- ---------- TABLAS ----------------------------------------------------

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table public.genres (
  id   bigint generated always as identity primary key,
  name text not null unique
);

create table public.songs (
  id               bigint generated always as identity primary key,
  external_id      text unique,                 -- id original del dataset (para upsert)
  title            text not null,
  artist           text not null,
  genre_id         bigint references public.genres(id),
  duration_ms      integer,
  -- vector de 5 características (todas normalizadas entre 0 y 1)
  danceability     real not null check (danceability     between 0 and 1),
  energy           real not null check (energy           between 0 and 1),
  valence          real not null check (valence          between 0 and 1),
  acousticness     real not null check (acousticness     between 0 and 1),
  instrumentalness real not null check (instrumentalness between 0 and 1)
);

create table public.user_preferences (
  id                   bigint generated always as identity primary key,
  user_id              uuid not null unique references public.profiles(id) on delete cascade,
  danceability         real check (danceability     between 0 and 1),
  energy               real check (energy           between 0 and 1),
  valence              real check (valence          between 0 and 1),
  acousticness         real check (acousticness     between 0 and 1),
  instrumentalness     real check (instrumentalness between 0 and 1),
  created_at           timestamptz not null default now()
);

create table public.user_preferred_genres (
  user_id  uuid   not null references public.profiles(id) on delete cascade,
  genre_id bigint not null references public.genres(id)   on delete cascade,
  primary key (user_id, genre_id)
);

create table public.song_interactions (
  id          bigint generated always as identity primary key,
  user_id     uuid   not null references public.profiles(id) on delete cascade,
  song_id     bigint not null references public.songs(id)    on delete cascade,
  rating      smallint check (rating between 1 and 5),
  is_favorite boolean  not null default false,
  play_count  integer  not null default 0 check (play_count >= 0),
  updated_at  timestamptz not null default now(),
  unique (user_id, song_id)
);

create table public.playlists (
  id                bigint generated always as identity primary key,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  description       text,
  is_public         boolean not null default false,
  generation_method text not null default 'manual'
                    check (generation_method in ('manual', 'dynamic')),
  created_at        timestamptz not null default now()
);

create table public.playlist_songs (
  id          bigint generated always as identity primary key,
  playlist_id bigint  not null references public.playlists(id) on delete cascade,
  song_id     bigint  not null references public.songs(id)     on delete cascade,
  position    integer not null check (position >= 0),
  affinity    real,
  unique (playlist_id, song_id),
  unique (playlist_id, position)
);

-- ---------- ÍNDICES ---------------------------------------------------

create index idx_interactions_user   on public.song_interactions(user_id);
create index idx_interactions_song   on public.song_interactions(song_id);
create index idx_songs_genre         on public.songs(genre_id);
create index idx_playlist_songs_pl   on public.playlist_songs(playlist_id);

-- ---------- TRIGGER: perfil automático al registrarse ------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- authService.signUp envía { username } en los metadatos
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1)),
    coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- FUNCIÓN: Más calificados (solo agregados) ------------------

create or replace function public.get_top_rated(min_votes integer default 3)
returns table (song_id bigint, avg_rating numeric, votes bigint, likes bigint)
language sql
security definer
set search_path = public
stable
as $$
  select si.song_id,
         round(avg(si.rating)::numeric, 2) as avg_rating,
         count(si.rating)                  as votes,
         count(*) filter (where si.is_favorite) as likes
  from public.song_interactions si
  group by si.song_id
  having count(si.rating) >= min_votes
  order by avg_rating desc, votes desc;
$$;

revoke all on function public.get_top_rated(integer) from public, anon;
grant execute on function public.get_top_rated(integer) to authenticated;

-- ---------- RLS ---------------------------------------------------------

alter table public.profiles              enable row level security;
alter table public.genres                enable row level security;
alter table public.songs                 enable row level security;
alter table public.user_preferences      enable row level security;
alter table public.user_preferred_genres enable row level security;
alter table public.song_interactions     enable row level security;
alter table public.playlists             enable row level security;
alter table public.playlist_songs        enable row level security;

-- songs y genres: solo lectura
create policy "genres_read" on public.genres for select to authenticated using (true);
create policy "songs_read"  on public.songs  for select to authenticated using (true);

-- profiles: cada usuario accede a su fila
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());

-- user_preferences
create policy "prefs_own" on public.user_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- user_preferred_genres
create policy "pgenres_own" on public.user_preferred_genres for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- song_interactions
create policy "interactions_own" on public.song_interactions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- playlists: dueño todo; públicas visibles para otros
create policy "playlists_select" on public.playlists for select to authenticated
  using (user_id = auth.uid() or is_public);
create policy "playlists_insert" on public.playlists for insert to authenticated
  with check (user_id = auth.uid());
create policy "playlists_update" on public.playlists for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "playlists_delete" on public.playlists for delete to authenticated
  using (user_id = auth.uid());

-- playlist_songs: sigue al dueño de la playlist
create policy "pls_select" on public.playlist_songs for select to authenticated
  using (exists (select 1 from public.playlists p
                 where p.id = playlist_id and (p.user_id = auth.uid() or p.is_public)));
create policy "pls_write" on public.playlist_songs for all to authenticated
  using (exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid()));