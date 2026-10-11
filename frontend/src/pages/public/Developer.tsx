import { ArrowUpRight, Github, Globe, Linkedin, Mail, MapPin } from 'lucide-react';
import { Img } from '@/components/common/Img';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui/button';
import { images } from '@/content/images';
import { banners } from '@/content/siteImages';
import { useT } from '@/hooks/useLang';

/** Developer credit page (linked from the footer). Details from the developer's CV. */
const DEVELOPER = {
  name: 'Janak (James) Rokaya',
  links: [
    { key: 'portfolio', href: 'https://user007.cloud', icon: Globe },
    { key: 'github', href: 'https://github.com/james0075k', icon: Github },
    { key: 'linkedin', href: 'https://www.linkedin.com/in/janak-rokaya-9a9153203', icon: Linkedin },
    { key: 'email', href: 'mailto:rokayajanak505@gmail.com', icon: Mail },
  ],
} as const;

const SITE_ITEMS = ['bilingual', 'data', 'admin', 'api', 'ops'] as const;

/** Tool names stay in English in both languages. */
const SKILLS = [
  { key: 'languages', items: ['JavaScript (ES6+)', 'TypeScript', 'Python', 'HTML5', 'CSS3'] },
  { key: 'frontend', items: ['React', 'Tailwind CSS', 'shadcn/ui', 'Framer Motion', 'GSAP'] },
  { key: 'backend', items: ['Node.js', 'Express', 'REST APIs', 'Authentication', 'WebRTC'] },
  { key: 'database', items: ['MongoDB', 'Mongoose'] },
  { key: 'ai', items: ['Machine learning', 'Image classification', 'Generative AI'] },
  { key: 'devops', items: ['Git', 'GitHub Actions', 'Docker', 'Vercel', 'Render'] },
] as const;

const PROJECTS = [
  { key: 'momento', name: 'Momento', href: 'https://momento-web-six.vercel.app' },
  { key: 'farmahelp', name: 'FarmaHelp', href: 'https://farmahelp-brown.vercel.app' },
  { key: 'cloudcall', name: 'CloudCall', href: 'https://cloudcall-main.vercel.app' },
] as const;

export default function Developer() {
  const { t } = useT(['developer', 'common']);
  const crumbs = [
    { name: t('common:nav.home'), path: '/' },
    { name: t('hero.title'), path: '/developer' },
  ];
  const personLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: DEVELOPER.name,
    jobTitle: 'Full-Stack Developer',
    url: 'https://user007.cloud',
    sameAs: DEVELOPER.links.filter((l) => l.href.startsWith('https')).map((l) => l.href),
  };

  return (
    <>
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        crumbs={crumbs}
        jsonLd={[personLd]}
      />
      <PageHero
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        intro={t('hero.intro')}
        image={banners.crushingPlant}
        crumbs={crumbs}
      />

      <section id="profile" aria-labelledby="profile-title" className="section grain">
        <div className="container-site max-w-5xl">
          <SectionHeading
            id="profile-title"
            eyebrow={t('profile.eyebrow')}
            title={t('profile.title')}
          />
          <Reveal as="article" className="glass grid gap-8 p-6 sm:p-8 md:grid-cols-[220px_1fr]">
            <div className="aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-2xl ring-1 ring-copper/30">
              <Img image={images.developer} sizes="220px" />
            </div>
            <div>
              <h3 className="text-2xl">{DEVELOPER.name}</h3>
              <p className="label mt-2 text-copper-ink">{t('profile.role')}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-copper-ink" aria-hidden="true" />
                {t('profile.location')}
              </p>
              <p className="mt-4 max-w-2xl text-muted-foreground">{t('profile.summary')}</p>
              <ul className="mt-6 flex flex-wrap gap-3">
                {DEVELOPER.links.map(({ key, href, icon: Icon }) => (
                  <li key={key}>
                    <Button asChild variant={key === 'portfolio' ? 'default' : 'outline'}>
                      <a
                        href={href}
                        {...(href.startsWith('https')
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        {t(`profile.${key}`)}
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="this-website" aria-labelledby="site-title" className="section bg-muted/40">
        <div className="container-site max-w-5xl">
          <SectionHeading id="site-title" eyebrow={t('site.eyebrow')} title={t('site.title')} />
          <RevealGroup as="ul" className="grid gap-4 sm:grid-cols-2">
            {SITE_ITEMS.map((key, i) => (
              <RevealItem as="li" key={key} className="glass flex gap-4 p-6">
                <span className="text-2xl font-extrabold tabular-nums text-copper">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-foreground">{t(`site.items.${key}`)}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section id="skills" aria-labelledby="skills-title" className="section grain">
        <div className="container-site max-w-5xl">
          <SectionHeading
            id="skills-title"
            eyebrow={t('skills.eyebrow')}
            title={t('skills.title')}
          />
          <Reveal className="glass p-6 sm:p-8">
            <dl className="divide-y divide-foreground/10">
              {SKILLS.map((g) => (
                <div key={g.key} className="grid gap-2 py-4 sm:grid-cols-4 sm:gap-6">
                  <dt className="label text-muted-foreground">{t(`skills.groups.${g.key}`)}</dt>
                  <dd className="flex flex-wrap gap-2 sm:col-span-3">
                    {g.items.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-foreground/10 px-3 py-1 text-sm text-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section id="projects" aria-labelledby="projects-title" className="section bg-muted/40">
        <div className="container-site">
          <SectionHeading
            id="projects-title"
            eyebrow={t('projects.eyebrow')}
            title={t('projects.title')}
          />
          <RevealGroup as="ul" className="grid gap-4 md:grid-cols-3">
            {PROJECTS.map((p) => (
              <RevealItem as="li" key={p.key}>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('projects.visit', { name: p.name })}
                  className="glass group flex h-full flex-col p-6 transition-colors hover:border-copper/50"
                >
                  <span className="flex items-center justify-between">
                    <span className="text-xl font-bold">{p.name}</span>
                    <ArrowUpRight
                      className="h-5 w-5 text-copper-ink transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-3 text-sm text-muted-foreground">
                    {t(`projects.${p.key}`)}
                  </span>
                </a>
              </RevealItem>
            ))}
          </RevealGroup>
          <p className="mt-12 text-sm text-muted-foreground">
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </section>
    </>
  );
}
