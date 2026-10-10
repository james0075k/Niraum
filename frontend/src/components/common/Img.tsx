import type { ReactElement } from 'react';
import { useMounted } from '@/hooks/useMounted';
import type { ImageSource } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ImgProps {
  image: ImageSource;
  className?: string;
  /** Layout hint for srcset selection. */
  sizes?: string;
  /** LCP image: eager + fetchpriority=high. Everything else lazy-loads. */
  priority?: boolean;
  /** Override alt (e.g. "" for decorative duplicates). */
  alt?: string;
}

/**
 * Responsive image with width/height (no CLS). Local images render a <picture> with
 * AVIF/WebP sources from vite-imagetools; API images render a plain <img>.
 *
 * Non-priority images render only after the app has mounted (it starts after first paint —
 * see vite.config.ts), so below-the-fold photos never compete with the first paint on slow
 * networks; then they lazy-load natively. Until then a placeholder with the same box keeps the
 * layout, and a <noscript> copy serves visitors and crawlers without JS.
 */
export function Img({ image, className, sizes = '100vw', priority, alt }: ImgProps) {
  const mounted = useMounted();
  const common = {
    alt: alt ?? image.alt,
    width: image.width,
    height: image.height,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    decoding: priority ? ('sync' as const) : ('async' as const),
    // React 18 only passes the lowercase attribute through to the DOM.
    ...(priority ? ({ fetchpriority: 'high' } as Record<string, string>) : {}),
    className: cn('h-full w-full object-cover', className),
  };

  let element: ReactElement;
  if (!image.picture) {
    element = <img src={image.src} {...common} />;
  } else {
    const { sources, img } = image.picture;
    element = (
      <picture className="contents">
        {Object.entries(sources).map(([format, srcSet]) => (
          <source key={format} type={`image/${format}`} srcSet={srcSet} sizes={sizes} />
        ))}
        <img src={img.src} {...common} />
      </picture>
    );
  }

  if (priority || mounted) return element;
  return (
    <>
      <span
        aria-hidden="true"
        data-img-placeholder=""
        className={cn('block h-full w-full bg-foreground/5', className)}
        style={
          image.width && image.height
            ? { aspectRatio: `${image.width} / ${image.height}` }
            : undefined
        }
      />
      <noscript>{element}</noscript>
    </>
  );
}
