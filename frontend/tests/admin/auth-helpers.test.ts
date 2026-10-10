import { can, type Area, type Role } from '@/admin/auth/roles';
import { passwordScore } from '@/admin/components/PasswordStrength';

describe('passwordScore', () => {
  it.each([
    ['', 0],
    ['short-pass1', 0], // 11 chars
    ['abcdefgh123!', 2], // 12
    ['abcdefgh123!xyz.', 3], // 16
    ['abcdefgh123!xyz.abc1', 4], // 20
    ['aaaaaaaaaaaaaaaaaaaa', 3], // 20, one character class
    ['mypassword-is-long-ok', 3], // ≥20 but contains a common word
    ['qwertyuiopas', 1], // 12, one class
  ])('%s → %i', (pw, score) => {
    expect(passwordScore(pw)).toBe(score);
  });
});

describe('can', () => {
  const areas: Area[] = ['content', 'media', 'assay', 'settings', 'inbox', 'audit', 'users'];
  const allowed: Record<Role, Area[]> = {
    editor: ['content', 'media', 'assay'],
    admin: ['content', 'media', 'assay', 'settings', 'inbox', 'audit'],
    superadmin: areas,
  };

  it.each(Object.entries(allowed) as [Role, Area[]][])('%s', (role, list) => {
    for (const area of areas) expect(can(role, area)).toBe(list.includes(area));
  });

  it('denies everything without a role', () => {
    for (const area of areas) expect(can(undefined, area)).toBe(false);
  });
});
