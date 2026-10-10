import { CountUp } from '@/components/motion/CountUp';
import { TbcText } from '@/components/common/Tbc';
import type { Stat } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Glass stat: count-up number, or a visible TBC chip while the figure is unknown. */
export function StatCard({ stat, className }: { stat: Stat; className?: string }) {
  return (
    <div className={cn('glass glass-copper p-6 sm:p-7', className)}>
      <p className="text-4xl font-extrabold leading-none sm:text-5xl">
        {stat.value !== null ? (
          <span className="text-copper">
            <CountUp value={stat.value} suffix={stat.suffix} />
          </span>
        ) : (
          <span className="text-copper" aria-hidden="true">
            TBC
          </span>
        )}
      </p>
      <p className="label mt-4 text-foreground">{stat.label}</p>
      {stat.value === null && stat.placeholder && (
        <p className="mt-2 text-xs text-muted-foreground">
          <TbcText text={stat.placeholder} />
        </p>
      )}
    </div>
  );
}
