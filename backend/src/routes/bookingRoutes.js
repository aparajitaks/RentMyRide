const express = require('express')
const { authenticate } = require('../middleware/authMiddleware.js')
const {
  createBookingRequest,
  getBookingDetails,
  processPayment,
  approveBooking,
  payBooking,
  cancelBooking,
  completeBooking,
  listMyBookings,
  listVehicleBookings
} = require('../controllers/bookingController.js')

const router = express.Router()

router.post('/request', authenticate, createBookingRequest)
router.get('/mine', authenticate, listMyBookings)
router.get('/vehicle/:id', authenticate, listVehicleBookings)
router.get('/:id', authenticate, getBookingDetails)
router.post('/:id/approve', authenticate, approveBooking)
router.post('/:id/pay', authenticate, payBooking)
router.post('/:id/cancel', authenticate, cancelBooking)
router.post('/:id/complete', authenticate, completeBooking)
router.post('/:id/payment', authenticate, processPayment)

module.exports = router

