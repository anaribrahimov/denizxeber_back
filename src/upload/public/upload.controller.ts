import { Controller, Get, Headers, NotFoundException, Param, Res } from "@nestjs/common";
import { UploadService } from "../upload.service.js";
import { Public } from "../../auth/decorators/public.decorator.js";
import { RangeNotSatisfiableException } from "../../common/exceptions/range-not-satisfiable.exception.js";
import { ReadFileResult } from "../../common/interfaces/file-stream.interface.js";

@Controller()
@Public()
export class PublicUploadController {

  constructor(
    private readonly uploadService: UploadService,
  ) { }

  @Get('/content/uploads/*fileKey')
  public async readFile(
    @Param('fileKey') params: string[],
    @Headers('range') rangeHeader: string | undefined,
    @Res() res: any,
  ) {
    const fileKey = Array.isArray(params) ? params.join('/') : null;
    if (!fileKey?.trim()) {
      throw new NotFoundException();
    }

    // console.log('range header', rangeHeader);

    let result: ReadFileResult;
    try {
      result = await this.uploadService.readFile(fileKey, rangeHeader);
    } catch (err) {
      if (err instanceof RangeNotSatisfiableException) {
        res.writeHead(416, { 'Content-Range': `bytes */${err.sizeByte}` });
        res.end();
        return;
      }
      throw err;
    }

    const { stream, mimetype, sizeByte, start, end, status } = result;

    res.writeHead(status, {
      'Content-Type': mimetype,
      'Content-Length': end - start + 1,
      'Accept-Ranges': 'bytes',
      ...(status === 206 ? { 'Content-Range': `bytes ${start}-${end}/${sizeByte}` } : {}),
    });

    stream.pipe(res);

    res.on('close', () => {
      if (typeof (stream as any).destroy === 'function') {
        (stream as any).destroy();
      }
    });
  }
}
