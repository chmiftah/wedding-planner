import type { Handle } from '@sveltejs/kit';
import { getAuthenticatedUser } from '#lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = await getAuthenticatedUser(event.cookies);
  return resolve(event);
};
