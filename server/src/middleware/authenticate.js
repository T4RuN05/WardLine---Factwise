import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { DomainError, ErrorCodes } from '../domain/errors.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new DomainError(
        ErrorCodes.UNAUTHENTICATED,
        'Authentication required. Please log in with a demo persona.',
        401
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch {
      throw new DomainError(
        ErrorCodes.UNAUTHENTICATED,
        'Invalid or expired session token. Please log in again.',
        401
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new DomainError(
        ErrorCodes.UNAUTHENTICATED,
        'User account not found or deactivated.',
        401
      );
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
