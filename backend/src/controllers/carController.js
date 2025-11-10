// backend/src/controllers/carController.js
import { getPrisma, setPrismaForTest as _setPrisma } from "../models/prisma.js";

// test hook for injecting a mock prisma (delegates to shared model)
export function __setPrismaForTest(p) {
  _setPrisma(p);
}

// GET /api/cars/:id/availability
// Return booked date ranges for a car in ISO yyyy-mm-dd form for calendar disabling.
export const getCarAvailability = async (req, res) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    const bookings = await prisma.booking.findMany({
      where: { carId: parseInt(id, 10) },
      select: { startDate: true, endDate: true },
    });
    const ranges = bookings.map(b => ({
      from: b.startDate.toISOString().split('T')[0],
      to: b.endDate.toISOString().split('T')[0],
    }));
    return res.status(200).json(ranges);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch availability', details: err.message });
  }
};

// GET /api/cars (Public)
export const getAllCars = async (req, res) => {
  try {
    const prisma = getPrisma();
    const cars = await prisma.car.findMany();
    res.status(200).json(cars);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch cars", details: error.message });
  }
};

// GET /api/cars/:id (Public)
export const getCarById = async (req, res) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    const car = await prisma.car.findUnique({
      where: { id: parseInt(id) },
    });
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }
    res.status(200).json(car);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch car", details: error.message });
  }
};

// POST /api/cars (Protected)
export const createCar = async (req, res) => {
  try {
    const prisma = getPrisma();
    const { make, model, year, pricePerDay, image } = req.body;
    const ownerId = req.user.id; // From our 'protect' middleware

    const newCar = await prisma.car.create({
      data: {
        make,
        model,
        year: parseInt(year),
        pricePerDay: parseFloat(pricePerDay),
        image,
        ownerId: ownerId,
      },
    });
    res.status(201).json(newCar);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create car", details: error.message });
  }
};
