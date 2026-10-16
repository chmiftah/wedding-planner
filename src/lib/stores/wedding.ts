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
  category: 'keluarga_inti' | 'keluarga_jauh' | 'teman' | 'kolega' | 'vip' | 'tetangga' | 'lainnya' | string;
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

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  instagram: string;
  address: string;
  status: 'riset' | 'diskusi' | 'deal' | 'lunas' | 'selesai';
  estimatedCost: number;
  actualCost: number;
  notes: string;
}

export interface RundownItem {
  id: string;
  session: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  pic: string;
  location: string;
  order: number;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: 'meeting' | 'fitting' | 'test_food' | 'survey' | 'kua' | 'hari_h' | 'lainnya';
  location: string;
  notes: string;
  completed: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  forParty: 'wanita' | 'pria' | 'bersama';
  completed: boolean;
  order: number;
  notes: string;
  dueDate?: string;
}

export interface DigitalInvitation {
  theme: 'romantic_terracotta' | 'classic_gold' | 'emerald_botanical' | 'dusty_lavender';
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

export const defaultRundownTemplates: RundownItem[] = [
  { id: 'rd-1', session: 'Akad Nikah', startTime: '07:00', endTime: '07:30', title: 'Kedatangan Calon Pengantin & Keluarga Inti', description: 'Keluarga berkumpul di ruang transit, persiapan busana & mikrofon', pic: 'WO Koordinator & Penerima Tamu', location: 'Ruang Transit / Foyer', order: 1 },
  { id: 'rd-2', session: 'Akad Nikah', startTime: '07:30', endTime: '08:00', title: 'Penyambutan Calon Pengantin Pria & Rombongan', description: 'Pengalungan untaian melati oleh Ibunda CPW ke CPP, penyerahan seserahan secara simbolis', pic: 'Juru Bicara Kedua Keluarga', location: 'Pintu Masuk Utama', order: 2 },
  { id: 'rd-3', session: 'Akad Nikah', startTime: '08:00', endTime: '08:45', title: 'Prosesi Ijab Kabul & Penandatanganan Buku Nikah', description: 'Pembacaan ayat suci Al-Qur\'an, khutbah nikah, ijab kabul, penyerahan mahar & cincin kawin', pic: 'Penghulu KUA, Saksi, & MC', location: 'Meja Akad Nikah', order: 3 },
  { id: 'rd-4', session: 'Akad Nikah', startTime: '08:45', endTime: '09:30', title: 'Sungkeman & Foto Bersama Keluarga Inti', description: 'Kedua mempelai memohon doa restu orang tua, disusul sesi foto keluarga inti', pic: 'Fotografer & WO Lapangan', location: 'Pelaminan Akad', order: 4 },
  { id: 'rd-5', session: 'Akad Nikah', startTime: '09:30', endTime: '10:30', title: 'Istirahat & Retouch Makeup Resepsi', description: 'Mempelai dan keluarga ganti busana / touch up MUA, makan siang keluarga', pic: 'MUA & Asisten Mempelai', location: 'Kamar Rias', order: 5 },
  { id: 'rd-6', session: 'Resepsi', startTime: '11:00', endTime: '11:15', title: 'Kirab Pengantin & Masuk Pelaminan', description: 'Pengantin didampingi orang tua dan pagar ayu/bagus memasuki ballroom diiringi musik', pic: 'MC, Soundman & WO Kirab', location: 'Pintu Utama ke Pelaminan', order: 6 },
  { id: 'rd-7', session: 'Resepsi', startTime: '11:15', endTime: '11:30', title: 'Sambutan Perwakilan Keluarga & Doa Bersama', description: 'Ucapan terima kasih mewakili kedua keluarga besar dan doa keberkahan', pic: 'Bpk. Wakil Keluarga & Pembaca Doa', location: 'Panggung / Pelaminan', order: 7 },
  { id: 'rd-8', session: 'Resepsi', startTime: '11:30', endTime: '13:30', title: 'Ramah Tamah, Hiburan Musik & Ucapan Selamat', description: 'Tamu undangan bersalaman, menikmati sajian katering, musik live akustik', pic: 'MC, Katering & Band Hiburan', location: 'Area Prasmanan & Pelaminan', order: 8 },
  { id: 'rd-9', session: 'Resepsi', startTime: '13:30', endTime: '13:45', title: 'Sesi Lempar Handbouquet & Games Seru', description: 'Mempelai melempar bunga untuk sahabat lajang, sesi kuis / doorprize kecil', pic: 'MC & Fotografer', location: 'Depan Pelaminan', order: 9 },
  { id: 'rd-10', session: 'Resepsi', startTime: '13:45', endTime: '14:00', title: 'Closing Resepsi & Foto Panitia/Vendor', description: 'Penutupan acara resepsi oleh MC, foto bersama seluruh vendor dan panitia', pic: 'MC & All Vendor', location: 'Pelaminan', order: 10 },
];

export const defaultCalendarTemplates = (weddingDateStr?: string | null): CalendarEventItem[] => {
  const baseDate = weddingDateStr ? new Date(weddingDateStr) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const formatIsoDate = (d: Date) => d.toISOString().slice(0, 10);
  
  const subDays = (days: number) => {
    const d = new Date(baseDate.getTime() - days * 24 * 60 * 60 * 1000);
    return formatIsoDate(d);
  };

  return [
    { id: 'ev-1', title: 'Survei & Booking Gedung Pertemuan', date: subDays(150), startTime: '10:00', endTime: '12:00', category: 'survey', location: 'Gedung / Aula', notes: 'Cek kapasitas parkir, fasilitas AC, dan ketersediaan tanggal', completed: true },
    { id: 'ev-2', title: 'Test Food Katering (Menu Resepsi & Akad)', date: subDays(120), startTime: '13:00', endTime: '15:00', category: 'test_food', location: 'Kantor Vendor Katering', notes: 'Ajak kedua orang tua untuk mencicipi hidangan utama & gubukan', completed: true },
    { id: 'ev-3', title: 'Konsultasi Konsep Tema Dekorasi & Pelaminan', date: subDays(90), startTime: '14:00', endTime: '16:00', category: 'meeting', location: 'Studio Dekorasi', notes: 'Bawa referensi moodboard terracotta & bunga segar', completed: false },
    { id: 'ev-4', title: 'Fitting Busana Pengantin Tahap 1', date: subDays(60), startTime: '11:00', endTime: '13:00', category: 'fitting', location: 'Butik Busana & MUA', notes: 'Ukur lingkar badan, pastikan detail payet dan warna kain sesuai', completed: false },
    { id: 'ev-5', title: 'Sesi Foto Prewedding Outdoor', date: subDays(45), startTime: '06:00', endTime: '12:00', category: 'meeting', location: 'Taman Bunga & Studio', notes: 'Siapkan 2 pasang outfit dan properti pendukung', completed: false },
    { id: 'ev-6', title: 'Pendaftaran & Bimbingan Perkawinan di KUA', date: subDays(30), startTime: '09:00', endTime: '11:30', category: 'kua', location: 'Kantor KUA Setempat', notes: 'Bawa pasfoto berlatar biru, fotokopi KTP, KK, & surat pengantar', completed: false },
    { id: 'ev-7', title: 'Final Fitting Busana Pengantin & Keluarga', date: subDays(14), startTime: '13:00', endTime: '16:00', category: 'fitting', location: 'Butik Pengantin', notes: 'Cek ulang kenyamanan sepatu dan aksesori pelengkap', completed: false },
    { id: 'ev-8', title: 'Technical Meeting (TM) Seluruh Vendor & Panitia', date: subDays(7), startTime: '15:00', endTime: '18:00', category: 'meeting', location: 'Venue Acara', notes: 'Finalisasi rundown acara, sound check, dan denah penempatan', completed: false },
    { id: 'ev-9', title: 'Gladi Resik & Doa Bersama Keluarga', date: subDays(1), startTime: '16:00', endTime: '18:00', category: 'hari_h', location: 'Rumah Mempelai / Venue', notes: 'Cek perlengkapan mahar, cincin kawin, dan berkas nikah', completed: false },
    { id: 'ev-10', title: 'HARI H: Akad Nikah & Resepsi Pernikahan', date: weddingDateStr || formatIsoDate(baseDate), startTime: '07:00', endTime: '14:00', category: 'hari_h', location: 'Venue Pernikahan', notes: 'Momen sakral & bahagia! Bismillah lancar tanpa kendala.', completed: false },
  ];
};

export const defaultVendorTemplates: VendorItem[] = [
  { id: 'v-1', name: 'Al-Hidayah Catering Service', category: 'Katering & Konsumsi', contactPerson: 'Ibu Ratna', phone: '081298765432', email: 'ratna@catering.com', instagram: 'alhidayah.catering', address: 'Jl. Melati No. 45, Jakarta', status: 'deal', estimatedCost: 35000000, actualCost: 35000000, notes: 'Paket 500 porsi prasmanan + 5 gubukan khas nusantara' },
  { id: 'v-2', name: 'Grand Sasana Ballroom', category: 'Sewa Gedung / Tempat', contactPerson: 'Bpk. Hendra', phone: '081387654321', email: 'marketing@grandsasana.com', instagram: 'grandsasanaballroom', address: 'Jl. Veteran No. 88, Jakarta', status: 'deal', estimatedCost: 20000000, actualCost: 20000000, notes: 'Full AC, karpet, genset standby, 6 ruang ganti/transit' },
  { id: 'v-3', name: 'Kinar Rustic Decoration', category: 'Dekorasi & Bunga', contactPerson: 'Mba Kinara', phone: '087812345678', email: 'kinardecor@gmail.com', instagram: 'kinar_decor', address: 'Jl. Anggrek No. 12, Jakarta', status: 'deal', estimatedCost: 12000000, actualCost: 12000000, notes: 'Pelaminan 10 meter, pergola jalan, backdrop foto, bunga segar mix artificial' },
  { id: 'v-4', name: 'Lensa Asmara Photography', category: 'Dokumentasi', contactPerson: 'Mas Arya', phone: '085612349876', email: 'lensasmara@gmail.com', instagram: 'lensa.asmara', address: 'Jakarta Selatan', status: 'diskusi', estimatedCost: 8000000, actualCost: 0, notes: '2 fotografer + 1 videografer cinematic + drone + album kolase' },
  { id: 'v-5', name: 'Sanggar Anggun Kebaya & MUA', category: 'Rias & Busana', contactPerson: 'Mba Dewi MUA', phone: '081901234567', email: 'dewi.mua@gmail.com', instagram: 'anggun_kebaya', address: 'Tebet, Jakarta Selatan', status: 'deal', estimatedCost: 8000000, actualCost: 8000000, notes: 'Busana akad & resepsi CPW-CPP, 2 set beskap ortu, 4 rias among tamu' },
  { id: 'v-6', name: 'Harmoni Wedding Music & MC', category: 'Musik & Hiburan', contactPerson: 'Mas Dodi MC', phone: '081233445566', email: 'harmoni.music@gmail.com', instagram: 'harmoni_weddingmusic', address: 'Jakarta', status: 'riset', estimatedCost: 4000000, actualCost: 0, notes: 'Akustik semi-full band + 1 lead singer + MC formal dan santai' },
];

export const defaultDocumentTemplates: DocumentItem[] = [
  // --- Calon Pengantin Wanita (15 syarat resmi) ---
  { id: 'doc-w-1', title: 'Surat pengantar dari Desa/Kelurahan', forParty: 'wanita', completed: false, order: 1, notes: 'Pengantar RT/RW dibawa ke kantor Desa/Kelurahan setempat' },
  { id: 'doc-w-2', title: 'N1 - Surat Keterangan Untuk Nikah', forParty: 'wanita', completed: false, order: 2, notes: 'Didapat dari Kelurahan / Desa' },
  { id: 'doc-w-3', title: 'N2 - Surat Keterangan Asal Usul', forParty: 'wanita', completed: false, order: 3, notes: 'Didapat dari Kelurahan / Desa' },
  { id: 'doc-w-4', title: 'N3 - Surat Persetujuan Mempelai', forParty: 'wanita', completed: false, order: 4, notes: 'Ditandatangani kedua calon mempelai' },
  { id: 'doc-w-5', title: 'N4 - Surat Keterangan Tentang Orang Tua', forParty: 'wanita', completed: false, order: 5, notes: 'Didapat dari Kelurahan / Desa' },
  { id: 'doc-w-6', title: 'N5 - Surat Izin Orang Tua', forParty: 'wanita', completed: false, order: 6, notes: 'Jika calon pengantin usianya di bawah 21 tahun' },
  { id: 'doc-w-7', title: 'Fotocopy Identitas Diri (KTP) Calon Pengantin Wanita', forParty: 'wanita', completed: false, order: 7, notes: 'Siapkan 2-3 lembar fotocopy jelas' },
  { id: 'doc-w-8', title: 'Fotocopy Identitas Diri (KTP) Saksi 1', forParty: 'wanita', completed: false, order: 8, notes: 'KTP saksi nikah pihak mempelai wanita' },
  { id: 'doc-w-9', title: 'Fotocopy Identitas Diri (KTP) Orang tua', forParty: 'wanita', completed: false, order: 9, notes: 'KTP ayah dan ibu kandung' },
  { id: 'doc-w-10', title: 'Fotocopy Identitas Diri (KTP) Saksi 2', forParty: 'wanita', completed: false, order: 10, notes: 'KTP saksi nikah pendamping' },
  { id: 'doc-w-11', title: 'Fotocopy Kartu Keluarga (KK)', forParty: 'wanita', completed: false, order: 11, notes: 'Kartu Keluarga terbaru' },
  { id: 'doc-w-12', title: 'Fotocopy Akta Lahir', forParty: 'wanita', completed: false, order: 12, notes: 'Atau surat kenal lahir' },
  { id: 'doc-w-13', title: 'Surat keterangan sehat calon suami/imunisasi calon istri (Suntik TT / Catin)', forParty: 'wanita', completed: false, order: 13, notes: 'Didapat dari Puskesmas setempat (Sertifikat Elsimil)' },
  { id: 'doc-w-14', title: 'Surat pernyataan belum pernah kawin dari Desa/Kelurahan', forParty: 'wanita', completed: false, order: 14, notes: 'Bermaterai cukup' },
  { id: 'doc-w-15', title: 'Pas photo background biru 2x3 (5 lembar), 3x5 (5 lembar)', forParty: 'wanita', completed: false, order: 15, notes: 'Foto formal berbusana rapi / berhijab' },

  // --- Calon Pengantin Pria (15 syarat resmi) ---
  { id: 'doc-p-1', title: 'Surat pengantar dari Desa/Kelurahan', forParty: 'pria', completed: false, order: 16, notes: 'Pengantar RT/RW dibawa ke kantor Desa/Kelurahan domisili' },
  { id: 'doc-p-2', title: 'N1 - Surat Keterangan Untuk Nikah', forParty: 'pria', completed: false, order: 17, notes: 'Didapat dari Kelurahan / Desa' },
  { id: 'doc-p-3', title: 'N2 - Surat Keterangan Asal Usul', forParty: 'pria', completed: false, order: 18, notes: 'Didapat dari Kelurahan / Desa' },
  { id: 'doc-p-4', title: 'N3 - Surat Persetujuan Mempelai', forParty: 'pria', completed: false, order: 19, notes: 'Ditandatangani kedua calon mempelai' },
  { id: 'doc-p-5', title: 'N4 - Surat Keterangan Tentang Orang Tua', forParty: 'pria', completed: false, order: 20, notes: 'Didapat dari Kelurahan / Desa' },
  { id: 'doc-p-6', title: 'N5 - Surat Izin Orang Tua', forParty: 'pria', completed: false, order: 21, notes: 'Jika calon pengantin usianya di bawah 21 tahun' },
  { id: 'doc-p-7', title: 'Fotocopy Identitas Diri (KTP) Calon Pengantin Pria', forParty: 'pria', completed: false, order: 22, notes: 'Siapkan 2-3 lembar fotocopy jelas' },
  { id: 'doc-p-8', title: 'Fotocopy Identitas Diri (KTP) Saksi 1', forParty: 'pria', completed: false, order: 23, notes: 'KTP saksi nikah pihak mempelai pria' },
  { id: 'doc-p-9', title: 'Fotocopy Identitas Diri (KTP) Orang tua', forParty: 'pria', completed: false, order: 24, notes: 'KTP ayah dan ibu kandung' },
  { id: 'doc-p-10', title: 'Fotocopy Identitas Diri (KTP) Saksi 2', forParty: 'pria', completed: false, order: 25, notes: 'KTP saksi nikah pendamping' },
  { id: 'doc-p-11', title: 'Fotocopy Kartu Keluarga (KK)', forParty: 'pria', completed: false, order: 26, notes: 'Kartu Keluarga terbaru' },
  { id: 'doc-p-12', title: 'Fotocopy Akta Lahir', forParty: 'pria', completed: false, order: 27, notes: 'Atau surat kenal lahir' },
  { id: 'doc-p-13', title: 'Surat keterangan sehat calon suami/imunisasi calon istri', forParty: 'pria', completed: false, order: 28, notes: 'Didapat dari Puskesmas domisili' },
  { id: 'doc-p-14', title: 'Surat pernyataan belum pernah kawin dari Desa/Kelurahan', forParty: 'pria', completed: false, order: 29, notes: 'Bermaterai cukup' },
  { id: 'doc-p-15', title: 'Pas photo background biru 2x3 (5 lembar), 3x5 (5 lembar)', forParty: 'pria', completed: false, order: 30, notes: 'Foto formal kemeja berkerah' },

  // --- Dokumen Bersama & Berkas Khusus ---
  { id: 'doc-b-1', title: 'Surat Rekomendasi Nikah (Numpang Nikah dari KUA asal)', forParty: 'bersama', completed: false, order: 31, notes: 'Wajib jika salah satu atau kedua mempelai menikah di luar kecamatan domisili' },
  { id: 'doc-b-2', title: 'Bukti Pendaftaran Nikah Online (Simkah Kemenag)', forParty: 'bersama', completed: false, order: 32, notes: 'Bukti nomor registrasi dari situs simkah.kemenag.go.id' },
  { id: 'doc-b-3', title: 'Bukti Setor Biaya Nikah Non-KUA (jika menikah di luar KUA / hari libur)', forParty: 'bersama', completed: false, order: 33, notes: 'Biaya PNBP Rp 600.000 via bank persepsi / Simponi' },
];

export interface WeddingStore {
  info: WeddingInfo;
  budgetCategories: BudgetCategory[];
  fundingSources: FundingSource[];
  savingsEntries: SavingsEntry[];
  envelopeEstimate: { perGuest: number; guestCountOverride: number | null };
  monthlySavingsTarget: number;
  guests: Guest[];
  checklist: ChecklistItem[];
  vendors: VendorItem[];
  rundowns: RundownItem[];
  calendarEvents: CalendarEventItem[];
  documents: DocumentItem[];
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
  vendors: defaultVendorTemplates,
  rundowns: defaultRundownTemplates,
  calendarEvents: defaultCalendarTemplates(),
  documents: defaultDocumentTemplates,
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

