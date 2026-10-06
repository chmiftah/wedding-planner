import { browser } from '$app/environment';
import { writable, derived } from 'svelte/store';

// ---- Types ----
export interface WeddingInfo {
  brideName: string;
  groomName: string;
  weddingDate: string | null;
  dateNote: string;
  venueType: 'gedung' | 'rumah' | 'kombinasi' | '';
  style: 'sederhana' | 'menengah' | 'mewah' | '';
  guestCount: number;
  totalBudget: number;
  events: WeddingEvent[];
}

export interface WeddingEvent {
  id: string;
  name: string;
  date: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  items: BudgetItem[];
}

export interface BudgetItem {
  id: string;
  categoryId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vendorName: string;
  notes: string;
  payments: Payment[];
}

export interface Payment {
  id: string;
  type: 'dp' | 'cicilan' | 'lunas';
  amount: number;
  dueDate: string;
  paidAt: string | null;
  notes: string;
}

export interface FundingSource {
  id: string;
  type: 'tabungan_sendiri' | 'tabungan_pasangan' | 'bantuan_orangtua' | 'lainnya';
  name: string;
  confirmedAmount: number;
  isEstimate: boolean;
  notes: string;
}

export interface SavingsEntry {
  id: string;
  sourceId: string;
  amount: number;
  entryDate: string;
  notes: string;
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  category: 'keluarga_inti' | 'keluarga_jauh' | 'teman' | 'kolega' | 'lainnya';
  rsvpToken: string;
  rsvpStatus: 'pending' | 'hadir' | 'tidak_hadir';
  guestCount: number;
  rsvpMessage: string;
  rsvpRespondedAt: string | null;
}

export interface ChecklistItem {
  id: string;
  text: string;
  dueDate: string;
  assignee: string;
  completed: boolean;
  category: string;
  notes: string;
  priority?: 'rendah' | 'sedang' | 'tinggi';
}


export interface DigitalInvitation {
  theme: 'romantic_terracotta' | 'classic_gold' | 'emerald_botanical';
  cover: {
    title: string;
    subtitle: string;
    coverPhoto?: string;
    bgMusicUrl: string;
    bgMusicAutoPlay: boolean;
  };
  couple: {
    groomFullName: string;
    groomNickname: string;
    groomParents: string;
    groomInstagram: string;
    groomPhoto: string;
    brideFullName: string;
    brideNickname: string;
    brideParents: string;
    brideInstagram: string;
    bridePhoto: string;
  };
  quote: {
    enabled: boolean;
    text: string;
    source: string;
  };
  events: {
    akad: {
      enabled: boolean;
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      venueName: string;
      venueAddress: string;
      mapsUrl: string;
    };
    resepsi: {
      enabled: boolean;
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      venueName: string;
      venueAddress: string;
      mapsUrl: string;
    };
  };
  loveStory: {
    enabled: boolean;
    stories: Array<{ year: string; title: string; story: string }>;
  };
  gallery: {
    enabled: boolean;
    photos: string[];
  };
  gift: {
    enabled: boolean;
    bankAccounts: Array<{ bank: string; accountNumber: string; accountHolder: string }>;
    shippingAddress: {
      enabled: boolean;
      recipient: string;
      address: string;
      phone: string;
    };
  };
  wishes: Array<{
    id: string;
    name: string;
    message: string;
    attendance: 'hadir' | 'tidak_hadir';
    createdAt: string;
  }>;
}

