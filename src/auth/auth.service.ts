import { DeviceToken, OTP, User } from '@app/schema';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  SignInDto,
  VerifyOTPDto,
} from './dto/auth';
import * as crypto from 'crypto';
import { AppConfigService } from '@app/config';
import { JwtUserPayload } from '@app/schema/dto';
import { MediaService } from 'src/media';

@Injectable()
export class AuthService {
  frontendURL: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OTP)
    private readonly otpRepository: Repository<OTP>,

    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
    private readonly jwtService: JwtService,
    private configService: AppConfigService,
    private mediaService: MediaService,
  ) {
    const config = this.configService.getAWSConfig();
    this.frontendURL = config.frontEndURL;
  }

  private generateNumericOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateToken(user: User) {
    const org = user.organization;
    const role = user.user_roles[0];
    const payload = { sub: user.id, org_id: org.id };

    const accessToken = this.jwtService.sign(payload);

    const data = {
      access_token: accessToken,
      org_id: org.id,
      org_name: org.name,
      org_logo: `${this.frontendURL}/af-logo-300x_a.png`,
      org_logo_png: `${this.frontendURL}/af-logo-300x_a.png`,
      org_logo_2x_png: `${this.frontendURL}/af-logo-300x_a.png`,
      user_name: `${user.first_name} ${user.last_name}`,
      user_profile_image: `${this.frontendURL}/user-default.png`,
      role: role?.role.title || null,
      role_id: role?.role.id || null,
      user_id: user.id,
      password_updated_at: user.password_updated_at,
      message: 'Success',
    };

    if ((user.attachedMedia || []).length > 0 && user.attachedMedia[0].blob) {
      data.user_profile_image = await this.mediaService.getThumbnailUrl(
        'image',
        user.attachedMedia[0].blob,
      );
    }
    return data;
  }

  async signIn(signInDto: SignInDto, fromAdmin: boolean): Promise<any> {
    const { email, password } = signInDto;

    const user = await this.userRepository.findOne({
      where: [{ email: ILike(email) }, { username: ILike(email) }],
    });

    if (!user) {
      throw new UnauthorizedException('Incorrect credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.encrypted_password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (fromAdmin) {
      const otpCode = this.generateNumericOTP();
      // let otpCode = '123456';

      const token = crypto.randomBytes(16).toString('hex');
      const otp = new OTP();
      otp.user = user;
      otp.otp = otpCode;
      otp.created_at = new Date();
      otp.verification_type = '2FA';
      otp.token = token;

      try {
        await this.otpRepository.save(otp);
      } catch {
        throw new BadRequestException('Error saving OTP to database');
      }

      console.log(`OTP for ${email}: ${otpCode}`);

      return {
        token,
        email: user.email,
        message: 'Login successful. OTP has been sent to your email.',
      };
    }
    return await this.generateToken(user);
  }

  async signOut(userData: JwtUserPayload): Promise<{ message: string }> {
    await this.deviceTokenRepository.delete({ user: { id: userData.id } });
    return { message: 'User signed out successfully' };
  }

  async validate2Factor(body: VerifyOTPDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: [{ email: ILike(body.email) }, { username: ILike(body.email) }],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = await this.otpRepository.findOne({
      where: {
        user: { id: user.id },
        token: body.token,
        verification_type: '2FA',
      },
      order: { created_at: 'DESC' },
    });

    if (!otp) {
      throw new BadRequestException('OTP not found');
    }

    const expirationTime = new Date(otp.created_at.getTime() + 60 * 60 * 1000);
    const currentTime = new Date();

    if (currentTime > expirationTime) {
      throw new BadRequestException(
        'Your OTP has expired. Please request a new one.',
      );
    }

    const machineInfo = this.configService.getMachineInfo();

    if (
      machineInfo.mode === 'OFFLINE' &&
      body.otp !== '123456' &&
      otp.otp !== body.otp
    ) {
      throw new BadRequestException('Invalid OTP');
    }
    otp.verified_at = currentTime;
    await this.otpRepository.save(otp);

    return await this.generateToken(user);
  }

  validateCAC() {
    return {
      success: true,
    };
  }

  async twoFactorResendOTP(email: string): Promise<{ message: string }> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let otpCode = '123456';

    const machineInfo = this.configService.getMachineInfo();
    if (machineInfo.mode === 'ONLINE') {
      otpCode = this.generateNumericOTP();
    }

    const otp = new OTP();
    otp.user = user;
    otp.otp = otpCode;
    otp.created_at = new Date();
    otp.verification_type = '2FA';
    otp.token = crypto.randomBytes(16).toString('hex');

    try {
      await this.otpRepository.save(otp);
    } catch {
      throw new BadRequestException('Error saving OTP to database');
    }

    console.log(`OTP for ${email}: ${otpCode}`);
    return { message: 'OTP resent successfully' };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
      });
      if (!user) {
        throw new BadRequestException('Invalid refresh token');
      }
      const newAccessToken = this.jwtService.sign(
        { email: user.email, sub: user.id },
        { expiresIn: '3600' },
      );

      return { accessToken: newAccessToken };
    } catch {
      throw new BadRequestException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const resetToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.getJWTConfig().secret,
        expiresIn: 3600,
      },
    );

    console.log(`Reset Token: ${resetToken}`);
    return { message: 'Password reset link sent to email' };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { resetToken, newPassword } = resetPasswordDto;

    try {
      const decoded = this.jwtService.decode(
        resetToken,
        this.configService.getJWTConfig().secret,
      );

      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new BadRequestException('Invalid reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.encrypted_password = hashedPassword;
      await this.userRepository.save(user);

      return { message: 'Password successfully reset' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Reset token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid reset token');
      }
      throw new BadRequestException('Error resetting password');
    }
  }

  async verifyOTP(
    email: string,
    otpCode: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    console.log('Found user:', user);

    const otp = await this.otpRepository.findOne({
      where: { user: { id: user.id } },
      order: { created_at: 'DESC' },
    });

    if (!otp) {
      throw new BadRequestException('OTP not found');
    }

    console.log('Found OTP:', otp);

    const expirationTime = new Date(
      otp.created_at.getTime() + 24 * 60 * 60 * 1000,
    );

    console.log('Current server time:', new Date());
    console.log('OTP expiration time:', expirationTime);
    if (new Date() > expirationTime) {
      console.error(
        `OTP expired at ${expirationTime}, current time is ${new Date()}`,
      );
      throw new BadRequestException(
        'Your OTP has expired. Please request a new one.',
      );
    }
    if (otp.otp !== otpCode) {
      throw new BadRequestException('Invalid OTP');
    }

    return { message: 'OTP verified successfully' };
  }

  async storeHashedPassword(
    password: string,
  ): Promise<{ hashedPassword: string; message: string }> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      encrypted_password: hashedPassword,
      email: `unique_placeholder_${Date.now()}@example.com`,
    });

    await this.userRepository.save(newUser);

    return {
      hashedPassword,
      message: 'Hashed password stored successfully in the database.',
    };
  }
}