    if (!parsed.documents || parsed.documents.length === 0) {
      parsed.documents = defaultDocumentTemplates;
    }

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
      vendors: Array.isArray(parsed.vendors) ? parsed.vendors : defaultVendorTemplates,
      rundowns: parsed.rundowns?.length ? parsed.rundowns : defaultRundownTemplates,
      calendarEvents: parsed.calendarEvents?.length ? parsed.calendarEvents : defaultCalendarTemplates(parsed.info?.weddingDate),
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

  if (typeof window !== 'undefined') {
    fetch('/api/anggaran', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'item', id: itemId, categoryId, ...updates }),
    }).catch(console.error);
  }
}

export function addBudgetItem(categoryId: string) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`;
  const newItem: BudgetItem = {
    id,
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

  if (typeof window !== 'undefined') {
    fetch('/api/anggaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'item',
        id,
        categoryId,
        name: newItem.name,
        quantity: newItem.quantity,
        unit: newItem.unit,
        unitPrice: newItem.unitPrice,
        vendorName: newItem.vendorName,
        notes: newItem.notes,
      }),
    }).catch(console.error);
  }

  return newItem.id;
}

export function deleteBudgetItem(categoryId: string, itemId: string) {
  wedding.update((s) => ({
    ...s,
    budgetCategories: s.budgetCategories.map((cat) =>
      cat.id === categoryId ? { ...cat, items: cat.items.filter((i) => i.id !== itemId) } : cat
    ),
  }));

  if (typeof window !== 'undefined') {
    fetch(`/api/anggaran?type=item&id=${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
    }).catch(console.error);
  }
}

