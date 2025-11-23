import React, { useState, useEffect } from 'react'
import { navigateTo } from '../../App'
import api from '../../utils/api'
import './BusinessDetailPage.css'

function BusinessDetailPage({ businessId }) {
  const id = businessId
  const [business, setBusiness] = useState(null)
  const [cars, setCars] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('cars')

  useEffect(() => {
    fetchBusinessDetails()
  }, [id])

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true)
      const [businessRes, carsRes, reviewsRes] = await Promise.all([
        api.get(`/businesses/${id}`),
        api.get(`/businesses/${id}/cars`),
        api.get(`/businesses/${id}/reviews`)
      ])
      setBusiness(businessRes.data)
      setCars(carsRes.data)
      setReviews(reviewsRes.data)
    } catch (error) {
      console.error('Failed to fetch business details:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating) => {
    const stars = []
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < rating ? 'star filled' : 'star'}>
          ★
        </span>
      )
    }
    return stars
  }

  if (loading) {
    return <div className="loading">Loading business details...</div>
  }

  if (!business) {
    return <div className="error">Business not found</div>
  }

  return (
    <div className="business-detail-page">
      <div className="business-detail-container">
        <div className="business-header">
          <h1>{business.name}</h1>
          <div className="business-meta">
            <div className="rating">
              {renderStars(Math.round(business.rating || 0))}
              <span>({business.rating || 0})</span>
            </div>
            <p className="owner">Owner: {business.ownerName}</p>
            <p className="location">{business.address}</p>
          </div>
        </div>

        <div className="tabs">
          <button
            className={activeTab === 'cars' ? 'active' : ''}
            onClick={() => setActiveTab('cars')}
          >
            Available Cars
          </button>
          <button
            className={activeTab === 'reviews' ? 'active' : ''}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {activeTab === 'cars' && (
          <div className="cars-section">
            {cars.length === 0 ? (
              <p className="no-cars">No cars available at the moment</p>
            ) : (
              <div className="cars-grid">
                {cars.map(car => (
                  <div key={car.id} className="car-card">
                    <div className="car-image">
                      {car.imageUrl ? (
                        <img src={car.imageUrl} alt={car.model} />
                      ) : (
                        <div className="car-placeholder">No Image</div>
                      )}
                    </div>
                    <div className="car-info">
                      <h3>{car.make} {car.model}</h3>
                      <p className="car-year">{car.year}</p>
                      <div className="car-details">
                        <span>Seats: {car.seats}</span>
                        <span>Transmission: {car.transmission}</span>
                      </div>
                      <div className="car-price">
                        <span className="price">${car.pricePerDay}/day</span>
                      </div>
                      <button
                        onClick={() => navigateTo(`/customer/booking/${id}/${car.id}`)}
                        className="book-button"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews-section">
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet</p>
            ) : (
              <div className="reviews-list">
                {reviews.map(review => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <strong>{review.customerName}</strong>
                        <div className="review-rating">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="review-text">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BusinessDetailPage




