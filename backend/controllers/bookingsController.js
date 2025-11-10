// Booking controller using Prisma
const { PrismaClient } = require("../prisma-client-app");
const prisma = new PrismaClient();

function isOverlapError(err) {
  if (!err) return false;
  const msg = (err.message || "").toString();
  if (/booking_no_overlap_excl/i.test(msg)) return true;
  if (/overlap|exclusion|exclude/i.test(msg)) return true;
  // Prisma client meta for constraint-targeted errors
  if (err.code === "P2002" && err.meta && err.meta.target) {
    return String(err.meta.target).includes("booking_no_overlap_excl");
  }
  return false;
}

async function requestBooking(req, res) {
  try {
    const customerId = req.user && req.user.id;
    if (!customerId)
      return res.status(401).json({
        ok: false,
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      });

    const { vehicleId, startDate, endDate, pickupLocation, dropoffLocation } =
      req.body;
    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({
        ok: false,
        code: "INVALID_INPUT",
        message: "vehicleId, startDate and endDate are required",
      });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle)
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Vehicle not found" });

    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s) || isNaN(e) || e < s) {
      return res.status(400).json({
        ok: false,
        code: "INVALID_DATES",
        message: "Invalid startDate or endDate",
      });
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    let days = Math.ceil((e - s) / msPerDay);
    if (days < 1) days = 1;
    const pricePerDay = Number(vehicle.pricePerDay || 0);
    const totalPrice = pricePerDay * days;

    const created = await prisma.$transaction(async (tx) => {
      return await tx.booking.create({
        data: {
          vehicleId,
          userId: customerId, // schema uses userId not customerId
          businessId: vehicle.businessId || undefined, // actual schema has businessId on Vehicle not Booking; keep relational integrity
          startDate: s,
          endDate: e,
          totalDays: days,
          pickupLocation: pickupLocation || null,
          dropoffLocation: dropoffLocation || null,
          totalPrice,
          status: "PENDING",
        },
      });
    });

    return res.json({
      ok: true,
      data: {
        id: created.id,
        status: created.status,
        totalPrice: created.totalPrice,
        startDate: created.startDate,
        endDate: created.endDate,
      },
    });
  } catch (err) {
    console.error("requestBooking error:", err);
    if (isOverlapError(err)) {
      return res.status(409).json({
        ok: false,
        code: "NOT_AVAILABLE",
        message: "Vehicle not available for requested dates",
      });
    }
    return res.status(500).json({
      ok: false,
      code: "DB_ERROR",
      message: err.message || String(err),
    });
  }
}

async function approveBooking(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId)
      return res.status(401).json({
        ok: false,
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      });

    const bookingId = req.params.id;
    if (!bookingId)
      return res.status(400).json({
        ok: false,
        code: "INVALID_INPUT",
        message: "booking id required",
      });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vehicle: { include: { business: { select: { ownerId: true } } } },
      },
    });
    if (!booking)
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Booking not found" });
    const ownerId = booking.vehicle?.business?.ownerId;
    if (!ownerId || ownerId !== userId)
      return res.status(403).json({
        ok: false,
        code: "FORBIDDEN",
        message: "Not authorized to approve this booking",
      });

    try {
      const updated = await prisma.$transaction(async (tx) => {
        return await tx.booking.update({
          where: { id: bookingId },
          data: { status: "CONFIRMED" },
        });
      });
      return res.json({
        ok: true,
        data: { id: updated.id, status: updated.status },
      });
    } catch (err) {
      console.error("approveBooking transaction error:", err);
      if (isOverlapError(err)) {
        return res.status(409).json({
          ok: false,
          code: "NOT_AVAILABLE",
          message: "Vehicle not available for requested dates",
        });
      }
      throw err;
    }
  } catch (err) {
    console.error("approveBooking error:", err);
    return res.status(500).json({
      ok: false,
      code: "DB_ERROR",
      message: err.message || String(err),
    });
  }
}

async function payBooking(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId)
      return res.status(401).json({
        ok: false,
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      });

    const bookingId = req.params.id;
    if (!bookingId)
      return res.status(400).json({
        ok: false,
        code: "INVALID_INPUT",
        message: "booking id required",
      });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking)
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Booking not found" });

    // simulate payment success
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "ACTIVE" },
    });
    return res.json({
      ok: true,
      data: { id: updated.id, status: updated.status },
    });
  } catch (err) {
    console.error("payBooking error:", err);
    return res.status(500).json({
      ok: false,
      code: "DB_ERROR",
      message: err.message || String(err),
    });
  }
}

async function completeBooking(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId)
      return res.status(401).json({
        ok: false,
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      });

    const bookingId = req.params.id;
    if (!bookingId)
      return res.status(400).json({
        ok: false,
        code: "INVALID_INPUT",
        message: "booking id required",
      });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking)
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Booking not found" });

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "COMPLETED", updatedAt: new Date() },
    });
    return res.json({
      ok: true,
      data: { id: updated.id, status: updated.status },
    });
  } catch (err) {
    console.error("completeBooking error:", err);
    return res.status(500).json({
      ok: false,
      code: "DB_ERROR",
      message: err.message || String(err),
    });
  }
}

// Ensure Prisma disconnects on process exit
async function _gracefulShutdown() {
  try {
    await prisma.$disconnect();
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  } catch (e) {
    console.error("Error disconnecting Prisma on shutdown", e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

process.on("SIGINT", _gracefulShutdown);
process.on("SIGTERM", _gracefulShutdown);

module.exports = {
  requestBooking,
  approveBooking,
  payBooking,
  completeBooking,
};
