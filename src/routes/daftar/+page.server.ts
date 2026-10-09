import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '#lib/server/db';
import { users } from '#lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, setSessionCookie } from '#lib/server/auth';
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
    const name = data.get('name')?.toString().trim();
    const email = data.get('email')?.toString().trim().toLowerCase();
    const password = data.get('password')?.toString();
    const confirmPassword = data.get('confirmPassword')?.toString();
    const rawLocalData = data.get('localWeddingData')?.toString();

    if (!name || name.length < 2) {
      return fail(400, { error: 'Nama lengkap wajib diisi minimal 2 karakter.', name, email });
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      return fail(400, { error: 'Alamat email tidak valid.', name, email });
    }

    if (!password || password.length < 6) {
      return fail(400, { error: 'Kata sandi minimal 6 karakter.', name, email });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: 'Konfirmasi kata sandi tidak cocok.', name, email });
    }

    let hasLocalPlan = false;

    try {
      // Periksa apakah email sudah terdaftar
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return fail(400, {
          error: 'Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.',
          name,
          email,
        });
      }

      // Hash password & buat user
      const passwordHash = await hashPassword(password);
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash,
        })
        .returning({ id: users.id });

      // Pasang cookie sesi
      setSessionCookie(cookies, newUser.id);

      // Jika user sudah memiliki rencana dari mode tamu browser, langsung simpan ke database
      if (rawLocalData) {
        try {
          const submission: WizardSubmission = JSON.parse(rawLocalData);
          await saveWizardSubmission(newUser.id, submission);
          hasLocalPlan = true;
        } catch (syncErr) {
          console.warn('Gagal sinkronisasi data rencana tamu saat registrasi:', syncErr);
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      return fail(500, {
        error: 'Terjadi kendala teknis saat mendaftar. Silakan coba kembali.',
        name,
        email,
      });
    }

    // Jika sudah ada rencana yang tersinkron, langsung ke dashboard. Jika belum, buka wizard.
    if (hasLocalPlan) {
      throw redirect(303, '/dashboard');
    }

    throw redirect(303, '/wizard');
  },
};
