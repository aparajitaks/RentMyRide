import React, { useState, useEffect } from 'react'
import { navigateTo } from '../../App'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../utils/api'
import './OwnerDashboard.css'

function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeRentals: 0,
    pendingRequests: 0,
    completedBookings: 0,
    averageRating: 0,
    totalRevenue: 0
  })
  const [growthData, setGrowthData] = useState([])
  const [requests, setRequests] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, growthRes, requestsRes, reviewsRes] = await Promise.all([
        api.get('/owner/dashboard/stats'),
        api.get('/owner/dashboard/growth'),
        api.get('/owner/requests?status=all'),
        api.get('/owner/reviews?limit=5')
      ])
      setStats(statsRes.data)
      setGrowthData(growthRes.data)
      setRequests(requestsRes.data)
      setReviews(reviewsRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAction = async (requestId, action) => {
    try {
      await api.post(`/owner/requests/${requestId}/${action}`)
      fetchDashboardData()
    } catch (error) {
      alert(`Failed to ${action} request`)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="owner-dashboard">
      <div className="dashboard-container">
        <h1>Dashboard</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <p className="stat-number">{stats.totalBookings}</p>
          </div>
          <div className="stat-card">
            <h3>Active Rentals</h3>
            <p className="stat-number">{stats.activeRentals}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Requests</h3>
            <p className="stat-number">{stats.pendingRequests}</p>
          </div>
          <div className="stat-card">
            <h3>Average Rating</h3>
            <p className="stat-number">{stats.averageRating.toFixed(1)} ⭐</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-number">${stats.totalRevenue}</p>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-left">
            <div className="chart-section">
              <h2>Business Growth</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="bookings" stroke="#667eea" name="Bookings" />
                  <Line type="monotone" dataKey="revenue" stroke="#28a745" name="Revenue ($)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="reviews-section">
              <h2>Recent Reviews</h2>
              {reviews.length === 0 ? (
                <p className="no-reviews">No reviews yet</p>
              ) : (
                <div className="reviews-list">
                  {reviews.map(review => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <strong>{review.customerName}</strong>
                        <span className="review-rating">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                      </div>
                      <p className="review-text">{review.comment}</p>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-right">
            <div className="requests-panel">
              <h2>Recent Requests</h2>
              {requests.length === 0 ? (
                <p className="no-requests">No requests</p>
              ) : (
                <div className="requests-list">
                  {requests.slice(0, 5).map(request => (
                    <div key={request.id} className="request-item">
                      <div className="request-info">
                        <strong>{request.carMake} {request.carModel}</strong>
                        <p>{request.customerName}</p>
                        <p className="request-date">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="request-status">
                        <span className={`status-badge ${request.status}`}>
                          {request.status}
                        </span>
                        {request.status === 'pending' && (
                          <div className="request-actions">
                            <button
                              onClick={() => handleRequestAction(request.id, 'approve')}
                              className="approve-button"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRequestAction(request.id, 'reject')}
                              className="reject-button"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <a href="/owner/requests" onClick={(e) => { e.preventDefault(); navigateTo('/owner/requests'); }} className="view-all-link">
                View All Requests
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OwnerDashboard




