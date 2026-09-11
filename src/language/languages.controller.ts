import { Controller, Get } from '@nestjs/common';
import { LanguagesService } from './languages.service.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('languages')
@Public()
export class LanguagesController {

  constructor(private languagesService: LanguagesService) {}

  @Get()
  async findAll() {
    return {
      data: await this.languagesService.findAll(),
    }
  }
}
