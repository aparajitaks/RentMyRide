import React from 'react'
import { navigateTo } from '../App'
import './Navbar.css'

function Navbar({ userType, user, logout }) {

  const handleLogout = () => {
    logout()
    navigateTo('/login')
  }

  const handleLinkClick = (e, path) => {
    e.preventDefault()
    navigateTo(path)
  }

  const customerLinks = [
    { path: '/customer', label: 'Home' },
    { path: '/customer/search', label: 'Search' },
    { path: '/customer/history', label: 'Bookings' },
    { path: '/customer/profile', label: 'Profile' },
    { path: '/customer/complaints', label: 'Complaints' }
  ]

  const ownerLinks = [
    { path: '/owner', label: 'Dashboard' },
    { path: '/owner/calendar', label: 'Calendar' },
    { path: '/owner/cars', label: 'Cars' },
    { path: '/owner/vehicles', label: 'Vehicles' },
    { path: '/owner/profile', label: 'Profile' },
    { path: '/owner/complaints', label: 'Complaints' }
  ]

  const links = userType === 'customer' ? customerLinks : ownerLinks
  const homePath = userType === 'customer' ? '/customer' : '/owner'

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href={homePath} onClick={(e) => handleLinkClick(e, homePath)} className="navbar-brand">
          RentMyRide
        </a>
        <div className="navbar-links">
          {links.map(link => (
            <a key={link.path} href={link.path} onClick={(e) => handleLinkClick(e, link.path)} className="navbar-link">
              {link.label}
            </a>
          ))}
          <button onClick={handleLogout} className="navbar-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar




