import { IsEmail, IsString } from 'class-validator';

export class SignInDto {
  @IsString({
    message: 'Please enter a valid email or username.',
  })
  email: string;

  @IsString({ message: 'Please enter a valid password.' })
  password: string;
}

export class SignInResponseDto {
  email: string;
  token: string;
  message: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  resetToken: string;

  @IsString()
  newPassword: string;
}

export class VerifyOTPDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;

  @IsString()
  token: string;
}

export class GetOTPDto {
  @IsEmail()
  email: string;
}
export class SignOutDto {
  @IsString()
  userId: string;
}
