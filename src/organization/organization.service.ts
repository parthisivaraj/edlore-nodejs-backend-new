import { AppConfigService } from '@app/config';
import { Injectable } from '@nestjs/common';

export const ClientData = {
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
  demo: {
    org_logo: 'logo-demo.png',
    title: 'Edlore',
    description: 'Maintenance Intelligence at Your Fingertips',
  },
  ncms: {
    org_logo: 'logo-ncms.png',
    title: 'NCMS',
    description: 'Office of NAVAL Research (ONR)',
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
    const clientData = ClientData[client.toLowerCase()];
    return {
      ...clientData,
      org_logo: `${this.frontendURL}/${clientData.org_logo}`,
      message: 'Success',
    };
  }
}
