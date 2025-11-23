import React from 'react'
import Navbar from '../components/Navbar'
import NotificationBar from '../components/NotificationBar'
import './Layout.css'

function OwnerLayout({ children, user, logout }) {
  return (
    <div className="layout">
      <Navbar userType="owner" user={user} logout={logout} />
      <NotificationBar />
      <main className="layout-content">
        {children}
      </main>
    </div>
  )
}

export default OwnerLayout

