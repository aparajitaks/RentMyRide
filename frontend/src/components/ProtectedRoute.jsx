import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user && user.role !== requiredRole) {
    // Wrong role - redirect to appropriate dashboard or login
    if (user.role === 'business') {
      return <Navigate to="/dashboard/business" replace />
    } else if (user.role === 'user') {
      return <Navigate to="/dashboard/user" replace />
    }
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute

