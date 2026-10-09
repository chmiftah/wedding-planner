<script lang="ts">
  import { wedding, budgetSummary, savingsSummary, guestSummary, hydrateWeddingFromDb } from '#lib/stores/wedding';
  import { formatRupiah, formatRupiahShort, formatDate, daysUntil } from '#lib/utils/format';
  import { goto } from '$app/navigation';
  import CategoryIcon from '#lib/components/CategoryIcon.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  $effect(() => {
    if (data?.weddingData) {
      hydrateWeddingFromDb(data.weddingData);
    }
  });

  const days = $derived(daysUntil($wedding.info.weddingDate));
  const bs = $derived($budgetSummary);
  const ss = $derived($savingsSummary);
  const gs = $derived($guestSummary);

  const budgetProgress = $derived(bs.totalRencana > 0 ? Math.min(100, (bs.totalDibayar / bs.totalRencana) * 100) : 0);
  const savingsProgress = $derived(ss.target > 0 ? Math.min(100, (ss.totalTerkumpul / ss.target) * 100) : 0);

  function formatCoupleNames() {
    const { brideName, groomName } = $wedding.info;
    if (brideName && groomName) return `${brideName} & ${groomName}`;
    if (brideName) return brideName;
    return 'Kamu & Pasangan';
  }

  // Upcoming payments (items with unpaid payments due soon)
  const upcomingPayments = $derived(() => {
    const items: Array<{ name: string; amount: number; dueDate: string; categoryName: string }> = [];
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(today.getDate() + 30);

    for (const cat of $wedding.budgetCategories) {
      for (const item of cat.items) {
        for (const p of item.payments) {
          if (!p.paidAt && p.dueDate) {
            const due = new Date(p.dueDate);
            if (due <= thirtyDays) {
              items.push({ name: item.name, amount: p.amount, dueDate: p.dueDate, categoryName: cat.name });
            }
          }
        }
      }
    }
    return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 3);
  });

  // Incomplete checklist
  const pendingTasks = $derived($wedding.checklist.filter(t => !t.completed).length);
  const completedTasks = $derived($wedding.checklist.filter(t => t.completed).length);
  const checklistProgress = $derived(
    $wedding.checklist.length > 0
      ? Math.round((completedTasks / $wedding.checklist.length) * 100)
      : 0
  );
</script>

<svelte:head>
  <title>Dashboard — Nikahku</title>
</svelte:head>

