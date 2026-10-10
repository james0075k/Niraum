/** Admin roles (mirrors backend `Role`). The API is the authority; the UI only hides things. */
export type Role = 'editor' | 'admin' | 'superadmin';

/** Areas of the admin panel, each gated by a minimum role. */
export type Area = 'content' | 'media' | 'assay' | 'settings' | 'inbox' | 'audit' | 'users';

const RANK: Record<Role, number> = { editor: 1, admin: 2, superadmin: 3 };

/**
 * editor = content + media + assay; admin = + settings, inbox (inquiries, messages,
 * applications), audit; superadmin = + users. Mirrors CONTENT_ROLES / ADMIN_ROLES in
 * backend/src/middlewares/auth.ts.
 */
const MIN_ROLE: Record<Area, Role> = {
  content: 'editor',
  media: 'editor',
  assay: 'editor',
  settings: 'admin',
  inbox: 'admin',
  audit: 'admin',
  users: 'superadmin',
};

export function can(role: Role | undefined, area: Area): boolean {
  if (!role || !(role in RANK)) return false;
  return RANK[role] >= RANK[MIN_ROLE[area]];
}
