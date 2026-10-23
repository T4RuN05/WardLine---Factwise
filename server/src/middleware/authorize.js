import { can } from '../domain/permissions.js';
import { DomainError, ErrorCodes } from '../domain/errors.js';

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new DomainError(ErrorCodes.UNAUTHENTICATED, 'Authentication required.', 401)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new DomainError(
          ErrorCodes.PERMISSION_DENIED,
          `Action restricted. Allowed roles: ${allowedRoles.join(', ')}. Your role is ${req.user.role}.`,
          403
        )
      );
    }

    next();
  };
}

export function requirePermission(action) {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new DomainError(ErrorCodes.UNAUTHENTICATED, 'Authentication required.', 401)
      );
    }

    if (!can(req.user.role, action)) {
      return next(
        new DomainError(
          ErrorCodes.PERMISSION_DENIED,
          `Permission denied: role ${req.user.role} cannot perform '${action}'.`,
          403
        )
      );
    }

    next();
  };
}
