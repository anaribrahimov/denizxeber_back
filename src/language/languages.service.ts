import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { Language } from './language.entity.js';
// import type { Cat } from './interfaces/cat.interface.js';

// type Language = {
//   id: number;
//   name: string;
// };

@Injectable()
export class LanguagesService {
  private readonly languages: Language[] = [];

  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  async findAll(): Promise<Language[]> {
    return this.languageRepository.find();
  }
}
