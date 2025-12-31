import { Navigate } from 'react-router-dom'
import { useAuthContext } from './AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuthContext()

  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/orders" />

  return children
}
