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
import Shifts from './pages/Shifts'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'


function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/shifts" element={<Shifts />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Users />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App