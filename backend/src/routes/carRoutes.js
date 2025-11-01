// backend/src/routes/carRoutes.js
import express from 'express';
import { getAllCars, getCarById, createCar } from '../controllers/carController.js';
import { getCarAvailability } from '../controllers/bookingController.js'; // From Phase 3
import { protect } from '../middleware/authMiddleware.js'; // For protecting routes

const router = express.Router();

// --- Public Routes ---

// GET /api/cars (Get all cars)
router.get('/', getAllCars);

// GET /api/cars/:id (Get one car)
router.get('/:id', getCarById);

// GET /api/cars/:id/availability (Get booked dates for one car - Phase 3)
router.get('/:id/availability', getCarAvailability);


// --- Protected Routes (User must be logged in) ---

// POST /api/cars (List a new car)
router.post('/', protect, createCar);


export default router; // This is the default export your server.js needs

