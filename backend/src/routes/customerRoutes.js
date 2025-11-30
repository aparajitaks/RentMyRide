
const express = require('express')
const { authenticate, requireRole } = require('../middleware/authMiddleware.js')
const {
  getProfile,
  updateProfile,
  getBookings,
  getTravelLog
} = require('../controllers/customerController.js')

const router = express.Router()


router.use(authenticate)
router.use(requireRole('CUSTOMER'))

router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.get('/bookings', getBookings)
router.get('/travel-log', getTravelLog)

module.exports = router

