import { db } from './db';
import {
  weddings,
  budgetCategories,
  budgetItems,
  payments,
  fundingSources,
  savingsEntries,
  checklistItems,
  guests,
  invitations,
  vendors,
  rundowns,
  calendarEvents,
  documents,
} from './db/schema';
import { eq, asc, inArray } from 'drizzle-orm';

export interface WizardSubmission {
  brideName: string;
  groomName: string;
  weddingDate: string | null;
  dateNote: string;
  venueType: string;
  style: string;
  guestCount: number;
  totalBudget: number;
  monthlySavingsTarget: number;
  fundingSources: Array<{
    type: string;
    name: string;
    confirmedAmount: number;
    isEstimate: boolean;
    notes?: string;
  }>;
}

// Template persentase kategori anggaran berdasarkan gaya pernikahan
const stylePercentages: Record<string, number[]> = {
  sederhana: [40, 15, 8, 8, 8, 5, 4, 3, 5, 4],
  menengah:  [35, 20, 10, 8, 8, 4, 4, 3, 4, 4],
  mewah:     [30, 20, 12, 8, 8, 3, 5, 3, 3, 8],
};

const defaultCategoryTemplates = [
  { name: 'Katering & Konsumsi', color: '#C9847A', icon: 'catering', items: ['Paket katering / bahan makanan', 'Kue pengantin', 'Minuman & es', 'Upah juru masak', 'Konsumsi keluarga & panitia'] },
  { name: 'Sewa Gedung / Tempat', color: '#8B5E52', icon: 'venue', items: ['Sewa gedung / aula', 'Sewa kursi & meja', 'Sewa tenda', 'Sewa genset & kelistrikan'] },
  { name: 'Dekorasi & Bunga',    color: '#D4956A', icon: 'sparkles', items: ['Dekorasi pelaminan', 'Bunga segar / artificial', 'Dekorasi meja tamu & lorong', 'Backdrop foto'] },
  { name: 'Dokumentasi',         color: '#6A8AB8', icon: 'gift', items: ['Fotografer resepsi & akad', 'Videografer cinematic', 'Album foto & flashdisk'] },
  { name: 'Rias & Busana',       color: '#B8726A', icon: 'ring', items: ['Makeup & rias pengantin', 'Busana akad & resepsi', 'Busana orang tua & among tamu', 'Aksesoris & melati'] },
  { name: 'Undangan & Souvenir', color: '#6BAB8A', icon: 'invitation', items: ['Undangan digital website', 'Souvenir pernikahan', 'Buku tamu & pulpen'] },
  { name: 'Musik & Hiburan',     color: '#A88880', icon: 'sparkles', items: ['Akustik band / organ tunggal', 'Master of Ceremony (MC)', 'Sound system'] },
  { name: 'Transportasi',        color: '#7A5850', icon: 'checklist', items: ['Mobil pengantin', 'Transportasi keluarga inti', 'Parkir & akomodasi'] },
  { name: 'Administrasi',        color: '#6B4438', icon: 'checklist', items: ['Biaya KUA / catatan sipil', 'Mahar & seserahan', 'Penghulu / saksi'] },
  { name: 'Dana Tak Terduga',    color: '#EDD5CE', icon: 'budget', items: ['Dana cadangan kebutuhan mendadak'] },
];

const defaultChecklistTemplates = [
  { text: 'Tentukan tanggal pernikahan & venue', category: 'Venue & Dekorasi', assignee: 'Keluarga' },
  { text: 'Booking gedung / konfirmasi lokasi rumah', category: 'Venue & Dekorasi', assignee: 'Pasangan' },
  { text: 'Pilih & booking katering pernikahan', category: 'Katering', assignee: 'Pasangan' },
  { text: 'Pilih vendor busana pengantin & tata rias', category: 'Busana', assignee: 'Mempelai Wanita' },
  { text: 'Pilih & booking vendor fotografer & videografer', category: 'Dokumentasi', assignee: 'Mempelai Pria' },
  { text: 'Pilih MC dan hiburan musik', category: 'Lainnya', assignee: 'Pasangan' },
  { text: 'Susun daftar tamu undangan', category: 'Tamu & Undangan', assignee: 'Pasangan' },
  { text: 'Urus berkas administrasi KUA / catatan sipil', category: 'Administrasi', assignee: 'Mempelai Pria' },
  { text: 'Buat & sebar undangan digital', category: 'Tamu & Undangan', assignee: 'Pasangan' },
  { text: 'Fitting busana pengantin & keluarga', category: 'Busana', assignee: 'Pasangan' },
  { text: 'Technical meeting & gladi resik panitia', category: 'Lainnya', assignee: 'Keluarga' },
];

