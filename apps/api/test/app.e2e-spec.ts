import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { default as request } from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /auth/login returns 405 (GET not allowed)', () => {
    return request(app.getHttpServer()).get('/auth/login').expect(404);
  });

  it('POST /auth/login with bad credentials returns 401', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrongpassword' })
      .expect(401);
  });

  it('GET /accounts without auth returns 401', () => {
    return request(app.getHttpServer()).get('/accounts').expect(401);
  });
});
