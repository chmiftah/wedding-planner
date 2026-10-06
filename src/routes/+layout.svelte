<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { wedding } from '#lib/stores/wedding';

  interface Props {
    children: any;
    data: {
      user: { id: string; email: string; name: string } | null;
    };
  }

  const { children, data }: Props = $props();

  // Navigation Items
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', id: 'dashboard' },
    { href: '/anggaran',  label: 'Anggaran',  id: 'anggaran' },
    { href: '/tabungan',  label: 'Tabungan',  id: 'tabungan' },
    { href: '/tamu',      label: 'Tamu',      id: 'tamu' },
    { href: '/checklist', label: 'Checklist', id: 'checklist' },
    { href: '/undangan',  label: 'Undangan',  id: 'undangan' },
  ];

  // Public routes that don't need the nav
  const publicRoutes = ['/', '/masuk', '/daftar', '/wizard'];
  const isPublic = $derived(
    publicRoutes.some((r) => page.url.pathname === r) ||
    page.url.pathname.startsWith('/rsvp') ||
    (page.url.pathname.startsWith('/undangan/') && page.url.pathname !== '/undangan')
  );

  const currentPath = $derived(page.url.pathname);

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
</script>

{#snippet navIcon(id: string)}
  {#if id === 'dashboard'}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  {:else if id === 'anggaran'}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      <line x1="2" y1="10" x2="22" y2="10"></line>
      <line x1="6" y1="15" x2="10" y2="15"></line>
    </svg>
  {:else if id === 'tabungan'}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 21h18"></path>
      <path d="M3 10h18"></path>
      <path d="M5 6l7-3 7 3"></path>
      <path d="M4 10v11"></path>
      <path d="M20 10v11"></path>
      <circle cx="12" cy="15.5" r="1.5"></circle>
    </svg>
  {:else if id === 'tamu'}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  {:else if id === 'checklist'}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 11l3 3L22 4"></path>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>
  {:else if id === 'undangan'}
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  {/if}
{/snippet}

{#if isPublic}
  {@render children()}
{:else}
  <div class="app-shell">
    <!-- Top Nav -->
    <header class="topnav">
      <div class="topnav-inner">
        <!-- Brand Logo -->
        <a href="/dashboard" class="topnav-brand">
          <span class="brand-icon">💍</span>
          <span class="brand-name">Nikahku</span>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="topnav-links hide-mobile">
          {#each navItems as item}
            {@const isActive = currentPath.startsWith(item.href)}
            <a
              href={item.href}
              class="nav-link {isActive ? 'active' : ''}"
              aria-current={isActive ? 'page' : undefined}
            >
              <span class="nav-svg">{@render navIcon(item.id)}</span>
              <span>{item.label}</span>
            </a>
          {/each}
        </nav>

        <!-- Right Side: Minimal & Refined -->
        <div class="topnav-right">
          <!-- Countdown Tag (Compact & Subtle) -->
          {#if countdownDays !== null && countdownDays > 0}
            <div class="countdown-tag hide-mobile" title="Tanggal Pernikahan: {$wedding.info.weddingDate}">
              <span class="countdown-dot"></span>
              <span>H-{countdownDays} Hari</span>
            </div>
          {/if}

          <!-- Admin Link for Admin users -->
          {#if data?.user?.role === 'admin'}
            <a
              href="/admin"
              class="nav-admin-btn {currentPath.startsWith('/admin') ? 'active' : ''}"
              title="Panel Administrator"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Admin</span>
            </a>
          {/if}

          <!-- Settings Link -->
          <a
            href="/pengaturan"
            class="nav-settings-btn {currentPath === '/pengaturan' ? 'active' : ''}"
            title="Pengaturan"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span class="hide-mobile">Pengaturan</span>
          </a>

          <!-- User Session / Auth Controls -->
          {#if data?.user}
            <div class="user-profile-badge hide-mobile" title="Masuk sebagai {data.user.email}">
              <span class="user-avatar-circle">{data.user.name.charAt(0).toUpperCase()}</span>
              <span class="user-display-name">{data.user.name}</span>
            </div>
            <a
              href="/keluar"
              class="nav-logout-btn"
              title="Keluar dari akun"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span class="hide-mobile">Keluar</span>
            </a>
          {:else}
            <a href="/masuk" class="nav-login-btn">Masuk</a>
          {/if}
        </div>
      </div>
    </header>

    <!-- Main Page Content -->
    <main class="main-content">
      {@render children()}
    </main>

    <!-- Bottom Navigation Bar for Mobile -->
    <nav class="bottom-nav hide-desktop" aria-label="Navigasi Utama">
      {#each navItems as item}
        {@const isActive = currentPath.startsWith(item.href)}
        <a
          href={item.href}
          class="bottom-nav-item {isActive ? 'active' : ''}"
          aria-current={isActive ? 'page' : undefined}
        >
          <div class="bottom-nav-pill">
            <span class="bottom-nav-svg">{@render navIcon(item.id)}</span>
            <span class="bottom-nav-label">{item.label}</span>
          </div>
          {#if isActive}
            <span class="bottom-nav-indicator"></span>
          {/if}
        </a>
      {/each}
    </nav>
  </div>
{/if}

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-surface);
  }

  /* ========================================= */
  /* TOP NAVIGATION                            */
  /* ========================================= */
  .topnav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 252, 250, 0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--color-border-light);
    box-shadow: 0 1px 8px rgba(139, 94, 82, 0.04);
  }

  .topnav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-6);
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-6);
  }

  /* Brand */
  .topnav-brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    text-decoration: none;
    flex-shrink: 0;
    transition: opacity var(--transition-fast);
  }
  .topnav-brand:hover {
    opacity: 0.85;
  }

  .brand-icon {
    font-size: 1.25rem;
    line-height: 1;
  }

  .brand-name {
    font-family: var(--font-display);
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: -0.02em;
  }

  /* Nav Links (Center) */
  .topnav-links {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .nav-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: var(--radius-full);
    font-size: 13.5px;
    font-weight: 500;
    color: var(--color-text-muted);
    transition: all var(--transition-fast);
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
  }

  .nav-svg {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-subtle);
    transition: color var(--transition-fast);
  }

  .nav-link:hover {
    background: var(--color-secondary);
    color: var(--color-accent);
  }
  .nav-link:hover .nav-svg {
    color: var(--color-primary);
  }

  .nav-link.active {
    background: var(--color-primary-xlight);
    color: var(--color-accent);
    font-weight: 600;
  }
  .nav-link.active .nav-svg {
    color: var(--color-accent);
  }

  /* Right Section */
  .topnav-right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-shrink: 0;
  }

  /* Countdown Tag (Minimal) */
  .countdown-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    background: rgba(201, 132, 122, 0.1);
    color: var(--color-accent);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  .countdown-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--radius-full);
    background: var(--color-primary);
  }

  /* Admin Link */
  .nav-admin-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--radius-full);
    color: #92400e;
    background: #fef3c7;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    border: 1px solid #fde68a;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

  .nav-admin-btn:hover {
    background: #fde68a;
    color: #78350f;
  }

  .nav-admin-btn.active {
    background: #d97706;
    color: #ffffff;
    border-color: #b45309;
  }

  /* Settings Link */
  .nav-settings-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--radius-full);
    color: var(--color-text-muted);
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    border: 1px solid transparent;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

  .nav-settings-btn:hover {
    background: var(--color-secondary);
    color: var(--color-accent);
    border-color: var(--color-border-light);
  }

  .nav-settings-btn.active {
    background: var(--color-primary-xlight);
    color: var(--color-accent);
    font-weight: 600;
    border-color: var(--color-primary-light);
  }

  .user-profile-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 4px 10px 4px 4px;
    background: var(--color-secondary);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-full);
    font-size: 13px;
    color: var(--color-text);
  }

  .user-avatar-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
  }

  .user-display-name {
    font-weight: 600;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-logout-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 10px;
    border-radius: var(--radius-full);
    color: var(--color-text-subtle);
    font-size: 13px;
    text-decoration: none;
    transition: all var(--transition-fast);
  }

  .nav-logout-btn:hover {
    background: var(--color-danger-bg);
    color: var(--color-danger);
  }

  .nav-login-btn {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    color: #ffffff;
    border-radius: var(--radius-full);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    box-shadow: 0 2px 6px rgba(201, 132, 122, 0.3);
    transition: all var(--transition-fast);
  }

  .nav-login-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(201, 132, 122, 0.4);
  }

  /* Main Content */
  .main-content {
    flex: 1;
    padding-bottom: var(--space-8);
  }

  /* ========================================= */
  /* BOTTOM NAVIGATION BAR (MOBILE)            */
  /* ========================================= */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(255, 252, 250, 0.96);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--color-border-light);
    display: flex;
    align-items: center;
    justify-content: space-around;
    z-index: 999;
    padding: 6px 8px;
    padding-bottom: max(env(safe-area-inset-bottom, 0px), 8px);
    box-shadow: 0 -4px 16px rgba(139, 94, 82, 0.06);
  }

  .bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    text-decoration: none;
    color: var(--color-text-subtle);
    min-height: 48px;
    padding: 2px 0;
    transition: all var(--transition-fast);
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
  }

  .bottom-nav-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
  }

  .bottom-nav-svg {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .bottom-nav-label {
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.01em;
  }

  /* Active State in Bottom Nav */
  .bottom-nav-item.active {
    color: var(--color-accent);
  }

  .bottom-nav-item.active .bottom-nav-pill {
    background: rgba(201, 132, 122, 0.15);
  }

  .bottom-nav-item.active .bottom-nav-svg {
    transform: scale(1.1);
    color: var(--color-primary);
  }

  .bottom-nav-item.active .bottom-nav-label {
    font-weight: 700;
    color: var(--color-accent);
  }

  .bottom-nav-indicator {
    position: absolute;
    bottom: -2px;
    width: 4px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-primary);
  }

  @media (max-width: 768px) {
    .topnav-inner {
      padding: 0 var(--space-4);
      height: 54px;
    }
    .main-content {
      padding-bottom: calc(64px + env(safe-area-inset-bottom, 12px) + var(--space-4));
    }
  }
</style>
