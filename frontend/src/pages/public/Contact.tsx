import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { ProfileLinks } from '@/components/common/ProfileLinks';
import { Tbc, TbcText } from '@/components/common/Tbc';
import { Reveal } from '@/components/motion/Reveal';
import { ContactForm } from '@/components/sections/ContactForm';
import { InquiryForm } from '@/components/sections/InquiryForm';
import { MapCard } from '@/components/sections/MapCard';
import { Seo } from '@/components/seo/Seo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { siteImages } from '@/content/siteImages';
import { INQUIRY_TOPICS, type InquiryTopic } from '@/features/inquiries/schemas';
import { useActiveSocials, useSettings } from '@/features/settings/useSettings';
import { useT } from '@/hooks/useLang';
import { localBusinessLd } from '@/lib/seo';

function Detail({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-copper-gradient text-graphite">
        {icon}
      </span>
      <div>
        <h3 className="label text-muted-foreground">{label}</h3>
        <div className="mt-1 text-foreground">{children}</div>
      </div>
    </div>
  );
}

/**
 * Primary keyword: "buy iron ore Nepal" (blueprint §7). The Bulk Supply Inquiry is the default
 * tab (primary business goal); `?tab=message` opens the general form, `?topic=` picks the request.
 */
export default function Contact() {
  const { t } = useT(['contact', 'common']);
  const settings = useSettings();
  const socials = useActiveSocials();
  const [params] = useSearchParams();
  const { address, contact, location } = settings;
  const addressLine = `${address.line1}, ${address.city}, ${address.province}, ${address.country}`;
  const crumbs = [
    { name: t('common:nav.home'), path: '/' },
    { name: t('common:nav.contact'), path: '/contact' },
  ];
  const topicParam = params.get('topic');
  const topic: InquiryTopic = (INQUIRY_TOPICS as readonly string[]).includes(topicParam ?? '')
    ? (topicParam as InquiryTopic)
    : 'supply';
  const tab = params.get('tab') === 'message' ? 'message' : 'inquiry';

  return (
    <>
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        crumbs={crumbs}
        jsonLd={[localBusinessLd(settings)]}
      />
      <PageHero
        eyebrow={t('hero.eyebrow')}
        title={t('hero.title')}
        intro={t('hero.intro')}
        image={siteImages.southernSlope}
        crumbs={crumbs}
      />

      <section id="contact-form" aria-labelledby="contact-form-title" className="section grain">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div id="inquiry" className="scroll-mt-28 lg:col-span-7">
            <SectionHeading
              id="contact-form-title"
              eyebrow={t('tabs.inquiry')}
              title={t('formTitle')}
              className="!mb-8"
            />
            <Tabs defaultValue={tab} key={`${tab}-${topic}`}>
              <TabsList
                aria-label={t('tabs.label')}
                className="mb-6 h-auto flex-wrap gap-2 bg-transparent p-0"
              >
                {(['inquiry', 'message'] as const).map((v) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    className="min-h-11 rounded-full border border-foreground/15 px-4 data-[state=active]:border-transparent data-[state=active]:bg-copper-gradient data-[state=active]:text-graphite"
                  >
                    {t(`tabs.${v}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="inquiry" className="mt-0">
                <InquiryForm topic={topic} />
              </TabsContent>
              <TabsContent value="message" className="mt-0">
                <ContactForm defaultSubject={params.get('subject') ?? ''} />
              </TabsContent>
            </Tabs>
          </div>

          <Reveal as="div" className="space-y-6 lg:col-span-5">
            <div className="glass space-y-6 p-6 sm:p-8">
              <Detail
                icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
                label={t('details.office')}
              >
                <address className="not-italic">
                  {settings.legalName}
                  <br />
                  {addressLine}
                </address>
              </Detail>
              <Detail
                icon={<Phone className="h-5 w-5" aria-hidden="true" />}
                label={t('details.phone')}
              >
                {contact.phone.length ? (
                  contact.phone.map((p) => (
                    <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="block font-medium">
                      {p}
                    </a>
                  ))
                ) : (
                  <Tbc>{t('details.phone')}</Tbc>
                )}
              </Detail>
              <Detail
                icon={<Mail className="h-5 w-5" aria-hidden="true" />}
                label={t('details.email')}
              >
                {contact.email.length ? (
                  contact.email.map((e) => (
                    <a key={e} href={`mailto:${e}`} className="block font-medium">
                      {e}
                    </a>
                  ))
                ) : (
                  <Tbc>{t('details.email')}</Tbc>
                )}
              </Detail>
              {contact.whatsapp && (
                <Detail
                  icon={<MessageCircle className="h-5 w-5" aria-hidden="true" />}
                  label={t('details.whatsapp')}
                >
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium"
                  >
                    {contact.whatsapp}
                  </a>
                </Detail>
              )}
              <Detail
                icon={<Clock className="h-5 w-5" aria-hidden="true" />}
                label={t('details.hours')}
              >
                <TbcText text={settings.officeHours} />
              </Detail>
              <div>
                <h3 className="label mb-3 text-muted-foreground">{t('details.follow')}</h3>
                {socials.length ? <ProfileLinks /> : <Tbc>{t('details.social')}</Tbc>}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="map" aria-labelledby="map-title" className="pb-20 sm:pb-28">
        <div className="container-site">
          <h2 id="map-title" className="sr-only">
            {t('details.mapTitle')}
          </h2>
          <MapCard
            lat={location.lat}
            lng={location.lng}
            zoom={location.zoom}
            title={settings.legalName}
            address={addressLine}
            approximate={location.approximate}
          />
        </div>
      </section>
    </>
  );
}
