import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const BusinessDashboard = () => {
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
          <h1>Business Dashboard</h1>
          <p>Welcome back, {user?.businessName || user?.name || user?.email}!</p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="info-card">
          <h2>Business Profile</h2>
          <div className="info-item">
            <strong>Business Name:</strong> {user?.businessName || 'N/A'}
          </div>
          <div className="info-item">
            <strong>Email:</strong> {user?.email}
          </div>
          <div className="info-item">
            <strong>Phone:</strong> {user?.phone || 'N/A'}
          </div>
          <div className="info-item">
            <strong>Role:</strong> {user?.role}
          </div>
        </div>

        <div className="info-card">
          <h2>Business Actions</h2>
          <p>TODO: Add business-specific features here</p>
          <ul>
            <li>Manage car fleet</li>
            <li>View bookings</li>
            <li>Analytics & Reports</li>
            <li>Manage profile</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default BusinessDashboard

