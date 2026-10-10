import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { MagneticButton } from '@/components/motion/MagneticButton';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { navLinks } from '@/content/site';
import { useServices } from '@/features/services/useServices';
import { ease } from '@/lib/motion';
import { cn } from '@/lib/utils';
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
  const { pathname } = useLocation();
  const { data: services } = useServices();

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
        <Link to="/" className="flex min-h-11 items-center" aria-label="Niraum Metals — home">
          <Logo />
        </Link>

        <NavigationMenu className="hidden lg:flex" aria-label="Main">
          <NavigationMenuList className="gap-3 xl:gap-5">
            {navLinks.map((l) =>
              l.to === '/operations' ? (
                <NavigationMenuItem key={l.to}>
                  <NavigationMenuTrigger
                    className={cn(
                      'h-11 bg-transparent px-1 text-sm font-medium text-foreground/85 hover:bg-transparent hover:text-foreground focus:bg-transparent data-[state=open]:bg-transparent',
                      pathname.startsWith('/operations') && 'text-foreground',
                    )}
                  >
                    Operations
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[520px] grid-cols-2 gap-2 p-3">
                      <li className="col-span-2">
                        <NavigationMenuLink asChild>
                          <Link
                            to="/operations"
                            className="block rounded-xl p-3 text-foreground hover:bg-accent"
                          >
                            <span className="text-sm font-semibold">All operations</span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              From exploration to delivery
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      {services.map((s) => (
                        <li key={s.slug}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={`/operations#${s.slug}`}
                              className="block rounded-xl p-3 text-foreground hover:bg-accent"
                            >
                              <span className="text-sm font-semibold">{s.title}</span>
                              <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                                {s.summary}
                              </span>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={l.to}>
                  <NavLink to={l.to} end={l.to === '/'} className={linkClass}>
                    {l.label}
                  </NavLink>
                </NavigationMenuItem>
              ),
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <MagneticButton className="hidden sm:inline-flex">
            <Button asChild size="sm" className="h-11 px-5">
              <Link to={QUOTE_HREF}>Get a Quote</Link>
            </Button>
          </MagneticButton>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-foreground/10 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="glass-strong w-[88vw] max-w-sm border-l-0 p-6">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Site navigation</SheetDescription>
              <Logo />
              <nav aria-label="Mobile" className="mt-10">
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
                        {l.label}
                      </NavLink>
                    </motion.li>
                  ))}
                </motion.ul>
              </nav>
              <Button asChild className="mt-8 w-full">
                <Link to={QUOTE_HREF} onClick={() => setOpen(false)}>
                  Get a Quote
                </Link>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
