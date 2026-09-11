// src/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private config: ConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const env = this.config.get<string>('app.env') ?? 'development';
    const isDev = env === 'development';

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const isServerError = status >= 500;

    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : null;

    // Normalize to an object so we can safely spread it.
    // Nest exceptions can return either a plain string or an object.
    const exceptionBody =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as Record<string, any>) ?? {};

    const safeMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any)?.message;

    const errorMessage =
      exception instanceof Error ? exception.message : String(exception);
    const stack = exception instanceof Error ? exception.stack : undefined;

    // Only 5xx goes to error.log
    if (isServerError) {
      this.logger.error('Server error', {
        status,
        message: errorMessage,
        stack,
        path: request.url,
        method: request.method,
        body: this.sanitizeBody(request.body),
      });
    } else if (isDev) {
      // Optional: still useful to see 4xx during dev, just not in error.log
      this.logger.debug('Client error', {
        status,
        message: safeMessage,
        ...exceptionBody,
        path: request.url,
        method: request.method,
      });
    }

    const basePayload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    let payload: Record<string, any>;

    if (isServerError) {
      // 5xx: never trust exceptionBody's shape, always fully controlled
      payload = {
        ...basePayload,
        message: isDev ? errorMessage : 'Internal server error',
        ...(isDev ? { stack } : {}),
      };
    } else {
      // 4xx: pass through everything the exception carried
      // (message, error, validation errors array, custom fields, etc.)
      // but let our own statusCode/timestamp/path win if there's a clash
      payload = {
        ...exceptionBody,
        ...basePayload,
      };
    }

    response.status(status).json(payload);
  }

  private sanitizeBody(body: unknown) {
    if (!body || typeof body !== 'object') return body;
    const clone = { ...(body as Record<string, any>) };
    for (const key of ['password', 'token', 'authorization', 'secret']) {
      if (key in clone) clone[key] = '***REDACTED***';
    }
    return clone;
  }
}
