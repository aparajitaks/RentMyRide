import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './CustomerProfile.css'

function CustomerProfile({ user, updateUser }) {
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    licenseNumber: '',
    dateOfBirth: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/customer/profile')
      setProfile(response.data)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
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
      console.log('Submitting profile update...', profile)
      const nameParts = profile.name.split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || ''

      const payload = {
        ...profile,
        firstName,
        lastName
      }
      console.log('Payload:', payload)

      const response = await api.put('/customer/profile', payload)
      console.log('Update response:', response.data)

      
      const updatedUser = { ...response.data, token: user.token }
      updateUser(updatedUser)
      setMessage('Profile updated successfully!')
    } catch (error) {
      console.error('Profile update failed:', error)
      setMessage('Failed to update profile: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="customer-profile">
      <div className="profile-container">
        <h1>My Profile</h1>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                required
              />
            </div>

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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={profile.dateOfBirth}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              value={profile.address}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>License Number</label>
            <input
              type="text"
              name="licenseNumber"
              value={profile.licenseNumber}
              onChange={handleChange}
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

export default CustomerProfile




