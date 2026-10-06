<script lang="ts">
  import { wedding, guestSummary, addGuest, deleteGuest } from '#lib/stores/wedding';
  import { categoryLabel, rsvpStatusLabel, formatDate } from '#lib/utils/format';
  import { exportGuestsToExcel } from '#lib/utils/exportExcel';
  
  let showAddModal = $state(false);
  let searchQuery = $state('');
  let filterStatus = $state<string>('all');
  let filterCategory = $state<string>('all');
  let copiedToken = $state<string | null>(null);

  // Form
  let guestName = $state('');
  let guestPhone = $state('');
  let guestEmail = $state('');
  let guestCategory = $state<'keluarga_inti' | 'keluarga_jauh' | 'teman' | 'kolega' | 'lainnya'>('teman');

  const gs = $derived($guestSummary);

  const filteredGuests = $derived(() => {
    return $wedding.guests.filter(g => {
      const matchSearch = !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.phone.includes(searchQuery);
      const matchStatus = filterStatus === 'all' || g.rsvpStatus === filterStatus;
      const matchCat = filterCategory === 'all' || g.category === filterCategory;
      return matchSearch && matchStatus && matchCat;
    });
  });

  function getRsvpUrl(token: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/undangan/${token}`;
  }

  async function copyRsvpLink(token: string) {
    await navigator.clipboard.writeText(getRsvpUrl(token));
    copiedToken = token;
    setTimeout(() => copiedToken = null, 2000);
  }

  function submitGuest() {
    addGuest({ name: guestName, phone: guestPhone, email: guestEmail, category: guestCategory });
    guestName = '';
    guestPhone = '';
    guestEmail = '';
    showAddModal = false;
  }

  const statusColors: Record<string, string> = {
    pending: 'badge-neutral',
    hadir: 'badge-success',
    tidak_hadir: 'badge-danger',
  };
</script>

<svelte:head>
  <title>Tamu — Nikahku</title>
</svelte:head>

<div class="page-container">
  <!-- Header -->
  <div class="page-header">
    <div class="container">
      <div class="page-header-inner">
        <div>
          <h1 class="page-title-with-icon">
          <span class="page-title-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </span>
          Daftar Tamu
        </h1>
          <p class="text-muted text-sm mt-1">Kelola undangan dan pantau konfirmasi kehadiran</p>
        </div>
        <div class="header-actions flex gap-2">
          <button class="btn btn-secondary btn-sm flex items-center gap-1.5" onclick={() => exportGuestsToExcel()} title="Export daftar tamu ke Excel (.xls)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg>
            Export Excel
          </button>
          <button class="btn btn-primary btn-sm" onclick={() => showAddModal = true}>
            + Tambah Tamu
          </button>
        </div>
      </div>

      <!-- Guest Stats -->
      <div class="guest-stats-bar mt-6">
        <div class="guest-stat-item">
          <span class="guest-stat-num">{gs.total}</span>
          <span class="guest-stat-label">Total Diundang</span>
        </div>
        <div class="guest-stat-item" style="--color: var(--color-success)">
          <span class="guest-stat-num" style="color: var(--color-success)">{gs.hadir}</span>
          <span class="guest-stat-label">Hadir</span>
        </div>
        <div class="guest-stat-item" style="--color: var(--color-warning)">
          <span class="guest-stat-num" style="color: var(--color-warning)">{gs.pending}</span>
          <span class="guest-stat-label">Belum Respons</span>
        </div>
        <div class="guest-stat-item" style="--color: var(--color-danger)">
          <span class="guest-stat-num" style="color: var(--color-danger)">{gs.tidakHadir}</span>
          <span class="guest-stat-label">Tidak Hadir</span>
        </div>
        <div class="guest-stat-rsvp">
          <div class="rsvp-progress-bar">
            <div class="rsvp-fill hadir-fill" style="width: {gs.total > 0 ? (gs.hadir/gs.total)*100 : 0}%"></div>
            <div class="rsvp-fill tidak-fill" style="width: {gs.total > 0 ? (gs.tidakHadir/gs.total)*100 : 0}%"></div>
          </div>
          <span class="text-xs text-subtle">{gs.hadir}/{gs.total} konfirmasi hadir</span>
        </div>
      </div>
    </div>
  </div>

  <div class="container mt-6">
    <!-- Filters -->
    <div class="filters-row mb-4">
      <div class="search-wrapper">
        <span class="search-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
        <input
          type="text"
          class="form-input search-input"
          bind:value={searchQuery}
          placeholder="Cari nama atau nomor HP..."
        />
      </div>

      <div class="filter-pills">
        {#each [['all', 'Semua'], ['pending', 'Pending'], ['hadir', 'Hadir'], ['tidak_hadir', 'Tidak Hadir']] as [val, label]}
          <button
            class="filter-pill {filterStatus === val ? 'active' : ''}"
            onclick={() => filterStatus = val}
          >{label}</button>
        {/each}
      </div>

      <select class="form-select filter-select" bind:value={filterCategory}>
        <option value="all">Semua Kategori</option>
        {#each ['keluarga_inti', 'keluarga_jauh', 'teman', 'kolega', 'lainnya'] as cat}
          <option value={cat}>{categoryLabel(cat)}</option>
        {/each}
      </select>
    </div>

    <!-- Guest List -->
    {#if $wedding.guests.length === 0}
      <div class="empty-page">
        <div class="empty-icon"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
        <h3>Belum ada tamu</h3>
        <p class="text-muted">Tambahkan daftar tamu dan bagikan link RSVP unik ke setiap tamu.</p>
        <button class="btn btn-primary mt-4" onclick={() => showAddModal = true}>+ Tambah Tamu Pertama</button>
      </div>
    {:else}
      <div class="guests-table-wrapper">
        <table class="guests-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th class="hide-mobile">Kategori</th>
              <th class="hide-mobile">Kontak</th>
              <th>Status RSVP</th>
              <th>Link RSVP</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each filteredGuests() as guest}
              <tr class="guest-row">
                <td>
                  <div class="guest-name-cell">
                    <div class="guest-avatar">{guest.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <span class="guest-name">{guest.name}</span>
                      {#if guest.rsvpStatus === 'hadir' && guest.rsvpMessage}
                        <p class="guest-message text-xs text-subtle">"{guest.rsvpMessage}"</p>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="hide-mobile">
                  <span class="badge badge-neutral">{categoryLabel(guest.category)}</span>
                </td>
                <td class="hide-mobile">
                  <span class="text-sm text-muted">{guest.phone || '—'}</span>
                </td>
                <td>
                  <span class="badge {statusColors[guest.rsvpStatus]}">
                    {rsvpStatusLabel(guest.rsvpStatus)}
                    {#if guest.rsvpStatus === 'hadir' && guest.guestCount > 1}
                      ({guest.guestCount})
                    {/if}
                  </span>
                  {#if guest.rsvpRespondedAt}
                    <p class="text-xs text-subtle mt-1">{formatDate(guest.rsvpRespondedAt)}</p>
                  {/if}
                </td>
                <td>
                  <button
                    class="btn btn-sm btn-secondary rsvp-copy-btn"
                    onclick={() => copyRsvpLink(guest.rsvpToken)}
                    title={getRsvpUrl(guest.rsvpToken)}
                  >
                    {#if copiedToken === guest.rsvpToken}✓ Tersalin!{:else}<span class="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>Salin Link</span>{/if}
                  </button>
                </td>
                <td>
                  <button
                    class="btn btn-icon btn-danger"
                    onclick={() => deleteGuest(guest.id)}
                    title="Hapus tamu"
                  ><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

        {#if filteredGuests().length === 0}
          <div class="no-results">
            <p class="text-muted text-center">Tidak ada tamu yang cocok dengan filter.</p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Add Guest Modal -->
{#if showAddModal}
  <div class="modal-overlay" onclick={() => showAddModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3>Tambah Tamu</h3>
        <button class="btn btn-icon btn-ghost" onclick={() => showAddModal = false}>✕</button>
      </div>

      <div class="form-group mb-4">
        <label class="form-label" for="gName">Nama Tamu *</label>
        <input id="gName" type="text" class="form-input" bind:value={guestName} placeholder="Nama lengkap" />
      </div>

      <div class="grid-2 mb-4">
        <div class="form-group">
          <label class="form-label" for="gPhone">Nomor HP</label>
          <input id="gPhone" type="tel" class="form-input" bind:value={guestPhone} placeholder="08xx..." />
        </div>
        <div class="form-group">
          <label class="form-label" for="gEmail">Email</label>
          <input id="gEmail" type="email" class="form-input" bind:value={guestEmail} placeholder="Opsional" />
        </div>
      </div>

      <div class="form-group mb-6">
        <label class="form-label">Kategori</label>
        <div class="category-chips">
          {#each ['keluarga_inti', 'keluarga_jauh', 'teman', 'kolega', 'lainnya'] as cat}
            <button
              class="chip {guestCategory === cat ? 'active' : ''}"
              onclick={() => guestCategory = cat as typeof guestCategory}
            >{categoryLabel(cat)}</button>
          {/each}
        </div>
      </div>

      <div class="flex gap-3">
        <button class="btn btn-secondary flex-1" onclick={() => showAddModal = false}>Batal</button>
        <button
          class="btn btn-primary flex-1"
          onclick={submitGuest}
          disabled={!guestName.trim()}
        >Tambah Tamu</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .page-container { padding-bottom: var(--space-12); }

  .page-header {
    background: white; border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-8) 0 var(--space-6);
  }

  .page-header-inner { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }

  /* Guest Stats Bar */
  .guest-stats-bar {
    display: flex; align-items: center; gap: var(--space-6); flex-wrap: wrap;
  }

  .guest-stat-item { display: flex; flex-direction: column; gap: 4px; }
  .guest-stat-num { font-family: var(--font-numeric); font-variant-numeric: tabular-nums lining-nums; font-size: var(--font-size-2xl); font-weight: 700; line-height: 1; }
  .guest-stat-label { font-size: var(--font-size-xs); color: var(--color-text-subtle); font-weight: 500; }

  .guest-stat-rsvp { flex: 1; min-width: 200px; }
  .rsvp-progress-bar { height: 8px; background: var(--color-secondary); border-radius: var(--radius-full); overflow: hidden; display: flex; margin-bottom: var(--space-1); }
  .rsvp-fill { height: 100%; transition: width var(--transition-slow); }
  .hadir-fill { background: var(--color-success); }
  .tidak-fill { background: var(--color-danger); }

  /* Filters */
  .filters-row { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }

  .search-wrapper { position: relative; flex: 1; min-width: 200px; }
  .search-icon { position: absolute; left: var(--space-3); top: 50%; transform: translateY(-50%); pointer-events: none; }
  .search-input { padding-left: 2.5rem; }

  .filter-pills { display: flex; gap: var(--space-2); flex-wrap: wrap; }

  .filter-pill {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    font-size: var(--font-size-xs); font-weight: 600;
    color: var(--color-text-muted); cursor: pointer;
    transition: all var(--transition-fast); font-family: var(--font-body);
  }

  .filter-pill.active {
    background: var(--color-primary-xlight);
    border-color: var(--color-primary);
    color: var(--color-accent);
  }

  .filter-select { width: auto; min-width: 160px; }

  /* Table */
  .guests-table-wrapper {
    background: white; border: 1px solid var(--color-border-light);
    border-radius: var(--radius-xl); overflow-x: auto; -webkit-overflow-scrolling: touch;
    box-shadow: var(--shadow-sm);
  }

  .guests-table { width: 100%; border-collapse: collapse; }

  .guests-table th {
    padding: var(--space-3) var(--space-4);
    text-align: left; font-size: var(--font-size-xs);
    font-weight: 600; color: var(--color-text-subtle);
    text-transform: uppercase; letter-spacing: .06em;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border-light);
  }

  .guest-row {
    border-bottom: 1px solid var(--color-border-light);
    transition: background var(--transition-fast);
  }

  .guest-row:last-child { border-bottom: none; }
  .guest-row:hover { background: var(--color-surface); }

  .guests-table td { padding: var(--space-3) var(--space-4); vertical-align: middle; }

  .guest-name-cell { display: flex; align-items: center; gap: var(--space-3); }

  .guest-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    color: white; display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: var(--font-size-sm); flex-shrink: 0;
  }

  .guest-name { font-weight: 600; font-size: var(--font-size-sm); }
  .guest-message { display: block; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .rsvp-copy-btn { white-space: nowrap; }

  .no-results { padding: var(--space-8); }

  /* Category Chips */
  .category-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }

  .chip {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    font-size: var(--font-size-sm); font-weight: 500;
    color: var(--color-text-muted); cursor: pointer;
    transition: all var(--transition-fast); font-family: var(--font-body);
  }

  .chip.active {
    background: var(--color-primary-xlight);
    border-color: var(--color-primary);
    color: var(--color-accent); font-weight: 600;
  }

  /* Empty */
  .empty-page { text-align: center; padding: var(--space-20) 0; display: flex; flex-direction: column; align-items: center; }
  .empty-icon { font-size: 4rem; margin-bottom: var(--space-4); }

  @media (max-width: 768px) {
    .filter-select { display: none; }
    .page-header-inner { flex-direction: column; gap: var(--space-3); }
    .guest-stats-bar { gap: var(--space-3); }
    .filters-row { flex-direction: column; align-items: stretch; }
    .search-input { width: 100%; }
    .category-chips { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; scrollbar-width: none; }
  }
</style>