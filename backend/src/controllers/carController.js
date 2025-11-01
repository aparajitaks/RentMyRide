// backend/src/controllers/carController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// GET /api/cars (Public)
export const getAllCars = async (req, res) => {
  try {
    const cars = await prisma.car.findMany();
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cars', details: error.message });
  }
};

// GET /api/cars/:id (Public)
export const getCarById = async (req, res) => {
  try {
    const { id } = req.params;
    const car = await prisma.car.findUnique({
      where: { id: parseInt(id) },
    });
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch car', details: error.message });
  }
};

// POST /api/cars (Protected)
export const createCar = async (req, res) => {
  try {
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
    res.status(500).json({ error: 'Failed to create car', details: error.message });
  }
};
