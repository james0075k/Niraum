import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/motion/Reveal';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui/button';

/** Ridge line drawn in copper over the 404 — a mountain illustration, not the brand mark. */
function Ridges() {
  return (
    <svg
      viewBox="0 0 1200 320"
      preserveAspectRatio="none"
      className="absolute inset-x-0 bottom-0 -z-10 h-[45vh] w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nf-copper" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8A5236" />
          <stop offset=".5" stopColor="#DDA27C" />
          <stop offset="1" stopColor="#A9663F" />
        </linearGradient>
      </defs>
      <path
        d="M0 320 L0 220 L140 120 L230 190 L380 40 L470 130 L560 80 L700 210 L820 90 L930 170 L1050 60 L1200 180 L1200 320 Z"
        className="fill-foreground/[0.06]"
      />
      <path
        d="M0 320 L0 260 L180 170 L300 240 L450 140 L620 250 L760 160 L900 240 L1060 150 L1200 230 L1200 320 Z"
        className="fill-foreground/[0.09]"
      />
      <path
        d="M380 40 L420 76 L400 74 L380 90 L362 72 L345 74 Z M1050 60 L1085 92 L1066 90 L1050 104 L1034 88 L1018 90 Z"
        className="fill-silver/60"
      />
      <path
        d="M0 220 L140 120 L230 190 L380 40 L470 130 L560 80 L700 210 L820 90 L930 170 L1050 60 L1200 180"
        fill="none"
        stroke="url(#nf-copper)"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function NotFound() {
  return (
    <>
      <Seo title="Page Not Found" description="This page could not be found." noindex />
      <section
        aria-labelledby="nf-title"
        className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden pb-40 pt-36"
      >
        <Ridges />
        <div className="container-site text-center">
          <Reveal
            as="p"
            className="text-[clamp(6rem,20vw,12rem)] font-extrabold leading-none text-copper"
          >
            404
          </Reveal>
          <h1 id="nf-title" className="mt-2 !text-[clamp(2rem,5vw,3.5rem)]">
            This path leads off the map.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            The page you were looking for has moved or never existed.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/">
              <ArrowLeft aria-hidden="true" /> Back home
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
