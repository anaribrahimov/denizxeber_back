import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AppValidationPipe } from './common/pipes/validation.pipe.js';
import { ClassSerializerInterceptor } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new AppValidationPipe());

  // Apply globally to the entire application
  // for returning response dto
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
