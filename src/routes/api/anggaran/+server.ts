import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { weddings, budgetCategories, budgetItems, payments } from '#lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { invalidateWeddingCache } from '#lib/server/weddingService';

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// GET: Ambil seluruh kategori & item anggaran milik user
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
    return json({ success: true, categories: [] });
  }

  const cats = await db
    .select()
    .from(budgetCategories)
    .where(eq(budgetCategories.weddingId, wedding.id))
    .orderBy(budgetCategories.order);

  const catIds = cats.map((c) => c.id);
  const items = catIds.length > 0
    ? await db.select().from(budgetItems).where(inArray(budgetItems.categoryId, catIds))
    : [];

  const itemIds = items.map((i) => i.id);
  const pays = itemIds.length > 0
    ? await db.select().from(payments).where(inArray(payments.budgetItemId, itemIds))
    : [];

  const paysByItem = new Map<string, typeof pays>();
  for (const p of pays) {
    const list = paysByItem.get(p.budgetItemId) || [];
    list.push(p);
    paysByItem.set(p.budgetItemId, list);
  }

  const itemsByCat = new Map<string, typeof items>();
  for (const it of items) {
    const list = itemsByCat.get(it.categoryId) || [];
    list.push(it);
    itemsByCat.set(it.categoryId, list);
  }

  const full = cats.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color || '#C9847A',
    icon: c.icon || 'catering',
    order: c.order,
    items: (itemsByCat.get(c.id) || []).map((it) => ({
      id: it.id,
      categoryId: it.categoryId,
      name: it.name,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: Number(it.unitPrice),
      vendorName: it.vendorName || '',
      notes: it.notes || '',
      payments: (paysByItem.get(it.id) || []).map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentDate: p.paymentDate,
        type: p.type,
        proofUrl: p.proofUrl,
        notes: p.notes,
      })),
    })),
  }));

  return json({ success: true, categories: full });
};

// POST: Tambah kategori, item anggaran, atau pembayaran baru
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
    const type = data.type || (data.categoryId ? 'item' : 'category');

    if (type === 'category') {
      const insertValues: any = {
        weddingId: wedding.id,
        name: data.name || 'Kategori Baru',
        color: data.color || '#C9847A',
        icon: data.icon || 'catering',
        order: Number(data.order) || 0,
      };
      if (data.id && isValidUuid(data.id)) {
        insertValues.id = data.id;
      }

      const [inserted] = await db
        .insert(budgetCategories)
        .values(insertValues)
        .returning();

      invalidateWeddingCache(locals.user.id);
      return json({ success: true, item: inserted });
    }

    if (type === 'item') {
      if (!data.categoryId || !isValidUuid(data.categoryId)) {
        return json({ success: false, error: 'Invalid categoryId' }, { status: 400 });
      }

      // Verify category belongs to user wedding
      const [cat] = await db
        .select({ id: budgetCategories.id })
        .from(budgetCategories)
        .where(and(eq(budgetCategories.id, data.categoryId), eq(budgetCategories.weddingId, wedding.id)))
        .limit(1);

      if (!cat) {
        return json({ success: false, error: 'Category not found' }, { status: 404 });
      }

      const insertValues: any = {
        categoryId: cat.id,
        name: data.name || 'Item Baru',
        quantity: Number(data.quantity) || 1,
        unit: data.unit || 'paket',
        unitPrice: Number(data.unitPrice) || 0,
        vendorName: data.vendorName || '',
        notes: data.notes || '',
      };
      if (data.id && isValidUuid(data.id)) {
        insertValues.id = data.id;
      }

      const [inserted] = await db
        .insert(budgetItems)
        .values(insertValues)
        .returning();

      invalidateWeddingCache(locals.user.id);
      return json({ success: true, item: inserted });
    }

    if (type === 'payment') {
      if (!data.budgetItemId || !isValidUuid(data.budgetItemId)) {
        return json({ success: false, error: 'Invalid budgetItemId' }, { status: 400 });
      }

      const insertValues: any = {
        budgetItemId: data.budgetItemId,
        amount: Number(data.amount) || 0,
        paymentDate: data.paymentDate || new Date().toISOString().slice(0, 10),
        type: data.paymentType || data.type || 'dp',
        proofUrl: data.proofUrl || null,
        notes: data.notes || '',
      };
      if (data.id && isValidUuid(data.id)) {
        insertValues.id = data.id;
      }

      const [inserted] = await db
        .insert(payments)
        .values(insertValues)
        .returning();

      invalidateWeddingCache(locals.user.id);
      return json({ success: true, item: inserted });
    }

    return json({ success: false, error: 'Unknown type' }, { status: 400 });
  } catch (err) {
    console.error('Error inserting budget data to DB:', err);
    return json({ success: false, error: 'Database insert failed' }, { status: 500 });
  }
};

