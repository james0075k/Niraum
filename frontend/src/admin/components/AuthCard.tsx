import type { ReactNode } from 'react';
import { Logo } from '@/components/common/Logo';

/** Centred glass card for the signed-out screens (login, forgot/reset, forced change). */
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(184_117_74/0.18),transparent_60%)]"
      />
      <div className="relative w-full max-w-md rounded-2xl border bg-background/70 p-8 shadow-xl backdrop-blur">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-2 text-center text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
