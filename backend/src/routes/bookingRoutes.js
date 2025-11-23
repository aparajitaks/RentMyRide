import express from 'express'
import { authenticate } from '../middleware/authMiddleware.js'
import {
  createBookingRequest,
  getBookingDetails,
  processPayment
} from '../controllers/bookingController.js'

const router = express.Router()

router.post('/request', authenticate, createBookingRequest)
router.get('/:id', authenticate, getBookingDetails)
router.post('/:id/payment', authenticate, processPayment)

export default router

