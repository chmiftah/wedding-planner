import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { weddings, guests } from '#lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// POST: Tambah tamu baru atau batch tambah tamu
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
    const body = await request.json();

    // Check if batch insert
    if (Array.isArray(body.guests)) {
      const itemsToInsert = body.guests.map((g: any) => {
        const item: any = {
          weddingId: wedding.id,
          name: g.name || 'Tamu Undangan',
          phone: g.phone || '',
          email: g.email || '',
          category: g.category || 'teman',
          rsvpToken: g.rsvpToken || (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36)),
          rsvpStatus: g.rsvpStatus || 'pending',
          guestCount: Number(g.guestCount) || 1,
          rsvpMessage: g.rsvpMessage || '',
        };
        if (g.id && isValidUuid(g.id)) {
          item.id = g.id;
        }
        return item;
      });

      if (itemsToInsert.length > 0) {
        await db.insert(guests).values(itemsToInsert);
      }
      return json({ success: true, count: itemsToInsert.length });
    }

    // Single insert
    const insertValues: any = {
      weddingId: wedding.id,
      name: body.name || 'Tamu Undangan',
      phone: body.phone || '',
      email: body.email || '',
      category: body.category || 'teman',
      rsvpToken: body.rsvpToken || (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36)),
      rsvpStatus: body.rsvpStatus || 'pending',
      guestCount: Number(body.guestCount) || 1,
      rsvpMessage: body.rsvpMessage || '',
    };

    if (body.id && isValidUuid(body.id)) {
      insertValues.id = body.id;
    }

    const [inserted] = await db
      .insert(guests)
      .values(insertValues)
      .returning();

    return json({ success: true, item: inserted });
  } catch (err) {
    console.error('Error inserting guest to DB:', err);
    return json({ success: false, error: 'Database insert failed' }, { status: 500 });
  }
};

// PUT: Perbarui data tamu
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
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.phone !== undefined) updateFields.phone = data.phone;
    if (data.email !== undefined) updateFields.email = data.email;
    if (data.category !== undefined) updateFields.category = data.category;
    if (data.rsvpStatus !== undefined) updateFields.rsvpStatus = data.rsvpStatus;
    if (data.guestCount !== undefined) updateFields.guestCount = Number(data.guestCount) || 1;
    if (data.rsvpMessage !== undefined) updateFields.rsvpMessage = data.rsvpMessage;
    if (data.rsvpRespondedAt !== undefined) {
      updateFields.rsvpRespondedAt = data.rsvpRespondedAt ? new Date(data.rsvpRespondedAt) : null;
    }

    await db
      .update(guests)
      .set(updateFields)
      .where(and(eq(guests.id, data.id), eq(guests.weddingId, wedding.id)));

    return json({ success: true });
  } catch (err) {
    console.error('Error updating guest in DB:', err);
    return json({ success: false, error: 'Database update failed' }, { status: 500 });
  }
};

// DELETE: Hapus tamu (individual atau batch)
export const DELETE: RequestHandler = async ({ url, request, locals }) => {
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
    const queryId = url.searchParams.get('id');
    if (queryId && isValidUuid(queryId)) {
      await db
        .delete(guests)
        .where(and(eq(guests.id, queryId), eq(guests.weddingId, wedding.id)));
      return json({ success: true });
    }

    // Check if batch delete via request body
    try {
      const body = await request.json();
      if (Array.isArray(body?.ids) && body.ids.length > 0) {
        const validIds = body.ids.filter(isValidUuid);
        if (validIds.length > 0) {
          await db
            .delete(guests)
            .where(and(inArray(guests.id, validIds), eq(guests.weddingId, wedding.id)));
        }
        return json({ success: true, deleted: validIds.length });
      }
    } catch {
      // Body might be empty, ignore
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting guest from DB:', err);
    return json({ success: false, error: 'Database delete failed' }, { status: 500 });
  }
};
