import { forwardRef } from 'react';
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  type LinkProps,
  type NavLinkProps,
  type To,
} from 'react-router-dom';
import { useLocalePath } from '@/hooks/useLang';

/**
 * Drop-in replacements for react-router's Link / NavLink that keep the visitor in their
 * language tree: `<Link to="/contact">` renders `/ne/contact` on Nepali pages.
 * Import these instead of the react-router ones in public components.
 */
function useLocalizedTo(to: To): To {
  const lp = useLocalePath();
  if (typeof to === 'string') return lp(to);
  return to.pathname ? { ...to, pathname: lp(to.pathname) } : to;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...rest }, ref) {
  return <RouterLink ref={ref} to={useLocalizedTo(to)} {...rest} />;
});

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, ...rest },
  ref,
) {
  return <RouterNavLink ref={ref} to={useLocalizedTo(to)} {...rest} />;
});
