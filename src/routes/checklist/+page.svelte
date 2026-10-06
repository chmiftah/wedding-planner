<script lang="ts">
  import { wedding, addChecklistItem, toggleChecklistItem, deleteChecklistItem } from '#lib/stores/wedding';
  import { formatDate } from '#lib/utils/format';

  let showForm = $state(false);
  let taskText = $state('');
  let taskDueDate = $state('');
  let taskAssignee = $state('');
  let taskCategory = $state('');
  let taskNotes = $state('');
  let filterDone = $state<'all' | 'pending' | 'done'>('all');

  const categories = ['Venue & Dekorasi', 'Katering', 'Dokumentasi', 'Busana', 'Tamu & Undangan', 'Administrasi', 'Lainnya'];

  function submitTask() {
    if (!taskText.trim()) return;
    addChecklistItem({
      text: taskText,
      dueDate: taskDueDate,
      assignee: taskAssignee,
      category: taskCategory,
      notes: taskNotes,
    });
    taskText = '';
    taskDueDate = '';
    taskAssignee = '';
    taskCategory = '';
    taskNotes = '';
    showForm = false;
  }

  const filteredTasks = $derived(() => {
    return $wedding.checklist.filter(t => {
      if (filterDone === 'pending') return !t.completed;
      if (filterDone === 'done') return t.completed;
      return true;
    });
  });

  const totalDone = $derived($wedding.checklist.filter(t => t.completed).length);
  const totalAll = $derived($wedding.checklist.length);
  const pct = $derived(totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0);

  // Group by category
  const byCategory = $derived(() => {
    const map = new Map<string, typeof $wedding.checklist>();
    for (const t of filteredTasks()) {
      const cat = t.category || 'Lainnya';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return map;
  });

  function isOverdue(dueDate: string) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && dueDate;
  }
</script>

