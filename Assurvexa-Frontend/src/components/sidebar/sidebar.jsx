import { useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, Users, UserCheck, ShieldCheck, FileText,
    LogOut, Briefcase, HandCoins, Menu, X,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import "./sidebar.css";

const NAV_ITEMS_BY_ROLE = {
    admin: [
        { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
        { label: "Agents", path: "/dashboard/agents", icon: Briefcase },
        { label: "Customers", path: "/dashboard/customers", icon: Users },
        { label: "Policies", path: "/dashboard/policies", icon: ShieldCheck },
        { label: "Contracts", path: "/dashboard/contracts", icon: ShieldCheck },
        { label: "Claims", path: "/dashboard/claims", icon: FileText },
        { label: "Reimbursements", path: "/dashboard/reimbursements", icon: HandCoins }
    ],
    agent: [
        { label: "My Activity", path: "/dashboard", icon: LayoutDashboard },
        { label: "My Clients", path: "/dashboard/customers", icon: UserCheck },
        { label: "Policies", path: "/dashboard/policies", icon: ShieldCheck },
        { label: "Contracts", path: "/dashboard/contracts", icon: ShieldCheck },
        { label: "Claims", path: "/dashboard/claims", icon: FileText },
        { label: "Reimbursements", path: "/dashboard/reimbursements", icon: HandCoins }
    ],
    client: [
        { label: "My Workspace", path: "/dashboard", icon: LayoutDashboard },
        { label: "My Insurance", path: "/dashboard/policies", icon: ShieldCheck },
        { label: "My Claims", path: "/dashboard/claims", icon: FileText },
        { label: "My Contracts", path: "/dashboard/contracts", icon: FileText },
        { label: "My Reimbursements", path: "/dashboard/reimbursements", icon: HandCoins }
    ],
};

function Sidebar({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const drawerRef = useRef(null);

    const navItems = Object.hasOwn(NAV_ITEMS_BY_ROLE, user?.role)
        ? NAV_ITEMS_BY_ROLE[user.role]
        : NAV_ITEMS_BY_ROLE.client;

    const name =
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "User";
    const role = user?.role || "Client";

    const closeDrawer = () => drawerRef.current?.close();

    useEffect(() => {
        drawerRef.current?.close();
    }, [location.key]);

    useEffect(() => {
        const desktop = window.matchMedia("(min-width: 901px)");

        const closeOnDesktop = () => {
            if (desktop.matches) drawerRef.current?.close();
        };

        desktop.addEventListener("change", closeOnDesktop);
        return () => desktop.removeEventListener("change", closeOnDesktop);
    }, []);

    const handleNavigation = (event) => {
        if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        closeDrawer();
        window.scrollTo({ top: 0, behavior: "instant" });
    };

    const handleSignOut = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Sign-out failed:", error);
        } finally {
            closeDrawer();
            navigate("/", { replace: true });
        }
    };

    const brand = (
        <NavLink
            className="av-sidebar__brand"
            to="/dashboard"
            end
            onClick={handleNavigation}
        >
            Assurvexa<span>.</span>
        </NavLink>
    );

    const panel = (isDrawer = false) => (
        <div className="av-sidebar__panel">
            <header className="av-sidebar__header">
                {brand}
                {isDrawer && (
                    <button
                        type="button"
                        className="av-sidebar__icon-button"
                        aria-label="Close navigation"
                        onClick={closeDrawer}
                        autoFocus
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                )}
            </header>

            <nav className="av-sidebar__nav" aria-label="Dashboard navigation">
                {navItems.map(({ label, path, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === "/dashboard"}
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                            `av-sidebar__link${isActive ? " is-active" : ""}`
                        }
                    >
                        <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <footer className="av-sidebar__footer">
                <div className="av-sidebar__identity">
                    <p className="av-sidebar__name">{name}</p>
                    <p className="av-sidebar__role">{role}</p>
                </div>

                <button
                    type="button"
                    className="av-sidebar__logout"
                    onClick={handleSignOut}
                >
                    <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
                    <span>Sign out</span>
                </button>
            </footer>
        </div>
    );

    return (
        <div className="av-sidebar">
            <aside className="av-sidebar__desktop">{panel()}</aside>

            <header className="av-sidebar__mobile">
                {brand}
                <button
                    type="button"
                    className="av-sidebar__icon-button"
                    aria-label="Open navigation"
                    aria-haspopup="dialog"
                    onClick={() => drawerRef.current?.showModal()}
                >
                    <Menu size={22} aria-hidden="true" />
                </button>
            </header>

            <dialog
                ref={drawerRef}
                className="av-sidebar__drawer"
                aria-label="Dashboard menu"
                onClick={(event) => {
                    if (event.target === event.currentTarget) closeDrawer();
                }}
            >
                {panel(true)}
            </dialog>
        </div>
    );
}

export default Sidebar;