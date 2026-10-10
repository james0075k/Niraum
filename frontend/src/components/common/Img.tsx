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
 */
export function Img({ image, className, sizes = '100vw', priority, alt }: ImgProps) {
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

  if (!image.picture) return <img src={image.src} {...common} />;

  const { sources, img } = image.picture;
  return (
    <picture className="contents">
      {Object.entries(sources).map(([format, srcSet]) => (
        <source key={format} type={`image/${format}`} srcSet={srcSet} sizes={sizes} />
      ))}
      <img src={img.src} {...common} />
    </picture>
  );
}
