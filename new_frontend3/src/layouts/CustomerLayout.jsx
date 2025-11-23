import React from 'react'
import Navbar from '../components/Navbar'
import './Layout.css'

function CustomerLayout({ children, user, logout }) {
  return (
    <div className="layout">
      <Navbar userType="customer" user={user} logout={logout} />
      <main className="layout-content">
        {children}
      </main>
    </div>
  )
}

export default CustomerLayout

