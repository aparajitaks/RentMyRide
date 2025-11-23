import express from 'express'
import { authenticate, requireRole } from '../middleware/authMiddleware.js'
import {
  getProfile,
  updateProfile,
  getProfileStats,
  getDashboardStats,
  getDashboardGrowth,
  getRequests,
  approveRequest,
  rejectRequest,
  getCalendarBookings,
  getCars,
  createCar,
  updateCar,
  deleteCar,
  getReviews,
  getVehicles,
  getVehicleDocuments,
  uploadVehicleDocument,
  getVehicleReminders,
  createVehicleReminder,
  getNotifications
} from '../controllers/ownerController.js'
import multer from 'multer'

const router = express.Router()
const upload = multer({ dest: 'uploads/' })

// All routes require authentication and owner role
router.use(authenticate)
router.use(requireRole('OWNER'))

// Profile routes
router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.get('/profile/stats', getProfileStats)

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats)
router.get('/dashboard/growth', getDashboardGrowth)

// Request routes
router.get('/requests', getRequests)
router.post('/requests/:id/approve', approveRequest)
router.post('/requests/:id/reject', rejectRequest)

// Calendar routes
router.get('/calendar/bookings', getCalendarBookings)

// Car routes
router.get('/cars', getCars)
router.post('/cars', createCar)
router.put('/cars/:id', updateCar)
router.delete('/cars/:id', deleteCar)

// Review routes
router.get('/reviews', getReviews)

// Vehicle management routes
router.get('/vehicles', getVehicles)
router.get('/vehicles/:id/documents', getVehicleDocuments)
router.post('/vehicles/:id/documents', upload.single('file'), uploadVehicleDocument)
router.get('/vehicles/:id/reminders', getVehicleReminders)
router.post('/vehicles/:id/reminders', createVehicleReminder)

// Notification routes
router.get('/notifications', getNotifications)

export default router