export const createDefaultInvitation = (info?: WeddingInfo): DigitalInvitation => ({
  theme: 'romantic_terracotta',
  cover: {
    title: 'The Wedding Of',
    subtitle: 'Kami mengundang Anda untuk merayakan momen bahagia penyatuan cinta kami',
    coverPhoto: '/images/themes/romantic-arch-real.jpg',
    bgMusicUrl: '/music/the-way-you-look-at-me.mp3',
    bgMusicAutoPlay: true,
  },
  couple: {
    groomFullName: info?.groomName ? (info.groomName + ' Pratama, S.T.') : 'Rama Pratama, S.T.',
    groomNickname: info?.groomName || 'Rama',
    groomParents: 'Putra pertama dari Bpk. Hartono & Ibu Sri Wahyuni',
    groomInstagram: 'ramapratama',
    groomPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    brideFullName: info?.brideName ? (info.brideName + ' Larasati, S.E.') : 'Sinta Larasati, S.E.',
    brideNickname: info?.brideName || 'Sinta',
    brideParents: 'Putri bungsu dari Bpk. Bambang Sudiro & Ibu Ratna Dewi',
    brideInstagram: 'sintalarasati',
    bridePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  },
  quote: {
    enabled: true,
    text: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
    source: 'QS. Ar-Rum: 21',
  },
  events: {
    akad: {
      enabled: true,
      title: 'Akad Nikah',
      date: info?.weddingDate || '2026-12-20',
      startTime: '08:00',
      endTime: '10:00 WIB',
      venueName: 'Masjid Agung Al-Barkah',
      venueAddress: 'Jl. Veteran No. 12, Jakarta Pusat',
      mapsUrl: 'https://maps.google.com/?q=Jakarta',
    },
    resepsi: {
      enabled: true,
      title: 'Resepsi Pernikahan',
      date: info?.weddingDate || '2026-12-20',
      startTime: '11:00',
      endTime: '14:00 WIB',
      venueName: 'Grand Sasana Kriya Ballroom',
      venueAddress: 'Jl. Pintu Utama No. 88, Jakarta Pusat',
      mapsUrl: 'https://maps.google.com/?q=Jakarta',
    },
  },
  loveStory: {
    enabled: true,
    stories: [
      { year: '2021', title: 'Pertama Bertemu', story: 'Berawal dari rekan kerja di satu proyek kantor yang sama, kami saling bertukar cerita dan tawa.' },
      { year: '2023', title: 'Menjalin Komitmen', story: 'Setelah melewati berbagai suka duka bersama, kami memutuskan untuk melangkah ke jenjang yang lebih serius.' },
      { year: '2026', title: 'Hari Bahagia', story: 'Dengan restu kedua orang tua dan doa kerabat tercinta, kami mengikat janji suci seumur hidup.' },
    ],
  },
  gallery: {
    enabled: true,
    photos: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80',
    ],
  },
  gift: {
    enabled: true,
    bankAccounts: [
      { bank: 'BCA', accountNumber: '8410293847', accountHolder: 'Rama Pratama' },
      { bank: 'Mandiri', accountNumber: '1370019283741', accountHolder: 'Sinta Larasati' },
    ],
    shippingAddress: {
      enabled: true,
      recipient: 'Rama & Sinta',
      address: 'Jl. Cempaka Putih Tengah No. 24, Jakarta Pusat 10510',
      phone: '081234567890',
    },
  },
  wishes: [
    {
      id: 'wish-1',
      name: 'Dimas & Keluarga',
      message: 'Barakallahu lakuma wa baraka alaikuma wa jamaa bainakuma fii khoir. Selamat menempuh hidup baru Rama & Sinta!',
      attendance: 'hadir',
      createdAt: '2026-10-01 10:20',
    },
    {
      id: 'wish-2',
      name: 'Citra Permata',
      message: 'Happy wedding dear Sinta & Rama! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah. Bahagia selamanya!',
      attendance: 'hadir',
      createdAt: '2026-10-02 14:15',
    },
  ],
});

export interface WeddingStore {
  info: WeddingInfo;
  budgetCategories: BudgetCategory[];
  fundingSources: FundingSource[];
  savingsEntries: SavingsEntry[];
  envelopeEstimate: { perGuest: number; guestCountOverride: number | null };
  monthlySavingsTarget: number;
  guests: Guest[];
  checklist: ChecklistItem[];
  wizardCompleted: boolean;
  wizardStep: number;
  invitation: DigitalInvitation;
}

