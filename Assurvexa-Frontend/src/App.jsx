import { Routes, Route, BrowserRouter, Outlet } from "react-router-dom";
import Header from "./components/header/header";
import Footer from "./components/footer/footer";
import Home from "./pages/home/home";
import Login from "./pages/login/login";
import Register from "./pages/register/register";

import Dashboard from "./pages/dashboard/dashboard";

function App() {
  return (
    <>
      <Routes>
        <Route
          element={
            <>
              <Header />
              <main>
                <Outlet />
              </main>
              <Footer />
            </>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* --- DASHBOARD ROUTES (No Global Header/Footer, Sidebar Only) --- */}
        <Route
          path="/dashboard"
          element={<Dashboard user={{role: 'admin'}} />}
        >
          {/* <Route index element={<Overview />} />
          <Route path="agents" element={<Agents />} />
          <Route path="customers" element={<Customers />} />
          <Route path="policies" element={<Policies />} />
          <Route path="claims" element={<Claims />} /> */}
        </Route>
      </Routes>
    </>
  );
}

export default App;
