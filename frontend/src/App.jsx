import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Scanner from './pages/Scanner'
import Result from './pages/Result'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import LandingPage from './pages/LandingPage'
import UserSignup from './pages/UserSignup'
import UserLogin from './pages/UserLogin'
import ReportVendor from './pages/ReportVendor'

export default function App() {
  return (
    <div className="app-shell">
      <BrowserRouter>
        <Routes>

          {/* Consumer PWA */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/result" element={<Result />} />

          {/* User auth & report */}
          <Route path="/user/signup" element={<UserSignup />} />
          <Route path="/user/login" element={<UserLogin />} />
          <Route path="/report" element={<ReportVendor />} />

          {/* Admin dashboard */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </div>
  )
}