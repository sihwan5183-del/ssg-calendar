import { AuthProvider, useAuth } from './lib/AuthContext'
import LoginPage from './pages/LoginPage'
import CalendarPage from './pages/CalendarPage'

function Gate() {
  const { loading, session } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">불러오는 중...</div>
    )
  }
  return session ? <CalendarPage /> : <LoginPage />
}

function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

export default App
