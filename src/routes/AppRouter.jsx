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
