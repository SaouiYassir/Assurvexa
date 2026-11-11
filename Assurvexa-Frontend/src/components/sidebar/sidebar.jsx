import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldCheck,
  FileText,
  LogOut,
  Briefcase
} from "lucide-react";
import './sidebar.css';
import { useAuth } from '../../context/useAuth';

const NAV_ITEMS_BY_ROLE = {
    admin: [
        { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
        { label: "Agents", path: "/dashboard/agents", icon: Briefcase },
        { label: "Customers", path: "/dashboard/customers", icon: Users },
        { label: "Policies", path: "/dashboard/policies", icon: ShieldCheck },
        { label: "Claims", path: "/dashboard/claims", icon: FileText },
    ],
    agent: [
        { label: "My Activity", path: "/dashboard", icon: LayoutDashboard },
        { label: "My Clients", path: "/dashboard/customers", icon: UserCheck },
        { label: "Policies", path: "/dashboard/policies", icon: ShieldCheck },
        { label: "Claims", path: "/dashboard/claims", icon: FileText },
    ],
    client: [
        { label: "My Workspace", path: "/dashboard", icon: LayoutDashboard },
        { label: "My Insurance", path: "/dashboard/policies", icon: ShieldCheck },
        { label: "My Claims", path: "/dashboard/claims", icon: FileText },
        { label: "My Documents", path: "/dashboard/documents", icon: FileText },
    ],
};

function Sidebar({ user }) {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const scroll = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const role = user?.role && NAV_ITEMS_BY_ROLE[user.role] ? user.role : 'client';
    const navItems = NAV_ITEMS_BY_ROLE[role];

    const handleSignOut = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Sign-out failed:", error);
        } finally {
            navigate('/', { replace: true });
        }
    };

    return (
        <aside className="sidebar">
            <header className="sidebar-header">
                <NavLink className="logo" to="/dashboard" onClick={scroll}>
                    Assurvexa<span className="logo-dot">.</span>
                </NavLink>
            </header>

            <nav className="sidebar-nav">
                <p className="sidebar-section-title">NAVIGATION</p>

                {navItems.map((item) => {
                    const IconComponent = item.icon;
                    const isDashboardHome = item.path === "/dashboard";

                    return (
                        <NavLink 
                            key={item.path} 
                            to={item.path} 
                            end={isDashboardHome}
                            onClick={scroll}
                            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                        >
                            {IconComponent && <IconComponent className="nav-icon" />}
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <footer className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="user-details">
                        <p className="user-name">
                            {user ? `${user.first_name} ${user.last_name}` : "User Name"}
                        </p>
                        <p className="user-role">
                            {user?.role || "Role"}
                        </p>
                    </div>
                </div>
                <button type="button" className="sidebar-logout" onClick={handleSignOut}>
                    <LogOut size={18} strokeWidth={1.8} />
                    <span>Sign out</span>
                </button>
            </footer>
        </aside>
    );
}

export default Sidebar;