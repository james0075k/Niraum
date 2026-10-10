import { Helmet } from 'react-helmet-async';
import { useRoutes } from 'react-router-dom';
import { Providers } from '@/app/providers';
import { adminRoutes } from './routes';

/**
 * Client-only admin app (never prerendered — vite.config.ts includedRoutes drops /admin).
 * It sits beside the public `App` layout, so it brings its own providers (QueryClient, theme).
 */
export default function AdminRoot() {
  const element = useRoutes(adminRoutes);
  return (
    <Providers>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
        <title>Admin · Niraum Metals</title>
      </Helmet>
      {element}
    </Providers>
  );
}
