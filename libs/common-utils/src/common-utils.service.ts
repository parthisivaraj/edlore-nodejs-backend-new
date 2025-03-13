import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonUtilsService {
  static roundNumber = (num: number, decimals = 2) => {
    const t = Math.pow(10, decimals);
    let result = Math.round((num + Number.EPSILON) * t) / t;
    if (num < 0) {
      result = result * -1;
    }
    return result;
  };

  static delaySeconds = async (seconds) => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(seconds * 1000);
  };

  static getExtension = (filename: string) => {
    return filename.split('.').pop();
  };
}
