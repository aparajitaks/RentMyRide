import express from "express";
import {
  requestBooking,
  approveBooking,
  payBooking,
  completeBooking,
  cancelBooking,
  listMyBookings,
  listVehicleBookings,
} from "../controllers/bookingController.js";

const router = express.Router();
router.use(express.json());

// Booking workflow endpoints
router.post("/request", requestBooking);
router.post("/:id/approve", approveBooking);
router.post("/:id/pay", payBooking);
router.post("/:id/complete", completeBooking);
router.post("/:id/cancel", cancelBooking);
router.get("/mine", listMyBookings);
router.get("/vehicle/:vehicleId", listVehicleBookings);

export default router;
