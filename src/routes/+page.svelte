<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { wedding } from '#lib/stores/wedding';
  import { resolveMusicSrc } from '#lib/utils/music';

  let audioRef = $state<HTMLAudioElement | null>(null);
  let isPlaying = $state(false);

  const resolvedMusicUrl = $derived(
    resolveMusicSrc($wedding?.invitation?.musicUrl || '/music/the-way-you-look-at-me.mp3')
  );

  onMount(() => {
    let cleanupGesture: (() => void) | null = null;

    const startAudio = () => {
      if (audioRef && !isPlaying) {
        audioRef.play().then(() => {
          isPlaying = true;
          if (cleanupGesture) cleanupGesture();
        }).catch(() => {
          // Autoplay policy prevented immediate unmuted playback:
          // trigger playback on first user touch/click/scroll anywhere
          const onFirstInteraction = () => {
            if (audioRef && !isPlaying) {
              audioRef.play().then(() => {
                isPlaying = true;
              }).catch(() => {});
            }
            if (cleanupGesture) cleanupGesture();
          };

          cleanupGesture = () => {
            window.removeEventListener('click', onFirstInteraction);
            window.removeEventListener('touchstart', onFirstInteraction);
            window.removeEventListener('scroll', onFirstInteraction);
            window.removeEventListener('keydown', onFirstInteraction);
          };

          window.addEventListener('click', onFirstInteraction, { once: true, passive: true });
          window.addEventListener('touchstart', onFirstInteraction, { once: true, passive: true });
          window.addEventListener('scroll', onFirstInteraction, { once: true, passive: true });
          window.addEventListener('keydown', onFirstInteraction, { once: true, passive: true });
        });
      }
    };

    const timer = setTimeout(startAudio, 200);

    return () => {
      clearTimeout(timer);
      if (cleanupGesture) cleanupGesture();
      if (audioRef) {
        audioRef.pause();
      }
    };
  });

  function toggleAudio() {
    if (!audioRef) return;
    if (isPlaying) {
      audioRef.pause();
      isPlaying = false;
    } else {
      audioRef.play().then(() => {
        isPlaying = true;
      }).catch(() => {
        isPlaying = false;
      });
    }
  }

  function handleStart() {
    if ($wedding.wizardCompleted) {
      goto('/dashboard');
    } else {
      goto('/wizard');
    }
  }
</script>

<svelte:head>
  <title>Nikahku — Rencanakan Pernikahan Impianmu</title>
  <meta name="description" content="Rencanakan pernikahan dengan mudah. Atur anggaran, undang tamu, pantau tabungan — semua dalam satu tempat." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

