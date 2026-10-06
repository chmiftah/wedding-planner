<script lang="ts">
  import {
    wedding, budgetSummary,
    addBudgetItem, deleteBudgetItem, updateBudgetItem,
    addBudgetCategory, deleteBudgetCategory,
    addPayment, markItemPaid
  } from '#lib/stores/wedding';
  import { formatRupiah, formatRupiahShort, formatDate, getPaymentStatus } from '#lib/utils/format';
  import { exportWeddingToExcel } from '#lib/utils/exportExcel';

  // Navigation states
  let activeView = $state<'grid' | 'all'>('grid');
  let selectedCategoryId = $state<string | null>(null);

  // Accordion states for "Rekap Semua" & item details
  let expandedCategories = $state<Set<string>>(new Set());
  let expandedItems = $state<Set<string>>(new Set());

  // Payment modal state
  let showPaymentModal = $state(false);
  let paymentItem = $state<{ categoryId: string; itemId: string; itemName: string; remaining: number } | null>(null);
  let payType = $state<'dp' | 'cicilan' | 'lunas'>('dp');
  let payAmount = $state(0);
  let payDueDate = $state('');
  let payPaidAt = $state('');
  let payNotes = $state('');

  // Add category modal state
  let showAddCategoryModal = $state(false);
  let newCatName = $state('');
  let newCatIcon = $state('🍽️');
  let newCatColor = $state('#C9847A');

  const bs = $derived($budgetSummary);
  const categories = $derived($wedding.budgetCategories);
  const selectedCategory = $derived(categories.find(c => c.id === selectedCategoryId) || null);

  const availableIcons = ['🍽️', '🏛️', '🌸', '📸', '💍', '✉️', '🎵', '🚗', '📋', '🎂', '🎁', '💄', '☕', '🎪', '🛡️'];
  const availableColors = ['#C9847A', '#8B5E52', '#D4956A', '#6A8AB8', '#B8726A', '#6BAB8A', '#A88880', '#7A5850', '#6B4438', '#9B6B9E'];

  function toggleCategoryAccordion(id: string) {
    const next = new Set(expandedCategories);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    expandedCategories = next;
  }

  function expandAllCategories() {
    expandedCategories = new Set(categories.map(c => c.id));
  }

  function collapseAllCategories() {
    expandedCategories = new Set();
  }

  function toggleItem(id: string) {
    const next = new Set(expandedItems);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    expandedItems = next;
  }

  function getCategoryTotal(cat: typeof $wedding.budgetCategories[0]) {
    return cat.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  }

  function getCategoryPaid(cat: typeof $wedding.budgetCategories[0]) {
    return cat.items.reduce((a, i) =>
      a + i.payments.filter(p => p.paidAt).reduce((b, p) => b + p.amount, 0), 0
    );
  }

  function openCategoryDetail(id: string) {
    selectedCategoryId = id;
    activeView = 'grid';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function backToGrid() {
    selectedCategoryId = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openPaymentModal(categoryId: string, item: typeof $wedding.budgetCategories[0]['items'][0]) {
    const total = item.quantity * item.unitPrice;
    const paid = item.payments.filter(p => p.paidAt).reduce((a, p) => a + p.amount, 0);
    const remaining = total - paid;
    paymentItem = { categoryId, itemId: item.id, itemName: item.name, remaining };
    payAmount = remaining;
    payDueDate = '';
    payPaidAt = new Date().toISOString().slice(0, 10);
    payNotes = '';
    payType = paid > 0 ? 'lunas' : 'dp';
    showPaymentModal = true;
  }

  function submitPayment() {
    if (!paymentItem) return;
    addPayment(paymentItem.categoryId, paymentItem.itemId, {
      type: payType,
      amount: payAmount,
      dueDate: payDueDate,
      paidAt: payPaidAt || null,
      notes: payNotes,
    });
    showPaymentModal = false;
  }

  function handleAddCategorySubmit() {
    if (!newCatName.trim()) return;
    const id = addBudgetCategory(newCatName.trim(), newCatIcon, newCatColor);
    newCatName = '';
    showAddCategoryModal = false;
    openCategoryDetail(id);
  }

  function handleDeleteCategory(id: string, name: string) {
    if (confirm(`Yakin ingin menghapus kategori "${name}" beserta semua itemnya?`)) {
      deleteBudgetCategory(id);
      if (selectedCategoryId === id) {
        selectedCategoryId = null;
      }
    }
  }

  function handleItemNameEdit(categoryId: string, itemId: string, e: Event) {
    const val = (e.target as HTMLElement).textContent?.trim() || '';
    updateBudgetItem(categoryId, itemId, { name: val });
  }

  function formatNum(v: number) { return Math.round(v).toLocaleString('id-ID'); }
  function parseNum(s: string) { return parseInt(s.replace(/\D/g, ''), 10) || 0; }

  const overallPct = $derived(bs.totalRencana > 0 ? Math.round((bs.totalDibayar / bs.totalRencana) * 100) : 0);
</script>

<svelte:head>
  <title>Anggaran — Nikahku</title>
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
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
            </svg>
          </span>
          Anggaran Pernikahan
        </h1>
          <p class="text-muted text-sm mt-1">Rencana alokasi dan realisasi pembayaran per vendor</p>
        </div>
        <div class="header-actions flex gap-2">
          <button class="btn btn-secondary btn-sm flex items-center gap-1.5" onclick={() => exportWeddingToExcel()} title="Export seluruh data pernikahan ke Excel (.xls)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg>
            Export Excel
          </button>
          <button class="btn btn-secondary btn-sm flex items-center gap-1.5" onclick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15h6"></path><path d="M9 11h6"></path></svg>
            Export PDF
          </button>
        </div>
      </div>

      <!-- Summary Bar -->
      <div class="summary-bar mt-6">
        <div class="summary-stat">
          <span class="summary-stat-label">Total Rencana</span>
          <span class="summary-stat-value">{formatRupiah(bs.totalRencana)}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-stat">
          <span class="summary-stat-label">Sudah Dibayar</span>
          <span class="summary-stat-value text-success">{formatRupiah(bs.totalDibayar)}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-stat">
          <span class="summary-stat-label">Sisa Tagihan</span>
          <span class="summary-stat-value text-warning">{formatRupiah(bs.sisaTagihan)}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-stat">
          <span class="summary-stat-label">Progress</span>
          <span class="summary-stat-value">{overallPct}%</span>
        </div>
      </div>

      <div class="progress-bar mt-4">
        <div class="progress-fill" style="width: {overallPct}%"></div>
      </div>

      <!-- View Switcher Tabs -->
      <div class="view-tabs mt-8">
        <button
          class="view-tab-btn {activeView === 'grid' && !selectedCategoryId ? 'active' : ''}"
          onclick={() => { activeView = 'grid'; selectedCategoryId = null; }}
        >
          <span class="tab-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></span> Grid Kategori
        </button>
        <button
          class="view-tab-btn {activeView === 'all' ? 'active' : ''}"
          onclick={() => { activeView = 'all'; selectedCategoryId = null; }}
        >
          <span class="tab-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></span> Rekap Semua Kategori
        </button>
      </div>
    </div>
  </div>

  <div class="container budget-content-area mt-8">
    {#if categories.length === 0}
      <div class="empty-page">
        <div class="empty-icon"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg></div>
        <h3>Belum ada anggaran</h3>
        <p class="text-muted">Selesaikan wizard onboarding untuk mendapatkan template anggaran otomatis.</p>
        <a href="/wizard" class="btn btn-primary mt-4">Mulai Wizard</a>
      </div>
    {:else}

      <!-- ============================================== -->
      <!-- VIEW 1: GRID KARTU KATEGORI (FOLDER VIEW)     -->
      <!-- ============================================== -->
      {#if activeView === 'grid' && !selectedCategoryId}
        <div class="grid-view-section animate-fade-in">
          <div class="grid-view-header mb-6">
            <div>
              <h2 class="view-section-title">Pilih Kategori Anggaran</h2>
              <p class="text-muted text-sm">Klik kartu untuk melihat rincian item, vendor, dan pembayaran.</p>
            </div>
            <button class="btn btn-outline-primary btn-sm" onclick={() => showAddCategoryModal = true}>
              + Tambah Kategori
            </button>
          </div>

          <div class="categories-grid">
            {#each categories as cat}
              {@const catTotal = getCategoryTotal(cat)}
              {@const catPaid = getCategoryPaid(cat)}
              {@const catRemaining = Math.max(0, catTotal - catPaid)}
              {@const catPct = catTotal > 0 ? Math.round((catPaid / catTotal) * 100) : 0}

              <button
                class="category-grid-card"
                onclick={() => openCategoryDetail(cat.id)}
                style="--cat-color: {cat.color}"
              >
                <!-- Top card info -->
                <div class="card-top">
                  <div class="card-icon-badge" style="background: {cat.color}20; color: {cat.color}">
                    <span>{cat.icon}</span>
                  </div>
                  <div class="card-title-group">
                    <h3 class="card-cat-name">{cat.name}</h3>
                    <span class="card-item-badge">{cat.items.length} item</span>
                  </div>
                </div>

                <!-- Financial Stats -->
                <div class="card-budget-stats mt-4">
                  <div class="card-stat-row">
                    <span class="card-stat-label">Alokasi Rencana</span>
                    <span class="card-stat-val font-semibold">{formatRupiah(catTotal)}</span>
                  </div>
                  <div class="card-stat-row mt-1">
                    <span class="card-stat-label">Terbayar</span>
                    <span class="card-stat-val text-success font-medium">{formatRupiah(catPaid)}</span>
                  </div>
                  <div class="card-stat-row mt-1">
                    <span class="card-stat-label">Sisa Tagihan</span>
                    <span class="card-stat-val text-muted text-xs">{formatRupiah(catRemaining)}</span>
                  </div>
                </div>

                <!-- Progress Bar & Percentage -->
                <div class="card-progress-wrapper mt-4">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-xs text-subtle font-medium">Pembayaran</span>
                    <span class="card-pct-badge font-bold" style="color: {cat.color}">{catPct}%</span>
                  </div>
                  <div class="card-progress-track">
                    <div
                      class="card-progress-fill"
                      style="background: {cat.color}; width: {catPct}%"
                    ></div>
                  </div>
                </div>

                <!-- Card Bottom Status & Action -->
                <div class="card-bottom mt-4">
                  {#if catTotal === 0}
                    <span class="badge badge-neutral badge-sm">Belum ada biaya</span>
                  {:else if catPct === 100}
                    <span class="badge badge-success badge-sm">✓ Lunas</span>
                  {:else if catPct > 0}
                    <span class="badge badge-warning badge-sm">Sebagian ({catPct}%)</span>
                  {:else}
                    <span class="badge badge-neutral badge-sm">Belum Dibayar</span>
                  {/if}

                  <span class="card-cta-link">
                    Buka Rincian →
                  </span>
                </div>
              </button>
            {/each}

            <!-- Add Category Card Tile -->
            <button class="category-add-card" onclick={() => showAddCategoryModal = true}>
              <div class="add-card-inner">
                <span class="add-card-plus">+</span>
                <span class="add-card-title">Tambah Kategori Baru</span>
                <span class="add-card-sub text-muted text-xs">Kustomisasi anggaran sesuai kebutuhan</span>
              </div>
            </button>
          </div>
        </div>

      <!-- ============================================== -->
      <!-- VIEW 2: DETAIL KATEGORI TERTENTU (SINGLE CAT)  -->
      <!-- ============================================== -->
      {:else if activeView === 'grid' && selectedCategory}
        {@const cat = selectedCategory}
        {@const catTotal = getCategoryTotal(cat)}
        {@const catPaid = getCategoryPaid(cat)}
        {@const catRemaining = Math.max(0, catTotal - catPaid)}
        {@const catPct = catTotal > 0 ? Math.round((catPaid / catTotal) * 100) : 0}

        <div class="single-cat-view animate-fade-in">
          <!-- Back Bar & Quick Category Switcher -->
          <div class="single-cat-nav mb-6">
            <button class="btn btn-secondary btn-sm" onclick={backToGrid}>
              ← Kembali ke Semua Kategori
            </button>

            <!-- Quick Pill Category Picker -->
            <div class="quick-category-pills">
              {#each categories as c}
                <button
                  class="pill-cat-btn {c.id === cat.id ? 'active' : ''}"
                  onclick={() => openCategoryDetail(c.id)}
                  title={c.name}
                >
                  <span>{c.icon}</span>
                  <span class="pill-name">{c.name.split(' ')[0]}</span>
                </button>
              {/each}
            </div>
          </div>

          <!-- Category Banner Card -->
          <div class="cat-banner-card" style="border-top: 4px solid {cat.color}">
            <div class="cat-banner-header">
              <div class="cat-banner-left">
                <div class="cat-banner-icon" style="background: {cat.color}20; color: {cat.color}">
                  {cat.icon}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="cat-banner-title">{cat.name}</h2>
                    <span class="badge {catPct === 100 ? 'badge-success' : catPct > 0 ? 'badge-warning' : 'badge-neutral'}">
                      {catPct === 100 ? '✓ Lunas' : catPct > 0 ? `Terbayar ${catPct}%` : 'Belum Ada Bayar'}
                    </span>
                  </div>
                  <p class="text-muted text-xs mt-1">{cat.items.length} item pengeluaran terdaftar</p>
                </div>
              </div>

              <div class="cat-banner-actions">
                <button class="btn btn-primary btn-sm" onclick={() => addBudgetItem(cat.id)}>
                  + Tambah Item
                </button>
                <button
                  class="btn btn-icon btn-ghost text-muted"
                  onclick={() => handleDeleteCategory(cat.id, cat.name)}
                  title="Hapus Kategori"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>

            <!-- Financial Summary for This Category -->
            <div class="cat-summary-grid mt-4">
              <div class="cat-stat-box">
                <span class="cat-stat-label">Total Alokasi Rencana</span>
                <span class="cat-stat-value">{formatRupiah(catTotal)}</span>
              </div>
              <div class="cat-stat-box">
                <span class="cat-stat-label">Sudah Dibayar</span>
                <span class="cat-stat-value text-success">{formatRupiah(catPaid)}</span>
              </div>
              <div class="cat-stat-box">
                <span class="cat-stat-label">Sisa Tagihan</span>
                <span class="cat-stat-value text-warning">{formatRupiah(catRemaining)}</span>
              </div>
              <div class="cat-stat-box">
                <span class="cat-stat-label">Persentase Lunas</span>
                <span class="cat-stat-value" style="color: {cat.color}">{catPct}%</span>
              </div>
            </div>

            <div class="cat-progress-bar mt-3">
              <div class="cat-progress-fill" style="background: {cat.color}; width: {catPct}%"></div>
            </div>
          </div>

          <!-- Items Table / List in this Category -->
          <div class="cat-items-container mt-6">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-base font-semibold">Daftar Item & Vendor</h3>
              <span class="text-xs text-muted">Klik nama item untuk mengedit langsung</span>
            </div>

            {#if cat.items.length === 0}
              <div class="empty-cat-items">
                <p class="text-muted text-sm mb-3">Belum ada item pengeluaran di kategori {cat.name}.</p>
                <button type="button" class="btn btn-primary btn-sm" onclick={() => addBudgetItem(cat.id)}>
                  + Tambah Item Pertama
                </button>
              </div>
            {:else}
              <div class="items-list-card">
                <!-- Table Header for items -->
                <div class="items-table-header hide-mobile">
                  <span class="th-name">Pos Pengeluaran</span>
                  <span class="th-calc">Jumlah & Harga Satuan</span>
                  <span class="th-total">Total & Status</span>
                  <span class="th-actions">Aksi</span>
                </div>

                {#each cat.items as item}
                  {@const itemTotal = item.quantity * item.unitPrice}
                  {@const paidAmount = item.payments.filter(p => p.paidAt).reduce((a, p) => a + p.amount, 0)}
                  {@const status = getPaymentStatus(item)}
                  {@const isItemOpen = expandedItems.has(item.id)}

                  <div class="item-row">
                    <div class="item-main">
                      <div class="item-col-name">
                        <div class="status-dot status-{status}" title="Status: {status === 'lunas' ? 'Lunas' : status === 'dp' ? 'DP' : 'Belum Dibayar'}"></div>
                        <div class="item-name-group">
                          <span
                            class="item-name-input"
                            contenteditable="true"
                            onblur={(e) => handleItemNameEdit(cat.id, item.id, e)}
                            suppressContentEditableWarning={true}
                            title="Klik untuk ubah nama item"
                          >{item.name}</span>
                          {#if item.vendorName}
                            <span class="item-vendor-badge">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              {item.vendorName}
                            </span>
                          {/if}
                        </div>
                      </div>

                      <div class="item-col-calc">
                        <div class="calc-pill">
                          <div class="calc-field qty-field">
                            <input
                              type="number" min="1"
                              class="calc-input qty-input"
                              value={item.quantity}
                              oninput={(e) => updateBudgetItem(cat.id, item.id, { quantity: parseInt((e.target as HTMLInputElement).value) || 1 })}
                              title="Jumlah / kuantitas"
                            />
                            <span class="calc-unit">item</span>
                          </div>

                          <span class="calc-sep">×</span>

                          <div class="calc-field price-field">
                            <span class="calc-currency">Rp</span>
                            <input
                              type="text"
                              class="calc-input price-input"
                              value={formatNum(item.unitPrice)}
                              oninput={(e) => updateBudgetItem(cat.id, item.id, { unitPrice: parseNum((e.target as HTMLInputElement).value) })}
                              title="Harga satuan (Rp)"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      <div class="item-col-total">
                        <span class="item-total-val font-numeric">{formatRupiahShort(itemTotal)}</span>
                        <span class="item-status-pill status-{status}">
                          {#if status === 'lunas'}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>Lunas</span>
                          {:else if status === 'dp'}
                            <span class="status-dot-inner"></span> <span>DP</span>
                          {:else}
                            <span class="status-dot-inner"></span> <span>Belum</span>
                          {/if}
                        </span>
                      </div>

                      <div class="item-col-actions">
                        <button
                          type="button"
                          class="item-act-btn act-pay"
                          onclick={() => openPaymentModal(cat.id, item)}
                          title="Catat Pembayaran"
                        >
                          <span class="act-plus">+</span>
                          <span>Bayar</span>
                        </button>

                        {#if status !== 'lunas'}
                          <button
                            type="button"
                            class="item-act-btn act-settle"
                            onclick={() => markItemPaid(cat.id, item.id)}
                            title="Tandai Sudah Lunas"
                          >
                            <span>✓ Lunas</span>
                          </button>
                        {/if}

                        <button
                          type="button"
                          class="item-act-icon {isItemOpen ? 'open' : ''}"
                          onclick={() => toggleItem(item.id)}
                          title={isItemOpen ? 'Tutup rincian' : 'Lihat rincian pembayaran'}
                          aria-label="Rincian"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="chevron-arrow {isItemOpen ? 'rotated' : ''}">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>

                        <button
                          type="button"
                          class="item-act-icon act-delete"
                          onclick={() => deleteBudgetItem(cat.id, item.id)}
                          title="Hapus item"
                          aria-label="Hapus item"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Item Detail Accordion -->
                    {#if isItemOpen}
                      <div class="item-detail animate-fade-in">
                        <div class="form-group mb-3">
                          <label class="form-label" for="vendor-{item.id}">Nama Vendor / Catatan</label>
                          <input id="vendor-{item.id}" type="text" class="form-input" value={item.vendorName}
                            oninput={(e) => updateBudgetItem(cat.id, item.id, { vendorName: (e.target as HTMLInputElement).value })}
                            placeholder="Misal: Bu Rudy Catering, PIC: Budi, WA: 0812xxx"
                          />
                        </div>

                        {#if item.payments.length > 0}
                          <h5 class="text-sm font-semibold mb-2">Riwayat Pembayaran</h5>
                          <div class="payments-list">
                            {#each item.payments as payment}
                              <div class="payment-row">
                                <div class="payment-left">
                                  <span class="badge badge-{payment.type === 'lunas' ? 'success' : payment.type === 'dp' ? 'warning' : 'info'}">
                                    {payment.type === 'dp' ? 'DP' : payment.type === 'cicilan' ? 'Cicilan' : 'Lunas'}
                                  </span>
                                  <span class="text-sm font-semibold">{formatRupiah(payment.amount)}</span>
                                </div>
                                <div class="payment-right text-xs text-subtle">
                                  {#if payment.paidAt}
                                    <span class="text-success">✓ {formatDate(payment.paidAt)}</span>
                                  {:else if payment.dueDate}
                                    <span>Jatuh tempo: {formatDate(payment.dueDate)}</span>
                                  {:else}
                                    <span>Belum dibayar</span>
                                  {/if}
                                </div>
                              </div>
                            {/each}
                          </div>

                          <div class="payment-summary mt-3">
                            <div class="flex justify-between text-sm">
                              <span class="text-muted">Total item:</span>
                              <span class="font-semibold">{formatRupiah(itemTotal)}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                              <span class="text-muted">Sudah dibayar:</span>
                              <span class="font-semibold text-success">{formatRupiah(paidAmount)}</span>
                            </div>
                            <div class="flex justify-between text-sm font-bold">
                              <span>Sisa belum bayar:</span>
                              <span class="text-warning">{formatRupiah(Math.max(0, itemTotal - paidAmount))}</span>
                            </div>
                          </div>
                        {:else}
                          <div class="empty-payments-notice">
                            <span class="text-subtle text-xs">Belum ada pembayaran yang dicatat untuk item ini.</span>
                            <button
                              type="button"
                              class="btn-link-action text-xs"
                              onclick={() => openPaymentModal(cat.id, item)}
                            >+ Catat Sekarang</button>
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/each}

                <!-- Add item button at bottom -->
                <button type="button" class="add-item-btn" onclick={() => addBudgetItem(cat.id)}>
                  <span class="add-plus-icon">+</span>
                  <span>Tambah Item di {cat.name}</span>
                </button>
              </div>
            {/if}
          </div>
        </div>

      <!-- ============================================== -->
      <!-- VIEW 3: REKAP SEMUA KATEGORI (ALL ACCORDION)  -->
      <!-- ============================================== -->
      {:else if activeView === 'all'}
        <div class="all-categories-view animate-fade-in">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="view-section-title">Rekap Menyeluruh Semua Kategori</h2>
              <p class="text-muted text-sm">Daftar lengkap untuk audit anggaran dan cetak laporan.</p>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" onclick={expandAllCategories}>
                Buka Semua
              </button>
              <button class="btn btn-ghost btn-sm" onclick={collapseAllCategories}>
                Tutup Semua
              </button>
            </div>
          </div>

          <div class="categories-list">
            {#each categories as cat}
              {@const catTotal = getCategoryTotal(cat)}
              {@const catPaid = getCategoryPaid(cat)}
              {@const catPct = catTotal > 0 ? Math.round((catPaid / catTotal) * 100) : 0}
              {@const isOpen = expandedCategories.has(cat.id)}

              <div class="category-card {isOpen ? 'open' : ''}">
                <!-- Category Accordion Header -->
                <button type="button" class="category-header" onclick={() => toggleCategoryAccordion(cat.id)}>
                  <div class="category-left">
                    <div class="category-color-dot" style="background: {cat.color}"></div>
                    <span class="category-icon">{cat.icon}</span>
                    <div class="category-title-group">
                      <span class="category-name">{cat.name}</span>
                      <span class="category-count-badge">{cat.items.length} item</span>
                    </div>
                  </div>

                  <div class="category-right">
                    <div class="category-progress-block hide-mobile">
                      <div class="category-ratio-text">
                        <span class="cat-paid-val">{formatRupiahShort(catPaid)}</span>
                        <span class="cat-slash">/</span>
                        <span class="cat-total-val">{formatRupiahShort(catTotal)}</span>
                      </div>
                      <div class="category-mini-progress">
                        <div class="category-mini-fill" style="background: {cat.color}; width: {catPct}%;"></div>
                      </div>
                      <span class="cat-pct-pill {catPct === 100 ? 'done' : catPct > 0 ? 'partial' : 'zero'}">
                        {catPct}%
                      </span>
                    </div>

                    <div class="category-header-total">
                      <span class="category-header-total-label hide-mobile">Total</span>
                      <span class="category-header-total-val font-numeric">{formatRupiahShort(catTotal)}</span>
                    </div>

                    <span class="category-chevron-wrapper {isOpen ? 'open' : ''}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="category-chevron-svg">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </div>
                </button>

                <!-- Items in Accordion -->
                {#if isOpen}
                  <div class="items-list animate-fade-in">
                    {#if cat.items.length > 0}
                      <div class="items-table-header hide-mobile">
                        <span class="th-name">Pos Pengeluaran</span>
                        <span class="th-calc">Jumlah & Harga Satuan</span>
                        <span class="th-total">Total & Status</span>
                        <span class="th-actions">Aksi</span>
                      </div>
                    {/if}

                    {#each cat.items as item}
                      {@const itemTotal = item.quantity * item.unitPrice}
                      {@const paidAmount = item.payments.filter(p => p.paidAt).reduce((a, p) => a + p.amount, 0)}
                      {@const status = getPaymentStatus(item)}
                      {@const isItemOpen = expandedItems.has(item.id)}

                      <div class="item-row">
                        <div class="item-main">
                          <div class="item-col-name">
                            <div class="status-dot status-{status}" title="Status: {status === 'lunas' ? 'Lunas' : status === 'dp' ? 'DP' : 'Belum Dibayar'}"></div>
                            <div class="item-name-group">
                              <span
                                class="item-name-input"
                                contenteditable="true"
                                onblur={(e) => handleItemNameEdit(cat.id, item.id, e)}
                                suppressContentEditableWarning={true}
                                title="Klik untuk ubah nama item"
                              >{item.name}</span>
                              {#if item.vendorName}
                                <span class="item-vendor-badge">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                  </svg>
                                  {item.vendorName}
                                </span>
                              {/if}
                            </div>
                          </div>

                          <div class="item-col-calc">
                            <div class="calc-pill">
                              <div class="calc-field qty-field">
                                <input
                                  type="number" min="1"
                                  class="calc-input qty-input"
                                  value={item.quantity}
                                  oninput={(e) => updateBudgetItem(cat.id, item.id, { quantity: parseInt((e.target as HTMLInputElement).value) || 1 })}
                                  title="Jumlah / kuantitas"
                                />
                                <span class="calc-unit">item</span>
                              </div>

                              <span class="calc-sep">×</span>

                              <div class="calc-field price-field">
                                <span class="calc-currency">Rp</span>
                                <input
                                  type="text"
                                  class="calc-input price-input"
                                  value={formatNum(item.unitPrice)}
                                  oninput={(e) => updateBudgetItem(cat.id, item.id, { unitPrice: parseNum((e.target as HTMLInputElement).value) })}
                                  title="Harga satuan (Rp)"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>

                          <div class="item-col-total">
                            <span class="item-total-val font-numeric">{formatRupiahShort(itemTotal)}</span>
                            <span class="item-status-pill status-{status}">
                              {#if status === 'lunas'}
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>Lunas</span>
                              {:else if status === 'dp'}
                                <span class="status-dot-inner"></span> <span>DP</span>
                              {:else}
                                <span class="status-dot-inner"></span> <span>Belum</span>
                              {/if}
                            </span>
                          </div>

                          <div class="item-col-actions">
                            <button
                              type="button"
                              class="item-act-btn act-pay"
                              onclick={() => openPaymentModal(cat.id, item)}
                              title="Catat Pembayaran"
                            >
                              <span class="act-plus">+</span>
                              <span>Bayar</span>
                            </button>

                            {#if status !== 'lunas'}
                              <button
                                type="button"
                                class="item-act-btn act-settle"
                                onclick={() => markItemPaid(cat.id, item.id)}
                                title="Tandai Sudah Lunas"
                              >
                                <span>✓ Lunas</span>
                              </button>
                            {/if}

                            <button
                              type="button"
                              class="item-act-icon {isItemOpen ? 'open' : ''}"
                              onclick={() => toggleItem(item.id)}
                              title={isItemOpen ? 'Tutup rincian' : 'Lihat rincian pembayaran'}
                              aria-label="Rincian"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="chevron-arrow {isItemOpen ? 'rotated' : ''}">
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>

                            <button
                              type="button"
                              class="item-act-icon act-delete"
                              onclick={() => deleteBudgetItem(cat.id, item.id)}
                              title="Hapus item"
                              aria-label="Hapus item"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>

                        <!-- Item Detail Accordion -->
                        {#if isItemOpen}
                          <div class="item-detail animate-fade-in">
                            <div class="form-group mb-3">
                              <label class="form-label" for="all-vendor-{item.id}">Nama Vendor / Catatan</label>
                              <input id="all-vendor-{item.id}" type="text" class="form-input" value={item.vendorName}
                                oninput={(e) => updateBudgetItem(cat.id, item.id, { vendorName: (e.target as HTMLInputElement).value })}
                                placeholder="Misal: Bu Rudy Catering, PIC: Budi, WA: 0812xxx"
                              />
                            </div>

                            {#if item.payments.length > 0}
                              <h5 class="text-sm font-semibold mb-2">Riwayat Pembayaran</h5>
                              <div class="payments-list">
                                {#each item.payments as payment}
                                  <div class="payment-row">
                                    <div class="payment-left">
                                      <span class="badge badge-{payment.type === 'lunas' ? 'success' : payment.type === 'dp' ? 'warning' : 'info'}">
                                        {payment.type === 'dp' ? 'DP' : payment.type === 'cicilan' ? 'Cicilan' : 'Lunas'}
                                      </span>
                                      <span class="text-sm font-semibold">{formatRupiah(payment.amount)}</span>
                                    </div>
                                    <div class="payment-right text-xs text-subtle">
                                      {#if payment.paidAt}
                                        <span class="text-success">✓ {formatDate(payment.paidAt)}</span>
                                      {:else if payment.dueDate}
                                        <span>Jatuh tempo: {formatDate(payment.dueDate)}</span>
                                      {:else}
                                        <span>Belum dibayar</span>
                                      {/if}
                                    </div>
                                  </div>
                                {/each}
                              </div>

                              <div class="payment-summary mt-3">
                                <div class="flex justify-between text-sm">
                                  <span class="text-muted">Total item:</span>
                                  <span class="font-semibold">{formatRupiah(itemTotal)}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                  <span class="text-muted">Sudah dibayar:</span>
                                  <span class="font-semibold text-success">{formatRupiah(paidAmount)}</span>
                                </div>
                                <div class="flex justify-between text-sm font-bold">
                                  <span>Sisa belum bayar:</span>
                                  <span class="text-warning">{formatRupiah(Math.max(0, itemTotal - paidAmount))}</span>
                                </div>
                              </div>
                            {:else}
                              <div class="empty-payments-notice">
                                <span class="text-subtle text-xs">Belum ada pembayaran yang dicatat untuk item ini.</span>
                                <button
                                  type="button"
                                  class="btn-link-action text-xs"
                                  onclick={() => openPaymentModal(cat.id, item)}
                                >+ Catat Sekarang</button>
                              </div>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    {/each}

                    <button type="button" class="add-item-btn" onclick={() => addBudgetItem(cat.id)}>
                      <span class="add-plus-icon">+</span>
                      <span>Tambah Item di {cat.name}</span>
                    </button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- ============================================== -->
<!-- PAYMENT MODAL                                  -->
<!-- ============================================== -->
{#if showPaymentModal && paymentItem}
  <div class="modal-overlay" onclick={() => showPaymentModal = false} role="dialog" aria-modal="true" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && (showPaymentModal = false)}>
    <div class="modal" onclick={(e) => e.stopPropagation()} role="document">
      <div class="modal-header">
        <h3>Catat Pembayaran</h3>
        <button class="btn btn-icon btn-ghost" onclick={() => showPaymentModal = false}>✕</button>
      </div>

      <p class="text-muted text-sm mb-4">
        <strong>{paymentItem.itemName}</strong> — Sisa belum dibayar: <strong class="text-warning">{formatRupiah(paymentItem.remaining)}</strong>
      </p>

      <div class="form-group mb-4">
        <label class="form-label" for="payTypeChoice">Jenis Pembayaran</label>
        <div class="pay-type-choices" id="payTypeChoice">
          {#each [['dp', 'DP / Uang Muka'], ['cicilan', 'Cicilan'], ['lunas', 'Pelunasan']] as [val, label]}
            <button
              class="choice-btn-sm {payType === val ? 'active' : ''}"
              onclick={() => payType = val as typeof payType}
            >{label}</button>
          {/each}
        </div>
      </div>

      <div class="form-group mb-4">
        <label class="form-label" for="payAmount">Nominal</label>
        <div class="currency-input-wrapper">
          <span class="currency-prefix">Rp</span>
          <input id="payAmount" type="text" class="form-input"
            value={payAmount.toLocaleString('id-ID')}
            oninput={(e) => payAmount = parseInt((e.target as HTMLInputElement).value.replace(/\D/g,''),10)||0}
          />
        </div>
      </div>

      <div class="grid-2 mb-4">
        <div class="form-group">
          <label class="form-label" for="payDueDate">Jatuh Tempo</label>
          <input id="payDueDate" type="date" class="form-input" bind:value={payDueDate} />
        </div>
        <div class="form-group">
          <label class="form-label" for="payPaidAt">Tanggal Bayar</label>
          <input id="payPaidAt" type="date" class="form-input" bind:value={payPaidAt} />
        </div>
      </div>

      <div class="form-group mb-6">
        <label class="form-label" for="payNotes">Catatan (opsional)</label>
        <input id="payNotes" type="text" class="form-input" bind:value={payNotes} placeholder="Transfer BCA, No. kwitansi, dll." />
      </div>

      <div class="flex gap-3">
        <button class="btn btn-secondary flex-1" onclick={() => showPaymentModal = false}>Batal</button>
        <button class="btn btn-primary flex-1" onclick={submitPayment} disabled={payAmount <= 0}>
          Simpan Pembayaran
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ============================================== -->
<!-- ADD CATEGORY MODAL                             -->
<!-- ============================================== -->
{#if showAddCategoryModal}
  <div class="modal-overlay" onclick={() => showAddCategoryModal = false} role="dialog" aria-modal="true" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && (showAddCategoryModal = false)}>
    <div class="modal" onclick={(e) => e.stopPropagation()} role="document">
      <div class="modal-header">
        <h3>Tambah Kategori Anggaran</h3>
        <button class="btn btn-icon btn-ghost" onclick={() => showAddCategoryModal = false}>✕</button>
      </div>

      <div class="form-group mb-4">
        <label class="form-label" for="newCatNameInput">Nama Kategori</label>
        <input
          id="newCatNameInput"
          type="text"
          class="form-input"
          bind:value={newCatName}
          placeholder="Misal: Seserahan, Honeymoon, Photobooth"
          autofocus
        />
      </div>

      <div class="form-group mb-4">
        <label class="form-label">Pilih Icon</label>
        <div class="icon-picker-grid">
          {#each availableIcons as icon}
            <button
              class="icon-pick-btn {newCatIcon === icon ? 'active' : ''}"
              onclick={() => newCatIcon = icon}
              type="button"
            >
              {icon}
            </button>
          {/each}
        </div>
      </div>

      <div class="form-group mb-6">
        <label class="form-label">Pilih Aksen Warna</label>
        <div class="color-picker-row">
          {#each availableColors as col}
            <button
              class="color-pick-circle {newCatColor === col ? 'active' : ''}"
              style="background: {col}"
              onclick={() => newCatColor = col}
              type="button"
              aria-label="Pilih warna {col}"
            ></button>
          {/each}
        </div>
      </div>

      <div class="flex gap-3">
        <button class="btn btn-secondary flex-1" onclick={() => showAddCategoryModal = false}>Batal</button>
        <button class="btn btn-primary flex-1" onclick={handleAddCategorySubmit} disabled={!newCatName.trim()}>
          Tambahkan
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Header & Summary */
  .page-header {
    background: white;
    border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-8) 0 var(--space-8);
  }

  .page-header-inner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
  }

  .header-actions { display: flex; gap: var(--space-2); }

  .summary-bar {
    display: flex;
    align-items: center;
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--space-4) var(--space-6);
    border: 1px solid var(--color-border-light);
    box-shadow: var(--shadow-sm);
    flex-wrap: wrap;
    gap: var(--space-6);
  }

  .summary-stat {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 110px;
  }

  .summary-stat-label { font-size: var(--font-size-xs); color: var(--color-text-subtle); font-weight: 500; }
  .summary-stat-value { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-text); }
  .summary-divider { width: 1px; height: 36px; background: var(--color-border-light); }

  .progress-bar {
    height: 8px;
    background: var(--color-border-light);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), var(--color-success));
    border-radius: var(--radius-full);
    transition: width 0.4s ease;
  }

  /* View Switcher Tabs */
  .budget-content-area {
    margin-top: var(--space-8);
    padding-bottom: var(--space-16);
  }

  .view-tabs {
    display: inline-flex;
    background: rgba(139, 94, 82, 0.08);
    padding: 4px;
    border-radius: var(--radius-full);
    gap: 4px;
  }

  .view-tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: var(--radius-full);
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .view-tab-btn:hover {
    color: var(--color-accent);
  }

  .view-tab-btn.active {
    background: white;
    color: var(--color-accent);
    box-shadow: 0 2px 6px rgba(139, 94, 82, 0.12);
  }

  .tab-icon { font-size: 1rem; }

  /* ========================================= */
  /* GRID VIEW STYLES                          */
  /* ========================================= */
  .grid-view-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--space-4);
  }

  .view-section-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text);
  }

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: var(--space-6);
  }

  .category-grid-card {
    display: flex;
    flex-direction: column;
    background: white;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-xl);
    padding: var(--space-5);
    text-align: left;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
  }

  .category-grid-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: var(--cat-color, var(--color-primary));
    opacity: 0.85;
    transition: height 0.2s ease;
  }

  .category-grid-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(139, 94, 82, 0.12);
    border-color: rgba(201, 132, 122, 0.4);
  }

  .category-grid-card:hover::before {
    height: 6px;
  }

  .card-top {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .card-icon-badge {
    width: 46px;
    height: 46px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .card-title-group {
    flex: 1;
    min-width: 0;
  }

  .card-cat-name {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-item-badge {
    font-size: 11px;
    color: var(--color-text-subtle);
    background: var(--color-surface);
    padding: 2px 8px;
    border-radius: var(--radius-full);
    display: inline-block;
    margin-top: 2px;
  }

  .card-budget-stats {
    background: var(--color-surface);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-xs);
  }

  .card-stat-label { color: var(--color-text-muted); }
  .card-stat-val { color: var(--color-text); }

  .card-progress-track {
    height: 6px;
    background: var(--color-border-light);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .card-progress-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 0.4s ease;
  }

  .card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border-light);
  }

  .card-cta-link {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-primary);
    transition: transform var(--transition-fast);
  }

  .category-grid-card:hover .card-cta-link {
    transform: translateX(4px);
  }

  /* Add Category Tile */
  .category-add-card {
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-xl);
    background: rgba(255, 255, 255, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-8) var(--space-4);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .category-add-card:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-xlight);
    transform: translateY(-2px);
  }

  .add-card-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    text-align: center;
  }

  .add-card-plus {
    width: 42px;
    height: 42px;
    border-radius: var(--radius-full);
    background: white;
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: var(--color-primary);
    font-weight: bold;
  }

  .add-card-title {
    font-weight: 600;
    font-size: var(--font-size-sm);
    color: var(--color-accent);
  }

  /* ========================================= */
  /* SINGLE CATEGORY DETAIL STYLES             */
  /* ========================================= */
  .single-cat-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .quick-category-pills {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
    max-width: 100%;
  }

  .pill-cat-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border-light);
    background: white;
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--transition-fast);
  }

  .pill-cat-btn:hover {
    background: var(--color-secondary);
    color: var(--color-accent);
  }

  .pill-cat-btn.active {
    background: var(--color-primary-xlight);
    border-color: var(--color-primary);
    color: var(--color-accent);
    font-weight: 600;
  }

  .cat-banner-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--color-border-light);
  }

  .cat-banner-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .cat-banner-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .cat-banner-icon {
    width: 54px;
    height: 54px;
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
  }

  .cat-banner-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .cat-banner-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .cat-summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--space-3);
  }

  .cat-stat-box {
    background: var(--color-surface);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .cat-stat-label { font-size: var(--font-size-xs); color: var(--color-text-subtle); }
  .cat-stat-value { font-size: var(--font-size-base); font-weight: 700; color: var(--color-text); }

  .cat-progress-bar {
    height: 8px;
    background: var(--color-border-light);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .cat-progress-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 0.4s ease;
  }

  .items-list-card {
    background: white;
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-light);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .empty-cat-items {
    background: white;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-12) var(--space-6);
    text-align: center;
  }

  /* ========================================= */
  /* ITEMS & ACCORDION (COMMON)                */
  /* ========================================= */
  .categories-list { display: flex; flex-direction: column; gap: var(--space-4); }

  .category-card {
    background: white;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-xs);
    transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
  }

  .category-card:hover {
    border-color: rgba(201, 132, 122, 0.4);
  }

  .category-card.open {
    box-shadow: var(--shadow-sm);
    border-color: var(--color-border);
  }

  .category-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px var(--space-6);
    background: white;
    border: none;
    cursor: pointer;
    text-align: left;
    gap: var(--space-4);
    font-family: var(--font-body);
    transition: background var(--transition-fast);
  }
  .category-header:hover {
    background: rgba(247, 240, 238, 0.35);
  }

  .category-left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  .category-color-dot {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }

  .category-icon {
    font-size: 1.25rem;
    line-height: 1;
  }

  .category-title-group {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .category-name {
    font-weight: 700;
    font-size: var(--font-size-base);
    color: var(--color-text);
    letter-spacing: -0.01em;
  }

  .category-count-badge {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-subtle);
    background: #FAF7F5;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-full);
    padding: 1px 8px;
    line-height: 1.3;
  }

  .category-right {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex-shrink: 0;
  }

  .category-progress-block {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .category-ratio-text {
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  .cat-paid-val { font-weight: 600; color: var(--color-text); }
  .cat-slash { color: var(--color-text-subtle); margin: 0 1px; }
  .cat-total-val { color: var(--color-text-muted); }

  .category-mini-progress {
    width: 76px;
    height: 6px;
    background: var(--color-border-light);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .category-mini-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 0.3s ease;
  }

  .cat-pct-pill {
    font-size: 11px;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: var(--radius-full);
    line-height: 1.3;
  }
  .cat-pct-pill.done {
    background: var(--color-success-bg, #E8F5E9);
    color: var(--color-success, #2E7D32);
  }
  .cat-pct-pill.partial {
    background: var(--color-warning-bg, #FFF3E0);
    color: var(--color-warning, #E65100);
  }
  .cat-pct-pill.zero {
    background: #F0ECE9;
    color: var(--color-text-subtle, #7A5850);
  }

  .category-header-total {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 84px;
  }
  .category-header-total-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-subtle);
    line-height: 1;
    margin-bottom: 2px;
  }
  .category-header-total-val {
    font-size: var(--font-size-sm);
    font-weight: 700;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  .category-chevron-wrapper {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-subtle);
    background: transparent;
    transition: all var(--transition-fast);
  }
  .category-header:hover .category-chevron-wrapper {
    background: rgba(0,0,0,0.04);
    color: var(--color-text);
  }
  .category-chevron-svg {
    transition: transform 0.25s ease;
  }
  .category-chevron-wrapper.open .category-chevron-svg {
    transform: rotate(180deg);
  }

  /* Table Container & Subtle Header */
  .items-list {
    border-top: 1px solid var(--color-border-light);
    background: white;
  }

  .items-list-card {
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-xl);
    overflow: hidden;
    background: white;
    box-shadow: var(--shadow-xs);
  }

  .items-table-header {
    display: grid;
    grid-template-columns: minmax(180px, 2.2fr) minmax(210px, 1.4fr) minmax(110px, 0.9fr) auto;
    align-items: center;
    padding: 8px var(--space-6);
    background: #FAF6F5;
    border-bottom: 1px solid var(--color-border-light);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-subtle);
    gap: var(--space-3);
  }

  .th-total {
    text-align: right;
  }

  .th-actions {
    text-align: right;
    min-width: 165px;
  }

  /* Item Row & Main Grid */
  .item-row {
    border-bottom: 1px solid var(--color-border-light);
    transition: background var(--transition-fast);
  }
  .item-row:last-child {
    border-bottom: none;
  }

  .item-main {
    display: grid;
    grid-template-columns: minmax(180px, 2.2fr) minmax(210px, 1.4fr) minmax(110px, 0.9fr) auto;
    align-items: center;
    padding: 10px var(--space-6);
    gap: var(--space-3);
    transition: background var(--transition-fast);
  }
  .item-main:hover {
    background: rgba(247, 240, 238, 0.35);
  }

  /* Col 1: Status & Name */
  .item-col-name {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }
  .status-dot.status-lunas { background: var(--color-success); }
  .status-dot.status-dp { background: var(--color-warning); }
  .status-dot.status-unpaid { background: #D5CBC7; }

  .item-name-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .item-name-input {
    font-weight: 600;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    outline: none;
    border-radius: var(--radius-sm);
    padding: 2px 5px;
    margin-left: -5px;
    transition: all var(--transition-fast);
    border: 1px dashed transparent;
    word-break: break-word;
    cursor: text;
  }
  .item-name-input:hover {
    background: white;
    border-color: var(--color-border);
  }
  .item-name-input:focus {
    background: white;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(201, 132, 122, 0.18);
  }

  .item-vendor-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--color-text-muted);
    background: #FAF7F5;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-full);
    padding: 1px 7px;
    width: fit-content;
  }

  /* Col 2: Calculation Control */
  .item-col-calc {
    display: flex;
    align-items: center;
  }

  .calc-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #FAF7F5;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: 3px 8px;
    transition: all var(--transition-fast);
  }
  .calc-pill:hover, .calc-pill:focus-within {
    background: white;
    border-color: var(--color-primary-light);
    box-shadow: 0 1px 4px rgba(201, 132, 122, 0.12);
  }

  .calc-field {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .calc-input {
    border: none;
    background: transparent;
    font-family: var(--font-numeric, inherit);
    font-variant-numeric: tabular-nums;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--color-text);
    padding: 2px 0;
    outline: none;
  }
  .calc-input:focus {
    color: var(--color-primary-dark);
  }

  .qty-input {
    width: 34px;
    text-align: center;
  }

  .price-input {
    width: 95px;
    text-align: right;
  }

  .calc-unit, .calc-currency {
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-subtle);
    user-select: none;
  }

  .calc-sep {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-subtle);
    user-select: none;
    padding: 0 1px;
  }

  /* Col 3: Total & Status */
  .item-col-total {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 3px;
    text-align: right;
  }

  .item-total-val {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  .item-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10.5px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: var(--radius-full);
    line-height: 1.2;
    white-space: nowrap;
  }
  .item-status-pill.status-lunas {
    background: var(--color-success-bg, #E8F5E9);
    color: var(--color-success, #2E7D32);
  }
  .item-status-pill.status-dp {
    background: var(--color-warning-bg, #FFF3E0);
    color: var(--color-warning, #E65100);
  }
  .item-status-pill.status-unpaid {
    background: #F0ECE9;
    color: var(--color-text-subtle, #7A5850);
  }

  .status-dot-inner {
    width: 5px;
    height: 5px;
    border-radius: var(--radius-full);
    background: currentColor;
  }

  /* Col 4: Action Buttons */
  .item-col-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 5px;
    min-width: 165px;
  }

  .item-act-btn {
    height: 30px;
    padding: 0 11px;
    font-size: 11.5px;
    font-weight: 600;
    font-family: var(--font-body);
    border-radius: var(--radius-full);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--transition-fast);
  }

  .act-pay {
    background: var(--color-secondary);
    color: var(--color-accent);
    border: 1px solid var(--color-border);
  }
  .act-pay:hover {
    background: var(--color-primary-xlight);
    border-color: var(--color-primary-light);
    color: var(--color-primary-dark);
  }

  .act-settle {
    background: transparent;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border-light);
  }
  .act-settle:hover {
    background: var(--color-success-bg, #E8F5E9);
    color: var(--color-success, #2E7D32);
    border-color: rgba(46, 125, 50, 0.25);
  }

  .item-act-icon {
    width: 30px;
    height: 30px;
    border-radius: var(--radius-full);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--color-border-light);
    color: var(--color-text-muted);
    cursor: pointer;
    padding: 0;
    transition: all var(--transition-fast);
  }
  .item-act-icon:hover {
    background: var(--color-surface);
    color: var(--color-text);
    border-color: var(--color-border);
  }
  .item-act-icon.open {
    background: var(--color-secondary);
    color: var(--color-accent);
  }

  .act-delete:hover {
    background: var(--color-danger-bg);
    color: var(--color-danger);
    border-color: rgba(192, 86, 90, 0.3);
  }

  .chevron-arrow {
    transition: transform 0.2s ease;
  }
  .chevron-arrow.rotated {
    transform: rotate(180deg);
  }

  /* Item Detail Section */
  .item-detail {
    padding: var(--space-4) var(--space-6) var(--space-5);
    background: #FAF7F5;
    border-top: 1px solid var(--color-border-light);
  }

  .payments-list { display: flex; flex-direction: column; gap: var(--space-2); }

  .payment-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: var(--space-2) var(--space-3);
    background: white;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
  }

  .payment-left { display: flex; align-items: center; gap: var(--space-2); }
  .payment-right { text-align: right; }

  .payment-summary {
    background: white;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .empty-payments-notice {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) 0;
  }

  .btn-link-action {
    background: none;
    border: none;
    color: var(--color-primary);
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    font-family: var(--font-body);
  }
  .btn-link-action:hover {
    color: var(--color-primary-dark);
  }

  .text-success { color: var(--color-success); }
  .text-warning { color: var(--color-warning); }

  .add-item-btn {
    width: 100%;
    padding: 11px var(--space-4);
    background: rgba(247, 240, 238, 0.4);
    border: none;
    border-top: 1px dashed var(--color-border-light);
    color: var(--color-accent);
    font-size: var(--font-size-sm);
    font-weight: 600;
    cursor: pointer;
    font-family: var(--font-body);
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .add-item-btn:hover {
    background: var(--color-primary-xlight);
    color: var(--color-primary-dark);
  }
  .add-plus-icon {
    font-size: 15px;
    font-weight: 700;
  }
  .empty-page {
    text-align: center;
    padding: var(--space-20) 0;
    display: flex; flex-direction: column; align-items: center;
  }

  .empty-icon { font-size: 4rem; margin-bottom: var(--space-4); }

  /* Modals */
  .pay-type-choices { display: flex; gap: var(--space-2); flex-wrap: wrap; }

  .choice-btn-sm {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    font-size: var(--font-size-sm); font-weight: 500;
    color: var(--color-text-muted); cursor: pointer;
    transition: all var(--transition-fast); font-family: var(--font-body);
  }

  .choice-btn-sm.active {
    background: var(--color-primary-xlight);
    border-color: var(--color-primary);
    color: var(--color-accent);
    font-weight: 600;
  }

  .icon-picker-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-2);
  }

  .icon-pick-btn {
    font-size: 1.5rem;
    padding: var(--space-2);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .icon-pick-btn.active {
    background: var(--color-primary-xlight);
    border-color: var(--color-primary);
    transform: scale(1.08);
  }

  .color-picker-row {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .color-pick-circle {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-full);
    border: 2px solid white;
    box-shadow: 0 0 0 1px var(--color-border);
    cursor: pointer;
    transition: transform var(--transition-fast);
  }

  .color-pick-circle.active {
    transform: scale(1.2);
    box-shadow: 0 0 0 2.5px var(--color-accent);
  }

  @media (max-width: 768px) {
    .items-table-header { display: none; }
    .item-main {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-areas:
        "name name"
        "calc calc"
        "total actions";
      padding: var(--space-3) var(--space-4);
      gap: var(--space-2) var(--space-3);
      align-items: center;
    }
    .item-col-name { grid-area: name; }
    .item-col-calc { grid-area: calc; margin-bottom: 2px; }
    .calc-pill { width: 100%; justify-content: space-between; box-sizing: border-box; }
    .price-input { width: 110px; }
    .item-col-total { grid-area: total; align-items: flex-start; text-align: left; }
    .item-col-actions { grid-area: actions; justify-content: flex-end; min-width: auto; }
    .category-header { padding: var(--space-3) var(--space-4); }
    .summary-bar { gap: var(--space-3); padding: var(--space-3) var(--space-4); }
    .summary-divider { display: none; }
    .categories-grid { grid-template-columns: 1fr; }
    .cat-banner-header { flex-direction: column; align-items: flex-start; }
    .cat-banner-actions { width: 100%; justify-content: space-between; }
    .single-cat-nav { flex-direction: column; align-items: stretch; }
  }
</style>
