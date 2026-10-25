import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldCheck,
  FileText,
  LogOut,
  Briefcase
} from "lucide-react";
import "./Sidebar.css";

// Centralized navigation items based on user roles
const NAV_ITEMS_BY_ROLE = {
  admin: [
    { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { label: "Agents", path: "/agents", icon: Briefcase },
    { label: "Customers", path: "/customers", icon: Users },
    { label: "Policies", path: "/policies", icon: ShieldCheck },
    { label: "Claims", path: "/claims", icon: FileText },
  ],
  agent: [
    { label: "My Activity", path: "/dashboard", icon: LayoutDashboard },
    { label: "My Clients", path: "/customers", icon: UserCheck },
    { label: "Policies", path: "/policies", icon: ShieldCheck },
    { label: "Claims", path: "/claims", icon: FileText },
  ],
  client: [
    { label: "My Workspace", path: "/dashboard", icon: LayoutDashboard },
    { label: "My insurance", path: "/policies", icon: ShieldCheck },
    { label: "My Claims", path: "/claims", icon: FileText },
    { label: "My Documents", path: "/documents", icon: FileText },
  ],
};

function Sidebar({ user }) {
  function onSignOut() {
    // Process sign out logic (clear tokens, reset state, redirect, etc.)
  }

  // Normalize role safely (defaults to "client" if undefined)
  const role = user?.role?.toLowerCase() || "client";

  // Get nav items for current role (fallback to empty array if unrecognized role)
  const navItems = NAV_ITEMS_BY_ROLE[role] || NAV_ITEMS_BY_ROLE.client;

  return (
    <aside className="sidebar">
      {/* Logo Header */}
      <header className="sidebar-header">
        <NavLink className="logo" to="/dashboard">
          Assurvexa<span className="logo-dot">.</span>
        </NavLink>
      </header>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        <p className="sidebar-section-title">NAVIGATION</p>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <footer className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="user-details">
            <p className="user-name">{user?.name || "User Name"}</p>
            <p className="user-role">{user?.role || "Customer"}</p>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={onSignOut}          
        >
          <LogOut size={18} strokeWidth={1.8} />
          <span>Sign out</span>
        </button>
      </footer>
    </aside>
  );
}

export default Sidebar;