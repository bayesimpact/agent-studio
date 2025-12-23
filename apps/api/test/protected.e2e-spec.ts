import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/jwt-auth.guard';

// Mock Langfuse to avoid dynamic import issues in Jest
jest.mock('langfuse', () => {
  return {
    Langfuse: class {
      constructor() {}
      shutdownAsync() { return Promise.resolve(); }
      flushAsync() { return Promise.resolve(); }
      trace() { return { update: jest.fn() }; }
    },
  };
});

describe('ProtectedController (e2e)', () => {
  let app: INestApplication;

  describe('Unauthorized', () => {
    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('/protected (GET) should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/protected')
        .expect(401);
    });
  });

  describe('Authorized', () => {
    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('/protected (GET) should return 200 with valid token (mocked)', () => {
      return request(app.getHttpServer())
        .get('/protected')
        .expect(200)
        .expect('This route is protected!');
    });
  });
});
