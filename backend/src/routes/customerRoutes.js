import express from 'express'
import { authenticate, requireRole } from '../middleware/authMiddleware.js'
import {
  getProfile,
  updateProfile,
  getBookings,
  getTravelLog
} from '../controllers/customerController.js'

const router = express.Router()

// All routes require authentication and customer role
router.use(authenticate)
router.use(requireRole('CUSTOMER'))

router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.get('/bookings', getBookings)
router.get('/travel-log', getTravelLog)

export default router

