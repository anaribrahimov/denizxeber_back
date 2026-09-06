import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AppValidationPipe } from './common/validators/pipes/validation.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new AppValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
