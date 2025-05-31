import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

describe('PrismaService', () => {
  let service: PrismaService;
  let mockConnect: jest.Mock;
  let mockDisconnect: jest.Mock;

  beforeEach(async () => {
    mockConnect = jest.fn();
    mockDisconnect = jest.fn();

    // Mock PrismaClient
    jest.spyOn(PrismaClient.prototype, '$connect').mockImplementation(mockConnect);
    jest.spyOn(PrismaClient.prototype, '$disconnect').mockImplementation(mockDisconnect);

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should connect to the database', async () => {
      await service.onModuleInit();

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockConnect.mockRejectedValueOnce(error);

      await expect(service.onModuleInit()).rejects.toThrow(error);
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from the database', async () => {
      await service.onModuleDestroy();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnection errors', async () => {
      const error = new Error('Disconnection failed');
      mockDisconnect.mockRejectedValueOnce(error);

      await expect(service.onModuleDestroy()).rejects.toThrow(error);
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });
}); 