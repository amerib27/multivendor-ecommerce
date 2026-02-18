import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'

interface ProtectedRouteProps {
  allowedRoles: Array<'CUSTOMER' | 'VENDOR' | 'ADMIN'>
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
    if (user.role === 'VENDOR') return <Navigate to="/vendor-dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
