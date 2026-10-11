/**
 * CSV helpers for the assay screen: a small parser for the import preview (the API parses and
 * validates again — it is the authority) and a writer for "Download CSV". Mirrors
 * backend/src/utils/csv.ts: comma separator, `"` quoting with `""`, CRLF, UTF-8 BOM.
 */

export interface CsvRecord {
  line: number;
  cells: string[];
}

export function parseCsv(input: string): CsvRecord[] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const records: CsvRecord[] = [];
  let cells: string[] = [];
  let cell = '';
  let line = 1;
  let start = 1;
  let quoted = false;

  const endRecord = () => {
    cells.push(cell);
    if (!(cells.length === 1 && cells[0] === '')) records.push({ line: start, cells });
    cells = [];
    cell = '';
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        if (ch === '\n') line += 1;
        cell += ch;
      }
    } else if (ch === ',') {
      cells.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      endRecord();
      line += 1;
      start = line;
    } else if (ch === '"' && cell === '') {
      quoted = true;
    } else {
      cell += ch;
    }
  }
  if (quoted) throw new Error(`Line ${start}: a quoted field is never closed`);
  if (cell !== '' || cells.length > 0) endRecord();
  return records;
}

/** Spreadsheet formula prefixes neutralised on export (CSV injection). */
const FORMULA = /^[=+@\t\r]/;

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (typeof value === 'string' && FORMULA.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Rows → CSV text with a header row (LF line endings, trailing newline). */
export function toCsv<T extends Record<string, unknown>>(
  columns: readonly (keyof T & string)[],
  rows: readonly T[],
): string {
  const lines = [
    columns.join(','),
    ...rows.map((r) => columns.map((c) => cellText(r[c])).join(',')),
  ];
  return `${lines.join('\n')}\n`;
}

/** Starts a browser download of `text`. */
export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** File → text via FileReader (works in every browser and in jsdom). */
export function readFileText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsText(file);
  });
}
