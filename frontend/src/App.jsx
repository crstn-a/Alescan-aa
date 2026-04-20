import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Scanner        from './pages/Scanner'
import Result         from './pages/Result'
import AdminLogin     from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Consumer PWA */}
        <Route path="/"            element={<Scanner />}        />
        <Route path="/result"       element={<Result />}         />

        {/* Admin dashboard */}
        <Route path="/admin/login"  element={<AdminLogin />}     />
        <Route path="/admin"        element={<AdminDashboard />} />

        {/* Catch-all */}
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}