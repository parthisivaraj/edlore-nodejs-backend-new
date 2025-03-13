import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ErrorLoggingInterceptor } from './error-logging-interceptor.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = new ConfigService();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  app.use(bodyParser.json({ limit: '900mb' }));
  app.use(bodyParser.urlencoded({ limit: '900mb', extended: true }));

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.useGlobalInterceptors(new ErrorLoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Edlore')
    .setDescription('Edlore API description')
    .setVersion('1.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const customOptions: SwaggerCustomOptions = {
    customCss: `
    .swagger-ui .info {
      margin: 5px 0;
    }
    .swagger-ui .scheme-container {
      margin: 0 0 5px;
      padding: 5px 0;
    }    
    `,
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: false,
    },
    customSiteTitle: 'Edlore Backend',
  };

  SwaggerModule.setup('swagger-api', app, document, customOptions);

  const port = configService.get('PORT') || 5100;
  console.log('🚀 ~ bootstrap ~ port:', port);
  await app.listen(port);
  console.log(`http://localhost:${port}/swagger-api`);
}
bootstrap();
