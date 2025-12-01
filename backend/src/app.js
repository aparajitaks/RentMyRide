const path = require('path')
const dotenv = require('dotenv')
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes.js')
const customerRoutes = require('./routes/customerRoutes.js')
const ownerRoutes = require('./routes/ownerRoutes.js')
const businessRoutes = require('./routes/businessRoutes.js')
const bookingRoutes = require('./routes/bookingRoutes.js')
const carRoutes = require('./routes/carRoutes.js')
const complaintRoutes = require('./routes/complaintRoutes.js')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RentMyRide API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/customer', customerRoutes)
app.use('/api/owner', ownerRoutes)
app.use('/api/businesses', businessRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/cars', carRoutes)
app.use('/api', complaintRoutes)

app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

module.exports = app
