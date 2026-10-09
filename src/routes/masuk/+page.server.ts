import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db';
import { users, weddings } from '#lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, setSessionCookie } from '#lib/server/auth';
import { saveWizardSubmission, type WizardSubmission } from '#lib/server/weddingService';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(303, '/dashboard');
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email')?.toString().trim().toLowerCase();
    const password = data.get('password')?.toString();
    const rawLocalData = data.get('localWeddingData')?.toString();

    if (!email || !password) {
      return fail(400, { error: 'Email dan kata sandi wajib diisi.', email });
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return fail(400, {
          error: 'Email atau kata sandi tidak cocok.',
          email,
        });
      }

      const isMatch = await verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return fail(400, {
          error: 'Email atau kata sandi tidak cocok.',
          email,
        });
      }

      // Pasang cookie sesi
      setSessionCookie(cookies, user.id);

      // Cek apakah user sudah punya data pernikahan
      const [userWedding] = await db
        .select({ id: weddings.id, wizardCompleted: weddings.wizardCompleted })
        .from(weddings)
        .where(eq(weddings.userId, user.id))
        .limit(1);

      // Jika belum punya pernikahan di DB tetapi membawa rencana dari sesi tamu, simpan ke akunnya
      if ((!userWedding || !userWedding.wizardCompleted) && rawLocalData) {
        try {
          const submission: WizardSubmission = JSON.parse(rawLocalData);
          await saveWizardSubmission(user.id, submission);
          throw redirect(303, '/dashboard');
        } catch (syncErr) {
          if (syncErr instanceof Response || (typeof syncErr === 'object' && syncErr !== null && 'status' in syncErr)) {
            throw syncErr;
          }
          console.warn('Gagal sinkronisasi data rencana tamu saat masuk:', syncErr);
        }
      }

      if (!userWedding || !userWedding.wizardCompleted) {
        throw redirect(303, '/wizard');
      }
    } catch (err) {
      if (err instanceof Response || (typeof err === 'object' && err !== null && 'status' in err)) {
        throw err;
      }
      console.error('Login error:', err);
      return fail(500, {
        error: 'Terjadi kendala teknis saat masuk. Silakan coba kembali.',
        email,
      });
    }

    throw redirect(303, '/dashboard');
  },
};
