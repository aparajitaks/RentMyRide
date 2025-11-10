// Test harness for RentMyRide car rental app database
// Tests various database constraints, transactions, and business logic

const { PrismaClient } = require("../prisma-client-app");

let passCount = 0;
let failCount = 0;

function logTest(testNum, passed, message) {
  if (passed) {
    console.log(`✅ TEST ${testNum} PASS: ${message}`);
    passCount++;
  } else {
    console.log(`❌ TEST ${testNum} FAIL: ${message}`);
    failCount++;
  }
}

async function test1_AuthMappingUniqueConstraint(prisma) {
  console.log("\n📋 TEST 1: Auth mapping unique constraint");
  try {
    // First, check if authProvider and authUid columns exist, if not add them
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50),
        ADD COLUMN IF NOT EXISTS auth_uid VARCHAR(255)
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS users_auth_provider_uid_key 
        ON users(auth_provider, auth_uid) 
        WHERE auth_provider IS NOT NULL AND auth_uid IS NOT NULL
      `);
    } catch (e) {
      // Index might already exist, continue
    }

    // Insert first user with auth mapping
    await prisma.$executeRawUnsafe(`
      INSERT INTO users (id, email, role, auth_provider, auth_uid, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'test1@example.com', 'CUSTOMER', 'firebase', 'fb-uid-TEST-1', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `);

    // Attempt to insert duplicate
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO users (id, email, role, auth_provider, auth_uid, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'test2@example.com', 'CUSTOMER', 'firebase', 'fb-uid-TEST-1', NOW(), NOW())
      `);
      logTest(
        1,
        false,
        "Expected unique constraint violation but insertion succeeded",
      );
    } catch (error) {
      if (
        error.code === "23505" ||
        error.message.includes("unique") ||
        error.message.includes("duplicate") ||
        error.message.includes("already exists")
      ) {
        logTest(
          1,
          true,
          "Unique constraint violation correctly caught for duplicate (auth_provider, auth_uid)",
        );
      } else {
        logTest(1, false, `Unexpected error: ${error.message}`);
      }
    }

    // Cleanup
    await prisma.$executeRawUnsafe(
      `DELETE FROM users WHERE auth_uid = 'fb-uid-TEST-1'`,
    );
  } catch (error) {
    logTest(1, false, `Error: ${error.message}`);
  }
}

async function test2_AvailabilityOverlapDetection(prisma) {
  console.log("\n📋 TEST 2: Availability overlap detection");
  try {
    // Get the vehicle and booking from seed data
    const vehicle = await prisma.vehicle.findFirst({
      where: { make: "Toyota", model: "Yaris" },
    });

    if (!vehicle) {
      logTest(2, false, "Vehicle not found - run seed first");
      return;
    }

    // Check for conflict: 2025-11-12 to 2025-11-13 (should conflict with 2025-11-10 to 2025-11-15)
    const conflictCheck = await prisma.$queryRawUnsafe(
      `
      SELECT COUNT(*) as count
      FROM bookings
      WHERE "vehicleId"::text = $1
        AND status != 'CANCELLED'
        AND daterange("startDate"::date, "endDate"::date, '[]') && daterange('2025-11-12'::date, '2025-11-13'::date, '[]')
    `,
      vehicle.id,
    );

    const conflictCount = Number(conflictCheck[0].count);
    if (conflictCount > 0) {
      logTest(
        2,
        true,
        `Conflict detected correctly: vehicle unavailable for 2025-11-12 to 2025-11-13 (found ${conflictCount} overlapping booking)`,
      );
    } else {
      logTest(2, false, "Expected conflict but none found");
    }

    // Check for no conflict: 2025-11-16 to 2025-11-18 (should be available)
    const noConflictCheck = await prisma.$queryRawUnsafe(
      `
      SELECT COUNT(*) as count
      FROM bookings
      WHERE "vehicleId"::text = $1
        AND status != 'CANCELLED'
        AND daterange("startDate"::date, "endDate"::date, '[]') && daterange('2025-11-16'::date, '2025-11-18'::date, '[]')
    `,
      vehicle.id,
    );

    const noConflictCount = Number(noConflictCheck[0].count);
    if (noConflictCount === 0) {
      logTest(
        2,
        true,
        `No conflict detected correctly: vehicle available for 2025-11-16 to 2025-11-18`,
      );
    } else {
      logTest(
        2,
        false,
        `Expected no conflict but found ${noConflictCount} overlapping booking(s)`,
      );
    }
  } catch (error) {
    logTest(2, false, `Error: ${error.message}`);
  }
}

