export interface FileRange {
  start: number;
  end: number;
}

export interface ReadFileResult {
  stream: NodeJS.ReadableStream;
  mimetype: string;
  sizeByte: number;
  durationSec: number | null;
  start: number;
  end: number;
  status: 200 | 206;
}
