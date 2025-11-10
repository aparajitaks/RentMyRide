// Mock-based test for carController.js to enable coverage without MySQL
const path = require('path');
const { pathToFileURL } = require('url');

describe('getCarAvailability (mock)', () => {
  let getCarAvailability, __setPrismaForTest, mockPrisma;
  beforeAll(async () => {
    const mod = await import(
      pathToFileURL(path.resolve(__dirname, '../backend/src/controllers/carController.js')).href
    );
    getCarAvailability = mod.getCarAvailability;
    __setPrismaForTest = mod.__setPrismaForTest;
    mockPrisma = { booking: { findMany: jest.fn() }, car: { findMany: jest.fn() } };
    __setPrismaForTest(mockPrisma);
  });

  beforeEach(() => {
    mockPrisma.booking.findMany.mockReset();
  });

  it('returns empty array when no bookings', async () => {
    const req = { params: { id: '123' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockPrisma.booking.findMany.mockResolvedValueOnce([]);
    await getCarAvailability(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('returns mapped ranges for bookings', async () => {
    const req = { params: { id: '123' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockPrisma.booking.findMany.mockResolvedValueOnce([
      { startDate: new Date('2025-11-10'), endDate: new Date('2025-11-12') },
      { startDate: new Date('2025-12-01'), endDate: new Date('2025-12-05') },
    ]);
    await getCarAvailability(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { from: '2025-11-10', to: '2025-11-12' },
      { from: '2025-12-01', to: '2025-12-05' },
    ]);
  });
});
