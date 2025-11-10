const path = require('path');
const { pathToFileURL } = require('url');

describe('carController additional endpoints (mock)', () => {
  let mod;
  let getAllCars, getCarById, createCar, __setPrismaForTest;
  let mockPrisma;

  beforeAll(async () => {
    mod = await import(
      pathToFileURL(path.resolve(__dirname, '../backend/src/controllers/carController.js')).href
    );
    getAllCars = mod.getAllCars;
    getCarById = mod.getCarById;
    createCar = mod.createCar;
    __setPrismaForTest = mod.__setPrismaForTest;

    mockPrisma = {
      car: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      booking: { findMany: jest.fn() },
    };
    __setPrismaForTest(mockPrisma);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAllCars returns cars on success', async () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockPrisma.car.findMany.mockResolvedValueOnce([{ id: 1, make: 'Toy', model: 'Car' }]);
    await getAllCars(req, res);
    expect(mockPrisma.car.findMany).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ id: 1, make: 'Toy', model: 'Car' }]);
  });

  it('getAllCars returns 500 on db error', async () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockPrisma.car.findMany.mockRejectedValueOnce(new Error('fail'));
    await getAllCars(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to fetch cars' }));
  });

  it('getCarById returns 404 when not found', async () => {
    const req = { params: { id: '42' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockPrisma.car.findUnique.mockResolvedValueOnce(null);
    await getCarById(req, res);
    expect(mockPrisma.car.findUnique).toHaveBeenCalledWith({ where: { id: 42 } });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Car not found' });
  });

  it('getCarById returns car when found', async () => {
    const req = { params: { id: '7' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const carObj = { id: 7, make: 'A', model: 'B' };
    mockPrisma.car.findUnique.mockResolvedValueOnce(carObj);
    await getCarById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(carObj);
  });

  it('createCar creates car and returns 201', async () => {
    const req = {
      body: { make: 'X', model: 'Y', year: '2020', pricePerDay: '12.5', image: 'u.jpg' },
      user: { id: 99 },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const created = { id: 100, make: 'X', model: 'Y' };
    mockPrisma.car.create.mockResolvedValueOnce(created);
    await createCar(req, res);
    expect(mockPrisma.car.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ make: 'X', model: 'Y', ownerId: 99 }),
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it('createCar returns 500 on error', async () => {
    const req = { body: {}, user: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockPrisma.car.create.mockRejectedValueOnce(new Error('oops'));
    await createCar(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to create car' }));
  });
});
