<script lang="ts">
  import { onMount } from 'svelte';
  import {
    wedding,
    rundownSummary,
    addRundownItem,
    updateRundownItem,
    deleteRundownItem,
    reorderRundownItems,
    resetRundownsToDefault,
    hydrateWeddingFromDb,
    type RundownItem
  } from '#lib/stores/wedding';
  import { formatDate } from '#lib/utils/format';

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
  let activeSessionTab = $state('Semua');
  let searchQuery = $state('');
  let showModal = $state(false);
  let isEditing = $state(false);
  let editId = $state<string | null>(null);

  // Form State
  let formSession = $state('Akad Nikah');
  let formStartTime = $state('08:00');
  let formEndTime = $state('08:30');
  let formTitle = $state('');
  let formDescription = $state('');
  let formPic = $state('');
  let formLocation = $state('');

  const commonSessions = ['Akad Nikah', 'Resepsi', 'Gladi Resik & TM', 'Siraman / Adat', 'Lainnya'];

  const rs = $derived($rundownSummary);
  const items = $derived($wedding.rundowns || []);

  const allSessions = $derived(['Semua', ...new Set(items.map((i) => i.session))]);

  const filteredItems = $derived(() => {
    return items
      .filter((item) => {
        const matchSession = activeSessionTab === 'Semua' || item.session === activeSessionTab;
        const matchSearch =
          !searchQuery ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchSession && matchSearch;
      })
      .sort((a, b) => a.order - b.order || a.startTime.localeCompare(b.startTime));
  });

  function openAddModal() {
    isEditing = false;
    editId = null;
    formSession = activeSessionTab === 'Semua' ? 'Akad Nikah' : activeSessionTab;
    formStartTime = '08:00';
    formEndTime = '08:30';
    formTitle = '';
    formDescription = '';
    formPic = '';
    formLocation = '';
    showModal = true;
  }

  function openEditModal(item: RundownItem) {
    isEditing = true;
    editId = item.id;
    formSession = item.session;
    formStartTime = item.startTime;
    formEndTime = item.endTime;
    formTitle = item.title;
    formDescription = item.description;
    formPic = item.pic;
    formLocation = item.location;
    showModal = true;
  }

  async function handleSaveRundown() {
    if (!formTitle.trim()) return;

    if (isEditing && editId) {
      const updates = {
        session: formSession.trim(),
        startTime: formStartTime.trim(),
        endTime: formEndTime.trim(),
        title: formTitle.trim(),
        description: formDescription.trim(),
        pic: formPic.trim(),
        location: formLocation.trim(),
      };
      updateRundownItem(editId, updates);

      try {
        await fetch('/api/rundown', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...updates }),
        });
      } catch (err) {
        console.error('Error updating rundown to DB:', err);
      }
    } else {
      const newItem = addRundownItem({
        session: formSession.trim(),
        startTime: formStartTime.trim(),
        endTime: formEndTime.trim(),
        title: formTitle.trim(),
        description: formDescription.trim(),
        pic: formPic.trim(),
        location: formLocation.trim(),
      });

      try {
        await fetch('/api/rundown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        });
      } catch (err) {
        console.error('Error inserting rundown to DB:', err);
      }
    }

    showModal = false;
  }

  async function handleDeleteRundown(id: string, title: string) {
    if (!confirm(`Hapus mata acara "${title}" dari susunan rundown?`)) return;
    deleteRundownItem(id);
    try {
      await fetch(`/api/rundown?id=${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error deleting rundown from DB:', err);
    }
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    const list = [...filteredItems()];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    reorderRundownItems(list);
  }

  function handleResetTemplate() {
    if (confirm('Muat ulang template rundown standar pernikahan (Akad & Resepsi)?')) {
      resetRundownsToDefault();
    }
  }

  function handlePrint() {
    window.print();
  }
</script>

<svelte:head>
  <title>Rundown & Susunan Acara Pernikahan | Nikahku</title>
</svelte:head>

<div class="rundown-page animate-fade-in">
  <div class="container">
    <!-- Header (Hidden on print) -->
    <div class="page-header no-print">
      <div class="header-left">
        <div class="badge-tag mb-2">
          <span>⏱️ Itinerary & Timeline</span>
        </div>
        <h1 class="page-title">Susunan Acara (Rundown)</h1>
        <p class="page-subtitle">
          Rancang jadwal hari bahagia detik demi detik bersama panitia, WO, dan pemegang tanggung jawab.
        </p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" onclick={handlePrint} title="Cetak atau Simpan PDF">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          <span>Cetak / PDF</span>
        </button>
        <button class="btn btn-secondary" onclick={handleResetTemplate} title="Gunakan template standar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          <span class="hide-mobile">Template Standar</span>
        </button>
        <button class="btn btn-primary" onclick={openAddModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Tambah Acara</span>
        </button>
      </div>
    </div>

    <!-- Print Only Header -->
    <div class="print-header only-print">
      <h2>RUNDOWN SUSUNAN ACARA PERNIKAHAN</h2>
      <h3>{$wedding.info.groomName || 'Pengantin'} & {$wedding.info.brideName || 'Pengantin'}</h3>
      <p>Tanggal: {$wedding.info.weddingDate ? formatDate($wedding.info.weddingDate) : '-'}</p>
    </div>

    <!-- Session Tabs (Hidden on print) -->
    <div class="session-tabs-bar no-print mb-6">
      <div class="tabs-scroll">
        {#each allSessions as sess}
          <button
            class="session-tab-btn {activeSessionTab === sess ? 'active' : ''}"
            onclick={() => activeSessionTab = sess}
          >
            <span>{sess}</span>
            <span class="tab-badge">
              {sess === 'Semua' ? items.length : items.filter(i => i.session === sess).length}
            </span>
          </button>
        {/each}
      </div>

      <div class="rundown-search">
        <input
          type="text"
          class="form-input text-xs"
          placeholder="Cari aktivitas, PIC, lokasi..."
          bind:value={searchQuery}
        />
      </div>
    </div>

    <!-- Timeline List -->
    {#if filteredItems().length === 0}
      <div class="empty-state-card no-print">
        <div class="empty-icon">⏱️</div>
        <h3>Belum ada mata acara</h3>
        <p class="text-muted">
          Tambahkan jadwal acara pertama Anda atau gunakan template susunan acara lengkap.
        </p>
        <div class="mt-4 flex gap-3 justify-center">
          <button class="btn btn-secondary" onclick={handleResetTemplate}>Muat Template Akad & Resepsi</button>
          <button class="btn btn-primary" onclick={openAddModal}>+ Tambah Agenda Acara</button>
        </div>
      </div>
    {:else}
      <div class="timeline-container">
        {#each filteredItems() as item, idx (item.id)}
          <div class="timeline-row">
            <!-- Time Indicator -->
            <div class="timeline-time-col">
              <div class="time-badge">
                <span class="time-start">{item.startTime}</span>
                <span class="time-sep">-</span>
                <span class="time-end">{item.endTime}</span>
              </div>
              <div class="timeline-line"></div>
            </div>

            <!-- Content Card -->
            <div class="timeline-content-card card">
              <div class="content-header">
                <div class="header-titles">
                  <span class="session-tag">{item.session}</span>
                  <h4 class="event-title">{item.title}</h4>
                </div>
                <div class="header-tools no-print">
                  <button
                    class="btn-icon btn-ghost btn-sm"
                    title="Pindahkan ke atas"
                    disabled={idx === 0}
                    onclick={() => moveItem(idx, 'up')}
                  >↑</button>
                  <button
                    class="btn-icon btn-ghost btn-sm"
                    title="Pindahkan ke bawah"
                    disabled={idx === filteredItems().length - 1}
                    onclick={() => moveItem(idx, 'down')}
                  >↓</button>
                  <button
                    class="btn-icon btn-ghost btn-sm"
                    title="Edit Acara"
                    onclick={() => openEditModal(item)}
                  >✏️</button>
                  <button
                    class="btn-icon btn-ghost btn-sm text-danger"
                    title="Hapus Acara"
                    onclick={() => handleDeleteRundown(item.id, item.title)}
                  >🗑️</button>
                </div>
              </div>

              {#if item.description}
                <p class="event-desc">{item.description}</p>
              {/if}

              <div class="event-meta-row mt-3">
                {#if item.pic}
                  <div class="meta-item pic-item">
                    <span class="meta-label">👤 PIC:</span>
                    <span class="meta-val font-semibold">{item.pic}</span>
                  </div>
                {/if}

                {#if item.location}
                  <div class="meta-item loc-item">
                    <span class="meta-label">📍 Lokasi:</span>
                    <span class="meta-val">{item.location}</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Modal Add/Edit Rundown -->
{#if showModal}
  <div class="modal-overlay animate-fade-in no-print" onclick={() => showModal = false} role="dialog" aria-modal="true">
    <div class="modal card max-w-lg" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3 class="modal-title">{isEditing ? 'Edit Jadwal Acara' : 'Tambah Agenda Acara Baru'}</h3>
        <button class="btn-icon btn-ghost" onclick={() => showModal = false}>✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group mb-3">
          <label class="form-label" for="rdSession">Sesi / Bagian Acara *</label>
          <div class="session-presets mb-2">
            {#each commonSessions as cs}
              <button
                type="button"
                class="chip {formSession === cs ? 'active' : ''}"
                onclick={() => formSession = cs}
              >{cs}</button>
            {/each}
          </div>
          <input
            id="rdSession"
            type="text"
            class="form-input text-xs"
            placeholder="Atau ketik nama sesi custom..."
            bind:value={formSession}
          />
        </div>

        <div class="grid-2 mb-3">
          <div class="form-group">
            <label class="form-label" for="rdStart">Waktu Mulai *</label>
            <input
              id="rdStart"
              type="time"
              class="form-input"
              bind:value={formStartTime}
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="rdEnd">Waktu Selesai *</label>
            <input
              id="rdEnd"
              type="time"
              class="form-input"
              bind:value={formEndTime}
            />
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label" for="rdTitle">Judul Kegiatan / Acara *</label>
          <input
            id="rdTitle"
            type="text"
            class="form-input"
            placeholder="Misal: Kedatangan Rombongan CPP & Pengalungan Melati"
            bind:value={formTitle}
          />
        </div>

        <div class="grid-2 mb-3">
          <div class="form-group">
            <label class="form-label" for="rdPic">Penanggung Jawab (PIC)</label>
            <input
              id="rdPic"
              type="text"
              class="form-input"
              placeholder="Misal: MC Dodi & WO Tim 1"
              bind:value={formPic}
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="rdLoc">Lokasi / Tempat</label>
            <input
              id="rdLoc"
              type="text"
              class="form-input"
              placeholder="Misal: Foyer Depan / Meja Akad"
              bind:value={formLocation}
            />
          </div>
        </div>

        <div class="form-group mb-4">
          <label class="form-label" for="rdDesc">Rincian Teknis & Instruksi Khusus</label>
          <textarea
            id="rdDesc"
            class="form-textarea"
            rows="3"
            placeholder="Detail alur, aba-aba musik, lighting, posisi keluarga inti..."
            bind:value={formDescription}
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick={() => showModal = false}>Batal</button>
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleSaveRundown}
          disabled={!formTitle.trim()}
        >
          {isEditing ? 'Simpan Perubahan' : 'Tambahkan ke Rundown'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Session Tabs */
  .session-tabs-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    background: var(--color-surface);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border-light);
    flex-wrap: wrap;
  }

  .tabs-scroll {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
  }

  .session-tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-muted);
    background: none;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--transition-fast);
  }

  .session-tab-btn:hover {
    color: var(--color-text);
    background: var(--color-surface-hover);
  }

  .session-tab-btn.active {
    background: var(--color-accent);
    color: #fff;
    font-weight: 600;
  }

  .tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 10.5px;
    border-radius: var(--radius-full);
    background: rgba(0, 0, 0, 0.08);
  }
  .session-tab-btn.active .tab-badge {
    background: rgba(255, 255, 255, 0.25);
    color: #fff;
  }

  .rundown-search {
    min-width: 220px;
  }

  /* Timeline */
  .timeline-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .timeline-row {
    display: flex;
    gap: var(--space-6);
    position: relative;
  }

  .timeline-time-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 110px;
    flex-shrink: 0;
  }

  .time-badge {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 6px 10px;
    font-family: var(--font-mono, monospace);
    font-size: 12.5px;
    font-weight: 700;
    color: var(--color-accent);
    display: flex;
    align-items: center;
    gap: 4px;
    box-shadow: 0 1px 3px rgba(139, 94, 82, 0.05);
    z-index: 1;
  }

  .timeline-line {
    flex: 1;
    width: 2px;
    background: var(--color-border-light);
    margin-top: 8px;
  }

  .timeline-content-card {
    flex: 1;
    padding: var(--space-5);
    border-left: 3px solid var(--color-accent);
  }

  .content-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .session-tag {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-accent);
    letter-spacing: 0.03em;
    margin-bottom: 2px;
  }

  .event-title {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .header-tools {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .event-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: var(--space-2) 0 0;
    line-height: 1.5;
  }

  .event-meta-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-4);
    padding-top: var(--space-2);
    border-top: 1px dashed var(--color-border-light);
    font-size: var(--font-size-xs);
  }

  .meta-label {
    color: var(--color-text-subtle);
  }

  .meta-val {
    color: var(--color-text);
  }

  .session-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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

  .only-print {
    display: none;
  }

  /* Print Styles */
  @media print {
    .no-print {
      display: none !important;
    }
    .only-print {
      display: block !important;
    }
    .print-header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #333;
    }
    .print-header h2 {
      font-size: 18pt;
      margin: 0;
    }
    .print-header h3 {
      font-size: 14pt;
      margin: 5px 0;
      color: #555;
    }
    .timeline-container {
      gap: 12px;
    }
    .timeline-row {
      gap: 12px;
      page-break-inside: avoid;
    }
    .timeline-line {
      display: none;
    }
    .timeline-time-col {
      width: 90px;
    }
    .time-badge {
      border: 1px solid #999;
      box-shadow: none;
      font-size: 10pt;
    }
    .timeline-content-card {
      border: 1px solid #ccc !important;
      border-left: 4px solid #333 !important;
      box-shadow: none !important;
      padding: 10px !important;
    }
    body {
      background: #fff !important;
      color: #000 !important;
    }
  }

  @media (max-width: 640px) {
    .timeline-row {
      flex-direction: column;
      gap: var(--space-2);
    }
    .timeline-time-col {
      width: auto;
      align-items: flex-start;
    }
    .timeline-line {
      display: none;
    }
  }
</style>
