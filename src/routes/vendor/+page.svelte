<script lang="ts">
  import { onMount } from 'svelte';
  import {
    wedding,
    vendorSummary,
    addVendor,
    updateVendor,
    deleteVendor,
    resetVendorsToDefault,
    hydrateWeddingFromDb,
    type VendorItem
  } from '#lib/stores/wedding';
  import { formatRupiah } from '#lib/utils/format';

  interface Props {
    data?: {
      user?: { id: string; email: string; name: string } | null;
      weddingData?: any;
    };
  }

  const { data }: Props = $props();

  onMount(() => {
    if (data?.weddingData) {
      hydrateWeddingFromDb(data.weddingData);
    }
  });

  // State
  let searchQuery = $state('');
  let filterCategory = $state('semua');
  let filterStatus = $state('semua');
  let showModal = $state(false);
  let isEditing = $state(false);
  let editId = $state<string | null>(null);

  // Form State
  let formName = $state('');
  let formCategory = $state('Katering & Konsumsi');
  let formContactPerson = $state('');
  let formPhone = $state('');
  let formEmail = $state('');
  let formInstagram = $state('');
  let formAddress = $state('');
  let formStatus = $state<'riset' | 'diskusi' | 'deal' | 'lunas' | 'selesai'>('deal');
  let formEstimatedCost = $state(0);
  let formActualCost = $state(0);
  let formNotes = $state('');

  const availableCategories = [
    'Katering & Konsumsi',
    'Sewa Gedung / Tempat',
    'Dekorasi & Bunga',
    'Dokumentasi',
    'Rias & Busana',
    'Musik & Hiburan',
    'Undangan & Souvenir',
    'Transportasi',
    'Administrasi',
    'Lainnya',
  ];

  const statusOptions: Array<{ id: 'riset' | 'diskusi' | 'deal' | 'lunas' | 'selesai'; label: string; color: string }> = [
    { id: 'riset', label: 'Riset / Cari', color: 'info' },
    { id: 'diskusi', label: 'Diskusi / Nego', color: 'warning' },
    { id: 'deal', label: 'Sudah Deal / DP', color: 'success' },
    { id: 'lunas', label: 'Lunas', color: 'primary' },
    { id: 'selesai', label: 'Selesai Hari H', color: 'neutral' },
  ];

  const vs = $derived($vendorSummary);

  // Filtered vendors
  const filteredVendors = $derived(() => {
    return ($wedding.vendors || []).filter((v) => {
      const matchSearch =
        !searchQuery ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.phone.includes(searchQuery) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = filterCategory === 'semua' || v.category === filterCategory;
      const matchStatus = filterStatus === 'semua' || v.status === filterStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  });

  // Calculate linked budget items for each vendor
  function getLinkedBudgetItems(vendorName: string) {
    if (!vendorName) return [];
    const lowerName = vendorName.trim().toLowerCase();
    const items: Array<{ categoryName: string; itemName: string; total: number; paid: number }> = [];

    for (const cat of $wedding.budgetCategories) {
      for (const item of cat.items) {
        if (item.vendorName && item.vendorName.trim().toLowerCase().includes(lowerName)) {
          const total = item.quantity * item.unitPrice;
          const paid = item.payments.filter((p) => p.paidAt).reduce((a, p) => a + p.amount, 0);
          items.push({
            categoryName: cat.name,
            itemName: item.name,
            total,
            paid,
          });
        }
      }
    }
    return items;
  }

  function formatWaNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.slice(1);
    }
    return cleaned;
  }

  function openAddModal() {
    isEditing = false;
    editId = null;
    formName = '';
    formCategory = 'Katering & Konsumsi';
    formContactPerson = '';
    formPhone = '';
    formEmail = '';
    formInstagram = '';
    formAddress = '';
    formStatus = 'deal';
    formEstimatedCost = 0;
    formActualCost = 0;
    formNotes = '';
    showModal = true;
  }

  function openEditModal(v: VendorItem) {
    isEditing = true;
    editId = v.id;
    formName = v.name;
    formCategory = v.category;
    formContactPerson = v.contactPerson;
    formPhone = v.phone;
    formEmail = v.email;
    formInstagram = v.instagram;
    formAddress = v.address;
    formStatus = v.status;
    formEstimatedCost = v.estimatedCost;
    formActualCost = v.actualCost;
    formNotes = v.notes;
    showModal = true;
  }

  async function handleSaveVendor() {
    if (!formName.trim()) return;

    if (isEditing && editId) {
      const updates = {
        name: formName.trim(),
        category: formCategory,
        contactPerson: formContactPerson.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        instagram: formInstagram.trim().replace(/^@/, ''),
        address: formAddress.trim(),
        status: formStatus,
        estimatedCost: formEstimatedCost || 0,
        actualCost: formActualCost || 0,
        notes: formNotes.trim(),
      };
      updateVendor(editId, updates);
    } else {
      addVendor({
        name: formName.trim(),
        category: formCategory,
        contactPerson: formContactPerson.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        instagram: formInstagram.trim().replace(/^@/, ''),
        address: formAddress.trim(),
        status: formStatus,
        estimatedCost: formEstimatedCost || 0,
        actualCost: formActualCost || 0,
        notes: formNotes.trim(),
      });
    }

    showModal = false;
  }

  async function handleDeleteVendor(id: string, name: string) {
    if (!confirm(`Hapus vendor "${name}" dari daftar?`)) return;
    deleteVendor(id, name);
  }

  function handleResetTemplate() {
    if (confirm('Muat ulang daftar rekomendasi vendor contoh? Data vendor yang sudah Anda tambahkan manual akan di-reset.')) {
      resetVendorsToDefault();
    }
  }
