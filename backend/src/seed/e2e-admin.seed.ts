/**
 * Playwright admin users (`frontend/e2e/admin.spec.ts`). Development / test databases only:
 * refuses when NODE_ENV is production, and does nothing unless E2E_ADMIN_PASSWORD is set — the
 * password always comes from the environment, never from the repository.
 *
 * Creates (or resets, so a rerun starts clean) one account per role, all with
 * `mustChangePassword: false` so the tests land on the dashboard:
 *  - E2E_ADMIN_EMAIL (default e2e-admin@niraum.local) — admin
 *  - e2e-editor@niraum.local — editor
 *  - e2e-superadmin@niraum.local — superadmin (creates the throwaway lockout user)
 */
import { User, type Role } from '../models/User.js';
import { hashPassword } from '../services/auth.service.js';

export const E2E_DEFAULT_ADMIN_EMAIL = 'e2e-admin@niraum.local';
export const E2E_EDITOR_EMAIL = 'e2e-editor@niraum.local';
export const E2E_SUPERADMIN_EMAIL = 'e2e-superadmin@niraum.local';

export interface E2eSeedOptions {
  nodeEnv?: string;
  password?: string;
  adminEmail?: string;
}

export async function seedE2eUsers({
  nodeEnv = process.env.NODE_ENV,
  password = process.env.E2E_ADMIN_PASSWORD,
  adminEmail = process.env.E2E_ADMIN_EMAIL || E2E_DEFAULT_ADMIN_EMAIL,
}: E2eSeedOptions = {}): Promise<string[]> {
  if (nodeEnv === 'production') {
    throw new Error('Refusing to create e2e users with NODE_ENV=production');
  }
  if (!password) return [];
  if (password.length < 12 || password.length > 128) {
    throw new Error('E2E_ADMIN_PASSWORD must be 12–128 characters');
  }

  const passwordHash = await hashPassword(password);
  const users: { email: string; name: string; role: Role }[] = [
    { email: adminEmail.toLowerCase(), name: 'E2E Admin', role: 'admin' },
    { email: E2E_EDITOR_EMAIL, name: 'E2E Editor', role: 'editor' },
    { email: E2E_SUPERADMIN_EMAIL, name: 'E2E Superadmin', role: 'superadmin' },
  ];
  for (const u of users) {
    await User.updateOne(
      { email: u.email },
      {
        $set: {
          name: u.name,
          role: u.role,
          passwordHash,
          isActive: true,
          mustChangePassword: false,
          failedLoginCount: 0,
          lockUntil: null,
        },
      },
      { upsert: true },
    );
  }
  return users.map((u) => u.email);
}
