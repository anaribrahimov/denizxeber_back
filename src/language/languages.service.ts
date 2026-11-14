import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm/browser/repository/Repository.js';
import { Language } from './language.entity.js';
import { languages } from './language.cache.js';


@Injectable()
export class LanguagesService {
  constructor(
    // @InjectRepository(Language)
    // private readonly languageRepository: Repository<Language>,
  ) {}

  findAll(): Language[] {
    return languages;
  }
}
