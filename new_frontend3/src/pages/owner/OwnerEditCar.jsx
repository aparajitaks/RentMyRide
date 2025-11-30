import React, { useState, useEffect } from 'react'
import { navigateTo } from '../../App'
import api from '../../utils/api'
import './OwnerAddCar.css' 

function OwnerEditCar({ carId }) {
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: '',
        color: '',
        licensePlate: '',
        vin: '',
        mileage: '',
        seats: '5',
        transmission: 'Automatic',
        fuelType: 'Petrol',
        pricePerDay: '',
        pricePerWeek: '',
        pricePerMonth: '',
        description: '',
        features: ''
    })
    const [loading, setLoading] = useState(false)
    const [fetchingCar, setFetchingCar] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchCarDetails()
    }, [carId])

    const fetchCarDetails = async () => {
        try {
            setFetchingCar(true)
            const response = await api.get(`/owner/cars`)
            const cars = response.data
            const car = cars.find(c => c.id === carId)

            if (car) {
                
                setFormData({
                    make: car.make || '',
                    model: car.model || '',
                    year: car.year?.toString() || '',
                    color: car.color || '',
                    licensePlate: car.licensePlate || '',
                    vin: car.vin || '',
                    mileage: car.mileage?.toString() || '',
                    seats: car.seats?.toString() || '5',
                    transmission: car.transmission || 'Automatic',
                    fuelType: car.fuelType || 'Petrol',
                    pricePerDay: car.pricePerDay?.toString() || '',
                    pricePerWeek: car.pricePerWeek?.toString() || '',
                    pricePerMonth: car.pricePerMonth?.toString() || '',
                    description: car.description || '',
                    features: car.features || ''
                })
            } else {
                setError('Car not found')
            }
        } catch (err) {
            console.error('Failed to fetch car details:', err)
            setError('Failed to load car details')
        } finally {
            setFetchingCar(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await api.put(`/owner/cars/${carId}`, formData)
            navigateTo('/owner/cars')
        } catch (err) {
            console.error('Failed to update car:', err)
            setError(err.response?.data?.message || 'Failed to update car. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (fetchingCar) {
        return (
            <div className="owner-add-car">
                <div className="form-container">
                    <p>Loading car details...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="owner-add-car">
            <div className="form-container">
                <div className="form-header">
                    <h1>Edit Car</h1>
                    <button type="button" className="back-button" onClick={() => navigateTo('/owner/cars')}>
                        &larr; Back to Cars
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="car-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="make">Make *</label>
                            <input
                                type="text"
                                id="make"
                                name="make"
                                value={formData.make}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Toyota"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="model">Model *</label>
                            <input
                                type="text"
                                id="model"
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Camry"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="year">Year *</label>
                            <input
                                type="number"
                                id="year"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                required
                                min="1900"
                                max={new Date().getFullYear() + 1}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="color">Color</label>
                            <input
                                type="text"
                                id="color"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                placeholder="e.g. Black"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="licensePlate">License Plate</label>
                            <input
                                type="text"
                                id="licensePlate"
                                name="licensePlate"
                                value={formData.licensePlate}
                                onChange={handleChange}
                                disabled
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="vin">VIN</label>
                            <input
                                type="text"
                                id="vin"
                                name="vin"
                                value={formData.vin}
                                onChange={handleChange}
                                disabled
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="mileage">Mileage</label>
                            <input
                                type="number"
                                id="mileage"
                                name="mileage"
                                value={formData.mileage}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="seats">Seats *</label>
                            <input
                                type="number"
                                id="seats"
                                name="seats"
                                value={formData.seats}
                                onChange={handleChange}
                                required
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="transmission">Transmission *</label>
                            <select
                                id="transmission"
                                name="transmission"
                                value={formData.transmission}
                                onChange={handleChange}
                                required
                            >
                                <option value="Automatic">Automatic</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="fuelType">Fuel Type *</label>
                            <select
                                id="fuelType"
                                name="fuelType"
                                value={formData.fuelType}
                                onChange={handleChange}
                                required
                            >
                                <option value="Petrol">Petrol</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Electric">Electric</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="pricePerDay">Price Per Day (₹) *</label>
                            <input
                                type="number"
                                id="pricePerDay"
                                name="pricePerDay"
                                value={formData.pricePerDay}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="pricePerWeek">Price Per Week (₹)</label>
                            <input
                                type="number"
                                id="pricePerWeek"
                                name="pricePerWeek"
                                value={formData.pricePerWeek}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="pricePerMonth">Price Per Month (₹)</label>
                            <input
                                type="number"
                                id="pricePerMonth"
                                name="pricePerMonth"
                                value={formData.pricePerMonth}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="features">Features (comma separated)</label>
                        <textarea
                            id="features"
                            name="features"
                            value={formData.features}
                            onChange={handleChange}
                            placeholder="Bluetooth, GPS, Sunroof, Leather Seats"
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-button" onClick={() => navigateTo('/owner/cars')}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Updating Car...' : 'Update Car'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default OwnerEditCar
