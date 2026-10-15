import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { weddings, documents } from '#lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateWeddingCache } from '#lib/server/weddingService';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// POST: Tambah dokumen baru
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

    // Check if batch insert (e.g. initialize default documents)
    if (Array.isArray(data.items)) {
      const itemsToInsert = data.items.map((doc: any, index: number) => {
        const item: any = {
          weddingId: wedding.id,
          title: doc.title || 'Dokumen Baru',
          forParty: doc.forParty || 'wanita',
          completed: doc.completed || false,
          order: doc.order !== undefined ? doc.order : index + 1,
          notes: doc.notes || '',
          dueDate: doc.dueDate ? doc.dueDate : null,
        };
        if (doc.id && isValidUuid(doc.id)) {
          item.id = doc.id;
        }
        return item;
      });

      if (itemsToInsert.length > 0) {
        await db.insert(documents).values(itemsToInsert);
      }
      invalidateWeddingCache(locals.user.id);
      return json({ success: true, count: itemsToInsert.length });
    }

    const insertValues: any = {
      weddingId: wedding.id,
      title: data.title || 'Dokumen Baru',
      forParty: data.forParty || 'wanita',
      completed: data.completed || false,
      order: Number(data.order) || 0,
      notes: data.notes || '',
      dueDate: data.dueDate ? data.dueDate : null,
    };

    if (data.id && isValidUuid(data.id)) {
      insertValues.id = data.id;
    }

    const [inserted] = await db
      .insert(documents)
      .values(insertValues)
      .returning();

    invalidateWeddingCache(locals.user.id);
    return json({ success: true, item: inserted });
  } catch (err) {
    console.error('Error inserting document to DB:', err);
    return json({ success: false, error: 'Database insert failed' }, { status: 500 });
  }
};

// PUT: Perbarui dokumen (toggle status, edit judul/catatan)
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
    if (data.forParty !== undefined) updateFields.forParty = data.forParty;
    if (data.completed !== undefined) updateFields.completed = Boolean(data.completed);
    if (data.order !== undefined) updateFields.order = Number(data.order);
    if (data.notes !== undefined) updateFields.notes = data.notes;
    if (data.dueDate !== undefined) updateFields.dueDate = data.dueDate ? data.dueDate : null;

    await db
      .update(documents)
      .set(updateFields)
      .where(and(eq(documents.id, data.id), eq(documents.weddingId, wedding.id)));

    invalidateWeddingCache(locals.user.id);
    return json({ success: true });
  } catch (err) {
    console.error('Error updating document in DB:', err);
    return json({ success: false, error: 'Database update failed' }, { status: 500 });
  }
};

// DELETE: Hapus dokumen atau reset
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
    const isReset = url.searchParams.get('reset') === 'true';
    if (isReset) {
      await db
        .delete(documents)
        .where(eq(documents.weddingId, wedding.id));
      invalidateWeddingCache(locals.user.id);
      return json({ success: true, reset: true });
    }

    const id = url.searchParams.get('id');
    if (id && isValidUuid(id)) {
      await db
        .delete(documents)
        .where(and(eq(documents.id, id), eq(documents.weddingId, wedding.id)));
      invalidateWeddingCache(locals.user.id);
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting document from DB:', err);
    return json({ success: false, error: 'Database delete failed' }, { status: 500 });
  }
};