{#snippet iconSvg(name: string, size = 20)}
  {#if name === 'ring'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="8" cy="14" r="5"></circle>
      <circle cx="16" cy="14" r="5"></circle>
      <path d="M12 9l.6-1.8l1.8-.6l-1.8-.6l-.6-1.8l-.6 1.8l-1.8.6l1.8.6z"></path>
    </svg>
  {:else if name === 'sparkles'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l2.2 6.8a1.5 1.5 0 0 0 .95.95L22 12l-6.8 2.2a1.5 1.5 0 0 0-.95.95L12 22l-2.2-6.8a1.5 1.5 0 0 0-.95-.95L2 12l6.8-2.2a1.5 1.5 0 0 0 .95-.95L12 2z"></path>
    </svg>
  {:else if name === 'wizard'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 4V2"></path>
      <path d="M15 16v-2"></path>
      <path d="M8 9h2"></path>
      <path d="M20 9h2"></path>
      <path d="M17.8 11.8L19 13"></path>
      <path d="M17.8 6.2L19 5"></path>
      <path d="M3 21l9-9"></path>
      <path d="M12.2 6.2L11 5"></path>
    </svg>
  {:else if name === 'budget'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      <line x1="2" y1="10" x2="22" y2="10"></line>
      <line x1="6" y1="15" x2="10" y2="15"></line>
    </svg>
  {:else if name === 'savings'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 21h18"></path>
      <path d="M3 10h18"></path>
      <path d="M5 6l7-3 7 3"></path>
      <path d="M4 10v11"></path>
      <path d="M20 10v11"></path>
      <circle cx="12" cy="15.5" r="1.5"></circle>
    </svg>
  {:else if name === 'guests'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  {:else if name === 'invitation'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  {:else if name === 'checklist'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 11l3 3L22 4"></path>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>
  {:else if name === 'catering'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
      <line x1="6" y1="1" x2="6" y2="4"></line>
      <line x1="10" y1="1" x2="10" y2="4"></line>
      <line x1="14" y1="1" x2="14" y2="4"></line>
    </svg>
  {:else if name === 'venue'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 21h18"></path>
      <path d="M5 21V7l7-4 7 4v14"></path>
      <path d="M9 10h1"></path>
      <path d="M9 14h1"></path>
      <path d="M14 10h1"></path>
      <path d="M14 14h1"></path>
    </svg>
  {:else if name === 'camera'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  {:else if name === 'check'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  {:else if name === 'cross'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  {:else if name === 'heart'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
    </svg>
  {:else if name === 'leaf'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 21c3.5-3.5 6-7.5 7.5-13.5"></path>
      <path d="M6 14.5c-.8-2.2-.2-4.5 1.8-5.5 2-.8 3.8.2 4.2 2.2.5 2-1 3.8-3 4.2-.8.2-2.2-.2-3-.9z" fill="currentColor" fill-opacity="0.25"></path>
      <path d="M10.5 7.5c-.5-2.2.4-4.2 2.5-4.8 2-.5 3.8.6 4 2.8.2 2-1.2 3.8-3.2 4-1 .2-2.5-.5-3.3-2z" fill="currentColor" fill-opacity="0.25"></path>
      <path d="M10.5 17c1.8-1.2 4-.8 5 .8 1 1.8.4 3.8-1.5 4.5-1.8.8-3.8-.2-4.5-2-.3-.8-.2-2.5 1-3.3z" fill="currentColor" fill-opacity="0.25"></path>
    </svg>
  {:else if name === 'petal'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2C8 6.5 4.5 11.5 5.5 16A6.5 6.5 0 0 0 17.5 17C19.5 12.5 16 6.5 12 2z" opacity="0.9"></path>
    </svg>
  {:else if name === 'arrow-right'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  {:else if name === 'arrow-down'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <polyline points="19 12 12 19 5 12"></polyline>
    </svg>
  {:else if name === 'disc'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  {:else if name === 'volume-2'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
  {:else if name === 'volume-x'}
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <line x1="23" y1="9" x2="17" y2="15"></line>
      <line x1="17" y1="9" x2="23" y2="15"></line>
    </svg>
  {/if}
{/snippet}

<div class="landing">
  <!-- Background Music Audio Element -->
  <audio
    bind:this={audioRef}
    src={resolvedMusicUrl}
    loop
    preload="auto"
  ></audio>

  <!-- Floating Romantic Music Player Pill -->
  <button
    type="button"
    class="landing-music-pill {isPlaying ? 'playing' : 'paused'}"
    onclick={toggleAudio}
    title={isPlaying ? 'Jeda Musik (The Way You Look At Me)' : 'Putar Musik (The Way You Look At Me)'}
    aria-label={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
  >
    <span class="music-disc-box">
      <span class="disc-icon">{@render iconSvg('disc', 18)}</span>
    </span>
    <span class="music-info-text hide-mobile">
      <span class="music-track-title">The Way You Look At Me</span>
      <span class="music-track-sub">Paul Aro & Andi Rianto</span>
    </span>
    <span class="sound-wave" aria-hidden="true">
      <span class="sound-bar bar-1"></span>
      <span class="sound-bar bar-2"></span>
      <span class="sound-bar bar-3"></span>
    </span>
    <span class="music-action-icon">
      {#if isPlaying}
        {@render iconSvg('volume-2', 16)}
      {:else}
        {@render iconSvg('volume-x', 16)}
      {/if}
    </span>
  </button>
  <!-- ============================================== -->
  <!-- FULL-WIDTH STICKY TOP NAVBAR                   -->
  <!-- ============================================== -->
  <header class="landing-header">
    <div class="landing-header-container">
      <a href="/" class="header-brand" aria-label="Nikahku Beranda">
        <div class="brand-icon-box">
          <span class="brand-icon">{@render iconSvg('ring', 20)}</span>
        </div>
        <div class="brand-text">
          <span class="brand-name">Nikahku</span>
          <span class="brand-tagline">Wedding Planner</span>
        </div>
      </a>

      <!-- Center Nav Links -->
      <nav class="header-nav-links hide-mobile" aria-label="Navigasi Utama">
        <a href="#keunggulan" class="header-nav-link">Keunggulan</a>
        <a href="#fitur" class="header-nav-link">Fitur Lengkap</a>
        <a href="#cara-kerja" class="header-nav-link">Cara Kerja</a>
      </nav>

      <!-- Right Action Buttons -->
      <div class="header-nav-actions">
        {#if $wedding.wizardCompleted}
          <button onclick={handleStart} class="header-cta-btn">
            <span>Buka Dashboard</span>
            <span class="cta-arrow" aria-hidden="true">{@render iconSvg('arrow-right', 14)}</span>
          </button>
        {:else}
          <a href="/dashboard" class="header-link-demo hide-mobile">
            Lihat Demo
          </a>
          <button onclick={handleStart} class="header-cta-btn">
            <span>Mulai Gratis</span>
            <span class="cta-sparkle" aria-hidden="true">{@render iconSvg('sparkles', 14)}</span>
          </button>
        {/if}
      </div>
    </div>
  </header>

  <!-- ============================================== -->
  <!-- HERO SECTION                                   -->
  <!-- ============================================== -->
  <section class="hero">
    <!-- Watercolor Floral Arch Frame -->
    <div class="hero-floral-frame" aria-hidden="true">
      <img src="/wedding-floral-arch.jpg" alt="" class="hero-floral-img" />
      <div class="hero-floral-overlay"></div>
    </div>

    <!-- Floating Breeze Petals -->
    <div class="petals-container" aria-hidden="true">
      <span class="falling-petal petal-1">{@render iconSvg('petal', 22)}</span>
      <span class="falling-petal petal-2">{@render iconSvg('leaf', 18)}</span>
      <span class="falling-petal petal-3">{@render iconSvg('sparkles', 16)}</span>
      <span class="falling-petal petal-4">{@render iconSvg('petal', 20)}</span>
      <span class="falling-petal petal-5">{@render iconSvg('leaf', 20)}</span>
    </div>

    <!-- Soft Ambient Aura Blobs -->
    <div class="hero-bg" aria-hidden="true">
      <div class="hero-blob blob-1"></div>
      <div class="hero-blob blob-2"></div>
      <div class="hero-blob blob-3"></div>
    </div>

    <!-- Main Hero Content -->
    <div class="hero-content animate-fade-in">
      <h1 class="hero-title">
        <span class="hero-title-main">Rencanakan Pernikahan Impian</span>
        <span class="hero-title-sub">tanpa pusing pakai Excel</span>
      </h1>

      <p class="hero-subtitle">
        Dari estimasi anggaran, jadwal DP vendor, RSVP tamu, hingga proyeksi tabungan bulanan.
        Semua tertata rapi dalam satu platform yang anggun dan mudah digunakan.
      </p>

      <div class="hero-actions">
        <button onclick={handleStart} class="btn-hero-cta">
          {@render iconSvg('ring', 18)}
          <span>Mulai Rencanakan Sekarang</span>
        </button>
        <a href="#fitur" class="btn btn-ghost btn-lg">
          <span>Lihat Fitur</span>
          {@render iconSvg('arrow-down', 16)}
        </a>
      </div>

      <!-- Trust & Features Badge Pill -->
      <div class="hero-stats">
        <div class="hero-stat">
          <span class="hero-stat-value">10 Menit</span>
          <span class="hero-stat-label">Rencana awal siap</span>
        </div>
        <div class="hero-stat-divider"></div>
        <div class="hero-stat">
          <span class="hero-stat-value">100% Gratis</span>
          <span class="hero-stat-label">Tanpa kartu kredit</span>
        </div>
        <div class="hero-stat-divider"></div>
        <div class="hero-stat">
          <span class="hero-stat-value">Akses Berdua</span>
          <span class="hero-stat-label">Bisa diedit bersama</span>
        </div>
      </div>
    </div>

    <!-- Floating Cards Preview with Romantic Styling -->
    <div class="hero-preview animate-slide-up delay-200">
      <!-- Card 1: Anggaran -->
      <div class="preview-card preview-card-budget animate-float">
        <div class="preview-card-header">
          <span class="preview-icon-chip" style="color: #C9847A;">{@render iconSvg('budget', 18)}</span>
          <div class="preview-header-info">
            <span class="preview-header-title">Anggaran Vendor</span>
            <span class="preview-header-sub">Katering & Gedung</span>
          </div>
          <span class="badge badge-success badge-sm">Terpantau</span>
        </div>
        <div class="preview-card-body">
          <div class="preview-budget-item">
            <span class="item-label">
              <span class="mini-item-icon" style="color: #C9847A;">{@render iconSvg('catering', 13)}</span>
              Katering
            </span>
            <div class="mini-progress-track">
              <div class="mini-progress-fill" style="width: 65%; background: #C9847A;"></div>
            </div>
            <span class="badge badge-warning badge-xs">DP</span>
          </div>
          <div class="preview-budget-item">
            <span class="item-label">
              <span class="mini-item-icon" style="color: #6BAB8A;">{@render iconSvg('venue', 13)}</span>
              Gedung
            </span>
            <div class="mini-progress-track">
              <div class="mini-progress-fill" style="width: 100%; background: #6BAB8A;"></div>
            </div>
            <span class="badge badge-success badge-xs">Lunas</span>
          </div>
          <div class="preview-budget-item">
            <span class="item-label">
              <span class="mini-item-icon" style="color: #A88880;">{@render iconSvg('camera', 13)}</span>
              Foto
            </span>
            <div class="mini-progress-track">
              <div class="mini-progress-fill" style="width: 0%; background: #A88880;"></div>
            </div>
            <span class="badge badge-neutral badge-xs">Belum</span>
          </div>
        </div>
        <div class="preview-card-note budget-note">
          {@render iconSvg('check', 13)}
          <span>2 dari 3 vendor terkonfirmasi DP</span>
        </div>
      </div>

      <!-- Card 2: Tabungan -->
      <div class="preview-card preview-card-savings animate-float delay-100">
        <div class="preview-card-header">
          <span class="preview-icon-chip" style="color: #6BAB8A;">{@render iconSvg('savings', 18)}</span>
          <div class="preview-header-info">
            <span class="preview-header-title">Target Tabungan</span>
            <span class="preview-header-sub">Proyeksi Hari H</span>
          </div>
          <span class="badge badge-success badge-sm">On Track</span>
        </div>
        <div class="preview-card-body">
          <div class="preview-savings-amount">Rp 85.000.000</div>
          <div class="preview-savings-label">dari target Rp 150.000.000 (56%)</div>
          <div class="mini-progress-track mt-3">
            <div class="mini-progress-fill" style="width: 56.6%; background: linear-gradient(90deg, #6BAB8A, #C9847A);"></div>
          </div>
        </div>
        <div class="preview-card-note savings-note">
          {@render iconSvg('sparkles', 13)}
          <span>Perlu nabung Rp 2,1 jt / bulan</span>
        </div>
      </div>

      <!-- Card 3: Tamu & RSVP -->
      <div class="preview-card preview-card-rsvp animate-float delay-200">
        <div class="preview-card-header">
          <span class="preview-icon-chip" style="color: #6A8AB8;">{@render iconSvg('guests', 18)}</span>
          <div class="preview-header-info">
            <span class="preview-header-title">Konfirmasi Tamu</span>
            <span class="preview-header-sub">RSVP Online</span>
          </div>
          <span class="badge badge-neutral badge-sm">192 Tamu</span>
        </div>
        <div class="preview-card-body">
          <div class="preview-rsvp-grid">
            <div class="preview-rsvp-stat">
              <span class="preview-rsvp-num text-success">142</span>
              <span class="preview-rsvp-label">Hadir</span>
            </div>
            <div class="preview-rsvp-stat">
              <span class="preview-rsvp-num text-warning">38</span>
              <span class="preview-rsvp-label">Pending</span>
            </div>
            <div class="preview-rsvp-stat">
              <span class="preview-rsvp-num text-muted">12</span>
              <span class="preview-rsvp-label">Berhalangan</span>
            </div>
          </div>
          <div class="mini-progress-track mt-3">
            <div class="mini-progress-fill" style="width: 74%; background: linear-gradient(90deg, #6BAB8A, #6A8AB8);"></div>
          </div>
        </div>
        <div class="preview-card-note rsvp-note">
          {@render iconSvg('invitation', 13)}
          <span>74% tamu telah konfirmasi</span>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================== -->
  <!-- FLORAL DIVIDER                                 -->
  <!-- ============================================== -->
  <div class="wedding-filigree-divider" aria-hidden="true">
    <div class="filigree-line"></div>
    <div class="filigree-center">
      <span class="filigree-leaf">{@render iconSvg('leaf', 22)}</span>
      <span class="filigree-rings" style="color: var(--color-primary);">{@render iconSvg('ring', 22)}</span>
      <span class="filigree-leaf flip">{@render iconSvg('leaf', 22)}</span>
    </div>
    <div class="filigree-line"></div>
  </div>

  <!-- ============================================== -->
  <!-- SPOTLIGHT: KENAPA BUKAN EXCEL?                 -->
  <!-- ============================================== -->
  <section class="spotlight-section" id="keunggulan">
    <div class="container">
      <div class="spotlight-grid">
        <!-- Bouquet Visual -->
        <div class="spotlight-media animate-fade-in">
          <div class="bouquet-frame">
            <img src="/wedding-bouquet.jpg" alt="Buket Bunga Pernikahan" class="bouquet-img" />
            <div class="bouquet-badge">
              <span class="badge-icon">{@render iconSvg('heart', 16)}</span>
              <span class="badge-text">Dirancang dengan Kasih untuk Pasangan</span>
            </div>
          </div>
        </div>

        <!-- Comparison Cards -->
        <div class="spotlight-text animate-fade-in delay-100">
          <span class="section-tag">{@render iconSvg('sparkles', 13)} Kenapa Nikahku?</span>
          <h2 class="spotlight-title">Pernikahanmu terlalu istimewa untuk lembar kerja yang membosankan</h2>
          <p class="text-muted mb-6">
            Buku catatan hilang, rumus Excel rusak, dan lupa kapan jatuh tempo pelunasan katering.
            Nikahku hadir mengubah kecemasan persiapan menjadi proses yang menyenangkan.
          </p>

          <div class="comparison-boxes">
            <div class="comparison-box negative">
              <div class="comp-icon">{@render iconSvg('cross', 16)}</div>
              <div>
                <h4 class="comp-title">Pakai Excel Tradisional</h4>
                <p class="comp-desc">Rumus mudah terhapus, tidak ada reminder jatuh tempo DP, dan link RSVP manual satu per satu lewat pesan chat.</p>
              </div>
            </div>

            <div class="comparison-box positive">
              <div class="comp-icon">{@render iconSvg('check', 16)}</div>
              <div>
                <h4 class="comp-title">Pakai Nikahku</h4>
                <p class="comp-desc">Alokasi anggaran otomatis, status pelunasan per vendor langsung terlacak, dan tamu konfirmasi kehadiran lewat link unik.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================== -->
  <!-- FEATURES SECTION                               -->
  <!-- ============================================== -->
  <section class="features" id="fitur">
    <div class="container">
      <div class="section-header text-center animate-fade-in">
        <span class="section-tag mb-3">Fitur Lengkap</span>
        <h2>Semua yang kamu butuhkan<br />dalam satu tempat yang anggun</h2>
        <p class="section-subtitle">
          Dari rencana keuangan awal hingga hari H resepsi, pastikan setiap momen berjalan sempurna.
        </p>
      </div>

      <div class="features-grid">
        {#each features as feature, i}
          <div class="feature-card animate-fade-in" style="animation-delay: {i * 0.08}s">
            <div class="feature-card-ornament" aria-hidden="true" style="color: {feature.color};">
              {@render iconSvg('sparkles', 16)}
            </div>
            <div class="feature-icon" style="background: {feature.color}15; color: {feature.color}; border: 1.5px solid {feature.color}30;">
              {@render iconSvg(feature.id, 24)}
            </div>
            <h3 class="feature-title">{feature.title}</h3>
            <p class="feature-desc">{feature.desc}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ============================================== -->
  <!-- HOW IT WORKS                                   -->
  <!-- ============================================== -->
  <section class="how-it-works" id="cara-kerja">
    <div class="container">
      <div class="section-header text-center">
        <span class="section-tag mb-3">Langkah Mudah</span>
        <h2>Siap Digunakan dalam 10 Menit</h2>
        <p class="section-subtitle">Tidak perlu pusing memikirkan rumus atau format yang rumit.</p>
      </div>

      <div class="steps">
        {#each steps as step, i}
          <div class="step-card animate-fade-in" style="animation-delay: {i * 0.12}s">
            <div class="step-badge">
              <span>{i + 1}</span>
            </div>
            <h4 class="step-title">{step.title}</h4>
            <p class="step-desc">{step.desc}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ============================================== -->
  <!-- CTA SECTION                                    -->
  <!-- ============================================== -->
  <section class="cta">
    <div class="container">
      <div class="cta-card">
        <div class="cta-floral-bg" aria-hidden="true">
          {@render iconSvg('sparkles', 140)}
        </div>
        <div class="cta-content">
          <span class="cta-sparkle-pill">{@render iconSvg('sparkles', 14)} Mulai Perjalanan Bahagiamu</span>
          <h2>Wujudkan pernikahan impian<br />dengan hati yang tenang</h2>
          <p class="cta-desc">
            Sepenuhnya gratis untuk calon pengantin. Tanpa perlu download atau install aplikasi.
          </p>
          <button onclick={handleStart} class="btn-hero-cta">
            {@render iconSvg('ring', 18)}
            <span>Mulai Rencanakan Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================== -->
  <!-- FOOTER                                         -->
  <!-- ============================================== -->
  <footer class="landing-footer">
    <div class="container">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="brand-icon">{@render iconSvg('ring', 20)}</span>
          <span class="brand-name">Nikahku</span>
        </div>
        <p class="footer-copy">
          Dibuat dengan sepenuh hati untuk calon pengantin di seluruh Indonesia.
        </p>
      </div>
    </div>
  </footer>
</div>

<script module lang="ts">
  const features = [
    { id: 'wizard', title: 'Wizard Percakapan', desc: 'Jawab beberapa pertanyaan ramah, dan rencana anggaran awal langsung terbentuk otomatis tanpa halaman kosong yang membingungkan.', color: '#C9847A' },
    { id: 'budget', title: 'Budget Tracker Kategori', desc: 'Pantau pengeluaran per kategori (Katering, Gedung, Busana). Catat DP dan tanggal jatuh tempo pelunasan per vendor.', color: '#8B5E52' },
    { id: 'savings', title: 'Proyeksi Tabungan', desc: 'Cari tahu apakah uang kalian cukup. Sistem menghitung proyeksi bulanan dan mengingatkan bila perlu menabung lebih.', color: '#6BAB8A' },
    { id: 'guests', title: 'Manajemen Tamu & RSVP', desc: 'Kirimkan link RSVP unik untuk setiap tamu secara online. Pantau konfirmasi kehadiran seketika tanpa mencatat manual.', color: '#6A8AB8' },
    { id: 'invitation', title: 'Undangan Digital Interaktif', desc: 'Pilihan tema elegan (Romantic, Royal Gold, Emerald Botanical) dengan audio musik latar, galeri cinta, dan amplop digital.', color: '#B36D74' },
    { id: 'checklist', title: 'Checklist Persiapan H-Day', desc: 'Dari booking gedung hingga kesiapan cincin H-1. Pastikan setiap detail penting tidak ada yang terlewat.', color: '#A88880' },
  ];

  const steps = [
    { title: 'Ceritakan Rencanamu', desc: 'Ikuti wizard percakapan singkat mengenai tanggal perkiraan, konsep acara, dan jumlah undangan.' },
    { title: 'Dapatkan Rencana Otomatis', desc: 'Anggaran belanja, pos pengeluaran, dan daftar tugas langsung terisi otomatis sesuai skala acaramu.' },
    { title: 'Kelola Bersama Santai', desc: 'Catat pembayaran DP, pantau konfirmasi tamu online, dan nikmati masa-masa persiapan dengan bahagia.' },
  ];
</script>

<style>
  .landing {
    min-height: 100vh;
    background: #FFFBF9;
    color: var(--color-text);
    overflow-x: hidden;
  }

  /* ========================================= */
  /* HERO SECTION WITH BOTANICAL ARCH          */
  /* ========================================= */
  .hero {
    position: relative;
    overflow: hidden;
    padding-bottom: var(--space-16);
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #FFF0EC 0%, #FFF8F6 50%, #FFFBF9 100%);
  }

  /* Floral Arch Frame at Top - Soft Airy Vignette */
  .hero-floral-frame {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 1400px;
    height: 520px;
    pointer-events: none;
    z-index: 1;
    overflow: hidden;
    opacity: 0.32;
    mix-blend-mode: multiply;
  }

  .hero-floral-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    /* Clean center so the typography has 100% serene breathing room */
    mask-image: radial-gradient(ellipse 65% 55% at 50% 32%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 42%, rgba(0,0,0,0.85) 85%, rgba(0,0,0,1) 100%);
    -webkit-mask-image: radial-gradient(ellipse 65% 55% at 50% 32%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 42%, rgba(0,0,0,0.85) 85%, rgba(0,0,0,1) 100%);
  }

  .hero-floral-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 32%, #FFFBF9 25%, rgba(255, 251, 249, 0.85) 60%, transparent 100%);
  }

  /* Floating Petals Animation */
  .petals-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
    overflow: hidden;
  }

  .falling-petal {
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0.38;
    animation: driftDown 14s linear infinite;
  }

  .petal-1 { top: -24px; left: 15%; animation-duration: 14s; animation-delay: 0s; color: #E8A29A; }
  .petal-2 { top: -24px; left: 45%; animation-duration: 18s; animation-delay: 3s; color: #8CA895; }
  .petal-3 { top: -24px; left: 78%; animation-duration: 16s; animation-delay: 5s; color: #D4AF37; }
  .petal-4 { top: -24px; left: 28%; animation-duration: 15s; animation-delay: 8s; color: #F0B8B2; }
  .petal-5 { top: -24px; left: 88%; animation-duration: 20s; animation-delay: 2s; color: #7E9F88; }

  @keyframes driftDown {
    0% {
      transform: translateY(-20px) rotate(0deg) translateX(0);
      opacity: 0;
    }
    10% { opacity: 0.7; }
    50% { transform: translateY(300px) rotate(180deg) translateX(30px); }
    90% { opacity: 0.6; }
    100% {
      transform: translateY(650px) rotate(360deg) translateX(-20px);
      opacity: 0;
    }
  }

  /* Ambient Blobs */
  .hero-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }

  .hero-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(70px);
    opacity: 0.45;
  }

  .blob-1 {
    width: 480px; height: 480px;
    background: radial-gradient(circle, #F5D8D4, #EDD5CE);
    top: -120px; right: -80px;
  }

  .blob-2 {
    width: 380px; height: 380px;
    background: radial-gradient(circle, #F5E6E0, #FFE5DE);
    bottom: 40px; left: -80px;
  }

  .blob-3 {
    width: 280px; height: 280px;
    background: radial-gradient(circle, #C9847A33, #8B5E5222);
    top: 30%; left: 35%;
  }

  /* ========================================= */
  /* FULL-WIDTH STICKY TOP NAVBAR              */
  /* ========================================= */
  .landing-header {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 70px;
    background: rgba(255, 251, 249, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(237, 213, 206, 0.7);
    box-shadow: 0 4px 20px -4px rgba(139, 94, 82, 0.06);
    z-index: 100;
    transition: background 0.3s ease, box-shadow 0.3s ease;
  }

  .landing-header-container {
    max-width: 1200px;
    height: 100%;
    margin: 0 auto;
    padding: 0 var(--space-6);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .brand-icon-box {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(201, 132, 122, 0.18) 0%, rgba(245, 216, 212, 0.5) 100%);
    border: 1px solid rgba(201, 132, 122, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(201, 132, 122, 0.12);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s;
  }

  .header-brand:hover .brand-icon-box {
    transform: scale(1.06) rotate(-3deg);
    box-shadow: 0 4px 12px rgba(201, 132, 122, 0.25);
  }

  .brand-icon {
    font-size: 1.25rem;
    line-height: 1;
    filter: drop-shadow(0 1px 2px rgba(201, 132, 122, 0.2));
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }

  .brand-name {
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 700;
    color: #2C1810;
    letter-spacing: -0.01em;
  }

  .brand-tagline {
    font-family: var(--font-body);
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--color-accent);
  }

  /* Center Nav Links */
  .header-nav-links {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .header-nav-link {
    font-family: var(--font-body);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    padding: 8px 16px;
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
  }

  .header-nav-link:hover {
    color: var(--color-accent);
    background: rgba(201, 132, 122, 0.1);
  }

  /* Right Action Buttons */
  .header-nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-link-demo {
    font-family: var(--font-body);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    padding: 8px 14px;
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
  }

  .header-link-demo:hover {
    color: var(--color-accent);
    background: rgba(201, 132, 122, 0.08);
  }

  .header-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #C9847A 0%, #B8726A 60%, #8B5E52 100%);
    color: #FFFFFF;
    font-family: var(--font-body);
    font-size: 13.5px;
    font-weight: 600;
    padding: 9px 20px;
    border-radius: var(--radius-full);
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(201, 132, 122, 0.35);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;
  }

  .header-cta-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(201, 132, 122, 0.45);
    filter: brightness(1.03);
  }

  .cta-arrow {
    display: inline-flex;
    align-items: center;
    transition: transform 0.2s ease;
  }

  .header-cta-btn:hover .cta-arrow {
    transform: translateX(3px);
  }


  /* Hero Content - Spacious & Airy with Generous Top Padding */
  .hero-content {
    position: relative;
    z-index: 10;
    text-align: center;
    padding: 96px var(--space-6) var(--space-8);
    max-width: 920px;
    margin: 0 auto;
  }

  .hero-title {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: var(--space-6);
  }

  .hero-title-main {
    font-family: var(--font-script, 'Dancing Script', cursive);
    font-size: clamp(2.8rem, 6.5vw, 4.4rem);
    font-weight: 700;
    line-height: 1.15;
    color: #2C1810;
    letter-spacing: -0.01em;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0 0.35em;
  }

  .hero-title-sub {
    font-family: var(--font-script, 'Dancing Script', cursive);
    font-weight: 600;
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    line-height: 1.2;
    background: linear-gradient(135deg, #C9847A 0%, #B8726A 50%, #8B5E52 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0;
  }

  .hero-subtitle {
    font-size: 1.05rem;
    color: #634F47;
    line-height: 1.75;
    max-width: 620px;
    margin: 0 auto var(--space-8);
  }

  .hero-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-8);
    flex-wrap: wrap;
  }

  .btn-hero-cta {
    background: linear-gradient(135deg, #C9847A 0%, #B8726A 60%, #8B5E52 100%);
    color: white;
    font-weight: 600;
    font-size: var(--font-size-base);
    padding: 14px 34px;
    border-radius: var(--radius-full);
    border: none;
    box-shadow: 0 8px 24px rgba(201, 132, 122, 0.35);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-body);
  }

  .btn-hero-cta:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 14px 32px rgba(201, 132, 122, 0.45);
  }

  /* Stats Pill - Clean & Airy */
  .hero-stats {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-8);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(237, 213, 206, 0.85);
    padding: 14px var(--space-8);
    border-radius: var(--radius-full);
    box-shadow: 0 4px 20px rgba(139, 94, 82, 0.05);
    margin-bottom: var(--space-2);
  }

  .hero-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .hero-stat-value {
    font-family: var(--font-numeric);
    font-variant-numeric: tabular-nums lining-nums;
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--color-accent);
  }

  .hero-stat-label {
    font-size: 11px;
    color: var(--color-text-subtle);
    font-weight: 500;
  }

  .hero-stat-divider {
    width: 1px;
    height: 24px;
    background: var(--color-border-light);
  }

  /* Preview Cards - Spacious Showcase */
  .hero-preview {
    position: relative;
    z-index: 10;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-6);
    padding: var(--space-4) var(--space-6) var(--space-8);
    margin-top: var(--space-6);
    max-width: 1060px;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
  }

  @media (max-width: 992px) {
    .hero-preview {
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      max-width: 720px;
    }
  }

  .preview-card {
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(237, 213, 206, 0.88);
    border-radius: var(--radius-2xl);
    padding: var(--space-6);
    box-shadow: 0 14px 36px -4px rgba(139, 94, 82, 0.09), 0 2px 6px rgba(0, 0, 0, 0.02);
    width: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: left;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .preview-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 40px -4px rgba(139, 94, 82, 0.14), 0 4px 10px rgba(0, 0, 0, 0.03);
  }

  .preview-card-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .preview-icon-chip {
    width: 38px;
    height: 38px;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    border: 1px solid var(--color-border-light);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .preview-header-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .preview-header-title {
    font-size: var(--font-size-sm);
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .preview-header-sub {
    font-size: 11.5px;
    color: var(--color-text-subtle);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .preview-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: var(--space-1) 0;
    min-height: 86px;
  }

  .preview-budget-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: 8px;
    font-size: var(--font-size-xs);
  }

  .preview-budget-item:last-child {
    margin-bottom: 0;
  }

  .item-label {
    width: 82px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
    color: var(--color-text);
    flex-shrink: 0;
  }

  .mini-item-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .mini-progress-track {
    flex: 1;
    height: 6px;
    background: rgba(139, 94, 82, 0.08);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .mini-progress-fill {
    height: 100%;
    border-radius: var(--radius-full);
  }

  .badge-xs {
    font-size: 9.5px;
    padding: 1px 7px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .preview-savings-amount {
    font-family: var(--font-numeric);
    font-variant-numeric: tabular-nums lining-nums;
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--color-text);
    line-height: 1.2;
    margin: 0 0 3px;
  }

  .preview-savings-label {
    font-size: 11.5px;
    color: var(--color-text-subtle);
    font-weight: 500;
  }

  .preview-rsvp-grid {
    display: flex;
    justify-content: space-between;
    text-align: center;
    margin-bottom: 2px;
  }

  .preview-rsvp-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .preview-rsvp-num {
    font-family: var(--font-numeric);
    font-variant-numeric: tabular-nums lining-nums;
    font-size: 1.35rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .preview-rsvp-label {
    font-size: 11px;
    color: var(--color-text-subtle);
    font-weight: 500;
  }

  .preview-card-note {
    margin-top: var(--space-4);
    font-size: 11.5px;
    padding: 7px 11px;
    border-radius: var(--radius-md);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 7px;
    line-height: 1.3;
  }

  .preview-card-note.budget-note {
    color: #9E5B52;
    background: rgba(201, 132, 122, 0.12);
  }

  .preview-card-note.savings-note {
    color: #387652;
    background: rgba(107, 171, 138, 0.12);
  }

  .preview-card-note.rsvp-note {
    color: #426490;
    background: rgba(106, 138, 184, 0.12);
  }

  /* ========================================= */
  /* FILIGREE DIVIDER                          */
  /* ========================================= */
  .wedding-filigree-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    max-width: 600px;
    margin: var(--space-12) auto;
    padding: 0 var(--space-6);
  }

  .filigree-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-border), transparent);
  }

  .filigree-center {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.2rem;
  }

  .filigree-leaf {
    display: inline-flex;
    align-items: center;
    color: #8CA895;
    opacity: 0.85;
  }
  .filigree-leaf.flip { transform: scaleX(-1); }
  .filigree-rings {
    display: inline-flex;
    align-items: center;
  }

  /* ========================================= */
  /* SPOTLIGHT COMPARISON SECTION              */
  /* ========================================= */
  .spotlight-section {
    padding: var(--space-12) 0 var(--space-16);
  }

  .spotlight-grid {
    display: grid;
    grid-template-columns: 420px 1fr;
    gap: var(--space-12);
    align-items: center;
  }

  .bouquet-frame {
    position: relative;
    border-radius: 200px 200px 32px 32px;
    overflow: hidden;
    border: 3px solid white;
    box-shadow: 0 20px 48px rgba(139, 94, 82, 0.16);
    background: white;
  }

  .bouquet-img {
    width: 100%;
    height: 480px;
    object-fit: cover;
    display: block;
    transition: transform 0.5s ease;
  }

  .bouquet-frame:hover .bouquet-img {
    transform: scale(1.04);
  }

  .bouquet-badge {
    position: absolute;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(12px);
    border-radius: var(--radius-xl);
    padding: var(--space-3) var(--space-4);
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 16px rgba(139, 94, 82, 0.12);
    border: 1px solid var(--color-border-light);
  }

  .badge-icon {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-full);
    background: rgba(201, 132, 122, 0.15);
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .badge-text { font-size: var(--font-size-xs); font-weight: 700; color: var(--color-accent); }

  .section-tag {
    display: inline-block;
    padding: 4px 14px;
    border-radius: var(--radius-full);
    background: var(--color-primary-xlight);
    color: var(--color-accent);
    font-size: var(--font-size-xs);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: var(--space-2);
  }

  .spotlight-title {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    line-height: 1.25;
    margin: var(--space-2) 0 var(--space-4);
  }

  .comparison-boxes {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .comparison-box {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border-light);
    background: white;
    box-shadow: var(--shadow-xs);
    transition: transform var(--transition-fast);
  }

  .comparison-box:hover {
    transform: translateX(4px);
  }

  .comparison-box.positive {
    border-color: rgba(107, 171, 138, 0.4);
    background: linear-gradient(135deg, white 60%, rgba(235, 247, 241, 0.5) 100%);
  }

  .comparison-box.negative {
    opacity: 0.85;
    background: var(--color-surface);
  }

  .comp-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .comparison-box.negative .comp-icon {
    background: #FDEAEB;
    color: var(--color-danger);
  }
  .comparison-box.positive .comp-icon {
    background: #EBF7F1;
    color: var(--color-success);
  }

  .mini-item-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    flex-shrink: 0;
  }

  .comp-title {
    font-size: var(--font-size-base);
    font-weight: 700;
    margin-bottom: 4px;
    color: var(--color-text);
  }

  .comp-desc {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    line-height: 1.5;
    margin: 0;
  }

  /* ========================================= */
  /* FEATURES SECTION                          */
  /* ========================================= */
  .features {
    padding: var(--space-20) 0;
    background: white;
    border-top: 1px solid var(--color-border-light);
    border-bottom: 1px solid var(--color-border-light);
    position: relative;
  }

  .section-header {
    margin-bottom: var(--space-12);
  }

  .section-header h2 {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    margin-top: var(--space-2);
  }

  .section-subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    max-width: 520px;
    margin: var(--space-3) auto 0;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--space-6);
  }

  .feature-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-2xl);
    padding: var(--space-6);
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 36px rgba(139, 94, 82, 0.1);
    border-color: rgba(201, 132, 122, 0.4);
    background: white;
  }

  .feature-card-ornament {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 1rem;
    opacity: 0.25;
    transition: opacity var(--transition-fast);
  }

  .feature-card:hover .feature-card-ornament {
    opacity: 0.8;
  }

  .feature-icon {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-xl);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    margin-bottom: var(--space-4);
  }

  .feature-title {
    font-size: var(--font-size-lg);
    font-weight: 700;
    margin-bottom: var(--space-2);
    color: var(--color-text);
  }

  .feature-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    line-height: 1.6;
    margin: 0;
  }

  /* ========================================= */
  /* HOW IT WORKS                              */
  /* ========================================= */
  .how-it-works {
    padding: var(--space-20) 0;
  }

  .steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-6);
    margin-top: var(--space-8);
  }

  .step-card {
    background: white;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-2xl);
    padding: var(--space-6);
    text-align: center;
    box-shadow: var(--shadow-xs);
    position: relative;
    transition: all var(--transition-fast);
  }

  .step-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
  }

  .step-badge {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, var(--color-primary-xlight), var(--color-secondary));
    border: 2px solid white;
    box-shadow: var(--shadow-sm);
    margin: 0 auto var(--space-4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-numeric);
    font-size: var(--font-size-lg);
    font-weight: 800;
    color: var(--color-accent);
  }

  .step-title {
    font-size: var(--font-size-base);
    font-weight: 700;
    margin-bottom: var(--space-2);
  }

  .step-desc {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    line-height: 1.6;
    margin: 0;
  }

  /* ========================================= */
  /* CTA SECTION                               */
  /* ========================================= */
  .cta {
    padding: 0 0 var(--space-20);
  }

  .cta-card {
    background: linear-gradient(135deg, #FFF0EC 0%, #F5E6E0 50%, #FFEBE6 100%);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
    padding: var(--space-16) var(--space-8);
    text-align: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 16px 40px rgba(139, 94, 82, 0.08);
  }

  .cta-floral-bg {
    position: absolute;
    top: -20px;
    right: -20px;
    font-size: 8rem;
    opacity: 0.12;
    pointer-events: none;
  }

  .cta-content {
    position: relative;
    z-index: 10;
    max-width: 600px;
    margin: 0 auto;
  }

  .cta-sparkle-pill {
    display: inline-block;
    font-size: var(--font-size-xs);
    font-weight: 700;
    color: var(--color-accent);
    background: rgba(255, 255, 255, 0.7);
    padding: 4px 14px;
    border-radius: var(--radius-full);
    margin-bottom: var(--space-4);
    letter-spacing: 0.02em;
  }

  .cta-card h2 {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    margin-bottom: var(--space-3);
  }

  .cta-desc {
    font-size: var(--font-size-base);
    color: var(--color-text-muted);
    margin-bottom: var(--space-8);
    line-height: 1.6;
  }

  /* ========================================= */
  /* FOOTER                                    */
  /* ========================================= */
  .landing-footer {
    border-top: 1px solid var(--color-border-light);
    padding: var(--space-8) 0;
    background: white;
  }

  .footer-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .footer-copy {
    font-size: var(--font-size-xs);
    color: var(--color-text-subtle);
    margin: 0;
  }

  /* ========================================= */
  /* RESPONSIVE DESIGN                         */
  /* ========================================= */
  @media (max-width: 900px) {
    .spotlight-grid {
      grid-template-columns: 1fr;
      gap: var(--space-8);
    }
    .bouquet-frame {
      max-width: 360px;
      margin: 0 auto;
      border-radius: 160px 160px 24px 24px;
    }
    .bouquet-img { height: 380px; }
    .steps { grid-template-columns: 1fr; }
  }

  @media (max-width: 600px) {
    /* Hide floating emoji petals so they do not cover mobile text */
    .petals-container {
      display: none;
    }

    .landing-header {
      height: 58px;
    }
    .landing-header-container {
      padding: 0 var(--space-4);
    }
    .brand-icon-box {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }
    .brand-icon {
      font-size: 1.1rem;
    }
    .brand-name {
      font-size: 1.15rem;
    }
    .brand-tagline {
      display: none;
    }
    .header-cta-btn {
      font-size: 12px;
      padding: 6px 13px;
    }

    /* GENEROUS TOP SPACE on Mobile - 64px clear space below navbar */
    .hero-content {
      padding: 64px var(--space-4) var(--space-8);
    }

    .hero-title {
      gap: 6px;
      margin-bottom: var(--space-5);
    }

    .hero-title-main {
      font-size: 2.35rem;
      line-height: 1.2;
      text-wrap: balance;
    }

    .hero-title-sub {
      font-size: 1.85rem;
      line-height: 1.2;
    }

    .hero-subtitle {
      font-size: 0.95rem;
      line-height: 1.65;
      max-width: 340px;
      margin: 0 auto var(--space-8);
      padding: 0 var(--space-1);
      color: #6E5A53;
    }

    .hero-actions {
      flex-direction: column;
      gap: var(--space-3);
      width: 100%;
      max-width: 300px;
      margin: 0 auto var(--space-8);
    }

    .btn-hero-cta {
      width: 100%;
      justify-content: center;
      padding: 13px 20px;
      font-size: 14px;
    }

    .hero-actions .btn-ghost {
      font-size: 13px;
      padding: 6px;
    }

    .hero-stats {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      width: 100%;
      max-width: 340px;
      margin: 0 auto var(--space-8);
      border-radius: var(--radius-full);
      box-shadow: 0 4px 14px rgba(139, 94, 82, 0.05);
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(237, 213, 206, 0.8);
    }

    .hero-stat {
      flex: 1;
      text-align: center;
      gap: 1px;
    }

    .hero-stat-value {
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .hero-stat-label {
      font-size: 9px;
      white-space: nowrap;
    }

    .hero-stat-divider {
      width: 1px;
      height: 18px;
      background: var(--color-border-light);
    }

    .hero-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      padding: 0 var(--space-4) var(--space-10);
      margin-top: var(--space-2);
    }

    .preview-card {
      width: 100%;
      max-width: 330px;
      margin: 0 auto;
      padding: var(--space-5);
      border-radius: var(--radius-xl);
    }

    .cta-card {
      padding: var(--space-10) var(--space-4);
    }

    .footer-inner {
      flex-direction: column;
      text-align: center;
    }
  }

  /* ========================================= */
  /* FLOATING ROMANTIC MUSIC PLAYER            */
  /* ========================================= */
  .landing-music-pill {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(237, 213, 206, 0.9);
    padding: 7px 15px 7px 9px;
    border-radius: var(--radius-full);
    box-shadow: 0 10px 30px rgba(139, 94, 82, 0.16), 0 2px 8px rgba(0, 0, 0, 0.04);
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    color: var(--color-text);
    font-family: var(--font-body);
  }

  .landing-music-pill:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 14px 36px rgba(139, 94, 82, 0.22);
    border-color: rgba(201, 132, 122, 0.6);
  }

  .landing-music-pill.playing {
    border-color: rgba(201, 132, 122, 0.5);
  }

  .music-disc-box {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #C9847A 0%, #8B5E52 100%);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 3px 8px rgba(201, 132, 122, 0.35);
  }

  .disc-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .landing-music-pill.playing .disc-icon {
    animation: rotateVinyl 4s linear infinite;
  }

  @keyframes rotateVinyl {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .music-info-text {
    display: flex;
    flex-direction: column;
    text-align: left;
    gap: 1px;
    max-width: 155px;
  }

  .music-track-title {
    font-size: 11.5px;
    font-weight: 700;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.25;
  }

  .music-track-sub {
    font-size: 10px;
    color: var(--color-text-subtle);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }

  .sound-wave {
    display: inline-flex;
    align-items: flex-end;
    gap: 2.5px;
    height: 13px;
    color: #C9847A;
    padding: 0 2px;
  }

  .sound-bar {
    width: 2.5px;
    background: currentColor;
    border-radius: 1px;
    transition: transform 0.2s ease;
  }

  .sound-bar.bar-1 { height: 6px; }
  .sound-bar.bar-2 { height: 13px; }
  .sound-bar.bar-3 { height: 9px; }

  .landing-music-pill.playing .sound-bar.bar-1 {
    animation: waveBounce 1s ease-in-out infinite 0.1s;
  }
  .landing-music-pill.playing .sound-bar.bar-2 {
    animation: waveBounce 1s ease-in-out infinite 0.3s;
  }
  .landing-music-pill.playing .sound-bar.bar-3 {
    animation: waveBounce 1s ease-in-out infinite 0.2s;
  }

  @keyframes waveBounce {
    0%, 100% { transform: scaleY(0.35); }
    50% { transform: scaleY(1); }
  }

  .music-action-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-subtle);
    transition: color 0.2s ease;
  }

  .landing-music-pill:hover .music-action-icon {
    color: var(--color-primary);
  }

  @media (max-width: 640px) {
    .landing-music-pill {
      bottom: 18px;
      right: 18px;
      padding: 6px 12px 6px 8px;
      gap: 8px;
    }
  }
</style>
