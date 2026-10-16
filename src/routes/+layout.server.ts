import type { LayoutServerLoad } from './$types';
import { getFullWeddingData } from '#lib/server/weddingService';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    return {
      user: null,
      weddingData: null,
    };
  }

  try {
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
    const weddingData = await Promise.race([
      getFullWeddingData(locals.user.id),
      timeoutPromise,
    ]);

    return {
      user: locals.user,
      weddingData,
    };
  } catch (err) {
    console.error('Error loading wedding data in layout:', err);
    return {
      user: locals.user,
      weddingData: null,
    };
  }
};