export function addPayment(categoryId: string, itemId: string, payment: Omit<Payment, 'id'>) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`;
  const newPayment: Payment = { id, ...payment };
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

  if (typeof window !== 'undefined') {
    fetch('/api/anggaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'payment',
        id,
        budgetItemId: itemId,
        amount: newPayment.amount,
        paymentDate: newPayment.dueDate || new Date().toISOString().slice(0, 10),
        paymentType: newPayment.type,
        notes: newPayment.notes,
      }),
    }).catch(console.error);
  }
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
              const newPaymentId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`;
              const newPayment: Payment = {
                id: newPaymentId,
                type: 'lunas',
                amount: remaining,
                dueDate: '',
                paidAt: new Date().toISOString().slice(0, 10),
                notes: 'Ditandai lunas',
              };

              if (typeof window !== 'undefined') {
                fetch('/api/anggaran', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'payment',
                    id: newPaymentId,
                    budgetItemId: itemId,
                    amount: newPayment.amount,
                    paymentDate: newPayment.paidAt,
                    paymentType: newPayment.type,
                    notes: newPayment.notes,
                  }),
                }).catch(console.error);
              }

              return { ...item, payments: [...item.payments, newPayment] };
            }),
          }
        : cat
    ),
  }));
}

export function addBudgetCategory(name: string, icon: string = '📦', color: string = '#C9847A') {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cat-${Date.now()}`;
  const newCat: BudgetCategory = {
    id,
    name,
    icon,
    color,
    items: [],
  };
  wedding.update((s) => ({
    ...s,
    budgetCategories: [...s.budgetCategories, newCat],
  }));

  if (typeof window !== 'undefined') {
    fetch('/api/anggaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'category',
        id,
        name,
        icon,
        color,
      }),
    }).catch(console.error);
  }

  return newCat.id;
}

export function deleteBudgetCategory(categoryId: string) {
  wedding.update((s) => ({
    ...s,
    budgetCategories: s.budgetCategories.filter((c) => c.id !== categoryId),
  }));

  if (typeof window !== 'undefined') {
    fetch(`/api/anggaran?type=category&id=${encodeURIComponent(categoryId)}`, {
      method: 'DELETE',
    }).catch(console.error);
  }
}

export async function addSavingsEntry(entry: Omit<SavingsEntry, 'id'>) {
  const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sav-${Date.now()}`;
  const newEntry: SavingsEntry = { id: tempId, ...entry };
  wedding.update((s) => ({ ...s, savingsEntries: [newEntry, ...s.savingsEntries] }));

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/tabungan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_entry',
          sourceId: entry.sourceId,
          amount: entry.amount,
          entryDate: entry.entryDate,
          notes: entry.notes,
        }),
      });
      const data = await res.json();
      if (data.success && data.entry) {
        wedding.update((s) => ({
          ...s,
          savingsEntries: s.savingsEntries.map((e) => (e.id === tempId ? data.entry : e)),
        }));
        return data.entry;
      }
    } catch (err) {
      console.error('Error saving savings entry to DB:', err);
    }
  }
  return newEntry;
}

