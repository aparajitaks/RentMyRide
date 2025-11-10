// Load environment variables from a .env file when present
require("dotenv").config();

const { PrismaClient } = require("../prisma-client-app");

async function createBookingSafe({
  vehicleId,
  customerId,
  businessId,
  startDate,
  endDate,
  totalPrice,
}) {
  const prisma = new PrismaClient();
  try {
    const created = await prisma.$transaction(async (tx) => {
      return await tx.booking.create({
        data: {
          vehicleId,
          customerId,
          businessId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          totalPrice,
          status: "APPROVED",
        },
      });
    });
    return { ok: true, booking: created };
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    // Detect exclusion constraint or overlap errors
    if (
      /booking_no_overlap_excl/i.test(message) ||
      /overlap/i.test(message) ||
      /exclude/i.test(message)
    ) {
      return {
        ok: false,
        code: "NOT_AVAILABLE",
        message: "Vehicle not available for requested dates",
      };
    }
    return { ok: false, code: "DB_ERROR", message };
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      // ignore disconnect errors
    }
  }
}

// CLI runner with placeholders
if (require.main === module) {
  (async () => {
    const payload = {
      vehicleId: "REPLACE_VEHICLE_ID",
      customerId: "REPLACE_CUSTOMER_ID",
      businessId: "REPLACE_BUSINESS_ID",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      totalPrice: 100.0,
    };
    console.log(
      "Attempting to create booking (replace placeholders before use):",
      payload,
    );
    const res = await createBookingSafe(payload);
    console.log("Result:", res);
  })();
}

module.exports = { createBookingSafe };
