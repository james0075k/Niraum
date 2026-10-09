import { Outlet } from 'react-router-dom';
import { Providers } from './providers';

/** Root layout. Navbar, Footer, Preloader and PageTransition mount here. */
export default function App() {
  return (
    <Providers>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>
      <main id="main">
        <Outlet />
      </main>
    </Providers>
  );
}
