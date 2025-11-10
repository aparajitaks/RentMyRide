import { getPrisma } from "../models/prisma.js";

function isOverlapError(err) {
  const msg = (err?.message || "").toLowerCase();
  return /booking_no_overlap_excl|overlap|exclusion|exclude/.test(msg);
}

// Pagination helpers using createdAt desc, id desc tie-breaker
function encodeCursor(row) {
  if (!row) return null;
  const payload = { c: row.createdAt?.toISOString?.() || new Date().toISOString(), i: row.id };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
function decodeCursor(cursor) {
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf8');
    const obj = JSON.parse(json);
    if (obj && obj.c && obj.i) return { createdAt: new Date(obj.c), id: obj.i };
  } catch (_) {
    // Ignore malformed cursor; treat as no cursor provided
  }
  return null;
}

export async function requestBooking(req, res) {
  try {
    const prisma = getPrisma();
    const customerId = req.user?.id;
    if (!customerId)
      return res
        .status(401)
        .json({ ok: false, code: "UNAUTHENTICATED", message: "Auth required" });
    const { vehicleId, startDate, endDate, pickupLocation, dropoffLocation } =
      req.body;
    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({
        ok: false,
        code: "INVALID_INPUT",
        message: "vehicleId, startDate, endDate required",
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
    if (isNaN(s) || isNaN(e) || e < s)
      return res
        .status(400)
        .json({ ok: false, code: "INVALID_DATES", message: "Bad date range" });
    const days = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
    const totalPrice = Number(vehicle.pricePerDay) * days;
    const created = await prisma.$transaction((tx) =>
      tx.booking.create({
        data: {
          vehicleId,
          userId: customerId,
          startDate: s,
          endDate: e,
          totalDays: days,
          totalPrice,
          pickupLocation: pickupLocation || null,
          dropoffLocation: dropoffLocation || null,
          status: "PENDING",
        },
      }),
    );
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
    if (isOverlapError(err))
      return res.status(409).json({
        ok: false,
        code: "NOT_AVAILABLE",
        message: "Vehicle not available for requested dates",
      });
    return res
      .status(500)
      .json({ ok: false, code: "DB_ERROR", message: err.message });
  }
}

export async function approveBooking(req, res) {
  try {
    const prisma = getPrisma();
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ ok: false, code: "UNAUTHENTICATED", message: "Auth required" });
    const bookingId = req.params.id;
    // Basic retry wrapper for transient DB connectivity (e.g., Neon cold start) on initial fetch
    let booking, attempts = 0;
    while (attempts < 3) {
      try {
        booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            vehicle: { include: { business: { select: { ownerId: true } } } },
          },
        });
        break;
      } catch (e) {
        if (e?.code === 'P1001' && attempts < 2) {
          attempts++;
          await new Promise(r => setTimeout(r, 150 * attempts));
          continue;
        }
        throw e;
      }
    }
    if (!booking)
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Booking not found" });
    const ownerId = booking.vehicle?.business?.ownerId;
    if (ownerId !== userId)
      return res
        .status(403)
        .json({ ok: false, code: "FORBIDDEN", message: "Not owner" });
    // Enforce valid current state before approving
    if (booking.status !== 'PENDING') {
      return res.status(409).json({ ok:false, code:'INVALID_TRANSITION', message:`Cannot approve booking from status ${booking.status}` });
    }
    try {
      const updated = await prisma.$transaction(async (tx) => {
        // Perform a conditional update to avoid double-approve races
        const result = await tx.booking.updateMany({
          where: { id: bookingId, status: 'PENDING' },
          data: { status: 'CONFIRMED' },
        });
        if (result.count === 0) {
          // Someone else already moved it out of PENDING
          return null;
        }
        // Fetch minimal fields for response
        const b = await tx.booking.findUnique({ where: { id: bookingId }, select: { id: true, status: true } });
        return b;
      });
      if (!updated) {
        return res.status(409).json({ ok:false, code:'INVALID_TRANSITION', message:'Booking is no longer in PENDING' });
      }
      return res.json({
        ok: true,
        data: { id: updated.id, status: updated.status },
      });
    } catch (err) {
      if (isOverlapError(err))
        return res.status(409).json({
          ok: false,
          code: "NOT_AVAILABLE",
          message: "Vehicle not available for requested dates",
        });
      // Retry once for P1001 inside transaction scope
      if (err?.code === 'P1001') {
        try {
          const updated = await prisma.$transaction(async (tx) => {
            const result = await tx.booking.updateMany({
              where: { id: bookingId, status: 'PENDING' },
              data: { status: 'CONFIRMED' },
            });
            if (result.count === 0) {
              return null;
            }
            return tx.booking.findUnique({ where: { id: bookingId }, select: { id: true, status: true } });
          });
          if (!updated) {
            return res.status(409).json({ ok:false, code:'INVALID_TRANSITION', message:'Booking is no longer in PENDING' });
          }
          return res.json({ ok:true, data:{ id: updated.id, status: updated.status } });
        } catch (inner) {
          if (isOverlapError(inner)) {
            return res.status(409).json({ ok:false, code:'NOT_AVAILABLE', message:'Vehicle not available for requested dates' });
          }
          console.error('approveBooking retry error:', inner);
          throw inner;
        }
      }
      throw err;
    }
  } catch (err) {
    console.error("approveBooking error:", err);
    return res
      .status(500)
      .json({ ok: false, code: "DB_ERROR", message: err.message });
  }
}

