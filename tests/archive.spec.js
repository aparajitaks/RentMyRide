describe('archive-messages script', () => {
  const origExitCode = process.exitCode;
  afterEach(() => {
    jest.resetModules();
    process.exitCode = origExitCode;
  });

  it('runs main successfully when db calls succeed', async () => {
    const mockExec = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const mockDisconnect = jest.fn().mockResolvedValue(null);
    const PrismaMock = function() {
      this.$executeRawUnsafe = mockExec;
      this.$disconnect = mockDisconnect;
    };

    jest.doMock('../prisma-client-app', () => ({ PrismaClient: PrismaMock }));
    const mod = require('../scripts/archive-messages');
    await expect(mod.main()).resolves.toBeUndefined();
    expect(mockExec).toHaveBeenCalledTimes(2);
    expect(mockDisconnect).toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  it('sets exit code when db call fails and logs message', async () => {
    const mockExec = jest.fn().mockRejectedValueOnce(new Error('boom'));
    const mockDisconnect = jest.fn().mockResolvedValue(null);
    const PrismaMock = function() {
      this.$executeRawUnsafe = mockExec;
      this.$disconnect = mockDisconnect;
    };
    jest.doMock('../prisma-client-app', () => ({ PrismaClient: PrismaMock }));
    const mod = require('../scripts/archive-messages');
    await expect(mod.main()).resolves.toBeUndefined();
    expect(mockExec).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
