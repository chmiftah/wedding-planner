import type { PageServerLoad } from './$types';
import { getFullWeddingData } from '#lib/server/weddingService';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return {
      user: null,
      weddingData: null,
    };
  }

  const weddingData = await getFullWeddingData(locals.user.id);

  return {
    user: locals.user,
    weddingData,
  };
};
