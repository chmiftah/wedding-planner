<script lang="ts">
  import { goto } from '$app/navigation';
  import { wedding } from '#lib/stores/wedding';

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
</svelte:head>

<div class="landing">
  <!-- ============================================== -->
  <!-- FULL-WIDTH STICKY TOP NAVBAR                   -->
  <!-- ============================================== -->
  <header class="landing-header">
    <div class="landing-header-container">
      <a href="/" class="header-brand" aria-label="Nikahku Beranda">
        <div class="brand-icon-box">
          <span class="brand-icon">💍</span>
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
            <span class="cta-arrow" aria-hidden="true">→</span>
          </button>
        {:else}
          <a href="/dashboard" class="header-link-demo hide-mobile">
            Lihat Demo
          </a>
          <button onclick={handleStart} class="header-cta-btn">
            <span>Mulai Gratis</span>
            <span class="cta-sparkle" aria-hidden="true">✨</span>
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
      <span class="falling-petal petal-1">🌸</span>
      <span class="falling-petal petal-2">🍃</span>
      <span class="falling-petal petal-3">✨</span>
      <span class="falling-petal petal-4">🌸</span>
      <span class="falling-petal petal-5">🌿</span>
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
          <span>💍 Mulai Rencanakan Sekarang</span>
        </button>
        <a href="#fitur" class="btn btn-ghost btn-lg">
          Lihat Fitur ↓
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
          <span class="preview-icon-chip">💰</span>
          <div class="flex-1">
            <span class="text-sm font-bold block">Anggaran Vendor</span>
            <span class="text-xs text-subtle">Katering & Gedung</span>
          </div>
          <span class="badge badge-success badge-sm">Terpantau</span>
        </div>
        <div class="preview-budget-item">
          <span class="item-label">🍽️ Katering</span>
          <div class="mini-progress-track">
            <div class="mini-progress-fill" style="width: 65%; background: #C9847A;"></div>
          </div>
          <span class="badge badge-warning badge-xs">DP</span>
        </div>
        <div class="preview-budget-item">
          <span class="item-label">🏛️ Gedung</span>
          <div class="mini-progress-track">
            <div class="mini-progress-fill" style="width: 100%; background: #6BAB8A;"></div>
          </div>
          <span class="badge badge-success badge-xs">Lunas</span>
        </div>
        <div class="preview-budget-item">
          <span class="item-label">📸 Dokumentasi</span>
          <div class="mini-progress-track">
            <div class="mini-progress-fill" style="width: 0%; background: #A88880;"></div>
          </div>
          <span class="badge badge-neutral badge-xs">Belum</span>
        </div>
      </div>

      <!-- Card 2: Tabungan -->
      <div class="preview-card preview-card-savings animate-float delay-100">
        <div class="preview-card-header">
          <span class="preview-icon-chip">🏦</span>
          <div>
            <span class="text-sm font-bold block">Target Tabungan</span>
            <span class="text-xs text-subtle">Proyeksi menuju hari H</span>
          </div>
        </div>
        <div class="preview-savings-amount">Rp 85.000.000</div>
        <div class="preview-savings-label text-subtle text-xs">dari target Rp 150.000.000</div>
        <div class="progress-bar mt-2">
          <div class="progress-fill" style="width: 56.6%"></div>
        </div>
        <div class="preview-savings-note">
          ✨ Perlu nabung Rp 2,1 jt / bulan
        </div>
      </div>

      <!-- Card 3: Tamu & RSVP -->
      <div class="preview-card preview-card-rsvp animate-float delay-200">
        <div class="preview-card-header">
          <span class="preview-icon-chip">👥</span>
          <div>
            <span class="text-sm font-bold block">Konfirmasi Tamu</span>
            <span class="text-xs text-subtle">Link RSVP Online</span>
          </div>
        </div>
        <div class="preview-rsvp-grid">
          <div class="preview-rsvp-stat">
            <span class="preview-rsvp-num text-success">142</span>
            <span class="text-xs text-subtle font-medium">Hadir</span>
          </div>
          <div class="preview-rsvp-stat">
            <span class="preview-rsvp-num text-warning">38</span>
            <span class="text-xs text-subtle font-medium">Pending</span>
          </div>
          <div class="preview-rsvp-stat">
            <span class="preview-rsvp-num text-muted">12</span>
            <span class="text-xs text-subtle font-medium">Berhalangan</span>
          </div>
        </div>
        <div class="rsvp-mini-bar mt-3">
          <div class="rsvp-mini-fill" style="width: 74%"></div>
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
      <span class="filigree-leaf">🌿</span>
      <span class="filigree-rings">💍</span>
      <span class="filigree-leaf flip">🌿</span>
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
              <span class="badge-icon">💐</span>
              <span class="badge-text">Dirancang dengan Kasih untuk Pasangan</span>
            </div>
          </div>
        </div>

        <!-- Comparison Cards -->
        <div class="spotlight-text animate-fade-in delay-100">
          <span class="section-tag">✨ Kenapa Nikahku?</span>
          <h2 class="spotlight-title">Pernikahanmu terlalu istimewa untuk lembar kerja yang membosankan</h2>
          <p class="text-muted mb-6">
            Buku catatan hilang, rumus Excel rusak, dan lupa kapan jatuh tempo pelunasan katering.
            Nikahku hadir mengubah kecemasan persiapan menjadi proses yang menyenangkan.
          </p>

          <div class="comparison-boxes">
            <div class="comparison-box negative">
              <div class="comp-icon">❌</div>
              <div>
                <h4 class="comp-title">Pakai Excel Tradisional</h4>
                <p class="comp-desc">Rumus mudah terhapus, tidak ada reminder jatuh tempo DP, dan link RSVP manual satu per satu lewat pesan chat.</p>
              </div>
            </div>

            <div class="comparison-box positive">
              <div class="comp-icon">✨</div>
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
            <div class="feature-card-ornament" aria-hidden="true">🌸</div>
            <div class="feature-icon" style="background: {feature.color}18; color: {feature.color}">
              {feature.icon}
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
        <div class="cta-floral-bg" aria-hidden="true">🌸</div>
        <div class="cta-content">
          <span class="cta-sparkle-pill">✨ Mulai Perjalanan Bahagiamu</span>
          <h2>Wujudkan pernikahan impian<br />dengan hati yang tenang</h2>
          <p class="cta-desc">
            Sepenuhnya gratis untuk calon pengantin. Tanpa perlu download atau install aplikasi.
          </p>
          <button onclick={handleStart} class="btn-hero-cta">
            <span>💍 Mulai Rencanakan Sekarang</span>
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
          <span class="brand-icon">💍</span>
          <span class="brand-name">Nikahku</span>
        </div>
        <p class="footer-copy">
          Dibuat dengan ❤️ untuk calon pengantin di seluruh Indonesia.
        </p>
      </div>
    </div>
  </footer>
