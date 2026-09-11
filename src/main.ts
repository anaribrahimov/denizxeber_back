import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AppValidationPipe } from './common/pipes/validation.pipe.js';
import { ClassSerializerInterceptor } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new AppValidationPipe());

  // Apply globally to the entire application
  // for returning response dto
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Denizxeber API')
    .setDescription('API documentation for Denizxeber API')
    .setVersion('1.0')
    .addBearerAuth() // if you use JWT auth
    .addTag('users')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
