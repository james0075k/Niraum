import { Briefcase, CalendarClock, Check, Clock, MapPin } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal } from '@/components/motion/Reveal';
import { ApplyForm } from '@/components/sections/ApplyForm';
import { Seo } from '@/components/seo/Seo';
import { Skeleton } from '@/components/ui/skeleton';
import { images } from '@/content/images';
import { useJob } from '@/features/jobs/useJobs';
import { useSettings } from '@/features/settings/useSettings';
import { formatDate } from '@/lib/format';
import { jobPostingLd } from '@/lib/seo';
import NotFound from './NotFound';

export default function Job() {
  const { slug = '' } = useParams();
  const { data: job, isLoading } = useJob(slug);
  const settings = useSettings();

  if (isLoading) {
    return (
      <div className="container-site space-y-6 pb-24 pt-40">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  if (!job) return <NotFound />;

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Careers', path: '/careers' },
    { name: job.title, path: `/careers/${job.slug}` },
  ];

  return (
    <>
      <Seo
        title={`${job.title} Job`}
        description={job.description.slice(0, 155)}
        crumbs={crumbs}
        jsonLd={job.isOpen ? [jobPostingLd(job, settings)] : []}
      />
      <PageHero
        eyebrow={job.department}
        title={job.title}
        image={images.fieldGeologist}
        crumbs={crumbs}
      >
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-silver">
          <li className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" aria-hidden="true" /> {job.location}
          </li>
          <li className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" /> {job.type}
          </li>
          <li className="inline-flex items-center gap-2">
            <Briefcase className="h-4 w-4" aria-hidden="true" /> {job.department}
          </li>
          {job.deadline && (
            <li className="inline-flex items-center gap-2">
              <CalendarClock className="h-4 w-4" aria-hidden="true" /> Apply by{' '}
              {formatDate(job.deadline)}
            </li>
          )}
        </ul>
      </PageHero>

      <section id="role" aria-labelledby="role-title" className="section grain">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading
              id="role-title"
              eyebrow="The role"
              title="What you will do"
              className="!mb-6"
            />
            <Reveal className="prose-site">
              <p>{job.description}</p>
            </Reveal>
            {job.requirements.length > 0 && (
              <>
                <h3 className="mt-10 text-xl">Requirements</h3>
                <ul className="mt-4 space-y-3">
                  {job.requirements.map((r) => (
                    <li key={r} className="flex gap-3">
                      <Check
                        className="mt-0.5 h-5 w-5 shrink-0 text-copper-ink"
                        aria-hidden="true"
                      />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div id="apply" className="lg:col-span-5">
            <h3 className="mb-4 text-xl">Apply for this role</h3>
            {job.isOpen ? (
              <ApplyForm jobSlug={job.slug} compact />
            ) : (
              <p className="glass p-6 text-muted-foreground">This vacancy is closed.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
