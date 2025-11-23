import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import './ComplaintPage.css'

function ComplaintPage({ user }) {
  const [complaints, setComplaints] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: '', // 'customer' or 'owner'
    targetId: '',
    bookingId: '',
    title: '',
    description: '',
    category: ''
  })
  const [bookings, setBookings] = useState([])
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComplaints()
    fetchEligibleBookings()
  }, [])

  const fetchComplaints = async () => {
    try {
      const endpoint = user.userType === 'customer'
        ? '/customer/complaints'
        : '/owner/complaints'
      const response = await api.get(endpoint)
      setComplaints(response.data)
    } catch (error) {
      console.error('Failed to fetch complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEligibleBookings = async () => {
    try {
      const endpoint = user.userType === 'customer'
        ? '/customer/bookings?status=completed'
        : '/owner/bookings?status=completed'
      const response = await api.get(endpoint)
      const eligibleBookings = response.data.filter(booking => {
        const completedDate = new Date(booking.completedAt || booking.endDate)
        const daysSince = (new Date() - completedDate) / (1000 * 60 * 60 * 24)
        return daysSince <= 5
      })
      setBookings(eligibleBookings)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check if booking is within 5 days
    const selectedBooking = bookings.find(b => b.id === formData.bookingId)
    if (selectedBooking) {
      const completedDate = new Date(selectedBooking.completedAt || selectedBooking.endDate)
      const daysSince = (new Date() - completedDate) / (1000 * 60 * 60 * 24)
      if (daysSince > 5) {
        alert('Complaints can only be filed within 5 days of completing a transaction.')
        return
      }
    }

    setSubmitting(true)
    try {
      const endpoint = user.userType === 'customer'
        ? '/customer/complaints'
        : '/owner/complaints'
      await api.post(endpoint, formData)
      setShowForm(false)
      setFormData({
        type: '',
        targetId: '',
        bookingId: '',
        title: '',
        description: '',
        category: ''
      })
      fetchComplaints()
      alert('Complaint filed successfully!')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to file complaint')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'pending', text: 'Pending' },
      investigating: { class: 'investigating', text: 'Under Investigation' },
      resolved: { class: 'resolved', text: 'Resolved' },
      dismissed: { class: 'dismissed', text: 'Dismissed' }
    }
    const badge = badges[status] || badges.pending
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>
  }

  if (loading) {
    return <div className="loading">Loading complaints...</div>
  }

  return (
    <div className="complaint-page">
      <div className="complaint-container">
        <div className="complaint-header">
          <h1>Complaints</h1>
          {bookings.length > 0 && (
            <button onClick={() => setShowForm(!showForm)} className="new-complaint-button">
              {showForm ? 'Cancel' : 'File New Complaint'}
            </button>
          )}
        </div>

        {bookings.length === 0 && !showForm && (
          <div className="no-eligible-bookings">
            <p>You can only file complaints for transactions completed within the last 5 days.</p>
            <p>No eligible bookings found.</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="complaint-form">
            <h2>File a Complaint</h2>
            
            <div className="form-group">
              <label>Booking *</label>
              <select
                name="bookingId"
                value={formData.bookingId}
                onChange={handleChange}
                required
              >
                <option value="">Select a booking</option>
                {bookings.map(booking => (
                  <option key={booking.id} value={booking.id}>
                    {booking.carMake} {booking.carModel} - {new Date(booking.endDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                {user.userType === 'customer' ? (
                  <>
                    <option value="overcharge">Overcharging</option>
                    <option value="false_claims">False Claims About Car</option>
                    <option value="damage_dispute">Damage Dispute</option>
                    <option value="other">Other</option>
                  </>
                ) : (
                  <>
                    <option value="damage">Vehicle Damage</option>
                    <option value="unpaid_fine">Unpaid Legal Fine</option>
                    <option value="misconduct">Customer Misconduct</option>
                    <option value="other">Other</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Brief description of the issue"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Provide detailed information about the complaint..."
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="submit-button"
              >
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        )}

        <div className="complaints-list">
          <h2>Your Complaints</h2>
          {complaints.length === 0 ? (
            <div className="no-complaints">
              <p>No complaints filed yet</p>
            </div>
          ) : (
            <div className="complaints-grid">
              {complaints.map(complaint => (
                <div key={complaint.id} className="complaint-card">
                  <div className="complaint-header-card">
                    <h3>{complaint.title}</h3>
                    {getStatusBadge(complaint.status)}
                  </div>
                  <div className="complaint-info">
                    <p><strong>Category:</strong> {complaint.category}</p>
                    <p><strong>Filed:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</p>
                    {complaint.resolvedAt && (
                      <p><strong>Resolved:</strong> {new Date(complaint.resolvedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                  <p className="complaint-description">{complaint.description}</p>
                  {complaint.resolution && (
                    <div className="complaint-resolution">
                      <strong>Resolution:</strong>
                      <p>{complaint.resolution}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComplaintPage




