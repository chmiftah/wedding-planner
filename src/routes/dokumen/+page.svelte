<script lang="ts">
  import {
    wedding,
    documentSummary,
    toggleDocument,
    addDocument,
    updateDocument,
    deleteDocument,
    resetDocumentsToDefault,
    type DocumentItem
  } from '#lib/stores/wedding';
  import { formatDate } from '#lib/utils/format';

  // --- Active Tab & Filter States ---
  let activeTab = $state<'wanita' | 'pria' | 'bersama' | 'semua'>('wanita');
  let filterStatus = $state<'all' | 'pending' | 'completed'>('all');
  let searchQuery = $state('');

  // --- Modals State ---
  let showModal = $state(false);
  let isEditing = $state(false);
  let editId = $state<string | null>(null);

  // --- Form State ---
  let formTitle = $state('');
  let formParty = $state<'wanita' | 'pria' | 'bersama'>('wanita');
  let formNotes = $state('');
  let formDueDate = $state('');

  // --- Inline Quick Add State ---
  let quickTitle = $state('');

  // --- Toast Notification ---
  let toastMsg = $state<string | null>(null);
  let toastTimer: any = null;

  function showToast(message: string) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMsg = message;
    toastTimer = setTimeout(() => {
      toastMsg = null;
    }, 2800);
  }

  const ds = $derived($documentSummary);

  // Filtered Documents
  const filteredDocuments = $derived(() => {
    return ($wedding.documents || []).filter((doc) => {
      const matchParty = activeTab === 'semua' || doc.forParty === activeTab;
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'completed' && doc.completed) ||
        (filterStatus === 'pending' && !doc.completed);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        (doc.notes && doc.notes.toLowerCase().includes(q));

      return matchParty && matchStatus && matchSearch;
    });
  });

  function openAddModal(defaultParty: 'wanita' | 'pria' | 'bersama' = 'wanita') {
    isEditing = false;
    editId = null;
    formTitle = '';
    formParty = activeTab === 'semua' ? defaultParty : activeTab;
    formNotes = '';
    formDueDate = '';
    showModal = true;
  }

  function openEditModal(doc: DocumentItem) {
    isEditing = true;
    editId = doc.id;
    formTitle = doc.title;
    formParty = doc.forParty;
    formNotes = doc.notes || '';
    formDueDate = doc.dueDate || '';
    showModal = true;
  }

  function handleSaveDocument() {
    if (!formTitle.trim()) return;

    if (isEditing && editId) {
      updateDocument(editId, {
        title: formTitle.trim(),
        forParty: formParty,
        notes: formNotes.trim(),
        dueDate: formDueDate || undefined,
      });
      showToast(`Dokumen "${formTitle.trim()}" berhasil diperbarui.`);
    } else {
      addDocument({
        title: formTitle.trim(),
        forParty: formParty,
        completed: false,
        order: ($wedding.documents || []).length + 1,
        notes: formNotes.trim(),
        dueDate: formDueDate || undefined,
      });
      showToast(`Dokumen baru berhasil ditambahkan!`);
    }

    showModal = false;
  }

  function handleQuickAdd() {
    if (!quickTitle.trim()) return;
    const targetParty = activeTab === 'semua' ? 'wanita' : activeTab;
    addDocument({
      title: quickTitle.trim(),
      forParty: targetParty,
      completed: false,
      order: ($wedding.documents || []).length + 1,
      notes: '',
    });
    showToast(`"${quickTitle.trim()}" ditambahkan.`);
    quickTitle = '';
  }

  function handleToggle(doc: DocumentItem) {
    toggleDocument(doc.id);
    if (!doc.completed) {
      showToast(`✓ "${doc.title}" ditandai sudah lengkap!`);
    } else {
      showToast(`"${doc.title}" ditandai belum lengkap.`);
    }
  }

  function handleDelete(doc: DocumentItem) {
    if (confirm(`Hapus syarat "${doc.title}" dari daftar?`)) {
      deleteDocument(doc.id);
      showToast(`Dokumen telah dihapus.`);
    }
  }

  function handleReset() {
    if (confirm('Kembalikan daftar syarat dokumen ke 15 template resmi KUA Indonesia?')) {
      resetDocumentsToDefault();
      showToast('Daftar dokumen berhasil direset ke standar KUA.');
    }
  }

  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  function getPartyBadge(party: string) {
    if (party === 'wanita') return { label: 'Mempelai Wanita', class: 'badge-wanita' };
    if (party === 'pria') return { label: 'Mempelai Pria', class: 'badge-pria' };
    return { label: 'Dokumen Bersama', class: 'badge-bersama' };
  }
