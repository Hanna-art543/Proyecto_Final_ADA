// scripts/seed-songs.js
// Limpia el dataset (CSV) y lo carga en Supabase.
// Uso:  npm run seed -- data/spotify_tracks.csv   (lee .env con --env-file)
// Requiere: npm i @supabase/supabase-js csv-parse
// Variables en .env: VITE_SUPABASE_URL (o SUPABASE_URL) y SUPABASE_SERVICE_ROLE_KEY
// ⚠ La clave service_role NUNCA va en el frontend ni en el repositorio.

import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

// ---- Ajusta estos nombres a las columnas de tu CSV ----
const COL = {
  external_id: 'track_id',
  title: 'track_name',
  artist: 'artists',
  genre: 'track_genre',
  duration_ms: 'duration_ms',
  danceability: 'danceability',
  energy: 'energy',
  valence: 'valence',
  acousticness: 'acousticness',
  instrumentalness: 'instrumentalness',
};
const FEATURES = ['danceability', 'energy', 'valence', 'acousticness', 'instrumentalness'];
const MAX_PER_GENRE = 100;   // catálogo equilibrado
const BATCH = 500;

const file = process.argv[2];
if (!file) throw new Error('Indica el CSV: node scripts/seed-songs.js data/archivo.csv');

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ---- 1. Leer y limpiar ----
const raw = parse(fs.readFileSync(file), { columns: true, skip_empty_lines: true, trim: true });
const seen = new Set();
const perGenre = {};
const clean = [];

for (const r of raw) {
  const id = r[COL.external_id];
  const title = r[COL.title];
  const artist = r[COL.artist];
  const genre = r[COL.genre];
  if (!id || !title || !artist || !genre || seen.has(id)) continue;

  const feats = {};
  let ok = true;
  for (const f of FEATURES) {
    const v = Number(r[COL[f]]);
    if (!Number.isFinite(v) || v < 0 || v > 1) { ok = false; break; }
    feats[f] = v;
  }
  if (!ok) continue;

  perGenre[genre] = (perGenre[genre] ?? 0) + 1;
  if (perGenre[genre] > MAX_PER_GENRE) continue;

  seen.add(id);
  clean.push({
    external_id: id,
    title,
    artist: artist.replaceAll(';', ', '),
    genre,
    duration_ms: Number(r[COL.duration_ms]) || null,
    ...feats,
  });
}
console.log(`Filas originales: ${raw.length} | filas limpias: ${clean.length}`);

// ---- 2. Géneros ----
const genreNames = [...new Set(clean.map((s) => s.genre))];
const { error: gErr } = await supabase.from('genres').upsert(genreNames.map((name) => ({ name })), { onConflict: 'name' });
if (gErr) throw gErr;

const { data: genres, error: g2 } = await supabase.from('genres').select('id,name');
if (g2) throw g2;
const genreId = Object.fromEntries(genres.map((g) => [g.name, g.id]));

const rows = clean.map((s) => {
  const row = { ...s, genre_id: genreId[s.genre] };
  delete row.genre;
  return row;
});
for (let i = 0; i < rows.length; i += BATCH) {
  const { error } = await supabase.from('songs').upsert(rows.slice(i, i + BATCH), { onConflict: 'external_id' });
  if (error) throw error;
  console.log(`Cargadas ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
}
console.log('Listo ✔');