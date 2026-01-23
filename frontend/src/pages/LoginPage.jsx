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
      <div className="login-split-container">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <h1 className="brand-title">RentMyRide</h1>
            <p className="brand-tagline">Your journey starts here</p>
            <div className="brand-features">
              <div className="feature-item">
                {/* <span className="feature-icon">🚗</span> */}
                <span>Wide Selection of Vehicles</span>
              </div>
              <div className="feature-item">
                {/* <span className="feature-icon">⚡</span> */}
                <span>Instant Booking</span>
              </div>
              <div className="feature-item">
                {/* <span className="feature-icon">🔒</span> */}
                <span>Secure & Reliable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-section">
          <div className="login-container">
            <h2>Welcome Back</h2>
            <p className="login-subtitle">Sign in to continue your journey</p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>I am a</label>
                <div className="user-type-selector">
                  <button
                    type="button"
                    className={userType === 'customer' ? 'active' : ''}
                    onClick={() => setUserType('customer')}
                  >
                    <span className="user-icon">👤</span>
                    Customer
                  </button>
                  <button
                    type="button"
                    className={userType === 'owner' ? 'active' : ''}
                    onClick={() => setUserType('owner')}
                  >
                    <span className="user-icon">🏢</span>
                    Owner
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" disabled={loading} className="submit-button">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="signup-link">
              Don't have an account? <a href="#/signup">Create one now</a>
            </p>

            <p className="terms-link">
              By logging in, you agree to our <a href="/terms" onClick={(e) => handleLinkClick(e, '/terms')}>Terms and Conditions</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

