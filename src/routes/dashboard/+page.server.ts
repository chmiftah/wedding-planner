import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFullWeddingData } from '#lib/server/weddingService';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/masuk');
  }

  const weddingData = await getFullWeddingData(locals.user.id);

  if (!weddingData || !weddingData.wedding.wizardCompleted) {
    throw redirect(303, '/wizard');
  }

  return {
    user: locals.user,
    weddingData,
  };
};
