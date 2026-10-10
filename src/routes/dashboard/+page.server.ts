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
    // 2-second timeout so page navigation never hangs if remote DB is slow
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
    const weddingData = await Promise.race([
      getFullWeddingData(locals.user.id),
      timeoutPromise,
    ]);

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
