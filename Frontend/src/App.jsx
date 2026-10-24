import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Header from "./components/header/Header"
import Home from "./pages/home/Home"
import Login from './pages/login/Login'
import Register from './pages/register/Register'
import Dashboard from './pages/dashboard/Dashboard'
import Footer from "./components/footer/Footer"

function AppContent() {
  const location = useLocation()

  const isDashboard = location.pathname === '/dashboard'

  return (
    <>
      {!isDashboard && <Header />}

      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/dashboard' element={<Dashboard />} />
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