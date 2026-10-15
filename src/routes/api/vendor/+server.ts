import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { weddings, vendors } from '#lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateWeddingCache, defaultVendorTemplates } from '#lib/server/weddingService';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// GET: Ambil daftar vendor milik user
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const [wedding] = await db
    .select({ id: weddings.id })
    .from(weddings)
    .where(eq(weddings.userId, locals.user.id))
    .limit(1);

  if (!wedding) {
    return json({ success: true, vendors: [] });
  }

  const vendorList = await db
    .select()
    .from(vendors)
    .where(eq(vendors.weddingId, wedding.id));

  return json({
    success: true,
    vendors: vendorList.map((v) => ({
      id: v.id,
      name: v.name,
      category: v.category,
      contactPerson: v.contactPerson || '',
      phone: v.phone || '',
      email: v.email || '',
      instagram: v.instagram || '',
      address: v.address || '',
      status: v.status,
      estimatedCost: Number(v.estimatedCost) || 0,
      actualCost: Number(v.actualCost) || 0,
      notes: v.notes || '',
    })),
  });
};

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

    invalidateWeddingCache(locals.user.id);
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

    invalidateWeddingCache(locals.user.id);
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
    const name = url.searchParams.get('name');
    const action = url.searchParams.get('action');

    if (action === 'reset') {
      await db.delete(vendors).where(eq(vendors.weddingId, wedding.id));
      const insertedList = [];
      for (const t of defaultVendorTemplates) {
        const [ins] = await db.insert(vendors).values({
          weddingId: wedding.id,
          name: t.name,
          category: t.category,
          contactPerson: t.contactPerson,
          phone: t.phone,
          email: t.email,
          instagram: t.instagram,
          address: t.address,
          status: t.status,
          estimatedCost: t.estimatedCost,
          actualCost: t.actualCost,
          notes: t.notes,
        }).returning();
        insertedList.push(ins);
      }
      invalidateWeddingCache(locals.user.id);
      return json({
        success: true,
        vendors: insertedList.map((v) => ({
          id: v.id,
          name: v.name,
          category: v.category,
          contactPerson: v.contactPerson || '',
          phone: v.phone || '',
          email: v.email || '',
          instagram: v.instagram || '',
          address: v.address || '',
          status: v.status,
          estimatedCost: Number(v.estimatedCost) || 0,
          actualCost: Number(v.actualCost) || 0,
          notes: v.notes || '',
        })),
      });
    }

    if (id && isValidUuid(id)) {
      await db
        .delete(vendors)
        .where(and(eq(vendors.id, id), eq(vendors.weddingId, wedding.id)));
      invalidateWeddingCache(locals.user.id);
      return json({ success: true, deletedId: id });
    }

    // Jika id bukan UUID (misal template id v-1) atau name dicantumkan, hapus berdasarkan nama vendor
    if (name) {
      await db
        .delete(vendors)
        .where(and(eq(vendors.name, name), eq(vendors.weddingId, wedding.id)));
      invalidateWeddingCache(locals.user.id);
      return json({ success: true, deletedName: name });
    }

    invalidateWeddingCache(locals.user.id);
    return json({ success: true });
  } catch (err) {
    console.error('Error deleting vendor from DB:', err);
    return json({ success: false, error: 'Database delete failed' }, { status: 500 });
  }
};
