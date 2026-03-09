import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';

interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
    const location = useLocation();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const verifyAdmin = async () => {
            try {
                const response = await authService.getMe();
                if (response?.data?.role === 'ADMIN') {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                }
            } catch (err) {
                console.error("Failed to verify admin status", err);
                setIsAuthorized(false);
            }
        };

        verifyAdmin();
    }, [location.pathname]); // Re-verify on navigation

    if (isAuthorized === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthorized) {
        // Redirect to homepage if they don't have the backend-verified ADMIN role
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;
