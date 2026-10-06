import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db';
import { weddings } from '#lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  return {
    user: locals.user,
  };
};

export const actions: Actions = {
  updateInfo: async ({ request, locals }) => {
    if (!locals.user) {
      return { success: true, localOnly: true };
    }

    const data = await request.formData();
    const brideName = data.get('brideName')?.toString().trim();
    const groomName = data.get('groomName')?.toString().trim();
    const weddingDate = data.get('weddingDate')?.toString() || null;
    const venueType = data.get('venueType')?.toString();
    const style = data.get('style')?.toString();
    const guestCount = Number(data.get('guestCount')) || 100;
    const totalBudget = Number(data.get('totalBudget')) || 0;

    try {
      await db
        .update(weddings)
        .set({
          brideName,
          groomName,
          weddingDate,
          venueType,
          style,
          guestCount,
          totalBudget,
          updatedAt: new Date(),
        })
        .where(eq(weddings.userId, locals.user.id));

      return { success: true };
    } catch (err) {
      console.error('Error updating wedding info in DB:', err);
      return fail(500, { error: 'Gagal memperbarui database' });
    }
  },

  updateFinancial: async ({ request, locals }) => {
    if (!locals.user) {
      return { success: true, localOnly: true };
    }

    const data = await request.formData();
    const monthlySavingsTarget = Number(data.get('monthlySavingsTarget')) || 0;

    try {
      await db
        .update(weddings)
        .set({
          monthlySavingsTarget,
          updatedAt: new Date(),
        })
        .where(eq(weddings.userId, locals.user.id));

      return { success: true };
    } catch (err) {
      console.error('Error updating financial settings in DB:', err);
      return fail(500, { error: 'Gagal memperbarui database' });
    }
  },
};
