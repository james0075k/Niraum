import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from '@/app/router';
import '@/styles/globals.css';

/**
 * vite-react-ssg entry: renders on the client in dev and prerenders every public
 * route to static HTML at build time, then hydrates. It also supplies the
 * react-helmet-async HelmetProvider, so don't add a second one in providers.
 */
export const createRoot = ViteReactSSG({ routes });
