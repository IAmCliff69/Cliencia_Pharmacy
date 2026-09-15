import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AppLayout from './components/layout/AppLayout'
import Categories from './pages/Categories'
import Suppliers from './pages/Suppliers'
import Medicines from './pages/Medicines'
import Sales from './pages/Sales'
import POS from './pages/POS'
import Reports from './pages/Reports'
import Users from './pages/Users'
import ProtectedRoute from './components/ProtectedRoute'


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
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/medicines" element={<Medicines />} />
      <Route path="/pos" element={<POS />} />
      <Route path="/sales" element={<Sales />} />
      <Route path="/reports" element={<Reports />} />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Users />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App