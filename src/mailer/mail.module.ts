import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
          transport: {
              host: configService.get('SMTP_ADDRESS'),
              port: configService.get('SMTP_PORT'),
              auth: {
                user: configService.get('SMTP_USER_NAME'),
                pass: configService.get('SMTP_PASSWORD'),
              },
        },
        defaults: {
          from: '"Edlore" <'+ configService.get('MAILER_FROM') + '>',
        },
        template: {
          dir: join(__dirname, 'mailer/templates'),
          adapter: new HandlebarsAdapter(), 
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
})
export class MailModule {}