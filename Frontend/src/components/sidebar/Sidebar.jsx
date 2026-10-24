import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  LogOut,
} from "lucide-react";
import "./Sidebar.css";

const navigationLinks = [
  {
    name: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Policies",
    path: "/dashboard/policies",
    icon: ShieldCheck,
  },
  {
    name: "Claims",
    path: "/dashboard/claims",
    icon: FileText,
  },
];

function Sidebar({ user }) {

    function onSignOut() {
        // Process
    }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <header className="sidebar-header">
        <NavLink className="logo" to="/dashboard">
          Assurvexa<span className="logo-dot">.</span>
        </NavLink>
      </header>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        <p className="sidebar-section-title">WORKSPACE</p>

        {navigationLinks.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/dashboard"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User information */}
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

        <NavLink
          type="button"
          className="sidebar-logout"
          onClick={onSignOut}
          to='/'
        >
          <LogOut size={18} strokeWidth={1.8} />
          <span>Sign out</span>
        </NavLink>
      </footer>
    </aside>
  );
}

export default Sidebar;