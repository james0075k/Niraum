import {
  Archive,
  Briefcase,
  ClipboardList,
  FileText,
  FlaskConical,
  FolderKanban,
  Image,
  Inbox,
  LayoutDashboard,
  Mail,
  Mountain,
  Package,
  ScrollText,
  Settings,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Area } from './auth/roles';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  area: Area;
  group: 'Overview' | 'Content' | 'Data' | 'Inbox' | 'System';
  /** Retired from the public site in Phase 4.5; listed under "Archived sections". */
  archived?: true;
}

export const NAV_GROUPS: NavItem['group'][] = ['Overview', 'Content', 'Data', 'Inbox', 'System'];

export const ARCHIVED_NOTE = 'Not shown on the public site (retired in Phase 4.5)';

/** Every admin section, in sidebar order. `area` decides who sees it (see `can`). */
export const NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, area: 'content', group: 'Overview' },
  { to: '/admin/products', label: 'Products', icon: Package, area: 'content', group: 'Content' },
  { to: '/admin/deposit', label: 'Deposit', icon: Mountain, area: 'content', group: 'Content' },
  { to: '/admin/team', label: 'Team', icon: Users, area: 'content', group: 'Content' },
  { to: '/admin/services', label: 'Services', icon: Wrench, area: 'content', group: 'Content' },
  {
    to: '/admin/projects',
    label: 'Projects',
    icon: FolderKanban,
    area: 'content',
    group: 'Content',
    archived: true,
  },
  {
    to: '/admin/posts',
    label: 'Posts',
    icon: FileText,
    area: 'content',
    group: 'Content',
    archived: true,
  },
  {
    to: '/admin/jobs',
    label: 'Jobs',
    icon: Briefcase,
    area: 'content',
    group: 'Content',
    archived: true,
  },
  { to: '/admin/media', label: 'Media', icon: Image, area: 'media', group: 'Data' },
  { to: '/admin/assay', label: 'Assay data', icon: FlaskConical, area: 'assay', group: 'Data' },
  { to: '/admin/inquiries', label: 'Inquiries', icon: Inbox, area: 'inbox', group: 'Inbox' },
  { to: '/admin/messages', label: 'Messages', icon: Mail, area: 'inbox', group: 'Inbox' },
  {
    to: '/admin/applications',
    label: 'Applications',
    icon: ClipboardList,
    area: 'inbox',
    group: 'Inbox',
  },
  { to: '/admin/settings', label: 'Settings', icon: Settings, area: 'settings', group: 'System' },
  { to: '/admin/users', label: 'Users', icon: UserCog, area: 'users', group: 'System' },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText, area: 'audit', group: 'System' },
];

export const ARCHIVED_ICON = Archive;

/** The section a path belongs to (longest matching prefix; `/admin` only matches exactly). */
export function navItemFor(pathname: string): NavItem | undefined {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/admin') return NAV[0];
  return NAV.filter(
    (n) => n.to !== '/admin' && (path === n.to || path.startsWith(`${n.to}/`)),
  ).sort((a, b) => b.to.length - a.to.length)[0];
}