export function deleteSavingsEntry(entryId: string) {
  wedding.update((s) => ({
    ...s,
    savingsEntries: s.savingsEntries.filter((e) => e.id !== entryId),
  }));

  if (typeof window !== 'undefined') {
    fetch(`/api/tabungan?type=entry&id=${encodeURIComponent(entryId)}`, {
      method: 'DELETE',
    }).catch(console.error);
  }
}

export function addGuest(guest: Omit<Guest, 'id' | 'rsvpToken' | 'rsvpStatus' | 'guestCount' | 'rsvpMessage' | 'rsvpRespondedAt'> & {
  guestCount?: number;
  rsvpStatus?: 'pending' | 'hadir' | 'tidak_hadir';
  rsvpMessage?: string;
  phone?: string;
  email?: string;
  category?: string;
}) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `guest-${Date.now()}`;
  const rsvpToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36);
  const newGuest: Guest = {
    id,
    rsvpToken,
    rsvpStatus: guest.rsvpStatus || 'pending',
    guestCount: guest.guestCount !== undefined ? Number(guest.guestCount) : 1,
    rsvpMessage: guest.rsvpMessage || '',
    rsvpRespondedAt: null,
    name: guest.name.trim(),
    phone: guest.phone || '',
    email: guest.email || '',
    category: guest.category || 'teman',
  };
  wedding.update((s) => ({ ...s, guests: [newGuest, ...s.guests] }));

  if (typeof window !== 'undefined') {
    fetch('/api/tamu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGuest),
    }).catch(console.error);
  }
  return newGuest;
}

