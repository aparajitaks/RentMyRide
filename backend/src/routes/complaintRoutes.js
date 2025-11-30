const express = require('express')
const { authenticate, requireRole } = require('../middleware/authMiddleware.js')
const {
  getCustomerComplaints,
  createCustomerComplaint,
  getOwnerComplaints,
  createOwnerComplaint
} = require('../controllers/complaintController.js')

const router = express.Router()


router.get('/customer/complaints', authenticate, requireRole('CUSTOMER'), getCustomerComplaints)
router.post('/customer/complaints', authenticate, requireRole('CUSTOMER'), createCustomerComplaint)


router.get('/owner/complaints', authenticate, requireRole('OWNER'), getOwnerComplaints)
router.post('/owner/complaints', authenticate, requireRole('OWNER'), createOwnerComplaint)

module.exports = router

