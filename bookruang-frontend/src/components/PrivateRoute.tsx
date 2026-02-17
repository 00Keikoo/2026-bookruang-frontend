import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

interface PrivateRouteProps {
    children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
    const user = authService.getCurrentUser();

    if (!user || !user.token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default PrivateRoute;