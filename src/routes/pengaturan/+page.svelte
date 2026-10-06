<script lang="ts">
  import { wedding, resetWedding } from '#lib/stores/wedding';
  import { formatDate, formatRupiah } from '#lib/utils/format';
  import { exportWeddingToExcel, exportBudgetToExcel, exportGuestsToExcel } from '#lib/utils/exportExcel';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let showReset = $state(false);
  let resetConfirmText = $state('');

  function confirmReset() {
    if (resetConfirmText === 'HAPUS') {
      resetWedding();
      goto('/');
    }
  }

  function formatNum(v: number) { return Math.round(v).toLocaleString('id-ID'); }
  function parseNum(s: string) { return parseInt(s.replace(/\D/g, ''), 10) || 0; }

  let info = $state({ ...$wedding.info });
  let saveInfoSuccess = $state(false);
  let isSavingInfo = $state(false);

  async function saveInfo() {
    isSavingInfo = true;
    wedding.update(s => ({ ...s, info: { ...info } }));

    try {
      const formData = new FormData();
      formData.append('brideName', info.brideName);
      formData.append('groomName', info.groomName);
      formData.append('weddingDate', info.weddingDate || '');
      formData.append('venueType', info.venueType);
      formData.append('style', info.style);
      formData.append('guestCount', info.guestCount.toString());
      formData.append('totalBudget', info.totalBudget.toString());

      await fetch('?/updateInfo', {
        method: 'POST',
        body: formData,
      });
      saveInfoSuccess = true;
      setTimeout(() => { saveInfoSuccess = false; }, 3500);
    } catch (err) {
      console.warn('Sync database error:', err);
    } finally {
      isSavingInfo = false;
    }
  }

  let saveFinancialSuccess = $state(false);
  let isSavingFinancial = $state(false);

  async function saveFinancial() {
    isSavingFinancial = true;
    try {
      const formData = new FormData();
      formData.append('monthlySavingsTarget', $wedding.monthlySavingsTarget.toString());

      await fetch('?/updateFinancial', {
        method: 'POST',
        body: formData,
      });
      saveFinancialSuccess = true;
      setTimeout(() => { saveFinancialSuccess = false; }, 3500);
    } catch (err) {
      console.warn('Sync financial error:', err);
    } finally {
      isSavingFinancial = false;
    }
  }

  // Backup & Restore Hub
  let restoreSuccessMessage = $state('');
  let restoreErrorMessage = $state('');

  function backupWeddingData() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify($wedding, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    const dateStr = new Date().toISOString().slice(0, 10);
    const bride = $wedding.info.brideName ? `-${$wedding.info.brideName.toLowerCase().replace(/\s+/g, '_')}` : '';
    a.download = `nikahku-cadangan${bride}-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function handleRestoreFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        if (!json || typeof json !== 'object' || !json.info) {
          throw new Error('Format file tidak sesuai. Pastikan memilih file cadangan Nikahku (.json).');
        }
        if (confirm('Pulihkan data dari cadangan ini? Data rencana saat ini akan digantikan dengan data dari file cadangan.')) {
          wedding.set(json);
          info = { ...json.info };
          restoreSuccessMessage = '✓ Data rencana pernikahan berhasil dipulihkan dari file cadangan!';
          restoreErrorMessage = '';
          setTimeout(() => { restoreSuccessMessage = ''; }, 4500);
        }
      } catch (err: any) {
        restoreErrorMessage = err.message || 'Gagal membaca atau memulihkan file cadangan.';
        restoreSuccessMessage = '';
      } finally {
        input.value = '';
      }
    };
    reader.readAsText(file);
  }
</script>

<svelte:head>
  <title>Pengaturan — Nikahku</title>
</svelte:head>

<div class="page-container">
  <div class="page-header">
    <div class="container">
      <h1 class="page-title-with-icon">
        <span class="page-title-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </span>
        Pengaturan
      </h1>
      <p class="text-muted text-sm mt-1">Kelola data pernikahan, profil akun, dan ekspor laporan</p>
    </div>
  </div>

  <div class="container mt-6">
    <div class="settings-grid">
      <!-- ============================================== -->
      <!-- KOLOM KIRI: PERENCANAAN & KEUANGAN             -->
      <!-- ============================================== -->
      <div class="settings-col">
        <!-- Wedding Info Card -->
        <div class="card mb-6 animate-fade-in">
          <div class="card-header-clean">
            <h3 class="card-title-with-icon">
              <span class="card-title-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5"></circle><circle cx="16" cy="16" r="5"></circle></svg>
              </span>
              Informasi Pernikahan
            </h3>
          </div>

          <div class="grid-2 mb-4">
            <div class="form-group">
              <label class="form-label" for="bride">Nama Mempelai Wanita</label>
              <input id="bride" type="text" class="form-input" bind:value={info.brideName} placeholder="Contoh: Sinta" />
            </div>
            <div class="form-group">
              <label class="form-label" for="groom">Nama Mempelai Pria</label>
              <input id="groom" type="text" class="form-input" bind:value={info.groomName} placeholder="Contoh: Rama" />
            </div>
          </div>

          <div class="form-group mb-4">
            <label class="form-label" for="wdate">Tanggal Pernikahan</label>
            <input id="wdate" type="date" class="form-input" bind:value={info.weddingDate} />
          </div>

          <div class="grid-2 mb-4">
            <div class="form-group">
              <label class="form-label" for="venue">Lokasi / Tempat</label>
              <select id="venue" class="form-select" bind:value={info.venueType}>
                <option value="gedung">Gedung / Ballroom</option>
                <option value="rumah">Di Rumah</option>
                <option value="kombinasi">Kombinasi</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="style">Gaya Acara</label>
              <select id="style" class="form-select" bind:value={info.style}>
                <option value="sederhana">Sederhana</option>
                <option value="menengah">Menengah</option>
                <option value="mewah">Mewah</option>
              </select>
            </div>
          </div>

          <div class="grid-2 mb-6">
            <div class="form-group">
              <label class="form-label" for="guests">Perkiraan Undangan Tamu</label>
              <input id="guests" type="number" class="form-input" bind:value={info.guestCount} min="10" />
            </div>
            <div class="form-group">
              <label class="form-label" for="tbudget">Target Total Anggaran</label>
              <div class="currency-input-wrapper">
                <span class="currency-prefix">Rp</span>
                <input id="tbudget" type="text" class="form-input"
                  value={formatNum(info.totalBudget)}
                  oninput={(e) => info.totalBudget = parseNum((e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button class="btn btn-primary" onclick={saveInfo} disabled={isSavingInfo}>
              {#if isSavingInfo}
                <span>Menyimpan...</span>
              {:else}
                <span>Simpan Perubahan</span>
              {/if}
            </button>
            {#if saveInfoSuccess}
              <span class="save-toast-inline">✓ Berhasil disimpan</span>
            {/if}
          </div>
        </div>

        <!-- Target Finansial & Tabungan Card (Dipindahkan ke kiri agar seimbang) -->
        <div class="card mb-6 animate-fade-in delay-100">
          <div class="card-header-clean">
            <h3 class="card-title-with-icon">
              <span class="card-title-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </span>
              Estimasi Finansial &amp; Amplop
            </h3>
            <p class="text-muted text-xs mt-1">Konfigurasi proyeksi uang amplop dan komitmen tabungan bulanan.</p>
          </div>

          <div class="grid-2 mb-6">
            <div class="form-group">
              <label class="form-label" for="envPer">Rata-rata Amplop / Tamu</label>
              <div class="currency-input-wrapper">
                <span class="currency-prefix">Rp</span>
                <input id="envPer" type="text" class="form-input"
                  value={formatNum($wedding.envelopeEstimate.perGuest)}
                  oninput={(e) => wedding.update(s => ({ ...s, envelopeEstimate: { ...s.envelopeEstimate, perGuest: parseNum((e.target as HTMLInputElement).value) } }))}
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="monthSav">Target Tabungan / Bulan</label>
              <div class="currency-input-wrapper">
                <span class="currency-prefix">Rp</span>
                <input id="monthSav" type="text" class="form-input"
                  value={formatNum($wedding.monthlySavingsTarget)}
                  oninput={(e) => wedding.update(s => ({ ...s, monthlySavingsTarget: parseNum((e.target as HTMLInputElement).value) }))}
                />
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button class="btn btn-primary" onclick={saveFinancial} disabled={isSavingFinancial}>
              {#if isSavingFinancial}
                <span>Menyimpan...</span>
              {:else}
                <span>Simpan Target Finansial</span>
              {/if}
            </button>
            {#if saveFinancialSuccess}
              <span class="save-toast-inline">✓ Berhasil disimpan</span>
            {/if}
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- KOLOM KANAN: AKUN, CLOUD DATABASE & DATA       -->
      <!-- ============================================== -->
      <div class="settings-col">
        <!-- Akun & Status Cloud Database Card -->
        <div class="card mb-6 animate-fade-in delay-200">
          <div class="card-header-clean">
            <h3 class="card-title-with-icon">
              <span class="card-title-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              Akun &amp; Cloud Database
            </h3>
          </div>

          {#if data?.user}
            <div class="account-card-box">
              <div class="account-avatar">
                {data.user.name.charAt(0).toUpperCase()}
              </div>
              <div class="account-details">
                <div class="account-name">{data.user.name}</div>
                <div class="account-email">{data.user.email}</div>
                <div class="cloud-badge">
                  <span class="cloud-dot"></span>
                  <span>Database PostgreSQL Terhubung</span>
                </div>
              </div>
            </div>
            <p class="text-muted text-xs mt-3">
              Data rencana pernikahan Anda tersinkronisasi aman di cloud database dan dapat diakses dari perangkat mana saja.
            </p>
            <div class="mt-4 pt-3 border-t flex justify-end">
              <a href="/keluar" class="btn btn-secondary btn-sm flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Keluar dari Akun
              </a>
            </div>
          {:else}
            <div class="account-guest-box">
              <p class="text-sm font-semibold mb-1">Anda belum masuk ke akun</p>
              <p class="text-muted text-xs mb-4">Masuk atau daftarkan akun baru agar seluruh rencana pernikahan Anda tersimpan di database cloud permanen.</p>
              <div class="flex gap-2">
                <a href="/masuk" class="btn btn-secondary btn-sm">Masuk</a>
                <a href="/daftar" class="btn btn-primary btn-sm">Daftar Akun Baru</a>
              </div>
            </div>
          {/if}
        </div>

        <!-- Pusat Data & Cadangan Card (Lebih Lapang & Rapi) -->
        <div class="card mb-6 animate-fade-in delay-300">
          <div class="hub-header mb-3">
            <div>
              <h3 class="card-title-with-icon m-0">
                <span class="card-title-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                </span>
                Pusat Data &amp; Cadangan
              </h3>
              <p class="text-muted text-xs mt-1">
                Ekspor dokumen laporan atau cadangkan file rencana pernikahan.
              </p>
            </div>
            <div class="hub-status-pill">
              <span class="hub-pulse-dot"></span>
              <span>Siap Diunduh</span>
            </div>
          </div>

          <!-- Alert Messages -->
          {#if restoreSuccessMessage}
            <div class="alert alert-success text-xs mb-3">
              {restoreSuccessMessage}
            </div>
          {/if}
          {#if restoreErrorMessage}
            <div class="alert alert-danger text-xs mb-3">
              {restoreErrorMessage}
            </div>
          {/if}

          <!-- Section 1: Ekspor Spreadsheet (.xls) -->
          <div class="hub-block mb-4">
            <div class="hub-block-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span>Ekspor Laporan Spreadsheet (.xls)</span>
            </div>

            <!-- Workbook Hero Button (Lebih lapang tanpa teks terpotong) -->
            <button
              type="button"
              class="hub-hero-btn"
              onclick={() => exportWeddingToExcel($wedding)}
              title="Unduh seluruh data pernikahan dalam 1 file Excel multi-sheet"
            >
              <div class="hub-hero-left">
                <div class="hub-file-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                </div>
                <div class="hub-hero-info">
                  <span class="hub-hero-title">Workbook Lengkap (3 Sheet)</span>
                  <span class="hub-hero-desc">Anggaran, Daftar Tamu &amp; Checklist</span>
                </div>
              </div>
              <div class="hub-action-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Unduh .XLS</span>
              </div>
            </button>

            <!-- Partial Sub Buttons -->
            <div class="hub-sub-grid mt-2">
              <button
                type="button"
                class="hub-sub-btn"
                onclick={() => exportBudgetToExcel($wedding)}
                title="Unduh sheet anggaran saja (.xls)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                <span>Khusus Anggaran</span>
              </button>

              <button
                type="button"
                class="hub-sub-btn"
                onclick={() => exportGuestsToExcel($wedding)}
                title="Unduh sheet daftar tamu &amp; RSVP saja (.xls)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                <span>Khusus Tamu</span>
              </button>
            </div>
          </div>

          <!-- Section 2: Backup & Restore Data (JSON) -->
          <div class="hub-block">
            <div class="hub-block-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <span>Cadangan Antar-Perangkat (.json)</span>
            </div>

            <div class="hub-sync-grid">
              <!-- Backup Button -->
              <button
                type="button"
                class="hub-sync-card"
                onclick={backupWeddingData}
                title="Simpan data ke file backup JSON"
              >
                <div class="hub-sync-icon icon-export">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <div class="hub-sync-text">
                  <div class="hub-sync-title">Cadangkan File</div>
                  <div class="hub-sync-sub">Unduh file .json</div>
                </div>
              </button>

              <!-- Restore Button (Triggers Hidden Input) -->
              <label class="hub-sync-card hub-upload-label" title="Pulihkan data dari file backup JSON">
                <input
                  type="file"
                  accept=".json"
                  class="hidden-file-input"
                  onchange={handleRestoreFile}
                />
                <div class="hub-sync-icon icon-import">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </div>
                <div class="hub-sync-text">
                  <div class="hub-sync-title">Pulihkan Data</div>
                  <div class="hub-sync-sub">Unggah file .json</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Zona Bahaya Card -->
        <div class="card danger-zone animate-fade-in delay-350">
          <h3 class="danger-title card-title-with-icon mb-2">
            <span class="card-title-icon danger-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </span>
            Zona Bahaya
          </h3>
          <p class="text-muted text-xs mb-4">
            Menghapus semua data rencana bersifat permanen dan tidak dapat dibatalkan.
          </p>
          {#if !showReset}
            <button class="btn btn-danger btn-sm" onclick={() => showReset = true}>
              <span class="inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Hapus Semua Data Rencana
              </span>
            </button>
          {:else}
            <div class="reset-confirm">
              <p class="text-xs text-danger font-semibold mb-2">
                Ketik <strong>HAPUS</strong> untuk mengonfirmasi penghapusan permanen:
              </p>
              <div class="flex gap-2">
                <input
                  type="text"
                  class="form-input flex-1"
                  placeholder="Ketik HAPUS"
                  bind:value={resetConfirmText}
                />
                <button
                  class="btn btn-danger btn-sm"
                  disabled={resetConfirmText !== 'HAPUS'}
                  onclick={confirmReset}
                >
                  Konfirmasi
                </button>
                <button
                  class="btn btn-secondary btn-sm"
                  onclick={() => { showReset = false; resetConfirmText = ''; }}
                >
                  Batal
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .page-container {
    padding-bottom: var(--space-12);
  }
  .page-header {
    background: white;
    border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-8) 0 var(--space-6);
  }

  /* Grid yang seimbang 2 kolom simetris */
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
    align-items: flex-start;
    max-width: 1120px;
    margin: 0 auto;
  }

  .settings-col {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .card-header-clean {
    margin-bottom: var(--space-4);
  }

  .save-toast-inline {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-success);
    animation: fadeIn 0.25s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-4px); }
    to { opacity: 1; transform: translateX(0); }
  }

  /* Akun & Database Box */
  .account-card-box {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-lg);
  }

  .account-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    color: white;
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .account-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .account-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
  }

  .account-email {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .cloud-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--color-success);
    margin-top: 2px;
  }

  .cloud-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-success);
  }

  .account-guest-box {
    padding: var(--space-4);
    background: var(--color-surface);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
  }

  /* Backup & Restore Hub Styles */
  .hub-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .hub-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: var(--radius-full);
    background: var(--color-success-bg, #E8F5E9);
    color: var(--color-success, #2E7D32);
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid rgba(46, 125, 50, 0.15);
  }

  .hub-pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--radius-full);
    background: var(--color-success, #2E7D32);
  }

  .hub-block {
    display: flex;
    flex-direction: column;
  }

  .hub-block-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-subtle);
    margin-bottom: var(--space-2);
  }

  /* Hero Card Button (Full-width & Spacious) */
  .hub-hero-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: 10px 14px;
    background: white;
    border: 1.5px solid rgba(201, 132, 122, 0.35);
    border-radius: var(--radius-md);
    cursor: pointer;
    text-align: left;
    transition: all var(--transition-fast);
    font-family: var(--font-body);
  }

  .hub-hero-btn:hover {
    border-color: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(201, 132, 122, 0.18);
  }

  .hub-hero-left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  .hub-file-icon {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .hub-hero-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .hub-hero-title {
    font-weight: 700;
    font-size: 13px;
    color: var(--color-text);
    white-space: nowrap;
  }

  .hub-hero-desc {
    font-size: 11px;
    color: var(--color-text-subtle);
    white-space: nowrap;
  }

  .hub-action-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    font-size: 11.5px;
    font-weight: 600;
    color: var(--color-accent);
    flex-shrink: 0;
  }

  /* Sub Grid */
  .hub-sub-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .hub-sub-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 10px;
    background: white;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-sm);
    font-size: 11.5px;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    font-family: var(--font-body);
    transition: all var(--transition-fast);
  }

  .hub-sub-btn:hover {
    border-color: var(--color-primary-light);
    color: var(--color-accent);
    background: #FAF7F5;
  }

  /* Sync & JSON Grid */
  .hub-sync-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .hub-sync-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    background: white;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
    font-family: var(--font-body);
  }

  .hub-sync-card:hover {
    border-color: var(--color-accent);
    background: #FAF7F5;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(139, 94, 82, 0.08);
  }

  .hub-upload-label {
    margin: 0;
    position: relative;
  }

  .hidden-file-input {
    display: none;
  }

  .hub-sync-icon {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .icon-export {
    background: rgba(201, 132, 122, 0.15);
    color: var(--color-accent);
  }

  .icon-import {
    background: rgba(106, 138, 184, 0.15);
    color: var(--color-info);
  }

  .hub-sync-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .hub-sync-title {
    font-weight: 700;
    font-size: 12px;
    color: var(--color-text);
    white-space: nowrap;
  }

  .hub-sync-sub {
    font-size: 10.5px;
    color: var(--color-text-subtle);
    white-space: nowrap;
  }

  /* Danger Zone */
  .danger-zone {
    border: 1px solid rgba(192, 86, 90, 0.25);
    background: #FFFDFD;
  }

  .danger-title {
    color: var(--color-danger);
  }

  .danger-icon {
    background: rgba(192, 86, 90, 0.12);
    color: var(--color-danger);
  }

  .reset-confirm {
    padding: var(--space-3);
    background: var(--color-danger-bg);
    border-radius: var(--radius-md);
  }

  @media (max-width: 900px) {
    .settings-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
