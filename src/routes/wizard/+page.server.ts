import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { saveWizardSubmission, type WizardSubmission } from '#lib/server/weddingService';

export const load: PageServerLoad = async ({ locals }) => {
  return {
    user: locals.user || null,
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    // Jika user sudah login, sinkronkan langsung ke PostgreSQL
    if (locals.user) {
      try {
        const data = await request.formData();
        const rawPayload = data.get('payload')?.toString();

        if (rawPayload) {
          const submission: WizardSubmission = JSON.parse(rawPayload);
          await saveWizardSubmission(locals.user.id, submission);
        }
      } catch (err) {
        console.error('Error saving wizard submission:', err);
        return fail(500, { error: 'Gagal menyimpan rencana pernikahan ke database.' });
      }
    }

    // Untuk user tamu, data sudah tersimpan di localStorage browser via store client
    throw redirect(303, '/dashboard');
  },
};
