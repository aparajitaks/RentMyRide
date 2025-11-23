import express from 'express'
import { authenticate } from '../middleware/authMiddleware.js'
import { getCarDetails } from '../controllers/carController.js'

const router = express.Router()

router.get('/:id', authenticate, getCarDetails)

export default router

