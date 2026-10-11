import { CsvError, parseCsv } from '../src/utils/csv.js';

const cells = (text: string) => parseCsv(text).map((r) => r.cells);

describe('parseCsv', () => {
  it('splits plain rows and numbers lines from 1', () => {
    expect(parseCsv('a,b\n1,2\n')).toEqual([
      { line: 1, cells: ['a', 'b'] },
      { line: 2, cells: ['1', '2'] },
    ]);
  });

  it('handles CRLF, a UTF-8 BOM and a missing trailing newline', () => {
    expect(parseCsv('﻿a,b\r\n1,2\r\n3,4')).toEqual([
      { line: 1, cells: ['a', 'b'] },
      { line: 2, cells: ['1', '2'] },
      { line: 3, cells: ['3', '4'] },
    ]);
  });

  it('keeps empty cells', () => {
    expect(cells('a,,c,\n')).toEqual([['a', '', 'c', '']]);
  });

  it('reads quoted fields with commas, escaped quotes and newlines', () => {
    const rows = parseCsv('x,y\n"a, b","say ""hi"""\n"two\nlines",z\nlast,row\n');
    expect(rows.map((r) => r.cells)).toEqual([
      ['x', 'y'],
      ['a, b', 'say "hi"'],
      ['two\nlines', 'z'],
      ['last', 'row'],
    ]);
    // A record keeps the line it starts on; the next record counts the embedded newline.
    expect(rows.map((r) => r.line)).toEqual([1, 2, 3, 5]);
  });

  it('skips blank lines but keeps counting them', () => {
    expect(parseCsv('a\n\n\nb\n')).toEqual([
      { line: 1, cells: ['a'] },
      { line: 4, cells: ['b'] },
    ]);
  });

  it('rejects an unterminated quote with its line', () => {
    expect(() => parseCsv('a,b\n"open,1\n')).toThrow(CsvError);
    try {
      parseCsv('a,b\n"open,1\n');
    } catch (err) {
      expect((err as CsvError).line).toBe(2);
    }
  });

  it('rejects text after a closing quote', () => {
    expect(() => parseCsv('"a"b,c\n')).toThrow(/line 1/);
  });
});
