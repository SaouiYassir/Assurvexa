import { Outlet } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import "./Dashboard.css";

export default function DashboardLayout({ user }) {
  return (
    <div className="dashboard-layout">
      <Sidebar user={user} />
      
      {/* Main content viewport */}
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}