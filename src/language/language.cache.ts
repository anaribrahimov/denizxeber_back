import { Language } from "./language.entity.js";

export const languages: Language[] = [
  { id: 1, name: 'az' } as Language,
  { id: 2, name: 'en' } as Language,
  { id: 3, name: 'ru' } as Language,
  { id: 4, name: 'tr' } as Language,
  { id: 5, name: 'kz' } as Language,
  { id: 6, name: 'tm' } as Language,
];

export const languageCodes = languages.map((item) => item.name);
