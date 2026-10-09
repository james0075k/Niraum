import { Head } from 'vite-react-ssg';
import { Link } from 'react-router-dom';
import { pageTitle } from '@/lib/seo';

export default function NotFound() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Head>
        <title>{pageTitle('Page not found')}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <p className="label text-primary">404</p>
      <h1 className="text-3xl sm:text-5xl">Page not found</h1>
      <Link to="/">Back to home</Link>
    </section>
  );
}