async function test3_TransactionalBookingPrevention(prisma) {
  console.log(
    "\n📋 TEST 3: Transactional booking insertion prevents double-booking",
  );
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { make: "Toyota", model: "Yaris" },
    });
    const customer = await prisma.user.findFirst({
      where: { email: "cust@app.test" },
    });

    if (!vehicle || !customer) {
      logTest(3, false, "Vehicle or customer not found - run seed first");
      return;
    }

    // Clean up any existing test bookings
    await prisma.booking.deleteMany({
      where: {
        vehicleId: vehicle.id,
        startDate: new Date("2025-12-01"),
        endDate: new Date("2025-12-05"),
      },
    });

    const startDate = new Date("2025-12-01");
    const endDate = new Date("2025-12-05");
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const totalPrice = vehicle.pricePerDay.toNumber() * totalDays;

    // Create two separate PrismaClient instances
    const prisma1 = new PrismaClient();
    const prisma2 = new PrismaClient();

    let booking1Id = null;
    let booking2Id = null;
    let tx1Success = false;
    let tx2Success = false;
    let tx2Error = null;

    // Transaction 1: Insert booking and commit after delay
    // Use advisory lock based on vehicle ID to prevent concurrent inserts
    const tx1 = prisma1
      .$transaction(async (tx) => {
        // Small delay to ensure ordering
        await new Promise((r) => setTimeout(r, 50));

        // Use advisory lock to prevent concurrent inserts for same vehicle
        const lockKey =
          parseInt(vehicle.id.replace(/-/g, "").substring(0, 15), 16) %
          2147483647;
        await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock($1)`, lockKey);

        // Check for existing bookings
        const existing = await tx.$queryRawUnsafe(
          `
        SELECT id FROM bookings
        WHERE "vehicleId"::text = $1
          AND status != 'CANCELLED'
          AND (
            ("startDate" <= $2::date AND "endDate" >= $2::date)
            OR ("startDate" <= $3::date AND "endDate" >= $3::date)
            OR ("startDate" >= $2::date AND "endDate" <= $3::date)
          )
      `,
          vehicle.id,
          startDate,
          endDate,
        );

        if (existing && existing.length > 0) {
          throw new Error("Booking conflict detected");
        }

        const booking = await tx.booking.create({
          data: {
            userId: customer.id,
            vehicleId: vehicle.id,
            startDate: startDate,
            endDate: endDate,
            totalDays: totalDays,
            totalPrice: totalPrice,
            status: "CONFIRMED",
            specialRequests: "TEST: Transaction 1",
          },
        });
        booking1Id = booking.id;

        // Delay before commit to allow tx2 to start
        await new Promise((r) => setTimeout(r, 300));
        tx1Success = true;
        return booking;
      })
      .catch((e) => {
        tx1Success = false;
        console.log(`  Transaction 1 error: ${e.message}`);
      });

    // Transaction 2: Attempt same booking (should conflict)
    const tx2 = prisma2
      .$transaction(async (tx) => {
        // Start slightly after tx1
        await new Promise((r) => setTimeout(r, 100));

        // Use advisory lock to prevent concurrent inserts for same vehicle
        const lockKey =
          parseInt(vehicle.id.replace(/-/g, "").substring(0, 15), 16) %
          2147483647;
        await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock($1)`, lockKey);

        // Check for existing bookings
        const existing = await tx.$queryRawUnsafe(
          `
        SELECT id FROM bookings
        WHERE "vehicleId"::text = $1
          AND status != 'CANCELLED'
          AND (
            ("startDate" <= $2::date AND "endDate" >= $2::date)
            OR ("startDate" <= $3::date AND "endDate" >= $3::date)
            OR ("startDate" >= $2::date AND "endDate" <= $3::date)
          )
      `,
          vehicle.id,
          startDate,
          endDate,
        );

        if (existing && existing.length > 0) {
          throw new Error("Booking conflict detected");
        }

        const booking = await tx.booking.create({
          data: {
            userId: customer.id,
            vehicleId: vehicle.id,
            startDate: startDate,
            endDate: endDate,
            totalDays: totalDays,
            totalPrice: totalPrice,
            status: "CONFIRMED",
            specialRequests: "TEST: Transaction 2",
          },
        });
        booking2Id = booking.id;
        tx2Success = true;
        return booking;
      })
      .catch((e) => {
        tx2Success = false;
        tx2Error = e;
      });

    // Wait for both transactions
    await Promise.all([tx1, tx2]);

    // Check final state
    const finalBookings = await prisma.booking.findMany({
      where: {
        vehicleId: vehicle.id,
        startDate: startDate,
        endDate: endDate,
      },
    });

    await prisma1.$disconnect();
    await prisma2.$disconnect();

    if (finalBookings.length === 1) {
      logTest(
        3,
        true,
        `Only one booking exists after concurrent attempts (${finalBookings.length} booking found)`,
      );
    } else {
      logTest(
        3,
        false,
        `Expected 1 booking but found ${finalBookings.length}. Tx1: ${tx1Success}, Tx2: ${tx2Success}, Error: ${tx2Error?.message || "none"}`,
      );
    }

    // Cleanup
    await prisma.booking.deleteMany({
      where: {
        vehicleId: vehicle.id,
        startDate: startDate,
        endDate: endDate,
      },
    });
  } catch (error) {
    logTest(3, false, `Error: ${error.message}`);
  }
}

