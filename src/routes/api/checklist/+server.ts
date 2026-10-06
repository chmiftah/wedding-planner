import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { weddings, checklistItems } from '#lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// POST: Tambah tugas baru ke database
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
      text: data.text || 'Tugas Baru',
      dueDate: data.dueDate || null,
      assignee: data.assignee || '',
      completed: Boolean(data.completed),
      category: data.category || 'Umum',
      notes: data.notes || '',
    };

    if (data.id && isValidUuid(data.id)) {
      insertValues.id = data.id;
    }

    const [inserted] = await db
      .insert(checklistItems)
      .values(insertValues)
      .returning();

    return json({ success: true, item: inserted });
  } catch (err) {
    console.error('Error inserting checklist item to DB:', err);
    return json({ success: false, error: 'Database insert failed' }, { status: 500 });
  }
};

// PUT: Perbarui tugas di database
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

    const updateFields: any = {};
    if (data.text !== undefined) updateFields.text = data.text;
    if (data.dueDate !== undefined) updateFields.dueDate = data.dueDate || null;
    if (data.assignee !== undefined) updateFields.assignee = data.assignee;
    if (data.completed !== undefined) updateFields.completed = Boolean(data.completed);
    if (data.category !== undefined) updateFields.category = data.category;
    if (data.notes !== undefined) updateFields.notes = data.notes;

    await db
      .update(checklistItems)
      .set(updateFields)
      .where(and(eq(checklistItems.id, data.id), eq(checklistItems.weddingId, wedding.id)));

    return json({ success: true });
  } catch (err) {
    console.error('Error updating checklist item in DB:', err);
    return json({ success: false, error: 'Database update failed' }, { status: 500 });
  }
};

// DELETE: Hapus tugas dari database
export const DELETE: RequestHandler = async ({ request, url, locals }) => {
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
    const action = url.searchParams.get('action');

    if (action === 'deleteCompleted') {
      await db
        .delete(checklistItems)
        .where(and(eq(checklistItems.weddingId, wedding.id), eq(checklistItems.completed, true)));
      return json({ success: true });
    }

    if (id && isValidUuid(id)) {
      await db
        .delete(checklistItems)
        .where(and(eq(checklistItems.id, id), eq(checklistItems.weddingId, wedding.id)));
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting checklist item from DB:', err);
    return json({ success: false, error: 'Database delete failed' }, { status: 500 });
  }
};
