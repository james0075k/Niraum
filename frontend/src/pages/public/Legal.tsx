import { useParams } from 'react-router-dom';
import { Link } from '@/components/common/LangLink';
import { Seo } from '@/components/seo/Seo';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { legalPages } from '@/content/legal';
import { legalLinks } from '@/content/site';
import { cn } from '@/lib/utils';
import NotFound from './NotFound';

/** Simple text layout for Privacy / Terms / Cookies (DRAFT — legal review required). */
export default function Legal() {
  const { page } = useParams();
  const doc = legalPages.find((p) => p.slug === page);
  if (!doc) return <NotFound />;

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: doc.title, path: `/legal/${doc.slug}` },
  ];

  return (
    <>
      <Seo title={doc.title} description={doc.description} crumbs={crumbs} />
      <section aria-labelledby="page-title" className="grain pb-24 pt-36 sm:pt-40">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{doc.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 id="page-title" className="!text-[clamp(2.25rem,5vw,3.75rem)]">
              {doc.title}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Last updated <time dateTime={doc.updated}>{doc.updated}</time> · Draft pending legal
              review
            </p>
            <div className="prose-site mt-10" dangerouslySetInnerHTML={{ __html: doc.body }} />
          </div>
          <nav aria-label="Legal pages" className="lg:col-span-3 lg:col-start-10">
            <ul className="glass sticky top-28 space-y-1 p-3">
              {legalLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={cn(
                      'flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-foreground hover:bg-accent',
                      l.to === `/legal/${doc.slug}` && 'bg-accent text-copper-ink',
                    )}
                    aria-current={l.to === `/legal/${doc.slug}` ? 'page' : undefined}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </>
  );
}