// ---- Default Budget Categories (template) ----
const defaultCategories = (style: string, totalBudget: number): BudgetCategory[] => {
  const percentages: Record<string, number[]> = {
    // [katering, gedung, dekor, foto, rias, undangan, musik, transport, admin, buffer]
    sederhana: [40, 15, 8, 8, 8, 5, 4, 3, 5, 4],
    menengah:  [35, 20, 10, 8, 8, 4, 4, 3, 4, 4],
    mewah:     [30, 20, 12, 8, 8, 3, 5, 3, 3, 8],
  };
  const pct = percentages[style] || percentages.menengah;

  const templates = [
    { name: 'Katering & Konsumsi', color: '#C9847A', icon: '🍽️', items: ['Paket katering / bahan makanan', 'Kue pengantin', 'Minuman dan es', 'Upah juru masak', 'Konsumsi untuk yang membantu'] },
    { name: 'Sewa Gedung / Tempat', color: '#8B5E52', icon: '🏛️', items: ['Sewa gedung / aula', 'Sewa kursi dan meja', 'Sewa tenda (jika di rumah)', 'Sewa genset'] },
    { name: 'Dekorasi & Bunga',    color: '#D4956A', icon: '🌸', items: ['Dekorasi pelaminan', 'Bunga segar / artificial', 'Dekorasi meja tamu', 'Backdrop foto'] },
    { name: 'Dokumentasi',         color: '#6A8AB8', icon: '📸', items: ['Fotografer', 'Videografer', 'Drone (opsional)', 'Album foto'] },
    { name: 'Rias & Busana',       color: '#B8726A', icon: '💍', items: ['Makeup dan rias pengantin', 'Baju pengantin', 'Baju orang tua', 'Aksesoris'] },
    { name: 'Undangan & Souvenir', color: '#6BAB8A', icon: '✉️', items: ['Undangan cetak', 'Undangan digital', 'Souvenir tamu'] },
    { name: 'Musik & Hiburan',     color: '#A88880', icon: '🎵', items: ['Band / organ tunggal', 'MC', 'Sound system'] },
    { name: 'Transportasi',        color: '#7A5850', icon: '🚗', items: ['Mobil pengantin', 'Transportasi keluarga', 'Parkir'] },
    { name: 'Administrasi',        color: '#6B4438', icon: '📋', items: ['Biaya KUA / catatan sipil', 'Mahar', 'Seserahan'] },
    { name: 'Dana Tak Terduga',    color: '#EDD5CE', icon: '🛡️', items: ['Buffer untuk kebutuhan mendadak'] },
  ];

  return templates.map((t, i) => ({
    id: `cat-${i + 1}`,
    name: t.name,
    color: t.color,
    icon: t.icon,
    items: t.items.map((itemName, j) => ({
      id: `item-${i + 1}-${j + 1}`,
      categoryId: `cat-${i + 1}`,
      name: itemName,
      quantity: 1,
      unit: 'paket',
      unitPrice: j === 0 ? Math.round(totalBudget * pct[i] / 100 / 1000) * 1000 : 0,
      vendorName: '',
      notes: '',
      payments: [],
    })),
  }));
};

// ---- Initial State ----
const initialState: WeddingStore = {
  info: {
    brideName: '',
    groomName: '',
    weddingDate: null,
    dateNote: '',
    venueType: '',
    style: '',
    guestCount: 100,
    totalBudget: 0,
    events: [],
  },
  budgetCategories: [],
  fundingSources: [],
  savingsEntries: [],
  envelopeEstimate: { perGuest: 100000, guestCountOverride: null },
  monthlySavingsTarget: 0,
  guests: [],
  checklist: [],
  wizardCompleted: false,
  wizardStep: 0,
  invitation: createDefaultInvitation(),
};

