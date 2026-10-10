import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from '@/components/common/LangLink';
import { Logo } from '@/components/common/Logo';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { navLinks } from '@/content/site';
import { useT } from '@/hooks/useLang';
import { ease } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';

const QUOTE_HREF = '/contact?subject=Quote%20request';

/** Copper underline sweeps in on hover/focus; stays on the active route. */
const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative inline-flex h-11 items-center px-1 text-sm font-medium text-foreground/85 transition-colors hover:text-foreground',
    'after:absolute after:inset-x-1 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:bg-copper-gradient after:transition-transform after:duration-300 after:ease-brand hover:after:scale-x-100 focus-visible:after:scale-x-100',
    isActive && 'text-foreground after:scale-x-100',
  );

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { t } = useT();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
      <div
        className={cn(
          'mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[20px] px-4 transition-all duration-500 ease-brand sm:px-6',
          scrolled ? 'glass-strong h-16' : 'glass h-[4.5rem]',
        )}
      >
        <Link to="/" className="flex min-h-11 items-center" aria-label={t('nav.homeLink')}>
          <Logo />
        </Link>

        <NavigationMenu className="hidden lg:flex" aria-label={t('nav.main')}>
          <NavigationMenuList className="gap-3 xl:gap-5">
            {navLinks.map((l) => (
              <NavigationMenuItem key={l.to}>
                <NavLink to={l.to} end={l.to === '/'} className={linkClass}>
                  {t(`nav.${l.key}`)}
                </NavLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageToggle className="hidden sm:flex" />
          <ThemeToggle />
          <MagneticButton className="hidden sm:inline-flex">
            <Button asChild size="sm" className="h-11 px-5">
              <Link to={QUOTE_HREF}>{t('cta.quote')}</Link>
            </Button>
          </MagneticButton>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-foreground/10 lg:hidden"
                aria-label={t('nav.openMenu')}
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="glass-strong w-[88vw] max-w-sm border-l-0 p-6">
              <SheetTitle className="sr-only">{t('nav.menu')}</SheetTitle>
              <SheetDescription className="sr-only">{t('nav.mobile')}</SheetDescription>
              <Logo />
              <LanguageToggle className="mt-6" />
              <nav aria-label={t('nav.mobileNav')} className="mt-8">
                <motion.ul
                  initial="hidden"
                  animate={open ? 'visible' : 'hidden'}
                  variants={{
                    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
                  }}
                  className="flex flex-col"
                >
                  {navLinks.map((l) => (
                    <motion.li
                      key={l.to}
                      variants={{
                        hidden: { opacity: 0, x: 24 },
                        visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease } },
                      }}
                    >
                      <NavLink
                        to={l.to}
                        end={l.to === '/'}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex min-h-12 items-center border-b border-foreground/10 text-xl font-semibold text-foreground',
                            isActive && 'text-copper-ink',
                          )
                        }
                      >
                        {t(`nav.${l.key}`)}
                      </NavLink>
                    </motion.li>
                  ))}
                </motion.ul>
              </nav>
              <Button asChild className="mt-8 w-full">
                <Link to={QUOTE_HREF} onClick={() => setOpen(false)}>
                  {t('cta.quote')}
                </Link>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
