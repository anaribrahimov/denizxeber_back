import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Language } from '../../language/language.entity.js';

export const CurrentLanguage = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Language => {
    const req = ctx.switchToHttp().getRequest();
    return req.language;
  },
);
