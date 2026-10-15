import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { weddings, fundingSources, savingsEntries } from '#lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { invalidateWeddingCache } from '#lib/server/weddingService';

// GET: Ambil daftar sumber dana dan riwayat setoran tabungan
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const [wedding] = await db
    .select({
      id: weddings.id,
      monthlySavingsTarget: weddings.monthlySavingsTarget,
    })
    .from(weddings)
    .where(eq(weddings.userId, locals.user.id))
    .limit(1);

  if (!wedding) {
    return json({ success: true, fundingSources: [], savingsEntries: [] });
  }

  const sources = await db
    .select()
    .from(fundingSources)
    .where(eq(fundingSources.weddingId, wedding.id));

  const sourceIds = sources.map((s) => s.id);
  const savings =
    sourceIds.length > 0
      ? await db
          .select()
          .from(savingsEntries)
          .where(inArray(savingsEntries.fundingSourceId, sourceIds))
      : [];

  return json({
    success: true,
    monthlySavingsTarget: Number(wedding.monthlySavingsTarget) || 0,
    fundingSources: sources.map((s) => ({
      id: s.id,
      type: s.type,
      name: s.name,
      confirmedAmount: Number(s.confirmedAmount),
      isEstimate: s.isEstimate,
      notes: s.notes || '',
    })),
    savingsEntries: savings.map((e) => ({
      id: e.id,
      sourceId: e.fundingSourceId,
      amount: Number(e.amount),
      entryDate: e.entryDate,
      notes: e.notes || '',
    })),
  });
};

// POST: Tambah setoran tabungan atau perbarui sumber dana / target
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ success: true, localOnly: true });
  }

  const [wedding] = await db
    .select({
      id: weddings.id,
      groomName: weddings.groomName,
      brideName: weddings.brideName,
    })
    .from(weddings)
    .where(eq(weddings.userId, locals.user.id))
    .limit(1);

  if (!wedding) {
    return json({ success: false, error: 'Wedding not found' }, { status: 404 });
  }

  const body = await request.json();
  const action = body.action || (body.amount !== undefined ? 'add_entry' : '');

  // 1. Tambah Setoran Tabungan
  if (action === 'add_entry') {
    let targetSourceId = body.sourceId;

    // Validasi apakah sourceId valid milik wedding ini
    const validSource = targetSourceId
      ? await db
          .select({ id: fundingSources.id })
          .from(fundingSources)
          .where(
            and(
              eq(fundingSources.id, targetSourceId),
              eq(fundingSources.weddingId, wedding.id)
            )
          )
          .limit(1)
      : [];

    if (validSource.length === 0) {
      // Cari sumber dana yang ada
      const existingSources = await db
        .select()
        .from(fundingSources)
        .where(eq(fundingSources.weddingId, wedding.id))
        .limit(1);

      if (existingSources.length > 0) {
        targetSourceId = existingSources[0].id;
      } else {
        // Buat sumber dana default jika belum ada sama sekali
        const defaultName = wedding.groomName
          ? `Tabungan ${wedding.groomName}`
          : 'Tabungan Utama';

        const [createdSource] = await db
          .insert(fundingSources)
          .values({
            weddingId: wedding.id,
            type: 'tabungan_sendiri',
            name: defaultName,
            confirmedAmount: 0,
            isEstimate: false,
          })
          .returning();

        targetSourceId = createdSource.id;
      }
    }

    const [newEntry] = await db
      .insert(savingsEntries)
      .values({
        fundingSourceId: targetSourceId,
        amount: Number(body.amount) || 0,
        entryDate: body.entryDate || new Date().toISOString().slice(0, 10),
        notes: body.notes ? String(body.notes).trim() : '',
      })
      .returning();

    invalidateWeddingCache(locals.user.id);

    return json({
      success: true,
      entry: {
        id: newEntry.id,
        sourceId: newEntry.fundingSourceId,
        amount: Number(newEntry.amount),
        entryDate: newEntry.entryDate,
        notes: newEntry.notes || '',
      },
    });
  }

  // 2. Tambah / Edit Sumber Dana
  if (action === 'save_source') {
    if (body.id) {
      await db
        .update(fundingSources)
        .set({
          name: String(body.name).trim(),
          type: body.type || 'tabungan_sendiri',
          confirmedAmount: Number(body.confirmedAmount) || 0,
          isEstimate: Boolean(body.isEstimate),
          notes: body.notes ? String(body.notes).trim() : '',
        })
        .where(
          and(
            eq(fundingSources.id, body.id),
            eq(fundingSources.weddingId, wedding.id)
          )
        );
    } else {
      await db.insert(fundingSources).values({
        weddingId: wedding.id,
        name: String(body.name).trim(),
        type: body.type || 'tabungan_sendiri',
        confirmedAmount: Number(body.confirmedAmount) || 0,
        isEstimate: Boolean(body.isEstimate),
        notes: body.notes ? String(body.notes).trim() : '',
      });
    }

    invalidateWeddingCache(locals.user.id);
    return json({ success: true });
  }

  // 3. Update Target Tabungan Bulanan
  if (action === 'update_target') {
    await db
      .update(weddings)
      .set({
        monthlySavingsTarget: Number(body.monthlySavingsTarget) || 0,
      })
      .where(eq(weddings.id, wedding.id));

    invalidateWeddingCache(locals.user.id);
    return json({ success: true });
  }

  return json({ success: false, error: 'Unknown action' }, { status: 400 });
};

// DELETE: Hapus setoran tabungan atau sumber dana
export const DELETE: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) {
    return json({ success: true, localOnly: true });
  }

  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type') || 'entry';

  if (!id) {
    return json({ success: false, error: 'Missing id parameter' }, { status: 400 });
  }

  const [wedding] = await db
    .select({ id: weddings.id })
    .from(weddings)
    .where(eq(weddings.userId, locals.user.id))
    .limit(1);

  if (!wedding) {
    return json({ success: false, error: 'Wedding not found' }, { status: 404 });
  }

  if (type === 'entry') {
    // Pastikan entry ini terhubung ke funding source milik wedding ini
    const [entry] = await db
      .select({
        id: savingsEntries.id,
        fundingSourceId: savingsEntries.fundingSourceId,
      })
      .from(savingsEntries)
      .where(eq(savingsEntries.id, id))
      .limit(1);

    if (entry) {
      const [source] = await db
        .select({ id: fundingSources.id })
        .from(fundingSources)
        .where(
          and(
            eq(fundingSources.id, entry.fundingSourceId),
            eq(fundingSources.weddingId, wedding.id)
          )
        )
        .limit(1);

      if (source) {
        await db.delete(savingsEntries).where(eq(savingsEntries.id, id));
        invalidateWeddingCache(locals.user.id);
        return json({ success: true });
      }
    }
    return json({ success: false, error: 'Entry not found' }, { status: 404 });
  }

  if (type === 'source') {
    await db
      .delete(fundingSources)
      .where(
        and(
          eq(fundingSources.id, id),
          eq(fundingSources.weddingId, wedding.id)
        )
      );
    invalidateWeddingCache(locals.user.id);
    return json({ success: true });
  }

  return json({ success: false, error: 'Invalid type parameter' }, { status: 400 });
};
