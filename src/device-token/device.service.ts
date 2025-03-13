import { DeviceToken, User } from '@app/schema';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeviceTokenDTO } from './dto/device-token';
import { JwtUserPayload } from '@app/schema/dto';

@Injectable()
export class DeviceTokenService {
  constructor(
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createDeviceToken(
    body: CreateDeviceTokenDTO,
    userData: JwtUserPayload,
  ): Promise<any> {
    const { device_token } = body;
    const user = await this.userRepository.findOne({
      where: { id: userData.id },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const deviceToken = this.deviceTokenRepository.create({
      user,
      device_token,
      created_at: new Date(),
      updated_at: new Date(),
    });
    await this.deviceTokenRepository.save(deviceToken);

    return {
      message: 'Token has been saved successfully',
    };
  }
}
