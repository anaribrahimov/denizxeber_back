import * as winston from 'winston';
import 'winston-daily-rotate-file';

export const accessLogger = winston.createLogger({
  transports: [
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'access-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});
