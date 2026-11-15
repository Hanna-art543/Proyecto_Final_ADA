
#!/usr/bin/env bash
# TuneMatch · Día 01 · Estudiante 4
# Ejecutar DENTRO de la carpeta del proyecto Vite (donde está package.json):
#   bash setup-tunematch.sh
set -e
 
if [ ! -f package.json ]; then
  echo "Error: ejecuta este script dentro de la carpeta del proyecto (donde está package.json)."
  exit 1
fi
 
# ---------- Carpetas ----------
mkdir -p public/images public/data
mkdir -p src/assets/images src/assets/icons
mkdir -p src/components src/pages src/algorithms src/services src/hooks src/lib src/routes src/styles
mkdir -p supabase scripts tests docs
 
# ---------- Archivos vacíos (los llenan los demás integrantes) ----------
for f in SongCard SongPlayer RatingStars PlaylistCard SearchBar OnboardingModal \
         PreferencesForm TopRatedList RadarChart RelatedSongs StyleCard; do
  [ -f "src/components/$f.jsx" ] || cat > "src/components/$f.jsx" <<EOF
// TODO: $f
export default function $f() {
  return null
}
EOF
done
 
for f in hashTable avlTree cosineSimilarity knn heap heapSort mergeSort \
         graph kruskal unionFind knapsack; do
  [ -f "src/algorithms/$f.js" ] || echo "// TODO: $f" > "src/algorithms/$f.js"
done
 
for f in songService preferenceService interactionService recommendationService \
         playlistService graphService; do
  [ -f "src/services/$f.js" ] || echo "// TODO: $f" > "src/services/$f.js"
done
 
for f in useSongs useRecommendations useGraph; do
  [ -f "src/hooks/$f.js" ] || echo "// TODO: $f" > "src/hooks/$f.js"
done
 
for f in seed-songs build-graph; do
  [ -f "scripts/$f.js" ] || echo "// TODO: $f" > "scripts/$f.js"
done
 
[ -f supabase/schema.sql ] || echo "-- TODO: schema.sql (E1)" > supabase/schema.sql
echo "[]" > public/data/neighbors.json
touch public/logo.svg
 
# ---------- Netlify: rutas de React Router ----------
echo "/*  /index.html  200" > public/_redirects
 
# ---------- Variables de entorno ----------
cat > .env.example <<'EOF'
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON
EOF
[ -f .env ] || cp .env.example .env
 
# El .env real NUNCA se sube
grep -qxF ".env" .gitignore 2>/dev/null || printf "\n# Secretos\n.env\n.env.local\n" >> .gitignore
 
# ---------- Páginas (pantallas vacías) ----------
make_page () {
  cat > "src/pages/$1.jsx" <<EOF
export default function $1() {
  return (
    <section className="page">
      <h1>$2</h1>
      <p className="muted">En construcción</p>
    </section>
  )
}
EOF
}
make_page Home "Inicio"
make_page Explore "Explorar"
make_page Styles "Estilos"
make_page Recommendations "Recomendaciones"
make_page Favorites "Favoritos"
make_page Playlists "Playlists"
make_page PlaylistDetail "Detalle de playlist"
make_page Profile "Perfil"
 
cat > src/pages/Login.jsx <<'EOF'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../services/authService'
 
export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
 
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <main className="auth">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>TuneMatch</h1>
        <p className="muted">Inicia sesión</p>
        <input type="email" placeholder="Correo" value={email}
               onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña" value={password}
               onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="muted">¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
      </form>
    </main>
  )
}
EOF
 
cat > src/pages/Register.jsx <<'EOF'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../services/authService'
 
export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
 
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const data = await signUp(email, password, username)
      // Si la confirmación por correo está activa, no hay sesión todavía
      if (data.session) navigate('/')
      else setInfo('Cuenta creada. Revisa tu correo para confirmarla.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <main className="auth">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>TuneMatch</h1>
        <p className="muted">Crea tu cuenta</p>
        <input type="text" placeholder="Usuario" value={username}
               onChange={(e) => setUsername(e.target.value)} required />
        <input type="email" placeholder="Correo" value={email}
               onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña (mín. 6)" value={password}
               onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        {error && <p className="error">{error}</p>}
        {info && <p className="info">{info}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Registrarme'}
        </button>
        <p className="muted">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </form>
    </main>
  )
}
EOF
 
# ---------- Supabase ----------
cat > src/lib/supabase.js <<'EOF'
import { createClient } from '@supabase/supabase-js'
 
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
 
if (!url || !anonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa tu .env (o las variables de Netlify).'
  )
}
 
// Solo la clave anon va en el frontend. La service_role NUNCA.
export const supabase = createClient(url, anonKey)
EOF
 
# ---------- authService ----------
cat > src/services/authService.js <<'EOF'
import { supabase } from '../lib/supabase'
 
/**
 * Registra un usuario. El username viaja en los metadatos para que el
 * trigger de auth.users (schema.sql, E1) lo use al crear la fila en profiles.
 * @returns {Promise<{user: object|null, session: object|null}>}
 */
export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })
  if (error) throw error
  return data
}
 
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}
 
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
 
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}
 
/** Escucha login/logout. Devuelve una función para cancelar la suscripción. */
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}
EOF
 
