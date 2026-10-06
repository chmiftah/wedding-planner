<script lang="ts">
  import { goto } from '$app/navigation';
  import { completeWizard, type WeddingInfo, type FundingSource } from '#lib/stores/wedding';
  import { formatRupiah } from '#lib/utils/format';

  let step = $state(0);
  const totalSteps = 12;

  // Form state
  let brideName = $state('');
  let groomName = $state('');
  let weddingDate = $state('');
  let dateNote = $state('');
  let hasDate = $state<'ya' | 'belum'>('ya');
  let selectedEvents = $state<string[]>(['Resepsi']);
  let guestCount = $state(150);
  let venueType = $state<'gedung' | 'rumah' | 'kombinasi'>('gedung');
  let style = $state<'sederhana' | 'menengah' | 'mewah'>('menengah');
  let totalBudget = $state(0);
  let budgetKnown = $state<'ya' | 'hitung'>('ya');
  let currentSavings = $state(0);
  let monthlySavings = $state(0);
  let hasParentHelp = $state<'ya' | 'tidak'>('tidak');
  let parentHelpAmount = $state(0);
  let envelopePerGuest = $state(100000);

  const events = ['Lamaran', 'Akad', 'Resepsi', 'Ngunduh Mantu', 'Siraman', 'Pengajian'];

  function toggleEvent(e: string) {
    if (selectedEvents.includes(e)) {
      selectedEvents = selectedEvents.filter(x => x !== e);
    } else {
      selectedEvents = [...selectedEvents, e];
    }
  }

  function nextStep() {
    if (step < totalSteps - 1) step++;
  }

  function prevStep() {
    if (step > 0) step--;
  }

  function formatNum(val: number): string {
    return val.toLocaleString('id-ID');
  }

  function parseNum(s: string): number {
    return parseInt(s.replace(/\D/g, ''), 10) || 0;
  }

  const progress = $derived(Math.round(((step + 1) / totalSteps) * 100));

  const budgetBreakdown = $derived(() => {
    // Biaya dasar (dekorasi, busana/rias, dokumentasi, administrasi, dll) disesuaikan dengan jenis venue
    const venueMultiplier: Record<string, number> = {
      rumah: 0.6,     // Di rumah: hemat sewa gedung, hanya tenda & kursi
      gedung: 1.0,    // Di gedung: standar sewa aula/ballroom
      kombinasi: 1.15 // Kombinasi: tempat akad + resepsi terpisah
    };

    const baseGedung = {
      sederhana: 45_000_000,
      menengah: 95_000_000,
      mewah: 220_000_000,
    };

    const perPaxRate = {
      sederhana: venueType === 'rumah' ? 110_000 : 140_000,
      menengah: venueType === 'rumah' ? 190_000 : 250_000,
      mewah: venueType === 'rumah' ? 380_000 : 500_000,
    };

    const multiplier = venueMultiplier[venueType] || 1.0;
    const baseCost = Math.round((baseGedung[style] * multiplier) / 1_000_000) * 1_000_000;
    const paxCost = guestCount * perPaxRate[style];
    const total = Math.round((baseCost + paxCost) / 1_000_000) * 1_000_000;

    return {
      baseCost,
      paxCost,
      total,
    };
  });

  const estimatedBudget = $derived(() => budgetBreakdown().total);

  const effectiveBudget = $derived(budgetKnown === 'ya' ? totalBudget : estimatedBudget());

  const envelopeTotal = $derived(guestCount * envelopePerGuest);
  const totalDana = $derived(currentSavings + (hasParentHelp === 'ya' ? parentHelpAmount : 0));

  let isSaving = $state(false);

  async function finish() {
    if (isSaving) return;
    isSaving = true;

    const info: WeddingInfo = {
      brideName: brideName.trim() || 'Mempelai Wanita',
      groomName: groomName.trim() || 'Mempelai Pria',
      weddingDate: hasDate === 'ya' ? weddingDate : null,
      dateNote,
      venueType,
      style,
      guestCount,
      totalBudget: effectiveBudget,
      events: selectedEvents.map((name, i) => ({ id: `event-${i}`, name, date: '' })),
    };

    const fundingSourcesList: FundingSource[] = [
      {
        id: 'fs-1',
        type: 'tabungan_sendiri',
        name: 'Tabungan Berdua',
        confirmedAmount: currentSavings,
        isEstimate: false,
        notes: '',
      },
    ];

    if (hasParentHelp === 'ya') {
      fundingSourcesList.push({
        id: 'fs-2',
        type: 'bantuan_orangtua',
        name: 'Bantuan Orang Tua',
        confirmedAmount: parentHelpAmount,
        isEstimate: false,
        notes: '',
      });
    }

    completeWizard({ info, monthlySavingsTarget: monthlySavings, fundingSources: fundingSourcesList });

    const submission = {
      brideName: info.brideName,
      groomName: info.groomName,
      weddingDate: info.weddingDate,
      dateNote: info.dateNote,
      venueType: info.venueType,
      style: info.style,
      guestCount: info.guestCount,
      totalBudget: info.totalBudget,
      monthlySavingsTarget: monthlySavings,
      fundingSources: fundingSourcesList.map((f) => ({
        type: f.type,
        name: f.name,
        confirmedAmount: f.confirmedAmount,
        isEstimate: f.isEstimate,
        notes: f.notes,
      })),
    };

    try {
      const formData = new FormData();
      formData.append('payload', JSON.stringify(submission));
      await fetch('/wizard', {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      console.warn('Error syncing wizard to database:', err);
    } finally {
      isSaving = false;
      goto('/dashboard');
    }
  }
</script>

<svelte:head>
  <title>Mulai Merencanakan — Nikahku</title>
</svelte:head>

<div class="wizard-page">
  <!-- Progress -->
  <div class="wizard-progress-bar">
    <div class="wizard-progress-fill" style="width: {progress}%"></div>
  </div>

  <div class="wizard-container">
    <!-- Back button -->
    {#if step > 0}
      <button onclick={prevStep} class="wizard-back">
        ← Kembali
      </button>
    {:else}
      <a href="/" class="wizard-back">← Beranda</a>
    {/if}

    <!-- Step counter -->
    <div class="wizard-step-info text-subtle text-sm text-center mb-4">
      Langkah {step + 1} dari {totalSteps}
    </div>

    <div class="wizard-card animate-fade-in" style="--delay: 0s">
      <!-- Step 0: Nama -->
      {#if step === 0}
        <div class="wizard-step">
          <div class="wizard-emoji">👋</div>
          <h2 class="wizard-title">Halo! Perkenalkan dirimu</h2>
          <p class="wizard-desc">Siapa nama kamu dan pasanganmu?</p>

          <div class="wizard-form">
            <div class="form-group">
              <label class="form-label" for="brideName">Nama kamu</label>
              <input id="brideName" type="text" class="form-input" bind:value={brideName} placeholder="Misal: Sari" />
            </div>
            <div class="form-group">
              <label class="form-label" for="groomName">Nama pasanganmu</label>
              <input id="groomName" type="text" class="form-input" bind:value={groomName} placeholder="Misal: Budi" />
            </div>
          </div>
        </div>

      <!-- Step 1: Tanggal -->
      {:else if step === 1}
        <div class="wizard-step">
          <div class="wizard-emoji">📅</div>
          <h2 class="wizard-title">Kapan rencana menikah{brideName ? ', ' + brideName : ''}?</h2>

          <div class="wizard-choices">
            <button
              class="choice-btn {hasDate === 'ya' ? 'active' : ''}"
              onclick={() => hasDate = 'ya'}
            >
              📅 Sudah ada tanggalnya
            </button>
            <button
              class="choice-btn {hasDate === 'belum' ? 'active' : ''}"
              onclick={() => hasDate = 'belum'}
            >
              🤔 Belum tahu tanggalnya
            </button>
          </div>

          {#if hasDate === 'ya'}
            <div class="form-group mt-4">
              <label class="form-label" for="weddingDate">Tanggal pernikahan</label>
              <input id="weddingDate" type="date" class="form-input" bind:value={weddingDate} />
            </div>
          {:else}
            <div class="form-group mt-4">
              <label class="form-label" for="dateNote">Perkiraan kapan?</label>
              <input id="dateNote" type="text" class="form-input" bind:value={dateNote} placeholder="Misal: Akhir 2027, atau setelah lebaran" />
            </div>
          {/if}
        </div>

      <!-- Step 2: Acara -->
      {:else if step === 2}
        <div class="wizard-step">
          <div class="wizard-emoji">🎊</div>
          <h2 class="wizard-title">Acara apa saja yang direncanakan?</h2>
          <p class="wizard-desc">Pilih semua yang berlaku. Setiap acara bisa punya anggaran sendiri.</p>

          <div class="event-grid">
            {#each events as event}
              <button
                class="event-btn {selectedEvents.includes(event) ? 'active' : ''}"
                onclick={() => toggleEvent(event)}
              >
                {event}
                {#if selectedEvents.includes(event)}
                  <span class="event-check">✓</span>
                {/if}
              </button>
            {/each}
          </div>
        </div>

      <!-- Step 3: Jumlah tamu -->
      {:else if step === 3}
        <div class="wizard-step">
          <div class="wizard-emoji">👥</div>
          <h2 class="wizard-title">Berapa tamu yang diperkirakan?</h2>
          <p class="wizard-desc">Perkiraan kasar sudah cukup. Bisa diubah nanti.</p>

          <div class="guest-slider">
            <div class="guest-count-display">
              <span class="guest-count-num">{guestCount}</span>
              <span class="guest-count-label">tamu</span>
            </div>
            <input
              type="range" min="20" max="2000" step="10"
              bind:value={guestCount}
              class="wizard-range"
            />
            <div class="guest-range-labels">
              <span>20</span>
              <span class="text-xs text-subtle">Geser untuk atur</span>
              <span>2.000+</span>
            </div>
          </div>

          <div class="guest-presets">
            {#each [50, 100, 150, 200, 300, 500] as preset}
              <button
                class="preset-btn {guestCount === preset ? 'active' : ''}"
                onclick={() => guestCount = preset}
              >{preset}</button>
            {/each}
          </div>
        </div>

      <!-- Step 4: Venue -->
      {:else if step === 4}
        <div class="wizard-step">
          <div class="wizard-emoji">🏛️</div>
          <h2 class="wizard-title">Resepsinya di mana?</h2>

          <div class="venue-grid">
            <button
              class="venue-btn {venueType === 'gedung' ? 'active' : ''}"
              onclick={() => venueType = 'gedung'}
            >
              <span class="venue-icon">🏛️</span>
              <span class="venue-name">Gedung / Ballroom</span>
              <span class="venue-desc text-subtle text-xs">Sewa tempat acara</span>
            </button>
            <button
              class="venue-btn {venueType === 'rumah' ? 'active' : ''}"
              onclick={() => venueType = 'rumah'}
            >
              <span class="venue-icon">🏠</span>
              <span class="venue-name">Di Rumah</span>
              <span class="venue-desc text-subtle text-xs">Halaman atau tenda sendiri</span>
            </button>
            <button
              class="venue-btn {venueType === 'kombinasi' ? 'active' : ''}"
              onclick={() => venueType = 'kombinasi'}
            >
              <span class="venue-icon">🔀</span>
              <span class="venue-name">Kombinasi</span>
              <span class="venue-desc text-subtle text-xs">Akad di satu tempat, resepsi di tempat lain</span>
            </button>
          </div>
        </div>

      <!-- Step 5: Gaya -->
      {:else if step === 5}
        <div class="wizard-step">
          <div class="wizard-emoji">✨</div>
          <h2 class="wizard-title">Gaya pernikahan yang diinginkan?</h2>

          <div class="style-cards">
            <button
              class="style-card {style === 'sederhana' ? 'active' : ''}"
              onclick={() => style = 'sederhana'}
            >
              <span class="style-emoji">🌿</span>
              <span class="style-name">Sederhana</span>
              <span class="style-range text-subtle text-xs">di bawah Rp 100 juta</span>
              <span class="style-desc text-xs">Hangat, intim, bermakna</span>
            </button>
            <button
              class="style-card {style === 'menengah' ? 'active' : ''}"
              onclick={() => style = 'menengah'}
            >
              <span class="style-emoji">🌸</span>
              <span class="style-name">Menengah</span>
              <span class="style-range text-subtle text-xs">Rp 100–300 juta</span>
              <span class="style-desc text-xs">Elegan dan berkesan</span>
            </button>
            <button
              class="style-card {style === 'mewah' ? 'active' : ''}"
              onclick={() => style = 'mewah'}
            >
              <span class="style-emoji">👑</span>
              <span class="style-name">Mewah</span>
              <span class="style-range text-subtle text-xs">di atas Rp 300 juta</span>
              <span class="style-desc text-xs">Grand dan tak terlupakan</span>
            </button>
          </div>
        </div>

      <!-- Step 6: Target Budget -->
      {:else if step === 6}
        <div class="wizard-step">
          <div class="wizard-emoji">💰</div>
          <h2 class="wizard-title">Target anggaran total?</h2>
          <p class="wizard-desc">Tidak apa-apa kalau belum tahu pasti. Kami bisa bantu perkirakan.</p>

          <div class="wizard-choices">
            <button
              class="choice-btn {budgetKnown === 'ya' ? 'active' : ''}"
              onclick={() => budgetKnown = 'ya'}
            >
              💰 Saya punya target anggaran
            </button>
            <button
              class="choice-btn {budgetKnown === 'hitung' ? 'active' : ''}"
              onclick={() => budgetKnown = 'hitung'}
            >
              🧮 Bantu saya hitung perkiraan
            </button>
          </div>

          {#if budgetKnown === 'ya'}
            <div class="form-group mt-4">
              <label class="form-label" for="budget">Target anggaran total</label>
              <div class="currency-input-wrapper">
                <span class="currency-prefix">Rp</span>
                <input
                  id="budget" type="text" class="form-input"
                  value={formatNum(totalBudget)}
                  oninput={(e) => totalBudget = parseNum((e.target as HTMLInputElement).value)}
                  placeholder="200.000.000"
                />
              </div>
            </div>
          {:else}
            <div class="estimate-card">
              <p class="text-subtle text-sm">
                Berdasarkan <strong>{guestCount} tamu</strong>, lokasi <strong>{venueType === 'rumah' ? 'di rumah' : venueType === 'gedung' ? 'gedung' : 'kombinasi'}</strong>, dan gaya <strong>"{style}"</strong>:
              </p>
              <p class="estimate-amount">{formatRupiah(estimatedBudget())}</p>
              <div class="estimate-breakdown text-subtle text-xs">
                <span>Pokok venue & vendor: {formatRupiah(budgetBreakdown().baseCost)}</span> •
                <span>Konsumsi & undangan ({guestCount} tamu): {formatRupiah(budgetBreakdown().paxCost)}</span>
              </div>
              <p class="text-subtle text-xs mt-2">Perkiraan ini bisa disesuaikan kapan saja di halaman anggaran.</p>
            </div>
          {/if}
        </div>

      <!-- Step 7: Tabungan saat ini -->
      {:else if step === 7}
        <div class="wizard-step">
          <div class="wizard-emoji">🏦</div>
          <h2 class="wizard-title">Tabungan saat ini?</h2>
          <p class="wizard-desc">Total tabungan yang sudah ada untuk pernikahan (gabungan berdua).</p>

          <div class="form-group">
            <label class="form-label" for="savings">Total tabungan sekarang</label>
            <div class="currency-input-wrapper">
              <span class="currency-prefix">Rp</span>
              <input
                id="savings" type="text" class="form-input"
                value={formatNum(currentSavings)}
                oninput={(e) => currentSavings = parseNum((e.target as HTMLInputElement).value)}
                placeholder="15.000.000"
              />
            </div>
            <span class="form-hint">Belum ada? Isi 0</span>
          </div>
        </div>

      <!-- Step 8: Kemampuan menabung -->
      {:else if step === 8}
        <div class="wizard-step">
          <div class="wizard-emoji">📊</div>
          <h2 class="wizard-title">Bisa menabung berapa per bulan?</h2>
          <p class="wizard-desc">Ini dipakai untuk menghitung apakah tabungan cukup pada hari H.</p>

          <div class="form-group">
            <label class="form-label" for="monthly">Tabungan per bulan</label>
            <div class="currency-input-wrapper">
              <span class="currency-prefix">Rp</span>
              <input
                id="monthly" type="text" class="form-input"
                value={formatNum(monthlySavings)}
                oninput={(e) => monthlySavings = parseNum((e.target as HTMLInputElement).value)}
                placeholder="3.000.000"
              />
            </div>
            <span class="form-hint">Gabungkan kemampuan menabung berdua</span>
          </div>
        </div>

      <!-- Step 9: Bantuan orang tua -->
      {:else if step === 9}
        <div class="wizard-step">
          <div class="wizard-emoji">👨‍👩‍👧</div>
          <h2 class="wizard-title">Ada bantuan dari orang tua?</h2>

          <div class="wizard-choices">
            <button
              class="choice-btn {hasParentHelp === 'ya' ? 'active' : ''}"
              onclick={() => hasParentHelp = 'ya'}
            >
              ❤️ Ada, sudah dikonfirmasi
            </button>
            <button
              class="choice-btn {hasParentHelp === 'tidak' ? 'active' : ''}"
              onclick={() => hasParentHelp = 'tidak'}
            >
              🙅 Tidak ada / belum tahu
            </button>
          </div>

          {#if hasParentHelp === 'ya'}
            <div class="form-group mt-4">
              <label class="form-label" for="parentHelp">Nominal bantuan (perkiraan)</label>
              <div class="currency-input-wrapper">
                <span class="currency-prefix">Rp</span>
                <input
                  id="parentHelp" type="text" class="form-input"
                  value={formatNum(parentHelpAmount)}
                  oninput={(e) => parentHelpAmount = parseNum((e.target as HTMLInputElement).value)}
                  placeholder="50.000.000"
                />
              </div>
            </div>
          {/if}
        </div>

      <!-- Step 10: Estimasi amplop -->
      {:else if step === 10}
        <div class="wizard-step">
          <div class="wizard-emoji">💌</div>
          <h2 class="wizard-title">Estimasi uang amplop per tamu</h2>
          <p class="wizard-desc">Di Indonesia, amplop tamu sering menutupi sebagian biaya resepsi. Ini ditandai sebagai estimasi, bukan angka pasti.</p>

          <div class="form-group">
            <label class="form-label" for="envelope">Amplop rata-rata per tamu</label>
            <div class="currency-input-wrapper">
              <span class="currency-prefix">Rp</span>
              <input
                id="envelope" type="text" class="form-input"
                value={formatNum(envelopePerGuest)}
                oninput={(e) => envelopePerGuest = parseNum((e.target as HTMLInputElement).value)}
                placeholder="100.000"
              />
            </div>
          </div>

          <div class="envelope-summary">
            <span class="text-subtle text-sm">Estimasi total amplop:</span>
            <span class="envelope-total">{formatRupiah(envelopeTotal)} ⚡ Estimasi</span>
          </div>

          <div class="alert alert-info">
            <span>ℹ️</span>
            <span>Angka ini hanya estimasi dan tidak masuk hitungan utama tabunganmu.</span>
          </div>
        </div>

      <!-- Step 11: Summary -->
      {:else if step === 11}
        <div class="wizard-step">
          <div class="wizard-emoji">🎉</div>
          <h2 class="wizard-title">Ringkasan Rencanamu</h2>
          <p class="wizard-desc">Cek sekali lagi sebelum kami buatkan rencana anggaran awal.</p>

          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Pengantin</span>
              <span class="summary-value">{brideName || '—'} & {groomName || '—'}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Tanggal</span>
              <span class="summary-value">
                {hasDate === 'ya' && weddingDate
                  ? new Date(weddingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  : dateNote || 'Belum ditentukan'}
              </span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Acara</span>
              <span class="summary-value">{selectedEvents.join(', ')}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Tamu</span>
              <span class="summary-value">{guestCount} orang</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Tempat</span>
              <span class="summary-value">{{ gedung: 'Gedung/Ballroom', rumah: 'Di Rumah', kombinasi: 'Kombinasi' }[venueType]}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Gaya</span>
              <span class="summary-value" style="text-transform: capitalize">{style}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Target Anggaran</span>
              <span class="summary-value summary-highlight">{formatRupiah(effectiveBudget)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Dana Terkumpul</span>
              <span class="summary-value">{formatRupiah(totalDana)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Tabungan / Bulan</span>
              <span class="summary-value">{formatRupiah(monthlySavings)}</span>
            </div>
          </div>

          <button onclick={finish} class="btn btn-primary btn-block btn-lg mt-6" disabled={isSaving}>
            {#if isSaving}
              <span>⏳ Menyimpan Rencana ke Database...</span>
            {:else}
              <span>🎊 Buat Rencana Anggaran Sekarang!</span>
            {/if}
          </button>
          <p class="text-subtle text-xs text-center mt-2">Semua data bisa diubah setelah wizard selesai.</p>
        </div>
      {/if}

      <!-- Next Button (all steps except last) -->
      {#if step < 11}
        <div class="wizard-footer">
          <button onclick={nextStep} class="btn btn-primary btn-block btn-lg">
            Lanjut →
          </button>
          {#if step > 0}
            <button onclick={nextStep} class="wizard-skip">
              Lewati langkah ini
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .wizard-page {
    min-height: 100vh;
    background: linear-gradient(160deg, var(--color-surface) 0%, var(--color-secondary) 100%);
    display: flex;
    flex-direction: column;
  }

  .wizard-progress-bar {
    height: 4px;
    background: var(--color-border-light);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .wizard-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    transition: width var(--transition-slow);
  }

  .wizard-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-6) var(--space-4) var(--space-12);
    max-width: 560px;
    margin: 0 auto;
    width: 100%;
  }

  .wizard-back {
    align-self: flex-start;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-2) 0;
    margin-bottom: var(--space-4);
    transition: color var(--transition-fast);
    font-family: var(--font-body);
    font-weight: 500;
    text-decoration: none;
  }

  .wizard-back:hover { color: var(--color-accent); }

  .wizard-card {
    background: white;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-2xl);
    padding: var(--space-8);
    width: 100%;
    box-shadow: var(--shadow-lg);
  }

  .wizard-step { display: flex; flex-direction: column; gap: var(--space-4); }

  .wizard-emoji {
    font-size: 3rem;
    line-height: 1;
    margin-bottom: var(--space-2);
  }

  .wizard-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    font-family: var(--font-display);
  }

  .wizard-desc { color: var(--color-text-muted); font-size: var(--font-size-sm); }

  .wizard-form { display: flex; flex-direction: column; gap: var(--space-4); }

  /* Choices */
  .wizard-choices { display: flex; flex-direction: column; gap: var(--space-3); }

  .choice-btn {
    display: flex; align-items: center; gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-base);
    font-weight: 500;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
    font-family: var(--font-body);
  }

  .choice-btn:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-xlight);
    color: var(--color-accent);
  }

  .choice-btn.active {
    border-color: var(--color-primary);
    background: var(--color-primary-xlight);
    color: var(--color-accent);
    font-weight: 600;
    box-shadow: 0 0 0 3px rgba(201,132,122,.12);
  }

  /* Events */
  .event-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  .event-btn {
    display: flex; align-items: center; justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-family: var(--font-body);
  }

  .event-btn.active {
    border-color: var(--color-primary);
    background: var(--color-primary-xlight);
    color: var(--color-accent);
    font-weight: 600;
  }

  .event-check { color: var(--color-success); font-weight: 700; }

  /* Guest Slider */
  .guest-slider { text-align: center; padding: var(--space-4) 0; }

  .guest-count-display {
    display: flex; align-items: baseline; justify-content: center; gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .guest-count-num {
    font-family: var(--font-display);
    font-size: var(--font-size-5xl);
    font-weight: 700;
    color: var(--color-accent);
    line-height: 1;
  }

  .guest-count-label { font-size: var(--font-size-lg); color: var(--color-text-muted); }

  .wizard-range {
    width: 100%;
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    border-radius: var(--radius-full);
    background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary) calc((var(--value, 150) - 20) / (2000 - 20) * 100%), var(--color-secondary) 0%);
    outline: none;
    cursor: pointer;
  }

  .wizard-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px; height: 24px;
    border-radius: 50%;
    background: white;
    border: 3px solid var(--color-primary);
    box-shadow: var(--shadow-md);
    cursor: pointer;
  }

  .guest-range-labels {
    display: flex; justify-content: space-between; margin-top: var(--space-2);
    font-size: var(--font-size-xs); color: var(--color-text-subtle);
  }

  .guest-presets {
    display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: center; margin-top: var(--space-4);
  }

  .preset-btn {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-family: var(--font-body);
  }

  .preset-btn.active, .preset-btn:hover {
    background: var(--color-primary-xlight);
    border-color: var(--color-primary);
    color: var(--color-accent);
  }

  /* Venue */
  .venue-grid { display: flex; flex-direction: column; gap: var(--space-3); }

  .venue-btn {
    display: grid; grid-template-columns: auto 1fr;
    grid-template-rows: auto auto; column-gap: var(--space-3);
    align-items: center;
    padding: var(--space-4) var(--space-5);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
    font-family: var(--font-body);
  }

  .venue-icon { font-size: 1.75rem; grid-row: 1 / -1; }
  .venue-name { font-size: var(--font-size-base); font-weight: 600; color: var(--color-text-muted); }
  .venue-desc { grid-column: 2; }

  .venue-btn.active {
    border-color: var(--color-primary);
    background: var(--color-primary-xlight);
  }

  .venue-btn.active .venue-name { color: var(--color-accent); }

  /* Style Cards */
  .style-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }

  .style-card {
    display: flex; flex-direction: column; align-items: center; gap: var(--space-1);
    padding: var(--space-5) var(--space-3);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-xl);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-family: var(--font-body);
    text-align: center;
  }

  .style-emoji { font-size: 2rem; }
  .style-name { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-muted); }
  .style-range { display: block; }
  .style-desc { display: block; color: var(--color-text-subtle); }

  .style-card.active {
    border-color: var(--color-primary);
    background: var(--color-primary-xlight);
    box-shadow: 0 0 0 3px rgba(201,132,122,.12);
  }

  .style-card.active .style-name { color: var(--color-accent); }

  /* Estimate */
  .estimate-card {
    background: var(--color-primary-xlight);
    border: 1px solid var(--color-primary-light);
    border-radius: var(--radius-xl);
    padding: var(--space-5);
    text-align: center;
    margin-top: var(--space-4);
  }

  .estimate-amount {
    font-family: var(--font-display);
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--color-accent);
    margin: var(--space-2) 0;
  }

  .estimate-breakdown {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin: var(--space-2) 0;
    line-height: 1.4;
  }

  /* Envelope */
  .envelope-summary {
    display: flex; align-items: center; justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface-alt);
    border-radius: var(--radius-lg);
    margin-top: var(--space-2);
  }

  .envelope-total { font-weight: 700; color: var(--color-accent); font-size: var(--font-size-sm); }

  /* Summary */
  .summary-grid { display: flex; flex-direction: column; gap: 0; }

  .summary-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--color-border-light);
  }

  .summary-item:last-child { border-bottom: none; }

  .summary-label { font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: 500; }
  .summary-value { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); text-align: right; }
  .summary-highlight { color: var(--color-accent); font-family: var(--font-numeric); font-variant-numeric: tabular-nums lining-nums; font-size: var(--font-size-base); }

  /* Footer */
  .wizard-footer { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); margin-top: var(--space-6); }

  .wizard-skip {
    font-size: var(--font-size-sm);
    color: var(--color-text-subtle);
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-body);
    transition: color var(--transition-fast);
  }

  .wizard-skip:hover { color: var(--color-text-muted); }

  @media (max-width: 480px) {
    .wizard-card { padding: var(--space-6); }
    .style-cards { grid-template-columns: 1fr; }
    .event-grid { grid-template-columns: 1fr; }
  }
</style>