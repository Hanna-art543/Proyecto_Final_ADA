# Integración del módulo de estilos (estudiante 3)

## Contratos disponibles

- `RelatedSongs` recibe `songId`, `songs`, `neighborData`, `limit` y `onSelect`.
  Puede integrarse en `Explore.jsx` pasando el catálogo y el ID estable de la
  canción seleccionada. Si no recibe `neighborData`, carga `/data/neighbors.json`.
- `DiscoverSomethingNew` recibe `styles`, `affinityBySongId`,
  `excludedSongIds`, `limit` y `onSelect`. `Recommendations.jsx` puede pasar el
  mapa de afinidad del estudiante 2; la selección toma primero la canción de
  mayor afinidad de cada estilo y luego completa otra ronda.
- `useGraph({ targetComponents })` entrega `songs`, `styles`, `graph`,
  `neighborIndex`, `kruskalResult`, `loading`, `error` y `reload`.

No se modificaron `Explore.jsx` ni `Recommendations.jsx` porque pertenecen total
o parcialmente a otros integrantes. La página `Styles.jsx` ya consume los tres
contratos y sirve como ejemplo funcional.

## Catálogo y archivo precalculado

El servicio espera en Supabase la tabla `songs` con `external_id`, `title`,
`artist`, relación `genres` y las características `energy`, `danceability`,
`acousticness`, `instrumentalness` y `valence`. Usa `external_id` como clave
estable para enlazar Supabase con `public/data/neighbors.json`.

La similitud resta a cada canción la media real del catálogo para cada una de
las cinco características y aplica coseno sobre esos vectores centrados. El
JSON declara esas medias en `centering.featureMeans`; los pesos del grafo son
`1 - similarity`, por lo que Kruskal procesa primero las canciones más afines.

El JSON incluido se generó desde `data/dataset.csv` de la rama del responsable
de Supabase, aplicando el mismo límite de 100 canciones por género definido en
su seed. Para regenerarlo desde un CSV/JSON local:

```sh
npm run build:graph -- --input data/dataset.csv
```

Sin `--input`, el script pagina directamente la tabla `songs` y utiliza la URL
y la clave pública `anon` de Supabase. Si RLS limita la lectura a usuarios
autenticados, admite un `SUPABASE_ACCESS_TOKEN` de usuario. No necesita ni
admite como alternativa una clave `service_role`; ninguna credencial se escribe
en el JSON. El modo CSV/JSON funciona sin configurar Supabase.

## Dependencias de otros algoritmos

En `develop`, `cosineSimilarity.js` y `mergeSort.js` continúan como stubs. Para
no sobrescribir esas responsabilidades, el módulo de Claudia contiene una
implementación local comprobada del coseno centrado y el ordenamiento estable de
aristas. Cuando las implementaciones de los compañeros se integren, esos dos
puntos pueden reemplazarse conservando los contratos de `buildGraph.js` y
`kruskal.js`.
