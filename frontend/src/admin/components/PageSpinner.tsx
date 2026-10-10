/** Suspense fallback for lazy admin pages. */
export function PageSpinner() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-[40vh] items-center justify-center"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-copper border-t-transparent" />
    </div>
  );
}
