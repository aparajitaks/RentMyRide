import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const UserDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>User Dashboard</h1>
          <p>Welcome back, {user?.name || user?.email}!</p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="info-card">
          <h2>Your Profile</h2>
          <div className="info-item">
            <strong>Email:</strong> {user?.email}
          </div>
          <div className="info-item">
            <strong>Role:</strong> {user?.role}
          </div>
          <div className="info-item">
            <strong>Name:</strong> {user?.name || 'N/A'}
          </div>
        </div>

        <div className="info-card">
          <h2>Available Actions</h2>
          <p>TODO: Add user-specific features here</p>
          <ul>
            <li>Browse available cars</li>
            <li>View bookings</li>
            <li>Manage profile</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard

