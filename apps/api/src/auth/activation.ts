import { randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function expiresIn(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
