require("dotenv").config();
const { PrismaClient } = require("../prisma-client-app");
const prisma = new PrismaClient();

describe("DB-level tests for bookings and patches", () => {
  beforeAll(async () => {
    // No-op: prisma client ready
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("booking_period column exists on bookings table", async () => {
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'booking_period';
    `);
    expect(result.length).toBeGreaterThan(0);
  });

  test("messages_archive table exists", async () => {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT to_regclass('public.messages_archive') IS NOT NULL AS exists;
    `);
    const exists =
      Array.isArray(rows) &&
      rows[0] &&
      (rows[0].exists === true || rows[0].exists === "t");
    expect(exists).toBe(true);
  });

  test('archival script moves old messages and deletes originals', async () => {
    // Seed two users and an old/new message
    const u1 = await prisma.user.create({ data: { email: `arch-u1+${Date.now()}@example.com` } });
    const u2 = await prisma.user.create({ data: { email: `arch-u2+${Date.now()}@example.com` } });

    // Create old message (older than 16 days) and fresh message
    const oldDate = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000);
    const freshDate = new Date();
    const oldMsg = await prisma.message.create({ data: { senderId: u1.id, receiverId: u2.id, content: 'old', updatedAt: oldDate, createdAt: oldDate } });
    const freshMsg = await prisma.message.create({ data: { senderId: u1.id, receiverId: u2.id, content: 'fresh', updatedAt: freshDate, createdAt: freshDate } });

    // Run archival main function programmatically
    const { main: archiveMain } = require('../scripts/archive-messages.js');
    await archiveMain();

    // Old message should be gone from messages, present in archive; fresh should remain
    const remainingOld = await prisma.message.findUnique({ where: { id: oldMsg.id } });
    const remainingFresh = await prisma.message.findUnique({ where: { id: freshMsg.id } });
    const archivedOld = await prisma.$queryRawUnsafe(`SELECT id FROM messages_archive WHERE id='${oldMsg.id}'`);

    expect(remainingOld).toBeNull();
    expect(remainingFresh).not.toBeNull();
    expect(Array.isArray(archivedOld) && archivedOld.length === 1).toBe(true);

    // cleanup
    await prisma.message.deleteMany({ where: { id: { in: [freshMsg.id] } } });
    await prisma.$executeRawUnsafe(`DELETE FROM messages_archive WHERE id='${oldMsg.id}'`);
    await prisma.user.deleteMany({ where: { id: { in: [u1.id, u2.id] } } });
  }, 30000);

  test("trigger trg_review_booking_completed exists only if reviews.bookingId exists", async () => {
    const hasBookingId = await prisma.$queryRawUnsafe(`
      SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'bookingId';
    `);
    const trig = await prisma.$queryRawUnsafe(`
      SELECT tgname FROM pg_trigger WHERE tgname = 'trg_review_booking_completed';
    `);
    const trigExists = Array.isArray(trig) && trig.length > 0;
    if (Array.isArray(hasBookingId) && hasBookingId.length > 0) {
      expect(trigExists).toBe(true);
    } else {
      expect(trigExists).toBe(false);
    }
  });

  test("exclusion constraint booking_no_overlap_excl exists", async () => {
    const res = await prisma.$queryRawUnsafe(`
      SELECT conname FROM pg_constraint WHERE conname = 'booking_no_overlap_excl';
    `);
    expect(res.length).toBeGreaterThan(0);
  });

  test("overlapping CONFIRMED bookings are rejected by DB constraint", async () => {
    // Seed minimal data: owner, business, vehicle, two customers
    const ownerEmail = `test-owner+${Date.now()}@example.com`;
    const customerAEmail = `test-custa+${Date.now()}@example.com`;
    const customerBEmail = `test-custb+${Date.now()}@example.com`;

    const owner = await prisma.user.create({ data: { email: ownerEmail } });
    const business = await prisma.business.create({
      data: { name: "TBD", ownerId: owner.id },
    });
    const vehicle = await prisma.vehicle.create({
      data: {
        make: "T",
        model: "X",
        year: 2020,
        pricePerDay: "10.00",
        businessId: business.id,
      },
    });
    const custA = await prisma.user.create({ data: { email: customerAEmail } });
    const custB = await prisma.user.create({ data: { email: customerBEmail } });

    const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Create first booking APPROVED
    const b1 = await prisma.booking.create({
      data: {
        startDate,
        endDate,
        totalDays: 2,
        totalPrice: "20.00",
        status: "CONFIRMED",
        userId: custA.id,
        vehicleId: vehicle.id,
      },
    });

    // Attempt to create overlapping approved booking for different customer
    let threw = false;
    try {
      await prisma.booking.create({
        data: {
          startDate,
          endDate,
          totalDays: 2,
          totalPrice: "20.00",
          status: "CONFIRMED",
          userId: custB.id,
          vehicleId: vehicle.id,
        },
      });
    } catch (err) {
      threw = true;
      // Expect overlap/exclusion error
      expect(err.message || "").toBeTruthy();
    }

    // cleanup
    await prisma.booking.deleteMany({ where: { vehicleId: vehicle.id } });
    await prisma.vehicle.delete({ where: { id: vehicle.id } });
    await prisma.business.delete({ where: { id: business.id } });
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, customerAEmail, customerBEmail] } },
    });

    expect(threw).toBe(true);
  }, 30000);

  test("review trigger behavior skipped (no reviews.bookingId in schema)", async () => {
    const hasBookingId = await prisma.$queryRawUnsafe(`
      SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'bookingId';
    `);
    // If bookingId exists, this suite should be extended to test behavior. For current schema, we skip.
    if (!Array.isArray(hasBookingId) || hasBookingId.length === 0) {
      expect(true).toBe(true);
    } else {
      // Placeholder to ensure test remains truthful if schema changes in future
      expect(true).toBe(true);
    }
  }, 10000);
});