export function updateGuest(id: string, updates: Partial<Omit<Guest, 'id' | 'rsvpToken'>>) {
  wedding.update((s) => ({
    ...s,
    guests: s.guests.map((g) => (g.id === id ? { ...g, ...updates } : g)),
  }));

  if (typeof window !== 'undefined') {
    fetch('/api/tamu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    }).catch(console.error);
  }
}

export function deleteGuest(id: string) {
  wedding.update((s) => ({ ...s, guests: s.guests.filter((g) => g.id !== id) }));

  if (typeof window !== 'undefined') {
    fetch(`/api/tamu?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(console.error);
  }
}

export function batchDeleteGuests(ids: string[]) {
  if (!ids || ids.length === 0) return;
  wedding.update((s) => ({ ...s, guests: s.guests.filter((g) => !ids.includes(g.id)) }));

  if (typeof window !== 'undefined') {
    fetch('/api/tamu', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }).catch(console.error);
  }
}

export function batchAddGuests(guestsList: Array<{ name: string; phone?: string; category?: string; guestCount?: number }>) {
  if (!guestsList || guestsList.length === 0) return [];
  const created: Guest[] = guestsList.map((g) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `guest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const rsvpToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36);
    return {
      id,
      name: g.name.trim(),
      phone: g.phone || '',
      email: '',
      category: g.category || 'teman',
      rsvpToken,
      rsvpStatus: 'pending' as const,
      guestCount: g.guestCount ? Number(g.guestCount) : 1,
      rsvpMessage: '',
      rsvpRespondedAt: null,
    };
  });

  wedding.update((s) => ({ ...s, guests: [...created, ...s.guests] }));

  if (typeof window !== 'undefined') {
    fetch('/api/tamu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guests: created }),
    }).catch(console.error);
  }
  return created;
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

