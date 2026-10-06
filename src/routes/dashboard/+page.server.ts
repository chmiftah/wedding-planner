import type { PageServerLoad } from './$types';
import { getFullWeddingData } from '#lib/server/weddingService';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return {
      user: null,
      weddingData: null,
    };
  }

  try {
    const weddingData = await getFullWeddingData(locals.user.id);

    return {
      user: locals.user,
      weddingData,
    };
  } catch (err) {
    console.error('Error loading wedding data on dashboard:', err);
    return {
      user: locals.user,
      weddingData: null,
    };
  }
};
