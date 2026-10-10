import { createContext } from 'react';
import type { Blocker } from 'react-router-dom';

/** Lets a page set the last breadcrumb (e.g. a product name); `null` clears it. */
export const BreadcrumbContext = createContext<((label: string | null) => void) | null>(null);

/** The sign-in page: never blocked (sign-out asks first; a dead session must reach it). */
export const SIGN_IN_PATH = '/admin/login';

export interface UnsavedApi {
  /** Hands a blocked navigation to the layout, which asks "Discard unsaved changes?". */
  report: (blocker: Blocker | null) => void;
  /** Marks a page dirty; returns the undo. The layout asks before sign-out while any is. */
  markDirty: () => () => void;
}

export const UnsavedContext = createContext<UnsavedApi | null>(null);
