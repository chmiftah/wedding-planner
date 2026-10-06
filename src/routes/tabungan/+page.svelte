<script lang="ts">
  import { wedding, savingsSummary, addSavingsEntry } from '#lib/stores/wedding';
  import { formatRupiah, formatRupiahShort, formatDate } from '#lib/utils/format';

  const ss = $derived($savingsSummary);

  let showAddEntry = $state(false);
  let entrySourceId = $state($wedding.fundingSources[0]?.id || '');
  let entryAmount = $state(0);
  let entryDate = $state(new Date().toISOString().slice(0, 10));
  let entryNotes = $state('');

  function submitEntry() {
    addSavingsEntry({
      sourceId: entrySourceId,
      amount: entryAmount,
      entryDate,
      notes: entryNotes,
    });
    showAddEntry = false;
    entryAmount = 0;
    entryNotes = '';
  }

  function formatNum(v: number) { return Math.round(v).toLocaleString('id-ID'); }
  function parseNum(s: string) { return parseInt(s.replace(/\D/g, ''), 10) || 0; }

  const sourceLabels: Record<string, string> = {
    tabungan_sendiri: 'Tabungan Sendiri',
    tabungan_pasangan: 'Tabungan Pasangan',
    bantuan_orangtua: 'Bantuan Orang Tua',
    lainnya: 'Lainnya',
  };

  const pct = $derived(ss.target > 0 ? Math.min(100, Math.round((ss.totalTerkumpul / ss.target) * 100)) : 0);
  const proyeksiPct = $derived(ss.target > 0 ? Math.min(100, Math.round((ss.proyeksiTotal / ss.target) * 100)) : 0);
</script>

<svelte:head>
  <title>Tabungan & Proyeksi — Nikahku</title>
</svelte:head>

