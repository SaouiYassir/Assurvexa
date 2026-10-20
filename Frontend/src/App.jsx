import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from "./components/header/Header"
import Home from "./pages/home/Home"
import Footer from "./components/Footer/Footer"

function App() {

  return (
    <BrowserRouter>
      <Header />
      
      <Routes>
        <Route path='/' element={<Home />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  )
}

export default App
