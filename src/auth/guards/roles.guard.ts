import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { Role } from '../../roles/role.entity.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles: string[] = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // console.log('required roles', requiredRoles);

    if (!requiredRoles || !requiredRoles.length) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user.role) return false;

    // console.log('user', user);

    return requiredRoles.includes(user.role.name);
  }
}
