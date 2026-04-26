import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Materials from '@/pages/Materials'
import Categories from '@/pages/Categories'
import Designs from '@/pages/Designs'
import Coupons from '@/pages/Coupons'
import Orders from '@/pages/Orders'

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="materials" element={<Materials />} />
        <Route path="categories" element={<Categories />} />
        <Route path="designs" element={<Designs />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="orders" element={<Orders />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