</script>

<svelte:head>
  <title>Dokumen & Syarat Nikah — Nikahku</title>
</svelte:head>

<!-- Toast Notification -->
{#if toastMsg}
  <div class="toast-notification animate-slide-up" role="status">
    <span class="toast-dot"></span>
    <span>{toastMsg}</span>
  </div>
{/if}

<div class="container">
  <!-- Page Header -->
  <div class="page-header">
    <div class="header-left">
      <div class="badge-tag mb-2">
        <span>📋 Berkas & Administrasi Pernikahan</span>
      </div>
      <h1 class="page-title">Dokumen & Syarat Nikah</h1>
      <p class="page-subtitle">
        Checklist 15 syarat resmi pendaftaran nikah dari Kelurahan dan KUA untuk calon pengantin wanita dan pria.
      </p>
    </div>

    <div class="header-actions">
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        onclick={handlePrint}
        title="Cetak lembar checklist untuk dibawa saat mengurus berkas"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        <span>Cetak / Print</span>
      </button>

      <button
        type="button"
        class="btn btn-secondary btn-sm"
        onclick={handleReset}
        title="Kembalikan ke 15 syarat standar resmi KUA"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2.5 2v6h6M21.5 22v-6h-6"></path>
          <path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"></path>
        </svg>
        <span>Reset Template</span>
      </button>

      <button
        type="button"
        class="btn btn-primary btn-sm"
        onclick={() => openAddModal()}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>+ Tambah Syarat</span>
      </button>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="stats-grid mt-6">
        <!-- Card Total -->
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-terracotta-soft">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Persyaratan</span>
            <span class="stat-value">{ds.total} <small class="text-subtle font-normal">berkas</small></span>
            <span class="stat-sub">{ds.completed} siap • {ds.remaining} belum</span>
          </div>
        </div>

        <!-- Card Wanita -->
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-rose-soft">
            👰
          </div>
          <div class="stat-info">
            <span class="stat-label">Mempelai Wanita</span>
            <span class="stat-value text-rose">{ds.wanitaCompleted} / {ds.wanitaTotal}</span>
            <div class="stat-progress-sub">
              <div class="mini-progress-bar">
                <div class="mini-fill bg-rose" style="width: {ds.wanitaPercent}%"></div>
              </div>
              <span class="mini-percent-text">{ds.wanitaPercent}% Siap</span>
            </div>
          </div>
        </div>

        <!-- Card Pria -->
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-blue-soft">
            🤵
          </div>
          <div class="stat-info">
            <span class="stat-label">Mempelai Pria</span>
            <span class="stat-value text-blue">{ds.priaCompleted} / {ds.priaTotal}</span>
            <div class="stat-progress-sub">
              <div class="mini-progress-bar">
                <div class="mini-fill bg-blue" style="width: {ds.priaPercent}%"></div>
              </div>
              <span class="mini-percent-text">{ds.priaPercent}% Siap</span>
            </div>
          </div>
        </div>

        <!-- Card Total Progress -->
        <div class="stat-card">
          <div class="stat-icon-wrapper bg-green-soft">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">Kesiapan Berkas</span>
            <span class="stat-value text-success">{ds.percent}%</span>
            <span class="stat-sub">
              {ds.percent === 100 ? '🎉 Seluruh berkas siap diajukan!' : `${ds.remaining} dokumen masih perlu dilengkapi`}
            </span>
          </div>
        </div>
      </div>

      <div class="mt-6">
    <!-- Main Navigation Tabs & Filter Bar (Clean, unboxed Toolbar) -->
    <div class="dokumen-toolbar mb-4">
      <!-- Party Tabs -->
      <div class="party-tabs">
        <button
          type="button"
          class="party-tab {activeTab === 'wanita' ? 'active' : ''}"
          onclick={() => (activeTab = 'wanita')}
        >
          <span class="tab-icon">👰</span>
          <span>Mempelai Wanita</span>
          <span class="tab-badge">{ds.wanitaCompleted}/{ds.wanitaTotal}</span>
        </button>

        <button
          type="button"
          class="party-tab {activeTab === 'pria' ? 'active' : ''}"
          onclick={() => (activeTab = 'pria')}
        >
          <span class="tab-icon">🤵</span>
          <span>Mempelai Pria</span>
          <span class="tab-badge">{ds.priaCompleted}/{ds.priaTotal}</span>
        </button>

        <button
          type="button"
          class="party-tab {activeTab === 'bersama' ? 'active' : ''}"
          onclick={() => (activeTab = 'bersama')}
        >
          <span class="tab-icon">📜</span>
          <span>Bersama & Khusus</span>
          <span class="tab-badge">{ds.bersamaCompleted}/{ds.bersamaTotal}</span>
        </button>

        <button
          type="button"
          class="party-tab {activeTab === 'semua' ? 'active' : ''}"
          onclick={() => (activeTab = 'semua')}
        >
          <span class="tab-icon">📋</span>
          <span>Semua Syarat</span>
          <span class="tab-badge">{ds.completed}/{ds.total}</span>
        </button>
      </div>

      <!-- Filter & Search Controls -->
      <div class="filter-controls">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="form-input search-input"
            placeholder="Cari syarat / dokumen..."
            bind:value={searchQuery}
          />
          {#if searchQuery}
            <button
              type="button"
              class="clear-search-btn"
              onclick={() => (searchQuery = '')}
              aria-label="Bersihkan pencarian"
            >✕</button>
          {/if}
        </div>

        <div class="status-pills">
          <button
            type="button"
            class="status-pill {filterStatus === 'all' ? 'active' : ''}"
            onclick={() => (filterStatus = 'all')}
          >
            Semua
          </button>
          <button
            type="button"
            class="status-pill {filterStatus === 'completed' ? 'active' : ''}"
            onclick={() => (filterStatus = 'completed')}
          >
            ✓ Siap
          </button>
          <button
            type="button"
            class="status-pill {filterStatus === 'pending' ? 'active' : ''}"
            onclick={() => (filterStatus = 'pending')}
          >
            ⏳ Belum
          </button>
        </div>
      </div>
    </div>

    <!-- Document Table Card (Unified Container) -->
    <div class="table-container-card">
      <!-- Integrated Card Header -->
      <div class="table-card-header">
        <div class="table-card-heading-left">
          <h2 class="table-card-title">
            {#if activeTab === 'wanita'}
              👰 CALON PENGANTIN WANITA
            {:else if activeTab === 'pria'}
              🤵 CALON PENGANTIN PRIA
            {:else if activeTab === 'bersama'}
              📜 DOKUMEN BERSAMA & BERKAS KHUSUS
            {:else}
              📋 SELURUH PERSYARATAN ADMINISTRASI NIKAH
            {/if}
          </h2>
          <p class="table-card-subtitle">
            {#if activeTab === 'wanita'}
              Persyaratan berkas dari pihak mempelai wanita untuk kelurahan dan KUA.
            {:else if activeTab === 'pria'}
              Persyaratan berkas dari pihak mempelai pria untuk kelurahan dan KUA.
            {:else if activeTab === 'bersama'}
              Surat numpang nikah, bukti Simkah, dan dokumen pendaftaran nikah.
            {:else}
              Daftar lengkap berkas persyaratan kedua calon mempelai.
            {/if}
          </p>
        </div>

        <div class="table-card-meta">
          <span class="doc-count-badge">Menampilkan {filteredDocuments().length} dari {ds.total} dokumen</span>
        </div>
      </div>

      <!-- Integrated Inline Quick-Add Row -->
      <div class="table-quick-add-bar">
        <span class="quick-add-icon">⚡</span>
        <input
          type="text"
          class="quick-add-input"
          placeholder="Tambah dokumen / syarat cepat... (Ketik judul lalu tekan Enter)"
          bind:value={quickTitle}
          onkeydown={(e) => e.key === 'Enter' && handleQuickAdd()}
        />
        <button
          type="button"
          class="btn btn-primary btn-sm quick-add-btn"
          onclick={handleQuickAdd}
          disabled={!quickTitle.trim()}
        >
          + Tambah Cepat
        </button>
      </div>
      <div class="table-responsive">
        <table class="dokumen-table">
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">NO</th>
              <th>PERSYARATAN / DOKUMEN</th>
              {#if activeTab === 'semua'}
                <th>PIHAK</th>
              {/if}
              <th>CATATAN / SUMBER BERKAS</th>
              <th style="width: 140px; text-align: center;">STATUS</th>
              <th style="width: 100px; text-align: right;" class="hide-print">AKSI</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredDocuments() as doc, idx (doc.id)}
              {@const party = getPartyBadge(doc.forParty)}
              <tr class="doc-row {doc.completed ? 'row-completed' : ''}">
                <!-- NO -->
                <td style="text-align: center;" class="row-num">
                  {idx + 1}
                </td>

                <!-- SYARAT -->
                <td>
                  <div class="doc-title-cell">
                    <label class="checkbox-container">
                      <input
                        type="checkbox"
                        checked={doc.completed}
                        onchange={() => handleToggle(doc)}
                      />
                      <span class="custom-checkmark"></span>
                    </label>

                    <div class="doc-title-block">
                      <span class="doc-title {doc.completed ? 'title-done' : ''}">{doc.title}</span>
                      {#if doc.dueDate}
                        <span class="doc-due-date">Target: {formatDate(doc.dueDate)}</span>
                      {/if}
                    </div>
                  </div>
                </td>

                <!-- PIHAK (Only when tab === 'semua') -->
                {#if activeTab === 'semua'}
                  <td>
                    <span class="party-badge {party.class}">{party.label}</span>
                  </td>
                {/if}

                <!-- CATATAN -->
                <td>
                  {#if doc.notes}
                    <span class="doc-notes-text">{doc.notes}</span>
                  {:else}
                    <span class="text-subtle text-xs">—</span>
                  {/if}
                </td>

                <!-- STATUS CHECKBOX / BADGE -->
                <td style="text-align: center;">
                  <button
                    type="button"
                    class="status-toggle-btn {doc.completed ? 'status-done' : 'status-pending'}"
                    onclick={() => handleToggle(doc)}
                    title="Klik untuk mengubah status"
                  >
                    {#if doc.completed}
                      <span class="status-icon">✓</span>
                      <span>Siap</span>
                    {:else}
                      <span class="status-icon">○</span>
                      <span>Belum</span>
                    {/if}
                  </button>
                </td>

                <!-- AKSI -->
                <td style="text-align: right;" class="hide-print">
                  <div class="row-actions">
                    <button
                      type="button"
                      class="action-btn edit-btn"
                      onclick={() => openEditModal(doc)}
                      title="Edit syarat & catatan"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>

                    <button
                      type="button"
                      class="action-btn delete-btn"
                      onclick={() => handleDelete(doc)}
                      title="Hapus syarat"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if filteredDocuments().length === 0}
        <div class="empty-filter-state">
          <p class="text-muted">Tidak ada dokumen yang cocok dengan filter atau pencarian.</p>
          <button
            type="button"
            class="btn btn-secondary btn-sm mt-2"
            onclick={() => { searchQuery = ''; filterStatus = 'all'; }}
          >
            Reset Filter
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- ============================================== -->
<!-- MODAL: TAMBAH / EDIT DOKUMEN                   -->
<!-- ============================================== -->
{#if showModal}
  <div class="modal-overlay" onclick={() => (showModal = false)}>
    <div class="modal modal-md" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <div>
          <h3 class="modal-title">{isEditing ? 'Edit Persyaratan' : 'Tambah Persyaratan Baru'}</h3>
          <p class="modal-subtitle">Atur berkas administrasi nikah dan catatan pengurusannya.</p>
        </div>
        <button type="button" class="btn-close-modal" onclick={() => (showModal = false)}>✕</button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); handleSaveDocument(); }}>
        <div class="modal-body">
          <div class="form-group mb-4">
            <label class="form-label" for="docTitle">Nama Syarat / Dokumen <span class="text-danger">*</span></label>
            <input
              id="docTitle"
              type="text"
              class="form-input"
              placeholder="Contoh: N1 - Surat Keterangan Untuk Nikah"
              bind:value={formTitle}
              required
            />
          </div>

          <div class="grid-2 mb-4">
            <div class="form-group">
              <label class="form-label" for="docParty">Pihak Mempelai</label>
              <select id="docParty" class="form-select" bind:value={formParty}>
                <option value="wanita">👰 Calon Pengantin Wanita</option>
                <option value="pria">🤵 Calon Pengantin Pria</option>
                <option value="bersama">📜 Dokumen Bersama / Khusus</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="docDueDate">Target Tanggal Selesai</label>
              <input
                id="docDueDate"
                type="date"
                class="form-input"
                bind:value={formDueDate}
              />
            </div>
          </div>

          <div class="form-group mb-2">
            <label class="form-label" for="docNotes">Catatan / Keterangan Berkas</label>
            <textarea
              id="docNotes"
              class="form-textarea"
              rows="3"
              placeholder="Contoh: Didapat dari Kelurahan, butuh 2 lembar fotocopy & materai 10.000"
              bind:value={formNotes}
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick={() => (showModal = false)}>
            Batal
          </button>
          <button type="submit" class="btn btn-primary" disabled={!formTitle.trim()}>
            {isEditing ? 'Simpan Perubahan' : 'Tambahkan Syarat'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  /* ========================================= */
  /* STATS CARDS & PROGRESS                    */
  /* ========================================= */

  /* ========================================= */
  /* STATS CARDS & PROGRESS                    */
  /* ========================================= */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
  }

  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4) var(--space-5);
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
    font-size: 1.4rem;
    flex-shrink: 0;
  }

  .bg-terracotta-soft { background: rgba(201, 132, 122, 0.15); color: var(--color-accent); }
  .bg-rose-soft { background: rgba(225, 29, 72, 0.12); color: #be123c; }
  .bg-blue-soft { background: rgba(37, 99, 235, 0.12); color: #1d4ed8; }
  .bg-green-soft { background: rgba(107, 171, 138, 0.15); color: #2e6949; }

  .text-rose { color: #be123c; }
  .text-blue { color: #1d4ed8; }

  .stat-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .stat-label {
    font-size: 11.5px;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .stat-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.2;
    margin: 2px 0;
  }

  .stat-sub {
    font-size: 11px;
    color: var(--color-text-subtle);
  }

  .stat-progress-sub {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 3px;
  }

  .mini-progress-bar {
    flex: 1;
    height: 6px;
    background: var(--color-border-light);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .mini-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .bg-rose { background: #e11d48; }
  .bg-blue { background: #2563eb; }

  .mini-percent-text {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  /* ========================================= */
  /* TOOLBAR & PARTY TABS                      */
  /* ========================================= */
  .dokumen-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .party-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #FAF3F0;
    border: 1px solid rgba(139, 94, 82, 0.12);
    padding: 4px;
    border-radius: var(--radius-full);
    flex-wrap: wrap;
  }

  .party-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-muted);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .party-tab:hover {
    color: var(--color-text);
  }

  .party-tab.active {
    background: #ffffff;
    color: var(--color-accent);
    font-weight: 700;
    box-shadow: 0 1px 4px rgba(139, 94, 82, 0.12);
  }

  .tab-badge {
    background: rgba(139, 94, 82, 0.1);
    color: var(--color-accent);
    font-size: 11px;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: var(--radius-full);
  }

  .filter-controls {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .search-box {
    position: relative;
    min-width: 220px;
  }

  .search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: var(--color-text-subtle);
  }

  .search-input {
    padding-left: 32px;
    padding-right: 28px;
    font-size: 13px;
    height: 38px;
    background: #ffffff;
    border-radius: var(--radius-full);
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
    font-size: 12px;
  }

  .status-pills {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #FAF3F0;
    border: 1px solid rgba(139, 94, 82, 0.12);
    padding: 4px;
    border-radius: var(--radius-full);
  }

  .status-pill {
    background: none;
    border: none;
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .status-pill:hover {
    color: var(--color-text);
  }

  .status-pill.active {
    background: #ffffff;
    color: var(--color-accent);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(139, 94, 82, 0.12);
  }

  /* ========================================= */
  /* DOCUMENT DATA TABLE CARD                  */
  /* ========================================= */
  .table-container-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: 0 2px 8px rgba(139, 94, 82, 0.05);
    overflow: hidden;
    margin-bottom: var(--space-8);
  }

  /* Integrated Card Header */
  .table-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(to right, #FAF3F0, #FFFDFD);
    border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-4) var(--space-6);
    gap: var(--space-4);
  }

  .table-card-title {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: 0.04em;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .table-card-subtitle {
    font-size: 12px;
    color: var(--color-text-muted);
    margin: 3px 0 0;
  }

  .doc-count-badge {
    display: inline-block;
    font-size: 11.5px;
    color: var(--color-accent);
    background: rgba(139, 94, 82, 0.08);
    font-weight: 600;
    padding: 4px 12px;
    border-radius: var(--radius-full);
    white-space: nowrap;
  }

  /* Integrated Quick-Add Bar */
  .table-quick-add-bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-6);
    background: #ffffff;
    border-bottom: 1px solid var(--color-border-light);
  }

  .table-quick-add-bar .quick-add-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
    color: #f59e0b;
  }

  .quick-add-input {
    flex: 1;
    height: 38px;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: 0 var(--space-3);
    font-size: 13px;
    background: #FAFAFA;
    transition: all var(--transition-fast);
  }

  .quick-add-input:focus {
    outline: none;
    border-color: var(--color-accent);
    background: #ffffff;
    box-shadow: 0 0 0 2px rgba(139, 94, 82, 0.1);
  }

  .quick-add-btn {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .dokumen-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
  }

  .dokumen-table th {
    background: #FAF3F0;
    color: var(--color-accent);
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 14px 18px;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    white-space: nowrap;
  }

  .dokumen-table td {
    padding: 15px 18px;
    border-bottom: 1px solid var(--color-border-light);
    vertical-align: middle;
  }

  .doc-row {
    transition: background var(--transition-fast);
  }

  .doc-row:hover {
    background: rgba(201, 132, 122, 0.04);
  }

  .row-completed {
    background: rgba(107, 171, 138, 0.03);
  }

  .row-num {
    font-weight: 600;
    color: var(--color-text-subtle);
    font-size: 12px;
  }

  /* Title & Custom Checkbox */
  .doc-title-cell {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .checkbox-container {
    position: relative;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
  }

  .checkbox-container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .custom-checkmark {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
  }

  .checkbox-container input:checked ~ .custom-checkmark {
    background: var(--color-success);
    border-color: var(--color-success);
  }

  .custom-checkmark:after {
    content: "✓";
    font-size: 12px;
    font-weight: 700;
    color: white;
    display: none;
  }

  .checkbox-container input:checked ~ .custom-checkmark:after {
    display: block;
  }

  .doc-title-block {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .doc-title {
    font-weight: 600;
    color: var(--color-text);
    font-size: 14px;
    line-height: 1.3;
  }

  .doc-title.title-done {
    color: var(--color-text-muted);
  }

  .doc-due-date {
    font-size: 11px;
    color: var(--color-primary);
    font-weight: 500;
    margin-top: 2px;
  }

  .doc-notes-text {
    font-size: 12.5px;
    color: var(--color-text-muted);
    line-height: 1.4;
  }

  /* Status Toggle Button */
  .status-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 600;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .status-done {
    background: var(--color-success-bg);
    color: #2e6949;
    border-color: rgba(107, 171, 138, 0.4);
  }

  .status-pending {
    background: #f1f5f9;
    color: var(--color-text-subtle);
    border-color: var(--color-border);
  }
  .status-pending:hover {
    background: var(--color-secondary);
    color: var(--color-accent);
  }

  .status-icon {
    font-size: 12px;
    font-weight: 700;
  }

  /* Party Badges */
  .party-badge {
    display: inline-flex;
    padding: 3px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }

  .badge-wanita { background: #ffe4e6; color: #be123c; }
  .badge-pria { background: #dbeafe; color: #1d4ed8; }
  .badge-bersama { background: #fef3c7; color: #92400e; }

  /* Row Actions */
  .row-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .action-btn {
    width: 30px;
    height: 30px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .edit-btn {
    color: var(--color-text-muted);
  }
  .edit-btn:hover {
    background: var(--color-secondary);
    color: var(--color-accent);
  }

  .delete-btn {
    color: var(--color-text-subtle);
  }
  .delete-btn:hover {
    background: var(--color-danger-bg);
    color: var(--color-danger);
    border-color: var(--color-danger-bg);
  }

  .empty-filter-state {
    padding: var(--space-8);
    text-align: center;
  }

  /* ========================================= */
  /* MODAL STYLES                              */
  /* ========================================= */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(44, 24, 16, 0.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
  }

  .modal {
    background: #FFFDFD;
    border-radius: var(--radius-xl);
    box-shadow: 0 20px 40px rgba(44, 24, 16, 0.18);
    max-height: 90vh;
    overflow-y: auto;
    width: 100%;
  }

  .modal-md { max-width: 560px; }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: var(--space-6) var(--space-6) var(--space-4);
    border-bottom: 1px solid var(--color-border-light);
  }

  .modal-title {
    font-family: var(--font-display);
    font-size: var(--font-size-xl);
    color: var(--color-text);
    margin: 0;
  }

  .modal-subtitle {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 3px 0 0;
  }

  .btn-close-modal {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--color-text-subtle);
    cursor: pointer;
    line-height: 1;
  }

  .modal-body {
    padding: var(--space-6);
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--color-border-light);
    background: #FAF6F4;
    border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  }

  /* Toast Notification */
  .toast-notification {
    position: fixed;
    bottom: 28px;
    right: 28px;
    background: var(--color-accent);
    color: #ffffff;
    padding: 12px 20px;
    border-radius: var(--radius-full);
    box-shadow: 0 8px 24px rgba(44, 24, 16, 0.2);
    font-size: 13.5px;
    font-weight: 500;
    z-index: 1100;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toast-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #86efac;
  }

  /* ========================================= */
  /* RESPONSIVE & PRINT VIEW                   */
  /* ========================================= */
  @media (max-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .dokumen-toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .party-tabs {
      flex-direction: column;
      align-items: stretch;
      border-radius: var(--radius-lg);
    }

    .filter-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .search-box {
      width: 100%;
    }

    .status-pills {
      justify-content: center;
    }
  }

  @media print {
    .hide-print,
    .page-header-section .header-actions,
    .dokumen-toolbar,
    .table-quick-add-bar,
    .toast-notification {
      display: none !important;
    }

    .dokumen-page {
      padding: 0;
    }

    .table-container-card {
      border: 1px solid #000;
      box-shadow: none;
    }

    .dokumen-table th,
    .dokumen-table td {
      border: 1px solid #333;
      padding: 8px 10px;
      color: #000 !important;
    }

    .status-toggle-btn {
      border: 1px solid #000;
    }
  }
</style>
