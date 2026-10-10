import { useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

/** Forwards `isDirty` to the page, and clears it when the tab unmounts. */
export function useDirtyReport(isDirty: boolean, onDirty: (dirty: boolean) => void) {
  useEffect(() => onDirty(isDirty), [isDirty, onDirty]);
  useEffect(() => () => onDirty(false), [onDirty]);
}

/**
 * Re-bases a clean form when the settings change underneath it (another tab saved, a refetch).
 * Dirty forms keep the admin's input.
 */
export function useResetOnChange<T extends FieldValues>(form: UseFormReturn<T>, values: T) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!form.formState.isDirty) form.reset(values);
  }, [form, values]);
}
