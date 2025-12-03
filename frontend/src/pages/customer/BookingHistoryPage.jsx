import React, { useState, useEffect } from 'react'
import { navigateTo } from '../../App'
import api from '../../utils/api'
import './BookingHistoryPage.css'

function BookingHistoryPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') 

  useEffect(() => {
    fetchBookings()
  }, [filter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/customer/bookings?status=${filter}`)
      setBookings(response.data)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'pending', text: 'Pending Approval' },
      confirmed: { class: 'approved', text: 'Approved - Payment Required' },
      active: { class: 'active', text: 'Active Rental' },
      completed: { class: 'completed', text: 'Completed' },
      cancelled: { class: 'cancelled', text: 'Cancelled' }
    }
    const badge = badges[status] || badges.pending
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>
  }

  const handlePayment = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/payment`)
      fetchBookings()
    } catch (error) {
      alert('Payment failed. Please try again.')
    }
  }

  if (loading) {
    return <div className="loading">Loading bookings...</div>
  }

  return (
    <div className="booking-history-page">
      <div className="history-container">
        <h1>Booking History</h1>

        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="no-bookings">
            <p>No bookings found</p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <div>
                    <h3>{booking.carMake} {booking.carModel}</h3>
                    <p className="business-name">{booking.businessName}</p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                <div className="booking-details">
                  <div className="detail-item">
                    <strong>Pickup:</strong> {booking.pickupLocation}
                  </div>
                  <div className="detail-item">
                    <strong>Dates:</strong> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                  </div>
                  <div className="detail-item">
                    <strong>Total:</strong> ₹{booking.totalAmount}
                  </div>
                </div>

                <div className="booking-actions">
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handlePayment(booking.id)}
                      className="payment-button"
                    >
                      Proceed to Payment
                    </button>
                  )}
                  {booking.status === 'completed' && (
                    <a
                      href={`/customer/history/rate/${booking.id}`}
                      onClick={(e) => { e.preventDefault(); navigateTo(`/customer/history/rate/${booking.id}`); }}
                      className="rate-link"
                    >
                      Rate & Review
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingHistoryPage


