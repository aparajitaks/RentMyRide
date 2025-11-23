import React from 'react'
import { navigateTo } from '../../App'
import './CustomerHome.css'

function CustomerHome({ user }) {

  const handleLinkClick = (e, path) => {
    e.preventDefault()
    navigateTo(path)
  }

  return (
    <div className="customer-home">
      <div className="home-container">
        <h1>Welcome, {user?.name || 'Customer'}!</h1>
        
        <div className="home-actions">
          <a href="/customer/search" onClick={(e) => handleLinkClick(e, '/customer/search')} className="action-card search-card">
            <h2>Search for Cars</h2>
            <p>Find available cars in your city</p>
          </a>
          
          <a href="/customer/history" onClick={(e) => handleLinkClick(e, '/customer/history')} className="action-card history-card">
            <h2>Booking History</h2>
            <p>View your past and current bookings</p>
          </a>
          
          <a href="/customer/profile" onClick={(e) => handleLinkClick(e, '/customer/profile')} className="action-card profile-card">
            <h2>Profile</h2>
            <p>Manage your account settings</p>
          </a>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <h3>Active Bookings</h3>
            <p className="stat-number">0</p>
          </div>
          <div className="stat-card">
            <h3>Total Trips</h3>
            <p className="stat-number">0</p>
          </div>
          <div className="stat-card">
            <h3>Saved Businesses</h3>
            <p className="stat-number">0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerHome




