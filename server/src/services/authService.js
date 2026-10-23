import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { recordAuditEvent } from './auditService.js';
import { DomainError, ErrorCodes } from '../domain/errors.js';

export async function getDemoPersonas() {
  const users = await User.find({ isActive: true }).sort({ role: 1, name: 1 });
  return users;
}

export async function demoLogin(userId) {
  if (!env.DEMO_MODE) {
    throw new DomainError(
      ErrorCodes.PERMISSION_DENIED,
      'Demo persona login is disabled in production mode.',
      403
    );
  }

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new DomainError(ErrorCodes.NOT_FOUND, 'Demo user account not found.', 404);
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  await recordAuditEvent({
    actor: user,
    action: 'DEMO_LOGIN',
    entity: 'User',
    entityId: user._id,
    summary: `${user.name} logged in as ${user.role}.`,
    meta: { role: user.role },
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      title: user.title,
    },
    token,
  };
}
