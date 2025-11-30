import React, { useState, useEffect } from 'react'
import { navigateTo } from '../../App'
import api from '../../utils/api'
import './OwnerCarsList.css'

function OwnerCarsList() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') 

  useEffect(() => {
    fetchCars()
  }, [filter])

  const fetchCars = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/owner/cars?status=${filter}`)
      setCars(response.data)
    } catch (error) {
      console.error('Failed to fetch cars:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (carId) => {
    if (!confirm('Are you sure you want to delete this car?')) return

    try {
      await api.delete(`/owner/cars/${carId}`)
      fetchCars()
    } catch (error) {
      alert('Failed to delete car')
    }
  }

  if (loading) {
    return <div className="loading">Loading cars...</div>
  }

  return (
    <div className="owner-cars-list">
      <div className="cars-container">
        <div className="cars-header">
          <h1>My Cars</h1>
          <a href="/owner/cars/new" onClick={(e) => { e.preventDefault(); navigateTo('/owner/cars/new'); }} className="add-car-button">
            Add New Car
          </a>
        </div>

        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All Cars
          </button>
          <button
            className={filter === 'available' ? 'active' : ''}
            onClick={() => setFilter('available')}
          >
            Available
          </button>
          <button
            className={filter === 'booked' ? 'active' : ''}
            onClick={() => setFilter('booked')}
          >
            Booked
          </button>
        </div>

        {cars.length === 0 ? (
          <div className="no-cars">
            <p>No cars found. Add your first car to get started!</p>
          </div>
        ) : (
          <div className="cars-grid">
            {cars.map(car => (
              <div key={car.id} className="car-card">
                <div className="car-image">
                  {car.imageUrl ? (
                    <img src={car.imageUrl} alt={`${car.make} ${car.model}`} />
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
                  <div className="car-status">
                    <span className={`status-badge ${car.status}`}>
                      {car.status}
                    </span>
                    <span className="car-price">₹{car.pricePerDay}/day</span>
                  </div>
                  <div className="car-actions">
                    <a href={`/owner/cars/${car.id}/edit`} onClick={(e) => { e.preventDefault(); navigateTo(`/owner/cars/${car.id}/edit`); }} className="edit-button">
                      Edit
                    </a>
                    <button
                      onClick={() => handleDelete(car.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OwnerCarsList




