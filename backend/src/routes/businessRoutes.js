import express from 'express'
import {
  searchBusinesses,
  getBusinessDetails,
  getBusinessCars,
  getBusinessReviews
} from '../controllers/businessController.js'

const router = express.Router()

router.get('/search', searchBusinesses)
router.get('/:id', getBusinessDetails)
router.get('/:id/cars', getBusinessCars)
router.get('/:id/reviews', getBusinessReviews)

export default router

