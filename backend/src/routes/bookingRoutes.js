const express = require('express')
const { authenticate } = require('../middleware/authMiddleware.js')
const {
  createBookingRequest,
  getBookingDetails,
  processPayment
} = require('../controllers/bookingController.js')

const router = express.Router()

router.post('/request', authenticate, createBookingRequest)
router.get('/:id', authenticate, getBookingDetails)
router.post('/:id/payment', authenticate, processPayment)

module.exports = router

