import { Controller, Get } from '@nestjs/common';
import { LanguagesService } from './languages.service.js';
import { Language } from './language.entity.js';

@Controller('api/languages')
export class LanguagesController {

  constructor(private languagesService: LanguagesService) {}

  @Get()
  async findAll() {
    return {
      data: await this.languagesService.findAll(),
    }
  }
}