<div class="dashboard">
  <!-- Page Hero -->
  <div class="page-hero">
    <div class="container">
      <div class="page-hero-inner">
        <div class="page-hero-text animate-fade-in">
          <div class="page-eyebrow-pill">
            <span class="eyebrow-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5"></circle><circle cx="16" cy="16" r="5"></circle></svg></span>
            <span class="eyebrow-text">Pernikahan Impian</span>
          </div>
          <h1 class="page-title">{formatCoupleNames()}</h1>
          {#if $wedding.info.weddingDate}
            <p class="page-date-row">
              <span class="date-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
              <span class="date-text">{formatDate($wedding.info.weddingDate)}</span>
            </p>
          {:else}
            <p class="page-date-row text-subtle">
              {$wedding.info.dateNote || 'Tanggal pernikahan belum ditentukan'}
            </p>
          {/if}
        </div>

        {#if days !== null && days > 0}
          <div class="countdown-widget animate-fade-in">
            <div class="countdown-circle">
              <span class="countdown-big-num">{days}</span>
              <span class="countdown-unit-label">HARI</span>
            </div>
            <div class="countdown-info">
              <span class="countdown-headline">Menuju Akad & Resepsi</span>
              <span class="countdown-subline">
                {$wedding.info.weddingDate ? formatDate($wedding.info.weddingDate) : 'Hari Bahagia'}
              </span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="container">
    {#if !data?.user}
      <div class="guest-save-banner mb-6 animate-slide-up">
        <div class="guest-banner-left">
          <div class="guest-banner-icon-box">
            <span class="guest-banner-icon">💍</span>
          </div>
          <div class="guest-banner-content">
            <div class="guest-banner-badge">
              <span class="pulse-dot"></span>
              Mode Tamu — Tersimpan Sementara
            </div>
            <h3 class="guest-banner-title">Amankan Rencana Pernikahan Anda</h3>
            <p class="guest-banner-desc">
              Rencana Anda saat ini hanya tersimpan di browser perangkat ini. Simpan ke akun gratis agar data aman tidak hilang dan dapat dibuka bersama pasangan dari smartphone/laptop lain!
            </p>
          </div>
        </div>
        <div class="guest-banner-actions">
          <a href="/daftar" class="btn btn-primary btn-save-account">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Simpan ke Akun Gratis</span>
          </a>
          <a href="/masuk" class="btn-guest-login">
            Sudah Punya Akun? Masuk
          </a>
        </div>
      </div>
    {:else if !data?.weddingData || !data?.weddingData?.wedding?.wizardCompleted}
      <div class="wizard-prompt-banner mb-6 animate-slide-up">
        <div class="wizard-prompt-text">
          <span class="prompt-icon">✨</span>
          <div>
            <h4 class="prompt-title">Rencanakan Pernikahan Impian Anda</h4>
            <p class="prompt-desc">Gunakan panduan Wizard untuk mengisi detail acara, anggaran, dan kalkulasi otomatis.</p>
          </div>
        </div>
        <a href="/wizard" class="btn btn-primary btn-sm">
          <span>Mulai Wizard</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
      </div>
    {/if}

    <!-- Summary Cards -->
    <div class="stats-grid animate-slide-up">
      <div class="stat-card stat-card-primary">
        <div class="stat-label">Target Anggaran</div>
        <div class="stat-value">{formatRupiahShort($wedding.info.totalBudget)}</div>
        <div class="stat-sub">Total rencana semua kategori</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Sudah Dibayar</div>
        <div class="stat-value" style="color: var(--color-success)">{formatRupiahShort(bs.totalDibayar)}</div>
        <div class="stat-sub">dari {formatRupiahShort(bs.totalRencana)} total item</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Sisa Tagihan</div>
        <div class="stat-value" style="color: var(--color-warning)">{formatRupiahShort(bs.sisaTagihan)}</div>
        <div class="stat-sub">belum dibayar ke vendor</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Kekurangan Dana</div>
        <div class="stat-value" style="color: {ss.kekurangan > 0 ? 'var(--color-danger)' : 'var(--color-success)'}">
          {ss.kekurangan > 0 ? formatRupiahShort(ss.kekurangan) : 'Cukup ✓'}
        </div>
        <div class="stat-sub">
          {ss.kekurangan > 0 ? 'proyeksi kurang dari target' : 'tabungan sesuai target'}
        </div>
      </div>
    </div>

    <!-- Two Column -->
    <div class="dashboard-grid mt-6">
      <!-- Left Column -->
      <div class="dashboard-col-main">

        <!-- Budget Progress -->
        <div class="card animate-fade-in">
          <div class="card-header">
            <div>
              <h3 class="card-title card-title-with-icon">
              <span class="card-title-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>
              </span>
              Progress Anggaran
            </h3>
              <p class="text-subtle text-sm">{formatRupiah(bs.totalDibayar)} dari {formatRupiah(bs.totalRencana)}</p>
            </div>
            <a href="/anggaran" class="btn btn-secondary btn-sm">Lihat Detail</a>
          </div>

          <div class="progress-bar mt-4">
            <div class="progress-fill" style="width: {budgetProgress}%"></div>
          </div>
          <div class="flex justify-between mt-2">
            <span class="text-xs text-subtle">{Math.round(budgetProgress)}% dibayar</span>
            <span class="text-xs text-subtle">{formatRupiahShort(bs.sisaTagihan)} tersisa</span>
          </div>

          <!-- Categories mini -->
          {#if $wedding.budgetCategories.length > 0}
            <div class="divider"></div>
            <div class="category-list">
              {#each $wedding.budgetCategories.slice(0, 5) as cat}
                {@const catTotal = cat.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0)}
                {@const catPaid = cat.items.reduce((a, i) => a + i.payments.filter(p => p.paidAt).reduce((b, p) => b + p.amount, 0), 0)}
                {@const pct = catTotal > 0 ? Math.min(100, (catPaid / catTotal) * 100) : 0}
                <div class="cat-row">
                  <span class="cat-icon"><CategoryIcon icon={cat.icon} size={16} /></span>
                  <div class="cat-info flex-1">
                    <div class="flex justify-between mb-1">
                      <span class="text-sm font-medium">{cat.name}</span>
                      <span class="text-sm text-muted">{formatRupiahShort(catTotal)}</span>
                    </div>
                    <div class="progress-bar" style="height: 4px">
                      <div class="progress-fill" style="width: {pct}%; background: {cat.color}"></div>
                    </div>
                  </div>
                </div>
              {/each}
              {#if $wedding.budgetCategories.length > 5}
                <a href="/anggaran" class="text-sm text-muted text-center mt-2 block">
                  +{$wedding.budgetCategories.length - 5} kategori lainnya →
                </a>
              {/if}
            </div>
          {:else}
            <div class="empty-state">
              <p class="text-subtle text-sm">Belum ada kategori anggaran.</p>
              <a href="/anggaran" class="btn btn-primary btn-sm mt-3">Buat Anggaran</a>
            </div>
          {/if}
        </div>

        <!-- Tabungan Progress -->
        <div class="card animate-fade-in delay-100 mt-4">
          <div class="card-header">
            <div>
              <h3 class="card-title card-title-with-icon">
              <span class="card-title-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M3 10h18"></path><path d="M5 6l7-3 7 3"></path><path d="M4 10v11"></path><path d="M20 10v11"></path><circle cx="12" cy="15.5" r="1.5"></circle></svg>
              </span>
              Progress Tabungan
            </h3>
              <p class="text-subtle text-sm">{formatRupiah(ss.totalTerkumpul)} terkumpul</p>
            </div>
            <a href="/tabungan" class="btn btn-secondary btn-sm">Lihat Detail</a>
          </div>

          <div class="progress-bar mt-4">
            <div class="progress-fill" style="width: {savingsProgress}%"></div>
          </div>
          <div class="flex justify-between mt-2">
            <span class="text-xs text-subtle">{Math.round(savingsProgress)}% dari target</span>
            <span class="text-xs text-subtle">Target: {formatRupiahShort(ss.target)}</span>
          </div>

          {#if !ss.isOnTrack && ss.kekurangan > 0}
            <div class="alert alert-warning mt-4">
              <span style="color: var(--color-warning); display: inline-flex; align-items: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></span>
              <span class="text-sm">
                Dengan laju menabung sekarang, proyeksi kurang <strong>{formatRupiah(ss.kekurangan)}</strong> pada hari H.
                <a href="/tabungan" class="font-semibold"> Lihat proyeksi lengkap →</a>
              </span>
            </div>
          {:else if ss.isOnTrack && ss.target > 0}
            <div class="alert alert-success mt-4">
              <span style="color: var(--color-success); display: inline-flex; align-items: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></span>
              <span class="text-sm">Tabunganmu on-track! Proyeksi total {formatRupiah(ss.proyeksiTotal)} sudah melebihi target.</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Right Column -->
      <div class="dashboard-col-side">

        <!-- Tamu -->
        <div class="card animate-fade-in delay-200">
          <div class="card-header">
            <h3 class="card-title card-title-with-icon">
            <span class="card-title-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </span>
            Tamu Undangan
          </h3>
            <a href="/tamu" class="btn btn-secondary btn-sm">Kelola</a>
          </div>

          <div class="guest-stats">
            <div class="guest-stat">
              <span class="guest-stat-num" style="color: var(--color-success)">{gs.hadir}</span>
              <span class="guest-stat-label">Hadir</span>
            </div>
            <div class="guest-stat">
              <span class="guest-stat-num" style="color: var(--color-warning)">{gs.pending}</span>
              <span class="guest-stat-label">Pending</span>
            </div>
            <div class="guest-stat">
              <span class="guest-stat-num" style="color: var(--color-danger)">{gs.tidakHadir}</span>
              <span class="guest-stat-label">Tidak Hadir</span>
            </div>
          </div>

          <div class="progress-bar mt-3">
            <div class="progress-fill" style="width: {gs.total > 0 ? (gs.hadir / gs.total) * 100 : 0}%"></div>
          </div>
          <p class="text-xs text-subtle mt-2">
            {gs.hadir} dari {gs.total} tamu sudah konfirmasi hadir
          </p>

          {#if gs.total === 0}
            <div class="empty-state mt-3">
              <p class="text-subtle text-sm">Belum ada tamu ditambahkan.</p>
              <a href="/tamu" class="btn btn-primary btn-sm mt-2">Tambah Tamu</a>
            </div>
          {/if}
        </div>

        <!-- Checklist -->
        <div class="card animate-fade-in delay-300 mt-4">
          <div class="card-header">
            <h3 class="card-title card-title-with-icon">
            <span class="card-title-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            </span>
            Checklist Persiapan
          </h3>
            <a href="/checklist" class="btn btn-secondary btn-sm">Lihat</a>
          </div>

          {#if $wedding.checklist.length > 0}
            <div class="flex justify-between mb-3">
              <span class="text-sm text-muted">{completedTasks}/{$wedding.checklist.length} selesai</span>
              <span class="badge badge-{checklistProgress === 100 ? 'success' : 'neutral'}">{checklistProgress}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: {checklistProgress}%"></div>
            </div>
            <div class="task-preview mt-3">
              {#each $wedding.checklist.filter(t => !t.completed).slice(0, 3) as task}
                <div class="task-preview-item">
                  <span class="task-dot"></span>
                  <span class="text-sm">{task.text}</span>
                </div>
              {/each}
            </div>
          {:else}
            <div class="empty-state">
              <p class="text-subtle text-sm">Belum ada tugas di checklist.</p>
              <a href="/checklist" class="btn btn-primary btn-sm mt-2">Buat Tugas</a>
            </div>
          {/if}
        </div>

        <!-- Upcoming Payments -->
        {#if upcomingPayments().length > 0}
          <div class="card animate-fade-in delay-400 mt-4">
            <h3 class="card-title card-title-with-icon mb-3">
            <span class="card-title-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </span>
            Jatuh Tempo (30 hari)
          </h3>
            {#each upcomingPayments() as pay}
              <div class="upcoming-item">
                <div class="upcoming-info">
                  <span class="text-sm font-medium">{pay.name}</span>
                  <span class="text-xs text-subtle">{pay.categoryName}</span>
                </div>
                <div class="upcoming-amount">
                  <span class="text-sm font-semibold" style="color: var(--color-warning)">{formatRupiahShort(pay.amount)}</span>
                  <span class="text-xs text-subtle">{formatDate(pay.dueDate)}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard { padding-bottom: var(--space-8); }

  /* Page Hero */
  .page-hero {
    background: linear-gradient(145deg, #FFF4F1 0%, #FBF0EB 50%, #FFFFFF 100%);
    border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-8) 0 var(--space-6);
    margin-bottom: var(--space-6);
  }

  .page-hero-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);
  }

  .page-hero-text {
    flex: 1;
    min-width: 0;
  }

  .page-eyebrow-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: var(--radius-full);
    background: rgba(201, 132, 122, 0.12);
    border: 1px solid rgba(201, 132, 122, 0.22);
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-accent);
    margin-bottom: var(--space-3);
  }

  .eyebrow-icon { font-size: 0.95rem; }

  .page-title {
    font-family: var(--font-display);
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-2);
    text-transform: capitalize;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  .page-date-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: 500;
    margin: 0;
  }

  .date-icon { font-size: 1rem; }

  /* Countdown Widget */
  .countdown-widget {
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
    padding: var(--space-4) var(--space-5);
    display: flex;
    align-items: center;
    gap: var(--space-4);
    box-shadow: 0 4px 18px rgba(139, 94, 82, 0.08);
    flex-shrink: 0;
    border-left: 4px solid var(--color-primary);
  }

  .countdown-circle {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-xl);
    background: linear-gradient(135deg, rgba(201, 132, 122, 0.15), rgba(245, 230, 224, 0.6));
    border: 1.5px solid rgba(201, 132, 122, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .countdown-big-num {
    font-family: var(--font-numeric);
    font-variant-numeric: tabular-nums lining-nums;
    font-size: 1.75rem;
    font-weight: 800;
    line-height: 1;
    color: var(--color-accent);
    letter-spacing: -0.03em;
  }

  .countdown-unit-label {
    font-size: 9px;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: 0.08em;
    margin-top: 2px;
  }

  .countdown-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .countdown-headline {
    font-size: var(--font-size-sm);
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: -0.01em;
  }

  .countdown-subline {
    font-size: var(--font-size-xs);
    color: var(--color-text-subtle);
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
  }

  .stat-card-primary {
    background: linear-gradient(135deg, var(--color-primary-xlight), var(--color-secondary));
    border-color: var(--color-primary-light);
  }

  /* Dashboard Grid */
  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: var(--space-6);
    align-items: flex-start;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-2);
  }

  .card-title {
    font-size: var(--font-size-base);
    font-weight: 700;
    font-family: var(--font-display);
  }

  .category-list { display: flex; flex-direction: column; gap: var(--space-3); }

  .cat-row { display: flex; align-items: center; gap: var(--space-3); }
  .cat-icon { font-size: 1.25rem; flex-shrink: 0; }

  /* Guest Stats */
  .guest-stats { display: flex; gap: var(--space-4); margin-top: var(--space-2); }

  .guest-stat { flex: 1; text-align: center; }

  .guest-stat-num {
    display: block;
    font-family: var(--font-numeric);
    font-variant-numeric: tabular-nums lining-nums;
    font-feature-settings: "tnum" 1, "lnum" 1;
    font-size: var(--font-size-2xl);
    font-weight: 700;
    line-height: 1;
    margin-bottom: 4px;
  }

  .guest-stat-label { font-size: var(--font-size-xs); color: var(--color-text-subtle); font-weight: 500; }

  /* Task Preview */
  .task-preview { display: flex; flex-direction: column; gap: var(--space-2); }

  .task-preview-item { display: flex; align-items: center; gap: var(--space-3); }

  .task-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--color-primary);
    flex-shrink: 0;
  }

  /* Upcoming Payments */
  .upcoming-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--color-border-light);
  }

  .upcoming-item:last-child { border-bottom: none; }
  .upcoming-info { display: flex; flex-direction: column; gap: 2px; }
  .upcoming-amount { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }

  /* Guest Save Banner */
  .guest-save-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
    padding: var(--space-5) var(--space-6);
    background: linear-gradient(135deg, rgba(201, 132, 122, 0.16) 0%, rgba(212, 163, 115, 0.14) 50%, rgba(201, 132, 122, 0.09) 100%);
    border: 1.5px solid rgba(201, 132, 122, 0.35);
    border-radius: var(--radius-xl);
    box-shadow: 0 8px 24px rgba(139, 94, 82, 0.07);
    position: relative;
    overflow: hidden;
  }

  .guest-save-banner::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, var(--color-primary), var(--color-accent));
  }

  .guest-banner-left {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    flex: 1;
  }

  .guest-banner-icon-box {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(201, 132, 122, 0.25), rgba(212, 163, 115, 0.25));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(139, 94, 82, 0.1);
  }

  .guest-banner-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .guest-banner-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: rgba(201, 132, 122, 0.18);
    color: var(--color-primary);
    margin-bottom: 2px;
  }

  .pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-primary);
    box-shadow: 0 0 0 0 rgba(201, 132, 122, 0.7);
    animation: pulse 1.8s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(201, 132, 122, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(201, 132, 122, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(201, 132, 122, 0); }
  }

  .guest-banner-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--color-accent);
  }

  .guest-banner-desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-text-muted);
    max-width: 640px;
  }

  .guest-banner-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    flex-shrink: 0;
  }

  .btn-save-account {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 3px 12px rgba(201, 132, 122, 0.35);
    transition: all var(--transition-fast);
  }

  .btn-save-account:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 16px rgba(201, 132, 122, 0.45);
  }

  .btn-guest-login {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: color var(--transition-fast);
    padding: 2px 4px;
  }

  .btn-guest-login:hover {
    color: var(--color-primary);
  }

  /* Wizard Prompt Banner */
  .wizard-prompt-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    background: linear-gradient(135deg, rgba(201, 132, 122, 0.12) 0%, rgba(212, 163, 115, 0.15) 100%);
    border: 1px solid rgba(201, 132, 122, 0.3);
    border-radius: var(--radius-xl);
    box-shadow: 0 4px 16px rgba(139, 94, 82, 0.06);
  }

  .wizard-prompt-text {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .prompt-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .prompt-title {
    margin: 0 0 2px 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-accent);
  }

  .prompt-desc {
    margin: 0;
    font-size: 12.5px;
    color: var(--color-text-muted);
  }

  @media (max-width: 768px) {
    .guest-save-banner {
      flex-direction: column;
      align-items: stretch;
      padding: var(--space-4);
    }
    .guest-banner-actions {
      align-items: stretch;
      margin-top: var(--space-2);
    }
    .btn-save-account {
      justify-content: center;
      width: 100%;
    }
    .btn-guest-login {
      text-align: center;
    }
  }

  @media (max-width: 640px) {
    .wizard-prompt-banner {
      flex-direction: column;
      align-items: stretch;
      text-align: left;
    }
    .wizard-prompt-banner .btn {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 1024px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .dashboard-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 600px) {
    .page-hero { padding: var(--space-6) 0 var(--space-5); }
    .page-hero-inner { flex-direction: column; align-items: stretch; gap: var(--space-4); }
    .countdown-widget { width: 100%; padding: var(--space-3) var(--space-4); }
    .countdown-circle { width: 52px; height: 52px; }
    .countdown-big-num { font-size: 1.45rem; }
    .stats-grid { grid-template-columns: 1fr 1fr; }
  }
</style>