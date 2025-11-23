import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import customerRoutes from './routes/customerRoutes.js'
import ownerRoutes from './routes/ownerRoutes.js'
import businessRoutes from './routes/businessRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import carRoutes from './routes/carRoutes.js'
import complaintRoutes from './routes/complaintRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RentMyRide API is running' })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/customer', customerRoutes)
app.use('/api/owner', ownerRoutes)
app.use('/api/businesses', businessRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/cars', carRoutes)
app.use('/api', complaintRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

