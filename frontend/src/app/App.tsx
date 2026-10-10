import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import { Head } from 'vite-react-ssg';
import { DataNotice } from '@/components/layout/DataNotice';
import { Footer } from '@/components/layout/Footer';
import { MobileCta } from '@/components/layout/MobileCta';
import { Navbar } from '@/components/layout/Navbar';
import { PageTransition } from '@/components/motion/PageTransition';
import { Preloader } from '@/components/motion/Preloader';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { JsonLd } from '@/components/seo/JsonLd';
import { Toaster } from '@/components/ui/sonner';
import { useSettings } from '@/features/settings/useSettings';
import { organizationLd } from '@/lib/seo';
import { useLang, useT } from '@/hooks/useLang';
import { useTheme } from '@/lib/theme';
import './i18n';
import { Providers } from './providers';

/** Applies the admin's default theme for visitors who never picked one; emits Organization JSON-LD. */
function SiteChrome() {
  const settings = useSettings();
  const { applyDefault } = useTheme();
  const lang = useLang();
  const { t } = useT();
  useEffect(
    () => applyDefault(settings.theme.defaultMode),
    [applyDefault, settings.theme.defaultMode],
  );

  return (
    <>
      <Head>
        <html lang={lang} />
      </Head>
      <JsonLd data={organizationLd(settings)} />
      <Preloader />
      <a
        href="#main"
        className="sr-only z-[110] rounded-full bg-copper-gradient px-5 py-3 font-semibold text-graphite focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('a11y.skip')}
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        <PageTransition />
      </main>
      <Footer />
      <DataNotice />
      <MobileCta />
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}

/** Root layout for every public page. */
export default function App() {
  return (
    <Providers>
      {/* Framer skips transform animations for visitors who prefer reduced motion. */}
      <MotionConfig reducedMotion="user">
        <SmoothScroll>
          <SiteChrome />
        </SmoothScroll>
      </MotionConfig>
    </Providers>
  );
}
