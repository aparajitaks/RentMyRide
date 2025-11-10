import express from "express";
import bookingsController from "../controllers/bookingsController.js";
const router = express.Router();

// body parser for these routes
router.use(express.json());

// POST /api/bookings/request
router.post("/request", bookingsController.requestBooking);

// POST /api/bookings/:id/approve
router.post("/:id/approve", bookingsController.approveBooking);

// POST /api/bookings/:id/pay
router.post("/:id/pay", bookingsController.payBooking);

// POST /api/bookings/:id/complete
router.post("/:id/complete", bookingsController.completeBooking);

export default router;
