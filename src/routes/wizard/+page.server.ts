import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { saveWizardSubmission, type WizardSubmission } from '#lib/server/weddingService';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/daftar');
  }
  return {
    user: locals.user,
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Anda harus masuk terlebih dahulu.' });
    }

    try {
      const data = await request.formData();
      const rawPayload = data.get('payload')?.toString();

      let submission: WizardSubmission;
      if (rawPayload) {
        submission = JSON.parse(rawPayload);
      } else {
        return fail(400, { error: 'Data rencana pernikahan tidak lengkap.' });
      }

      await saveWizardSubmission(locals.user.id, submission);
    } catch (err) {
      console.error('Error saving wizard submission:', err);
      return fail(500, { error: 'Gagal menyimpan rencana pernikahan ke database.' });
    }

    throw redirect(303, '/dashboard');
  },
};