</script>

<svelte:head>
  <title>Manajemen Vendor Pernikahan | Nikahku</title>
</svelte:head>

<div class="vendor-page animate-fade-in">
  <div class="container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="badge-tag mb-2">
          <span>🤝 Mitra Pernikahan</span>
        </div>
        <h1 class="page-title">Manajemen Vendor</h1>
        <p class="page-subtitle">
          Kelola seluruh kontak mitra, status kesepakatan, dan integrasikan biaya langsung ke anggaran pernikahan.
        </p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" onclick={handleResetTemplate} title="Muat template vendor contoh">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          <span class="hide-mobile">Muat Template</span>
        </button>
        <button class="btn btn-primary" onclick={openAddModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Tambah Vendor</span>
        </button>
      </div>
    </div>

    <!-- Stat Summary Cards -->
    <div class="grid-4 mb-6">
      <div class="stat-card">
        <div class="stat-icon-wrapper bg-terracotta-soft">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Vendor</span>
          <span class="stat-value">{vs.total}</span>
          <span class="stat-sub">{vs.deal} sudah deal / DP</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper bg-green-soft">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Sudah Deal / DP</span>
          <span class="stat-value text-success">{vs.deal}</span>
          <span class="stat-sub">{vs.diskusi} dalam diskusi</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper bg-amber-soft">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 14 14"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Dalam Negosiasi</span>
          <span class="stat-value text-warning">{vs.diskusi}</span>
          <span class="stat-sub">{vs.riset} tahap riset</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper bg-blue-soft">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Biaya Vendor</span>
          <span class="stat-value text-accent">{formatRupiah(vs.totalAktual || vs.totalEstimasi)}</span>
          <span class="stat-sub">Terhubung ke Anggaran</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-panel mb-6">
      <div class="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          class="form-input search-input"
          placeholder="Cari nama vendor, PIC, kontak WA, kategori..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <button class="clear-search-btn" onclick={() => searchQuery = ''}>✕</button>
        {/if}
      </div>

      <div class="filter-selects">
        <select class="form-select filter-dropdown" bind:value={filterCategory}>
          <option value="semua">Semua Kategori</option>
          {#each availableCategories as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>

        <select class="form-select filter-dropdown" bind:value={filterStatus}>
          <option value="semua">Semua Status</option>
          {#each statusOptions as st}
            <option value={st.id}>{st.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Vendor Cards List -->
    {#if filteredVendors().length === 0}
      <div class="empty-state-card">
        <div class="empty-icon">🤝</div>
        <h3>Tidak ada vendor ditemukan</h3>
        <p class="text-muted">
          {searchQuery || filterCategory !== 'semua' || filterStatus !== 'semua'
            ? 'Coba sesuaikan kata kunci pencarian atau filter Anda.'
            : 'Mulai dengan menambahkan vendor pertama Anda atau muat template rekomendasi.'}
        </p>
        <div class="mt-4 flex gap-3 justify-center">
          <button class="btn btn-secondary" onclick={handleResetTemplate}>Muat Template Rekomendasi</button>
          <button class="btn btn-primary" onclick={openAddModal}>+ Tambah Vendor Baru</button>
        </div>
      </div>
    {:else}
      <div class="vendor-grid">
        {#each filteredVendors() as v (v.id)}
          {@const linkedItems = getLinkedBudgetItems(v.name)}
          {@const matchedStatus = statusOptions.find(s => s.id === v.status) || statusOptions[0]}
          <div class="vendor-card card">
            <div class="vendor-card-header">
              <div class="vendor-header-left">
                <span class="category-pill">{v.category}</span>
                <h3 class="vendor-name">{v.name}</h3>
                {#if v.contactPerson}
                  <p class="vendor-pic">PIC: <span class="font-medium text-dark">{v.contactPerson}</span></p>
                {/if}
              </div>
              <div class="vendor-header-right">
                <span class="badge badge-{matchedStatus.color}">
                  {matchedStatus.label}
                </span>
              </div>
            </div>

            <!-- Contact & Social Links -->
            <div class="vendor-contact-row">
              {#if v.phone}
                <a
                  href="https://wa.me/{formatWaNumber(v.phone)}?text=Halo%20{encodeURIComponent(v.name)},%20saya%20calon%20pengantin%20yang%20ingin%20berkoordinasi%20mengenai%20pernikahan"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="contact-pill wa-pill"
                  title="Kirim Pesan WhatsApp"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                  <span>{v.phone}</span>
                </a>
              {/if}

              {#if v.instagram}
                <a
                  href="https://instagram.com/{v.instagram}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="contact-pill ig-pill"
                  title="Lihat Instagram"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <span>@{v.instagram}</span>
                </a>
              {/if}

              {#if v.email}
                <a href="mailto:{v.email}" class="contact-pill mail-pill" title="Kirim Email">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>{v.email}</span>
                </a>
              {/if}
            </div>

            {#if v.address}
              <div class="vendor-address text-xs text-muted mt-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{v.address}</span>
              </div>
            {/if}

            <!-- Cost Info -->
            <div class="vendor-cost-box mt-3">
              <div class="cost-item">
                <span class="cost-lbl">Biaya Disepakati:</span>
                <span class="cost-val font-semibold text-accent">
                  {v.actualCost > 0 ? formatRupiah(v.actualCost) : v.estimatedCost > 0 ? formatRupiah(v.estimatedCost) + ' (Estimasi)' : 'Belum ditentukan'}
                </span>
              </div>
            </div>

            <!-- Notes -->
            {#if v.notes}
              <div class="vendor-notes mt-2">
                <p class="text-xs text-muted">📝 {v.notes}</p>
              </div>
            {/if}

            <!-- Linked Budget Items -->
            {#if linkedItems.length > 0}
              <div class="linked-budget-section mt-3">
                <div class="linked-header">
                  <span class="text-xs font-semibold text-dark">Terhubung di Anggaran ({linkedItems.length} item):</span>
                  <a href="/anggaran" class="text-xs text-accent hover:underline">Buka Anggaran →</a>
                </div>
                <div class="linked-items-list mt-1">
                  {#each linkedItems as it}
                    <div class="linked-item-tag">
                      <span class="it-name">{it.itemName} ({it.categoryName})</span>
                      <span class="it-cost">{formatRupiah(it.total)}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Card Actions -->
            <div class="vendor-card-footer mt-4 pt-3">
              <button class="btn btn-sm btn-ghost" onclick={() => openEditModal(v)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Edit</span>
              </button>
              <button class="btn btn-sm btn-ghost text-danger" onclick={() => handleDeleteVendor(v.id, v.name)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Hapus</span>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Modal Add/Edit Vendor -->
{#if showModal}
  <div class="modal-overlay animate-fade-in" onclick={() => showModal = false} role="dialog" aria-modal="true">
    <div class="modal card max-w-lg" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3 class="modal-title">{isEditing ? 'Edit Informasi Vendor' : 'Tambah Vendor Baru'}</h3>
        <button type="button" class="btn-close-modal" onclick={() => showModal = false} aria-label="Tutup formulir">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group mb-3">
          <label class="form-label" for="vName">Nama Vendor / Bisnis *</label>
          <input
            id="vName"
            type="text"
            class="form-input"
            placeholder="Misal: Al-Hidayah Catering, Grand Sasana Ballroom"
            bind:value={formName}
          />
        </div>

        <div class="grid-2 mb-3">
          <div class="form-group">
            <label class="form-label" for="vCategory">Kategori Vendor</label>
            <select id="vCategory" class="form-select" bind:value={formCategory}>
              {#each availableCategories as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="vStatus">Status Kerjasama</label>
            <select id="vStatus" class="form-select" bind:value={formStatus}>
              {#each statusOptions as st}
                <option value={st.id}>{st.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="grid-2 mb-3">
          <div class="form-group">
            <label class="form-label" for="vContact">Nama PIC / Kontak</label>
            <input
              id="vContact"
              type="text"
              class="form-input"
              placeholder="Misal: Mas Budi / Ibu Ratna"
              bind:value={formContactPerson}
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="vPhone">Nomor WhatsApp / HP</label>
            <input
              id="vPhone"
              type="tel"
              class="form-input"
              placeholder="08123456789"
              bind:value={formPhone}
            />
          </div>
        </div>

        <div class="grid-2 mb-3">
          <div class="form-group">
            <label class="form-label" for="vIg">Instagram (opsional)</label>
            <input
              id="vIg"
              type="text"
              class="form-input"
              placeholder="username_tanpa_at"
              bind:value={formInstagram}
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="vEmail">Email (opsional)</label>
            <input
              id="vEmail"
              type="email"
              class="form-input"
              placeholder="vendor@gmail.com"
              bind:value={formEmail}
            />
          </div>
        </div>

        <div class="grid-2 mb-3">
          <div class="form-group">
            <label class="form-label" for="vEst">Estimasi Biaya (Rp)</label>
            <input
              id="vEst"
              type="number"
              class="form-input"
              min="0"
              step="50000"
              bind:value={formEstimatedCost}
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="vAct">Biaya Disepakati / Deal (Rp)</label>
            <input
              id="vAct"
              type="number"
              class="form-input"
              min="0"
              step="50000"
              bind:value={formActualCost}
            />
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label" for="vAddress">Alamat / Lokasi Kantor</label>
          <input
            id="vAddress"
            type="text"
            class="form-input"
            placeholder="Jl. Sudirman No. 12, Jakarta"
            bind:value={formAddress}
          />
        </div>

        <div class="form-group mb-4">
          <label class="form-label" for="vNotes">Catatan Kontrak / Paket / Rincian</label>
          <textarea
            id="vNotes"
            class="form-textarea"
            rows="2"
            placeholder="Misal: Paket Platinum 500 porsi, include 5 pondokan, bonus es puter..."
            bind:value={formNotes}
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick={() => showModal = false}>Batal</button>
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleSaveVendor}
          disabled={!formName.trim()}
        >
          {isEditing ? 'Simpan Perubahan' : 'Tambahkan Vendor'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Mobile Floating Action Button (FAB) -->
<button
  class="mobile-fab no-print hide-desktop"
  onclick={openAddModal}
  aria-label="Tambah Vendor Baru"
>
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
  <span>Tambah Vendor</span>
</button>

<style>
  /* Stat cards */
  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    display: flex;
    align-items: center;
    gap: var(--space-4);
    box-shadow: 0 1px 4px rgba(139, 94, 82, 0.04);
  }

  .stat-icon-wrapper {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .bg-terracotta-soft { background: rgba(201, 132, 122, 0.15); color: var(--color-accent); }
  .bg-green-soft { background: rgba(107, 171, 138, 0.15); color: #3b7b59; }
  .bg-amber-soft { background: rgba(212, 149, 106, 0.15); color: #b06b3a; }
  .bg-blue-soft { background: rgba(106, 138, 184, 0.15); color: #436696; }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .stat-value {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.2;
    margin: 2px 0;
  }

  .stat-sub {
    font-size: 11.5px;
    color: var(--color-text-subtle);
  }

  /* Filter Panel */
  .filter-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
    background: var(--color-surface);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-light);
  }

  .search-box {
    position: relative;
    flex: 1;
    min-width: 260px;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-subtle);
  }

  .search-input {
    padding-left: 36px;
    padding-right: 32px;
  }

  .clear-search-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--color-text-subtle);
    cursor: pointer;
    font-size: 13px;
  }

  .filter-selects {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .filter-dropdown {
    width: auto;
    min-width: 160px;
  }

  /* Vendor Grid */
  .vendor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: var(--space-5);
  }

  .vendor-card {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .vendor-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 94, 82, 0.08);
  }

  .vendor-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .category-pill {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-accent);
    margin-bottom: 4px;
  }

  .vendor-name {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .vendor-pic {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 2px 0 0;
  }

  .vendor-contact-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }

  .contact-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11.5px;
    text-decoration: none;
    font-weight: 500;
    transition: opacity var(--transition-fast);
  }
  .contact-pill:hover { opacity: 0.85; }

  .wa-pill {
    background: rgba(37, 211, 102, 0.12);
    color: #128c7e;
  }

  .ig-pill {
    background: rgba(225, 48, 108, 0.12);
    color: #c13584;
  }

  .mail-pill {
    background: rgba(106, 138, 184, 0.12);
    color: #436696;
  }

  .vendor-address {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .vendor-cost-box {
    background: var(--color-surface-hover);
    padding: var(--space-3);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border-light);
  }

  .cost-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--font-size-xs);
  }

  .linked-budget-section {
    background: rgba(201, 132, 122, 0.05);
    border: 1px dashed rgba(201, 132, 122, 0.3);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }

  .linked-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .linked-items-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .linked-item-tag {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11.5px;
  }

  .it-name {
    color: var(--color-text-muted);
  }

  .it-cost {
    font-weight: 600;
    color: var(--color-text);
  }

  .vendor-card-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
    border-top: 1px solid var(--color-border-light);
  }

  .empty-state-card {
    text-align: center;
    padding: var(--space-12) var(--space-6);
    background: var(--color-surface);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: var(--space-3);
  }

  @media (max-width: 640px) {
    .vendor-grid {
      grid-template-columns: 1fr;
    }
    .filter-panel {
      flex-direction: column;
      align-items: stretch;
    }
    .filter-selects {
      flex-direction: column;
    }
  }
</style>
