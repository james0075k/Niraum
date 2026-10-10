import { Fragment, type ReactNode } from 'react';
import { TBC_RE } from '@/content/placeholders';
import { useT } from '@/hooks/useLang';

/**
 * Renders a single placeholder chip, e.g. <Tbc>Phone</Tbc> → "[PLACEHOLDER: Phone]"
 * ("[पुष्टि हुन बाँकी: …]" on /ne). `data-placeholder` keeps the pre-launch
 * `grep PLACEHOLDER dist/` check working in both languages.
 */
export function Tbc({ children }: { children: ReactNode }) {
  const { t } = useT();
  return (
    <span className="tbc" title={t('tbc.title')} data-placeholder="PLACEHOLDER">
      [{t('tbc.prefix')}: {children}]
    </span>
  );
}

/** Highlights any "[PLACEHOLDER: …]" fragments inside a plain string. */
export function TbcText({ text }: { text: string }) {
  const { t } = useT();
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(new RegExp(TBC_RE.source, 'g'))) {
    const i = m.index ?? 0;
    if (i > last) parts.push(text.slice(last, i));
    parts.push(
      <span key={i} className="tbc" title={t('tbc.title')} data-placeholder="PLACEHOLDER">
        {m[0].replace('PLACEHOLDER', t('tbc.prefix'))}
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
