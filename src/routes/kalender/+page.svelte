<script lang="ts">
  import { onMount } from 'svelte';
  import {
    wedding,
    calendarSummary,
    addCalendarEvent,
    updateCalendarEvent,
    toggleCalendarEvent,
    deleteCalendarEvent,
    resetCalendarEventsToDefault,
    hydrateWeddingFromDb,
    type CalendarEventItem
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

  // Calendar month state
  const now = new Date();
  let currentYear = $state(now.getFullYear());
  let currentMonth = $state(now.getMonth()); // 0-indexed
  let selectedDate = $state<string | null>(now.toISOString().slice(0, 10));

  // Filters & Tabs
  let activeTab = $state<'semua' | 'mendatang' | 'selesai'>('mendatang');
  let filterCategory = $state('semua');
  let searchQuery = $state('');

  // Modal State
  let showModal = $state(false);
  let isEditing = $state(false);
  let editId = $state<string | null>(null);

  // Form State
  let formTitle = $state('');
  let formDate = $state(now.toISOString().slice(0, 10));
  let formStartTime = $state('10:00');
  let formEndTime = $state('12:00');
  let formCategory = $state<CalendarEventItem['category']>('meeting');
  let formLocation = $state('');
  let formNotes = $state('');

  const categoryPresets: Array<{ id: CalendarEventItem['category']; label: string; icon: string; color: string }> = [
    { id: 'fitting', label: 'Fitting & Busana', icon: '👗', color: 'accent' },
    { id: 'test_food', label: 'Test Food Katering', icon: '🍽️', color: 'warning' },
    { id: 'survey', label: 'Survei Venue', icon: '🏛️', color: 'info' },
    { id: 'meeting', label: 'Meeting Vendor / WO', icon: '🤝', color: 'primary' },
    { id: 'kua', label: 'Administrasi KUA', icon: '📋', color: 'neutral' },
    { id: 'hari_h', label: 'Hari-H Pernikahan', icon: '💍', color: 'danger' },
    { id: 'lainnya', label: 'Lainnya', icon: '📌', color: 'neutral' },
  ];

  const quickTitleTemplates = [
    'Fitting Busana Pengantin Tahap 1',
    'Test Food Katering Resepsi',
    'Survei & Cek Fasilitas Venue',
    'Technical Meeting (TM) Seluruh Vendor',
    'Pendaftaran & Bimbingan di KUA',
    'Sesi Foto Prewedding',
    'Gladi Resik & Doa Bersama',
  ];

  const cs = $derived($calendarSummary);
  const events = $derived($wedding.calendarEvents || []);
  const weddingDateStr = $derived($wedding.info.weddingDate);

  // Days in month calculation
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const monthLabel = $derived(`${monthNames[currentMonth]} ${currentYear}`);

  const calendarDays = $derived(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeddingDate: boolean;
      events: CalendarEventItem[];
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Padding from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeddingDate: dateStr === weddingDateStr,
        events: events.filter((e) => e.date === dateStr),
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const m = currentMonth + 1;
      const dateStr = `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeddingDate: dateStr === weddingDateStr,
        events: events.filter((e) => e.date === dateStr),
      });
    }

    // Trailing days from next month to complete 35 or 42 grid
    const remaining = 42 - days.length;
    for (let d = 1; d <= (remaining >= 7 ? remaining - 7 : remaining); d++) {
      const m = currentMonth === 11 ? 1 : currentMonth + 2;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeddingDate: dateStr === weddingDateStr,
        events: events.filter((e) => e.date === dateStr),
      });
    }

    return days;
  });

  function prevMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear -= 1;
    } else {
      currentMonth -= 1;
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear += 1;
    } else {
      currentMonth += 1;
    }
  }

  function goToToday() {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    selectedDate = today.toISOString().slice(0, 10);
  }

  // Countdown badge for events
  function getDaysDiff(targetDateStr: string): { label: string; cls: string } {
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Hari Ini', cls: 'badge-danger' };
    if (diffDays === 1) return { label: 'Besok', cls: 'badge-warning' };
    if (diffDays === 2) return { label: 'Lusa', cls: 'badge-warning' };
    if (diffDays > 0) return { label: `${diffDays} hari lagi`, cls: 'badge-info' };
    return { label: `${Math.abs(diffDays)} hari lalu`, cls: 'badge-neutral' };
  }

  // Filtered Events list
  const filteredEventsList = $derived(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return events
      .filter((e) => {
        const matchSearch =
          !searchQuery ||
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.notes.toLowerCase().includes(searchQuery.toLowerCase());

        const matchCat = filterCategory === 'semua' || e.category === filterCategory;

        let matchTab = true;
        if (activeTab === 'mendatang') matchTab = !e.completed;
        else if (activeTab === 'selesai') matchTab = e.completed;

        return matchSearch && matchCat && matchTab;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  });

  const selectedDateEvents = $derived(() => {
    if (!selectedDate) return [];
    return events.filter((e) => e.date === selectedDate);
  });

  function openAddModalForDate(dateStr?: string) {
    isEditing = false;
    editId = null;
    formTitle = '';
    formDate = dateStr || selectedDate || new Date().toISOString().slice(0, 10);
    formStartTime = '10:00';
    formEndTime = '12:00';
    formCategory = 'meeting';
    formLocation = '';
    formNotes = '';
    showModal = true;
  }

  function openEditModal(event: CalendarEventItem) {
    isEditing = true;
    editId = event.id;
    formTitle = event.title;
    formDate = event.date;
    formStartTime = event.startTime;
    formEndTime = event.endTime;
    formCategory = event.category;
    formLocation = event.location;
    formNotes = event.notes;
    showModal = true;
  }

  async function handleSaveEvent() {
    if (!formTitle.trim()) return;

    if (isEditing && editId) {
      const updates = {
        title: formTitle.trim(),
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        category: formCategory,
        location: formLocation.trim(),
        notes: formNotes.trim(),
      };
      updateCalendarEvent(editId, updates);

      try {
        await fetch('/api/kalender', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...updates }),
        });
      } catch (err) {
        console.error('Error updating calendar event to DB:', err);
      }
    } else {
      const newEv = addCalendarEvent({
        title: formTitle.trim(),
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        category: formCategory,
        location: formLocation.trim(),
        notes: formNotes.trim(),
      });

      try {
        await fetch('/api/kalender', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEv),
        });
      } catch (err) {
        console.error('Error inserting calendar event to DB:', err);
      }
    }

    showModal = false;
  }

  async function handleToggleDone(e: Event, id: string, currentCompleted: boolean) {
    e.stopPropagation();
    toggleCalendarEvent(id);
    try {
      await fetch('/api/kalender', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !currentCompleted }),
      });
    } catch (err) {
      console.error('Error toggling event in DB:', err);
    }
  }

  async function handleDeleteEvent(e: Event, id: string, title: string) {
    e.stopPropagation();
    if (!confirm(`Hapus agenda "${title}" dari kalender?`)) return;
    deleteCalendarEvent(id);
    try {
      await fetch(`/api/kalender?id=${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error deleting event from DB:', err);
    }
  }

  function handleResetTemplate() {
    if (confirm('Muat jadwal agenda persiapan pernikahan standar?')) {
      resetCalendarEventsToDefault();
    }
  }
</script>

<svelte:head>
  <title>Kalender & Agenda Acara Pernikahan | Nikahku</title>
</svelte:head>

<div class="calendar-page animate-fade-in">
  <div class="container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="badge-tag mb-2">
          <span>📅 Kalender Persiapan Pernikahan</span>
        </div>
        <h1 class="page-title">Agenda & Kalender Acara</h1>
        <p class="page-subtitle">
          Catat tanggal fitting busana, test food katering, meeting vendor, survei venue, hingga hari akad & resepsi.
        </p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" onclick={handleResetTemplate} title="Gunakan jadwal standar pra-nikah">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          <span class="hide-mobile">Jadwal Standar</span>
        </button>
        <button class="btn btn-primary" onclick={() => openAddModalForDate()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Tambah Acara</span>
        </button>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="grid-4 mb-6">
      <div class="stat-card">
        <div class="stat-icon-wrapper bg-blue-soft">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Agenda</span>
          <span class="stat-value">{cs.total}</span>
          <span class="stat-sub">{cs.completed} telah selesai</span>
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
          <span class="stat-label">Agenda Mendatang</span>
          <span class="stat-value text-warning">{cs.upcoming}</span>
          <span class="stat-sub">Persiapan aktif</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper bg-green-soft">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Telah Terlaksana</span>
          <span class="stat-value text-success">{cs.completed}</span>
          <span class="stat-sub">Selesai di-checklist</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper bg-terracotta-soft">
          <span style="font-size: 1.25rem;">💍</span>
        </div>
        <div class="stat-info">
          <span class="stat-label">Hari-H Pernikahan</span>
          <span class="stat-value text-accent text-sm font-bold">
            {weddingDateStr ? formatDate(weddingDateStr) : 'Belum diatur'}
          </span>
          <span class="stat-sub">Puncak Acara</span>
        </div>
      </div>
    </div>

    <!-- Main Layout: Calendar Left (7 cols) + Agenda Details Right (5 cols) -->
    <div class="calendar-layout mb-8">
      <!-- Calendar View Card -->
      <div class="calendar-card card">
        <div class="calendar-card-header">
          <div class="month-title-row">
            <h2 class="month-heading">{monthLabel}</h2>
            <button class="btn btn-sm btn-ghost" onclick={goToToday}>Hari Ini</button>
          </div>
          <div class="month-nav-btns">
            <button class="btn-icon btn-ghost" onclick={prevMonth} title="Bulan Sebelumnya">‹</button>
            <button class="btn-icon btn-ghost" onclick={nextMonth} title="Bulan Berikutnya">›</button>
          </div>
        </div>

        <!-- Days of Week Header -->
        <div class="weekdays-grid">
          <span>Min</span>
          <span>Sen</span>
          <span>Sel</span>
          <span>Rab</span>
          <span>Kam</span>
          <span>Jum</span>
          <span>Sab</span>
        </div>

        <!-- Month Grid -->
        <div class="days-grid">
          {#each calendarDays() as dayObj}
            {@const isSelected = selectedDate === dayObj.dateStr}
            <div
              class="day-cell {dayObj.isCurrentMonth ? '' : 'other-month'} {dayObj.isToday ? 'today' : ''} {dayObj.isWeddingDate ? 'wedding-day' : ''} {isSelected ? 'selected' : ''}"
              onclick={() => selectedDate = dayObj.dateStr}
              role="button"
              tabindex="0"
              onkeydown={(e) => { if (e.key === 'Enter') selectedDate = dayObj.dateStr; }}
            >
              <div class="day-number-row">
                <span class="day-number">{dayObj.day}</span>
                {#if dayObj.isWeddingDate}
                  <span class="wedding-ring-icon" title="Hari-H Pernikahan!">💍</span>
                {/if}
              </div>

              {#if dayObj.events.length > 0}
                <div class="day-events-dots">
                  {#each dayObj.events.slice(0, 3) as ev}
                    {@const p = categoryPresets.find(c => c.id === ev.category) || categoryPresets[0]}
                    <div
                      class="event-dot dot-{p.color}"
                      title="{ev.startTime ? ev.startTime + ' ' : ''}{ev.title}"
                    ></div>
                  {/each}
                  {#if dayObj.events.length > 3}
                    <span class="more-dots">+{dayObj.events.length - 3}</span>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <div class="calendar-legend mt-4">
          <div class="legend-item"><span class="legend-dot today-dot"></span><span>Hari Ini</span></div>
          <div class="legend-item"><span class="legend-dot wedding-dot"></span><span>Hari-H Pernikahan</span></div>
          <div class="legend-item"><span class="legend-dot event-dot-sm"></span><span>Ada Acara / Jadwal</span></div>
        </div>
      </div>

      <!-- Right Column: Selected Date Info & Quick Action -->
      <div class="selected-date-card card">
        <div class="selected-date-header">
          <div>
            <span class="text-xs text-muted uppercase font-bold tracking-wider">Jadwal Tanggal</span>
            <h3 class="selected-date-title">
              {selectedDate ? formatDate(selectedDate) : 'Pilih Tanggal'}
            </h3>
          </div>
          <button class="btn btn-sm btn-primary" onclick={() => openAddModalForDate(selectedDate || undefined)}>
            + Tambah
          </button>
        </div>

        {#if selectedDateEvents().length === 0}
          <div class="date-empty-state">
            <span class="empty-emoji">🗓️</span>
            <p class="text-sm text-muted">Belum ada agenda pada tanggal ini.</p>
            <button class="btn btn-sm btn-ghost mt-2" onclick={() => openAddModalForDate(selectedDate || undefined)}>
              + Catat Acara di Tanggal Ini
            </button>
          </div>
        {:else}
          <div class="date-events-list">
            {#each selectedDateEvents() as ev (ev.id)}
              {@const p = categoryPresets.find(c => c.id === ev.category) || categoryPresets[0]}
              <div class="date-event-item card {ev.completed ? 'completed' : ''}">
                <div class="event-item-top">
                  <div class="flex items-center gap-2">
                    <button
                      class="check-btn {ev.completed ? 'checked' : ''}"
                      onclick={(e) => handleToggleDone(e, ev.id, ev.completed)}
                      title={ev.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                    >
                      {ev.completed ? '✓' : ''}
                    </button>
                    <div>
                      <span class="category-badge-xs">{p.icon} {p.label}</span>
                      <h4 class="event-title-sm {ev.completed ? 'line-through text-muted' : ''}">{ev.title}</h4>
                    </div>
                  </div>
                  <div class="event-actions-xs">
                    <button class="btn-icon btn-ghost btn-sm" onclick={() => openEditModal(ev)}>✏️</button>
                    <button class="btn-icon btn-ghost btn-sm text-danger" onclick={(e) => handleDeleteEvent(e, ev.id, ev.title)}>🗑️</button>
                  </div>
                </div>

                <div class="event-item-details mt-2">
                  {#if ev.startTime}
                    <span class="text-xs text-muted">⏰ {ev.startTime} {ev.endTime ? '- ' + ev.endTime : ''}</span>
                  {/if}
                  {#if ev.location}
                    <span class="text-xs text-muted">📍 {ev.location}</span>
                  {/if}
                  {#if ev.notes}
                    <p class="text-xs text-dark mt-1 bg-surface-hover p-2 rounded">📝 {ev.notes}</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Section 2: All Upcoming Events List with Filter -->
    <div class="upcoming-section">
      <div class="section-header-row mb-4">
        <div>
          <h2 class="section-title">Daftar Agenda & Countdown</h2>
          <p class="section-subtitle">Semua agenda penting menuju hari pernikahan Anda</p>
        </div>

        <!-- Filter tabs & search -->
        <div class="agenda-filter-row">
          <div class="tab-pills">
            <button class="tab-pill {activeTab === 'mendatang' ? 'active' : ''}" onclick={() => activeTab = 'mendatang'}>
              Mendatang ({cs.upcoming})
            </button>
            <button class="tab-pill {activeTab === 'semua' ? 'active' : ''}" onclick={() => activeTab = 'semua'}>
              Semua ({cs.total})
            </button>
            <button class="tab-pill {activeTab === 'selesai' ? 'active' : ''}" onclick={() => activeTab = 'selesai'}>
              Selesai ({cs.completed})
            </button>
          </div>

          <select class="form-select filter-cat-sel" bind:value={filterCategory}>
            <option value="semua">Semua Kategori</option>
            {#each categoryPresets as cp}
              <option value={cp.id}>{cp.icon} {cp.label}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Events List -->
      {#if filteredEventsList().length === 0}
        <div class="empty-state-card">
          <div class="empty-icon">📅</div>
          <h3>Tidak ada agenda sesuai filter</h3>
          <p class="text-muted">Coba ganti tab atau tambah jadwal acara baru.</p>
        </div>
      {:else}
        <div class="events-list-grid">
          {#each filteredEventsList() as ev (ev.id)}
            {@const p = categoryPresets.find(c => c.id === ev.category) || categoryPresets[0]}
            {@const diff = getDaysDiff(ev.date)}
            <div class="event-full-card card {ev.completed ? 'completed-card' : ''}">
              <div class="card-left-accent bar-{p.color}"></div>
              <div class="card-body-content">
                <div class="event-meta-top">
                  <div class="flex items-center gap-2">
                    <span class="badge badge-outline">{p.icon} {p.label}</span>
                    <span class="badge {diff.cls}">{diff.label}</span>
                  </div>
                  <span class="event-date-badge font-semibold">{formatDate(ev.date)}</span>
                </div>

                <div class="event-title-row mt-2">
                  <button
                    class="check-btn {ev.completed ? 'checked' : ''}"
                    onclick={(e) => handleToggleDone(e, ev.id, ev.completed)}
                    title={ev.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                  >
                    {ev.completed ? '✓' : ''}
                  </button>
                  <h3 class="event-name-heading {ev.completed ? 'line-through text-muted' : ''}">{ev.title}</h3>
                </div>

                {#if ev.startTime || ev.location}
                  <div class="event-info-pills mt-2">
                    {#if ev.startTime}
                      <span class="info-pill">
                        ⏰ {ev.startTime} {ev.endTime ? '- ' + ev.endTime : ''}
                      </span>
                    {/if}
                    {#if ev.location}
                      <span class="info-pill">
                        📍 {ev.location}
                      </span>
                    {/if}
                  </div>
                {/if}

                {#if ev.notes}
                  <p class="event-notes-box text-xs mt-2">
                    {ev.notes}
                  </p>
                {/if}
              </div>

              <div class="card-right-actions">
                <button class="btn-icon btn-ghost btn-sm" title="Edit Agenda" onclick={() => openEditModal(ev)}>✏️</button>
                <button class="btn-icon btn-ghost btn-sm text-danger" title="Hapus Agenda" onclick={(e) => handleDeleteEvent(e, ev.id, ev.title)}>🗑️</button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Modal Add/Edit Event -->
{#if showModal}
  <div class="modal-overlay animate-fade-in" onclick={() => showModal = false} role="dialog" aria-modal="true">
    <div class="modal card max-w-lg" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3 class="modal-title">{isEditing ? 'Edit Agenda Acara' : 'Tambah Agenda Acara Baru'}</h3>
        <button class="btn-icon btn-ghost" onclick={() => showModal = false}>✕</button>
      </div>

      <div class="modal-body">
        <!-- Quick Title Presets -->
        {#if !isEditing}
          <div class="form-group mb-3">
            <label class="form-label text-xs">Pilihan Cepat Agenda:</label>
            <div class="quick-presets-scroll">
              {#each quickTitleTemplates as q}
                <button
                  type="button"
                  class="preset-chip"
                  onclick={() => formTitle = q}
                >{q}</button>
              {/each}
            </div>
          </div>
        {/if}

        <div class="form-group mb-3">
          <label class="form-label" for="evTitle">Judul Acara / Kegiatan *</label>
          <input
            id="evTitle"
            type="text"
            class="form-input"
            placeholder="Misal: Fitting Busana Pengantin Perdana"
            bind:value={formTitle}
          />
        </div>

        <div class="grid-2 mb-3">
          <div class="form-group">
            <label class="form-label" for="evDate">Tanggal Acara *</label>
            <input
              id="evDate"
              type="date"
              class="form-input"
              bind:value={formDate}
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="evCategory">Kategori Acara</label>
            <select id="evCategory" class="form-select" bind:value={formCategory}>
              {#each categoryPresets as cp}
                <option value={cp.id}>{cp.icon} {cp.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="grid-2 mb-3">
          <div class="form-group">
            <label class="form-label" for="evStart">Waktu Mulai</label>
            <input
              id="evStart"
              type="time"
              class="form-input"
              bind:value={formStartTime}
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="evEnd">Waktu Selesai</label>
            <input
              id="evEnd"
              type="time"
              class="form-input"
              bind:value={formEndTime}
            />
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label" for="evLoc">Lokasi / Tempat</label>
          <input
            id="evLoc"
            type="text"
            class="form-input"
            placeholder="Misal: Butik MUA Rias, Dapur Katering, Gedung Aula"
            bind:value={formLocation}
          />
        </div>

        <div class="form-group mb-4">
          <label class="form-label" for="evNotes">Catatan / Hal yang Perlu Disiapkan</label>
          <textarea
            id="evNotes"
            class="form-textarea"
            rows="2"
            placeholder="Barang bawaan, daftar pertanyaan ke vendor, peserta yang hadir..."
            bind:value={formNotes}
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick={() => showModal = false}>Batal</button>
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleSaveEvent}
          disabled={!formTitle.trim()}
        >
          {isEditing ? 'Simpan Perubahan' : 'Jadwalkan Acara'}
        </button>
      </div>
    </div>
  </div>
{/if}

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

  .bg-blue-soft { background: rgba(106, 138, 184, 0.15); color: #436696; }
  .bg-amber-soft { background: rgba(212, 149, 106, 0.15); color: #b06b3a; }
  .bg-green-soft { background: rgba(107, 171, 138, 0.15); color: #3b7b59; }
  .bg-terracotta-soft { background: rgba(201, 132, 122, 0.15); color: var(--color-accent); }

  .stat-info { display: flex; flex-direction: column; }
  .stat-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 500; }
  .stat-value { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-text); line-height: 1.2; margin: 2px 0; }
  .stat-sub { font-size: 11.5px; color: var(--color-text-subtle); }

  /* Calendar Layout */
  .calendar-layout {
    display: grid;
    grid-template-columns: 7fr 5fr;
    gap: var(--space-6);
  }

  .calendar-card {
    padding: var(--space-6);
  }

  .calendar-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  .month-title-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .month-heading {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .month-nav-btns {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .weekdays-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--color-text-muted);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border-light);
  }

  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-top: 6px;
  }

  .day-cell {
    min-height: 65px;
    padding: 6px;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all var(--transition-fast);
    background: var(--color-surface);
  }

  .day-cell:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-border);
  }

  .day-cell.other-month {
    opacity: 0.35;
  }

  .day-cell.today {
    background: rgba(201, 132, 122, 0.08);
    font-weight: 700;
  }
  .day-cell.today .day-number {
    color: var(--color-accent);
  }

  .day-cell.wedding-day {
    background: rgba(201, 132, 122, 0.18);
    border-color: var(--color-accent);
  }

  .day-cell.selected {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px rgba(201, 132, 122, 0.25);
  }

  .day-number-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
  }

  .wedding-ring-icon {
    font-size: 12px;
    line-height: 1;
  }

  .day-events-dots {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 3px;
    margin-top: 4px;
  }

  .event-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .dot-accent { background: var(--color-accent); }
  .dot-warning { background: #d4956a; }
  .dot-info { background: #6a8ab8; }
  .dot-primary { background: #8b5e52; }
  .dot-danger { background: #e05252; }
  .dot-neutral { background: #999; }

  .more-dots {
    font-size: 9px;
    color: var(--color-text-subtle);
    font-weight: 600;
  }

  .calendar-legend {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    font-size: 11.5px;
    color: var(--color-text-muted);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .today-dot { background: var(--color-accent); }
  .wedding-dot { background: #e05252; }
  .event-dot-sm { background: #6a8ab8; }

  /* Selected Date Card */
  .selected-date-card {
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
  }

  .selected-date-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border-light);
  }

  .selected-date-title {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--color-text);
    margin: 2px 0 0;
  }

  .date-empty-state {
    text-align: center;
    padding: var(--space-10) var(--space-4);
    margin: auto 0;
  }

  .empty-emoji {
    font-size: 2.5rem;
    display: block;
    margin-bottom: var(--space-2);
  }

  .date-events-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-top: var(--space-4);
    max-height: 400px;
    overflow-y: auto;
  }

  .date-event-item {
    padding: var(--space-3);
    border: 1px solid var(--color-border-light);
  }

  .date-event-item.completed {
    opacity: 0.7;
    background: var(--color-surface-hover);
  }

  .event-item-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .check-btn {
    width: 20px;
    height: 20px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--color-border);
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
    color: #fff;
    flex-shrink: 0;
  }

  .check-btn.checked {
    background: #4caf50;
    border-color: #4caf50;
  }

  .category-badge-xs {
    font-size: 10.5px;
    color: var(--color-accent);
    font-weight: 600;
    display: block;
    line-height: 1.2;
  }

  .event-title-sm {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    margin: 2px 0 0;
  }

  .event-actions-xs {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  /* Upcoming Section */
  .section-header-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .section-title {
    font-size: var(--font-size-lg);
    font-weight: 700;
    margin: 0;
  }

  .section-subtitle {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 2px 0 0;
  }

  .agenda-filter-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .tab-pills {
    display: flex;
    background: var(--color-surface-hover);
    padding: 3px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border-light);
  }

  .tab-pill {
    padding: 4px 12px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-muted);
    background: none;
    border: none;
    cursor: pointer;
  }

  .tab-pill.active {
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .filter-cat-sel {
    font-size: 12px;
    padding: 5px 10px;
    width: auto;
  }

  /* Events Full Grid */
  .events-list-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .event-full-card {
    display: flex;
    align-items: stretch;
    padding: 0;
    overflow: hidden;
    transition: transform var(--transition-fast);
  }

  .event-full-card:hover {
    transform: translateX(2px);
  }

  .card-left-accent {
    width: 6px;
    flex-shrink: 0;
  }

  .bar-accent { background: var(--color-accent); }
  .bar-warning { background: #d4956a; }
  .bar-info { background: #6a8ab8; }
  .bar-primary { background: #8b5e52; }
  .bar-danger { background: #e05252; }
  .bar-neutral { background: #999; }

  .card-body-content {
    flex: 1;
    padding: var(--space-4);
  }

  .event-meta-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
  }

  .event-date-badge {
    color: var(--color-text);
  }

  .event-title-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .event-name-heading {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .event-info-pills {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .info-pill {
    font-size: 11.5px;
    color: var(--color-text-muted);
  }

  .event-notes-box {
    color: var(--color-text-muted);
    background: var(--color-surface-hover);
    padding: 6px 10px;
    border-radius: var(--radius-sm);
  }

  .card-right-actions {
    display: flex;
    align-items: center;
    padding: 0 var(--space-3);
    gap: 2px;
  }

  .quick-presets-scroll {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-height: 80px;
    overflow-y: auto;
  }

  .preset-chip {
    padding: 3px 8px;
    background: var(--color-surface-hover);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    font-size: 11px;
    color: var(--color-text);
    cursor: pointer;
  }
  .preset-chip:hover {
    background: rgba(201, 132, 122, 0.15);
    border-color: var(--color-accent);
  }

  @media (max-width: 860px) {
    .calendar-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
