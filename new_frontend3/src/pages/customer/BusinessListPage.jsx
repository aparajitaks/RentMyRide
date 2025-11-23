import React, { useState, useEffect } from 'react'
import { navigateTo } from '../../App'
import api from '../../utils/api'
import './BusinessListPage.css'

function BusinessListPage() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('')

  useEffect(() => {
    const extractCityAndFetch = () => {
      // Extract city from URL hash
      const hash = location.hash.slice(1)
      const urlParams = new URLSearchParams(hash.split('?')[1] || '')
      const cityParam = urlParams.get('city') || ''
      setCity(cityParam)
      
      if (cityParam) {
        fetchBusinesses(cityParam)
      }
    }
    
    extractCityAndFetch()
    
    // Listen for hash changes to update when query params change
    const handleHashChange = () => extractCityAndFetch()
    addEventListener('hashchange', handleHashChange)
    return () => removeEventListener('hashchange', handleHashChange)
  }, [])

  const fetchBusinesses = async (cityName) => {
    try {
      setLoading(true)
      const response = await api.get(`/businesses/search?city=${encodeURIComponent(cityName)}`)
      setBusinesses(response.data)
    } catch (error) {
      console.error('Failed to fetch businesses:', error)
    } finally {
      setLoading(false)
    }
  }


  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>)
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>)
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<span key={i} className="star">★</span>)
    }
    return stars
  }

  const getPriceRange = (priceRange) => {
    const ranges = {
      '$': 'Budget',
      '$$': 'Moderate',
      '$$$': 'Expensive',
      '$$$$': 'Very Expensive'
    }
    return ranges[priceRange] || priceRange
  }

  if (loading) {
    return <div className="loading">Loading businesses...</div>
  }

  return (
    <div className="business-list-page">
      <div className="business-list-container">
        <h1>Businesses in {city}</h1>
        
        {businesses.length === 0 ? (
          <div className="no-results">
            <p>No businesses found in {city}</p>
            <button onClick={() => navigateTo('/customer/search')} className="back-button">
              Search Again
            </button>
          </div>
        ) : (
          <div className="businesses-grid">
            {businesses.map(business => (
              <div
                key={business.id}
                className="business-card"
                onClick={() => navigateTo(`/customer/business/${business.id}`)}
              >
                <div className="business-header">
                  <h2>{business.name}</h2>
                  <span className="price-range">{getPriceRange(business.priceRange)}</span>
                </div>
                
                <div className="business-info">
                  <p className="owner-name">Owner: {business.ownerName}</p>
                  <div className="rating">
                    {renderStars(business.rating || 0)}
                    <span className="rating-value">({business.rating || 0})</span>
                  </div>
                  <p className="location">{business.address}</p>
                </div>

                <div className="business-stats">
                  <span>{business.totalCars || 0} cars available</span>
                  <span>{business.totalReviews || 0} reviews</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BusinessListPage




