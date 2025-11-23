import React, { useState } from 'react'
import { navigateTo } from '../../App'
import api from '../../utils/api'
import './SearchPage.css'

function SearchPage() {
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!city.trim()) return

    setLoading(true)
    try {
      // Navigate to business list with city parameter
      navigateTo(`/customer/businesses?city=${encodeURIComponent(city)}`)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="search-page">
      <div className="search-container">
        <h1>Search for Car Rentals</h1>
        <p className="search-subtitle">Find available cars in your city</p>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Enter city name..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="search-input"
              required
            />
            <button type="submit" disabled={loading} className="search-button">
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        <div className="popular-cities">
          <h3>Popular Cities</h3>
          <div className="cities-list">
            {['Delhi', 'Mumbai', 'Pune', 'Lucknow', 'Bangalore', 'Hyderabad'].map(cityName => (
              <button
                key={cityName}
                onClick={() => {
                  setCity(cityName)
                  navigateTo(`/customer/businesses?city=${encodeURIComponent(cityName)}`)
                }}
                className="city-button"
              >
                {cityName}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchPage




