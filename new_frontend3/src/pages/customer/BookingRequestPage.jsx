import React, { useState, useEffect } from 'react'
import { navigateTo } from '../../App'
import api from '../../utils/api'
import './BookingRequestPage.css'

function BookingRequestPage({ businessId, carId, user }) {
  const [car, setCar] = useState(null)
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    startDate: '',
    endDate: '',
    specialRequests: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [carRes, profileRes] = await Promise.all([
        api.get(`/cars/${carId}`),
        api.get('/customer/profile')
      ])
      setCar(carRes.data)
      setProfile(profileRes.data)
      // Auto-fill from profile
      if (profileRes.data.address) {
        setFormData(prev => ({
          ...prev,
          pickupLocation: profileRes.data.address
        }))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays || 0
    }
    return 0
  }

  const calculateTotal = () => {
    const days = calculateDays()
    return car ? days * car.pricePerDay : 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const bookingData = {
        carId,
        businessId,
        ...formData,
        customerId: user.id
      }
      
      const response = await api.post('/bookings/request', bookingData)
      setMessage('Booking request submitted successfully! Waiting for owner approval.')
      
      setTimeout(() => {
        navigateTo('/customer/history')
      }, 2000)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to submit booking request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="booking-request-page">
      <div className="booking-container">
        <h1>Booking Request</h1>

        {car && (
          <div className="car-summary">
            <h2>{car.make} {car.model} ({car.year})</h2>
            <p>Price: ${car.pricePerDay}/day</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-section">
            <h3>Your Details</h3>
            <div className="auto-filled-info">
              <p><strong>Name:</strong> {profile?.name || user?.name}</p>
              <p><strong>Email:</strong> {profile?.email || user?.email}</p>
              <p><strong>Phone:</strong> {profile?.phone || 'Not provided'}</p>
            </div>
          </div>

          <div className="form-section">
            <h3>Rental Details</h3>
            
            <div className="form-group">
              <label>Pickup Location *</label>
              <input
                type="text"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                required
                placeholder="Where do you want to pick up the car?"
              />
            </div>

            <div className="form-group">
              <label>Drop-off Location</label>
              <input
                type="text"
                name="dropoffLocation"
                value={formData.dropoffLocation}
                onChange={handleChange}
                placeholder="Where will you return the car? (optional)"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Special Requests</label>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows="4"
                placeholder="Any special requests or notes..."
              />
            </div>
          </div>

          <div className="booking-summary">
            <div className="summary-row">
              <span>Rental Days:</span>
              <span>{calculateDays()} days</span>
            </div>
            <div className="summary-row">
              <span>Price per Day:</span>
              <span>${car?.pricePerDay || 0}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span>${calculateTotal()}</span>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigateTo('/customer')}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="submit-button"
            >
              {submitting ? 'Submitting...' : 'Submit Booking Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookingRequestPage


