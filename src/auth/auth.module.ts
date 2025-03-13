import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DBSchemas } from '@app/schema';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AppConfigService } from '@app/config';
import { JwtStrategy } from './jwt.strategy';
import { MediaModule } from 'src/media';

@Module({
  imports: [
    DBSchemas.user,
    DBSchemas.otp,
    DBSchemas.deviceToken,
    MediaModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: async (configService: AppConfigService) => {
        const config = await configService.getJWTConfig();
        return {
          secret: config.secret,
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
})
export class AuthModule {}
