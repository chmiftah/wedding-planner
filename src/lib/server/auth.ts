import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { Cookies } from '@sveltejs/kit';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const AUTH_SECRET = process.env.AUTH_SECRET || 'wedding-planner-app-secret-key-32chars-min!';
const COOKIE_NAME = 'wedding_session';
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(userId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;
  const payload = JSON.stringify({ userId, exp: expiresAt });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): { userId: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payloadB64)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadStr);

    if (typeof payload.userId !== 'string' || typeof payload.exp !== 'number') {
      return null;
    }

    if (Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }

    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function setSessionCookie(cookies: Cookies, userId: string) {
  const token = createSessionToken(userId);
  cookies.set(COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DURATION,
  });
}

export function clearSessionCookie(cookies: Cookies) {
  cookies.delete(COOKIE_NAME, { path: '/' });
}

export async function getAuthenticatedUser(cookies: Cookies) {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session) return null;

  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    return user || null;
  } catch (err) {
    console.error('Error fetching authenticated user:', err);
    return null;
  }
}