<svelte:head>
  <title>Checklist — Nikahku</title>
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
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </span>
          Checklist Persiapan
        </h1>
          <p class="text-muted text-sm mt-1">Pantau semua tugas persiapan pernikahanmu</p>
        </div>
        <button class="btn btn-primary" onclick={() => showForm = !showForm}>
          {showForm ? '✕ Tutup' : '+ Tambah Tugas'}
        </button>
      </div>

      {#if totalAll > 0}
        <div class="checklist-progress mt-6">
          <div class="flex justify-between mb-2">
            <span class="text-sm font-semibold">{totalDone} dari {totalAll} tugas selesai</span>
            <span class="badge badge-{pct === 100 ? 'success' : 'primary'}">{pct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {pct}%"></div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="container mt-6">
    <!-- Add Form -->
    {#if showForm}
      <div class="card animate-fade-in mb-6">
        <h3 class="mb-4">Tambah Tugas Baru</h3>
        <div class="form-group mb-3">
          <label class="form-label" for="taskText">Deskripsi Tugas *</label>
          <input id="taskText" type="text" class="form-input" bind:value={taskText} placeholder="Misal: Booking fotografer" />
        </div>
        <div class="grid-3 mb-3">
          <div class="form-group">
            <label class="form-label" for="taskCat">Kategori</label>
            <select id="taskCat" class="form-select" bind:value={taskCategory}>
              <option value="">Pilih kategori</option>
              {#each categories as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="taskDue">Deadline</label>
            <input id="taskDue" type="date" class="form-input" bind:value={taskDueDate} />
          </div>
          <div class="form-group">
            <label class="form-label" for="taskAssign">Penanggung Jawab</label>
            <input id="taskAssign" type="text" class="form-input" bind:value={taskAssignee} placeholder="Nama / pihak" />
          </div>
        </div>
        <div class="form-group mb-4">
          <label class="form-label" for="taskNotes">Catatan</label>
          <input id="taskNotes" type="text" class="form-input" bind:value={taskNotes} placeholder="Info tambahan (opsional)" />
        </div>
        <div class="flex gap-3">
          <button class="btn btn-secondary flex-1" onclick={() => showForm = false}>Batal</button>
          <button class="btn btn-primary flex-1" onclick={submitTask} disabled={!taskText.trim()}>Tambah</button>
        </div>
      </div>
    {/if}

    <!-- Filter -->
    {#if totalAll > 0}
      <div class="filter-pills mb-6">
        {#each [['all', `Semua (${totalAll})`], ['pending', `Pending (${totalAll - totalDone})`], ['done', `Selesai (${totalDone})`]] as [val, label]}
          <button
            class="filter-pill {filterDone === val ? 'active' : ''}"
            onclick={() => filterDone = val as typeof filterDone}
          >{label}</button>
        {/each}
      </div>
    {/if}

    <!-- Tasks -->
    {#if $wedding.checklist.length === 0}
      <div class="empty-page">
        <div class="empty-icon"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg></div>
        <h3>Belum ada checklist</h3>
        <p class="text-muted">Tambahkan tugas-tugas persiapan pernikahanmu agar tidak ada yang terlewat.</p>
        <button class="btn btn-primary mt-4" onclick={() => showForm = true}>+ Tambah Tugas Pertama</button>
      </div>
    {:else if filteredTasks().length === 0}
      <div class="empty-page">
        <p class="text-muted">Tidak ada tugas yang cocok dengan filter.</p>
      </div>
    {:else}
      {#each [...byCategory().entries()] as [category, tasks]}
        <div class="task-group mb-6 animate-fade-in">
          <h4 class="task-group-title">{category}</h4>
          <div class="tasks-list">
            {#each tasks as task}
              <div class="task-item {task.completed ? 'done' : ''} {isOverdue(task.dueDate) && !task.completed ? 'overdue' : ''}">
                <button
                  class="task-check-btn"
                  onclick={() => toggleChecklistItem(task.id)}
                  aria-label="Toggle selesai"
                >
                  <div class="task-checkbox {task.completed ? 'checked' : ''}">
                    {#if task.completed}<span>✓</span>{/if}
                  </div>
                </button>

                <div class="task-content flex-1">
                  <span class="task-text">{task.text}</span>
                  <div class="task-meta">
                    {#if task.assignee}
                      <span class="task-meta-item flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>{task.assignee}</span>
                    {/if}
                    {#if task.dueDate}
                      <span class="task-meta-item {isOverdue(task.dueDate) && !task.completed ? 'text-danger' : ''}">
                        <span class="inline-flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>{formatDate(task.dueDate)}</span>
                        {#if isOverdue(task.dueDate) && !task.completed}<span class="badge badge-danger" style="font-size: 9px">Terlambat</span>{/if}
                      </span>
                    {/if}
                    {#if task.notes}
                      <span class="task-meta-item text-subtle">{task.notes}</span>
                    {/if}
                  </div>
                </div>

                <button
                  class="btn btn-icon btn-danger"
                  onclick={() => deleteChecklistItem(task.id)}
                  title="Hapus"
                ><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .page-container { padding-bottom: var(--space-12); }

  .page-header {
    background: white; border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-8) 0 var(--space-6);
  }

  .page-header-inner { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }

  /* Task Groups */
  .task-group-title {
    font-size: var(--font-size-sm); font-weight: 700;
    color: var(--color-text-muted); text-transform: uppercase;
    letter-spacing: .08em; margin-bottom: var(--space-3);
    padding-left: var(--space-2);
  }

  .tasks-list {
    background: white; border: 1px solid var(--color-border-light);
    border-radius: var(--radius-xl); overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .task-item {
    display: flex; align-items: flex-start; gap: var(--space-3);
    padding: var(--space-4) var(--space-4);
    border-bottom: 1px solid var(--color-border-light);
    transition: background var(--transition-fast);
  }

  .task-item:last-child { border-bottom: none; }
  .task-item:hover { background: var(--color-surface); }
  .task-item.done { background: var(--color-success-bg); }
  .task-item.overdue { border-left: 3px solid var(--color-danger); }

  .task-check-btn { background: none; border: none; cursor: pointer; padding: 2px 0; flex-shrink: 0; }

  .task-checkbox {
    width: 22px; height: 22px; border-radius: var(--radius-sm);
    border: 2px solid var(--color-border);
    display: flex; align-items: center; justify-content: center;
    transition: all var(--transition-spring); font-size: 12px;
    color: white; font-weight: 700;
  }

  .task-checkbox.checked {
    background: var(--color-success);
    border-color: var(--color-success);
    transform: scale(1.1);
  }

  .task-content { display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }

  .task-text {
    font-size: var(--font-size-base); font-weight: 500;
    color: var(--color-text);
    transition: all var(--transition-fast);
  }

  .task-item.done .task-text {
    text-decoration: line-through;
    color: var(--color-text-subtle);
  }

  .task-meta { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; }

  .task-meta-item { font-size: var(--font-size-xs); color: var(--color-text-muted); display: flex; align-items: center; gap: var(--space-1); }
  .text-danger { color: var(--color-danger) !important; }

  /* Filters */
  .filter-pills { display: flex; gap: var(--space-2); flex-wrap: wrap; }

  .filter-pill {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full); background: var(--color-surface);
    border: 1.5px solid var(--color-border); font-size: var(--font-size-sm);
    font-weight: 600; color: var(--color-text-muted); cursor: pointer;
    transition: all var(--transition-fast); font-family: var(--font-body);
  }

  .filter-pill.active {
    background: var(--color-primary-xlight); border-color: var(--color-primary);
    color: var(--color-accent);
  }

  /* Empty */
  .empty-page { text-align: center; padding: var(--space-20) 0; display: flex; flex-direction: column; align-items: center; }
  .empty-icon { font-size: 4rem; margin-bottom: var(--space-4); }
  @media (max-width: 768px) {
    .page-header-inner { flex-direction: column; gap: var(--space-3); }
    .filter-pills { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; scrollbar-width: none; }
    .task-item { padding: var(--space-3) var(--space-4); }
  }
</style>