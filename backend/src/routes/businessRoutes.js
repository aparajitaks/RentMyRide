const express = require('express')
const {
  searchBusinesses,
  getBusinessDetails,
  getBusinessCars,
  getBusinessReviews
} = require('../controllers/businessController.js')

const router = express.Router()

router.get('/search', searchBusinesses)
router.get('/:id', getBusinessDetails)
router.get('/:id/cars', getBusinessCars)
router.get('/:id/reviews', getBusinessReviews)

module.exports = router

