import AppRouter from './routes/AppRouter'
import { AuthProvider } from './hooks/useAuth'
import { InteractionsProvider } from './hooks/useInteractions'
import { PlayerProvider } from './hooks/usePlayer'

export default function App() {
  return (
    <AuthProvider>
      <InteractionsProvider>
        <PlayerProvider>
          <AppRouter />
        </PlayerProvider>
      </InteractionsProvider>
    </AuthProvider>
  )
}