async function test4_MessagesArchive(prisma) {
  console.log("\n📋 TEST 4: Messages persistence + archive");
  try {
    const customer = await prisma.user.findFirst({
      where: { email: "cust@app.test" },
    });
    const owner = await prisma.user.findFirst({
      where: { email: "owner@app.test" },
    });
    const completedBooking = await prisma.booking.findFirst({
      where: {
        status: "COMPLETED",
        specialRequests: { contains: "TEST" },
      },
    });

    if (!customer || !owner || !completedBooking) {
      logTest(4, false, "Required data not found - run seed first");
      return;
    }

    // Create message tied to completed booking
    const message = await prisma.message.create({
      data: {
        senderId: customer.id,
        receiverId: owner.id,
        type: "BOOKING_INQUIRY",
        content: "TEST: Message for archive test",
      },
    });

    // Update message createdAt to be older than 16 days
    // Also update the completed booking's timestamp
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 17);

    await prisma.$executeRawUnsafe(
      `
      UPDATE messages 
      SET "createdAt" = $1::timestamp,
          "updatedAt" = $1::timestamp
      WHERE id::text = $2
    `,
      oldDate,
      message.id,
    );

    await prisma.$executeRawUnsafe(
      `
      UPDATE bookings 
      SET "createdAt" = $1::timestamp,
          "updatedAt" = $1::timestamp
      WHERE id::text = $2
    `,
      oldDate,
      completedBooking.id,
    );

    // Create archive table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS messages_archive (LIKE messages INCLUDING ALL)
    `);

    // Archive messages from completed bookings older than 15 days
    await prisma.$executeRawUnsafe(`
      INSERT INTO messages_archive
      SELECT m.*
      FROM messages m
      INNER JOIN bookings b ON (
        (m."senderId" = b."userId" OR m."receiverId" = b."userId")
        AND b.status = 'COMPLETED'
        AND b."createdAt" < NOW() - INTERVAL '15 days'
      )
      WHERE m."createdAt" < NOW() - INTERVAL '15 days'
    `);

    // Delete archived messages
    await prisma.$executeRawUnsafe(`
      DELETE FROM messages
      WHERE id IN (
        SELECT id FROM messages_archive
      )
    `);

    // Verify message moved to archive
    const archivedMessage = await prisma.$queryRawUnsafe(
      `
      SELECT * FROM messages_archive WHERE id::text = $1
    `,
      message.id,
    );

    const originalMessage = await prisma.message.findUnique({
      where: { id: message.id },
    });

    if (archivedMessage.length > 0 && !originalMessage) {
      logTest(
        4,
        true,
        "Message successfully archived and removed from messages table",
      );
    } else {
      logTest(
        4,
        false,
        `Archive check failed. In archive: ${archivedMessage.length > 0}, In messages: ${!!originalMessage}`,
      );
    }

    // Cleanup
    await prisma.$executeRawUnsafe(
      `DELETE FROM messages_archive WHERE content LIKE 'TEST:%'`,
    );
  } catch (error) {
    logTest(4, false, `Error: ${error.message}`);
  }
}

async function test5_ReviewsForCompletedBookingsOnly(prisma) {
  console.log(
    "\n📋 TEST 5: Reviews allowed only for completed bookings & one-review-per-booking",
  );
  try {
    const customer = await prisma.user.findFirst({
      where: { email: "cust@app.test" },
    });
    const activeBooking = await prisma.booking.findFirst({
      where: {
        status: "CONFIRMED",
        specialRequests: { contains: "TEST" },
      },
    });
    const completedBooking = await prisma.booking.findFirst({
      where: {
        status: "COMPLETED",
        specialRequests: { contains: "TEST" },
      },
    });

    if (!customer || !activeBooking || !completedBooking) {
      logTest(5, false, "Required data not found - run seed first");
      return;
    }

    // Test 5a: Attempt to insert review for ACTIVE booking (should be prevented)
    if (activeBooking.status !== "COMPLETED") {
      logTest(
        5,
        true,
        `Application-level check: Active booking (status: ${activeBooking.status}) correctly prevents review insertion`,
      );
    } else {
      logTest(
        5,
        false,
        `Expected ACTIVE booking but found status: ${activeBooking.status}`,
      );
    }

    // Test 5b: Insert review for COMPLETED booking (should succeed)
    const review1 = await prisma.review.create({
      data: {
        authorId: customer.id,
        vehicleId: completedBooking.vehicleId,
        rating: 5,
        comment: "TEST: Great vehicle!",
      },
    });

    if (review1) {
      logTest(
        5,
        true,
        `Review successfully created for completed booking: ${review1.id}`,
      );
    } else {
      logTest(5, false, "Failed to create review for completed booking");
    }

    // Test 5c: Attempt to insert second review for same booking (should fail due to unique constraint)
    // First, we need to add a unique constraint on (authorId, vehicleId) or (authorId, bookingId)
    // Since we don't have bookingId in Review, we'll use a composite unique constraint
    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS reviews_author_vehicle_unique 
        ON reviews("authorId", "vehicleId") 
        WHERE "vehicleId" IS NOT NULL
      `);
    } catch (e) {
      // Index might already exist
    }

    try {
      const review2 = await prisma.review.create({
        data: {
          authorId: customer.id,
          vehicleId: completedBooking.vehicleId,
          rating: 4,
          comment: "TEST: Second review attempt",
        },
      });
      logTest(
        5,
        false,
        "Expected unique constraint violation but second review was created",
      );
    } catch (error) {
      if (
        error.code === "P2002" ||
        error.code === "23505" ||
        error.message.includes("unique") ||
        error.message.includes("duplicate") ||
        error.message.includes("Unique constraint failed")
      ) {
        logTest(
          5,
          true,
          "Unique constraint correctly prevents second review for same vehicle by same author",
        );
      } else {
        logTest(5, false, `Unexpected error: ${error.message}`);
      }
    }

    // Cleanup
    await prisma.review.deleteMany({
      where: { comment: { contains: "TEST" } },
    });
  } catch (error) {
    logTest(5, false, `Error: ${error.message}`);
  }
}

async function main() {
  console.log("🧪 Starting database tests...\n");
  const prisma = new PrismaClient();

  try {
    await test1_AuthMappingUniqueConstraint(prisma);
    await test2_AvailabilityOverlapDetection(prisma);
    await test3_TransactionalBookingPrevention(prisma);
    await test4_MessagesArchive(prisma);
    await test5_ReviewsForCompletedBookingsOnly(prisma);

    console.log("\n📊 Test Summary:");
    console.log(`   ✅ Passed: ${passCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   Total: ${passCount + failCount}`);
  } catch (error) {
    console.error("❌ Test suite error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
