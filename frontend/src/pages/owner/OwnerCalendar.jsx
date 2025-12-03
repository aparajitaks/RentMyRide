import React, { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import api from '../../utils/api'
import './OwnerCalendar.css'
import 'react-calendar/dist/Calendar.css'

function OwnerCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [bookings, setBookings] = useState([])
  const [selectedBookings, setSelectedBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await api.get('/owner/calendar/bookings')
      setBookings(response.data)
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    const dateStr = date.toISOString().split('T')[0]
    const bookingsForDate = bookings.filter(booking => {
      if (!booking.startDate || !booking.endDate) return false
      try {
        const start = new Date(booking.startDate).toISOString().split('T')[0]
        const end = new Date(booking.endDate).toISOString().split('T')[0]
        return dateStr >= start && dateStr <= end
      } catch (e) {
        return false
      }
    })
    setSelectedBookings(bookingsForDate)
  }

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0]
      const hasBooking = bookings.some(booking => {
        if (!booking.startDate || !booking.endDate) return false
        try {
          const start = new Date(booking.startDate).toISOString().split('T')[0]
          const end = new Date(booking.endDate).toISOString().split('T')[0]
          return dateStr >= start && dateStr <= end
        } catch (e) {
          return false
        }
      })
      return hasBooking ? 'has-booking' : null
    }
  }

  if (loading) {
    return <div className="loading">Loading calendar...</div>
  }

  return (
    <div className="owner-calendar">
      <div className="calendar-container">
        <h1>Booking Calendar</h1>

        <div className="calendar-content">
          <div className="calendar-wrapper">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              tileClassName={tileClassName}
            />
          </div>

          <div className="bookings-panel">
            <h2>Bookings for {selectedDate.toLocaleDateString()}</h2>
            {selectedBookings.length === 0 ? (
              <p className="no-bookings">No bookings for this date</p>
            ) : (
              <div className="bookings-list">
                {selectedBookings.map(booking => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-header">
                      <strong>{booking.carMake} {booking.carModel}</strong>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="customer-name">Customer: {booking.customerName}</p>
                    <p className="booking-dates">
                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                    <p className="booking-total">Total: ₹{booking.totalAmount}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OwnerCalendar




