import {
  Controller, Post, Body, UseGuards, Req, Res, Get
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { Public } from './decorators/public.decorator.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { LoginDto } from './dto/login-request.dto.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { RolesGuard } from './guards/roles.guard.js';
import { Roles } from './decorators/roles.decorator.js';

function meta(req: Request) {
  return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  // @Public()
  // @Post('register')
  // async register(
  //   @Body() dto: RegisterDto,
  //   @Req() req: Request,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   const { accessToken, refreshToken, refreshExpiresAt } =
  //     await this.authService.register(dto, meta(req));
  //   setRefreshCookie(res, refreshToken, refreshExpiresAt, this.config);
  //   return { accessToken };
  // }

  // LocalAuthGuard triggers LocalStrategy.validate(), attaches req.user
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() _dto: LoginDto, // kept for Swagger/validation; LocalStrategy reads req.body itself
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, /*refreshToken, refreshExpiresAt*/ } =
      await this.authService.login(req.user as any, meta(req));
    // setRefreshCookie(res, refreshToken, refreshExpiresAt, this.config);
    return { accessToken };
  }

  // @Public()
  // @Post('refresh')
  // async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  //   const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  //   if (!rawToken) throw new UnauthorizedException('No refresh token provided');

  //   const { accessToken, refreshToken, refreshExpiresAt } =
  //     await this.authService.refresh(rawToken, meta(req));
  //   setRefreshCookie(res, refreshToken, refreshExpiresAt, this.config);
  //   return { accessToken };
  // }

  // @Public()
  // @Post('logout')
  // async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  //   const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  //   if (rawToken) await this.authService.logout(rawToken);
  //   clearRefreshCookie(res, this.config);
  //   return { message: 'Logged out' };
  // }

  // // No @Public() — requires a valid access token (global JwtAuthGuard applies)
  // @Post('logout-all')
  // async logoutAll(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
  //   await this.authService.logoutAll(user.userId);
  //   clearRefreshCookie(res, this.config);
  //   return { message: 'Logged out from all devices' };
  // }

  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return { data: user };
  }

  // Example of role-restricted route
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @Get('admin-only')
  adminOnly() {
    return { message: 'Only admins see this' };
  }
}