// ---- Vendor Actions ----
export function addVendor(vendor: Omit<VendorItem, 'id'>) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ven-${Date.now()}`;
  const newVendor: VendorItem = {
    id,
    ...vendor,
  };
  wedding.update((s) => ({ ...s, vendors: [newVendor, ...s.vendors] }));

  if (typeof window !== 'undefined') {
    fetch('/api/vendor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVendor),
    }).catch(console.error);
  }

  return newVendor;
}

export function updateVendor(id: string, updates: Partial<Omit<VendorItem, 'id'>>) {
  wedding.update((s) => ({
    ...s,
    vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...updates } : v)),
  }));

  if (typeof window !== 'undefined') {
    fetch('/api/vendor', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    }).catch(console.error);
  }
}

export function deleteVendor(id: string, name?: string) {
  wedding.update((s) => ({
    ...s,
    vendors: s.vendors.filter((v) => v.id !== id),
  }));

  if (typeof window !== 'undefined') {
    const url = name
      ? `/api/vendor?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`
      : `/api/vendor?id=${encodeURIComponent(id)}`;
    fetch(url, {
      method: 'DELETE',
    }).catch(console.error);
  }
}

export function resetVendorsToDefault() {
  if (typeof window !== 'undefined') {
    fetch('/api/vendor?action=reset', { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.vendors) {
          wedding.update((s) => ({ ...s, vendors: data.vendors }));
        }
      })
      .catch(console.error);
  }
  wedding.update((s) => ({ ...s, vendors: defaultVendorTemplates }));
}

// ---- Rundown Actions ----
export function addRundownItem(item: Omit<RundownItem, 'id' | 'order'>) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rd-${Date.now()}`;
  let newItem: RundownItem;
  wedding.update((s) => {
    const nextOrder = s.rundowns.length + 1;
    newItem = {
      id,
      order: nextOrder,
      ...item,
    };
    return { ...s, rundowns: [...s.rundowns, newItem] };
  });
  return newItem!;
}

