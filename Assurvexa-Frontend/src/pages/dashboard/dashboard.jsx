import Sidebar from "../../components/sidebar/sidebar";
import { Outlet } from 'react-router-dom';
import { useAuth } from "../../context/useAuth";
import './dashboard.css';

function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="dashboard-container">
            <Sidebar user={user} />
            <main className="dashboard-main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default Dashboard;