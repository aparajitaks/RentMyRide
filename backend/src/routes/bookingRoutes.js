// server/routes/bookingRoutes.js
import express from 'express';
import { createBooking, getCarAvailability } from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js'; // Assuming you have this

const router = express.Router();

// GET /api/cars/:id/availability (Doesn't need protection, it's public)
// We'll put this in carRoutes.js to match the URL structure.

// POST /api/bookings (Protected, user must be logged in)
router.post('/', protect, createBooking);

export default router;