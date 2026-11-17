import { Routes, Route, Outlet } from "react-router-dom";
import Header from "./components/header/header";
import Footer from "./components/footer/footer";
import Home from "./pages/home/home";
import Login from "./pages/login/login";
import Register from "./pages/register/register";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/dashboard/dashboard";
import Overview from "./pages/dashboard/overview/overview";
import Agents from "./pages/dashboard/agents/agents";
import Policies from "./pages/dashboard/policies/policies";
import Customers from "./pages/dashboard/customers/customers";
import Claims from "./pages/dashboard/claims/claims";
import Contracts from "./pages/dashboard/contracts/contracts";

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
            <Route index element={<Overview />} />
            <Route path="agents" element={<Agents />} />
            <Route path="policies" element={<Policies />} />
            <Route path="customers" element={<Customers />} />
            <Route path="claims" element={<Claims />} />
            <Route path="contracts" element={<Contracts />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