export function updateRundownItem(id: string, updates: Partial<Omit<RundownItem, 'id'>>) {
  wedding.update((s) => ({
    ...s,
    rundowns: s.rundowns.map((r) => (r.id === id ? { ...r, ...updates } : r)),
  }));
}

export function deleteRundownItem(id: string) {
  wedding.update((s) => ({
    ...s,
    rundowns: s.rundowns.filter((r) => r.id !== id),
  }));
}

export function reorderRundownItems(newItems: RundownItem[]) {
  wedding.update((s) => ({
    ...s,
    rundowns: newItems.map((item, idx) => ({ ...item, order: idx + 1 })),
  }));
}

export function resetRundownsToDefault() {
  wedding.update((s) => ({ ...s, rundowns: defaultRundownTemplates }));
}

// ---- Calendar Event Actions ----
export function addCalendarEvent(event: Omit<CalendarEventItem, 'id' | 'completed'>) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ev-${Date.now()}`;
  const newEvent: CalendarEventItem = {
    id,
    completed: false,
    ...event,
  };
  wedding.update((s) => ({
    ...s,
    calendarEvents: [...s.calendarEvents, newEvent].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
  }));
  return newEvent;
}

export function updateCalendarEvent(id: string, updates: Partial<Omit<CalendarEventItem, 'id'>>) {
  wedding.update((s) => ({
    ...s,
    calendarEvents: s.calendarEvents
      .map((e) => (e.id === id ? { ...e, ...updates } : e))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
  }));
}

export function toggleCalendarEvent(id: string) {
  wedding.update((s) => ({
    ...s,
    calendarEvents: s.calendarEvents.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)),
  }));
}

export function deleteCalendarEvent(id: string) {
  wedding.update((s) => ({
    ...s,
    calendarEvents: s.calendarEvents.filter((e) => e.id !== id),
  }));
}

export function resetCalendarEventsToDefault(weddingDate?: string) {
  wedding.update((s) => ({
    ...s,
    calendarEvents: defaultCalendarTemplates(weddingDate || s.info.weddingDate),
  }));
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
    budgetCategories: dbData.budgetCategories !== undefined ? dbData.budgetCategories : s.budgetCategories,
    fundingSources: dbData.fundingSources !== undefined ? dbData.fundingSources : s.fundingSources,
    savingsEntries: dbData.savingsEntries !== undefined ? dbData.savingsEntries : s.savingsEntries,
    checklist: dbData.checklist !== undefined ? dbData.checklist : s.checklist,
    guests: dbData.guests !== undefined ? dbData.guests : s.guests,
    vendors: dbData.vendors !== undefined ? dbData.vendors : s.vendors,
    rundowns: dbData.rundowns !== undefined ? dbData.rundowns : s.rundowns,
    calendarEvents: dbData.calendarEvents !== undefined ? dbData.calendarEvents : s.calendarEvents,
    documents: dbData.documents?.length ? dbData.documents : s.documents?.length ? s.documents : defaultDocumentTemplates,
    invitation: dbData.invitation?.config
      ? { ...createDefaultInvitation(w), ...dbData.invitation.config }
      : s.invitation,
    wizardCompleted: Boolean(w.wizardCompleted || s.wizardCompleted),
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

export const vendorSummary = derived(wedding, ($w) => {
  const vendors = $w.vendors || [];
  const total = vendors.length;
  const deal = vendors.filter((v) => v.status === 'deal' || v.status === 'lunas' || v.status === 'selesai').length;
  const diskusi = vendors.filter((v) => v.status === 'diskusi').length;
  const riset = vendors.filter((v) => v.status === 'riset').length;
  const totalEstimasi = vendors.reduce((acc, v) => acc + (Number(v.estimatedCost) || 0), 0);
  const totalAktual = vendors.reduce((acc, v) => acc + (Number(v.actualCost) || 0), 0);

  return { total, deal, diskusi, riset, totalEstimasi, totalAktual };
});

export const calendarSummary = derived(wedding, ($w) => {
  const events = $w.calendarEvents || [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const total = events.length;
  const completed = events.filter((e) => e.completed).length;
  const upcoming = events.filter((e) => !e.completed && e.date >= todayStr).length;
  const overdue = events.filter((e) => !e.completed && e.date < todayStr).length;

  return { total, completed, upcoming, overdue };
});

export const rundownSummary = derived(wedding, ($w) => {
  const items = $w.rundowns || [];
  const total = items.length;
  const sessions = [...new Set(items.map((i) => i.session))];

  return { total, sessions };
});

// ---- Document Actions ----
export function toggleDocument(id: string) {
  let updatedDoc: DocumentItem | undefined;
  wedding.update((s) => {
    const nextDocs = s.documents.map((d) => {
      if (d.id === id) {
        updatedDoc = { ...d, completed: !d.completed };
        return updatedDoc;
      }
      return d;
    });
    return { ...s, documents: nextDocs };
  });

  if (typeof window !== 'undefined' && updatedDoc) {
    fetch('/api/dokumen', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: updatedDoc.id, completed: updatedDoc.completed }),
    }).catch(console.error);
  }
}

export function addDocument(doc: Omit<DocumentItem, 'id'>) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `doc-${Date.now()}`;
  const newDoc: DocumentItem = {
    id,
    ...doc,
  };
  wedding.update((s) => ({ ...s, documents: [...s.documents, newDoc] }));

  if (typeof window !== 'undefined') {
    fetch('/api/dokumen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDoc),
    }).catch(console.error);
  }
  return newDoc;
}

export function updateDocument(id: string, updates: Partial<Omit<DocumentItem, 'id'>>) {
  wedding.update((s) => ({
    ...s,
    documents: s.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)),
  }));

  if (typeof window !== 'undefined') {
    fetch('/api/dokumen', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    }).catch(console.error);
  }
}

export function deleteDocument(id: string) {
  wedding.update((s) => ({
    ...s,
    documents: s.documents.filter((d) => d.id !== id),
  }));

  if (typeof window !== 'undefined') {
    fetch(`/api/dokumen?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(console.error);
  }
}

