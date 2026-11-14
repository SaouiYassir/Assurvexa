import { Routes, Route, Outlet } from "react-router-dom";
import Header from "./components/header/header";
import Footer from "./components/footer/footer";
import Home from "./pages/home/home";
import Login from "./pages/login/login";
import Register from "./pages/register/register";

import Dashboard from "./pages/dashboard/dashboard";
import Agents from "./pages/dashboard/agents/agents";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Policies from "./pages/dashboard/policies/policies";

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
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />}>
            {/* <Route index element={<Overview />} /> */}
            <Route path="agents" element={<Agents />} />
            <Route path="policies" element={<Policies />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
