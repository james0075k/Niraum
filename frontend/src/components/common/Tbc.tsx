import { Fragment, type ReactNode } from 'react';
import { TBC_RE } from '@/content/placeholders';

const TITLE = 'Placeholder — to be confirmed by Niraum Metals';

/** Renders a single placeholder chip, e.g. <Tbc>Phone</Tbc> → "[PLACEHOLDER: Phone]". */
export function Tbc({ children }: { children: ReactNode }) {
  return (
    <span className="tbc" title={TITLE}>
      [PLACEHOLDER: {children}]
    </span>
  );
}

/** Highlights any "[PLACEHOLDER: …]" fragments inside a plain string. */
export function TbcText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(new RegExp(TBC_RE.source, 'g'))) {
    const i = m.index ?? 0;
    if (i > last) parts.push(text.slice(last, i));
    parts.push(
      <span key={i} className="tbc" title={TITLE}>
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