export function resetDocumentsToDefault() {
  wedding.update((s) => ({ ...s, documents: defaultDocumentTemplates }));

  if (typeof window !== 'undefined') {
    fetch('/api/dokumen?reset=true', { method: 'DELETE' })
      .then(() => {
        fetch('/api/dokumen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: defaultDocumentTemplates }),
        }).catch(console.error);
      })
      .catch(console.error);
  }
}

export const documentSummary = derived(wedding, ($w) => {
  const docs = $w.documents || [];
  const total = docs.length;
  const completed = docs.filter((d) => d.completed).length;

  const wanitaDocs = docs.filter((d) => d.forParty === 'wanita');
  const wanitaTotal = wanitaDocs.length;
  const wanitaCompleted = wanitaDocs.filter((d) => d.completed).length;

  const priaDocs = docs.filter((d) => d.forParty === 'pria');
  const priaTotal = priaDocs.length;
  const priaCompleted = priaDocs.filter((d) => d.completed).length;

  const bersamaDocs = docs.filter((d) => d.forParty === 'bersama');
  const bersamaTotal = bersamaDocs.length;
  const bersamaCompleted = bersamaDocs.filter((d) => d.completed).length;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const wanitaPercent = wanitaTotal > 0 ? Math.round((wanitaCompleted / wanitaTotal) * 100) : 0;
  const priaPercent = priaTotal > 0 ? Math.round((priaCompleted / priaTotal) * 100) : 0;

  return {
    total,
    completed,
    remaining: total - completed,
    percent,
    wanitaTotal,
    wanitaCompleted,
    wanitaPercent,
    priaTotal,
    priaCompleted,
    priaPercent,
    bersamaTotal,
    bersamaCompleted,
  };
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
