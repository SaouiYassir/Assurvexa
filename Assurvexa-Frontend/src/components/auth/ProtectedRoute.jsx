import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <p>Loading your session...</p>;
    }

    return isAuthenticated
        ? <Outlet />
        : <Navigate to="/login" replace state={{ from: location }} />;
}

export default ProtectedRoute;
