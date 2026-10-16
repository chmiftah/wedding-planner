<script lang="ts">
  import {
    wedding,
    guestSummary,
    addGuest,
    updateGuest,
    deleteGuest,
    batchAddGuests,
    batchDeleteGuests,
    type Guest,
  } from "#lib/stores/wedding";
  import {
    categoryLabel,
    rsvpStatusLabel,
    formatDate,
  } from "#lib/utils/format";
  import { exportGuestsToExcel } from "#lib/utils/exportExcel";

  // --- UI & Filter States ---
  let searchQuery = $state("");
  let filterStatus = $state<string>("all");
  let filterCategory = $state<string>("all");
  let sortBy = $state<"name-asc" | "name-desc" | "pax-desc" | "status">(
    "name-asc",
  );
  let copiedToken = $state<string | null>(null);

  // --- Modals State ---
  let showAddModal = $state(false);
  let showEditModal = $state(false);
  let showBulkModal = $state(false);
  let showDeleteConfirm = $state(false);
  let guestToDelete = $state<Guest | null>(null);

  // --- Quick Add Inline State ---
  let quickName = $state("");
  let quickCategory = $state<string>("teman");

  // --- Single Form State (Add / Edit) ---
  let formId = $state<string | null>(null);
  let formName = $state("");
  let formPhone = $state("");
  let formEmail = $state("");
  let formCategory = $state<string>("teman");
  let formGuestCount = $state(1);
  let formRsvpStatus = $state<"pending" | "hadir" | "tidak_hadir">("pending");
  let formRsvpMessage = $state("");

  // --- Bulk Import State ---
  let bulkNamesText = $state("");
  let bulkCategory = $state<string>("teman");
  let bulkDefaultPax = $state(1);

  // --- Batch Selection State ---
  let selectedIds = $state<string[]>([]);

  // --- Toast Notification ---
  let toastMsg = $state<string | null>(null);
  let toastTimer: any = null;

  function showToast(message: string) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMsg = message;
    toastTimer = setTimeout(() => {
      toastMsg = null;
    }, 3000);
  }

  const gs = $derived($guestSummary);

  const availableCategories = [
    { id: "keluarga_inti", label: "Keluarga Inti" },
    { id: "keluarga_jauh", label: "Keluarga Besar" },
    { id: "teman", label: "Teman" },
    { id: "kolega", label: "Kolega / Rekan Kerja" },
    { id: "vip", label: "VIP" },
    { id: "tetangga", label: "Tetangga" },
    { id: "lainnya", label: "Lainnya" },
  ];

  // Filtered & Sorted Guest List
  const filteredGuests = $derived(() => {
    let list = $wedding.guests.filter((g) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        (g.phone && g.phone.includes(q)) ||
        (g.email && g.email.toLowerCase().includes(q));
      const matchStatus =
        filterStatus === "all" || g.rsvpStatus === filterStatus;
      const matchCat =
        filterCategory === "all" || g.category === filterCategory;
      return matchSearch && matchStatus && matchCat;
    });

    if (sortBy === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name, "id"));
    } else if (sortBy === "name-desc") {
      list.sort((a, b) => b.name.localeCompare(a.name, "id"));
    } else if (sortBy === "pax-desc") {
      list.sort((a, b) => (b.guestCount || 1) - (a.guestCount || 1));
    } else if (sortBy === "status") {
      const order: Record<string, number> = {
        hadir: 1,
        pending: 2,
        tidak_hadir: 3,
      };
      list.sort(
        (a, b) => (order[a.rsvpStatus] || 4) - (order[b.rsvpStatus] || 4),
      );
    }
    return list;
  });

  function getRsvpUrl(token: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/rsvp/${token}`;
  }

  async function copyRsvpLink(token: string) {
    try {
      await navigator.clipboard.writeText(getRsvpUrl(token));
      copiedToken = token;
      showToast("Tautan RSVP unik berhasil disalin!");
      setTimeout(() => (copiedToken = null), 2000);
    } catch {
      showToast("Gagal menyalin tautan");
    }
  }

  function getWhatsAppLink(guest: Guest) {
    if (!guest.phone) return null;
    const cleanPhone = guest.phone.replace(/[^0-9]/g, "");
    const phoneFormatted = cleanPhone.startsWith("0")
      ? "62" + cleanPhone.slice(1)
      : cleanPhone;
    const coupleName =
      $wedding.info.groomName && $wedding.info.brideName
        ? `${$wedding.info.groomName} & ${$wedding.info.brideName}`
        : "Pernikahan Kami";
    const weddingDateStr = $wedding.info.weddingDate
      ? formatDate($wedding.info.weddingDate)
      : "Hari Bahagia";
    const rsvpLink = getRsvpUrl(guest.rsvpToken);

    const text = `Halo ${guest.name},\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Anda untuk hadir di momen bahagia kami:\n\n💍 *The Wedding of ${coupleName}*\n📅 *${weddingDateStr}*\n\nInformasi lengkap dan konfirmasi kehadiran (RSVP) dapat diakses melalui tautan berikut:\n${rsvpLink}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.\n\nTerima kasih.`;

    return `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(text)}`;
  }

  // --- CRUD Functions ---
  function openAddModal() {
    formId = null;
    formName = "";
    formPhone = "";
    formEmail = "";
    formCategory = "teman";
    formGuestCount = 1;
    formRsvpStatus = "pending";
    formRsvpMessage = "";
    showAddModal = true;
  }

  function openEditModal(guest: Guest) {
    formId = guest.id;
    formName = guest.name;
    formPhone = guest.phone || "";
    formEmail = guest.email || "";
    formCategory = guest.category || "teman";
    formGuestCount = guest.guestCount || 1;
    formRsvpStatus = guest.rsvpStatus || "pending";
    formRsvpMessage = guest.rsvpMessage || "";
    showEditModal = true;
  }

  function handleSaveGuest() {
    if (!formName.trim()) return;

    if (formId) {
      // Edit mode
      updateGuest(formId, {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        category: formCategory,
        guestCount: Math.max(1, Number(formGuestCount) || 1),
        rsvpStatus: formRsvpStatus,
        rsvpMessage: formRsvpMessage.trim(),
        rsvpRespondedAt:
          formRsvpStatus !== "pending" ? new Date().toISOString() : null,
      });
      showToast(`Data tamu "${formName.trim()}" berhasil diperbarui!`);
      showEditModal = false;
    } else {
      // Add mode
      addGuest({
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        category: formCategory,
        guestCount: Math.max(1, Number(formGuestCount) || 1),
        rsvpStatus: formRsvpStatus,
        rsvpMessage: formRsvpMessage.trim(),
      });
      showToast(`Tamu "${formName.trim()}" berhasil ditambahkan!`);
      showAddModal = false;
    }
  }

  function handleQuickAdd() {
    if (!quickName.trim()) return;
    addGuest({
      name: quickName.trim(),
      category: quickCategory,
      guestCount: 1,
      phone: "",
      email: "",
      rsvpStatus: "pending",
    });
    showToast(`"${quickName.trim()}" ditambahkan ke daftar tamu`);
    quickName = "";
  }

  function confirmDelete(guest: Guest) {
    guestToDelete = guest;
    showDeleteConfirm = true;
  }

  function executeDelete() {
    if (guestToDelete) {
      deleteGuest(guestToDelete.id);
      selectedIds = selectedIds.filter((id) => id !== guestToDelete?.id);
      showToast(`Tamu "${guestToDelete.name}" telah dihapus.`);
      guestToDelete = null;
    }
    showDeleteConfirm = false;
  }

  function handleQuickRsvpChange(
    guest: Guest,
    newStatus: "pending" | "hadir" | "tidak_hadir",
  ) {
    updateGuest(guest.id, {
      rsvpStatus: newStatus,
      rsvpRespondedAt:
        newStatus !== "pending" ? new Date().toISOString() : null,
    });
    showToast(
      `Status RSVP ${guest.name} diubah ke ${rsvpStatusLabel(newStatus)}`,
    );
  }

  // --- Batch Actions ---
  function toggleSelectAll() {
    const currentList = filteredGuests();
    if (selectedIds.length === currentList.length && currentList.length > 0) {
      selectedIds = [];
    } else {
      selectedIds = currentList.map((g) => g.id);
    }
  }

  function toggleSelectGuest(id: string) {
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter((item) => item !== id);
    } else {
      selectedIds = [...selectedIds, id];
    }
  }

  function handleBatchDelete() {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (confirm(`Yakin ingin menghapus ${count} tamu yang dipilih?`)) {
      batchDeleteGuests(selectedIds);
      selectedIds = [];
      showToast(`${count} tamu berhasil dihapus.`);
    }
  }

  function handleBatchUpdateStatus(
    status: "pending" | "hadir" | "tidak_hadir",
  ) {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      updateGuest(id, {
        rsvpStatus: status,
        rsvpRespondedAt: status !== "pending" ? new Date().toISOString() : null,
      });
    });
    showToast(
      `${selectedIds.length} tamu ditandai "${rsvpStatusLabel(status)}"`,
    );
    selectedIds = [];
  }

  // --- Bulk Add (Import) ---
  function handleBulkImport() {
    const lines = bulkNamesText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const listToInsert = lines.map((name) => ({
      name,
      category: bulkCategory,
      guestCount: Math.max(1, bulkDefaultPax),
    }));

    batchAddGuests(listToInsert);
    showToast(`Berhasil menambahkan ${listToInsert.length} tamu sekaligus!`);
    bulkNamesText = "";
    showBulkModal = false;
  }

  const statusColors: Record<string, string> = {
    pending: "badge-neutral",
    hadir: "badge-success",
    tidak_hadir: "badge-danger",
  };
</script>

<svelte:head>
  <title>Daftar Tamu & RSVP — Nikara</title>
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
        <span>👥 Buku Tamu & RSVP</span>
      </div>
      <h1 class="page-title">Daftar Tamu & RSVP</h1>
      <p class="page-subtitle">
        Kelola undangan personal, pantau kehadiran secara real-time, dan bagikan
        tautan via WhatsApp.
      </p>
    </div>

    <div class="header-actions">
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        onclick={() => exportGuestsToExcel($wedding)}
        title="Download file Excel (.xls)"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
          ></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="8" y1="13" x2="16" y2="13"></line>
          <line x1="8" y1="17" x2="16" y2="17"></line>
        </svg>
        <span>Export Excel</span>
      </button>

      <button
        type="button"
        class="btn btn-secondary btn-sm"
        onclick={() => (showBulkModal = true)}
        title="Tambah banyak nama sekaligus"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          <path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          ></path>
          <path d="M12 11h4"></path>
          <path d="M12 16h4"></path>
          <path d="M8 11h.01"></path>
          <path d="M8 16h.01"></path>
        </svg>
        <span>Import Massal</span>
      </button>

      <button
        type="button"
        class="btn btn-primary btn-sm"
        onclick={openAddModal}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span> Tambah Tamu</span>
      </button>
    </div>
  </div>

  <!-- Guest Statistics Bar -->
  <div class="stats-row mt-6">
    <div class="stat-card">
      <div class="stat-icon-wrapper bg-terracotta-soft">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-label">Total Diundang</span>
        <span class="stat-value"
          >{gs.total} <small class="text-subtle font-normal">tamu</small></span
        >
        <span class="stat-sub">Semua daftar undangan</span>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-green-soft">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-label">Konfirmasi Hadir</span>
        <span class="stat-value text-success"
          >{gs.hadir}
          <small class="text-subtle font-normal">undangan</small></span
        >
        <span class="stat-sub"
          >Perkiraan <strong>{gs.totalHadir} Pax</strong> hadir</span
        >
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-amber-soft">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-label">Belum Respons</span>
        <span class="stat-value text-warning">{gs.pending}</span>
        <span class="stat-sub">Menunggu konfirmasi</span>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon-wrapper bg-red-soft">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-label">Tidak Hadir</span>
        <span class="stat-value text-danger">{gs.tidakHadir}</span>
        <span class="stat-sub">Berhalangan hadir</span>
      </div>
    </div>
  </div>

  <!-- RSVP Progress Bar -->
  {#if gs.total > 0}
    <div class="rsvp-overall-progress mt-4">
      <div class="progress-info-row">
        <span class="progress-title">Progres Konfirmasi Kehadiran</span>
        <span class="progress-percentage">
          {Math.round(((gs.hadir + gs.tidakHadir) / gs.total) * 100)}% Direspon
          ({gs.hadir + gs.tidakHadir}/{gs.total})
        </span>
      </div>
      <div class="progress-bar-track">
        <div
          class="bar-fill fill-hadir"
          style="width: {(gs.hadir / gs.total) * 100}%"
          title="Hadir: {gs.hadir}"
        ></div>
        <div
          class="bar-fill fill-tidak"
          style="width: {(gs.tidakHadir / gs.total) * 100}%"
          title="Tidak Hadir: {gs.tidakHadir}"
        ></div>
      </div>
    </div>
  {/if}

  <div class="mt-6">
    <!-- Quick Add Inline Bar -->
    <!-- Quick Add Inline Bar -->
    <div class="quick-add-card mb-5">
      <div class="quick-add-inner">
        <span class="quick-add-icon">⚡</span>
        <input
          type="text"
          class="form-input quick-input"
          placeholder="Tambah tamu cepat... (Ketik nama lalu Enter)"
          bind:value={quickName}
          onkeydown={(e) => e.key === "Enter" && handleQuickAdd()}
        />
        <select class="form-select quick-cat-select" bind:value={quickCategory}>
          {#each availableCategories as cat}
            <option value={cat.id}>{cat.label}</option>
          {/each}
        </select>
        <button
          type="button"
          class="btn btn-primary btn-sm"
          onclick={handleQuickAdd}
          disabled={!quickName.trim()}
        >
          + Tambah Cepat
        </button>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="toolbar-card mb-5">
      <div class="toolbar-main-row">
        <!-- Search Input -->
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="form-input search-input"
            bind:value={searchQuery}
            placeholder="Cari nama, WhatsApp, atau email tamu..."
          />
          {#if searchQuery}
            <button
              type="button"
              class="clear-search-btn"
              onclick={() => (searchQuery = "")}>✕</button
            >
          {/if}
        </div>

        <!-- Status Filter Pills -->
        <div class="status-pills">
          <button
            type="button"
            class="status-pill {filterStatus === 'all' ? 'active' : ''}"
            onclick={() => (filterStatus = "all")}
          >
            Semua ({gs.total})
          </button>
          <button
            type="button"
            class="status-pill pill-hadir {filterStatus === 'hadir'
              ? 'active'
              : ''}"
            onclick={() => (filterStatus = "hadir")}
          >
            Hadir ({gs.hadir})
          </button>
          <button
            type="button"
            class="status-pill pill-pending {filterStatus === 'pending'
              ? 'active'
              : ''}"
            onclick={() => (filterStatus = "pending")}
          >
            Pending ({gs.pending})
          </button>
          <button
            type="button"
            class="status-pill pill-tidak {filterStatus === 'tidak_hadir'
              ? 'active'
              : ''}"
            onclick={() => (filterStatus = "tidak_hadir")}
          >
            Tidak Hadir ({gs.tidakHadir})
          </button>
        </div>

        <!-- Category & Sort Dropdowns -->
        <div class="toolbar-dropdowns">
          <select
            class="form-select filter-dropdown"
            bind:value={filterCategory}
          >
            <option value="all">Semua Kategori</option>
            {#each availableCategories as cat}
              <option value={cat.id}>{cat.label}</option>
            {/each}
          </select>

          <select class="form-select filter-dropdown" bind:value={sortBy}>
            <option value="name-asc">Nama (A-Z)</option>
            <option value="name-desc">Nama (Z-A)</option>
            <option value="pax-desc">Pax Terbanyak</option>
            <option value="status">Status Kehadiran</option>
          </select>
        </div>
      </div>

      <!-- Batch Action Bar (Appears when items are checked) -->
      {#if selectedIds.length > 0}
        <div class="batch-action-bar animate-fade-in mt-3">
          <div class="batch-info">
            <span class="batch-badge">{selectedIds.length}</span>
            <span class="batch-text">tamu dipilih</span>
          </div>

          <div class="batch-buttons">
            <button
              type="button"
              class="btn btn-sm btn-outline-success"
              onclick={() => handleBatchUpdateStatus("hadir")}
            >
              ✓ Tandai Hadir
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-warning"
              onclick={() => handleBatchUpdateStatus("pending")}
            >
              ⏱️ Tandai Pending
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              onclick={() => handleBatchUpdateStatus("tidak_hadir")}
            >
              ✕ Tandai Tidak Hadir
            </button>
            <button
              type="button"
              class="btn btn-sm btn-danger"
              onclick={handleBatchDelete}
            >
              🗑️ Hapus ({selectedIds.length})
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Empty State -->
    {#if $wedding.guests.length === 0}
      <div class="empty-state-card">
        <div class="empty-icon-circle">💌</div>
        <h3 class="empty-title">Belum Ada Daftar Tamu</h3>
        <p class="empty-desc">
          Mulai catat tamu undangan pernikahan Anda untuk membagikan tautan
          undangan digital dan memantau RSVP secara rapi.
        </p>
        <div class="empty-actions">
          <button type="button" class="btn btn-primary" onclick={openAddModal}>
            + Tambah Tamu Pertama
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            onclick={() => (showBulkModal = true)}
          >
            Import Banyak Nama
          </button>
        </div>
      </div>
    {:else}
      <!-- Guest Data Table -->
      <div class="table-container-card">
        <div class="table-responsive">
          <table class="tamu-table">
            <thead>
              <tr>
                <th style="width: 44px; text-align: center;">
                  <input
                    type="checkbox"
                    class="table-checkbox"
                    checked={selectedIds.length === filteredGuests().length &&
                      filteredGuests().length > 0}
                    onchange={toggleSelectAll}
                    title="Pilih semua tamu di daftar ini"
                  />
                </th>
                <th>Tamu & Informasi</th>
                <th>Kategori</th>
                <th>Pax</th>
                <th>Kontak & WhatsApp</th>
                <th>Status RSVP</th>
                <th>Tautan Undangan</th>
                <th style="text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredGuests() as guest (guest.id)}
                {@const isSelected = selectedIds.includes(guest.id)}
                {@const waLink = getWhatsAppLink(guest)}
                <tr class="tamu-row {isSelected ? 'row-selected' : ''}">
                  <!-- Checkbox -->
                  <td style="text-align: center;">
                    <input
                      type="checkbox"
                      class="table-checkbox"
                      checked={isSelected}
                      onchange={() => toggleSelectGuest(guest.id)}
                    />
                  </td>

                  <!-- Tamu & Avatar -->
                  <td>
                    <div class="guest-identity-cell">
                      <div
                        class="guest-avatar"
                        style="--initial-color: var(--color-accent)"
                      >
                        {guest.name.charAt(0).toUpperCase()}
                      </div>
                      <div class="guest-meta-block">
                        <span class="guest-name-text">{guest.name}</span>
                        {#if guest.email}
                          <span class="guest-email-sub">{guest.email}</span>
                        {/if}
                        {#if guest.rsvpMessage}
                          <p class="guest-msg-quote">"{guest.rsvpMessage}"</p>
                        {/if}
                      </div>
                    </div>
                  </td>

                  <!-- Kategori -->
                  <td>
                    <span
                      class="category-pill pill-{guest.category || 'teman'}"
                    >
                      {categoryLabel(guest.category || "teman")}
                    </span>
                  </td>

                  <!-- Pax -->
                  <td>
                    <div class="pax-badge">
                      <span class="pax-num">{guest.guestCount || 1}</span>
                      <span class="pax-unit">pax</span>
                    </div>
                  </td>

                  <!-- Kontak & WhatsApp Direct -->
                  <td>
                    <div class="contact-actions-cell">
                      {#if guest.phone}
                        <span class="phone-text">{guest.phone}</span>
                        {#if waLink}
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="wa-direct-btn"
                            title="Kirim undangan langsung via WhatsApp"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path
                                d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.048-2.073-.526-1.637-.681-2.696-2.348-2.778-2.459-.081-.11-.664-.884-.664-1.685 0-.802.42-1.196.57-1.357.149-.162.327-.202.436-.202.11 0 .219.002.316.007.102.006.239-.039.373.285.14.337.478 1.168.52 1.254.043.085.071.185.014.298-.056.113-.085.183-.17.283-.084.1-.177.223-.253.3-.084.084-.173.176-.074.346.098.17.438.723.94 1.17.646.576 1.19.754 1.36.839.17.085.27.071.371-.044.101-.115.433-.505.549-.677.115-.173.232-.144.389-.086.158.058 1.002.472 1.174.558.172.086.287.129.33.201.042.072.042.42-.102.825zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.435 5.176L2 22l4.957-1.3c1.474.839 3.176 1.3 4.975 1.3 5.523 0 10-4.477 10-10S17.523 2 12 2z"
                              />
                            </svg>
                            <span>Kirim WA</span>
                          </a>
                        {/if}
                      {:else}
                        <button
                          type="button"
                          class="add-phone-btn"
                          onclick={() => openEditModal(guest)}
                          title="Tambahkan nomor WhatsApp tamu"
                        >
                          + No. HP
                        </button>
                      {/if}
                    </div>
                  </td>

                  <!-- Status RSVP & Quick Toggle -->
                  <td>
                    <div class="rsvp-status-cell">
                      <select
                        class="status-select select-{guest.rsvpStatus}"
                        value={guest.rsvpStatus}
                        onchange={(e) =>
                          handleQuickRsvpChange(
                            guest,
                            e.currentTarget.value as any,
                          )}
                        title="Klik untuk mengubah status RSVP"
                      >
                        <option value="pending">⏳ Belum Respons</option>
                        <option value="hadir">✓ Konfirmasi Hadir</option>
                        <option value="tidak_hadir">✕ Tidak Hadir</option>
                      </select>
                      {#if guest.rsvpRespondedAt}
                        <span class="responded-date-sub"
                          >{formatDate(guest.rsvpRespondedAt)}</span
                        >
                      {/if}
                    </div>
                  </td>

                  <!-- Link Undangan Unik -->
                  <td>
                    <div class="rsvp-link-cell">
                      <button
                        type="button"
                        class="btn-copy-link {copiedToken === guest.rsvpToken
                          ? 'copied'
                          : ''}"
                        onclick={() => copyRsvpLink(guest.rsvpToken)}
                        title={getRsvpUrl(guest.rsvpToken)}
                      >
                        {#if copiedToken === guest.rsvpToken}
                          ✓ Tersalin!
                        {:else}
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path
                              d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                            ></path>
                            <path
                              d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                            ></path>
                          </svg>
                          <span>Salin Link</span>
                        {/if}
                      </button>

                      <a
                        href={getRsvpUrl(guest.rsvpToken)}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn-preview-link"
                        title="Buka pratinjau halaman undangan untuk tamu ini"
                      >
                        ↗
                      </a>
                    </div>
                  </td>

                  <!-- Aksi (Edit & Hapus) -->
                  <td style="text-align: right;">
                    <div class="row-actions">
                      <button
                        type="button"
                        class="action-btn edit-btn"
                        onclick={() => openEditModal(guest)}
                        title="Edit data tamu"
                        aria-label="Edit {guest.name}"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path
                            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                          ></path>
                          <path
                            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                          ></path>
                        </svg>
                      </button>

                      <button
                        type="button"
                        class="action-btn delete-btn"
                        onclick={() => confirmDelete(guest)}
                        title="Hapus tamu ini"
                        aria-label="Hapus {guest.name}"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if filteredGuests().length === 0}
          <div class="no-filter-results">
            <p>Tidak ada tamu yang cocok dengan pencarian atau filter.</p>
            <button
              type="button"
              class="btn btn-secondary btn-sm mt-2"
              onclick={() => {
                searchQuery = "";
                filterStatus = "all";
                filterCategory = "all";
              }}
            >
              Reset Filter
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- ============================================== -->
<!-- MODAL: TAMBAH / EDIT TAMU                      -->
<!-- ============================================== -->
{#if showAddModal || showEditModal}
  <div
    class="modal-overlay"
    onclick={() => {
      showAddModal = false;
      showEditModal = false;
    }}
  >
    <div class="modal modal-lg" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <div>
          <h3 class="modal-title">
            {showEditModal ? "Edit Data Tamu" : "Tambah Tamu Baru"}
          </h3>
          <p class="modal-subtitle">
            {showEditModal
              ? "Perbarui informasi kontak, kategori, atau status RSVP."
              : "Masukkan nama dan rincian tamu undangan."}
          </p>
        </div>
        <button
          type="button"
          class="btn-close-modal"
          onclick={() => {
            showAddModal = false;
            showEditModal = false;
          }}>✕</button
        >
      </div>

      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleSaveGuest();
        }}
      >
        <div class="modal-body">
          <div class="form-group mb-4">
            <label class="form-label" for="formName"
              >Nama Tamu <span class="text-danger">*</span></label
            >
            <input
              id="formName"
              type="text"
              class="form-input"
              placeholder="Contoh: Budi Santoso & Partner"
              bind:value={formName}
              required
            />
          </div>

          <div class="grid-2 mb-4">
            <div class="form-group">
              <label class="form-label" for="formCategory">Kategori</label>
              <select
                id="formCategory"
                class="form-select"
                bind:value={formCategory}
              >
                {#each availableCategories as cat}
                  <option value={cat.id}>{cat.label}</option>
                {/each}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="formPax">Jumlah Tamu (Pax)</label>
              <input
                id="formPax"
                type="number"
                min="1"
                max="10"
                class="form-input"
                bind:value={formGuestCount}
              />
              <span class="field-hint"
                >Perkiraan kursi atau jatah porsi yang dialokasikan.</span
              >
            </div>
          </div>

          <div class="grid-2 mb-4">
            <div class="form-group">
              <label class="form-label" for="formPhone"
                >Nomor WhatsApp / HP</label
              >
              <input
                id="formPhone"
                type="tel"
                class="form-input"
                placeholder="08123456789"
                bind:value={formPhone}
              />
              <span class="field-hint"
                >Digunakan untuk mengirim undangan langsung via WhatsApp.</span
              >
            </div>

            <div class="form-group">
              <label class="form-label" for="formEmail">Email (Opsional)</label>
              <input
                id="formEmail"
                type="email"
                class="form-input"
                placeholder="budi@example.com"
                bind:value={formEmail}
              />
            </div>
          </div>

          <div class="grid-2 mb-4">
            <div class="form-group">
              <label class="form-label" for="formStatus">Status RSVP</label>
              <select
                id="formStatus"
                class="form-select"
                bind:value={formRsvpStatus}
              >
                <option value="pending">⏳ Belum Respons (Pending)</option>
                <option value="hadir">✓ Konfirmasi Hadir</option>
                <option value="tidak_hadir">✕ Tidak Hadir</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="formMsg"
                >Ucapan / Catatan RSVP</label
              >
              <input
                id="formMsg"
                type="text"
                class="form-input"
                placeholder="Pesan ucapan atau catatan khusus tamu"
                bind:value={formRsvpMessage}
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            onclick={() => {
              showAddModal = false;
              showEditModal = false;
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            disabled={!formName.trim()}
          >
            {showEditModal ? "Simpan Perubahan" : "Tambahkan Tamu"}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- ============================================== -->
<!-- MODAL: IMPORT MASSAL (BULK ADD)                -->
<!-- ============================================== -->
{#if showBulkModal}
  <div class="modal-overlay" onclick={() => (showBulkModal = false)}>
    <div class="modal modal-lg" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Import Tamu Massal</h3>
          <p class="modal-subtitle">
            Paste daftar nama tamu (satu nama per baris) dari WhatsApp, Excel,
            atau catatan.
          </p>
        </div>
        <button
          type="button"
          class="btn-close-modal"
          onclick={() => (showBulkModal = false)}>✕</button
        >
      </div>

      <div class="modal-body">
        <div class="grid-2 mb-4">
          <div class="form-group">
            <label class="form-label" for="bulkCat">Kategori Default</label>
            <select id="bulkCat" class="form-select" bind:value={bulkCategory}>
              {#each availableCategories as cat}
                <option value={cat.id}>{cat.label}</option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="bulkPax">Alokasi Pax per Tamu</label>
            <input
              id="bulkPax"
              type="number"
              min="1"
              max="5"
              class="form-input"
              bind:value={bulkDefaultPax}
            />
          </div>
        </div>

        <div class="form-group mb-2">
          <label class="form-label" for="bulkNames"
            >Daftar Nama Tamu (Satu Nama per Baris)</label
          >
          <textarea
            id="bulkNames"
            class="form-textarea"
            rows="8"
            placeholder="Contoh:&#10;Ahmad Dahlan&#10;Bambang Pamungkas & Istri&#10;dr. Siti Nurhaliza&#10;Rian D'Masiv & Keluarga"
            bind:value={bulkNamesText}
          ></textarea>
          <span class="field-hint">
            Jumlah nama terdeteksi: <strong
              >{bulkNamesText.split("\n").filter((l) => l.trim().length > 0)
                .length} orang</strong
            >
          </span>
        </div>
      </div>

      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary"
          onclick={() => (showBulkModal = false)}
        >
          Batal
        </button>
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleBulkImport}
          disabled={!bulkNamesText.trim()}
        >
          Import Semua Nama
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ============================================== -->
<!-- MODAL: KONFIRMASI HAPUS                        -->
<!-- ============================================== -->
{#if showDeleteConfirm && guestToDelete}
  <div class="modal-overlay" onclick={() => (showDeleteConfirm = false)}>
    <div class="modal modal-sm" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3 class="modal-title text-danger">Hapus Tamu?</h3>
        <button
          type="button"
          class="btn-close-modal"
          onclick={() => (showDeleteConfirm = false)}>✕</button
        >
      </div>
      <div class="modal-body">
        <p>
          Apakah Anda yakin ingin menghapus <strong
            >"{guestToDelete.name}"</strong
          > dari daftar tamu?
        </p>
        <p class="text-xs text-muted mt-2">
          Tautan RSVP unik untuk tamu ini tidak akan dapat diakses lagi.
        </p>
      </div>
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary"
          onclick={() => (showDeleteConfirm = false)}
        >
          Batal
        </button>
        <button type="button" class="btn btn-danger" onclick={executeDelete}>
          Ya, Hapus Tamu
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Mobile Floating Action Button (FAB) -->
<button
  class="mobile-fab no-print hide-desktop"
  onclick={openAddModal}
  aria-label="Tambah Tamu Baru"
>
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
  <span>Tambah Tamu</span>
</button>

<style>
  /* ========================================= */
  /* STATS CARDS & RSVP PROGRESS               */
  /* ========================================= */

  /* ========================================= */
  /* STATS CARDS & RSVP PROGRESS               */
  /* ========================================= */
  .stats-row {
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
    flex-shrink: 0;
  }

  .bg-terracotta-soft {
    background: rgba(201, 132, 122, 0.15);
    color: var(--color-accent);
  }
  .bg-green-soft {
    background: rgba(107, 171, 138, 0.15);
    color: #2e6949;
  }
  .bg-amber-soft {
    background: rgba(212, 149, 106, 0.15);
    color: #a15f2d;
  }
  .bg-red-soft {
    background: rgba(192, 86, 90, 0.15);
    color: var(--color-danger);
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .stat-label {
    font-size: 11.5px;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .stat-value {
    font-size: 1.45rem;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.2;
    margin: 2px 0;
  }

  .stat-sub {
    font-size: 11px;
    color: var(--color-text-subtle);
  }

  .rsvp-overall-progress {
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
  }

  .progress-info-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 6px;
  }

  .progress-title {
    font-weight: 600;
    color: var(--color-accent);
  }

  .progress-percentage {
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .progress-bar-track {
    width: 100%;
    height: 8px;
    background: var(--color-border-light);
    border-radius: var(--radius-full);
    overflow: hidden;
    display: flex;
  }

  .bar-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .fill-hadir {
    background: var(--color-success);
  }

  .fill-tidak {
    background: var(--color-danger);
  }

  /* ========================================= */
  /* QUICK ADD BAR                             */
  /* ========================================= */
  .quick-add-card {
    background: #fffdfd;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-3) var(--space-4);
    box-shadow: 0 1px 3px rgba(139, 94, 82, 0.04);
  }

  .quick-add-inner {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .quick-add-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
  }

  .quick-input {
    flex: 1;
    min-width: 200px;
  }

  .quick-cat-select {
    width: auto;
    min-width: 160px;
  }

  /* ========================================= */
  /* TOOLBAR & FILTERS                         */
  /* ========================================= */
  .toolbar-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }

  .toolbar-main-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
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
    font-size: 13px;
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

  .status-pills {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(139, 94, 82, 0.06);
    padding: 3px;
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
    background: var(--color-card);
    color: var(--color-accent);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .toolbar-dropdowns {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .filter-dropdown {
    width: auto;
    min-width: 150px;
  }

  /* Batch Action Bar */
  .batch-action-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    background: rgba(201, 132, 122, 0.12);
    border: 1px solid rgba(201, 132, 122, 0.25);
    border-radius: var(--radius-md);
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .batch-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .batch-badge {
    background: var(--color-accent);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: var(--radius-full);
  }

  .batch-text {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-accent);
  }

  .batch-buttons {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .btn-outline-success {
    background: #fff;
    border: 1px solid var(--color-success);
    color: #2e6949;
  }
  .btn-outline-success:hover {
    background: var(--color-success-bg);
  }

  .btn-outline-warning {
    background: #fff;
    border: 1px solid var(--color-warning);
    color: #a15f2d;
  }
  .btn-outline-warning:hover {
    background: var(--color-warning-bg);
  }

  .btn-outline-danger {
    background: #fff;
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
  }
  .btn-outline-danger:hover {
    background: var(--color-danger-bg);
  }

  /* ========================================= */
  /* GUEST DATA TABLE                          */
  /* ========================================= */
  .table-container-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 1px 4px rgba(139, 94, 82, 0.04);
    overflow: hidden;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .tamu-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
  }

  .tamu-table th {
    background: #faf3f0;
    color: var(--color-accent);
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 12px 14px;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    white-space: nowrap;
  }

  .tamu-table td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--color-border-light);
    vertical-align: middle;
  }

  .tamu-row {
    transition: background var(--transition-fast);
  }

  .tamu-row:hover {
    background: rgba(201, 132, 122, 0.04);
  }

  .tamu-row.row-selected {
    background: rgba(201, 132, 122, 0.09);
  }

  .table-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--color-accent);
  }

  /* Guest Identity Cell */
  .guest-identity-cell {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 220px;
  }

  .guest-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      var(--color-primary),
      var(--color-accent)
    );
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .guest-meta-block {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .guest-name-text {
    font-weight: 600;
    color: var(--color-text);
    font-size: 14px;
  }

  .guest-email-sub {
    font-size: 11.5px;
    color: var(--color-text-subtle);
  }

  .guest-msg-quote {
    font-size: 11.5px;
    font-style: italic;
    color: var(--color-accent);
    margin: 2px 0 0;
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Category Pills */
  .category-pill {
    display: inline-flex;
    align-items: center;
    padding: 3px 9px;
    border-radius: var(--radius-full);
    font-size: 11.5px;
    font-weight: 600;
    white-space: nowrap;
  }

  .pill-keluarga_inti {
    background: #fee2e2;
    color: #991b1b;
  }
  .pill-keluarga_jauh {
    background: #ffedd5;
    color: #9a3412;
  }
  .pill-teman {
    background: #e0e7ff;
    color: #3730a3;
  }
  .pill-kolega {
    background: #f0fdf4;
    color: #166534;
  }
  .pill-vip {
    background: #fef3c7;
    color: #854d0e;
    font-weight: 700;
  }
  .pill-tetangga {
    background: #f3e8ff;
    color: #6b21a8;
  }
  .pill-lainnya {
    background: #f1f5f9;
    color: #475569;
  }

  /* Pax Badge */
  .pax-badge {
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
    background: rgba(139, 94, 82, 0.06);
    padding: 3px 8px;
    border-radius: var(--radius-sm);
  }

  .pax-num {
    font-weight: 700;
    color: var(--color-accent);
  }

  .pax-unit {
    font-size: 10.5px;
    color: var(--color-text-subtle);
  }

  /* Contact & WhatsApp */
  .contact-actions-cell {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 170px;
  }

  .phone-text {
    font-size: 12.5px;
    color: var(--color-text-muted);
  }

  .wa-direct-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 9px;
    background: #25d366;
    color: #ffffff;
    border-radius: var(--radius-full);
    font-size: 11.5px;
    font-weight: 600;
    text-decoration: none;
    transition: opacity var(--transition-fast);
    white-space: nowrap;
  }

  .wa-direct-btn:hover {
    opacity: 0.9;
  }

  .add-phone-btn {
    background: none;
    border: 1px dashed var(--color-border);
    color: var(--color-text-subtle);
    font-size: 11px;
    padding: 2px 7px;
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .add-phone-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  /* Status Select */
  .rsvp-status-cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 150px;
  }

  .status-select {
    padding: 4px 8px;
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
  }

  .select-hadir {
    background: var(--color-success-bg);
    color: #2e6949;
    border-color: rgba(107, 171, 138, 0.4);
  }

  .select-pending {
    background: var(--color-warning-bg);
    color: #a15f2d;
    border-color: rgba(212, 149, 106, 0.4);
  }

  .select-tidak_hadir {
    background: var(--color-danger-bg);
    color: var(--color-danger);
    border-color: rgba(192, 86, 90, 0.4);
  }

  .responded-date-sub {
    font-size: 10px;
    color: var(--color-text-subtle);
    padding-left: 4px;
  }

  /* RSVP Link Actions */
  .rsvp-link-cell {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 130px;
  }

  .btn-copy-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    background: rgba(201, 132, 122, 0.1);
    color: var(--color-accent);
    border: 1px solid rgba(201, 132, 122, 0.2);
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-copy-link:hover {
    background: rgba(201, 132, 122, 0.2);
  }

  .btn-copy-link.copied {
    background: var(--color-success);
    color: #ffffff;
    border-color: var(--color-success);
  }

  .btn-preview-link {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-full);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: 11px;
    text-decoration: none;
    transition: all var(--transition-fast);
  }

  .btn-preview-link:hover {
    background: var(--color-secondary);
    color: var(--color-accent);
  }

  /* Row Actions */
  .row-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .action-btn {
    width: 32px;
    height: 32px;
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

  .no-filter-results {
    padding: var(--space-8);
    text-align: center;
    color: var(--color-text-muted);
  }

  /* ========================================= */
  /* EMPTY STATE                               */
  /* ========================================= */
  .empty-state-card {
    background: var(--color-surface);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-16) var(--space-8);
    text-align: center;
    max-width: 540px;
    margin: var(--space-8) auto;
  }

  .empty-icon-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(201, 132, 122, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin: 0 auto var(--space-4);
  }

  .empty-title {
    font-family: var(--font-display);
    font-size: var(--font-size-2xl);
    color: var(--color-text);
    margin: 0 0 var(--space-2);
  }

  .empty-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0 0 var(--space-6);
  }

  .empty-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
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
    background: #fffdfd;
    border-radius: var(--radius-xl);
    box-shadow: 0 20px 40px rgba(44, 24, 16, 0.18);
    max-height: 90vh;
    overflow-y: auto;
    width: 100%;
  }

  .modal-lg {
    max-width: 620px;
  }
  .modal-sm {
    max-width: 440px;
  }

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
    padding: var(--space-1);
    line-height: 1;
  }

  .btn-close-modal:hover {
    color: var(--color-text);
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
    background: #faf6f4;
    border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  }

  .field-hint {
    display: block;
    font-size: 11px;
    color: var(--color-text-subtle);
    margin-top: 4px;
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
  /* RESPONSIVE QUERIES                        */
  /* ========================================= */
  @media (max-width: 1024px) {
    .stats-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .stats-row {
      grid-template-columns: 1fr;
    }

    .toolbar-main-row {
      flex-direction: column;
      align-items: stretch;
    }

    .toolbar-dropdowns {
      flex-direction: column;
    }

    .filter-dropdown {
      width: 100%;
    }

    .quick-add-inner {
      flex-direction: column;
      align-items: stretch;
    }

    .quick-cat-select {
      width: 100%;
    }
  }
</style>
