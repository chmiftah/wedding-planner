import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { weddings, calendarEvents } from '#lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateWeddingCache } from '#lib/server/weddingService';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// POST: Tambah kalender event baru
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
      title: data.title || 'Acara Baru',
      date: data.date,
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      category: data.category || 'meeting',
      location: data.location || '',
      notes: data.notes || '',
      completed: Boolean(data.completed),
    };

    if (data.id && isValidUuid(data.id)) {
      insertValues.id = data.id;
    }

    const [inserted] = await db
      .insert(calendarEvents)
      .values(insertValues)
      .returning();

    invalidateWeddingCache(locals.user.id);
    return json({ success: true, item: inserted });
  } catch (err) {
    console.error('Error inserting calendar event to DB:', err);
    return json({ success: false, error: 'Database insert failed' }, { status: 500 });
  }
};

// PUT: Perbarui kalender event
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
    if (data.title !== undefined) updateFields.title = data.title;
    if (data.date !== undefined) updateFields.date = data.date;
    if (data.startTime !== undefined) updateFields.startTime = data.startTime;
    if (data.endTime !== undefined) updateFields.endTime = data.endTime;
    if (data.category !== undefined) updateFields.category = data.category;
    if (data.location !== undefined) updateFields.location = data.location;
    if (data.notes !== undefined) updateFields.notes = data.notes;
    if (data.completed !== undefined) updateFields.completed = Boolean(data.completed);

    await db
      .update(calendarEvents)
      .set(updateFields)
      .where(and(eq(calendarEvents.id, data.id), eq(calendarEvents.weddingId, wedding.id)));

    invalidateWeddingCache(locals.user.id);
    return json({ success: true });
  } catch (err) {
    console.error('Error updating calendar event in DB:', err);
    return json({ success: false, error: 'Database update failed' }, { status: 500 });
  }
};

// DELETE: Hapus kalender event
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
        .delete(calendarEvents)
        .where(and(eq(calendarEvents.id, id), eq(calendarEvents.weddingId, wedding.id)));
      invalidateWeddingCache(locals.user.id);
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting calendar event from DB:', err);
    return json({ success: false, error: 'Database delete failed' }, { status: 500 });
  }
};
