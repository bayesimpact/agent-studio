import { Test, TestingModule } from '@nestjs/testing';
import { ProtectedController } from './protected.controller';

describe('ProtectedController', () => {
  let controller: ProtectedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProtectedController],
    }).compile();

    controller = module.get<ProtectedController>(ProtectedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "This route is protected!"', () => {
      expect(controller.getHello()).toBe('This route is protected!');
    });
  });
});