export async function payBooking(req, res) {
  try {
    const prisma = getPrisma();
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ ok: false, code: "UNAUTHENTICATED", message: "Auth required" });
    const bookingId = req.params.id;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });
    if (!booking)
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Booking not found" });
    // Only the booking customer can pay
    if (booking.userId !== userId) {
      return res.status(403).json({ ok:false, code:'FORBIDDEN', message:'Only booking customer can pay' });
    }
    if (booking.status !== 'CONFIRMED') {
      return res.status(409).json({ ok:false, code:'INVALID_TRANSITION', message:`Expected CONFIRMED before pay, got ${booking.status}` });
    }
    // Idempotent payment + activation
    const updated = await prisma.$transaction(async (tx) => {
      // Ensure a payment exists (simulate successful immediate completion)
      await tx.payment.upsert({
        where: { bookingId: bookingId },
        create: {
          bookingId: bookingId,
          userId: booking.userId,
          amount: booking.totalPrice,
          currency: 'USD',
          status: 'COMPLETED',
          method: 'TEST',
        },
        update: {
          status: 'COMPLETED',
        },
      });
      // Activate booking if still CONFIRMED; if another process already activated, keep as is
      const b = await tx.booking.update({ where: { id: bookingId }, data: { status: 'ACTIVE' } });
      return b;
    });
    return res.json({
      ok: true,
      data: { id: updated.id, status: updated.status },
    });
  } catch (err) {
    console.error("payBooking error:", err);
    return res
      .status(500)
      .json({ ok: false, code: "DB_ERROR", message: err.message });
  }
}

export async function completeBooking(req, res) {
  try {
    const prisma = getPrisma();
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ ok: false, code: "UNAUTHENTICATED", message: "Auth required" });
    const bookingId = req.params.id;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking)
      return res
        .status(404)
        .json({ ok: false, code: "NOT_FOUND", message: "Booking not found" });
    if (booking.status !== 'ACTIVE') {
      return res.status(409).json({ ok:false, code:'INVALID_TRANSITION', message:`Expected ACTIVE before complete, got ${booking.status}` });
    }
    const updated = await prisma.booking.update({ where:{ id:bookingId }, data:{ status:'COMPLETED', updatedAt:new Date() }});
    return res.json({
      ok: true,
      data: { id: updated.id, status: updated.status },
    });
  } catch (err) {
    console.error("completeBooking error:", err);
    return res
      .status(500)
      .json({ ok: false, code: "DB_ERROR", message: err.message });
  }
}

