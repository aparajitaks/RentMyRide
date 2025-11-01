// frontend/src/components/CarDetails.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom'; // Gets the :id from the URL
import Flatpickr from 'react-flatpickr'; // The React calendar component

// Import the flatpickr CSS
import "flatpickr/dist/themes/material_blue.css"; 
// You can change the theme, e.g., "flatpickr/dist/flatpickr.min.css"

// Define the shape of the disabled dates
type DisabledDateRange = {
  from: string;
  to: string;
};

export const CarDetails = () => {
  // 1. Get the car ID from the URL (e.g., /cars/1)
  const { id } = useParams<{ id: string }>();

  // 2. State variables
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [bookedDates, setBookedDates] = useState<DisabledDateRange[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // 3. Function to fetch availability
  const fetchAvailability = useCallback(async () => {
    try {
      const response = await fetch(`/api/cars/${id}/availability`);
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      const data: DisabledDateRange[] = await response.json();
      setBookedDates(data);
    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
    }
  }, [id]); // This function depends on the 'id'

  // 4. Fetch availability when the component first loads
  useEffect(() => {
    if (id) {
      fetchAvailability();
    }
  }, [id, fetchAvailability]); // Run this effect when 'id' or the function changes

  // 5. Function to handle the booking
  const handleBooking = async () => {
    if (selectedDates.length < 2) {
      setMessage('Please select a start and end date.');
      setMessageType('error');
      return;
    }

    const [startDate, endDate] = selectedDates;
    const token = localStorage.getItem('token'); // Get token from Phase 1

    if (!token) {
      setMessage('You must be logged in to book.');
      setMessageType('error');
      return;
    }

    setMessage('Processing...');
    setMessageType('info');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          carId: parseInt(id!),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (response.status === 409) { // Conflict
        throw new Error('These dates are unavailable. Please select new dates.');
      }
      if (!response.ok) {
        throw new Error('Booking failed. Please try again.');
      }

      // Success!
      setMessage('Booking successful!');
      setMessageType('success');
      setSelectedDates([]); // Clear the calendar
      
      // Refresh the list of booked dates
      fetchAvailability(); 

    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
    }
  };

  // 6. The component's UI
  return (
    <div className="car-details-container">
      <h2>Book This Car (ID: {id})</h2>
      <p>Select your booking dates:</p>
      
      <Flatpickr
        value={selectedDates}
        options={{
          mode: "range",
          dateFormat: "Y-m-d",
          minDate: "today",
          disable: bookedDates, // This disables the dates from our API
        }}
        // Update state when the user changes the date
        onChange={(dates) => {
          setSelectedDates(dates as Date[]);
        }}
      />
      
      <button onClick={handleBooking} className="book-button">
        Book Now
      </button>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
    </div>
  );
};

// Default export is good practice for "page" components
export default CarDetails;