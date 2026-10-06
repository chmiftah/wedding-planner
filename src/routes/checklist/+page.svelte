<script lang="ts">
  import {
    wedding,
    addChecklistItem,
    updateChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    deleteCompletedChecklist,
    setAllChecklistCompleted,
    resetChecklistToDefault,
    hydrateWeddingFromDb,
    type ChecklistItem,
  } from '#lib/stores/wedding';
  import { formatDate } from '#lib/utils/format';
  import { exportChecklistToExcel } from '#lib/utils/exportExcel';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Hydrate dari database jika login
  $effect(() => {
    if (data?.weddingData) {
      hydrateWeddingFromDb(data.weddingData);
    }
  });

  // Modal State
  let showAddModal = $state(false);
  let showEditModal = $state(false);
  let showDeleteConfirmModal = $state(false);
  let showResetModal = $state(false);
  let itemToDelete = $state<ChecklistItem | null>(null);
  let editingItem = $state<ChecklistItem | null>(null);

  // Quick Add input
  let quickAddText = $state('');

  // Add Form Inputs
  let newText = $state('');
  let newDueDate = $state('');
  let newAssignee = $state('');
  let newCategory = $state('Venue & Dekorasi');
  let newPriority = $state<'rendah' | 'sedang' | 'tinggi'>('sedang');
  let newNotes = $state('');

  // Edit Form Inputs
  let editText = $state('');
  let editDueDate = $state('');
  let editAssignee = $state('');
  let editCategory = $state('');
  let editPriority = $state<'rendah' | 'sedang' | 'tinggi'>('sedang');
  let editNotes = $state('');
  let editCompleted = $state(false);

  // Filters & Search
  let searchQuery = $state('');
  let filterStatus = $state<'all' | 'pending' | 'done' | 'overdue'>('all');
  let filterCategory = $state('all');
  let filterPriority = $state<'all' | 'tinggi' | 'sedang' | 'rendah'>('all');
  let sortBy = $state<'dueDate' | 'priority' | 'category' | 'text'>('dueDate');
  let groupBy = $state<'category' | 'none'>('category');

  // Toast feedback
  let toastMsg = $state<string | null>(null);
  let toastTimeout: any;
  function showToast(msg: string) {
    toastMsg = msg;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastMsg = null;
    }, 3000);
  }

  const categories = [
    'Venue & Dekorasi',
    'Katering',
    'Rias & Busana',
    'Dokumentasi',
    'Musik & Hiburan',
    'Tamu & Undangan',
    'Undangan & Souvenir',
    'Administrasi',
    'Transportasi',
    'Lainnya',
  ];

  function isOverdue(dueDate: string, completed: boolean) {
    if (!dueDate || completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + 'T00:00:00');
    return due < today;
  }

  // --- CRUD: CREATE ---
  function openAddModal() {
    newText = '';
    newDueDate = '';
    newAssignee = '';
    newCategory = 'Venue & Dekorasi';
    newPriority = 'sedang';
    newNotes = '';
    showAddModal = true;
  }

  function handleCreateTask() {
    if (!newText.trim()) return;
    const item = addChecklistItem({
      text: newText.trim(),
      dueDate: newDueDate,
      assignee: newAssignee.trim(),
      category: newCategory,
      notes: newNotes.trim(),
      priority: newPriority,
    });

    // Background sync ke DB jika terdaftar
    try {
      fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      }).catch(() => {});
    } catch {}

    showAddModal = false;
    showToast('Tugas baru berhasil ditambahkan');
  }

  function handleQuickAdd() {
    if (!quickAddText.trim()) return;
    const item = addChecklistItem({
      text: quickAddText.trim(),
      dueDate: '',
      assignee: '',
      category: 'Lainnya',
      notes: '',
      priority: 'sedang',
    });

    try {
      fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      }).catch(() => {});
    } catch {}

    quickAddText = '';
    showToast('Tugas cepat berhasil ditambahkan');
  }

  // --- CRUD: UPDATE ---
  function openEditModal(item: ChecklistItem) {
    editingItem = item;
    editText = item.text;
    editDueDate = item.dueDate || '';
    editAssignee = item.assignee || '';
    editCategory = item.category || 'Lainnya';
    editPriority = item.priority || 'sedang';
    editNotes = item.notes || '';
    editCompleted = item.completed;
    showEditModal = true;
  }

  function handleSaveEdit() {
    if (!editingItem || !editText.trim()) return;
    const updates = {
      text: editText.trim(),
      dueDate: editDueDate,
      assignee: editAssignee.trim(),
      category: editCategory,
      priority: editPriority,
      notes: editNotes.trim(),
      completed: editCompleted,
    };

    updateChecklistItem(editingItem.id, updates);

    try {
      fetch('/api/checklist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingItem.id, ...updates }),
      }).catch(() => {});
    } catch {}

    showEditModal = false;
    editingItem = null;
    showToast('Tugas berhasil diperbarui');
  }

  function handleToggle(item: ChecklistItem) {
    toggleChecklistItem(item.id);
    const newCompleted = !item.completed;

    try {
      fetch('/api/checklist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, completed: newCompleted }),
      }).catch(() => {});
    } catch {}

    showToast(newCompleted ? 'Tugas ditandai selesai ✓' : 'Tugas dikembalikan ke pending');
  }

  function handleToggleAll(completed: boolean) {
    setAllChecklistCompleted(completed);
    showToast(completed ? 'Semua tugas ditandai selesai' : 'Semua tugas ditandai pending');
  }

  // --- CRUD: DELETE ---
  function promptDelete(item: ChecklistItem) {
    itemToDelete = item;
    showDeleteConfirmModal = true;
  }

  function confirmDelete() {
    if (!itemToDelete) return;
    const id = itemToDelete.id;
    deleteChecklistItem(id);

    try {
      fetch(`/api/checklist?id=${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {}

    showDeleteConfirmModal = false;
    itemToDelete = null;
    showToast('Tugas berhasil dihapus');
  }

  function handleDeleteCompleted() {
    if (confirm('Hapus semua tugas yang sudah selesai?')) {
      deleteCompletedChecklist();
      try {
        fetch('/api/checklist?action=deleteCompleted', { method: 'DELETE' }).catch(() => {});
      } catch {}
      showToast('Semua tugas selesai telah dibersihkan');
    }
  }

  function confirmReset() {
    resetChecklistToDefault();
    showResetModal = false;
    showToast('Checklist dikembalikan ke template standar pernikahan');
  }

  // --- DERIVED STATS & FILTERING ---
  const totalAll = $derived($wedding.checklist.length);
  const totalDone = $derived($wedding.checklist.filter(t => t.completed).length);
  const totalPending = $derived(totalAll - totalDone);
  const totalOverdue = $derived($wedding.checklist.filter(t => isOverdue(t.dueDate, t.completed)).length);
  const pct = $derived(totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0);

  const priorityWeight: Record<string, number> = { tinggi: 3, sedang: 2, rendah: 1 };

  const filteredTasks = $derived(() => {
    let list = $wedding.checklist.filter(t => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchText = t.text.toLowerCase().includes(q);
        const matchAssignee = t.assignee && t.assignee.toLowerCase().includes(q);
        const matchNotes = t.notes && t.notes.toLowerCase().includes(q);
        if (!matchText && !matchAssignee && !matchNotes) return false;
      }

      // Status
      if (filterStatus === 'pending' && t.completed) return false;
      if (filterStatus === 'done' && !t.completed) return false;
      if (filterStatus === 'overdue' && !isOverdue(t.dueDate, t.completed)) return false;

      // Category
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;

      // Priority
      if (filterPriority !== 'all' && (t.priority || 'sedang') !== filterPriority) return false;

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'priority') {
        const pA = priorityWeight[a.priority || 'sedang'] || 2;
        const pB = priorityWeight[b.priority || 'sedang'] || 2;
        return pB - pA;
      }
      if (sortBy === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      }
      if (sortBy === 'text') {
        return a.text.localeCompare(b.text);
      }
      return 0;
    });

    return list;
  });

  const byCategory = $derived(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const t of filteredTasks()) {
      const cat = t.category || 'Lainnya';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return map;
  });
</script>

<svelte:head>
  <title>Checklist Persiapan — Nikahku</title>
</svelte:head>

<!-- Toast Floating Message -->
{#if toastMsg}
  <div class="checklist-toast animate-slide-up" role="alert">
    <span>{toastMsg}</span>
  </div>
{/if}

<div class="page-container">
  <!-- Header Page -->
  <header class="page-header">
    <div class="container">
      <div class="page-header-inner">
        <div>
          <h1 class="page-title-with-icon">
            <span class="page-title-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
            </span>
            Checklist Persiapan Pernikahan
          </h1>
          <p class="text-muted text-sm mt-1">
            Pantau seluruh progres dan kelola tugas pernikahanmu dengan kontrol CRUD lengkap
          </p>
        </div>

        <div class="header-action-btns">
          <button
            class="btn btn-secondary btn-sm flex items-center gap-1.5"
            onclick={() => exportChecklistToExcel($wedding)}
            title="Download Checklist ke format Excel"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line></svg>
            <span>Export Excel</span>
          </button>

          <button
            class="btn btn-secondary btn-sm flex items-center gap-1.5"
            onclick={() => showResetModal = true}
            title="Gunakan 12 template tugas pernikahan siap pakai"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span>Template Standar</span>
          </button>

          <button class="btn btn-primary btn-sm flex items-center gap-1.5" onclick={openAddModal}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>+ Tambah Tugas</span>
          </button>
        </div>
      </div>

      <!-- Stats Summary Cards & Progress -->
      <div class="stats-overview-grid mt-6">
        <div class="stat-card">
          <div class="stat-card-label">Total Tugas</div>
          <div class="stat-card-value">{totalAll}</div>
          <div class="stat-card-sub">Seluruh checklist aktif</div>
        </div>

        <div class="stat-card stat-success">
          <div class="stat-card-label">Selesai</div>
          <div class="stat-card-value text-success">{totalDone}</div>
          <div class="stat-card-sub">{pct}% terselesaikan</div>
        </div>

        <div class="stat-card stat-warning">
          <div class="stat-card-label">Menunggu (Pending)</div>
          <div class="stat-card-value text-warning">{totalPending}</div>
          <div class="stat-card-sub">Perlu dikerjakan</div>
        </div>

        <div class="stat-card stat-danger">
          <div class="stat-card-label">Terlambat (Overdue)</div>
          <div class="stat-card-value text-danger">{totalOverdue}</div>
          <div class="stat-card-sub">Lewat tanggal deadline</div>
        </div>
      </div>

      <!-- Master Progress Bar -->
      <div class="checklist-progress mt-4">
        <div class="flex justify-between items-center mb-1.5">
          <span class="text-xs font-semibold text-muted">Progres Kesiapan Pernikahan</span>
          <span class="badge badge-{pct === 100 ? 'success' : 'primary'}">{pct}% Tercapai</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {pct}%"></div>
        </div>
      </div>
    </div>
  </header>

  <main class="container mt-6">
    <!-- Quick Add Bar -->
    <div class="quick-add-card mb-6">
      <div class="quick-add-inner">
        <span class="quick-add-icon">⚡</span>
        <input
          type="text"
          class="quick-add-input"
          placeholder="Tambah tugas cepat... (Ketik lalu tekan Enter atau klik tombol)"
          bind:value={quickAddText}
          onkeydown={(e) => e.key === 'Enter' && handleQuickAdd()}
        />
        <button
          type="button"
          class="btn btn-primary btn-sm"
          onclick={handleQuickAdd}
          disabled={!quickAddText.trim()}
        >
          Tambah Cepat
        </button>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="toolbar-box mb-6">
      <div class="toolbar-top-row">
        <!-- Search Field -->
        <div class="search-input-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="text"
            class="search-input"
            placeholder="Cari tugas, PIC, atau catatan..."
            bind:value={searchQuery}
          />
          {#if searchQuery}
            <button class="clear-search-btn" onclick={() => searchQuery = ''}>✕</button>
          {/if}
        </div>

        <!-- Filter Dropdowns -->
        <div class="toolbar-dropdowns">
          <div class="dropdown-group">
            <label class="dropdown-label" for="category-select">Kategori:</label>
            <select id="category-select" class="form-select form-select-sm" bind:value={filterCategory}>
              <option value="all">Semua Kategori</option>
              {#each categories as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
          </div>

          <div class="dropdown-group">
            <label class="dropdown-label" for="priority-select">Prioritas:</label>
            <select id="priority-select" class="form-select form-select-sm" bind:value={filterPriority}>
              <option value="all">Semua Prioritas</option>
              <option value="tinggi">🔥 Tinggi</option>
              <option value="sedang">⚡ Sedang</option>
              <option value="rendah">☕ Rendah</option>
            </select>
          </div>

          <div class="dropdown-group">
            <label class="dropdown-label" for="sort-select">Urutkan:</label>
            <select id="sort-select" class="form-select form-select-sm" bind:value={sortBy}>
              <option value="dueDate">Deadline Terdekat</option>
              <option value="priority">Prioritas Tertinggi</option>
              <option value="category">Kategori</option>
              <option value="text">Nama Tugas (A-Z)</option>
            </select>
          </div>

          <div class="dropdown-group">
            <label class="dropdown-label" for="group-select">Tampilan:</label>
            <select id="group-select" class="form-select form-select-sm" bind:value={groupBy}>
              <option value="category">Kelompok Kategori</option>
              <option value="none">Daftar Rata</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Status Pills Row -->
      <div class="toolbar-bottom-row mt-3">
        <div class="filter-pills">
          <button
            class="filter-pill {filterStatus === 'all' ? 'active' : ''}"
            onclick={() => filterStatus = 'all'}
          >
            Semua ({totalAll})
          </button>
          <button
            class="filter-pill {filterStatus === 'pending' ? 'active' : ''}"
            onclick={() => filterStatus = 'pending'}
          >
            Pending ({totalPending})
          </button>
          <button
            class="filter-pill {filterStatus === 'done' ? 'active' : ''}"
            onclick={() => filterStatus = 'done'}
          >
            Selesai ({totalDone})
          </button>
          {#if totalOverdue > 0}
            <button
              class="filter-pill pill-danger {filterStatus === 'overdue' ? 'active' : ''}"
              onclick={() => filterStatus = 'overdue'}
            >
              Terlambat ({totalOverdue})
            </button>
          {/if}
        </div>

        <!-- Quick Batch Actions -->
        <div class="batch-actions-row">
          {#if totalPending > 0}
            <button
              class="btn-text-action text-primary"
              onclick={() => handleToggleAll(true)}
              title="Tandai semua tugas selesai"
            >
              ✓ Tandai Semua Selesai
            </button>
          {:else if totalDone > 0}
            <button
              class="btn-text-action text-muted"
              onclick={() => handleToggleAll(false)}
              title="Kembalikan semua ke pending"
            >
              ↺ Batal Selesai Semua
            </button>
          {/if}

          {#if totalDone > 0}
            <button
              class="btn-text-action text-danger"
              onclick={handleDeleteCompleted}
              title="Bersihkan tugas yang selesai"
            >
              🗑️ Hapus Tugas Selesai
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    {#if totalAll === 0}
      <div class="empty-state-box animate-fade-in">
        <div class="empty-icon-bubble">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        </div>
        <h3 class="empty-title">Checklist Masih Kosong</h3>
        <p class="empty-desc">
          Kamu belum memiliki daftar tugas persiapan pernikahan. Buat tugas pertamamu atau gunakan template standar rekomendasi pernikahan Indonesia.
        </p>
        <div class="flex items-center justify-center gap-3 mt-4">
          <button class="btn btn-secondary" onclick={confirmReset}>
            ⚡ Muat 12 Template Standar
          </button>
          <button class="btn btn-primary" onclick={openAddModal}>
            + Buat Tugas Kustom
          </button>
        </div>
      </div>
    {:else if filteredTasks().length === 0}
      <div class="empty-state-box animate-fade-in">
        <div class="empty-icon-bubble text-muted">🔍</div>
        <h3 class="empty-title">Tidak Ada Tugas yang Cocok</h3>
        <p class="empty-desc">
          Coba ubah kata kunci pencarian atau sesuaikan filter status dan kategori di atas.
        </p>
        <button
          class="btn btn-secondary btn-sm mt-3"
          onclick={() => { searchQuery = ''; filterStatus = 'all'; filterCategory = 'all'; filterPriority = 'all'; }}
        >
          Reset Filter Pencarian
        </button>
      </div>
    {:else}
      <!-- TASK LIST VIEW -->
      {#if groupBy === 'category'}
        <!-- Grouped by Category -->
        {#each [...byCategory().entries()] as [category, tasks]}
          <section class="task-category-group mb-6 animate-fade-in">
            <div class="category-header-row">
              <h3 class="category-title">
                <span class="category-dot"></span>
                {category}
              </h3>
              <span class="category-counter">
                {tasks.filter(t => t.completed).length} / {tasks.length} Selesai
              </span>
            </div>

            <div class="tasks-table-card">
              {#each tasks as task (task.id)}
                {@render taskItemRow(task)}
              {/each}
            </div>
          </section>
        {/each}
      {:else}
        <!-- Flat List -->
        <div class="tasks-table-card animate-fade-in mb-6">
          {#each filteredTasks() as task (task.id)}
            {@render taskItemRow(task)}
          {/each}
        </div>
      {/if}
    {/if}
  </main>
</div>

<!-- SNIPPET FOR A SINGLE TASK ROW -->
{#snippet taskItemRow(task: ChecklistItem)}
  {@const overdue = isOverdue(task.dueDate, task.completed)}
  <div class="task-row {task.completed ? 'is-completed' : ''} {overdue ? 'is-overdue' : ''}">
    <!-- Checkbox Toggle -->
    <button
      type="button"
      class="task-toggle-btn"
      onclick={() => handleToggle(task)}
      title={task.completed ? 'Klik untuk tandai belum selesai' : 'Klik untuk tandai selesai'}
      aria-label="Toggle status tugas"
    >
      <div class="custom-checkbox {task.completed ? 'checked' : ''}">
        {#if task.completed}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        {/if}
      </div>
    </button>

    <!-- Main Content -->
    <div class="task-info-col">
      <div class="task-title-line">
        <span class="task-title-text">{task.text}</span>

        <!-- Priority Badge -->
        {#if task.priority === 'tinggi'}
          <span class="priority-badge p-high" title="Prioritas Tinggi">🔥 Tinggi</span>
        {:else if task.priority === 'rendah'}
          <span class="priority-badge p-low" title="Prioritas Rendah">☕ Rendah</span>
        {:else}
          <span class="priority-badge p-med" title="Prioritas Sedang">⚡ Sedang</span>
        {/if}

        {#if groupBy === 'none' && task.category}
          <span class="category-badge">{task.category}</span>
        {/if}
      </div>

      <!-- Meta row -->
      <div class="task-meta-line">
        {#if task.dueDate}
          <span class="meta-item {overdue ? 'meta-overdue' : ''}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>{formatDate(task.dueDate)}</span>
            {#if overdue}
              <strong class="overdue-tag">TERLAMBAT</strong>
            {/if}
          </span>
        {/if}

        {#if task.assignee}
          <span class="meta-item meta-assignee">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>{task.assignee}</span>
          </span>
        {/if}

        {#if task.notes}
          <span class="meta-item meta-notes" title={task.notes}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span>{task.notes}</span>
          </span>
        {/if}
      </div>
    </div>

    <!-- Action Buttons (CRUD: Edit & Delete) -->
    <div class="task-actions-col">
      <button
        type="button"
        class="action-icon-btn edit-btn"
        onclick={() => openEditModal(task)}
        title="Edit Tugas"
        aria-label="Edit Tugas"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>

      <button
        type="button"
        class="action-icon-btn delete-btn"
        onclick={() => promptDelete(task)}
        title="Hapus Tugas"
        aria-label="Hapus Tugas"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </div>
  </div>
{/snippet}

<!-- ======================================================== -->
<!-- MODAL: TAMBAH TUGAS (CREATE)                             -->
<!-- ======================================================== -->
{#if showAddModal}
  <div class="modal-backdrop" onclick={() => showAddModal = false} role="presentation">
    <div class="modal-card animate-scale-up" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-title">Tambah Tugas Baru</h3>
        <button class="modal-close-btn" onclick={() => showAddModal = false}>✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group mb-3">
          <label class="form-label" for="new-task-text">Deskripsi / Nama Tugas <span class="text-danger">*</span></label>
          <input
            id="new-task-text"
            type="text"
            class="form-input"
            placeholder="Contoh: Booking fotografer & videografer"
            bind:value={newText}
          />
        </div>

        <div class="grid grid-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label" for="new-task-category">Kategori</label>
            <select id="new-task-category" class="form-select" bind:value={newCategory}>
              {#each categories as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="new-task-priority">Tingkat Prioritas</label>
            <select id="new-task-priority" class="form-select" bind:value={newPriority}>
              <option value="tinggi">🔥 Tinggi (Krusial)</option>
              <option value="sedang">⚡ Sedang (Standar)</option>
              <option value="rendah">☕ Rendah (Opsional)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label" for="new-task-date">Deadline / Tanggal Target</label>
            <input
              id="new-task-date"
              type="date"
              class="form-input"
              bind:value={newDueDate}
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="new-task-assignee">Penanggung Jawab (PIC)</label>
            <input
              id="new-task-assignee"
              type="text"
              class="form-input"
              placeholder="Misal: Mempelai Pria / Keluarga / WO"
              bind:value={newAssignee}
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="new-task-notes">Catatan Tambahan (Opsional)</label>
          <textarea
            id="new-task-notes"
            rows="2"
            class="form-input"
            placeholder="Kontak vendor, alamat, atau rincian instruksi..."
            bind:value={newNotes}
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick={() => showAddModal = false}>
          Batal
        </button>
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleCreateTask}
          disabled={!newText.trim()}
        >
          Simpan Tugas
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ======================================================== -->
<!-- MODAL: EDIT TUGAS (UPDATE)                               -->
<!-- ======================================================== -->
{#if showEditModal && editingItem}
  <div class="modal-backdrop" onclick={() => showEditModal = false} role="presentation">
    <div class="modal-card animate-scale-up" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-title">Edit Tugas</h3>
        <button class="modal-close-btn" onclick={() => showEditModal = false}>✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group mb-3">
          <label class="form-label" for="edit-task-text">Deskripsi / Nama Tugas <span class="text-danger">*</span></label>
          <input
            id="edit-task-text"
            type="text"
            class="form-input"
            bind:value={editText}
          />
        </div>

        <div class="grid grid-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label" for="edit-task-category">Kategori</label>
            <select id="edit-task-category" class="form-select" bind:value={editCategory}>
              {#each categories as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-task-priority">Tingkat Prioritas</label>
            <select id="edit-task-priority" class="form-select" bind:value={editPriority}>
              <option value="tinggi">🔥 Tinggi (Krusial)</option>
              <option value="sedang">⚡ Sedang (Standar)</option>
              <option value="rendah">☕ Rendah (Opsional)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label" for="edit-task-date">Deadline / Tanggal Target</label>
            <input
              id="edit-task-date"
              type="date"
              class="form-input"
              bind:value={editDueDate}
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-task-assignee">Penanggung Jawab (PIC)</label>
            <input
              id="edit-task-assignee"
              type="text"
              class="form-input"
              bind:value={editAssignee}
            />
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label" for="edit-task-notes">Catatan Tambahan</label>
          <textarea
            id="edit-task-notes"
            rows="2"
            class="form-input"
            bind:value={editNotes}
          ></textarea>
        </div>

        <div class="status-toggle-box">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" bind:checked={editCompleted} class="form-checkbox" />
            <span class="text-sm font-medium">Tandai tugas ini sudah selesai</span>
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick={() => showEditModal = false}>
          Batal
        </button>
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleSaveEdit}
          disabled={!editText.trim()}
        >
          Simpan Perubahan
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ======================================================== -->
<!-- MODAL: KONFIRMASI HAPUS (DELETE)                         -->
<!-- ======================================================== -->
{#if showDeleteConfirmModal && itemToDelete}
  <div class="modal-backdrop" onclick={() => showDeleteConfirmModal = false} role="presentation">
    <div class="modal-card modal-sm animate-scale-up" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-title text-danger">Hapus Tugas?</h3>
        <button class="modal-close-btn" onclick={() => showDeleteConfirmModal = false}>✕</button>
      </div>

      <div class="modal-body">
        <p class="text-sm mb-2">Apakah kamu yakin ingin menghapus tugas berikut?</p>
        <div class="delete-preview-box">
          <strong>"{itemToDelete.text}"</strong>
          {#if itemToDelete.category}
            <span class="block text-xs text-muted mt-1">Kategori: {itemToDelete.category}</span>
          {/if}
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick={() => showDeleteConfirmModal = false}>
          Batal
        </button>
        <button type="button" class="btn btn-danger" onclick={confirmDelete}>
          Ya, Hapus
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ======================================================== -->
<!-- MODAL: KONFIRMASI RESET TEMPLATE                         -->
<!-- ======================================================== -->
{#if showResetModal}
  <div class="modal-backdrop" onclick={() => showResetModal = false} role="presentation">
    <div class="modal-card modal-sm animate-scale-up" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-title">Gunakan Template Standar?</h3>
        <button class="modal-close-btn" onclick={() => showResetModal = false}>✕</button>
      </div>

      <div class="modal-body">
        <p class="text-sm text-muted mb-2">
          Fitur ini akan memuat 12 daftar tugas standar pernikahan Indonesia (Venue, Katering, Rias, Dokum, Administrasi KUA, Undangan, dll).
        </p>
        <p class="text-xs text-warning font-semibold">
          Catatan: Checklist lama yang ada saat ini akan digantikan oleh daftar template rekomendasi.
        </p>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick={() => showResetModal = false}>
          Batal
        </button>
        <button type="button" class="btn btn-primary" onclick={confirmReset}>
          Terapkan Template
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .page-container {
    padding-bottom: var(--space-12);
  }

  .page-header {
    background: white;
    border-bottom: 1px solid var(--color-border);
    padding: var(--space-8) 0 var(--space-6);
  }

  .page-header-inner {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .header-action-btns {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  /* Stats Overview Cards */
  .stats-overview-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  @media (min-width: 768px) {
    .stats-overview-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 0.85rem 1rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .stat-card:hover {
    box-shadow: var(--shadow-sm);
  }

  .stat-card-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 0.25rem;
  }

  .stat-card-value {
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--color-text);
    line-height: 1.1;
  }

  .stat-card-sub {
    font-size: 0.75rem;
    color: var(--color-text-subtle);
    margin-top: 0.25rem;
  }

  /* Quick Add Bar */
  .quick-add-card {
    background: white;
    border: 1.5px dashed var(--color-border);
    border-radius: var(--radius-xl);
    padding: 0.5rem 0.75rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .quick-add-card:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(201, 132, 122, 0.15);
  }

  .quick-add-inner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .quick-add-icon {
    font-size: 1.1rem;
    color: var(--color-primary);
  }

  .quick-add-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 0.92rem;
    background: transparent;
    color: var(--color-text);
  }

  /* Toolbar */
  .toolbar-box {
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: 1rem;
    box-shadow: var(--shadow-sm);
  }

  .toolbar-top-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .search-input-wrapper {
    position: relative;
    flex: 1;
    min-width: 220px;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    color: var(--color-text-subtle);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 0.45rem 2rem 0.45rem 2.25rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .search-input:focus {
    border-color: var(--color-primary);
  }

  .clear-search-btn {
    position: absolute;
    right: 0.65rem;
    background: none;
    border: none;
    font-size: 0.8rem;
    color: var(--color-text-subtle);
    cursor: pointer;
  }

  .toolbar-dropdowns {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .dropdown-group {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .dropdown-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .form-select-sm {
    padding: 0.35rem 0.5rem;
    font-size: 0.8rem;
    border-radius: var(--radius-md);
  }

  .toolbar-bottom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    border-top: 1px solid var(--color-border-light);
    padding-top: 0.75rem;
  }

  .filter-pills {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .filter-pill {
    padding: 0.3rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .filter-pill:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .filter-pill.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }

  .filter-pill.pill-danger.active {
    background: var(--color-danger);
    border-color: var(--color-danger);
  }

  .batch-actions-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .btn-text-action {
    background: none;
    border: none;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.2s ease;
  }

  .btn-text-action:hover {
    opacity: 0.75;
    text-decoration: underline;
  }

  /* Category Groups */
  .task-category-group {
    background: transparent;
  }

  .category-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    padding: 0 0.25rem;
  }

  .category-title {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin: 0;
  }

  .category-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-primary);
  }

  .category-counter {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-subtle);
  }

  /* Tasks Table Card */
  .tasks-table-card {
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .task-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--color-border-light);
    transition: background-color 0.15s ease;
  }

  .task-row:last-child {
    border-bottom: none;
  }

  .task-row:hover {
    background-color: var(--color-surface);
  }

  .task-row.is-completed {
    background-color: rgba(90, 138, 107, 0.04);
  }

  .task-row.is-overdue {
    border-left: 3.5px solid var(--color-danger);
  }

  /* Checkbox Toggle Button */
  .task-toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .custom-checkbox {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    color: white;
    transition: all 0.2s ease;
  }

  .custom-checkbox:hover {
    border-color: var(--color-primary);
  }

  .custom-checkbox.checked {
    background: var(--color-success);
    border-color: var(--color-success);
  }

  /* Info Column */
  .task-info-col {
    flex: 1;
    min-width: 0;
  }

  .task-title-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.25rem;
  }

  .task-title-text {
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--color-text);
    transition: all 0.2s ease;
  }

  .task-row.is-completed .task-title-text {
    text-decoration: line-through;
    color: var(--color-text-subtle);
  }

  /* Priority Badges */
  .priority-badge {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: 9999px;
  }

  .priority-badge.p-high {
    background: #fee2e2;
    color: #b91c1c;
  }

  .priority-badge.p-med {
    background: #fef3c7;
    color: #b45309;
  }

  .priority-badge.p-low {
    background: #f1f5f9;
    color: #475569;
  }

  .category-badge {
    font-size: 0.68rem;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
  }

  /* Meta Line */
  .task-meta-line {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    font-size: 0.75rem;
    color: var(--color-text-subtle);
    flex-wrap: wrap;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .meta-overdue {
    color: var(--color-danger);
    font-weight: 600;
  }

  .overdue-tag {
    background: var(--color-danger);
    color: white;
    font-size: 0.6rem;
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
  }

  .meta-notes {
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Action Buttons Column */
  .task-actions-col {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .action-icon-btn {
    width: 30px;
    height: 30px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: white;
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-icon-btn:hover {
    background: var(--color-surface);
  }

  .action-icon-btn.edit-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .action-icon-btn.delete-btn:hover {
    border-color: var(--color-danger);
    color: var(--color-danger);
    background: #fff5f5;
  }

  /* Empty State */
  .empty-state-box {
    text-align: center;
    padding: 3rem 1.5rem;
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
  }

  .empty-icon-bubble {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(201, 132, 122, 0.1);
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    font-size: 2rem;
  }

  .empty-title {
    font-size: 1.15rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .empty-desc {
    font-size: 0.88rem;
    color: var(--color-text-muted);
    max-width: 480px;
    margin: 0 auto;
  }

  /* Toast Notification */
  .checklist-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #2b1f1d;
    color: white;
    padding: 0.75rem 1.25rem;
    border-radius: var(--radius-lg);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    font-size: 0.88rem;
    font-weight: 500;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Modals */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    padding: 1rem;
  }

  .modal-card {
    background: white;
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 540px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .modal-card.modal-sm {
    max-width: 420px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-title {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
  }

  .modal-close-btn {
    background: none;
    border: none;
    font-size: 1.1rem;
    cursor: pointer;
    color: var(--color-text-subtle);
  }

  .modal-close-btn:hover {
    color: var(--color-text);
  }

  .modal-body {
    padding: 1.25rem;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 0.85rem 1.25rem;
    border-top: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  .delete-preview-box {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 0.75rem;
    margin-top: 0.5rem;
  }

  .status-toggle-box {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 0.65rem 0.85rem;
  }
</style>