import { useState } from 'react'
import { navigateTo } from '../App'
import api from '../utils/api'
import './SignupPage.css'

function SignupPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        city: '',
        userType: 'customer'
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
            setError('Please fill in all required fields')
            return
        }

        if (formData.userType === 'owner' && !formData.city) {
            setError('City is required for owners')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long')
            return
        }

        setLoading(true)

        try {
            const response = await api.post('/auth/signup', {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                city: formData.city,
                userType: formData.userType
            })

            
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data))

            
            if (response.data.userType === 'customer') {
                navigateTo('/customer')
            } else {
                navigateTo('/owner')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="signup-page">
            <div className="signup-split-container">
                {/* Left Side - Branding */}
                <div className="signup-branding">
                    <div className="branding-content">
                        <h1 className="brand-title">RentMyRide</h1>
                        <p className="brand-tagline">Start your journey today</p>
                        <div className="brand-features">
                            <div className="feature-item">
                                <span className="feature-icon">🚗</span>
                                <span>Wide Selection of Vehicles</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">⚡</span>
                                <span>Instant Booking</span>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">🔒</span>
                                <span>Secure & Reliable</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Signup Form */}
                <div className="signup-form-section">
                    <div className="signup-container">
                        <h2>Create Account</h2>
                        <p className="signup-subtitle">Join RentMyRide today</p>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit} className="signup-form">
                            <div className="form-group">
                                <label>I am a</label>
                                <div className="user-type-selector">
                                    <button
                                        type="button"
                                        className={formData.userType === 'customer' ? 'active' : ''}
                                        onClick={() => setFormData({ ...formData, userType: 'customer' })}
                                    >
                                        <span className="user-icon">👤</span>
                                        Customer
                                    </button>
                                    <button
                                        type="button"
                                        className={formData.userType === 'owner' ? 'active' : ''}
                                        onClick={() => setFormData({ ...formData, userType: 'owner' })}
                                    >
                                        <span className="user-icon">🏢</span>
                                        Owner
                                    </button>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="firstName">First Name</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="Enter first name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lastName">Last Name</label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Enter last name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                />
                            </div>

                            {formData.userType === 'owner' && (
                                <div className="form-group">
                                    <label htmlFor="city">City</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="e.g. New York"
                                        required
                                    />
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Min. 6 characters"
                                        required
                                        minLength="6"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Re-enter password"
                                        required
                                        minLength="6"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="submit-button" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        <p className="login-link">
                            Already have an account? <a href="#/login">Sign in</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignupPage
