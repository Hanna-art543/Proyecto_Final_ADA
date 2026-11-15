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