// PUT: Perbarui kategori, item anggaran, atau pembayaran
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

    const type = data.type || (data.categoryId ? 'item' : 'category');

    if (type === 'category') {
      const updateFields: any = {};
      if (data.name !== undefined) updateFields.name = data.name;
      if (data.color !== undefined) updateFields.color = data.color;
      if (data.icon !== undefined) updateFields.icon = data.icon;
      if (data.order !== undefined) updateFields.order = Number(data.order);

      await db
        .update(budgetCategories)
        .set(updateFields)
        .where(and(eq(budgetCategories.id, data.id), eq(budgetCategories.weddingId, wedding.id)));

      invalidateWeddingCache(locals.user.id);
      return json({ success: true });
    }

    if (type === 'item') {
      const updateFields: any = {};
      if (data.name !== undefined) updateFields.name = data.name;
      if (data.quantity !== undefined) updateFields.quantity = Number(data.quantity) || 1;
      if (data.unit !== undefined) updateFields.unit = data.unit;
      if (data.unitPrice !== undefined) updateFields.unitPrice = Number(data.unitPrice) || 0;
      if (data.vendorName !== undefined) updateFields.vendorName = data.vendorName;
      if (data.notes !== undefined) updateFields.notes = data.notes;

      // Verify item belongs to user wedding
      const [item] = await db
        .select({ id: budgetItems.id })
        .from(budgetItems)
        .innerJoin(budgetCategories, eq(budgetItems.categoryId, budgetCategories.id))
        .where(and(eq(budgetItems.id, data.id), eq(budgetCategories.weddingId, wedding.id)))
        .limit(1);

      if (item) {
        await db
          .update(budgetItems)
          .set(updateFields)
          .where(eq(budgetItems.id, item.id));
      }

      invalidateWeddingCache(locals.user.id);
      return json({ success: true });
    }

    if (type === 'payment') {
      const updateFields: any = {};
      if (data.amount !== undefined) updateFields.amount = Number(data.amount);
      if (data.paymentDate !== undefined) updateFields.paymentDate = data.paymentDate;
      if (data.paymentType !== undefined || data.type !== undefined) updateFields.type = data.paymentType || data.type;
      if (data.proofUrl !== undefined) updateFields.proofUrl = data.proofUrl;
      if (data.notes !== undefined) updateFields.notes = data.notes;

      await db
        .update(payments)
        .set(updateFields)
        .where(eq(payments.id, data.id));

      invalidateWeddingCache(locals.user.id);
      return json({ success: true });
    }

    return json({ success: false, error: 'Unknown type' }, { status: 400 });
  } catch (err) {
    console.error('Error updating budget data in DB:', err);
    return json({ success: false, error: 'Database update failed' }, { status: 500 });
  }
};

// DELETE: Hapus item anggaran, kategori anggaran, atau pembayaran
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
    const type = url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('itemId') || url.searchParams.get('categoryId');

    if (!id || !isValidUuid(id)) {
      return json({ success: true, localOnly: true });
    }

    if (type === 'category' || url.searchParams.get('categoryId')) {
      // Hapus kategori beserta seluruh itemnya (cascade)
      await db
        .delete(budgetCategories)
        .where(and(eq(budgetCategories.id, id), eq(budgetCategories.weddingId, wedding.id)));

      invalidateWeddingCache(locals.user.id);
      return json({ success: true, deleted: 'category', id });
    }

    if (type === 'item' || url.searchParams.get('itemId')) {
      // Pastikan item milik kategori di pernikahan user
      const [item] = await db
        .select({ id: budgetItems.id })
        .from(budgetItems)
        .innerJoin(budgetCategories, eq(budgetItems.categoryId, budgetCategories.id))
        .where(and(eq(budgetItems.id, id), eq(budgetCategories.weddingId, wedding.id)))
        .limit(1);

      if (item) {
        await db.delete(budgetItems).where(eq(budgetItems.id, item.id));
      }

      invalidateWeddingCache(locals.user.id);
      return json({ success: true, deleted: 'item', id });
    }

    // Jika type tidak dispesifikasikan eksplisit, coba cari di budgetItems terlebih dahulu lalu budgetCategories
    const [matchingItem] = await db
      .select({ id: budgetItems.id })
      .from(budgetItems)
      .innerJoin(budgetCategories, eq(budgetItems.categoryId, budgetCategories.id))
      .where(and(eq(budgetItems.id, id), eq(budgetCategories.weddingId, wedding.id)))
      .limit(1);

    if (matchingItem) {
      await db.delete(budgetItems).where(eq(budgetItems.id, matchingItem.id));
      invalidateWeddingCache(locals.user.id);
      return json({ success: true, deleted: 'item', id });
    }

    const [matchingCat] = await db
      .select({ id: budgetCategories.id })
      .from(budgetCategories)
      .where(and(eq(budgetCategories.id, id), eq(budgetCategories.weddingId, wedding.id)))
      .limit(1);

    if (matchingCat) {
      await db.delete(budgetCategories).where(eq(budgetCategories.id, matchingCat.id));
      invalidateWeddingCache(locals.user.id);
      return json({ success: true, deleted: 'category', id });
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting budget data from DB:', err);
    return json({ success: false, error: 'Database delete failed' }, { status: 500 });
  }
};