// Load from localStorage
function loadState(): WeddingStore {
  if (!browser) return initialState;
  try {
    const saved = localStorage.getItem('wedding-planner-state');
    if (!saved) return initialState;
    const parsed = JSON.parse(saved);
    const loadedInvitation = parsed.invitation
      ? { ...createDefaultInvitation(parsed.info), ...parsed.invitation }
      : createDefaultInvitation(parsed.info);

    // Auto-migrate legacy music or YouTube video link to local high-quality mp3
    if (
      !loadedInvitation.cover.bgMusicUrl ||
      loadedInvitation.cover.bgMusicUrl.includes('mixkit-romantic-wedding-piano-melody-670.mp3') ||
      loadedInvitation.cover.bgMusicUrl.includes('SgSOAPwTOdc')
    ) {
      loadedInvitation.cover.bgMusicUrl = '/music/the-way-you-look-at-me.mp3';
    }

    return {
      ...initialState,
      ...parsed,
      invitation: loadedInvitation,
    };
  } catch {
    return initialState;
  }
}

// ---- Store ----
export const wedding = writable<WeddingStore>(loadState());

// Auto-save to localStorage
wedding.subscribe((state) => {
  if (browser) {
    try { localStorage.setItem('wedding-planner-state', JSON.stringify(state)); } catch {}
  }
});

// ---- Actions ----
export function completeWizard(data: {
  info: WeddingInfo;
  monthlySavingsTarget: number;
  fundingSources: FundingSource[];
}) {
  wedding.update((s) => ({
    ...s,
    info: data.info,
    monthlySavingsTarget: data.monthlySavingsTarget,
    fundingSources: data.fundingSources,
    budgetCategories: defaultCategories(data.info.style, data.info.totalBudget),
    wizardCompleted: true,
    wizardStep: 12,
  }));
}

export function updateBudgetItem(categoryId: string, itemId: string, updates: Partial<BudgetItem>) {
  wedding.update((s) => ({
    ...s,
    budgetCategories: s.budgetCategories.map((cat) =>
      cat.id === categoryId
        ? { ...cat, items: cat.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)) }
        : cat
    ),
  }));
}

export function addBudgetItem(categoryId: string) {
  const newItem: BudgetItem = {
    id: `item-${Date.now()}`,
    categoryId,
    name: 'Item baru',
    quantity: 1,
    unit: 'paket',
    unitPrice: 0,
    vendorName: '',
    notes: '',
    payments: [],
  };
  wedding.update((s) => ({
    ...s,
    budgetCategories: s.budgetCategories.map((cat) =>
      cat.id === categoryId ? { ...cat, items: [...cat.items, newItem] } : cat
    ),
  }));
  return newItem.id;
}

export function deleteBudgetItem(categoryId: string, itemId: string) {
  wedding.update((s) => ({
    ...s,
    budgetCategories: s.budgetCategories.map((cat) =>
      cat.id === categoryId ? { ...cat, items: cat.items.filter((i) => i.id !== itemId) } : cat
    ),
  }));
}

export function addPayment(categoryId: string, itemId: string, payment: Omit<Payment, 'id'>) {
  const newPayment: Payment = { id: `pay-${Date.now()}`, ...payment };
  wedding.update((s) => ({
    ...s,
    budgetCategories: s.budgetCategories.map((cat) =>
      cat.id === categoryId
        ? {
            ...cat,
            items: cat.items.map((item) =>
              item.id === itemId ? { ...item, payments: [...item.payments, newPayment] } : item
            ),
          }
        : cat
    ),
  }));
}

