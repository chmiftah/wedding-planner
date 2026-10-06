export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(0)} jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  return `Rp ${amount}`;
}

export function parseRupiah(value: string): number {
  const clean = value.replace(/[^0-9]/g, '');
  return parseInt(clean, 10) || 0;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function monthsUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getPaymentStatus(item: { quantity: number; unitPrice: number; payments: Array<{ amount: number; paidAt: string | null }> }): 'belum' | 'dp' | 'lunas' {
  const total = item.quantity * item.unitPrice;
  const paid = item.payments.filter((p) => p.paidAt).reduce((a, p) => a + p.amount, 0);
  if (paid <= 0) return 'belum';
  if (paid >= total) return 'lunas';
  return 'dp';
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    keluarga_inti: 'Keluarga Inti',
    keluarga_jauh: 'Keluarga Jauh',
    teman: 'Teman',
    kolega: 'Kolega',
    lainnya: 'Lainnya',
  };
  return map[cat] || cat;
}

export function rsvpStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Belum Respons',
    hadir: 'Hadir',
    tidak_hadir: 'Tidak Hadir',
  };
  return map[status] || status;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}