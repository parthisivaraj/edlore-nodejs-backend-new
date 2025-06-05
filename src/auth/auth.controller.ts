import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Request,
  Response,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@app/common-utils';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  GetOTPDto,
  ResetPasswordDto,
  SignInDto,
  VerifyOTPDto,
} from './dto/auth';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign_in')
  @Public()
  @HttpCode(200)
  async signInWithOTP(
    @Body() signInDto: SignInDto,
    @Headers('Admin') admin: string,
    @Response() res,
  ) {
    try {
      const response = await this.authService.signIn(signInDto, !!admin);
      if (!!admin) {
        return res.status(200).json(response);
      } else {
        return res.status(200).json({
          code: 200,
          message: 'Success',
          data: response,
        });
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return res.status(401).json({
          code: 401,
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Incorrect credentials',
          data: {
            message: 'Incorrect credentials',
          },
        });
      }
    }
  }

  @Post('sign_out')
  @HttpCode(200)
  async signOut(@Request() req) {
    return await this.authService.signOut(req.user);
  }

  @Post('validate_2factor')
  @Public()
  @HttpCode(200)
  async validate2Factor(
    @Body() verifyOtpDto: VerifyOTPDto,
  ): Promise<{ message: string }> {
    return await this.authService.validate2Factor(verifyOtpDto);
  }
  @Post('validate_cac')
  @Public()
  @HttpCode(200)
  async validateCAC() {
    return await this.authService.validateCAC();
  }

  @Post('two_factor_resend_otp')
  @Public()
  @HttpCode(200)
  async twoFactorResendOTP(
    @Body() data: GetOTPDto,
  ): Promise<{ message: string }> {
    return await this.authService.twoFactorResendOTP(data.email);
  }

  @Post('forgot_password_reset')
  @Public()
  @HttpCode(200)
  async forgotPasswordReset(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      return await this.authService.resetPassword(resetPasswordDto);
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to reset password',
      );
    }
  }

  @Get('refresh_access_token')
  @HttpCode(200)
  async refreshAccessToken(@Body('refreshToken') refreshToken: string) {
    return await this.authService.refreshAccessToken(refreshToken);
  }

  @Post('forgot_password')
  @HttpCode(200)
  @Public()
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset_password')
  @HttpCode(200)
  @Public()
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Get('get_opt')
  @Public()
  async getOTP(@Query('email') email: string) {
    return await this.authService.getOtp(email);
  }

  @Post('verify_otp')
  @Public()
  @HttpCode(200)
  async verifyOTP(@Query('email') email: string, @Query('otp') otp: string) {
    return await this.authService.verifyOTP(email, otp);
  }

  @Post('reset_forgot_password')
  @Public()
  async resetfForgotPassword(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Body('password') password: string,
    @Body('password_confirmation') password_confirmation: string,
  ): Promise<any> {
    try {
      return await this.authService.forgotPasswordReset(
        email,
        otp,
        password,
        password_confirmation,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
