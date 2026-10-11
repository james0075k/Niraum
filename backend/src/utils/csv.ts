/** A CSV syntax problem (unterminated quote, text after a closing quote) on `line`. */
export class CsvError extends Error {
  constructor(
    public readonly line: number,
    message: string,
  ) {
    super(`CSV line ${line}: ${message}`);
    this.name = 'CsvError';
  }
}

export interface CsvRecord {
  /** 1-based line the record starts on (quoted newlines make a record span lines). */
  line: number;
  cells: string[];
}

/**
 * Minimal RFC 4180 parser for small admin uploads: comma separator, `"` quoting with `""`
 * escapes, quoted commas/newlines, LF or CRLF, optional UTF-8 BOM. Blank lines are skipped
 * (but still counted, so line numbers match the file). Cells are returned untrimmed.
 */
export function parseCsv(input: string): CsvRecord[] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const records: CsvRecord[] = [];
  let cells: string[] = [];
  let cell = '';
  let line = 1;
  let start = 1;
  let quoted = false;
  // After a closing quote only a separator or line end may follow.
  let closed = false;
  let i = 0;

  const endRecord = () => {
    cells.push(cell);
    if (!(cells.length === 1 && cells[0] === '')) records.push({ line: start, cells });
    cells = [];
    cell = '';
    closed = false;
  };

  while (i < text.length) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        quoted = false;
        closed = true;
      } else {
        if (ch === '\n') line += 1;
        cell += ch;
      }
      i += 1;
      continue;
    }

    if (ch === ',') {
      cells.push(cell);
      cell = '';
      closed = false;
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      endRecord();
      line += 1;
      start = line;
    } else if (closed) {
      throw new CsvError(line, 'unexpected text after a closing quote');
    } else if (ch === '"' && cell === '') {
      quoted = true;
    } else {
      cell += ch;
    }
    i += 1;
  }

  if (quoted) throw new CsvError(start, 'unterminated quoted field');
  if (cell !== '' || cells.length > 0) endRecord();
  return records;
}