<div class="page-container">
  <!-- Header -->
  <div class="page-header">
    <div class="container">
      <h1 class="page-title-with-icon">
        <span class="page-title-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18"></path>
            <path d="M3 10h18"></path>
            <path d="M5 6l7-3 7 3"></path>
            <path d="M4 10v11"></path>
            <path d="M20 10v11"></path>
            <circle cx="12" cy="15.5" r="1.5"></circle>
          </svg>
        </span>
        Tabungan & Proyeksi
      </h1>
      <p class="text-muted text-sm mt-1">Pantau apakah tabunganmu cukup untuk hari H</p>
    </div>
  </div>

  <div class="container mt-6">
    <!-- Status Alert -->
    {#if ss.target > 0}
      {#if ss.isOnTrack}
        <div class="alert alert-success animate-fade-in mb-6">
          <span class="alert-icon-svg" style="color: var(--color-success); display: inline-flex; align-items: center;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </span>
          <div>
            <strong>Tabunganmu on-track!</strong>
            <p class="text-sm mt-1">Proyeksi total <strong>{formatRupiah(ss.proyeksiTotal)}</strong> sudah melebihi target anggaran {formatRupiah(ss.target)}. Terus pertahankan!</p>
          </div>
        </div>
      {:else if ss.kekurangan > 0}
        <div class="alert alert-warning animate-fade-in mb-6">
          <span class="alert-icon-svg" style="color: var(--color-warning); display: inline-flex; align-items: center;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </span>
          <div>
            <strong>Tabungan perlu ditambah</strong>
            <p class="text-sm mt-1">
              Dengan laju menabung sekarang, proyeksi kurang <strong>{formatRupiah(ss.kekurangan)}</strong> dari target pada hari H.
              {#if ss.monthsLeft > 0}
                Perlu tambah menabung <strong>{formatRupiah(Math.ceil(ss.kekurangan / ss.monthsLeft / 100000) * 100000)}/bulan</strong>.
              {/if}
            </p>
          </div>
        </div>
      {/if}
    {/if}

    <!-- Main Cards -->
    <div class="grid-2 mb-6">
      <!-- Terkumpul -->
      <div class="card savings-main-card animate-fade-in">
        <div class="savings-label">Dana Terkumpul</div>
        <div class="savings-big-num">{formatRupiah(ss.totalTerkumpul)}</div>
        <div class="text-subtle text-sm mb-4">dari target {formatRupiah(ss.target)}</div>

        <div class="progress-bar" style="height: 12px">
          <div class="progress-fill" style="width: {pct}%"></div>
        </div>
        <div class="flex justify-between mt-2">
          <span class="text-xs text-subtle">{pct}% terkumpul</span>
          <span class="text-xs text-subtle">Target: {formatRupiahShort(ss.target)}</span>
        </div>
      </div>

      <!-- Proyeksi -->
      <div class="card proyeksi-card animate-fade-in delay-100">
        <div class="savings-label">Proyeksi Total (hari H)</div>
        <div class="savings-big-num" style="color: {ss.isOnTrack ? 'var(--color-success)' : 'var(--color-warning)'}">
          {formatRupiah(ss.proyeksiTotal)}
        </div>
        <div class="text-subtle text-sm mb-4">
          {ss.monthsLeft} bulan × {formatRupiahShort($wedding.monthlySavingsTarget)}/bln
          = +{formatRupiahShort(ss.proyeksiTambahan)}
        </div>

        <div class="progress-bar" style="height: 12px">
          <div class="progress-fill" style="width: {proyeksiPct}%; background: {ss.isOnTrack ? 'var(--color-success)' : 'var(--color-warning)'}"></div>
        </div>
        <div class="flex justify-between mt-2">
          <span class="text-xs text-subtle">{proyeksiPct}% dari target</span>
          {#if !ss.isOnTrack}
            <span class="text-xs" style="color: var(--color-danger)">Kurang {formatRupiahShort(ss.kekurangan)}</span>
          {:else}
            <span class="text-xs" style="color: var(--color-success)">✓ Tercukupi</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Detail Grid -->
    <div class="detail-grid">
      <!-- Left: Sumber Dana -->
      <div>
        <div class="section-title-row">
          <h3>Sumber Dana</h3>
        </div>

        <div class="sources-list">
          {#each $wedding.fundingSources as source}
            {@const entries = $wedding.savingsEntries.filter(e => e.sourceId === source.id)}
            {@const entriesTotal = entries.reduce((a, e) => a + e.amount, 0)}
            <div class="source-card">
              <div class="source-header">
                <div class="source-info">
                  <span class="source-name">{source.name}</span>
                  <span class="badge badge-{source.isEstimate ? 'neutral' : 'primary'} text-xs">
                    {sourceLabels[source.type] || source.type}
                  </span>
                </div>
                <div class="source-amounts">
                  <span class="source-confirmed">{formatRupiah(source.confirmedAmount)}</span>
                  {#if entriesTotal > 0}
                    <span class="text-xs text-muted">+ {formatRupiahShort(entriesTotal)} setoran</span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}

          <!-- Amplop estimate -->
          <div class="source-card source-estimate">
            <div class="source-header">
              <div class="source-info">
                <span class="source-name flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                Estimasi Amplop Tamu
              </span>
                <span class="badge badge-neutral text-xs">Estimasi</span>
              </div>
              <div class="source-amounts">
                <span class="source-confirmed text-muted">{formatRupiah(ss.envelopeAmount)}</span>
                <span class="text-xs text-subtle">
                  {$wedding.envelopeEstimate.guestCountOverride ?? $wedding.info.guestCount} tamu × {formatRupiahShort($wedding.envelopeEstimate.perGuest)}
                </span>
              </div>
            </div>
            <p class="text-xs text-subtle mt-2">Estimasi ini tidak dihitung sebagai dana pasti.</p>
          </div>
        </div>

        <!-- Setoran Tabungan -->
        <div class="section-title-row mt-6">
          <h3>Riwayat Setoran</h3>
          <button class="btn btn-primary btn-sm" onclick={() => showAddEntry = !showAddEntry}>
            + Tambah Setoran
          </button>
        </div>

        {#if showAddEntry}
          <div class="add-entry-form card animate-fade-in mb-4">
            <h4 class="mb-4">Catat Setoran Baru</h4>
            <div class="form-group mb-3">
              <label class="form-label" for="entrySource">Sumber Dana</label>
              <select id="entrySource" class="form-select" bind:value={entrySourceId}>
                {#each $wedding.fundingSources as s}
                  <option value={s.id}>{s.name}</option>
                {/each}
              </select>
            </div>
            <div class="grid-2 mb-3">
              <div class="form-group">
                <label class="form-label" for="entryAmount">Jumlah</label>
                <div class="currency-input-wrapper">
                  <span class="currency-prefix">Rp</span>
                  <input id="entryAmount" type="text" class="form-input"
                    value={formatNum(entryAmount)}
                    oninput={(e) => entryAmount = parseNum((e.target as HTMLInputElement).value)}
                  />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="entryDate">Tanggal</label>
                <input id="entryDate" type="date" class="form-input" bind:value={entryDate} />
              </div>
            </div>
            <div class="form-group mb-4">
              <label class="form-label" for="entryNotes">Catatan</label>
              <input id="entryNotes" type="text" class="form-input" bind:value={entryNotes} placeholder="Dari gaji, bonus, dll." />
            </div>
            <div class="flex gap-3">
              <button class="btn btn-secondary flex-1" onclick={() => showAddEntry = false}>Batal</button>
              <button class="btn btn-primary flex-1" onclick={submitEntry}>Simpan</button>
            </div>
          </div>
        {/if}

        {#if $wedding.savingsEntries.length === 0}
          <div class="empty-state-sm">
            <p class="text-subtle text-sm">Belum ada setoran dicatat.</p>
          </div>
        {:else}
          <div class="entries-list">
            {#each $wedding.savingsEntries as entry}
              {@const source = $wedding.fundingSources.find(s => s.id === entry.sourceId)}
              <div class="entry-row">
                <div class="entry-left">
                  <span class="entry-amount">+{formatRupiah(entry.amount)}</span>
                  <span class="text-xs text-subtle">{source?.name || 'Sumber tidak dikenal'}</span>
                </div>
                <div class="entry-right">
                  <span class="text-sm text-muted">{formatDate(entry.entryDate)}</span>
                  {#if entry.notes}<span class="text-xs text-subtle">{entry.notes}</span>{/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Right: Proyeksi Timeline -->
      <div>
        <div class="section-title-row">
          <h3>Timeline Proyeksi</h3>
        </div>

        <div class="card">
          <div class="timeline-summary">
            <div class="timeline-row">
              <span class="text-muted text-sm">Dana terkumpul saat ini</span>
              <span class="font-semibold">{formatRupiah(ss.totalTerkumpul)}</span>
            </div>
            <div class="timeline-row">
              <span class="text-muted text-sm">+ Menabung {formatRupiahShort($wedding.monthlySavingsTarget)}/bln × {ss.monthsLeft} bln</span>
              <span class="font-semibold" style="color: var(--color-success)">+{formatRupiah(ss.proyeksiTambahan)}</span>
            </div>
            <div class="divider" style="margin: var(--space-3) 0"></div>
            <div class="timeline-row">
              <span class="font-semibold">Proyeksi total</span>
              <span class="font-bold text-lg" style="color: {ss.isOnTrack ? 'var(--color-success)' : 'var(--color-warning)'}">{formatRupiah(ss.proyeksiTotal)}</span>
            </div>
            <div class="timeline-row">
              <span class="text-muted text-sm">Target anggaran</span>
              <span class="font-semibold">{formatRupiah(ss.target)}</span>
            </div>
            {#if ss.kekurangan > 0}
              <div class="timeline-row" style="color: var(--color-danger)">
                <span class="font-semibold">Kekurangan</span>
                <span class="font-bold">{formatRupiah(ss.kekurangan)}</span>
              </div>
            {:else}
              <div class="timeline-row" style="color: var(--color-success)">
                <span class="font-semibold">Surplus</span>
                <span class="font-bold">+{formatRupiah(ss.proyeksiTotal - ss.target)}</span>
              </div>
            {/if}
          </div>

          {#if ss.monthsLeft > 0}
            <div class="divider"></div>
            <h5 class="text-sm font-semibold mb-3">Proyeksi per Bulan</h5>
            <div class="monthly-projection">
              {#each Array.from({ length: Math.min(ss.monthsLeft, 12) }, (_, i) => i + 1) as month}
                {@const projected = ss.totalTerkumpul + month * $wedding.monthlySavingsTarget}
                {@const mPct = ss.target > 0 ? Math.min(100, (projected / ss.target) * 100) : 0}
                {@const isTarget = mPct >= 100}
                <div class="month-row">
                  <span class="month-label text-xs text-muted">Bln {month}</span>
                  <div class="month-bar-wrapper">
                    <div class="month-bar" style="width: {mPct}%; background: {isTarget ? 'var(--color-success)' : 'var(--color-primary)'}"></div>
                  </div>
                  <span class="month-amount text-xs {isTarget ? 'text-success' : 'text-muted'}">{formatRupiahShort(projected)}</span>
                </div>
              {/each}
              {#if ss.monthsLeft > 12}
                <p class="text-xs text-subtle text-center mt-2">... dan {ss.monthsLeft - 12} bulan lagi</p>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .page-container { padding-bottom: var(--space-12); }

  .page-header {
    background: white; border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-8) 0 var(--space-6);
  }

  .savings-main-card {
    background: linear-gradient(135deg, var(--color-primary-xlight), white);
    border-color: var(--color-primary-light);
  }

  .proyeksi-card { background: white; }

  .savings-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-subtle); text-transform: uppercase; letter-spacing: .06em; margin-bottom: var(--space-2); }

  .savings-big-num { font-family: var(--font-numeric); font-variant-numeric: tabular-nums lining-nums; letter-spacing: -0.02em; font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-text); line-height: 1; margin-bottom: var(--space-2); }

  .detail-grid { display: grid; grid-template-columns: 1fr 380px; gap: var(--space-6); align-items: flex-start; }

  .section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
  .section-title-row h3 { font-size: var(--font-size-lg); font-weight: 700; }

  /* Sources */
  .sources-list { display: flex; flex-direction: column; gap: var(--space-3); }

  .source-card {
    background: white; border: 1px solid var(--color-border-light);
    border-radius: var(--radius-xl); padding: var(--space-4);
  }

  .source-estimate { border-style: dashed; background: var(--color-surface); }

  .source-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); }

  .source-info { display: flex; flex-direction: column; gap: var(--space-1); }
  .source-name { font-weight: 600; font-size: var(--font-size-sm); }

  .source-amounts { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
  .source-confirmed { font-family: var(--font-numeric); font-variant-numeric: tabular-nums lining-nums; font-size: var(--font-size-lg); font-weight: 700; color: var(--color-text); }

  /* Entries */
  .entries-list { display: flex; flex-direction: column; gap: var(--space-2); }

  .entry-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: var(--space-3) var(--space-4);
    background: white; border: 1px solid var(--color-border-light);
    border-radius: var(--radius-lg);
  }

  .entry-left { display: flex; flex-direction: column; gap: 2px; }
  .entry-amount { font-family: var(--font-numeric); font-variant-numeric: tabular-nums lining-nums; font-weight: 700; color: var(--color-success); }
  .entry-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }

  .add-entry-form { margin-bottom: var(--space-4); }

  /* Timeline */
  .timeline-summary { display: flex; flex-direction: column; gap: var(--space-3); }

  .timeline-row { display: flex; justify-content: space-between; align-items: center; gap: var(--space-4); }
  .text-lg { font-size: var(--font-size-lg); }

  /* Monthly Projection */
  .monthly-projection { display: flex; flex-direction: column; gap: var(--space-2); }

  .month-row { display: flex; align-items: center; gap: var(--space-2); }
  .month-label { width: 40px; flex-shrink: 0; }
  .month-bar-wrapper { flex: 1; height: 6px; background: var(--color-secondary); border-radius: var(--radius-full); overflow: hidden; }
  .month-bar { height: 100%; border-radius: var(--radius-full); transition: width var(--transition-slow); }
  .month-amount { width: 80px; text-align: right; }
  .text-success { color: var(--color-success); }

  .empty-state-sm { padding: var(--space-6) 0; text-align: center; }

  @media (max-width: 1024px) {
    .detail-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .page-header-inner { flex-direction: column; gap: var(--space-3); }
    .savings-header-stats { flex-direction: column; gap: var(--space-4); }
  }
</style>