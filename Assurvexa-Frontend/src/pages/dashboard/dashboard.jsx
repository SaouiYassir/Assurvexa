import Sidebar from "../../components/sidebar/sidebar";
import { Outlet } from 'react-router-dom';

function Dashboard({ user }) {
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