import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearSessionCookie } from '#lib/server/auth';

export const GET: RequestHandler = async ({ cookies }) => {
  clearSessionCookie(cookies);
  throw redirect(303, '/masuk');
};

export const POST: RequestHandler = async ({ cookies }) => {
  clearSessionCookie(cookies);
  throw redirect(303, '/masuk');
};
