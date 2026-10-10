import { cn } from '@/lib/utils';

/** Common base words; a password containing one loses a point. */
const COMMON = [
  'password',
  'passw0rd',
  'qwerty',
  'letmein',
  'welcome',
  'admin',
  'iloveyou',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'sunshine',
  'princess',
  'abc123',
  '123456',
  '111111',
  'trustno1',
  'master',
  'superman',
  'niraum',
];

/**
 * Length-based score (NIST SP 800-63B favours length over composition rules):
 * <12 → 0, 12–15 → 2, 16–19 → 3, ≥20 → 4; minus 1 when every character is the same class
 * (all lowercase, all digits, …) or it contains a common word.
 */
// eslint-disable-next-line react-refresh/only-export-components -- pure helper shared with tests
export function passwordScore(pw: string): 0 | 1 | 2 | 3 | 4 {
  const n = pw.length;
  if (n < 12) return 0;
  let score = n >= 20 ? 4 : n >= 16 ? 3 : 2;
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(pw)).length;
  const lower = pw.toLowerCase();
  if (classes <= 1 || COMMON.some((w) => lower.includes(w))) score -= 1;
  return score as 0 | 1 | 2 | 3 | 4;
}

const LABELS = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
const COLORS = [
  'bg-destructive',
  'bg-destructive',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
];

/** Five-segment strength bar with a label; hidden until something is typed. */
export function PasswordStrength({
  password,
  className,
}: {
  password: string;
  className?: string;
}) {
  if (!password) return null;
  const score = passwordScore(password);
  return (
    <div className={cn('space-y-1', className)}>
      <div
        className="flex gap-1"
        role="meter"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
        aria-valuetext={LABELS[score]}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn('h-1.5 flex-1 rounded-full', i <= score ? COLORS[score] : 'bg-muted')}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{LABELS[score]}</span>
        {score < 2 && ' — use at least 12 characters; a few unrelated words work well'}
      </p>
    </div>
  );
}
