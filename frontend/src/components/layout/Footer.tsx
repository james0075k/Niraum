import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUp, Mail, MapPin, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from '@/components/common/LangLink';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Logo } from '@/components/common/Logo';
import { ProfileLinks } from '@/components/common/ProfileLinks';
import { Tbc } from '@/components/common/Tbc';
import { useLenis } from '@/components/motion/lenis';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { legalLinks } from '@/content/site';
import { newsletterSchema, subscribeNewsletter } from '@/features/contact/schemas';
import { useServices } from '@/features/services/useServices';
import { useSettings } from '@/features/settings/useSettings';
import { useT } from '@/hooks/useLang';

/** `key` → `common:nav.<key>`. */
const quickLinks = [
  { to: '/about', key: 'about' },
  { to: '/our-project', key: 'project' },
  { to: '/products', key: 'products' },
  { to: '/technical-data', key: 'technical' },
  { to: '/investors', key: 'investors' },
  { to: '/sustainability', key: 'sustainability' },
  { to: '/operations', key: 'operations' },
  { to: '/projects', key: 'projects' },
  { to: '/news', key: 'news' },
  { to: '/careers', key: 'careers' },
  { to: '/contact', key: 'contact' },
];

const linkCls =
  'inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-copper-ink sm:min-h-9';

function FooterHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="label mb-4 !text-xs text-foreground">
      {children}
    </h2>
  );
}

function Newsletter() {
  const { t } = useT();
  const form = useForm<z.infer<typeof newsletterSchema>>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '' },
  });
  const onSubmit = form.handleSubmit(async ({ email }) => {
    try {
      await subscribeNewsletter(email);
      toast.success(t('footer.subscribed'));
      form.reset();
    } catch {
      toast.error(t('footer.subscribeFailed'));
    }
  });
  const error = form.formState.errors.email?.message;

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4">
      <label htmlFor="newsletter-email" className="text-sm text-muted-foreground">
        Project updates and news, a few times a year.
      </label>
      <div className="mt-3 flex gap-2">
        <Input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          aria-invalid={!!error}
          aria-describedby={error ? 'newsletter-error' : undefined}
          {...form.register('email')}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="shrink-0">
          Subscribe
        </Button>
      </div>
      {error && (
        <p id="newsletter-error" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

export function Footer() {
  const settings = useSettings();
  const { data: services } = useServices();
  const lenis = useLenis();
  const { t } = useT();
  const { address, contact } = settings;

  const toTop = () => (lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' }));

  return (
    <footer className="grain relative border-t border-foreground/10 bg-background pb-24 pt-20 md:pb-10">
      <div className="container-site">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" aria-label={t('nav.homeLink')} className="inline-flex">
              <Logo />
            </Link>
            <p className="mt-5 text-lg font-semibold text-copper-ink">{settings.motto}</p>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{settings.footer.about}</p>
            <ProfileLinks className="mt-6" />
            <Newsletter />
          </div>

          <nav aria-labelledby="footer-quick" className="lg:col-span-2">
            <FooterHeading id="footer-quick">{t('footer.quickLinks')}</FooterHeading>
            <ul>
              {quickLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={linkCls}>
                    {t(`nav.${l.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-ops" className="lg:col-span-2">
            <FooterHeading id="footer-ops">{t('footer.operations')}</FooterHeading>
            <ul>
              {services.map((s) => (
                <li key={s.slug}>
                  <Link to={`/operations#${s.slug}`} className={linkCls}>
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <FooterHeading id="footer-legal">{t('footer.legal')}</FooterHeading>
            </div>
            <ul aria-labelledby="footer-legal">
              {legalLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={linkCls}>
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href="/sitemap.xml" className={linkCls}>
                  Sitemap
                </a>
              </li>
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <FooterHeading id="footer-contact">{t('footer.contact')}</FooterHeading>
            <address className="space-y-4 text-sm not-italic text-muted-foreground">
              <p className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-copper-ink" aria-hidden="true" />
                <span>
                  {settings.legalName}
                  <br />
                  {address.line1}, {address.city}
                  <br />
                  {address.province}, {address.country}
                </span>
              </p>
              <p className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-copper-ink" aria-hidden="true" />
                {contact.phone[0] ? (
                  <a href={`tel:${contact.phone[0].replace(/\s/g, '')}`} className={linkCls}>
                    {contact.phone[0]}
                  </a>
                ) : (
                  <Tbc>{t('footer.phone')}</Tbc>
                )}
              </p>
              <p className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-copper-ink" aria-hidden="true" />
                {contact.email[0] ? (
                  <a href={`mailto:${contact.email[0]}`} className={linkCls}>
                    {contact.email[0]}
                  </a>
                ) : (
                  <Tbc>{t('footer.email')}</Tbc>
                )}
              </p>
            </address>
          </div>
        </div>

        <div className="rule-copper mt-16 opacity-60" />
        <div className="mt-6 flex flex-col items-start justify-between gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {settings.legalName} {t('footer.rights')}
          </p>
          <button
            type="button"
            onClick={toTop}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-medium text-foreground transition-colors hover:text-copper-ink"
          >
            {t('a11y.backToTop')} <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
