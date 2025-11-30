const express = require('express')
const { authenticate } = require('../middleware/authMiddleware.js')
const { getCarDetails } = require('../controllers/carController.js')

const router = express.Router()

router.get('/:id', authenticate, getCarDetails)

module.exports = router

