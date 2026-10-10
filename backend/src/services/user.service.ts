import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { diffFields } from '../utils/diff.js';
import { listMeta } from '../utils/pagination.js';
import type { UserCreateBody, UserUpdateBody } from '../validators/auth.js';
import { auditService, type Actor } from './audit.service.js';
import { hashPassword } from './auth.service.js';

async function assertNotLastSuperadmin(userId: string) {
  const others = await User.countDocuments({
    _id: { $ne: userId },
    role: 'superadmin',
    isActive: true,
  });
  if (others === 0) throw AppError.conflict('Cannot remove the last active superadmin');
}

export const userService = {
  async list(page: number, limit: number) {
    const [docs, total] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(),
    ]);
    return { data: docs.map((d) => d.toJSON()), meta: listMeta(page, limit, total) };
  },

  /** New users must change the temporary password on first login. */
  async create(input: UserCreateBody, actor: Actor) {
    const user = await User.create({
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
      mustChangePassword: true,
    });
    await auditService.record(actor, {
      action: 'create',
      entity: 'User',
      entityId: String(user._id),
      diff: { email: user.email, role: user.role },
    });
    return user.toJSON();
  },

  async update(id: string, input: UserUpdateBody, actor: Actor) {
    const user = await User.findById(id);
    if (!user) throw AppError.notFound('User');
    const demoting = input.role !== undefined && input.role !== 'superadmin';
    const deactivating = input.isActive === false;
    if (user.role === 'superadmin' && (demoting || deactivating)) {
      await assertNotLastSuperadmin(id);
    }
    const before = user.toJSON();
    user.set(input);
    // Role or activation changes end existing sessions.
    if (input.role !== undefined || input.isActive !== undefined) user.refreshTokenVersion += 1;
    await user.save();
    const after = user.toJSON();
    await auditService.record(actor, {
      action: 'update',
      entity: 'User',
      entityId: id,
      diff: diffFields(before, after),
    });
    return after;
  },

  /** Users are deactivated, never hard-deleted, so audit history keeps its references. */
  async deactivate(id: string, actor: Actor) {
    if (id === actor.userId) throw AppError.conflict('You cannot deactivate yourself');
    return userService.update(id, { isActive: false }, actor);
  },
};
