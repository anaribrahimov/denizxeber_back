import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { languages } from "../../language/language.cache.js";
import { AuthUser } from "../../auth/interfaces/auth-user.interface.js";

@Injectable()
export class LanguageGuard implements CanActivate {

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const langCode = req.params?.lang;
    const user: AuthUser = req.user;

    const language = languages.find(
      (item) => item.name === langCode 
      || item.name.toLowerCase() === langCode.toLowerCase()
    );

    if (!language) {
      throw new NotFoundException(
        `Language '${langCode}' is not supported. `
        + `Supported: ${languages.map((item) => item.name).join(', ')}`,
      );
    }

    if (user && !user.langIds?.includes(language.id)) {
      throw new ForbiddenException(
        `Language '${language.name}' is not permitted for this user.`,
      );
    }

    req.language = language;
    return true;
  }
}