// Cancellation rules:
// - Allowed statuses to cancel: PENDING, CONFIRMED
// - Actor allowed: booking user OR business owner of vehicle
// - Resulting status: CANCELLED
export async function cancelBooking(req, res) {
  try {
    const prisma = getPrisma();
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ ok:false, code:'UNAUTHENTICATED', message:'Auth required' });
    }
    const bookingId = req.params.id;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vehicle: { include: { business: { select: { ownerId: true } } } } }
    });
    if (!booking) {
      return res.status(404).json({ ok:false, code:'NOT_FOUND', message:'Booking not found' });
    }
    const ownerId = booking.vehicle?.business?.ownerId;
    const isOwner = ownerId === userId;
    const isCustomer = booking.userId === userId;
    if (!isOwner && !isCustomer) {
      return res.status(403).json({ ok:false, code:'FORBIDDEN', message:'Not permitted to cancel this booking' });
    }
    if (!['PENDING','CONFIRMED'].includes(booking.status)) {
      return res.status(409).json({ ok:false, code:'INVALID_TRANSITION', message:`Cannot cancel booking in status ${booking.status}` });
    }
    const updated = await prisma.booking.update({ where:{ id:bookingId }, data:{ status:'CANCELLED', updatedAt:new Date() }});
    return res.json({ ok:true, data:{ id: updated.id, status: updated.status } });
  } catch (err) {
    console.error('cancelBooking error:', err);
    return res.status(500).json({ ok:false, code:'DB_ERROR', message: err.message });
  }
}

export async function listMyBookings(req, res) {
  try {
    const prisma = getPrisma();
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ ok:false, code:'UNAUTHENTICATED', message:'Auth required' });
    const { status, limit, cursor } = req.query;
    const take = Math.max(1, Math.min(parseInt(limit || '10', 10), 50));
    const whereBase = { userId, ...(status ? { status } : {}) };
    const orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];

    let where = whereBase;
    if (cursor) {
      const cur = decodeCursor(cursor);
      if (cur) {
        where = {
          AND: [
            whereBase,
            {
              OR: [
                { createdAt: { lt: cur.createdAt } },
                { AND: [{ createdAt: cur.createdAt }, { id: { lt: cur.id } }] },
              ],
            },
          ],
        };
      }
    }

    const items = await prisma.booking.findMany({
      where,
      orderBy,
      take: take + 1,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        updatedAt: true,
        vehicleId: true,
      },
    });
    let nextCursor = null;
    if (items.length > take) {
      const last = items.pop();
      nextCursor = encodeCursor(last);
    }
    return res.json({ ok:true, data:{ items, nextCursor } });
  } catch (err) {
    console.error('listMyBookings error:', err);
    return res.status(500).json({ ok:false, code:'DB_ERROR', message: err.message });
  }
}

export async function listVehicleBookings(req, res) {
  try {
    const prisma = getPrisma();
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ ok:false, code:'UNAUTHENTICATED', message:'Auth required' });
    const vehicleId = req.params.vehicleId;
    const { status, limit, cursor } = req.query;
    // Verify ownership
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, include: { business: { select: { ownerId: true } } } });
    if (!vehicle) return res.status(404).json({ ok:false, code:'NOT_FOUND', message:'Vehicle not found' });
    if (vehicle.business?.ownerId !== userId) return res.status(403).json({ ok:false, code:'FORBIDDEN', message:'Not owner' });

    const take = Math.max(1, Math.min(parseInt(limit || '10', 10), 50));
    const whereBase = { vehicleId, ...(status ? { status } : {}) };
    const orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];

    let where = whereBase;
    if (cursor) {
      const cur = decodeCursor(cursor);
      if (cur) {
        where = {
          AND: [
            whereBase,
            {
              OR: [
                { createdAt: { lt: cur.createdAt } },
                { AND: [{ createdAt: cur.createdAt }, { id: { lt: cur.id } }] },
              ],
            },
          ],
        };
      }
    }

    const items = await prisma.booking.findMany({
      where,
      orderBy,
      take: take + 1,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });
    let nextCursor = null;
    if (items.length > take) {
      const last = items.pop();
      nextCursor = encodeCursor(last);
    }
    return res.json({ ok:true, data:{ items, nextCursor } });
  } catch (err) {
    console.error('listVehicleBookings error:', err);
    return res.status(500).json({ ok:false, code:'DB_ERROR', message: err.message });
  }
}

process.on("SIGINT", async () => {
  const prisma = getPrisma();
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  const prisma = getPrisma();
  await prisma.$disconnect();
  process.exit(0);
});