# ---------- useAuth (sin JSX para poder usar .js) ----------
cat > src/hooks/useAuth.js <<'EOF'
import { createContext, createElement, useContext, useEffect, useState } from 'react'
import { getSession, onAuthChange } from '../services/authService'
 
const AuthContext = createContext({ user: null, loading: true })
 
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    getSession()
      .then((session) => setUser(session?.user ?? null))
      .finally(() => setLoading(false))
    return onAuthChange((session) => setUser(session?.user ?? null))
  }, [])
 
  return createElement(AuthContext.Provider, { value: { user, loading } }, children)
}
 
export function useAuth() {
  return useContext(AuthContext)
}
EOF
 
# ---------- Componentes de navegación ----------
cat > src/components/Sidebar.jsx <<'EOF'
import { NavLink } from 'react-router-dom'
 
const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/explore', label: 'Explorar' },
  { to: '/styles', label: 'Estilos' },
  { to: '/recommendations', label: 'Recomendaciones' },
  { to: '/favorites', label: 'Favoritos' },
  { to: '/playlists', label: 'Playlists' },
  { to: '/profile', label: 'Perfil' },
]
 
export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}
                   className={({ isActive }) => (isActive ? 'active' : '')}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
EOF
 
cat > src/components/Navbar.jsx <<'EOF'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../services/authService'
 
export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
 
  async function handleLogout() {
    await signOut()
    navigate('/login')
  }
 
  return (
    <header className="navbar">
      <span className="brand">TuneMatch</span>
      <div className="navbar-right">
        <span className="muted">{user?.email}</span>
        <button onClick={handleLogout}>Salir</button>
      </div>
    </header>
  )
}
EOF
 
# ---------- Router ----------
cat > src/routes/AppRouter.jsx <<'EOF'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
 
import Login from '../pages/Login'
import Register from '../pages/Register'
import Home from '../pages/Home'
import Explore from '../pages/Explore'
import Styles from '../pages/Styles'
import Recommendations from '../pages/Recommendations'
import Favorites from '../pages/Favorites'
import Playlists from '../pages/Playlists'
import PlaylistDetail from '../pages/PlaylistDetail'
import Profile from '../pages/Profile'
 
function ProtectedLayout() {
  const { user, loading } = useAuth()
  if (loading) return <p className="muted center">Cargando...</p>
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="layout">
      <Navbar />
      <div className="layout-body">
        <Sidebar />
        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
 
function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="muted center">Cargando...</p>
  return user ? <Navigate to="/" replace /> : children
}
 
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
 
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/styles" element={<Styles />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/playlists/:id" element={<PlaylistDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
 
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
EOF
 
# ---------- App y main ----------
cat > src/App.jsx <<'EOF'
import { AuthProvider } from './hooks/useAuth'
import AppRouter from './routes/AppRouter'
 
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
EOF
 
cat > src/main.jsx <<'EOF'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
 
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
EOF
 
# Quitar los estilos de plantilla de Vite
rm -f src/App.css src/index.css
 
# ---------- CSS base (variables para que todos usen los mismos colores) ----------
cat > src/styles/global.css <<'EOF'
:root {
  --bg: #0f1115;
  --surface: #181b22;
  --border: #2a2f3a;
  --text: #f1f3f7;
  --muted: #9aa3b2;
  --accent: #1db954;
  --accent-text: #08130b;
  --danger: #ff5c5c;
  --radius: 10px;
}
 
* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
 
h1 { margin: 0 0 8px; font-size: 1.6rem; }
a { color: var(--accent); text-decoration: none; }
.muted { color: var(--muted); }
.center { text-align: center; margin-top: 3rem; }
.error { color: var(--danger); font-size: 0.9rem; }
.info { color: var(--accent); font-size: 0.9rem; }
 
input, button {
  font: inherit;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  padding: 10px 12px;
}
input { background: var(--surface); color: var(--text); width: 100%; }
button {
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  font-weight: 600;
  cursor: pointer;
}
button:disabled { opacity: 0.6; cursor: not-allowed; }
 
/* Login / Registro */
.auth { min-height: 100%; display: grid; place-items: center; padding: 16px; }
.auth-card {
  width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 12px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 24px;
}
 
/* Layout principal */
.layout { min-height: 100%; display: flex; flex-direction: column; }
.navbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 20px; background: var(--surface); border-bottom: 1px solid var(--border);
}
.brand { font-weight: 700; color: var(--accent); }
.navbar-right { display: flex; gap: 12px; align-items: center; }
.layout-body { flex: 1; display: flex; min-height: 0; }
.sidebar {
  width: 210px; padding: 16px 12px; background: var(--surface);
  border-right: 1px solid var(--border);
}
.sidebar nav { display: flex; flex-direction: column; gap: 4px; }
.sidebar a { color: var(--muted); padding: 8px 12px; border-radius: 8px; }
.sidebar a.active, .sidebar a:hover { background: var(--bg); color: var(--text); }
.content { flex: 1; padding: 24px; overflow: auto; }
 
@media (max-width: 720px) {
  .layout-body { flex-direction: column; }
  .sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--border); }
  .sidebar nav { flex-direction: row; overflow-x: auto; }
}
EOF
 
echo ""
echo "Estructura y código base de TuneMatch creados."
echo "Siguiente: completa .env con tus claves de Supabase y ejecuta 'npm run dev'."
 