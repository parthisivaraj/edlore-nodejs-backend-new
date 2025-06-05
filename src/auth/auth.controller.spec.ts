import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OTP, User } from '@app/schema';
import { MockAuthModule } from '../../test/mock-auth.module';

describe('AuthController - sign_in & validate_2factor', () => {
  let app: INestApplication;

  let mockUserRepository;
  let mockOtpRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MockAuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    mockUserRepository = moduleFixture.get(getRepositoryToken(User));
    mockOtpRepository = moduleFixture.get(getRepositoryToken(OTP));

    mockUserRepository.findOne.mockResolvedValue({
      id: 'user123',
      email: 'admin@edlore.com',
      encrypted_password: await bcrypt.hash('password', 10),
      user_roles: [{ role: { title: 'Admin', id: 'role123' } }],
      organization: { id: 'org123', name: 'Test Org' },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /auth/sign_in (admin) should return token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/sign_in')
      .set('Admin', 'true')
      .send({ email: 'admin@edlore.com', password: 'password' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('email');
  });

  it('POST /auth/sign_in with wrong credentials should return 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/sign_in')
      .set('Admin', 'true')
      .send({ email: 'admin@edlore.com', password: 'password1' });

    expect(response.status).toBe(401);
  });

  it('POST /auth/validate_2factor should validate OTP and return token', async () => {
    const otpTime = new Date();
    mockOtpRepository.findOne.mockResolvedValue({
      otp: '123456',
      token: 'token123',
      created_at: otpTime,
    });

    const response = await request(app.getHttpServer())
      .post('/auth/validate_2factor')
      .send({
        email: 'admin@edlore.com',
        otp: '123456',
        token: 'token123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
    expect(response.body.message).toBe('Success');
  });

  afterAll(async () => {
    await app.close();
  });
});
