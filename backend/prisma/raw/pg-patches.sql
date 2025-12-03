-- Idempotent Postgres patches for RentMyRide
-- Safe to re-run multiple times

-- Ensure extensions required for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1) Add generated stored column booking_period on Booking
-- NOTE: Prisma model Booking maps to table "bookings"
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "booking_period" tsrange GENERATED ALWAYS AS (tsrange("startDate", "endDate", '[]')) STORED;

-- 2) Add CHECK constraint to ensure endDate >= startDate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_end_after_start'
  ) THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT booking_end_after_start CHECK (
        ("startDate" IS NULL) OR ("endDate" IS NULL) OR ("endDate" >= "startDate")
      );
  END IF;
END$$;

-- 3) Add exclusion constraint to prevent overlapping APPROVED/ACTIVE bookings for same vehicle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_no_overlap_excl'
  ) THEN
    -- Ensure btree_gist is available for = operator on vehicleId when using GIST
    PERFORM 1; -- no-op (btree_gist extension created above)
    ALTER TABLE "bookings"
      ADD CONSTRAINT booking_no_overlap_excl EXCLUDE USING GIST (
        "vehicleId" WITH =,
        "booking_period" WITH &&
      ) WHERE (status IN ('CONFIRMED','ACTIVE'));
  END IF;
END$$;

-- 4) Create messages_archive LIKE Message INCLUDING ALL
-- Prisma Message model maps to "messages"
CREATE TABLE IF NOT EXISTS "messages_archive" (LIKE "messages" INCLUDING ALL);

-- 5) Trigger function to enforce Review insertion only for COMPLETED bookings
CREATE OR REPLACE FUNCTION enforce_review_for_completed_booking()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_status text;
BEGIN
  IF NEW."bookingId" IS NULL THEN
    RAISE EXCEPTION 'Review must reference a booking';
  END IF;

  SELECT "status" INTO v_status FROM "bookings" WHERE id = NEW."bookingId";
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Related booking % not found', NEW."bookingId";
  END IF;
  IF v_status IS NULL OR v_status <> 'COMPLETED' THEN
    RAISE EXCEPTION 'Cannot create review unless related booking is COMPLETED';
  END IF;
  RETURN NEW;
END; $$;

-- Create trigger if missing
DO $$
BEGIN
  -- Only create trigger if reviews.bookingId exists in schema
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'bookingId'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_review_booking_completed') THEN
      CREATE TRIGGER trg_review_booking_completed
        BEFORE INSERT ON "reviews"
        FOR EACH ROW EXECUTE FUNCTION enforce_review_for_completed_booking();
    END IF;
  ELSE
    -- If trigger exists but schema lacks bookingId, drop it to avoid runtime errors
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_review_booking_completed') THEN
      DROP TRIGGER trg_review_booking_completed ON "reviews";
    END IF;
  END IF;
END$$;

-- 6) Create useful indexes if missing (wrapped in table-exists guards)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'bookings' AND relkind = 'r') THEN
    CREATE INDEX IF NOT EXISTS idx_booking_vehicle_dates ON "bookings" ("vehicleId", "startDate", "endDate");
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'businesses' AND relkind = 'r') THEN
    CREATE INDEX IF NOT EXISTS idx_business_city ON "businesses" ("city");
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'messages' AND relkind = 'r') THEN
    -- Fallback useful indexes based on existing columns in current schema
    CREATE INDEX IF NOT EXISTS idx_messages_sender_time ON "messages" ("senderId", "createdAt");
    CREATE INDEX IF NOT EXISTS idx_messages_receiver_time ON "messages" ("receiverId", "createdAt");
    -- partial index for unread messages per receiver
    CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON "messages" ("receiverId") WHERE ("isRead" = false);
  END IF;
END$$;

-- End of file
