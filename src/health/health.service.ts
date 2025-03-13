import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  constructor() {}

  ping() {
    return { message: 'Server is working' };
  }
}
