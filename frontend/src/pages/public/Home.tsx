import { Head } from 'vite-react-ssg';
import { pageTitle, seoDefaults } from '@/lib/seo';

/** Placeholder — real sections (Hero, Stats, Services, …) land in the feature phase. */
export default function Home() {
  return (
    <section className="texture-grain flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Head>
        <title>{pageTitle()}</title>
        <meta name="description" content={seoDefaults.description} />
      </Head>
      <p className="label text-primary">Lalitpur-13, Nepal</p>
      <h1 className="text-4xl sm:text-6xl">
        <span className="text-copper-gradient">N</span>iraum Metals
      </h1>
      <p className="text-lg text-muted-foreground">Strength Forged For Generations</p>
    </section>
  );
}
