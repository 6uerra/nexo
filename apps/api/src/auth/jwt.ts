import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import type { AuthSession } from '@nexo/shared';

export function signSession(payload: AuthSession): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifySession(token: string): AuthSession | null {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthSession;
  } catch {
    return null;
  }
}
