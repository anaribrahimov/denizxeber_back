import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthUser } from "../../auth/interfaces/auth-user.interface.js";

@Injectable()
export class UserHasLanguages implements CanActivate {

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user: AuthUser = req.user;

    if (!user) {
      return false;
    }

    if (!user.langIds.length) {
      throw new ForbiddenException('User has not selected any language');
    }

    return true;
  }
}
