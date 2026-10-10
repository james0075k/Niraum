import { Head } from 'vite-react-ssg';

/** Emits one JSON-LD block. `<` is escaped so content can never close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(data).replace(/</g, '\u003c')}</script>
    </Head>
  );
}