export function markItemPaid(categoryId: string, itemId: string) {
  wedding.update((s) => ({
    ...s,
    budgetCategories: s.budgetCategories.map((cat) =>
      cat.id === categoryId
        ? {
            ...cat,
            items: cat.items.map((item) => {
              if (item.id !== itemId) return item;
              const total = item.quantity * item.unitPrice;
              const existing = item.payments.reduce((a, p) => a + p.amount, 0);
              const remaining = total - existing;
              if (remaining <= 0) return item;
              const newPayment: Payment = {
                id: `pay-${Date.now()}`,
                type: 'lunas',
                amount: remaining,
                dueDate: '',
                paidAt: new Date().toISOString().slice(0, 10),
                notes: 'Ditandai lunas',
              };
              return { ...item, payments: [...item.payments, newPayment] };
            }),
          }
        : cat
    ),
  }));
}


export function addBudgetCategory(name: string, icon: string = '📦', color: string = '#C9847A') {
  const newCat: BudgetCategory = {
    id: `cat-${Date.now()}`,
    name,
    icon,
    color,
    items: [],
  };
  wedding.update((s) => ({
    ...s,
    budgetCategories: [...s.budgetCategories, newCat],
  }));
  return newCat.id;
}

export function deleteBudgetCategory(categoryId: string) {
  wedding.update((s) => ({
    ...s,
    budgetCategories: s.budgetCategories.filter((c) => c.id !== categoryId),
  }));
}

export function addSavingsEntry(entry: Omit<SavingsEntry, 'id'>) {
  const newEntry: SavingsEntry = { id: `sav-${Date.now()}`, ...entry };
  wedding.update((s) => ({ ...s, savingsEntries: [newEntry, ...s.savingsEntries] }));
}

export function addGuest(guest: Omit<Guest, 'id' | 'rsvpToken' | 'rsvpStatus' | 'guestCount' | 'rsvpMessage' | 'rsvpRespondedAt'>) {
  const newGuest: Guest = {
    id: `guest-${Date.now()}`,
    rsvpToken: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
    rsvpStatus: 'pending',
    guestCount: 1,
    rsvpMessage: '',
    rsvpRespondedAt: null,
    ...guest,
  };
  wedding.update((s) => ({ ...s, guests: [...s.guests, newGuest] }));
  return newGuest;
}

export function deleteGuest(id: string) {
  wedding.update((s) => ({ ...s, guests: s.guests.filter((g) => g.id !== id) }));
}

