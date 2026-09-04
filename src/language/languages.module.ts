import { Module } from '@nestjs/common';
import { LanguagesController } from './languages.controller.js';
import { LanguagesService } from './languages.service.js';
import { Language } from './language.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Language])],
  controllers: [LanguagesController],
  providers: [LanguagesService],
  exports: [LanguagesService],
})
export class LanguagesModule {}
