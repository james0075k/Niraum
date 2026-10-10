import { createContext, useContext } from 'react';
import type Lenis from 'lenis';

export const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance (null under reduced motion, SSR, or before it loads). */
export const useLenis = () => useContext(LenisContext);
