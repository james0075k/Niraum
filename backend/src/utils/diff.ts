const SECRET_KEYS = /password|token|secret|hash/i;
const MAX_LEN = 200;

type Plain = Record<string, unknown>;

function summarise(value: unknown): unknown {
  if (typeof value === 'string' && value.length > MAX_LEN) return `${value.slice(0, MAX_LEN)}…`;
  if (value instanceof Date) return value.toISOString();
  return value;
}

/** Top-level field diff for the audit log. Secrets are omitted; long strings truncated. */
export function diffFields(before: Plain | null, after: Plain | null): Plain {
  const out: Plain = {};
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  for (const key of keys) {
    if (SECRET_KEYS.test(key) || key === 'updatedAt' || key === '__v') continue;
    const a = before?.[key];
    const b = after?.[key];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    out[key] = { from: summarise(a), to: summarise(b) };
  }
  return out;
}
