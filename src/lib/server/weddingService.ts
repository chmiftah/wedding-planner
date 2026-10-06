import { db } from './db';
import {
  weddings,
  budgetCategories,
  budgetItems,
  fundingSources,
  checklistItems,
  guests,
  invitations,
} from './db/schema';
import { eq, asc } from 'drizzle-orm';

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

      for (let j = 0; j < cat.items.length; j++) {
        const itemName = cat.items[j];
        await db.insert(budgetItems).values({
          categoryId: insertedCat.id,
          name: itemName,
          quantity: 1,
          unit: 'paket',
          unitPrice: j === 0 ? categoryBudget : 0,
        });
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
    for (const fs of data.fundingSources) {
      await db.insert(fundingSources).values({
        weddingId,
        type: fs.type,
        name: fs.name,
        confirmedAmount: fs.confirmedAmount,
        isEstimate: fs.isEstimate,
        notes: fs.notes || '',
      });
    }
  }

  // 4. Buat Checklist Default jika belum ada
  const existingChecklist = await db
    .select({ id: checklistItems.id })
    .from(checklistItems)
    .where(eq(checklistItems.weddingId, weddingId))
    .limit(1);

  if (existingChecklist.length === 0) {
    for (const item of defaultChecklistTemplates) {
      await db.insert(checklistItems).values({
        weddingId,
        text: item.text,
        category: item.category,
        assignee: item.assignee,
        completed: false,
      });
    }
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

  return weddingId;
}

/**
 * Mengambil data lengkap pernikahan milik user untuk di-load ke Dashboard
 */
export async function getFullWeddingData(userId: string) {
  const [wedding] = await db
    .select()
    .from(weddings)
    .where(eq(weddings.userId, userId))
    .limit(1);

  if (!wedding) return null;

  // Ambil Kategori & Item Anggaran
  const categoriesList = await db
    .select()
    .from(budgetCategories)
    .where(eq(budgetCategories.weddingId, wedding.id))
    .orderBy(asc(budgetCategories.order));

  const fullCategories = await Promise.all(
    categoriesList.map(async (cat) => {
      const items = await db
        .select()
        .from(budgetItems)
        .where(eq(budgetItems.categoryId, cat.id));

      return {
        id: cat.id,
        name: cat.name,
        color: cat.color || '#C9847A',
        icon: cat.icon || 'catering',
        items: items.map((it) => ({
          id: it.id,
          categoryId: it.categoryId,
          name: it.name,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: Number(it.unitPrice),
          vendorName: it.vendorName || '',
          notes: it.notes || '',
          payments: [],
        })),
      };
    })
  );

  // Ambil Sumber Pendanaan
  const sources = await db
    .select()
    .from(fundingSources)
    .where(eq(fundingSources.weddingId, wedding.id));

  // Ambil Checklist
  const tasks = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.weddingId, wedding.id));

  // Ambil Tamu
  const guestList = await db
    .select()
    .from(guests)
    .where(eq(guests.weddingId, wedding.id));

  // Ambil Undangan Digital
  const [invitationRecord] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.weddingId, wedding.id))
    .limit(1);

  return {
    wedding,
    budgetCategories: fullCategories,
    fundingSources: sources.map((s) => ({
      id: s.id,
      type: s.type,
      name: s.name,
      confirmedAmount: Number(s.confirmedAmount),
      isEstimate: s.isEstimate,
      notes: s.notes || '',
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
    invitation: invitationRecord || null,
  };
}
