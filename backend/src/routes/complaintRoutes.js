import express from 'express'
import { authenticate, requireRole } from '../middleware/authMiddleware.js'
import {
  getCustomerComplaints,
  createCustomerComplaint,
  getOwnerComplaints,
  createOwnerComplaint
} from '../controllers/complaintController.js'

const router = express.Router()

// Customer complaint routes
router.get('/customer/complaints', authenticate, requireRole('CUSTOMER'), getCustomerComplaints)
router.post('/customer/complaints', authenticate, requireRole('CUSTOMER'), createCustomerComplaint)

// Owner complaint routes
router.get('/owner/complaints', authenticate, requireRole('OWNER'), getOwnerComplaints)
router.post('/owner/complaints', authenticate, requireRole('OWNER'), createOwnerComplaint)

export default router

