import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AppLayout from './components/layout/AppLayout'
import Categories from './pages/Categories'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Medicines, Categories, Suppliers, POS, Sales, Reports,
            Users routes get added here as we build each page in
            Phases 4-6 — they'll all automatically get the
            sidebar/topbar shell for free via this nested route. */}
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/categories" element={<Categories />} />
    </Routes>
  )
}

export default App