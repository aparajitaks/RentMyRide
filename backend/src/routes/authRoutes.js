const express = require('express')
const { login, getMe, signup } = require('../controllers/authController.js')
const { authenticate } = require('../middleware/authMiddleware.js')

const router = express.Router()

router.post('/login', login)
router.post('/signup', signup)
router.get('/me', authenticate, getMe)

module.exports = router

