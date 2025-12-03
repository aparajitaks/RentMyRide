import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './OwnerProfile.css'

function OwnerProfile({ user, updateUser }) {
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    businessName: user?.business?.name || '',
    address: user?.profile?.address || '',
    city: user?.profile?.city || '',
    bio: user?.profile?.bio || ''
  })
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    totalBookings: 0
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/owner/profile')
      const data = response.data
      setProfile({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        businessName: data.business?.name || '',
        address: data.profile?.address || '',
        city: data.profile?.city || '',
        bio: data.profile?.bio || ''
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/owner/profile/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const payload = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        businessName: profile.businessName,
        address: profile.address,
        city: profile.city,
        bio: profile.bio
      }

      const response = await api.put('/owner/profile', payload)
      updateUser(response.data)
      setMessage('Profile updated successfully!')
    } catch (error) {
      console.error('Update error:', error)
      setMessage('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="owner-profile">
      <div className="profile-container">
        <h1>My Profile</h1>

        <div className="profile-stats">
          <div className="stat-item">
            <h3>Total Reviews</h3>
            <p>{stats.totalReviews}</p>
          </div>
          <div className="stat-item">
            <h3>Average Rating</h3>
            <p>{stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'} ⭐</p>
          </div>
          <div className="stat-item">
            <h3>Total Bookings</h3>
            <p>{stats.totalBookings}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                required
                disabled
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              name="businessName"
              value={profile.businessName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Business Address</label>
            <textarea
              name="address"
              value={profile.address}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={profile.city}
              onChange={handleChange}
              placeholder="e.g. New York"
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              rows="3"
              placeholder="Tell us about yourself and your business..."
            />
          </div>

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default OwnerProfile




