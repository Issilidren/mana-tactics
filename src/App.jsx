import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login     from './pages/Login'
import Register  from './pages/Register'
import Home      from './pages/Home'
import DeckNew   from './pages/DeckNew'
import DeckDetail from './pages/DeckDetail'
import GamePage  from './pages/GamePage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/"          element={<Home />} />
            <Route path="/decks/new" element={<DeckNew />} />
            <Route path="/decks/:id" element={<DeckDetail />} />
            <Route path="/game"      element={<GamePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
