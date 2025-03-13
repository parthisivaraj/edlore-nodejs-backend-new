import { AppConfigService } from '@app/config';
import { Injectable } from '@nestjs/common';

const ClientData = {
  airforce: {
    org_logo: 'logo-airforce.png',
    title: 'Air Force',
    description: 'Warner Robins Air Logistics Complex - CMXG/MSXG',
  },
  navsea: {
    org_logo: 'logo-navsea.png',
    title: 'NAVSEA',
    description: 'NAVSEA UNREP PORT HUENEME',
  },
  camcokw: {
    org_logo: 'logo-camcokw.png',
    title: 'CAMCOKW',
    description: 'CAMCOKW GLOBAL',
  },
};

@Injectable()
export class OrganizationService {
  frontendURL: string;

  constructor(private configService: AppConfigService) {
    const config = this.configService.getAWSConfig();
    this.frontendURL = config.frontEndURL;
  }

  logo() {
    const { client } = this.configService.getClient();
    console.log("====================",client)
    const clientData = ClientData[client.toLowerCase()];
    return {
      ...clientData,
      org_logo: `${this.frontendURL}/${clientData.org_logo}`,
      message: 'Success',
    };
  }
}
