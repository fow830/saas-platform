import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET) should return health status', () => {
      return request(app.getHttpServer()).get('/health').expect(200);
    });
  });

  describe('Auth', () => {
    let accessToken: string;
    let userId: string;
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
    };

    it('/api/auth/register (POST) should register new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      accessToken = response.body.accessToken;
      userId = response.body.user.id;
    });

    it('/api/auth/login (POST) should login user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      accessToken = response.body.accessToken;
    });

    it('/api/auth/profile (GET) should return user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
    });
  });

  describe('Plans', () => {
    it('/api/plans (GET) should return list of plans', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Services', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Create test user and login
      const testUser = {
        email: `test-services-${Date.now()}@example.com`,
        password: 'Test123!@#',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(testUser)
        .expect(200);

      accessToken = loginResponse.body.accessToken;
    });

    it('/api/services (GET) should return list of services', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/services')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/api/services/me (GET) should return user services', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/services/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Analytics', () => {
    let accessToken: string;

    beforeAll(async () => {
      const testUser = {
        email: `test-analytics-${Date.now()}@example.com`,
        password: 'Test123!@#',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(testUser)
        .expect(200);

      accessToken = loginResponse.body.accessToken;
    });

    it('/api/analytics/me (GET) should return user analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/analytics/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('servicesCount');
      expect(response.body).toHaveProperty('totalUsage');
      expect(response.body).toHaveProperty('invoicesCount');
      expect(response.body).toHaveProperty('totalSpent');
    });
  });
});