</div>

<script module lang="ts">
  const features = [
    { icon: '🧙‍♀️', title: 'Wizard Percakapan', desc: 'Jawab beberapa pertanyaan ramah, dan rencana anggaran awal langsung terbentuk otomatis tanpa halaman kosong yang membingungkan.', color: '#C9847A' },
    { icon: '💰', title: 'Budget Tracker Kategori', desc: 'Pantau pengeluaran per kategori (Katering, Gedung, Busana). Catat DP dan tanggal jatuh tempo pelunasan per vendor.', color: '#8B5E52' },
    { icon: '🏦', title: 'Proyeksi Tabungan', desc: 'Cari tahu apakah uang kalian cukup. Sistem menghitung proyeksi bulanan dan mengingatkan bila perlu menabung lebih.', color: '#6BAB8A' },
    { icon: '👥', title: 'Manajemen Tamu & RSVP', desc: 'Kirimkan link RSVP unik untuk setiap tamu secara online. Pantau konfirmasi kehadiran seketika tanpa mencatat manual.', color: '#6A8AB8' },
    { icon: '👫', title: 'Akses Bersama Pasangan', desc: 'Akses rencana pernikahan berdua. Tidak ada lagi momen kebingungan saling tanya file atau catatan terbaru.', color: '#D4956A' },
    { icon: '✅', title: 'Checklist Persiapan H-Day', desc: 'Dari booking gedung hingga kesiapan cincin H-1. Pastikan setiap detail penting tidak ada yang terlewat.', color: '#A88880' },
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
    font-size: 1.25rem;
    opacity: 0.35;
    animation: driftDown 12s linear infinite;
  }

  .petal-1 { top: -20px; left: 15%; animation-duration: 14s; animation-delay: 0s; }
  .petal-2 { top: -20px; left: 45%; animation-duration: 18s; animation-delay: 3s; font-size: 1.1rem; }
  .petal-3 { top: -20px; left: 78%; animation-duration: 16s; animation-delay: 5s; font-size: 1rem; }
  .petal-4 { top: -20px; left: 28%; animation-duration: 15s; animation-delay: 8s; }
  .petal-5 { top: -20px; left: 88%; animation-duration: 20s; animation-delay: 2s; font-size: 1.1rem; }

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
    display: inline-block;
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
    font-family: var(--font-display);
    font-size: clamp(2.2rem, 5vw, 3.5rem);
    font-weight: 700;
    line-height: 1.18;
    color: #2C1810;
    letter-spacing: -0.015em;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0 0.3em;
  }

  .hero-title-sub {
    font-family: var(--font-display);
    font-style: italic;
    font-weight: 400;
    font-size: clamp(2rem, 4.5vw, 3.2rem);
    line-height: 1.18;
    background: linear-gradient(135deg, #C9847A 0%, #B8726A 50%, #8B5E52 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.01em;
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
    display: flex;
    justify-content: center;
    gap: var(--space-6);
    padding: var(--space-6) var(--space-6) var(--space-8);
    margin-top: var(--space-6);
    flex-wrap: wrap;
    max-width: 1080px;
    margin-left: auto;
    margin-right: auto;
  }

  .preview-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(237, 213, 206, 0.85);
    border-radius: var(--radius-2xl);
    padding: var(--space-6);
    box-shadow: 0 14px 36px -4px rgba(139, 94, 82, 0.09), 0 2px 6px rgba(0, 0, 0, 0.02);
    width: 270px;
    flex-shrink: 0;
    text-align: left;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .preview-card:hover {
    transform: translateY(-4px);
  }

  .preview-card-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .preview-icon-chip {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    border: 1px solid var(--color-border-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    flex-shrink: 0;
  }

  .preview-budget-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
    font-size: var(--font-size-xs);
  }

  .item-label { width: 90px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
  .mini-progress-track { flex: 1; height: 5px; background: var(--color-secondary); border-radius: var(--radius-full); overflow: hidden; }
  .mini-progress-fill { height: 100%; border-radius: var(--radius-full); }

  .badge-xs { font-size: 9px; padding: 1px 6px; }

  .preview-savings-amount {
    font-family: var(--font-numeric);
    font-variant-numeric: tabular-nums lining-nums;
    font-size: var(--font-size-xl);
    font-weight: 800;
    color: var(--color-text);
    margin: 4px 0 2px;
  }

  .preview-savings-note {
    margin-top: var(--space-3);
    font-size: 11px;
    color: var(--color-accent);
    background: rgba(201, 132, 122, 0.12);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    font-weight: 500;
  }

  .preview-rsvp-grid {
    display: flex;
    justify-content: space-between;
    margin-top: var(--space-2);
    text-align: center;
  }

  .preview-rsvp-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .preview-rsvp-num {
    font-family: var(--font-numeric);
    font-variant-numeric: tabular-nums lining-nums;
    font-size: var(--font-size-xl);
    font-weight: 800;
    line-height: 1.2;
  }

  .rsvp-mini-bar {
    height: 5px;
    background: var(--color-border-light);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .rsvp-mini-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-success), var(--color-primary));
    border-radius: var(--radius-full);
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

  .filigree-leaf { font-size: 1.1rem; opacity: 0.7; }
  .filigree-leaf.flip { transform: scaleX(-1); }
  .filigree-rings { font-size: 1.3rem; }

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

  .badge-icon { font-size: 1.4rem; }
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
    font-size: 1.5rem;
    flex-shrink: 0;
    margin-top: 2px;
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
      font-size: 1.85rem;
      line-height: 1.25;
      text-wrap: balance;
    }

    .hero-title-sub {
      font-size: 1.65rem;
      line-height: 1.25;
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
</style>
