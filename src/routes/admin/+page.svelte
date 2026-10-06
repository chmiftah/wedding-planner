<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import {
    formatRupiah,
    formatRupiahShort,
    formatDateShort,
  } from "#lib/utils/format";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let searchQuery = $state("");
  let filterRole = $state<"all" | "admin" | "user">("all");
  let filterWizard = $state<"all" | "completed" | "draft">("all");

  const filteredUsers = $derived(
    data.users.filter((u) => {
      // Role filter
      if (filterRole !== "all" && u.role !== filterRole) return false;

      // Wizard filter
      if (filterWizard === "completed" && !u.wizard_completed) return false;
      if (filterWizard === "draft" && u.wizard_completed) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = u.name?.toLowerCase().includes(q);
      const emailMatch = u.email?.toLowerCase().includes(q);
      const brideMatch = u.bride_name?.toLowerCase().includes(q);
      const groomMatch = u.groom_name?.toLowerCase().includes(q);

      return nameMatch || emailMatch || brideMatch || groomMatch;
    }),
  );
</script>

<svelte:head>
  <title>Admin - Manajemen Pengguna | Nikahku</title>
</svelte:head>

<div class="admin-page">
  <div class="container py-8">
    <!-- Header -->
    <div class="admin-header mb-8 mt-8">
      <div class="header-content">
        <div class="header-badge">
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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>Administrator Mode</span>
        </div>
        <h1 class="admin-title">Daftar Pengguna & Data Pernikahan</h1>
        <p class="admin-subtitle">
          Pantau seluruh pasangan yang terdaftar, perencanaan anggaran mereka,
          dan kelola peran akun.
        </p>
      </div>

      <div class="header-actions">
        <a href="/dashboard" class="btn btn-outline btn-sm">
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
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Kembali ke Dashboard
        </a>
      </div>
    </div>

    <!-- Alert status action -->
    {#if form?.message}
      <div
        class="alert-banner mb-6 {form.success
          ? 'alert-success'
          : 'alert-error'}"
      >
        <span>{form.message}</span>
      </div>
    {/if}

    <!-- Stat Summary Cards -->
    <div class="stats-grid mb-8">
      <div class="stat-card">
        <div
          class="stat-icon-wrap"
          style="background: rgba(201, 132, 122, 0.15); color: var(--color-primary)"
        >
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
          <span class="stat-label">Total Pengguna</span>
          <span class="stat-value">{data.stats.totalUsers}</span>
          <span class="stat-sub">{data.stats.adminCount} Administrator</span>
        </div>
      </div>

      <div class="stat-card">
        <div
          class="stat-icon-wrap"
          style="background: rgba(139, 94, 82, 0.15); color: #8B5E52"
        >
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
            <circle cx="8" cy="14" r="5"></circle>
            <circle cx="16" cy="14" r="5"></circle>
            <path d="M12 9l.6-1.8l1.8-.6l-1.8-.6l-.6-1.8l-.6 1.8l-1.8.6l1.8.6z"
            ></path>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Pasangan Aktif</span>
          <span class="stat-value">{data.stats.totalWeddings}</span>
          <span class="stat-sub">Rencana Pernikahan</span>
        </div>
      </div>

      <div class="stat-card">
        <div
          class="stat-icon-wrap"
          style="background: rgba(212, 149, 106, 0.15); color: #D4956A"
        >
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
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Rencana Anggaran</span>
          <span class="stat-value"
            >{formatRupiahShort(data.stats.totalBudget)}</span
          >
          <span class="stat-sub">{formatRupiah(data.stats.totalBudget)}</span>
        </div>
      </div>

      <div class="stat-card">
        <div
          class="stat-icon-wrap"
          style="background: rgba(107, 171, 138, 0.15); color: #6BAB8A"
        >
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-label">Target Tamu Keseluruhan</span>
          <span class="stat-value"
            >{data.stats.totalPlannedGuests.toLocaleString("id-ID")}</span
          >
          <span class="stat-sub">Orang Diundang</span>
        </div>
      </div>
    </div>

    <!-- Filters & Table Section -->
    <div class="users-panel card">
      <!-- Search & Controls Bar -->
      <div class="panel-controls">
        <div class="search-box">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="search-icon"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, atau nama mempelai..."
            bind:value={searchQuery}
            class="search-input"
          />
          {#if searchQuery}
            <button
              class="clear-btn"
              onclick={() => (searchQuery = "")}
              type="button">✕</button
            >
          {/if}
        </div>

        <div class="filter-group">
          <select bind:value={filterRole} class="select-filter">
            <option value="all">Semua Peran</option>
            <option value="admin">Hanya Admin</option>
            <option value="user">Pengguna Biasa</option>
          </select>

          <select bind:value={filterWizard} class="select-filter">
            <option value="all">Semua Status Rencana</option>
            <option value="completed">Wizard Selesai</option>
            <option value="draft">Belum Selesai</option>
          </select>
        </div>
      </div>

      <!-- Table Content -->
      {#if filteredUsers.length === 0}
        <div class="empty-state py-12 text-center">
          <p class="text-muted">
            Tidak ada pengguna yang sesuai dengan pencarian atau filter.
          </p>
        </div>
      {:else}
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Peran</th>
                <th>Pasangan Pernikahan</th>
                <th>Tanggal Acara</th>
                <th>Anggaran & Tamu</th>
                <th>Status Rencana</th>
                <th>Terdaftar</th>
                <th class="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredUsers as user (user.id)}
                {@const isCurrent = user.id === data.currentUser.id}
                <tr>
                  <!-- User Info -->
                  <td>
                    <div class="user-cell">
                      <div class="user-cell-avatar">
                        {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div class="user-cell-info">
                        <span class="user-cell-name">
                          {user.name}
                          {#if isCurrent}
                            <span class="self-tag">(Anda)</span>
                          {/if}
                        </span>
                        <span class="user-cell-email">{user.email}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Role -->
                  <td>
                    {#if user.role === "admin"}
                      <span class="role-badge role-admin">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                          ></path>
                        </svg>
                        Admin
                      </span>
                    {:else}
                      <span class="role-badge role-user">User</span>
                    {/if}
                  </td>

                  <!-- Pasangan Pernikahan -->
                  <td>
                    {#if user.bride_name || user.groom_name}
                      <div class="couple-info">
                        <span class="couple-names">
                          {user.groom_name || "Calon Pria"} & {user.bride_name ||
                            "Calon Wanita"}
                        </span>
                        <span class="venue-sub">
                          {user.venue_type === "rumah"
                            ? "Di Rumah"
                            : "Gedung / Aula"} • Gaya {user.style || "standar"}
                        </span>
                      </div>
                    {:else}
                      <span class="text-muted text-xs italic"
                        >Belum mengisi wizard</span
                      >
                    {/if}
                  </td>

                  <!-- Tanggal Acara -->
                  <td>
                    {#if user.wedding_date}
                      <span class="date-text"
                        >{formatDateShort(user.wedding_date)}</span
                      >
                    {:else}
                      <span class="text-muted text-xs">-</span>
                    {/if}
                  </td>

                  <!-- Anggaran & Tamu -->
                  <td>
                    {#if user.total_budget}
                      <div class="budget-cell">
                        <span class="budget-amt font-medium"
                          >{formatRupiah(Number(user.total_budget))}</span
                        >
                        <span class="text-muted text-xs"
                          >{user.guest_count || 0} tamu diundang</span
                        >
                      </div>
                    {:else}
                      <span class="text-muted text-xs">-</span>
                    {/if}
                  </td>

                  <!-- Status Wizard -->
                  <td>
                    {#if user.wizard_completed}
                      <span class="status-pill status-ready">Siap / Aktif</span>
                    {:else}
                      <span class="status-pill status-draft">Draft</span>
                    {/if}
                  </td>

                  <!-- Tanggal Daftar -->
                  <td>
                    <span class="date-text text-xs text-muted">
                      {formatDateShort(user.created_at)}
                    </span>
                  </td>

                  <!-- Aksi -->
                  <td class="text-right">
                    <div class="action-cell">
                      <!-- Toggle Admin Form -->
                      <form
                        method="POST"
                        action="?/updateRole"
                        class="inline-block"
                      >
                        <input type="hidden" name="userId" value={user.id} />
                        <input
                          type="hidden"
                          name="role"
                          value={user.role === "admin" ? "user" : "admin"}
                        />
                        <button
                          type="submit"
                          class="btn btn-xs {user.role === 'admin'
                            ? 'btn-outline'
                            : 'btn-secondary'}"
                          disabled={isCurrent}
                          title={isCurrent
                            ? "Tidak dapat mengubah akun sendiri"
                            : user.role === "admin"
                              ? "Turunkan ke User"
                              : "Jadikan Admin"}
                        >
                          {user.role === "admin"
                            ? "Jadikan User"
                            : "Jadikan Admin"}
                        </button>
                      </form>

                      <!-- Delete Form -->
                      {#if !isCurrent}
                        <form
                          method="POST"
                          action="?/deleteUser"
                          class="inline-block"
                          onsubmit={(e) => {
                            if (
                              !confirm(
                                `Hapus pengguna "${user.name}" (${user.email}) beserta seluruh data pernikahannya?`,
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="userId" value={user.id} />
                          <button
                            type="submit"
                            class="btn btn-xs btn-ghost text-error"
                            title="Hapus Pengguna"
                          >
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
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path
                                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                              ></path>
                            </svg>
                          </button>
                        </form>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .admin-page {
    min-height: calc(100vh - 70px);
    background: var(--color-bg);
  }

  /* Header */
  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .header-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: var(--radius-full);
    background: rgba(201, 132, 122, 0.12);
    color: var(--color-primary-dark);
    font-size: var(--font-size-xs);
    font-weight: 600;
    margin-bottom: var(--space-2);
  }

  .admin-title {
    font-size: var(--font-size-2xl);
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-1) 0;
  }

  .admin-subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    margin: 0;
  }

  /* Alert */
  .alert-banner {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  .alert-success {
    background: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .alert-error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-4);
  }

  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-4);
    box-shadow: var(--shadow-sm);
  }

  .stat-icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
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
    font-size: 11px;
    color: var(--color-text-light);
  }

  /* Panel */
  .users-panel {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .panel-controls {
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border-subtle);
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
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
    color: var(--color-text-muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 8px 36px 8px 36px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .clear-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 12px;
  }

  .filter-group {
    display: flex;
    gap: var(--space-2);
  }

  .select-filter {
    padding: 8px 12px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    font-size: var(--font-size-xs);
    color: var(--color-text);
  }

  /* Table */
  .table-responsive {
    overflow-x: auto;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
    text-align: left;
  }

  .admin-table th {
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    background: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid var(--color-border);
  }

  .admin-table td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--color-border-subtle);
    vertical-align: middle;
  }

  .admin-table tr:hover td {
    background: rgba(201, 132, 122, 0.03);
  }

  /* User Cell */
  .user-cell {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .user-cell-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    flex-shrink: 0;
  }

  .user-cell-info {
    display: flex;
    flex-direction: column;
  }

  .user-cell-name {
    font-weight: 600;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .self-tag {
    font-size: 10px;
    color: var(--color-primary);
    font-weight: 500;
  }

  .user-cell-email {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  /* Role Badges */
  .role-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 600;
  }

  .role-admin {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
  }

  .role-user {
    background: var(--color-bg);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
  }

  /* Couple Info */
  .couple-info {
    display: flex;
    flex-direction: column;
  }

  .couple-names {
    font-weight: 600;
    color: var(--color-text);
  }

  .venue-sub {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  /* Status Pills */
  .status-pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 600;
  }

  .status-ready {
    background: #ecfdf5;
    color: #065f46;
  }

  .status-draft {
    background: #fffbeb;
    color: #b45309;
  }

  /* Budget Cell */
  .budget-cell {
    display: flex;
    flex-direction: column;
  }

  .budget-amt {
    color: var(--color-text);
    font-weight: 600;
  }

  .action-cell {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }

  .text-right {
    text-align: right;
  }
</style>
