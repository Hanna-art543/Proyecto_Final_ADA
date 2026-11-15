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