export const defaultVendorTemplates = [
  { name: 'Al-Hidayah Catering Service', category: 'Katering & Konsumsi', contactPerson: 'Ibu Ratna', phone: '081298765432', email: 'ratna@catering.com', instagram: 'alhidayah.catering', address: 'Jl. Melati No. 45, Jakarta', status: 'deal', estimatedCost: 35000000, actualCost: 35000000, notes: 'Paket 500 porsi prasmanan + 5 gubukan khas nusantara' },
  { name: 'Grand Sasana Ballroom', category: 'Sewa Gedung / Tempat', contactPerson: 'Bpk. Hendra', phone: '081387654321', email: 'marketing@grandsasana.com', instagram: 'grandsasanaballroom', address: 'Jl. Veteran No. 88, Jakarta', status: 'deal', estimatedCost: 20000000, actualCost: 20000000, notes: 'Full AC, karpet, genset standby, 6 ruang ganti/transit' },
  { name: 'Kinar Rustic Decoration', category: 'Dekorasi & Bunga', contactPerson: 'Mba Kinara', phone: '087812345678', email: 'kinardecor@gmail.com', instagram: 'kinar_decor', address: 'Jl. Anggrek No. 12, Jakarta', status: 'deal', estimatedCost: 12000000, actualCost: 12000000, notes: 'Pelaminan 10 meter, pergola jalan, backdrop foto, bunga segar mix artificial' },
  { name: 'Lensa Asmara Photography', category: 'Dokumentasi', contactPerson: 'Mas Arya', phone: '085612349876', email: 'lensasmara@gmail.com', instagram: 'lensa.asmara', address: 'Jakarta Selatan', status: 'diskusi', estimatedCost: 8000000, actualCost: 0, notes: '2 fotografer + 1 videografer cinematic + drone + album kolase' },
  { name: 'Sanggar Anggun Kebaya & MUA', category: 'Rias & Busana', contactPerson: 'Mba Dewi MUA', phone: '081901234567', email: 'dewi.mua@gmail.com', instagram: 'anggun_kebaya', address: 'Tebet, Jakarta Selatan', status: 'deal', estimatedCost: 8000000, actualCost: 8000000, notes: 'Busana akad & resepsi CPW-CPP, 2 set beskap ortu, 4 rias among tamu' },
  { name: 'Harmoni Wedding Music & MC', category: 'Musik & Hiburan', contactPerson: 'Mas Dodi MC', phone: '081233445566', email: 'harmoni.music@gmail.com', instagram: 'harmoni_weddingmusic', address: 'Jakarta', status: 'riset', estimatedCost: 4000000, actualCost: 0, notes: 'Akustik semi-full band + 1 lead singer + MC formal dan santai' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Menyimpan seluruh data hasil wizard perencanaan ke PostgreSQL
 */
export async function saveWizardSubmission(userId: string, data: WizardSubmission) {
  // 1. Cek apakah user sudah punya wedding record
  const [existingWedding] = await db
    .select({ id: weddings.id })
    .from(weddings)
    .where(eq(weddings.userId, userId))
    .limit(1);

  let weddingId: string;

  if (existingWedding) {
    weddingId = existingWedding.id;
    await db
      .update(weddings)
      .set({
        brideName: data.brideName,
        groomName: data.groomName,
        weddingDate: data.weddingDate || null,
        dateNote: data.dateNote || '',
        venueType: data.venueType,
        style: data.style,
        guestCount: data.guestCount,
        totalBudget: data.totalBudget,
        monthlySavingsTarget: data.monthlySavingsTarget,
        wizardCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(weddings.id, weddingId));
  } else {
    const [inserted] = await db
      .insert(weddings)
      .values({
        userId,
        brideName: data.brideName,
        groomName: data.groomName,
        weddingDate: data.weddingDate || null,
        dateNote: data.dateNote || '',
        venueType: data.venueType,
        style: data.style,
        guestCount: data.guestCount,
        totalBudget: data.totalBudget,
        monthlySavingsTarget: data.monthlySavingsTarget,
        wizardCompleted: true,
      })
      .returning({ id: weddings.id });
    weddingId = inserted.id;
  }

  // 2. Buat Kategori & Item Anggaran Template jika belum ada
  const existingCategories = await db
    .select({ id: budgetCategories.id })
    .from(budgetCategories)
    .where(eq(budgetCategories.weddingId, weddingId))
    .limit(1);

  if (existingCategories.length === 0) {
    const pcts = stylePercentages[data.style] || stylePercentages.menengah;

    for (let i = 0; i < defaultCategoryTemplates.length; i++) {
      const cat = defaultCategoryTemplates[i];
      const [insertedCat] = await db
        .insert(budgetCategories)
        .values({
          weddingId,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          order: i,
        })
        .returning({ id: budgetCategories.id });

      const categoryBudget = Math.round((data.totalBudget * (pcts[i] || 5)) / 100 / 1000) * 1000;

      const itemsToInsert = cat.items.map((itemName, j) => ({
        categoryId: insertedCat.id,
        name: itemName,
        quantity: 1,
        unit: 'paket',
        unitPrice: j === 0 ? categoryBudget : 0,
      }));

      if (itemsToInsert.length > 0) {
        await db.insert(budgetItems).values(itemsToInsert);
      }
    }
  }

  // 3. Simpan Sumber Pendanaan (Funding Sources)
  const existingFunding = await db
    .select({ id: fundingSources.id })
    .from(fundingSources)
    .where(eq(fundingSources.weddingId, weddingId))
    .limit(1);

  if (existingFunding.length === 0 && data.fundingSources.length > 0) {
    const fundingToInsert = data.fundingSources.map((fs) => ({
      weddingId,
      type: fs.type,
      name: fs.name,
      confirmedAmount: Number(fs.confirmedAmount) || 0,
      isEstimate: Boolean(fs.isEstimate),
      notes: fs.notes || '',
    }));
    await db.insert(fundingSources).values(fundingToInsert);
  }

  // 4. Buat Checklist Default jika belum ada
  const existingChecklist = await db
    .select({ id: checklistItems.id })
    .from(checklistItems)
    .where(eq(checklistItems.weddingId, weddingId))
    .limit(1);

  if (existingChecklist.length === 0) {
    const checklistToInsert = defaultChecklistTemplates.map((item) => ({
      weddingId,
      text: item.text,
      category: item.category,
      assignee: item.assignee,
      completed: false,
    }));
    await db.insert(checklistItems).values(checklistToInsert);
  }

  // 5. Buat Konfigurasi Undangan Digital jika belum ada
  const existingInvitation = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(eq(invitations.weddingId, weddingId))
    .limit(1);

  if (existingInvitation.length === 0) {
    const rawSlug = `${slugify(data.groomName || 'pengantin')}-dan-${slugify(data.brideName || 'pengantin')}-${Math.random().toString(36).slice(2, 6)}`;
    await db.insert(invitations).values({
      weddingId,
      slug: rawSlug,
      theme: 'romantic_terracotta',
      config: {
        cover: {
          title: 'The Wedding Of',
          subtitle: `${data.groomName || 'Pengantin'} & ${data.brideName || 'Pengantin'}`,
          bgMusicUrl: '/music/the-way-you-look-at-me.mp3',
          bgMusicAutoPlay: true,
        },
      },
    });
  }

  // 6. Buat Vendor Default jika belum ada
  const existingVendors = await db
    .select({ id: vendors.id })
    .from(vendors)
    .where(eq(vendors.weddingId, weddingId))
    .limit(1);

  if (existingVendors.length === 0) {
    const vendorsToInsert = defaultVendorTemplates.map((v) => ({
      weddingId,
      name: v.name,
      category: v.category,
      contactPerson: v.contactPerson,
      phone: v.phone,
      email: v.email,
      instagram: v.instagram,
      address: v.address,
      status: v.status,
      estimatedCost: v.estimatedCost,
      actualCost: v.actualCost,
      notes: v.notes,
    }));
    await db.insert(vendors).values(vendorsToInsert);
  }

  invalidateWeddingCache(userId);

  return weddingId;
}

// In-memory cache for getFullWeddingData (prevents repeated slow DB roundtrips)
const weddingCache = new Map<string, { data: any; expiry: number }>();

export function invalidateWeddingCache(userId?: string) {
  if (userId) {
    weddingCache.delete(userId);
  } else {
    weddingCache.clear();
  }
}

/**
 * Mengambil data lengkap pernikahan milik user untuk di-load ke Dashboard
 */
export async function getFullWeddingData(userId: string) {
  const cached = weddingCache.get(userId);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const [wedding] = await db
    .select()
    .from(weddings)
    .where(eq(weddings.userId, userId))
    .limit(1);

  if (!wedding) return null;

  // Run all independent queries in parallel at once
  const [
    categoriesList,
    sources,
    tasks,
    guestList,
    vendorList,
    rundownList,
    calendarList,
    invitationList,
    documentList,
  ] = await Promise.all([
    db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.weddingId, wedding.id))
      .orderBy(asc(budgetCategories.order)),
    db
      .select()
      .from(fundingSources)
      .where(eq(fundingSources.weddingId, wedding.id)),
    db
      .select()
      .from(checklistItems)
      .where(eq(checklistItems.weddingId, wedding.id)),
    db
      .select()
      .from(guests)
      .where(eq(guests.weddingId, wedding.id)),
    db
      .select()
      .from(vendors)
      .where(eq(vendors.weddingId, wedding.id)),
    db
      .select()
      .from(rundowns)
      .where(eq(rundowns.weddingId, wedding.id))
      .orderBy(asc(rundowns.order), asc(rundowns.startTime)),
    db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.weddingId, wedding.id))
      .orderBy(asc(calendarEvents.date), asc(calendarEvents.startTime)),
    db
      .select()
      .from(invitations)
      .where(eq(invitations.weddingId, wedding.id))
      .limit(1),
    db
      .select()
      .from(documents)
      .where(eq(documents.weddingId, wedding.id))
      .orderBy(asc(documents.order)),
  ]);

  const catIds = categoriesList.map((c) => c.id);
  const allItems =
    catIds.length > 0
      ? await db.select().from(budgetItems).where(inArray(budgetItems.categoryId, catIds))
      : [];

  const itemIds = allItems.map((i) => i.id);
  const allPayments =
    itemIds.length > 0
      ? await db.select().from(payments).where(inArray(payments.budgetItemId, itemIds))
      : [];

  const paymentsByItem = new Map<string, typeof allPayments>();
  for (const p of allPayments) {
    const list = paymentsByItem.get(p.budgetItemId) || [];
    list.push(p);
    paymentsByItem.set(p.budgetItemId, list);
  }

  const itemsByCat = new Map<string, typeof allItems>();
  for (const it of allItems) {
    const list = itemsByCat.get(it.categoryId) || [];
    list.push(it);
    itemsByCat.set(it.categoryId, list);
  }

  const fullCategories = categoriesList.map((cat) => {
    const items = itemsByCat.get(cat.id) || [];
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color || '#C9847A',
      icon: cat.icon || 'catering',
      items: items.map((it) => {
        const itemPays = paymentsByItem.get(it.id) || [];
        return {
          id: it.id,
          categoryId: it.categoryId,
          name: it.name,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: Number(it.unitPrice),
          vendorName: it.vendorName || '',
          notes: it.notes || '',
          payments: itemPays.map((p) => ({
            id: p.id,
            type: p.type as any,
            amount: Number(p.amount),
            dueDate: p.paymentDate || '',
            paidAt: p.paymentDate || null,
            notes: p.notes || '',
          })),
        };
      }),
    };
  });

  let finalSources = sources;
  if (finalSources.length === 0) {
    const groomTitle = wedding.groomName ? `Tabungan ${wedding.groomName}` : 'Tabungan Calon Pengantin Pria';
    const brideTitle = wedding.brideName ? `Tabungan ${wedding.brideName}` : 'Tabungan Calon Pengantin Wanita';

    const [insertedGroom] = await db
      .insert(fundingSources)
      .values({
        weddingId: wedding.id,
        type: 'tabungan_sendiri',
        name: groomTitle,
        confirmedAmount: 0,
        isEstimate: false,
      })
      .returning();

    const [insertedBride] = await db
      .insert(fundingSources)
      .values({
        weddingId: wedding.id,
        type: 'tabungan_pasangan',
        name: brideTitle,
        confirmedAmount: 0,
        isEstimate: false,
      })
      .returning();

    finalSources = [insertedGroom, insertedBride].filter(Boolean);
  }

  const sourceIds = finalSources.map((s) => s.id);
  const savingsList =
    sourceIds.length > 0
      ? await db.select().from(savingsEntries).where(inArray(savingsEntries.fundingSourceId, sourceIds))
      : [];

  const invitationRecord = invitationList[0] || null;

  return {
    wedding,
    budgetCategories: fullCategories,
    fundingSources: finalSources.map((s) => ({
      id: s.id,
      type: s.type,
      name: s.name,
      confirmedAmount: Number(s.confirmedAmount),
      isEstimate: s.isEstimate,
      notes: s.notes || '',
    })),
    savingsEntries: savingsList.map((se) => ({
      id: se.id,
      sourceId: se.fundingSourceId,
      amount: Number(se.amount),
      entryDate: se.entryDate,
      notes: se.notes || '',
    })),
    checklist: tasks.map((t) => ({
      id: t.id,
      text: t.text,
      dueDate: t.dueDate || '',
      assignee: t.assignee || '',
      completed: t.completed,
      category: t.category,
      notes: t.notes || '',
    })),
    guests: guestList.map((g) => ({
      id: g.id,
      name: g.name,
      phone: g.phone || '',
      email: g.email || '',
      category: g.category,
      rsvpToken: g.rsvpToken,
      rsvpStatus: g.rsvpStatus,
      guestCount: g.guestCount,
      rsvpMessage: g.rsvpMessage || '',
      rsvpRespondedAt: g.rsvpRespondedAt ? g.rsvpRespondedAt.toISOString() : null,
    })),
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
    rundowns: rundownList.map((r) => ({
      id: r.id,
      session: r.session,
      startTime: r.startTime,
      endTime: r.endTime,
      title: r.title,
      description: r.description || '',
      pic: r.pic || '',
      location: r.location || '',
      order: r.order,
    })),
    calendarEvents: calendarList.map((c) => ({
      id: c.id,
      title: c.title,
      date: c.date,
      startTime: c.startTime || '',
      endTime: c.endTime || '',
      category: c.category,
      location: c.location || '',
      notes: c.notes || '',
      completed: c.completed,
    })),
    documents: documentList.map((d) => ({
      id: d.id,
      title: d.title,
      forParty: d.forParty,
      completed: d.completed,
      order: d.order,
      notes: d.notes || '',
      dueDate: d.dueDate ? String(d.dueDate) : '',
    })),
    invitation: invitationRecord || null,
  };

  weddingCache.set(userId, { data: result, expiry: Date.now() + 60_000 });

  return result;
}