export function addChecklistItem(item: Omit<ChecklistItem, 'id' | 'completed'>) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}`;
  const newItem: ChecklistItem = {
    id,
    completed: false,
    priority: item.priority || 'sedang',
    ...item,
  };
  wedding.update((s) => ({ ...s, checklist: [...s.checklist, newItem] }));
  return newItem;
}

export function updateChecklistItem(id: string, updates: Partial<Omit<ChecklistItem, 'id'>>) {
  wedding.update((s) => ({
    ...s,
    checklist: s.checklist.map((item) => (item.id === id ? { ...item, ...updates } : item)),
  }));
}

export function toggleChecklistItem(id: string) {
  wedding.update((s) => ({
    ...s,
    checklist: s.checklist.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i)),
  }));
}

export function deleteChecklistItem(id: string) {
  wedding.update((s) => ({ ...s, checklist: s.checklist.filter((i) => i.id !== id) }));
}

export function deleteCompletedChecklist() {
  wedding.update((s) => ({ ...s, checklist: s.checklist.filter((i) => !i.completed) }));
}

export function setAllChecklistCompleted(completed: boolean) {
  wedding.update((s) => ({
    ...s,
    checklist: s.checklist.map((i) => ({ ...i, completed })),
  }));
}

export function resetChecklistToDefault() {
  const defaultItems: ChecklistItem[] = [
    { id: 't-1', text: 'Tentukan tanggal pernikahan & lokasi venue', category: 'Venue & Dekorasi', dueDate: '', assignee: 'Keluarga', completed: false, notes: 'Musyawarah kedua pihak keluarga', priority: 'tinggi' },
    { id: 't-2', text: 'Booking gedung / konfirmasi lokasi akad & resepsi', category: 'Venue & Dekorasi', dueDate: '', assignee: 'Pasangan', completed: false, notes: 'Cek ketersediaan tanggal dan bayar DP', priority: 'tinggi' },
    { id: 't-3', text: 'Pilih & booking katering pernikahan (test food)', category: 'Katering', dueDate: '', assignee: 'Pasangan', completed: false, notes: 'Sesuaikan dengan estimasi jumlah tamu', priority: 'tinggi' },
    { id: 't-4', text: 'Pilih vendor busana pengantin & tata rias (MUA)', category: 'Rias & Busana', dueDate: '', assignee: 'Mempelai Wanita', completed: false, notes: 'Jadwalkan sesi fitting dan konsultasi tema', priority: 'sedang' },
    { id: 't-5', text: 'Pilih & booking vendor fotografer & videografer', category: 'Dokumentasi', dueDate: '', assignee: 'Mempelai Pria', completed: false, notes: 'Tentukan paket prewedding dan hari-H', priority: 'sedang' },
    { id: 't-6', text: 'Urus berkas administrasi KUA / catatan sipil', category: 'Administrasi', dueDate: '', assignee: 'Mempelai Pria', completed: false, notes: 'Surat pengantar RT/RW, kelurahan, dan imunisasi', priority: 'tinggi' },
    { id: 't-7', text: 'Susun daftar tamu undangan', category: 'Tamu & Undangan', dueDate: '', assignee: 'Pasangan', completed: false, notes: 'Kumpulkan kontak keluarga, kerabat, dan teman', priority: 'sedang' },
    { id: 't-8', text: 'Pilih MC, sound system, dan hiburan musik', category: 'Musik & Hiburan', dueDate: '', assignee: 'Pasangan', completed: false, notes: 'Buat susunan playlist lagu', priority: 'rendah' },
    { id: 't-9', text: 'Buat & sebarkan undangan digital website', category: 'Tamu & Undangan', dueDate: '', assignee: 'Pasangan', completed: false, notes: 'Kirim via WhatsApp dan media sosial', priority: 'tinggi' },
    { id: 't-10', text: 'Pesan souvenir dan cetak buku tamu', category: 'Undangan & Souvenir', dueDate: '', assignee: 'Mempelai Wanita', completed: false, notes: 'Pastikan jumlah souvenir ada cadangan 10%', priority: 'rendah' },
    { id: 't-11', text: 'Fitting final busana pengantin & seragam keluarga', category: 'Rias & Busana', dueDate: '', assignee: 'Pasangan', completed: false, notes: 'H-2 minggu sebelum acara', priority: 'sedang' },
    { id: 't-12', text: 'Technical meeting & gladi resik panitia / WO', category: 'Lainnya', dueDate: '', assignee: 'Keluarga', completed: false, notes: 'Finalisasi rundown acara dan koordinator lapangan', priority: 'tinggi' },
  ];
  wedding.update((s) => ({ ...s, checklist: defaultItems }));
}

export function hydrateWeddingFromDb(dbData: any) {
  if (!dbData || !dbData.wedding) return;
  const w = dbData.wedding;

  wedding.update((s) => ({
    ...s,
    info: {
      brideName: w.brideName || '',
      groomName: w.groomName || '',
      weddingDate: w.weddingDate || null,
      dateNote: w.dateNote || '',
      venueType: w.venueType || 'gedung',
      style: w.style || 'menengah',
      guestCount: w.guestCount || 100,
      totalBudget: Number(w.totalBudget) || 0,
      events: s.info.events.length > 0 ? s.info.events : [{ id: 'ev-1', name: 'Resepsi', date: w.weddingDate || '' }],
    },
    monthlySavingsTarget: Number(w.monthlySavingsTarget) || 0,
    budgetCategories: dbData.budgetCategories?.length ? dbData.budgetCategories : s.budgetCategories,
    fundingSources: dbData.fundingSources?.length ? dbData.fundingSources : s.fundingSources,
    checklist: dbData.checklist?.length ? dbData.checklist : s.checklist,
    guests: dbData.guests?.length ? dbData.guests : s.guests,
    invitation: dbData.invitation?.config
      ? { ...createDefaultInvitation(w), ...dbData.invitation.config }
      : s.invitation,
    wizardCompleted: Boolean(w.wizardCompleted),
  }));
}

export function resetWedding() {
  wedding.set(initialState);
}

// ---- Derived Stores ----
export const budgetSummary = derived(wedding, ($w) => {
  let totalRencana = 0;
  let totalTerpakai = 0;
  let totalDibayar = 0;

  for (const cat of $w.budgetCategories) {
    for (const item of cat.items) {
      const itemTotal = item.quantity * item.unitPrice;
      const paid = item.payments.filter((p) => p.paidAt).reduce((a, p) => a + p.amount, 0);
      const planned = item.payments.reduce((a, p) => a + p.amount, 0);
      totalRencana += itemTotal;
      totalTerpakai += planned;
      totalDibayar += paid;
    }
  }

  return { totalRencana, totalTerpakai, totalDibayar, sisaTagihan: totalRencana - totalDibayar };
});

export const savingsSummary = derived(wedding, ($w) => {
  const confirmedFunds = $w.fundingSources.filter((f) => !f.isEstimate).reduce((a, f) => a + f.confirmedAmount, 0);
  const additionalSavings = $w.savingsEntries.reduce((a, e) => a + e.amount, 0);
  const envelopeCount = $w.envelopeEstimate.guestCountOverride ?? $w.info.guestCount;
  const envelopeAmount = envelopeCount * $w.envelopeEstimate.perGuest;

  const totalTerkumpul = confirmedFunds + additionalSavings;
  const totalDenganAmplop = totalTerkumpul + envelopeAmount;

  const now = new Date();
  const weddingDate = $w.info.weddingDate ? new Date($w.info.weddingDate) : null;
  const monthsLeft = weddingDate
    ? Math.max(0, (weddingDate.getFullYear() - now.getFullYear()) * 12 + (weddingDate.getMonth() - now.getMonth()))
    : 0;

  const proyeksiTambahan = monthsLeft * $w.monthlySavingsTarget;
  const proyeksiTotal = totalTerkumpul + proyeksiTambahan;
  const target = $w.info.totalBudget;
  const kekurangan = Math.max(0, target - proyeksiTotal);
  const isOnTrack = proyeksiTotal >= target;

  return {
    totalTerkumpul,
    totalDenganAmplop,
    envelopeAmount,
    proyeksiTambahan,
    proyeksiTotal,
    kekurangan,
    isOnTrack,
    monthsLeft,
    target,
  };
});

export const guestSummary = derived(wedding, ($w) => {
  const total = $w.guests.length;
  const hadir = $w.guests.filter((g) => g.rsvpStatus === 'hadir').length;
  const tidakHadir = $w.guests.filter((g) => g.rsvpStatus === 'tidak_hadir').length;
  const pending = $w.guests.filter((g) => g.rsvpStatus === 'pending').length;
  const totalHadir = $w.guests.filter((g) => g.rsvpStatus === 'hadir').reduce((a, g) => a + g.guestCount, 0);
  return { total, hadir, tidakHadir, pending, totalHadir };
});

export function updateInvitation(updates: Partial<DigitalInvitation>) {
  wedding.update((s) => ({
    ...s,
    invitation: { ...s.invitation, ...updates },
  }));
}

export function addInvitationWish(wish: { name: string; message: string; attendance: 'hadir' | 'tidak_hadir' }) {
  const newWish = {
    id: 'wish-' + Date.now().toString(),
    name: wish.name,
    message: wish.message,
    attendance: wish.attendance,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };
  wedding.update((s) => ({
    ...s,
    invitation: {
      ...s.invitation,
      wishes: [newWish, ...(s.invitation.wishes || [])],
    },
  }));
}
