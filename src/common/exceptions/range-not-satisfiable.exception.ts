import { HttpException } from '@nestjs/common';

export class RangeNotSatisfiableException extends HttpException {
  constructor(public readonly sizeByte: number) {
    super('Range Not Satisfiable', 416);
  }
}
