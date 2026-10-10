import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { weddings, rundowns } from '#lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// POST: Tambah rundown item baru
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ success: true, localOnly: true });
  }

  const [wedding] = await db
    .select({ id: weddings.id })
    .from(weddings)
    .where(eq(weddings.userId, locals.user.id))
    .limit(1);

  if (!wedding) {
    return json({ success: true, localOnly: true });
  }

  try {
    const data = await request.json();
    const insertValues: any = {
      weddingId: wedding.id,
      session: data.session || 'Akad Nikah',
      startTime: data.startTime || '08:00',
      endTime: data.endTime || '09:00',
      title: data.title || 'Agenda Baru',
      description: data.description || '',
      pic: data.pic || '',
      location: data.location || '',
      order: Number(data.order) || 0,
    };

    if (data.id && isValidUuid(data.id)) {
      insertValues.id = data.id;
    }

    const [inserted] = await db
      .insert(rundowns)
      .values(insertValues)
      .returning();

    return json({ success: true, item: inserted });
  } catch (err) {
    console.error('Error inserting rundown item to DB:', err);
    return json({ success: false, error: 'Database insert failed' }, { status: 500 });
  }
};

// PUT: Perbarui rundown item
export const PUT: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ success: true, localOnly: true });
  }

  const [wedding] = await db
    .select({ id: weddings.id })
    .from(weddings)
    .where(eq(weddings.userId, locals.user.id))
    .limit(1);

  if (!wedding) {
    return json({ success: true, localOnly: true });
  }

  try {
    const data = await request.json();
    if (!data.id || !isValidUuid(data.id)) {
      return json({ success: true, localOnly: true });
    }

    const updateFields: any = {
      updatedAt: new Date(),
    };
    if (data.session !== undefined) updateFields.session = data.session;
    if (data.startTime !== undefined) updateFields.startTime = data.startTime;
    if (data.endTime !== undefined) updateFields.endTime = data.endTime;
    if (data.title !== undefined) updateFields.title = data.title;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.pic !== undefined) updateFields.pic = data.pic;
    if (data.location !== undefined) updateFields.location = data.location;
    if (data.order !== undefined) updateFields.order = Number(data.order) || 0;

    await db
      .update(rundowns)
      .set(updateFields)
      .where(and(eq(rundowns.id, data.id), eq(rundowns.weddingId, wedding.id)));

    return json({ success: true });
  } catch (err) {
    console.error('Error updating rundown item in DB:', err);
    return json({ success: false, error: 'Database update failed' }, { status: 500 });
  }
};

// DELETE: Hapus rundown item
export const DELETE: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) {
    return json({ success: true, localOnly: true });
  }

  const [wedding] = await db
    .select({ id: weddings.id })
    .from(weddings)
    .where(eq(weddings.userId, locals.user.id))
    .limit(1);

  if (!wedding) {
    return json({ success: true, localOnly: true });
  }

  try {
    const id = url.searchParams.get('id');
    if (id && isValidUuid(id)) {
      await db
        .delete(rundowns)
        .where(and(eq(rundowns.id, id), eq(rundowns.weddingId, wedding.id)));
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting rundown item from DB:', err);
    return json({ success: false, error: 'Database delete failed' }, { status: 500 });
  }
};
