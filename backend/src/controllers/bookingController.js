// backend/src/controllers/bookingController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// GET /api/cars/:id/availability
export const getCarAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const bookings = await prisma.booking.findMany({
      where: { carId: parseInt(id) },
      select: { startDate: true, endDate: true },
    });

    // Format for flatpickr 'disable' property
    const bookedDates = bookings.map((booking) => ({
      from: booking.startDate.toISOString().split('T')[0],
      to: booking.endDate.toISOString().split('T')[0], // <-- Fixed!
    }));

    res.status(200).json(bookedDates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availability', details: error.message });
  }
};
// POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const { carId, startDate, endDate } = req.body;
    const userId = req.user.id; // From 'protect' middleware

    const newStartDate = new Date(startDate);
    const newEndDate = new Date(endDate);

    if (newEndDate <= newStartDate) {
      return res.status(400).json({ error: 'End date must be after start date.' });
    }

    // --- Core Conflict Check Logic ---
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        carId: parseInt(carId),
        AND: [
          {
            startDate: {
              lt: newEndDate,
            },
          },
          {
            endDate: {
              gt: newStartDate,
            },
          },
        ],
      },
    });

    if (conflictingBooking) {
      return res.status(409).json({ error: 'These dates are unavailable.' });
    }

    // --- No Conflict: Create the booking ---
    const newBooking = await prisma.booking.create({
      data: {
        carId: parseInt(carId),
        userId: userId,
        startDate: newStartDate,
        endDate: newEndDate,
      },
    });

    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking', details: error.message });
  }
};

