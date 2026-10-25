import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Header from "./components/header/Header"
import Home from "./pages/home/Home"
import Login from './pages/login/Login'
import Register from './pages/register/Register'
import Footer from "./components/footer/Footer"

import DashboardLayout from './pages/dashboard/DashboardLayout'
import AdminOverview from './pages/dashboard/admin/AdminOverview'

function AppContent() {
  const location = useLocation()

  const isDashboard = location.pathname === '/dashboard'

  const user = { name: "Yassir", role: "admin" };

  return (
    <>
      {!isDashboard && <Header />}

      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route element={<DashboardLayout user={user} />}>
          {/* Admin Routes */}
          <Route path="/dashboard" element={<AdminOverview />} />

        </Route>
      </Routes>

      {!isDashboard && <Footer />}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App