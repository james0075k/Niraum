import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHero } from '@/components/common/PageHero';
import { SectionHeading } from '@/components/common/SectionHeading';
import { ProfileLinks } from '@/components/common/ProfileLinks';
import { Tbc, TbcText } from '@/components/common/Tbc';
import { Reveal } from '@/components/motion/Reveal';
import { ContactForm } from '@/components/sections/ContactForm';
import { MapCard } from '@/components/sections/MapCard';
import { Seo } from '@/components/seo/Seo';
import { images } from '@/content/images';
import { useActiveSocials, useSettings } from '@/features/settings/useSettings';
import { localBusinessLd } from '@/lib/seo';

const crumbs = [
  { name: 'Home', path: '/' },
  { name: 'Contact', path: '/contact' },
];

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

/** Primary keyword: "stone and aggregate supplier Kathmandu Valley". */
export default function Contact() {
  const settings = useSettings();
  const socials = useActiveSocials();
  const [params] = useSearchParams();
  const { address, contact, location } = settings;
  const addressLine = `${address.line1}, ${address.city}, ${address.province}, ${address.country}`;

  return (
    <>
      <Seo
        title="Contact Our Aggregate Supplier Team"
        description="Contact Niraum Metals in Lalitpur — iron ore, metal minerals and a stone and aggregate supplier for the Kathmandu Valley. Request a quote today."
        crumbs={crumbs}
        jsonLd={[localBusinessLd(settings)]}
      />
      <PageHero
        eyebrow="Contact"
        title="Talk to a stone and aggregate supplier you can rely on."
        highlight={[4, 5, 6]}
        intro="Quotes, supply schedules or partnership questions — from the Kathmandu Valley and beyond. We reply to every message."
        image={images.hillside}
        crumbs={crumbs}
      />

      <section id="contact-form" aria-labelledby="contact-form-title" className="section grain">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading
              id="contact-form-title"
              eyebrow="Send a message"
              title="How can we help?"
              className="!mb-8"
            />
            <ContactForm defaultSubject={params.get('subject') ?? ''} />
          </div>

          <Reveal as="div" className="space-y-6 lg:col-span-5">
            <div className="glass space-y-6 p-6 sm:p-8">
              <Detail
                icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
                label="Registered office"
              >
                <address className="not-italic">
                  {settings.legalName}
                  <br />
                  {addressLine}
                </address>
              </Detail>
              <Detail icon={<Phone className="h-5 w-5" aria-hidden="true" />} label="Phone">
                {contact.phone.length ? (
                  contact.phone.map((p) => (
                    <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="block font-medium">
                      {p}
                    </a>
                  ))
                ) : (
                  <Tbc>Phone</Tbc>
                )}
              </Detail>
              <Detail icon={<Mail className="h-5 w-5" aria-hidden="true" />} label="Email">
                {contact.email.length ? (
                  contact.email.map((e) => (
                    <a key={e} href={`mailto:${e}`} className="block font-medium">
                      {e}
                    </a>
                  ))
                ) : (
                  <Tbc>Email</Tbc>
                )}
              </Detail>
              {contact.whatsapp && (
                <Detail
                  icon={<MessageCircle className="h-5 w-5" aria-hidden="true" />}
                  label="WhatsApp"
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
              <Detail icon={<Clock className="h-5 w-5" aria-hidden="true" />} label="Office hours">
                <TbcText text={settings.officeHours} />
              </Detail>
              <div>
                <h3 className="label mb-3 text-muted-foreground">Follow us</h3>
                {socials.length ? <ProfileLinks /> : <Tbc>Social links</Tbc>}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="map" aria-labelledby="map-title" className="pb-20 sm:pb-28">
        <div className="container-site">
          <h2 id="map-title" className="sr-only">
            Office location map
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
