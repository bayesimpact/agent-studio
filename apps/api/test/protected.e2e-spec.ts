import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/jwt-auth.guard';

// NOTE: How to run this test:
// npx jest --config ./test/jest-e2e.json test/protected.e2e-spec.ts

// Mock Langfuse to avoid dynamic import issues in Jest
jest.mock('langfuse', () => {
  return {
    Langfuse: class {
      constructor() { }
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

    it('/protected/hello (GET) should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/protected/hello')
        .expect(401);
    });
  });

  describe('Authorized', () => {
    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: (context) => {
            const request = context.switchToHttp().getRequest();
            request.user = { sub: 'test-user-123' };
            return true;
          },
        })
        .compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('/protected/hello (GET) should return 200 with valid token (mocked)', () => {
      return request(app.getHttpServer())
        .get('/protected/hello')
        .expect(200)
        .expect('Protected api route accessed by user: test-user-123');
    });
  });
});
