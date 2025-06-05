// test/mock-auth.module.ts
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '@app/config';
import { MailerService } from '@nestjs-modules/mailer';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, OTP, DeviceToken } from '@app/schema';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/jwt.strategy';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { MediaModuleAuth } from './mock-media.module';

@Module({
  imports: [MediaModuleAuth],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    {
      provide: JwtService,
      useValue: {
        sign: jest.fn().mockReturnValue('test'),
        verify: jest.fn(),
        decode: jest.fn(),
      },
    },
    {
      provide: AppConfigService,
      useValue: {
        getAWSConfig: () => ({ frontEndURL: 'http://localhost:3000' }),
        getMachineInfo: () => ({ mode: 'OFFLINE' }),
        getClient: () => ({ client: 'DEMO' }),
        getMailerConfig: () => ({
          media_domain: 'mock-domain',
          login_domain: 'mock-login',
        }),
        getJWTConfig: () => ({ secret: 'test_secret' }),
      },
    },
    { provide: MailerService, useValue: { sendMail: jest.fn() } },
    {
      provide: getRepositoryToken(User),
      useValue: {
        findOne: jest.fn(),
        save: jest.fn(),
      },
    },
    {
      provide: getRepositoryToken(OTP),
      useValue: { findOne: jest.fn(), save: jest.fn(), delete: jest.fn() },
    },
    {
      provide: getRepositoryToken(DeviceToken),
      useValue: { delete: jest.fn() },
    },
  ],
})
export class MockAuthModule {}
