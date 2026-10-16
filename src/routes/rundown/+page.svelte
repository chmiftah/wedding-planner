<script lang="ts">
  import { onMount } from "svelte";
  import {
    wedding,
    rundownSummary,
    addRundownItem,
    updateRundownItem,
    deleteRundownItem,
    reorderRundownItems,
    resetRundownsToDefault,
    hydrateWeddingFromDb,
    type RundownItem,
  } from "#lib/stores/wedding";
  import { formatDate } from "#lib/utils/format";

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
  let activeSessionTab = $state("Semua");
  let searchQuery = $state("");
  let showModal = $state(false);
  let isEditing = $state(false);
  let editId = $state<string | null>(null);

  // Mobile & Compact state
  let activeMenuId = $state<string | null>(null);
  let expandedItems = $state<Record<string, boolean>>({});
  let allExpanded = $state(false);
  let showHeaderMenu = $state(false);

  // Form State
  let formSession = $state("Akad Nikah");
  let formStartTime = $state("08:00");
  let formEndTime = $state("08:30");
  let formTitle = $state("");
  let formDescription = $state("");
  let formPic = $state("");
  let formLocation = $state("");

  const commonSessions = [
    "Akad Nikah",
    "Resepsi",
    "Gladi Resik & TM",
    "Siraman / Adat",
    "Lainnya",
  ];

  const rs = $derived($rundownSummary);
  const items = $derived($wedding.rundowns || []);

  const allSessions = $derived([
    "Semua",
    ...new Set(items.map((i) => i.session)),
  ]);

  const filteredItems = $derived(() => {
    return items
      .filter((item) => {
        const matchSession =
          activeSessionTab === "Semua" || item.session === activeSessionTab;
        const matchSearch =
          !searchQuery ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchSession && matchSearch;
      })
      .sort(
        (a, b) => a.order - b.order || a.startTime.localeCompare(b.startTime),
      );
  });

  function isItemExpanded(id: string): boolean {
    if (expandedItems[id] !== undefined) {
      return expandedItems[id];
    }
    return allExpanded;
  }

  function toggleItemExpand(id: string) {
    const current = isItemExpanded(id);
    expandedItems[id] = !current;
  }

  function toggleAllExpanded() {
    allExpanded = !allExpanded;
    expandedItems = {};
  }

  function toggleMenu(id: string, e: MouseEvent) {
    e.stopPropagation();
    activeMenuId = activeMenuId === id ? null : id;
  }

  function toggleHeaderMenu(e: MouseEvent) {
    e.stopPropagation();
    showHeaderMenu = !showHeaderMenu;
  }

  function handleWindowClick() {
    if (activeMenuId !== null) activeMenuId = null;
    if (showHeaderMenu) showHeaderMenu = false;
  }

  function openAddModal() {
    isEditing = false;
    editId = null;
    formSession =
      activeSessionTab === "Semua" ? "Akad Nikah" : activeSessionTab;
    formStartTime = "08:00";
    formEndTime = "08:30";
    formTitle = "";
    formDescription = "";
    formPic = "";
    formLocation = "";
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
        await fetch("/api/rundown", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...updates }),
        });
      } catch (err) {
        console.error("Error updating rundown to DB:", err);
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
        await fetch("/api/rundown", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        });
      } catch (err) {
        console.error("Error inserting rundown to DB:", err);
      }
    }

    showModal = false;
  }

  async function handleDeleteRundown(id: string, title: string) {
    if (!confirm(`Hapus mata acara "${title}" dari susunan rundown?`)) return;
    deleteRundownItem(id);
    try {
      await fetch(`/api/rundown?id=${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error deleting rundown from DB:", err);
    }
  }

  function moveItem(index: number, direction: "up" | "down") {
    const list = [...filteredItems()];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    reorderRundownItems(list);
  }

  function handleResetTemplate() {
    if (
      confirm(
        "Muat ulang template rundown standar pernikahan (Akad & Resepsi)?",
      )
    ) {
      resetRundownsToDefault();
    }
  }

  function handlePrint() {
    window.print();
  }
</script>

<svelte:window onclick={handleWindowClick} />

<svelte:head>
  <title>Rundown & Susunan Acara Pernikahan | Nikara</title>
</svelte:head>

<div class="rundown-page animate-fade-in">
  <div class="container">
    <!-- Header (Hidden on print) -->
    <div class="page-header no-print">
      <div class="header-left">
        <div class="badge-tag mb-1">
          <span>⏱️ Itinerary & Timeline</span>
        </div>
        <h1 class="page-title">Susunan Acara (Rundown)</h1>
        <p class="page-subtitle hide-mobile">
          Rancang jadwal hari bahagia detik demi detik bersama panitia, WO, dan
          pemegang tanggung jawab.
        </p>
      </div>

      <div class="header-actions">
        <!-- Desktop Actions -->
        <button
          class="btn btn-secondary hide-mobile"
          onclick={handlePrint}
          title="Cetak atau Simpan PDF"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path
              d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
            ></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          <span>Cetak / PDF</span>
        </button>

        <button
          class="btn btn-secondary hide-mobile"
          onclick={handleResetTemplate}
          title="Gunakan template standar"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          <span>Template Standar</span>
        </button>

        <button class="btn btn-primary hide-mobile" onclick={openAddModal}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Tambah Acara</span>
        </button>

        <!-- Mobile Header Quick Tools -->
        <div class="mobile-header-tools hide-desktop">
          <button
            class="btn-icon btn-secondary btn-sm"
            onclick={handlePrint}
            title="Cetak / Simpan PDF"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path
                d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
              ></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
          </button>

          <div class="mobile-header-menu-wrap">
            <button
              class="btn-icon btn-secondary btn-sm"
              onclick={toggleHeaderMenu}
              title="Menu Lainnya"
              aria-expanded={showHeaderMenu}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="5" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="12" cy="19" r="2"></circle>
              </svg>
            </button>

            {#if showHeaderMenu}
              <div
                class="dropdown-popover dropdown-popover-right animate-scale-in"
                onclick={(e) => e.stopPropagation()}
              >
                <button
                  class="popover-item"
                  onclick={() => {
                    showHeaderMenu = false;
                    handleResetTemplate();
                  }}
                >
                  <span>🔄</span>
                  <span>Muat Template Standar</span>
                </button>
                <button
                  class="popover-item"
                  onclick={() => {
                    showHeaderMenu = false;
                    toggleAllExpanded();
                  }}
                >
                  <span>{allExpanded ? "📁" : "📖"}</span>
                  <span
                    >{allExpanded
                      ? "Ciutkan Semua Detail"
                      : "Buka Semua Detail"}</span
                  >
                </button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Print Only Header -->
    <div class="print-header only-print">
      <h2>RUNDOWN SUSUNAN ACARA PERNIKAHAN</h2>
      <h3>
        {$wedding.info.groomName || "Pengantin"} & {$wedding.info.brideName ||
          "Pengantin"}
      </h3>
      <p>
        Tanggal: {$wedding.info.weddingDate
          ? formatDate($wedding.info.weddingDate)
          : "-"}
      </p>
    </div>

    <!-- Session Tabs Bar (Hidden on print) -->
    <div class="session-tabs-bar no-print">
      <div class="tabs-scroll">
        {#each allSessions as sess}
          <button
            class="session-tab-btn {activeSessionTab === sess ? 'active' : ''}"
            onclick={() => (activeSessionTab = sess)}
          >
            <span>{sess}</span>
            <span class="tab-badge">
              {sess === "Semua"
                ? items.length
                : items.filter((i) => i.session === sess).length}
            </span>
          </button>
        {/each}
      </div>

      <div class="rundown-search">
        <svg
          class="search-icon"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          class="form-input text-xs search-field"
          placeholder="Cari agenda, PIC, lokasi..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <button
            class="clear-search-btn"
            onclick={() => (searchQuery = "")}
            aria-label="Hapus pencarian">✕</button
          >
        {/if}
      </div>
    </div>

    <!-- Quick Status & Disclosure Toolbar -->
    <div class="rundown-toolbar no-print">
      <div class="toolbar-left">
        <span class="toolbar-count">
          <strong>{filteredItems().length}</strong>
          {filteredItems().length === 1 ? "agenda" : "agenda acara"}
          {#if activeSessionTab !== "Semua"}
            <span class="toolbar-session-filter">• {activeSessionTab}</span>
          {/if}
        </span>
      </div>
      <div class="toolbar-right">
        <button
          type="button"
          class="btn-toggle-disclosure"
          onclick={toggleAllExpanded}
          title={allExpanded
            ? "Sembunyikan rincian teknis"
            : "Tampilkan rincian teknis"}
        >
          <span class="disclosure-icon">{allExpanded ? "▲" : "▼"}</span>
          <span>{allExpanded ? "Ciutkan Rincian" : "Buka Semua Rincian"}</span>
        </button>
      </div>
    </div>

    <!-- Timeline List -->
    {#if filteredItems().length === 0}
      <div class="empty-state-card no-print">
        <div class="empty-icon">⏱️</div>
        <h3>Belum ada mata acara</h3>
        <p class="text-muted">
          Tambahkan jadwal acara pertama Anda atau gunakan template susunan
          acara lengkap.
        </p>
        <div class="mt-4 flex gap-3 justify-center">
          <button class="btn btn-secondary" onclick={handleResetTemplate}
            >Muat Template Akad & Resepsi</button
          >
          <button class="btn btn-primary" onclick={openAddModal}
            >+ Tambah Agenda Acara</button
          >
        </div>
      </div>
    {:else}
      <div class="timeline-container">
        {#each filteredItems() as item, idx (item.id)}
          {@const isExpanded = isItemExpanded(item.id)}
          <div class="timeline-row">
            <!-- Desktop Time Indicator -->
            <div class="timeline-time-col hide-mobile">
              <div class="time-badge">
                <span class="time-start">{item.startTime}</span>
                <span class="time-sep">-</span>
                <span class="time-end">{item.endTime}</span>
              </div>
              <div class="timeline-line"></div>
            </div>

            <!-- Content Card -->
            <div
              class="timeline-content-card card {isExpanded
                ? 'is-expanded'
                : 'is-collapsed'}"
            >
              <!-- Clickable Card Header Area -->
              <div
                class="card-head-area"
                onclick={() => toggleItemExpand(item.id)}
                role="button"
                tabindex="0"
                onkeydown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    toggleItemExpand(item.id);
                }}
              >
                <!-- Mobile Time Pill & Session -->
                <div class="card-mobile-top hide-desktop">
                  <span class="mobile-time-badge">
                    ⏱️ {item.startTime} - {item.endTime}
                  </span>
                  <span class="session-tag">{item.session}</span>
                </div>

                <div class="content-header">
                  <div class="header-titles">
                    <span class="session-tag hide-mobile">{item.session}</span>
                    <h4 class="event-title">{item.title}</h4>
                  </div>

                  <!-- Header Tools / Actions -->
                  <div
                    class="header-tools no-print"
                    onclick={(e) => e.stopPropagation()}
                  >
                    <!-- Desktop Action Buttons -->
                    <div class="desktop-tools hide-mobile">
                      <button
                        class="btn-icon btn-ghost btn-sm"
                        title="Pindahkan ke atas"
                        disabled={idx === 0}
                        onclick={() => moveItem(idx, "up")}>↑</button
                      >
                      <button
                        class="btn-icon btn-ghost btn-sm"
                        title="Pindahkan ke bawah"
                        disabled={idx === filteredItems().length - 1}
                        onclick={() => moveItem(idx, "down")}>↓</button
                      >
                      <button
                        class="btn-icon btn-ghost btn-sm"
                        title="Edit Acara"
                        onclick={() => openEditModal(item)}>✏️</button
                      >
                      <button
                        class="btn-icon btn-ghost btn-sm text-danger"
                        title="Hapus Acara"
                        onclick={() => handleDeleteRundown(item.id, item.title)}
                        >🗑️</button
                      >
                    </div>

                    <!-- Mobile 3-Dots Menu -->
                    <div class="mobile-action-menu-wrap hide-desktop">
                      <button
                        class="btn-icon btn-ghost btn-sm action-dots-btn"
                        title="Pilihan Aksi"
                        onclick={(e) => toggleMenu(item.id, e)}
                        aria-expanded={activeMenuId === item.id}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <circle cx="12" cy="5" r="2"></circle>
                          <circle cx="12" cy="12" r="2"></circle>
                          <circle cx="12" cy="19" r="2"></circle>
                        </svg>
                      </button>

                      {#if activeMenuId === item.id}
                        <div
                          class="dropdown-popover animate-scale-in"
                          onclick={(e) => e.stopPropagation()}
                        >
                          <button
                            class="popover-item"
                            onclick={() => {
                              activeMenuId = null;
                              openEditModal(item);
                            }}
                          >
                            <span>✏️</span>
                            <span>Edit Acara</span>
                          </button>
                          <button
                            class="popover-item"
                            disabled={idx === 0}
                            onclick={() => {
                              moveItem(idx, "up");
                              activeMenuId = null;
                            }}
                          >
                            <span>↑</span>
                            <span>Pindah ke Atas</span>
                          </button>
                          <button
                            class="popover-item"
                            disabled={idx === filteredItems().length - 1}
                            onclick={() => {
                              moveItem(idx, "down");
                              activeMenuId = null;
                            }}
                          >
                            <span>↓</span>
                            <span>Pindah ke Bawah</span>
                          </button>
                          <div class="popover-divider"></div>
                          <button
                            class="popover-item text-danger"
                            onclick={() => {
                              activeMenuId = null;
                              handleDeleteRundown(item.id, item.title);
                            }}
                          >
                            <span>🗑️</span>
                            <span>Hapus Acara</span>
                          </button>
                        </div>
                      {/if}
                    </div>

                    <!-- Expand / Collapse Chevron -->
                    <button
                      class="btn-icon btn-ghost btn-sm chevron-toggle"
                      title={isExpanded ? "Ciutkan rincian" : "Buka rincian"}
                      onclick={(e) => {
                        e.stopPropagation();
                        toggleItemExpand(item.id);
                      }}
                    >
                      <svg
                        class="chevron-svg {isExpanded ? 'rotated' : ''}"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Summary Preview Chips (Compact on Collapsed) -->
                {#if item.pic || item.location}
                  <div class="card-summary-row">
                    {#if item.pic}
                      <span class="summary-pill pic-pill">
                        <span class="pill-icon">👤</span>
                        <span class="pill-text font-semibold">{item.pic}</span>
                      </span>
                    {/if}
                    {#if item.location}
                      <span class="summary-pill loc-pill">
                        <span class="pill-icon">📍</span>
                        <span class="pill-text">{item.location}</span>
                      </span>
                    {/if}
                  </div>
                {/if}
              </div>

              <!-- Expanded Details Section (Always visible on print) -->
              {#if isExpanded}
                <div class="expanded-details animate-fade-in">
                  {#if item.description}
                    <div class="event-desc-wrapper">
                      <div class="desc-heading">
                        Rincian Teknis & Instruksi:
                      </div>
                      <p class="event-desc">{item.description}</p>
                    </div>
                  {/if}

                  <div class="event-meta-row {item.description ? 'mt-3' : ''}">
                    {#if item.pic}
                      <div class="meta-item pic-item">
                        <span class="meta-label">👤 PIC Utama:</span>
                        <span class="meta-val font-semibold">{item.pic}</span>
                      </div>
                    {/if}

                    {#if item.location}
                      <div class="meta-item loc-item">
                        <span class="meta-label">📍 Lokasi / Titik:</span>
                        <span class="meta-val">{item.location}</span>
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Mobile Floating Action Button (FAB) -->
    <button
      class="mobile-fab no-print hide-desktop"
      onclick={openAddModal}
      aria-label="Tambah Acara Baru"
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
      <span>Tambah Acara</span>
    </button>
  </div>
</div>

<!-- Modal Add/Edit Rundown -->
{#if showModal}
  <div
    class="modal-overlay animate-fade-in no-print"
    onclick={() => (showModal = false)}
    role="dialog"
    aria-modal="true"
  >
    <div class="modal card max-w-lg" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h3 class="modal-title">
          {isEditing ? "Edit Jadwal Acara" : "Tambah Agenda Acara Baru"}
        </h3>
        <button
          type="button"
          class="btn-close-modal"
          onclick={() => (showModal = false)}
          aria-label="Tutup formulir">✕</button
        >
      </div>

      <div class="modal-body">
        <div class="form-group mb-3">
          <label class="form-label" for="rdSession">Sesi / Bagian Acara *</label
          >
          <div class="session-presets mb-2">
            {#each commonSessions as cs}
              <button
                type="button"
                class="chip {formSession === cs ? 'active' : ''}"
                onclick={() => (formSession = cs)}>{cs}</button
              >
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
          <label class="form-label" for="rdTitle"
            >Judul Kegiatan / Acara *</label
          >
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
          <label class="form-label" for="rdDesc"
            >Rincian Teknis & Instruksi Khusus</label
          >
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
        <button
          type="button"
          class="btn btn-secondary"
          onclick={() => (showModal = false)}>Batal</button
        >
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleSaveRundown}
          disabled={!formTitle.trim()}
        >
          {isEditing ? "Simpan Perubahan" : "Tambahkan ke Rundown"}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .rundown-page {
    position: relative;
    padding-bottom: var(--space-8);
  }

  /* Header Tools */
  .mobile-header-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
  }

  .mobile-header-menu-wrap {
    position: relative;
  }

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
    margin-bottom: var(--space-3);
  }

  .tabs-scroll {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .tabs-scroll::-webkit-scrollbar {
    display: none;
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

  /* Search */
  .rundown-search {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 220px;
  }

  .search-icon {
    position: absolute;
    left: 10px;
    color: var(--color-text-subtle);
    pointer-events: none;
  }

  .search-field {
    padding-left: 32px !important;
    padding-right: 28px !important;
    height: 34px;
    border-radius: var(--radius-full);
  }

  .clear-search-btn {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    font-size: 11px;
    color: var(--color-text-subtle);
    cursor: pointer;
    padding: 3px;
  }

  /* Quick Toolbar (Count & Disclosure) */
  .rundown-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px var(--space-2) var(--space-4);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .toolbar-count strong {
    color: var(--color-text);
  }

  .toolbar-session-filter {
    color: var(--color-accent);
    font-weight: 600;
  }

  .btn-toggle-disclosure {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: 1px solid var(--color-border-light);
    background: var(--color-surface);
    color: var(--color-text-muted);
    font-size: 11.5px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-toggle-disclosure:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
    background: var(--color-surface-hover);
  }

  .disclosure-icon {
    font-size: 8px;
    color: var(--color-accent);
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
    padding: var(--space-4) var(--space-5);
    border-left: 3px solid var(--color-accent);
    transition:
      box-shadow var(--transition-fast),
      border-color var(--transition-fast);
    position: relative;
  }

  .timeline-content-card.is-expanded {
    box-shadow: 0 4px 14px rgba(139, 94, 82, 0.08);
  }

  /* Card Head Clickable */
  .card-head-area {
    cursor: pointer;
    user-select: none;
  }

  .card-mobile-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }

  .mobile-time-badge {
    display: inline-flex;
    align-items: center;
    font-family: var(--font-mono, monospace);
    font-size: 11.5px;
    font-weight: 700;
    color: var(--color-accent);
    background: rgba(201, 132, 122, 0.1);
    padding: 2px 8px;
    border-radius: var(--radius-full);
  }

  .content-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .header-titles {
    flex: 1;
    min-width: 0;
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
    line-height: 1.35;
  }

  .header-tools {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .desktop-tools {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  /* Action Menu & Popover */
  .mobile-action-menu-wrap {
    position: relative;
  }

  .dropdown-popover {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    min-width: 170px;
    background: #fffdfd;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 10px 25px rgba(44, 24, 16, 0.15);
    padding: 6px;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dropdown-popover-right {
    right: 0;
  }

  .popover-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    background: none;
    border: none;
    color: var(--color-text);
    font-size: 13px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .popover-item:hover:not(:disabled) {
    background: rgba(201, 132, 122, 0.09);
    color: var(--color-accent);
  }

  .popover-item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .popover-item.text-danger {
    color: var(--color-danger);
  }
  .popover-item.text-danger:hover {
    background: var(--color-danger-bg);
  }

  .popover-divider {
    height: 1px;
    background: var(--color-border-light);
    margin: 4px 0;
  }

  /* Chevron */
  .chevron-svg {
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--color-text-subtle);
  }

  .chevron-svg.rotated {
    transform: rotate(180deg);
    color: var(--color-accent);
  }

  /* Summary Row (Chips on Collapsed) */
  .card-summary-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .summary-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 11.5px;
    background: var(--color-surface-hover);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border-light);
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .summary-pill.pic-pill {
    background: rgba(201, 132, 122, 0.08);
    color: var(--color-accent);
    border-color: rgba(201, 132, 122, 0.2);
  }

  /* Expanded Details */
  .expanded-details {
    padding-top: var(--space-3);
    margin-top: var(--space-3);
    border-top: 1px dashed var(--color-border-light);
  }

  .event-desc-wrapper {
    background: rgba(0, 0, 0, 0.015);
    padding: var(--space-3);
    border-radius: var(--radius-md);
    border-left: 2px solid var(--color-primary-light);
    margin-bottom: var(--space-3);
  }

  .desc-heading {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-text-subtle);
    margin-bottom: 4px;
  }

  .event-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    margin: 0;
    line-height: 1.55;
    white-space: pre-wrap;
  }

  .event-meta-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-4);
    font-size: var(--font-size-xs);
  }

  .meta-label {
    color: var(--color-text-subtle);
    margin-right: 4px;
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

  /* Mobile Floating Action Button (FAB) */
  .mobile-fab {
    position: fixed;
    bottom: 74px;
    right: 18px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(
      135deg,
      var(--color-primary) 0%,
      var(--color-accent) 100%
    );
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    border: none;
    border-radius: var(--radius-full);
    box-shadow: 0 8px 24px rgba(201, 132, 122, 0.45);
    cursor: pointer;
    z-index: 75;
    transition:
      transform var(--transition-fast),
      box-shadow var(--transition-fast);
  }

  .mobile-fab:active {
    transform: scale(0.96);
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
      display: block !important;
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
    .expanded-details {
      display: block !important;
    }
    body {
      background: #fff !important;
      color: #000 !important;
    }
  }

  /* Mobile Media Query */
  @media (max-width: 768px) {
    .rundown-page {
      padding-bottom: 96px; /* Space for FAB & Bottom Nav */
    }

    .session-tabs-bar {
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
    }

    .rundown-search {
      min-width: 100%;
    }

    .timeline-container {
      gap: 10px;
    }

    .timeline-row {
      flex-direction: column;
      gap: 0;
    }

    .timeline-content-card {
      padding: 12px 14px;
      border-left-width: 3.5px;
    }

    .event-title {
      font-size: 14.5px;
    }

    .summary-pill {
      font-size: 11px;
      padding: 2px 7px;
    }
  }
</style>
