import { FileRange } from "../interfaces/file-stream.interface.js";

export function parseRangeHeader(
  rangeHeader: string | undefined | null,
  size: number,
): FileRange | null {
  if (!rangeHeader) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return null; // malformed -> fall back to full file

  const [, startStr, endStr] = match;
  if (startStr === '' && endStr === '') return null;

  let start: number;
  let end: number;

  if (startStr === '') {
    // suffix range: bytes=-500 -> last 500 bytes
    const suffixLength = parseInt(endStr, 10);
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    start = parseInt(startStr, 10);
    end = endStr === '' ? size - 1 : parseInt(endStr, 10);
  }

  return { start, end };
}
