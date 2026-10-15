import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { languages } from "../../language/language.cache.js";
import { AuthUser } from "../../auth/interfaces/auth-user.interface.js";
import { ValidationException } from "../exceptions/validation.exception.js";

@Injectable()
export class LanguageQueryGuard implements CanActivate {

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const langCode = req.query?.langCode;
    const user: AuthUser = req.user;

    if (!langCode?.trim()) {
      return true;
    }

    const language = languages.find(
      (item) => item.name === langCode
      || item.name.toLowerCase() === langCode.toLowerCase()
    );

    if (!language) {
      throw new ValidationException({ langCode: ['Wrong language code'] });
    }

    if (user && !user.langIds.includes(language.id)) {
      throw new ForbiddenException(
        `Language '${language.name}' is not permitted for this user.`,
      );
    }

    req.language = language;
    return true;
  }
}
