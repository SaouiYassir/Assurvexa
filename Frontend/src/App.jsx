import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from "./components/header/Header"
import Home from "./pages/home/Home"
import Login from './pages/login/Login'
import Register from './pages/Register/Register'
import Footer from "./components/Footer/Footer"

function App() {

  return (
    <BrowserRouter>
      <Header />
      
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  )
}

export default App
