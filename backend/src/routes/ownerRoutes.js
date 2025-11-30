
const express = require('express')
const { authenticate, requireRole } = require('../middleware/authMiddleware.js')
const {
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
} = require('../controllers/ownerController.js')
const multer = require('multer')

const router = express.Router()
const upload = multer({ dest: 'uploads/' })


router.use(authenticate)
router.use(requireRole('OWNER'))


router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.get('/profile/stats', getProfileStats)


router.get('/dashboard/stats', getDashboardStats)
router.get('/dashboard/growth', getDashboardGrowth)


router.get('/requests', getRequests)
router.post('/requests/:id/approve', approveRequest)
router.post('/requests/:id/reject', rejectRequest)


router.get('/calendar/bookings', getCalendarBookings)


router.get('/cars', getCars)
router.post('/cars', createCar)
router.put('/cars/:id', updateCar)
router.delete('/cars/:id', deleteCar)


router.get('/reviews', getReviews)


router.get('/vehicles', getVehicles)
router.get('/vehicles/:id/documents', getVehicleDocuments)
router.post('/vehicles/:id/documents', upload.single('file'), uploadVehicleDocument)
router.get('/vehicles/:id/reminders', getVehicleReminders)
router.post('/vehicles/:id/reminders', createVehicleReminder)


router.get('/notifications', getNotifications)

module.exports = router

