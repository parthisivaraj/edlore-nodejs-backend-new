import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

interface IMachineType {
  mode: 'OFFLINE' | 'ONLINE';
  type: 'SERVER' | 'SURFACE';
}

interface IClientType {
  client: 'AIRFORCE' | 'NAVSEA' | 'CAMCOKW' | 'DEMO' | 'NCMS';
}

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) { }

  public getTypeOrmConfig(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('POSTGRES_HOST'),
      port: this.configService.get('POSTGRES_PORT'),
      username: this.configService.get('POSTGRES_USER'),
      password: this.configService.get('POSTGRES_PASSWORD'),
      database: this.configService.get('POSTGRES_DATABASE'),
      migrationsTableName: 'migration',
      migrations: ['src/migration/*.ts'],
      synchronize: false,
      logging: true,
      // ssl: {
      //   rejectUnauthorized: false,
      // },
    };
  }

  public isProduction() {
    const mode = this.getNodeENV().nodeEnv;
    return mode != 'DEV';
  }

  public getPort() {
    return {
      port: this.configService.get('PORT'),
    };
  }

  public getNodeENV() {
    return {
      nodeEnv: this.configService.get('NODE_ENV'),
    };
  }

  public getClient(): IClientType {
    return {
      client: this.configService.get('CLIENT'),
    };
  }

  public getJWTConfig() {
    return {
      // algorithms: ['HS256' as const],
      secret: this.configService.get('JWT_SECRET'),
    };
  }

  public getMachineInfo(): IMachineType {
    return {
      mode: this.configService.get('MODE'),
      type: this.configService.get('MACHINE_TYPE'),
    };
  }

  public getMailgunConfig() {
    return {
      apiKey: this.configService.get('MAILGUN_API_KEY'),
    };
  }

  public getMarqoUrl() {
    return {
      marqoUrl: this.configService.get('MARQO_URL'),
      marqoApiKey: this.configService.get('MARQO_API_KEY'),
      localLLMURL: this.configService.get('LOCAL_LLM_URL'),
      openAIKey: this.configService.get('OPENAI_API_KEY'),
    };
  }

  public getAWSConfig() {
    return {
      accessKeyId: this.configService.get('AWS_S3_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_S3_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
      bucket: this.configService.get('AWS_S3_BUCKET'),
      frontEndURL: this.configService.get('FRONTEND_URL'),
    };
  }

  public getMailerConfig() {
    return {
      username: this.configService.get('SMTP_USER_NAME'),
      password: this.configService.get('SMTP_PASSWORD'),
      address: this.configService.get('SMTP_ADDRESS'),
      port: this.configService.get('SMTP_PORT'),
      from: this.configService.get('MAILER_FROM'),
      media_domain: this.configService.get('MAILER_MEDIA_DOMAIN'),
      login_domain: this.configService.get('LOGIN_DOMAIN'),
    };
  }
}
