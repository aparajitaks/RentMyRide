import React, { useState } from 'react'
import { navigateTo } from '../App'
import './LoginPage.css'

function LoginPage({ login }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState('customer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password, userType)
    
    if (result.success) {
      navigateTo(userType === 'customer' ? '/customer' : '/owner')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleLinkClick = (e, path) => {
    e.preventDefault()
    navigateTo(path)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>RentMyRide</h1>
        <h2>Login</h2>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>User Type</label>
            <div className="user-type-selector">
              <button
                type="button"
                className={userType === 'customer' ? 'active' : ''}
                onClick={() => setUserType('customer')}
              >
                Customer
              </button>
              <button
                type="button"
                className={userType === 'owner' ? 'active' : ''}
                onClick={() => setUserType('owner')}
              >
                Owner
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#666'
        }}>
          <strong>Example Credentials:</strong><br />
          <strong>Customer:</strong> customer@example.com / password123<br />
          <strong>Owner:</strong> owner@example.com / password123
        </div>

        <p className="terms-link">
          By logging in, you agree to our <a href="/terms" onClick={(e) => handleLinkClick(e, '/terms')}>Terms and Conditions</a>
        </p>
      </div>
    </div>
  )
}

export default LoginPage

