import { createContext } from 'react';
import type { Blocker } from 'react-router-dom';

/** Lets a page set the last breadcrumb (e.g. a product name); `null` clears it. */
export const BreadcrumbContext = createContext<((label: string | null) => void) | null>(null);

/** Lets `useUnsavedGuard` hand a blocked navigation to the layout, which asks to confirm. */
export const UnsavedContext = createContext<((blocker: Blocker | null) => void) | null>(null);
