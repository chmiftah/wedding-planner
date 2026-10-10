import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { weddings, vendors } from '#lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// POST: Tambah vendor baru
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
      name: data.name || 'Vendor Baru',
      category: data.category || 'Lainnya',
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email || '',
      instagram: data.instagram || '',
      address: data.address || '',
      status: data.status || 'riset',
      estimatedCost: Number(data.estimatedCost) || 0,
      actualCost: Number(data.actualCost) || 0,
      notes: data.notes || '',
    };

    if (data.id && isValidUuid(data.id)) {
      insertValues.id = data.id;
    }

    const [inserted] = await db
      .insert(vendors)
      .values(insertValues)
      .returning();

    return json({ success: true, item: inserted });
  } catch (err) {
    console.error('Error inserting vendor to DB:', err);
    return json({ success: false, error: 'Database insert failed' }, { status: 500 });
  }
};

// PUT: Perbarui vendor
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
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.category !== undefined) updateFields.category = data.category;
    if (data.contactPerson !== undefined) updateFields.contactPerson = data.contactPerson;
    if (data.phone !== undefined) updateFields.phone = data.phone;
    if (data.email !== undefined) updateFields.email = data.email;
    if (data.instagram !== undefined) updateFields.instagram = data.instagram;
    if (data.address !== undefined) updateFields.address = data.address;
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.estimatedCost !== undefined) updateFields.estimatedCost = Number(data.estimatedCost) || 0;
    if (data.actualCost !== undefined) updateFields.actualCost = Number(data.actualCost) || 0;
    if (data.notes !== undefined) updateFields.notes = data.notes;

    await db
      .update(vendors)
      .set(updateFields)
      .where(and(eq(vendors.id, data.id), eq(vendors.weddingId, wedding.id)));

    return json({ success: true });
  } catch (err) {
    console.error('Error updating vendor in DB:', err);
    return json({ success: false, error: 'Database update failed' }, { status: 500 });
  }
};

// DELETE: Hapus vendor
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
        .delete(vendors)
        .where(and(eq(vendors.id, id), eq(vendors.weddingId, wedding.id)));
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting vendor from DB:', err);
    return json({ success: false, error: 'Database delete failed' }, { status: 500 });
  }
};
