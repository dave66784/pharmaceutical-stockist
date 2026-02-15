import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';

interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
    const token = authService.getToken();
    const user = authService.getCurrentUser();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;
