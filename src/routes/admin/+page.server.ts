import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '#lib/server/db';
import { users, weddings } from '#lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  // Guard: Hanya admin yang boleh mengakses
  if (!locals.user) {
    throw redirect(303, '/masuk');
  }

  if (locals.user.role !== 'admin') {
    throw error(403, 'Akses Ditolak: Halaman ini khusus untuk Administrator.');
  }

  try {
    // Ambil semua user beserta data pernikahannya
    const result = await db.execute<{
      id: string;
      email: string;
      name: string;
      role: string;
      created_at: string;
      wedding_id: string | null;
      bride_name: string | null;
      groom_name: string | null;
      wedding_date: string | null;
      venue_type: string | null;
      style: string | null;
      guest_count: number | null;
      total_budget: string | null;
      wizard_completed: boolean | null;
      total_guests: string;
      total_categories: string;
    }>(sql`
      SELECT 
        u.wedding_users_id AS id,
        u.wedding_users_email AS email,
        u.wedding_users_name AS name,
        u.wedding_users_role AS role,
        u.wedding_users_created_at AS created_at,
        w.wedding_weddings_id AS wedding_id,
        w.wedding_weddings_bride_name AS bride_name,
        w.wedding_weddings_groom_name AS groom_name,
        w.wedding_weddings_wedding_date AS wedding_date,
        w.wedding_weddings_venue_type AS venue_type,
        w.wedding_weddings_style AS style,
        w.wedding_weddings_guest_count AS guest_count,
        w.wedding_weddings_total_budget AS total_budget,
        w.wedding_weddings_wizard_completed AS wizard_completed,
        (SELECT COUNT(*) FROM wedding_guests g WHERE g.wedding_guests_wedding_id = w.wedding_weddings_id) AS total_guests,
        (SELECT COUNT(*) FROM wedding_budget_categories c WHERE c.wedding_budget_categories_wedding_id = w.wedding_weddings_id) AS total_categories
      FROM wedding_users u
      LEFT JOIN wedding_weddings w ON w.wedding_weddings_user_id = u.wedding_users_id
      ORDER BY u.wedding_users_created_at DESC
    `);

    const userList = result || [];

    // Hitung statistik ringkasan
    const totalUsers = userList.length;
    const adminCount = userList.filter((u) => u.role === 'admin').length;
    const totalWeddings = userList.filter((u) => u.wedding_id !== null).length;
    const totalBudget = userList.reduce((acc, u) => acc + (Number(u.total_budget) || 0), 0);
    const totalPlannedGuests = userList.reduce((acc, u) => acc + (Number(u.guest_count) || 0), 0);

    return {
      currentUser: locals.user,
      users: userList,
      stats: {
        totalUsers,
        adminCount,
        totalWeddings,
        totalBudget,
        totalPlannedGuests,
      },
    };
  } catch (err) {
    console.error('Admin query error:', err);
    throw error(500, 'Gagal memuat data pengguna.');
  }
};

export const actions: Actions = {
  updateRole: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'admin') {
      return fail(403, { message: 'Akses ditolak' });
    }

    const data = await request.formData();
    const targetUserId = data.get('userId')?.toString();
    const newRole = data.get('role')?.toString();

    if (!targetUserId || !newRole || !['admin', 'user'].includes(newRole)) {
      return fail(400, { message: 'Data tidak valid' });
    }

    // Cegah admin mencabut status admin diri sendiri agar tidak terkunci
    if (targetUserId === locals.user.id && newRole === 'user') {
      return fail(400, { message: 'Anda tidak dapat mencabut hak akses admin Anda sendiri!' });
    }

    try {
      await db
        .update(users)
        .set({ role: newRole })
        .where(eq(users.id, targetUserId));

      return { success: true, message: `Status berhasil diubah menjadi ${newRole}` };
    } catch (err) {
      console.error('Error updating role:', err);
      return fail(500, { message: 'Gagal memperbarui status user' });
    }
  },

  deleteUser: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'admin') {
      return fail(403, { message: 'Akses ditolak' });
    }

    const data = await request.formData();
    const targetUserId = data.get('userId')?.toString();

    if (!targetUserId) {
      return fail(400, { message: 'ID pengguna tidak valid' });
    }

    // Cegah admin menghapus dirinya sendiri
    if (targetUserId === locals.user.id) {
      return fail(400, { message: 'Anda tidak dapat menghapus akun Anda sendiri saat ini!' });
    }

    try {
      await db
        .delete(users)
        .where(eq(users.id, targetUserId));

      return { success: true, message: 'Pengguna berhasil dihapus' };
    } catch (err) {
      console.error('Error deleting user:', err);
      return fail(500, { message: 'Gagal menghapus pengguna' });
    }
  },
};
