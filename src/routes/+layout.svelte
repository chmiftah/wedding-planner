<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { wedding } from '#lib/stores/wedding';

  interface Props {
    children: any;
    data: {
      user: { id: string; email: string; name: string; role?: string } | null;
    };
  }

  const { children, data }: Props = $props();

  // Navigation Groups with Logical Categorization
  const navGroups = [
    {
      title: 'Utama',
      items: [
        { href: '/dashboard', label: 'Dashboard', id: 'dashboard' },
        { href: '/checklist', label: 'Checklist Tugas', id: 'checklist' },
        { href: '/dokumen',   label: 'Dokumen & Syarat', id: 'dokumen' },
        { href: '/kalender',  label: 'Kalender & Agenda', id: 'kalender' },
      ],
    },
    {
      title: 'Finansial & Budget',
      items: [
        { href: '/anggaran',  label: 'Anggaran Biaya', id: 'anggaran' },
        { href: '/tabungan',  label: 'Tabungan Bersama', id: 'tabungan' },
      ],
    },
    {
      title: 'Acara & Mitra',
      items: [
        { href: '/rundown',   label: 'Susunan Acara (Rundown)', id: 'rundown' },
        { href: '/vendor',    label: 'Manajemen Vendor', id: 'vendor' },
      ],
    },
    {
      title: 'Tamu & Undangan',
      items: [
        { href: '/tamu',      label: 'Daftar Tamu & RSVP', id: 'tamu' },
        { href: '/undangan',  label: 'Undangan Digital', id: 'undangan' },
      ],
    },
  ];

  // Flat nav items for mobile and route lookups
  const allNavItems = navGroups.flatMap(g => g.items);

  // Sidebar interactive states
  let isCollapsed = $state(false);
  let isMobileOpen = $state(false);

  // Initialize from localStorage if browser
  if (browser) {
    try {
      const savedCollapsed = localStorage.getItem('nikahku-sidebar-collapsed');
      if (savedCollapsed !== null) {
        isCollapsed = savedCollapsed === 'true';
      }
    } catch {}
  }

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
    if (browser) {
      try {
        localStorage.setItem('nikahku-sidebar-collapsed', String(isCollapsed));
      } catch {}
    }
  }

  function toggleMobile() {
    isMobileOpen = !isMobileOpen;
  }

  function closeMobile() {
    isMobileOpen = false;
  }

  // Public routes that don't need layout shell
  const publicRoutes = ['/', '/masuk', '/daftar', '/wizard'];
  const isPublic = $derived(
    publicRoutes.some((r) => page.url.pathname === r) ||
    page.url.pathname.startsWith('/rsvp') ||
    (page.url.pathname.startsWith('/undangan/') && page.url.pathname !== '/undangan')
  );

  const currentPath = $derived(page.url.pathname);

  // Find current active page title for header breadcrumb
  const currentNav = $derived(
    allNavItems.find(item => currentPath.startsWith(item.href)) ||
    (currentPath === '/pengaturan' ? { label: 'Pengaturan' } :
     currentPath.startsWith('/admin') ? { label: 'Panel Administrator' } :
     { label: 'Nikahku Planner' })
  );

  // Wedding countdown calculation
  function calculateCountdown(weddingDate: string | null) {
    if (!weddingDate) return null;
    const target = new Date(weddingDate);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const countdownDays = $derived(calculateCountdown($wedding.info.weddingDate));

  function getCoupleHeading(): string {
    const { brideName, groomName } = $wedding.info;
    if (brideName && groomName) return `${groomName} & ${brideName}`;
    if (brideName) return brideName;
    if (groomName) return groomName;
    return 'Pernikahan Impian';
  }
</script>

{#snippet navIcon(id: string)}
  {#if id === 'dashboard'}
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  {:else if id === 'checklist'}
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 11l3 3L22 4"></path>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>
  {:else if id === 'dokumen'}
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>
  {:else if id === 'kalender'}
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
      <path d="M8 14h.01"></path>
      <path d="M12 14h.01"></path>
      <path d="M16 14h.01"></path>
      <path d="M8 18h.01"></path>
      <path d="M12 18h.01"></path>
    </svg>
  {:else if id === 'anggaran'}
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      <line x1="2" y1="10" x2="22" y2="10"></line>
      <line x1="6" y1="15" x2="10" y2="15"></line>
    </svg>
  {:else if id === 'tabungan'}
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 21h18"></path>
      <path d="M3 10h18"></path>
      <path d="M5 6l7-3 7 3"></path>
      <path d="M4 10v11"></path>
      <path d="M20 10v11"></path>
      <circle cx="12" cy="15.5" r="1.5"></circle>
    </svg>
  {:else if id === 'rundown'}
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  {:else if id === 'vendor'}
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  {:else if id === 'tamu'}
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  {:else if id === 'undangan'}
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  {/if}
{/snippet}

{#if isPublic}
  {@render children()}
{:else}
  <div class="app-layout {isCollapsed ? 'sidebar-collapsed' : ''}">
    <!-- Backdrop for mobile drawer -->
    {#if isMobileOpen}
      <div class="sidebar-backdrop" onclick={closeMobile} role="presentation"></div>
    {/if}

    <!-- ============================================== -->
    <!-- SIDEBAR NAVIGATION                             -->
    <!-- ============================================== -->
    <aside class="sidebar {isCollapsed ? 'collapsed' : ''} {isMobileOpen ? 'mobile-open' : ''}">
      <!-- Sidebar Brand Area -->
      <div class="sidebar-brand-wrapper">
        <a href="/dashboard" class="sidebar-brand" onclick={closeMobile}>
          <span class="brand-icon">💍</span>
          {#if !isCollapsed}
            <div class="brand-text-block animate-fade-in">
              <span class="brand-name">Nikahku</span>
              <span class="brand-subname">{getCoupleHeading()}</span>
            </div>
          {/if}
        </a>

        <!-- Desktop Collapse Button -->
        <button
          type="button"
          class="sidebar-collapse-btn hide-mobile"
          onclick={toggleCollapse}
          title={isCollapsed ? 'Buka Sidebar' : 'Ciutkan Sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="collapse-icon {isCollapsed ? 'flipped' : ''}">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <!-- Mobile Close Button -->
        <button
          type="button"
          class="sidebar-close-btn hide-desktop"
          onclick={closeMobile}
          aria-label="Tutup Menu"
        >
          ✕
        </button>
      </div>

      <!-- Navigation Links Groups -->
      <nav class="sidebar-nav">
        {#each navGroups as group}
          <div class="nav-group">
            {#if !isCollapsed}
              <div class="nav-group-title animate-fade-in">{group.title}</div>
            {:else}
              <div class="nav-group-divider"></div>
            {/if}

            <div class="nav-group-items">
              {#each group.items as item}
                {@const isActive = currentPath.startsWith(item.href)}
                <a
                  href={item.href}
                  class="sidebar-link {isActive ? 'active' : ''}"
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? item.label : undefined}
                  onclick={closeMobile}
                >
                  <span class="sidebar-svg">{@render navIcon(item.id)}</span>
                  {#if !isCollapsed}
                    <span class="sidebar-label animate-fade-in">{item.label}</span>
                  {/if}
                  {#if isActive}
                    <span class="active-indicator"></span>
                  {/if}
                </a>
              {/each}
            </div>
          </div>
        {/each}
      </nav>

      <!-- Sidebar Bottom Card / Footer -->
      <div class="sidebar-footer">
        {#if !isCollapsed && countdownDays !== null && countdownDays > 0}
          <div class="sidebar-countdown-card animate-fade-in">
            <div class="sidebar-countdown-head">
              <span class="countdown-pulse-dot"></span>
              <span class="countdown-title">Hitung Mundur</span>
            </div>
            <div class="countdown-days-val">H-{countdownDays} Hari</div>
            <p class="countdown-date-sub">
              {$wedding.info.weddingDate ? new Date($wedding.info.weddingDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Hari Bahagia'}
            </p>
          </div>
        {/if}

        <div class="sidebar-user-section">
          {#if data?.user}
            <div class="user-info-row {isCollapsed ? 'compact' : ''}">
              <div class="user-avatar" title={data.user.email}>
                {data.user.name.charAt(0).toUpperCase()}
              </div>
              {#if !isCollapsed}
                <div class="user-meta animate-fade-in">
                  <span class="user-name">{data.user.name}</span>
                  <span class="user-email">{data.user.email}</span>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </aside>

    <!-- ============================================== -->
    <!-- MAIN WRAPPER (TOPBAR + CONTENT)                -->
    <!-- ============================================== -->
    <div class="main-wrapper">
      <!-- Clean & Spacious Top Header -->
      <header class="app-header">
        <div class="header-left">
          <!-- Mobile Hamburger Toggle -->
          <button
            type="button"
            class="header-toggle-btn hide-desktop"
            onclick={toggleMobile}
            aria-label="Buka Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <!-- Current Page Breadcrumb / Heading -->
          <div class="header-breadcrumb">
            <span class="breadcrumb-sub">Perencanaan</span>
            <span class="breadcrumb-sep">/</span>
            <h2 class="breadcrumb-current">{currentNav.label}</h2>
          </div>
        </div>

        <div class="header-right">
          <!-- Minimal Countdown Pill in Topbar -->
          {#if countdownDays !== null && countdownDays > 0}
            <div class="topbar-countdown-pill hide-mobile" title="Hari-H Pernikahan">
              <span class="pill-dot"></span>
              <span>H-{countdownDays} Hari</span>
            </div>
          {/if}

          <!-- Admin Button if Role Admin -->
          {#if data?.user?.role === 'admin'}
            <a
              href="/admin"
              class="topbar-admin-btn {currentPath.startsWith('/admin') ? 'active' : ''}"
              title="Panel Administrator"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Admin</span>
            </a>
          {/if}

          <!-- Settings Button -->
          <a
            href="/pengaturan"
            class="topbar-icon-btn {currentPath === '/pengaturan' ? 'active' : ''}"
            title="Pengaturan Pernikahan & Akun"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </a>

          <!-- Logout or Login Button -->
          {#if data?.user}
            <a href="/keluar" class="topbar-logout-btn" title="Keluar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span class="hide-mobile">Keluar</span>
            </a>
          {:else}
            <a href="/masuk" class="topbar-login-btn">Masuk</a>
          {/if}
        </div>
      </header>

      <!-- Main Page Render -->
      <main class="page-content">
        {@render children()}
      </main>
    </div>
  </div>
{/if}

<style>
  /* ========================================= */
  /* APP SHELL & LAYOUT                        */
  /* ========================================= */
  .app-layout {
    display: flex;
    min-height: 100vh;
    background: var(--color-surface);
    color: var(--color-text);
  }

  /* ========================================= */
  /* SIDEBAR                                   */
  /* ========================================= */
  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: 260px;
    background: #FFFDFD;
    border-right: 1px solid var(--color-border-light);
    display: flex;
    flex-direction: column;
    z-index: 90;
    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 2px 0 12px rgba(139, 94, 82, 0.03);
  }

  .sidebar.collapsed {
    width: 76px;
  }

  /* Sidebar Brand */
  .sidebar-brand-wrapper {
    height: 64px;
    padding: 0 var(--space-4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-light);
    flex-shrink: 0;
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    text-decoration: none;
    min-width: 0;
  }

  .brand-icon {
    font-size: 1.5rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .brand-text-block {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .brand-name {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-accent);
    line-height: 1.1;
    letter-spacing: -0.01em;
  }

  .brand-subname {
    font-size: 11px;
    color: var(--color-text-subtle);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
    font-weight: 500;
  }

  .sidebar-collapse-btn {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-md);
    background: var(--color-surface);
    border: 1px solid var(--color-border-light);
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .sidebar-collapse-btn:hover {
    background: var(--color-secondary);
    color: var(--color-accent);
  }

  .collapse-icon {
    transition: transform 0.2s ease;
  }
  .collapse-icon.flipped {
    transform: rotate(180deg);
  }

  .sidebar-close-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: var(--space-2);
  }

  /* Sidebar Navigation */
  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--space-4) var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .nav-group-title {
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-subtle);
    padding: 0 var(--space-3) var(--space-2);
  }

  .nav-group-divider {
    height: 1px;
    background: var(--color-border-light);
    margin: var(--space-2) var(--space-2);
  }

  .nav-group-items {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 9px 12px;
    border-radius: var(--radius-md);
    font-size: 13.5px;
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    position: relative;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

  .sidebar.collapsed .sidebar-link {
    justify-content: center;
    padding: 10px 0;
  }

  .sidebar-svg {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--color-text-subtle);
    transition: color var(--transition-fast);
  }

  .sidebar-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-link:hover {
    background: rgba(201, 132, 122, 0.08);
    color: var(--color-accent);
  }

  .sidebar-link:hover .sidebar-svg {
    color: var(--color-primary);
  }

  .sidebar-link.active {
    background: rgba(201, 132, 122, 0.14);
    color: var(--color-accent);
    font-weight: 600;
  }

  .sidebar-link.active .sidebar-svg {
    color: var(--color-accent);
  }

  .active-indicator {
    position: absolute;
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 3.5px;
    background: var(--color-accent);
    border-radius: 0 4px 4px 0;
  }

  /* Sidebar Footer */
  .sidebar-footer {
    padding: var(--space-3) var(--space-3);
    border-top: 1px solid var(--color-border-light);
    background: #FFFDFD;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex-shrink: 0;
  }

  .sidebar-countdown-card {
    background: linear-gradient(135deg, rgba(201, 132, 122, 0.1), rgba(139, 94, 82, 0.06));
    border: 1px solid rgba(201, 132, 122, 0.2);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }

  .sidebar-countdown-head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
  }

  .countdown-pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-primary);
    box-shadow: 0 0 6px rgba(201, 132, 122, 0.8);
  }

  .countdown-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-accent);
  }

  .countdown-days-val {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .countdown-date-sub {
    font-size: 11px;
    color: var(--color-text-subtle);
    margin: 2px 0 0;
  }

  .sidebar-user-section {
    display: flex;
    align-items: center;
  }

  .user-info-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: 4px;
    border-radius: var(--radius-md);
  }

  .user-info-row.compact {
    justify-content: center;
    padding: 4px 0;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .user-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .user-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-email {
    font-size: 11px;
    color: var(--color-text-subtle);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ========================================= */
  /* MAIN WRAPPER (RIGHT AREA)                 */
  /* ========================================= */
  .main-wrapper {
    flex: 1;
    margin-left: 260px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 0;
  }

  .app-layout.sidebar-collapsed .main-wrapper {
    margin-left: 76px;
  }

  /* App Header (Topbar) */
  .app-header {
    height: 64px;
    background: rgba(255, 252, 250, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border-light);
    position: sticky;
    top: 0;
    z-index: 80;
    padding: 0 var(--space-8);
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 4px rgba(139, 94, 82, 0.03);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .header-toggle-btn {
    background: none;
    border: none;
    color: var(--color-text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 6px;
    border-radius: var(--radius-md);
  }

  .header-breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .breadcrumb-sub {
    font-size: 13px;
    color: var(--color-text-subtle);
  }

  .breadcrumb-sep {
    font-size: 12px;
    color: var(--color-border);
  }

  .breadcrumb-current {
    font-size: 15px;
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .topbar-countdown-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: var(--radius-full);
    background: rgba(201, 132, 122, 0.1);
    color: var(--color-accent);
    font-size: 12.5px;
    font-weight: 600;
  }

  .pill-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-primary);
  }

  .topbar-admin-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: var(--radius-full);
    color: #92400e;
    background: #fef3c7;
    font-size: 12.5px;
    font-weight: 600;
    text-decoration: none;
    border: 1px solid #fde68a;
    transition: all var(--transition-fast);
  }

  .topbar-admin-btn:hover {
    background: #fde68a;
  }

  .topbar-icon-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border-light);
    background: var(--color-surface);
    transition: all var(--transition-fast);
    text-decoration: none;
  }

  .topbar-icon-btn:hover {
    background: var(--color-secondary);
    color: var(--color-accent);
  }

  .topbar-logout-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: var(--radius-full);
    color: var(--color-text-subtle);
    font-size: 13px;
    text-decoration: none;
    transition: all var(--transition-fast);
  }

  .topbar-logout-btn:hover {
    background: var(--color-danger-bg);
    color: var(--color-danger);
  }

  .topbar-login-btn {
    display: inline-flex;
    align-items: center;
    padding: 6px 16px;
    background: var(--color-accent);
    color: #ffffff;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: opacity var(--transition-fast);
  }

  .topbar-login-btn:hover {
    opacity: 0.9;
  }

  .page-content {
    flex: 1;
    min-width: 0;
    padding-top: var(--space-8);
    padding-bottom: var(--space-16);
  }

  /* ========================================= */
  /* RESPONSIVE & MOBILE DRAWER                */
  /* ========================================= */
  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(44, 24, 16, 0.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 89;
  }

  @media (max-width: 992px) {
    .sidebar {
      transform: translateX(-100%);
      width: 270px !important;
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
    }

    .sidebar.mobile-open {
      transform: translateX(0);
    }

    .main-wrapper {
      margin-left: 0 !important;
    }

    .app-header {
      padding: 0 var(--space-4);
    }
  }

  @media (min-width: 993px) {
    .hide-desktop {
      display: none !important;
    }
  }

  @media (max-width: 992px) {
    .hide-mobile {
      display: none !important;
    }
  }
</style>
