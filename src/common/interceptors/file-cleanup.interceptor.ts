import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import * as fs from 'fs';

@Injectable()
export class FileCleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      catchError((error) => {
        const cleanup = (file?: Express.Multer.File) => {
          if (!file?.path) return;
          if (!fs.existsSync(file.path)) return;
          const stats = fs.statSync(file.path);
          if (stats.isDirectory()) request;
          fs.unlink(file.path, (err) => {
            if (err) console.error(`Failed to delete file ${file.path}:`, err);
          });
        };

        cleanup(request.file);
        if (Array.isArray(request.files)) {
          request.files.forEach(cleanup);
        }

        return throwError(() => error);
      }),
    );
  }
}
