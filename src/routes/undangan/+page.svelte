<script lang="ts">
  import { wedding, updateInvitation, addInvitationWish } from '#lib/stores/wedding';
  import RomanticFloral from '#lib/components/invitation/RomanticFloral.svelte';
  import ClassicGold from '#lib/components/invitation/ClassicGold.svelte';
  import EmeraldBotanical from '#lib/components/invitation/EmeraldBotanical.svelte';
  import { formatDate } from '#lib/utils/format';
  import { browser } from '$app/environment';

  // Mode: 'templates' (katalog template awal) atau 'customizer' (editor isi undangan)
  let currentView = $state<'templates' | 'customizer'>('templates');

  // Active settings tab di customizer
  let activeTab = $state<'couple' | 'events' | 'story' | 'gift'>('couple');

  // Preview guest selector
  let selectedPreviewGuest = $state<string>('Dimas & Partner');
  let copyFeedback = $state(false);

  // Toast notification
  let toastMessage = $state<string | null>(null);
  let toastTimer: any = null;

  function showToast(msg: string) {
    toastMessage = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage = null;
    }, 3500);
  }

  // Modal preview state
  let previewModalTheme = $state<'romantic_terracotta' | 'classic_gold' | 'emerald_botanical' | null>(null);

  // Invitation local draft bindable state
  let invitation = $derived($wedding.invitation);

  // Template definitions
  interface TemplateMeta {
    id: 'romantic_terracotta' | 'classic_gold' | 'emerald_botanical';
    title: string;
    subtitle: string;
    tag: string;
    vibes: string;
    description: string;
    colors: string[];
    features: string[];
    bestFor: string;
    accentColor: string;
    bgGradient: string;
    textColor: string;
  }

  const templates: TemplateMeta[] = [
    {
      id: 'romantic_terracotta',
      title: 'Romantic Terracotta',
      subtitle: 'Warm Floral & Blush Elegance',
      tag: 'Populer & Romantis',
      vibes: '🌸 Hangat, Manis & Anggun',
      description: 'Paduan warna terracotta lembut, rose blush, dan ilustrasi bunga cat air yang memberi kesan intim dan hangat.',
      colors: ['#C9847A', '#F5D8D4', '#8B5E52', '#FFF8F6'],
      features: ['Animasi Bunga Mekar', 'Aksen Rose Gold', 'Countdown Timer', 'Cerita Cinta & RSVP'],
      bestFor: 'Pernikahan Intimate, Semi-Outdoor, Rustic Modern',
      accentColor: '#C9847A',
      bgGradient: 'linear-gradient(135deg, #FFF8F6 0%, #FBEBE8 50%, #F5D8D4 100%)',
      textColor: '#2C1810',
    },
    {
      id: 'classic_gold',
      title: 'Classic Royal Gold',
      subtitle: 'Dark Charcoal & Luxurious Gold',
      tag: 'Mewah & Eksklusif',
      vibes: '⚜️ Glamor, Aristokrat & Berkelas',
      description: 'Desain monokrom gelap eksklusif berpadu garis ukiran emas berkilau, memancarkan kemegahan pesta pernikahan agung.',
      colors: ['#1C1B1F', '#C5A059', '#E6CA85', '#0E0E10'],
      features: ['Dark Mode Glamour', 'Gold Shimmer Accents', 'Monogram Elegan', 'Amplop & Galeri'],
      bestFor: 'Gedung / Grand Ballroom, Resepsi Malam Hari, Black Tie',
      accentColor: '#C5A059',
      bgGradient: 'linear-gradient(135deg, #1C1B1F 0%, #121214 60%, #2A241C 100%)',
      textColor: '#F5E6E0',
    },
    {
      id: 'emerald_botanical',
      title: 'Emerald Botanical',
      subtitle: 'Sage Green & Fresh Foliage',
      tag: 'Segar & Asri',
      vibes: '🌿 Alami, Asri & Estetik',
      description: 'Nuansa hijau sage, daun eucalyptus botani, dan palet alam yang menenangkan jiwa, menghadirkan suasana sejuk penuh cinta.',
      colors: ['#3B5E48', '#88AA95', '#EBF2EC', '#F7F9F6'],
      features: ['Bingkai Daun Botani', 'Sage Natural Palette', 'Tipografi Kalem', 'RSVP & Peta Lokasi'],
      bestFor: 'Outdoor / Garden Party, Botanical Hall, Eco-Friendly',
      accentColor: '#3B5E48',
      bgGradient: 'linear-gradient(135deg, #F7F9F6 0%, #EBF2EC 50%, #DCE8DE 100%)',
      textColor: '#1E3326',
    },
  ];

  // Template yang sedang aktif SELALU berada di paling awal (index 0)
  let sortedTemplates = $derived.by(() => {
    const active = $wedding.invitation.theme;
    return [...templates].sort((a, b) => {
      if (a.id === active) return -1;
      if (b.id === active) return 1;
      return 0;
    });
  });

  let currentActiveTemplate = $derived(
    templates.find(t => t.id === $wedding.invitation.theme) || templates[0]
  );

  let formattedWeddingDate = $derived.by(() => {
    const d = $wedding.invitation.events.resepsi.date || $wedding.invitation.events.akad.date || $wedding.weddingDate;
    return d ? formatDate(d) : 'Sabtu, 24 Oktober 2026';
  });

  function setActiveTheme(themeId: 'romantic_terracotta' | 'classic_gold' | 'emerald_botanical') {
    updateInvitation({ theme: themeId });
    const tmpl = templates.find(t => t.id === themeId);
    showToast(`✨ Template "${tmpl?.title}" aktif dan dipindahkan ke urutan pertama!`);
  }

  function openCustomizer(themeId?: 'romantic_terracotta' | 'classic_gold' | 'emerald_botanical') {
    if (themeId && themeId !== $wedding.invitation.theme) {
      updateInvitation({ theme: themeId });
    }
    currentView = 'customizer';
    if (browser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function openPreviewModal(themeId: 'romantic_terracotta' | 'classic_gold' | 'emerald_botanical') {
    previewModalTheme = themeId;
  }

  function closePreviewModal() {
    previewModalTheme = null;
  }

  function copyGeneralLink() {
    if (!browser) return;
    const url = `${window.location.origin}/undangan/tamu-spesial`;
    navigator.clipboard.writeText(url);
    copyFeedback = true;
    showToast('✓ Link undangan tamu berhasil disalin!');
    setTimeout(() => { copyFeedback = false; }, 2500);
  }

  function handlePreviewRsvp(data: { attendance: 'hadir' | 'tidak_hadir'; count: number; message: string; name: string }) {
    addInvitationWish({
      name: data.name,
      message: data.message,
      attendance: data.attendance,
    });
    showToast(`Terima kasih! RSVP simulasi dari "${data.name}" tercatat.`);
  }

  function addStoryItem() {
    const current = invitation.loveStory.stories;
    const newItem = {
      year: new Date().getFullYear().toString(),
      title: 'Babak Baru',
      story: 'Ceritakan momen istimewa perjalanan cinta kalian di sini...'
    };
    updateInvitation({
      loveStory: {
        ...invitation.loveStory,
        stories: [...current, newItem]
      }
    });
  }

  function removeStoryItem(index: number) {
    const current = [...invitation.loveStory.stories];
    current.splice(index, 1);
    updateInvitation({
      loveStory: {
        ...invitation.loveStory,
        stories: current
      }
    });
  }

  function addBankAccount() {
    const current = invitation.gift.bankAccounts;
    const newAcc = { bank: 'BCA', accountNumber: '1234567890', accountHolder: invitation.couple.groomNickname };
    updateInvitation({
      gift: {
        ...invitation.gift,
        bankAccounts: [...current, newAcc]
      }
    });
  }

  function removeBankAccount(index: number) {
    const current = [...invitation.gift.bankAccounts];
    current.splice(index, 1);
    updateInvitation({
      gift: {
        ...invitation.gift,
        bankAccounts: current
      }
    });
  }
</script>

<svelte:head>
  <title>Undangan Pernikahan Digital — Nikahku</title>
</svelte:head>

<!-- Toast Notification -->
{#if toastMessage}
  <div class="toast-floating animate-fade-in" role="status" aria-live="polite">
    <div class="toast-content">
      <span>{toastMessage}</span>
      <button class="toast-close-btn" onclick={() => toastMessage = null} aria-label="Tutup notifikasi">✕</button>
    </div>
  </div>
{/if}

<div class="page-container studio-page">
  <!-- Page Header -->
  <div class="page-header">
    <div class="container">
      <div class="page-header-inner">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="badge badge-primary text-xs">Studio Undangan Digital</span>
            <span class="badge badge-success text-xs">
              Tema Aktif: {currentActiveTemplate.title}
            </span>
          </div>
          <h1 class="page-title-with-icon">
            <span class="page-title-icon" aria-hidden="true">💌</span>
            Undangan Pernikahan Online
          </h1>
          <p class="text-muted text-sm mt-1">
            Pilih template desain favorit, lihat pratinjau langsung, lalu sesuaikan detail informasi pernikahan kalian.
          </p>
        </div>

        <div class="header-actions flex gap-2">
          <button class="btn btn-secondary btn-sm flex items-center gap-1.5" onclick={copyGeneralLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            {copyFeedback ? '✓ Link Tersalin!' : 'Salin Link Undangan'}
          </button>

          <a href="/undangan/tamu-spesial" target="_blank" class="btn btn-primary btn-sm flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Buka Halaman Tamu
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Primary Flow Navigation Toggle (Pilih Template vs Kustomisasi) -->
  <div class="container mt-4">
    <div class="flow-nav-container card">
      <div class="flow-nav-tabs">
        <button
          class="flow-nav-btn {currentView === 'templates' ? 'active' : ''}"
          onclick={() => currentView = 'templates'}
        >
          <span class="flow-step-number">1</span>
          <span class="flow-btn-icon">🎨</span>
          <div class="flow-btn-text">
            <strong>Pilih Template Undangan</strong>
            <span class="flow-btn-desc">{templates.length} pilihan desain cantik</span>
          </div>
        </button>

        <button
          class="flow-nav-btn {currentView === 'customizer' ? 'active' : ''}"
          onclick={() => currentView = 'customizer'}
        >
          <span class="flow-step-number">2</span>
          <span class="flow-btn-icon">✏️</span>
          <div class="flow-btn-text">
            <strong>Kustomisasi Isi &amp; Detail</strong>
            <span class="flow-btn-desc">Mempelai, acara, cerita cinta, kado</span>
          </div>
        </button>
      </div>

      {#if currentView === 'templates'}
        <div class="flow-nav-info-banner">
          <span class="info-icon">💡</span>
          <span>
            Template yang <strong>sedang aktif berada di urutan pertama</strong>. Klik <strong>Preview</strong> untuk mencoba interaktif atau klik <strong>Kustomisasi</strong> untuk mengisi data.
          </span>
        </div>
      {/if}
    </div>
  </div>

  <!-- ============================================================== -->
  <!-- VIEW 1: KATALOG & PEMILIHAN TEMPLATE (FLOW UTAMA)              -->
  <!-- ============================================================== -->
  {#if currentView === 'templates'}
    <div class="container mt-6 animate-fade-in">
      <!-- Active Theme Highlight Banner -->
      <div class="active-summary-card card mb-6">
        <div class="active-summary-content">
          <div class="active-indicator-pulse"></div>
          <div>
            <div class="text-xs font-semibold text-muted uppercase tracking-wider">Template Undangan Yang Sedang Aktif:</div>
            <div class="active-summary-title">
              {currentActiveTemplate.vibes.split(' ')[0]} {currentActiveTemplate.title}
              <span class="badge badge-success text-xs ml-2">✓ Aktif Digunakan</span>
            </div>
            <p class="text-xs text-muted mt-0.5">{currentActiveTemplate.description}</p>
          </div>
        </div>

        <div class="active-summary-actions">
          <button
            class="btn btn-secondary btn-sm"
            onclick={() => openPreviewModal(currentActiveTemplate.id)}
          >
            👁️ Pratinjau Interaktif
          </button>
          <button
            class="btn btn-primary btn-sm"
            onclick={() => openCustomizer(currentActiveTemplate.id)}
          >
            ✏️ Kustomisasi Template Ini
          </button>
        </div>
      </div>

      <!-- Template Catalog Grid (Active Template is ALWAYS FIRST) -->
      <div class="template-catalog-grid">
        {#each sortedTemplates as template, index (template.id)}
          {@const isActive = template.id === $wedding.invitation.theme}
          <div class="template-catalog-card card {isActive ? 'is-active-card' : ''}">
            <!-- Top Status Badge Ribbon -->
            {#if isActive}
              <div class="card-ribbon-active">
                <span class="ribbon-star">★</span>
                <span>AKTIF SAAT INI (URUTAN #1)</span>
              </div>
            {:else}
              <div class="card-ribbon-inactive">
                <span>Pilihan Desain #{index + 1}</span>
              </div>
            {/if}

            <!-- Visual Invitation Preview Window -->
            <div
              class="invitation-preview-window theme-style-{template.id}"
              onclick={() => openPreviewModal(template.id)}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === 'Enter' && openPreviewModal(template.id)}
              title="Klik untuk membuka pratinjau interaktif smartphone"
            >
              <!-- Mini Invitation Mockup Card -->
              <div class="mini-mockup-frame">
                <!-- Theme Motifs -->
                {#if template.id === 'romantic_terracotta'}
                  <div class="mini-motif-romantic">
                    <span class="flower-icon">🌸</span>
                    <span class="leaf-icon">🌿</span>
                  </div>
                {:else if template.id === 'classic_gold'}
                  <div class="mini-motif-gold">
                    <div class="gold-shield">⚜️</div>
                  </div>
                {:else}
                  <div class="mini-motif-emerald">
                    <span class="leaf-icon-left">🌿</span>
                    <span class="leaf-icon-right">🍃</span>
                  </div>
                {/if}

                <div class="mini-badge-sub">THE WEDDING OF</div>
                <div class="mini-mockup-names">
                  {$wedding.invitation.couple.groomNickname || 'Rama'}
                  <span class="mini-amp">&amp;</span>
                  {$wedding.invitation.couple.brideNickname || 'Sinta'}
                </div>

                <div class="mini-mockup-divider">
                  <span class="divider-line"></span>
                  <span class="divider-gem">💍</span>
                  <span class="divider-line"></span>
                </div>

                <div class="mini-mockup-date">
                  📅 {formattedWeddingDate}
                </div>

                <div class="mini-mockup-venue">
                  📍 {$wedding.invitation.events.resepsi.venueName || $wedding.invitation.events.akad.venueName || 'Grand Ballroom'}
                </div>

                <div class="mini-open-pill">
                  <span>✉️ Buka Undangan</span>
                </div>
              </div>

              <!-- Hover Overlay with CTA -->
              <div class="preview-hover-cta">
                <div class="hover-cta-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <span>Buka Pratinjau Interaktif</span>
                </div>
              </div>
            </div>

            <!-- Card Information Body -->
            <div class="template-card-body">
              <div class="flex items-center justify-between mb-2">
                <span class="theme-vibes-chip">{template.vibes}</span>
                <span class="badge {isActive ? 'badge-primary' : 'badge-subtle'} text-xs">
                  {template.tag}
                </span>
              </div>

              <h2 class="template-heading-title">{template.title}</h2>
              <p class="template-heading-subtitle">{template.subtitle}</p>
              <p class="template-description-text">{template.description}</p>

              <!-- Color Palette Bar -->
              <div class="color-palette-section mb-3">
                <span class="text-xs text-muted font-medium">Palet Warna:</span>
                <div class="palette-swatch-list">
                  {#each template.colors as color}
                    <span
                      class="palette-swatch-dot"
                      style="background-color: {color};"
                      title={color}
                    ></span>
                  {/each}
                </div>
              </div>

              <!-- Feature Highlights -->
              <div class="template-features-tags mb-3">
                {#each template.features as feature}
                  <span class="feature-tag-chip">✓ {feature}</span>
                {/each}
              </div>

              <div class="best-for-note mb-4">
                <strong>Sangat Cocok:</strong> {template.bestFor}
              </div>

              <!-- Action Buttons -->
              <div class="template-card-footer">
                <div class="footer-btn-grid">
                  {#if isActive}
                    <button class="btn btn-secondary btn-active-indicator" disabled>
                      <span class="check-icon">✓</span> Sedang Aktif
                    </button>
                  {:else}
                    <button
                      class="btn btn-primary btn-set-active"
                      onclick={() => setActiveTheme(template.id)}
                    >
                      ⭐ Jadikan Aktif
                    </button>
                  {/if}

                  <button
                    class="btn btn-secondary btn-edit-action"
                    onclick={() => openCustomizer(template.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    Kustomisasi
                  </button>

                  <button
                    class="btn btn-ghost btn-preview-action"
                    onclick={() => openPreviewModal(template.id)}
                    title="Pratinjau Layar Penuh"
                  >
                    👁️ Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- ============================================================== -->
  <!-- VIEW 2: STUDIO KUSTOMISASI DETAIL ISI UNDANGAN                 -->
  <!-- ============================================================== -->
  {#if currentView === 'customizer'}
    <div class="container studio-body-container mt-6 animate-fade-in">
      <!-- Customizer Breadcrumb & Theme Bar -->
      <div class="customizer-header-card card mb-4">
        <div class="customizer-header-left">
          <button
            class="btn btn-ghost btn-sm flex items-center gap-1"
            onclick={() => currentView = 'templates'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Kembali ke Pilihan Template
          </button>
          <div class="customizer-editing-info">
            <span class="text-xs text-muted">Sedang mengedit tema:</span>
            <strong class="text-sm font-bold text-accent">{currentActiveTemplate.title}</strong>
          </div>
        </div>

        <!-- Quick theme switcher inside customizer -->
        <div class="customizer-theme-pills">
          {#each templates as t}
            <button
              class="theme-pill-btn {t.id === $wedding.invitation.theme ? 'active' : ''}"
              onclick={() => setActiveTheme(t.id)}
              title="Ganti ke tema {t.title}"
            >
              <span>{t.vibes.split(' ')[0]}</span>
              <span>{t.title}</span>
              {#if t.id === $wedding.invitation.theme}
                <span class="active-dot">●</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="studio-grid">
        <!-- ============================================== -->
        <!-- LEFT PANEL: SETTINGS & CUSTOMIZER FORM         -->
        <!-- ============================================== -->
        <div class="studio-left-column">
          <div class="studio-editor-panel card">
            <!-- Editor Tabs Navigation -->
            <div class="editor-tabs-nav">
              <button
                class="editor-tab-btn {activeTab === 'couple' ? 'active' : ''}"
                onclick={() => activeTab = 'couple'}
              >
                <span>💍</span>
                <span>Mempelai &amp; Cover</span>
              </button>

              <button
                class="editor-tab-btn {activeTab === 'events' ? 'active' : ''}"
                onclick={() => activeTab = 'events'}
              >
                <span>📅</span>
                <span>Rangkaian Acara</span>
              </button>

              <button
                class="editor-tab-btn {activeTab === 'story' ? 'active' : ''}"
                onclick={() => activeTab = 'story'}
              >
                <span>✨</span>
                <span>Kutipan &amp; Cerita</span>
              </button>

              <button
                class="editor-tab-btn {activeTab === 'gift' ? 'active' : ''}"
                onclick={() => activeTab = 'gift'}
              >
                <span>🎁</span>
                <span>Kado &amp; Galeri</span>
              </button>
            </div>

            <div class="editor-tab-content">
              <!-- TAB 1: MEMPELAI & COVER -->
              {#if activeTab === 'couple'}
                <div class="tab-pane animate-fade-in">
                  <h3 class="pane-title mb-4">Informasi Mempelai &amp; Cover</h3>

                  <!-- Cover Info -->
                  <div class="form-section-box mb-6">
                    <h4 class="form-subheading mb-3">Cover Pembuka</h4>
                    <div class="form-group mb-3">
                      <label for="cover-title-input" class="form-label">Judul Cover</label>
                      <input
                        id="cover-title-input"
                        type="text"
                        class="form-input"
                        bind:value={$wedding.invitation.cover.title}
                        placeholder="Contoh: THE WEDDING OF"
                      />
                    </div>
                    <div class="form-group mb-3">
                      <label for="cover-music-input" class="form-label">Musik Latar (Audio URL)</label>
                      <input
                        id="cover-music-input"
                        type="text"
                        class="form-input"
                        bind:value={$wedding.invitation.cover.bgMusicUrl}
                        placeholder="URL file audio mp3"
                      />
                      <span class="text-xs text-subtle mt-1 block">Default: Instrumen piano romantis bebas royalti.</span>
                    </div>
                  </div>

                  <!-- Groom Details -->
                  <div class="form-section-box mb-6">
                    <h4 class="form-subheading mb-3">Pengantin Pria</h4>
                    <div class="grid grid-2 gap-3 mb-3">
                      <div class="form-group">
                        <label for="groom-nick-input" class="form-label">Nama Panggilan</label>
                        <input
                          id="groom-nick-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.couple.groomNickname}
                          placeholder="Rama"
                        />
                      </div>
                      <div class="form-group">
                        <label for="groom-ig-input" class="form-label">Akun Instagram</label>
                        <input
                          id="groom-ig-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.couple.groomInstagram}
                          placeholder="username"
                        />
                      </div>
                    </div>

                    <div class="form-group mb-3">
                      <label for="groom-full-input" class="form-label">Nama Lengkap &amp; Gelar</label>
                      <input
                        id="groom-full-input"
                        type="text"
                        class="form-input"
                        bind:value={$wedding.invitation.couple.groomFullName}
                        placeholder="Rama Pratama, S.T."
                      />
                    </div>

                    <div class="form-group mb-3">
                      <label for="groom-parents-input" class="form-label">Nama Orang Tua</label>
                      <input
                        id="groom-parents-input"
                        type="text"
                        class="form-input"
                        bind:value={$wedding.invitation.couple.groomParents}
                        placeholder="Putra pertama dari Bpk. Hartono &amp; Ibu Sri"
                      />
                    </div>

                    <div class="form-group">
                      <label for="groom-photo-input" class="form-label">Foto Pria (URL)</label>
                      <input
                        id="groom-photo-input"
                        type="text"
                        class="form-input"
                        bind:value={$wedding.invitation.couple.groomPhoto}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <!-- Bride Details -->
                  <div class="form-section-box">
                    <h4 class="form-subheading mb-3">Pengantin Wanita</h4>
                    <div class="grid grid-2 gap-3 mb-3">
                      <div class="form-group">
                        <label for="bride-nick-input" class="form-label">Nama Panggilan</label>
                        <input
                          id="bride-nick-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.couple.brideNickname}
                          placeholder="Sinta"
                        />
                      </div>
                      <div class="form-group">
                        <label for="bride-ig-input" class="form-label">Akun Instagram</label>
                        <input
                          id="bride-ig-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.couple.brideInstagram}
                          placeholder="username"
                        />
                      </div>
                    </div>

                    <div class="form-group mb-3">
                      <label for="bride-full-input" class="form-label">Nama Lengkap &amp; Gelar</label>
                      <input
                        id="bride-full-input"
                        type="text"
                        class="form-input"
                        bind:value={$wedding.invitation.couple.brideFullName}
                        placeholder="Sinta Larasati, S.E."
                      />
                    </div>

                    <div class="form-group mb-3">
                      <label for="bride-parents-input" class="form-label">Nama Orang Tua</label>
                      <input
                        id="bride-parents-input"
                        type="text"
                        class="form-input"
                        bind:value={$wedding.invitation.couple.brideParents}
                        placeholder="Putri bungsu dari Bpk. Bambang &amp; Ibu Ratna"
                      />
                    </div>

                    <div class="form-group">
                      <label for="bride-photo-input" class="form-label">Foto Wanita (URL)</label>
                      <input
                        id="bride-photo-input"
                        type="text"
                        class="form-input"
                        bind:value={$wedding.invitation.couple.bridePhoto}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              {/if}

              <!-- TAB 2: RANGKAIAN ACARA -->
              {#if activeTab === 'events'}
                <div class="tab-pane animate-fade-in">
                  <h3 class="pane-title mb-4">Jadwal &amp; Lokasi Acara</h3>

                  <!-- Akad Nikah -->
                  <div class="form-section-box mb-6">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="form-subheading">Akad Nikah / Pemberkatan</h4>
                      <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          bind:checked={$wedding.invitation.events.akad.enabled}
                        />
                        <span>Aktif</span>
                      </label>
                    </div>

                    {#if $wedding.invitation.events.akad.enabled}
                      <div class="form-group mb-3">
                        <label for="akad-title-input" class="form-label">Judul Acara</label>
                        <input
                          id="akad-title-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.events.akad.title}
                        />
                      </div>

                      <div class="grid grid-3 gap-3 mb-3">
                        <div class="form-group">
                          <label for="akad-date-input" class="form-label">Tanggal</label>
                          <input
                            id="akad-date-input"
                            type="date"
                            class="form-input"
                            bind:value={$wedding.invitation.events.akad.date}
                          />
                        </div>
                        <div class="form-group">
                          <label for="akad-start-input" class="form-label">Jam Mulai</label>
                          <input
                            id="akad-start-input"
                            type="text"
                            class="form-input"
                            bind:value={$wedding.invitation.events.akad.startTime}
                            placeholder="08:00"
                          />
                        </div>
                        <div class="form-group">
                          <label for="akad-end-input" class="form-label">Jam Selesai</label>
                          <input
                            id="akad-end-input"
                            type="text"
                            class="form-input"
                            bind:value={$wedding.invitation.events.akad.endTime}
                            placeholder="10:00 WIB"
                          />
                        </div>
                      </div>

                      <div class="form-group mb-3">
                        <label for="akad-venue-input" class="form-label">Nama Tempat / Gedung</label>
                        <input
                          id="akad-venue-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.events.akad.venueName}
                          placeholder="Masjid Agung / Kediaman"
                        />
                      </div>

                      <div class="form-group mb-3">
                        <label for="akad-address-input" class="form-label">Alamat Lengkap</label>
                        <textarea
                          id="akad-address-input"
                          class="form-input"
                          rows="2"
                          bind:value={$wedding.invitation.events.akad.venueAddress}
                          placeholder="Jl. ..."
                        ></textarea>
                      </div>

                      <div class="form-group">
                        <label for="akad-maps-input" class="form-label">Link Google Maps</label>
                        <input
                          id="akad-maps-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.events.akad.mapsUrl}
                          placeholder="https://maps.google.com/..."
                        />
                      </div>
                    {/if}
                  </div>

                  <!-- Resepsi Pernikahan -->
                  <div class="form-section-box">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="form-subheading">Resepsi Pernikahan</h4>
                      <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          bind:checked={$wedding.invitation.events.resepsi.enabled}
                        />
                        <span>Aktif</span>
                      </label>
                    </div>

                    {#if $wedding.invitation.events.resepsi.enabled}
                      <div class="form-group mb-3">
                        <label for="resepsi-title-input" class="form-label">Judul Acara</label>
                        <input
                          id="resepsi-title-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.events.resepsi.title}
                        />
                      </div>

                      <div class="grid grid-3 gap-3 mb-3">
                        <div class="form-group">
                          <label for="resepsi-date-input" class="form-label">Tanggal</label>
                          <input
                            id="resepsi-date-input"
                            type="date"
                            class="form-input"
                            bind:value={$wedding.invitation.events.resepsi.date}
                          />
                        </div>
                        <div class="form-group">
                          <label for="resepsi-start-input" class="form-label">Jam Mulai</label>
                          <input
                            id="resepsi-start-input"
                            type="text"
                            class="form-input"
                            bind:value={$wedding.invitation.events.resepsi.startTime}
                            placeholder="11:00"
                          />
                        </div>
                        <div class="form-group">
                          <label for="resepsi-end-input" class="form-label">Jam Selesai</label>
                          <input
                            id="resepsi-end-input"
                            type="text"
                            class="form-input"
                            bind:value={$wedding.invitation.events.resepsi.endTime}
                            placeholder="14:00 WIB"
                          />
                        </div>
                      </div>

                      <div class="form-group mb-3">
                        <label for="resepsi-venue-input" class="form-label">Nama Tempat / Gedung</label>
                        <input
                          id="resepsi-venue-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.events.resepsi.venueName}
                          placeholder="Grand Ballroom"
                        />
                      </div>

                      <div class="form-group mb-3">
                        <label for="resepsi-address-input" class="form-label">Alamat Lengkap</label>
                        <textarea
                          id="resepsi-address-input"
                          class="form-input"
                          rows="2"
                          bind:value={$wedding.invitation.events.resepsi.venueAddress}
                          placeholder="Jl. ..."
                        ></textarea>
                      </div>

                      <div class="form-group">
                        <label for="resepsi-maps-input" class="form-label">Link Google Maps</label>
                        <input
                          id="resepsi-maps-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.events.resepsi.mapsUrl}
                          placeholder="https://maps.google.com/..."
                        />
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}

              <!-- TAB 3: KUTIPAN & CERITA -->
              {#if activeTab === 'story'}
                <div class="tab-pane animate-fade-in">
                  <h3 class="pane-title mb-4">Kutipan &amp; Cerita Cinta</h3>

                  <!-- Quote Box -->
                  <div class="form-section-box mb-6">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="form-subheading">Kutipan Suci / Romantis</h4>
                      <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          bind:checked={$wedding.invitation.quote.enabled}
                        />
                        <span>Aktif</span>
                      </label>
                    </div>

                    {#if $wedding.invitation.quote.enabled}
                      <div class="form-group mb-3">
                        <label for="quote-text-input" class="form-label">Isi Kutipan</label>
                        <textarea
                          id="quote-text-input"
                          class="form-input"
                          rows="3"
                          bind:value={$wedding.invitation.quote.text}
                          placeholder="Tuliskan ayat atau kutipan cinta..."
                        ></textarea>
                      </div>

                      <div class="form-group">
                        <label for="quote-source-input" class="form-label">Sumber Kutipan</label>
                        <input
                          id="quote-source-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.quote.source}
                          placeholder="Contoh: QS. Ar-Rum: 21"
                        />
                      </div>
                    {/if}
                  </div>

                  <!-- Love Story -->
                  <div class="form-section-box">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="form-subheading">Cerita Cinta (Timeline)</h4>
                      <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          bind:checked={$wedding.invitation.loveStory.enabled}
                        />
                        <span>Aktif</span>
                      </label>
                    </div>

                    {#if $wedding.invitation.loveStory.enabled}
                      <div class="story-items-editor flex flex-col gap-3 mb-3">
                        {#each $wedding.invitation.loveStory.stories as item, idx}
                          <div class="story-edit-card">
                            <div class="flex items-center justify-between mb-2">
                              <input
                                type="text"
                                class="form-input story-year-input"
                                bind:value={item.year}
                                placeholder="Tahun"
                              />
                              <button
                                class="btn-delete-text text-danger text-xs font-semibold"
                                onclick={() => removeStoryItem(idx)}
                              >
                                Hapus
                              </button>
                            </div>
                            <input
                              type="text"
                              class="form-input mb-2 font-semibold"
                              bind:value={item.title}
                              placeholder="Judul momen"
                            />
                            <textarea
                              class="form-input"
                              rows="2"
                              bind:value={item.story}
                              placeholder="Cerita singkat..."
                            ></textarea>
                          </div>
                        {/each}
                      </div>

                      <button class="btn btn-secondary btn-sm" onclick={addStoryItem}>
                        + Tambah Momen Cerita
                      </button>
                    {/if}
                  </div>
                </div>
              {/if}

              <!-- TAB 4: KADO & GALERI -->
              {#if activeTab === 'gift'}
                <div class="tab-pane animate-fade-in">
                  <h3 class="pane-title mb-4">Kado Digital &amp; Galeri</h3>

                  <!-- Bank Accounts -->
                  <div class="form-section-box mb-6">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="form-subheading">Amplop Digital (Rekening Bank)</h4>
                      <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          bind:checked={$wedding.invitation.gift.enabled}
                        />
                        <span>Aktif</span>
                      </label>
                    </div>

                    {#if $wedding.invitation.gift.enabled}
                      <div class="bank-accounts-editor flex flex-col gap-3 mb-3">
                        {#each $wedding.invitation.gift.bankAccounts as acc, idx}
                          <div class="bank-edit-row">
                            <div class="grid grid-3 gap-2">
                              <input
                                type="text"
                                class="form-input"
                                bind:value={acc.bank}
                                placeholder="BCA / Mandiri"
                              />
                              <input
                                type="text"
                                class="form-input"
                                bind:value={acc.accountNumber}
                                placeholder="No. Rekening"
                              />
                              <input
                                type="text"
                                class="form-input"
                                bind:value={acc.accountHolder}
                                placeholder="Nama Pemilik"
                              />
                            </div>
                            <button
                              class="btn btn-icon btn-ghost text-danger"
                              onclick={() => removeBankAccount(idx)}
                              title="Hapus"
                            >
                              ✕
                            </button>
                          </div>
                        {/each}
                      </div>

                      <button class="btn btn-secondary btn-sm mb-4" onclick={addBankAccount}>
                        + Tambah Rekening
                      </button>

                      <hr class="my-4 border-light" />

                      <!-- Shipping address -->
                      <h4 class="form-subheading mb-3">Alamat Kirim Kado Fisik</h4>
                      <div class="form-group mb-2">
                        <label for="shipping-recipient-input" class="form-label">Nama Penerima</label>
                        <input
                          id="shipping-recipient-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.gift.shippingAddress.recipient}
                          placeholder="Rama &amp; Sinta"
                        />
                      </div>
                      <div class="form-group mb-2">
                        <label for="shipping-address-input" class="form-label">Alamat Lengkap</label>
                        <textarea
                          id="shipping-address-input"
                          class="form-input"
                          rows="2"
                          bind:value={$wedding.invitation.gift.shippingAddress.address}
                          placeholder="Alamat lengkap penerima..."
                        ></textarea>
                      </div>
                      <div class="form-group">
                        <label for="shipping-phone-input" class="form-label">No. Telepon / WhatsApp</label>
                        <input
                          id="shipping-phone-input"
                          type="text"
                          class="form-input"
                          bind:value={$wedding.invitation.gift.shippingAddress.phone}
                          placeholder="08..."
                        />
                      </div>
                    {/if}
                  </div>

                  <!-- Gallery Section -->
                  <div class="form-section-box">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="form-subheading">Galeri Foto Prewedding</h4>
                      <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          bind:checked={$wedding.invitation.gallery.enabled}
                        />
                        <span>Aktif</span>
                      </label>
                    </div>

                    {#if $wedding.invitation.gallery.enabled}
                      <div class="gallery-urls-list flex flex-col gap-2 mb-3">
                        {#each $wedding.invitation.gallery.photos as photo, i}
                          <div class="flex items-center gap-2">
                            <input
                              type="text"
                              class="form-input text-xs"
                              bind:value={$wedding.invitation.gallery.photos[i]}
                              placeholder="URL Foto..."
                            />
                            <button
                              class="btn btn-icon btn-ghost text-danger btn-sm"
                              onclick={() => {
                                $wedding.invitation.gallery.photos.splice(i, 1);
                                updateInvitation({ gallery: $wedding.invitation.gallery });
                              }}
                            >✕</button>
                          </div>
                        {/each}
                      </div>

                      <button
                        class="btn btn-secondary btn-sm"
                        onclick={() => {
                          $wedding.invitation.gallery.photos.push('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80');
                          updateInvitation({ gallery: $wedding.invitation.gallery });
                        }}
                      >
                        + Tambah Foto
                      </button>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- RIGHT PANEL: SMARTPHONE LIVE PREVIEW           -->
        <!-- ============================================== -->
        <div class="studio-preview-panel">
          <div class="preview-panel-header">
            <div class="preview-info">
              <span class="preview-badge">
                <span class="preview-dot"></span>
                Live Smartphone Preview
              </span>
              <span class="text-xs text-subtle">Interaktif (dapat diklik &amp; di-scroll)</span>
            </div>

            <!-- Preview Guest Selector -->
            <div class="preview-guest-select-wrap">
              <label for="preview-guest-select" class="text-xs text-muted mr-1">Nama Tamu:</label>
              <select
                id="preview-guest-select"
                class="form-input form-select-sm"
                bind:value={selectedPreviewGuest}
              >
                <option value="Dimas &amp; Partner">Dimas &amp; Partner</option>
                <option value="Keluarga Bpk. Santoso">Keluarga Bpk. Santoso</option>
                {#each $wedding.guests as g}
                  <option value={g.name}>{g.name}</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- Phone Mockup Container -->
          <div class="phone-mockup-wrapper">
            <div class="phone-frame">
              <!-- Dynamic Island / Speaker Notch -->
              <div class="phone-notch">
                <div class="phone-camera"></div>
                <div class="phone-speaker"></div>
              </div>

              <!-- Scrollable Phone Screen -->
              <div class="phone-screen">
                {#if invitation.theme === 'classic_gold'}
                  <ClassicGold
                    invitation={invitation}
                    guestName={selectedPreviewGuest}
                    isPreview={true}
                    onRsvpSubmit={handlePreviewRsvp}
                  />
                {:else if invitation.theme === 'emerald_botanical'}
                  <EmeraldBotanical
                    invitation={invitation}
                    guestName={selectedPreviewGuest}
                    isPreview={true}
                    onRsvpSubmit={handlePreviewRsvp}
                  />
                {:else}
                  <RomanticFloral
                    invitation={invitation}
                    guestName={selectedPreviewGuest}
                    isPreview={true}
                    onRsvpSubmit={handlePreviewRsvp}
                  />
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- ============================================================== -->
<!-- MODAL: INTERACTIVE FULL PREVIEW DI SMARTPHONE                  -->
<!-- ============================================================== -->
{#if previewModalTheme}
  {@const modalTemplate = templates.find(t => t.id === previewModalTheme)}
  <div
    class="modal-overlay-backdrop animate-fade-in"
    onclick={(e) => { if (e.target === e.currentTarget) closePreviewModal(); }}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onkeydown={(e) => e.key === 'Escape' && closePreviewModal()}
  >
    <div
      class="modal-preview-card"
      role="document"
    >
      <!-- Modal Header -->
      <div class="modal-preview-header">
        <div class="modal-title-left">
          <div class="flex items-center gap-2">
            <span class="text-xl">{modalTemplate?.vibes.split(' ')[0]}</span>
            <h3 class="modal-title-text">{modalTemplate?.title}</h3>
            {#if previewModalTheme === $wedding.invitation.theme}
              <span class="badge badge-success text-xs">✓ Sedang Aktif</span>
            {/if}
          </div>
          <p class="modal-subtitle-text">{modalTemplate?.subtitle} • Pratinjau Interaktif Layar Penuh</p>
        </div>

        <div class="modal-actions-right">
          <div class="modal-guest-picker">
            <label for="modal-guest-dropdown" class="text-xs text-muted">Simulasi Tamu:</label>
            <select
              id="modal-guest-dropdown"
              class="form-input form-select-sm"
              bind:value={selectedPreviewGuest}
            >
              <option value="Dimas &amp; Partner">Dimas &amp; Partner</option>
              <option value="Keluarga Bpk. Santoso">Keluarga Bpk. Santoso</option>
              {#each $wedding.guests as g}
                <option value={g.name}>{g.name}</option>
              {/each}
            </select>
          </div>

          {#if previewModalTheme !== $wedding.invitation.theme}
            <button
              class="btn btn-primary btn-sm"
              onclick={() => {
                if (previewModalTheme) setActiveTheme(previewModalTheme);
              }}
            >
              ⭐ Jadikan Aktif
            </button>
          {/if}

          <button
            class="btn btn-secondary btn-sm"
            onclick={() => {
              const th = previewModalTheme;
              closePreviewModal();
              if (th) openCustomizer(th);
            }}
          >
            ✏️ Kustomisasi
          </button>

          <button
            class="btn btn-icon btn-ghost"
            onclick={closePreviewModal}
            aria-label="Tutup jendela pratinjau"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Phone Mockup Container inside Modal -->
      <div class="modal-preview-body">
        <div class="phone-mockup-wrapper modal-phone-wrapper">
          <div class="phone-frame">
            <div class="phone-notch">
              <div class="phone-camera"></div>
              <div class="phone-speaker"></div>
            </div>
            <div class="phone-screen">
              {#if previewModalTheme === 'classic_gold'}
                <ClassicGold
                  invitation={invitation}
                  guestName={selectedPreviewGuest}
                  isPreview={true}
                  onRsvpSubmit={handlePreviewRsvp}
                />
              {:else if previewModalTheme === 'emerald_botanical'}
                <EmeraldBotanical
                  invitation={invitation}
                  guestName={selectedPreviewGuest}
                  isPreview={true}
                  onRsvpSubmit={handlePreviewRsvp}
                />
              {:else}
                <RomanticFloral
                  invitation={invitation}
                  guestName={selectedPreviewGuest}
                  isPreview={true}
                  onRsvpSubmit={handlePreviewRsvp}
                />
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .studio-page {
    padding-bottom: var(--space-16);
  }

  /* --- Flow Navigation Control --- */
  .flow-nav-container {
    padding: var(--space-3) var(--space-4);
    background: white;
    box-shadow: var(--shadow-sm);
  }
  .flow-nav-tabs {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }
  .flow-nav-btn {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    cursor: pointer;
    text-align: left;
    transition: all var(--transition-base);
  }
  .flow-nav-btn:hover {
    border-color: var(--color-primary-light);
    background: white;
    transform: translateY(-1px);
  }
  .flow-nav-btn.active {
    border-color: var(--color-accent);
    background: white;
    box-shadow: 0 4px 14px rgba(139, 94, 82, 0.12);
  }
  .flow-step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-secondary);
    color: var(--color-accent);
    font-size: 0.85rem;
    font-weight: 700;
  }
  .flow-nav-btn.active .flow-step-number {
    background: var(--color-accent);
    color: white;
  }
  .flow-btn-icon {
    font-size: 1.5rem;
  }
  .flow-btn-text {
    display: flex;
    flex-direction: column;
  }
  .flow-btn-text strong {
    font-size: 0.95rem;
    color: var(--color-text);
  }
  .flow-btn-desc {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
  .flow-nav-info-banner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-alt);
    border-radius: var(--radius-md);
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  .info-icon {
    font-size: 1rem;
  }

  /* --- Active Summary Card --- */
  .active-summary-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    background: linear-gradient(135deg, #FFFDFD 0%, #FFF5F2 100%);
    border: 2px solid var(--color-primary-light);
    box-shadow: 0 6px 20px rgba(201, 132, 122, 0.12);
  }
  .active-summary-content {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  .active-indicator-pulse {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #6BAB8A;
    box-shadow: 0 0 0 0 rgba(107, 171, 138, 0.7);
    animation: pulseGlow 2s infinite;
  }
  @keyframes pulseGlow {
    0% { box-shadow: 0 0 0 0 rgba(107, 171, 138, 0.7); }
    70% { box-shadow: 0 0 0 8px rgba(107, 171, 138, 0); }
    100% { box-shadow: 0 0 0 0 rgba(107, 171, 138, 0); }
  }
  .active-summary-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-accent);
    display: flex;
    align-items: center;
  }
  .active-summary-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  /* --- Template Catalog Grid --- */
  .template-catalog-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-6);
  }
  .template-catalog-card {
    position: relative;
    padding: 0;
    overflow: hidden;
    background: white;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-xl);
    transition: all var(--transition-base);
    display: flex;
    flex-direction: column;
  }
  .template-catalog-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-xl);
    border-color: var(--color-primary-light);
  }
  .template-catalog-card.is-active-card {
    border-color: var(--color-primary);
    box-shadow: 0 10px 30px rgba(201, 132, 122, 0.22);
    background: #FFFAF9;
  }

  /* Card Ribbon */
  .card-ribbon-active {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 10;
    background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 0.35rem 0.75rem;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    gap: 0.35rem;
    box-shadow: 0 4px 12px rgba(107, 68, 56, 0.3);
  }
  .ribbon-star {
    color: #F8D678;
    font-size: 0.85rem;
  }
  .card-ribbon-inactive {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 10;
    background: rgba(44, 24, 16, 0.7);
    backdrop-filter: blur(6px);
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: var(--radius-full);
  }

  /* --- Invitation Preview Window (Mockup in Card) --- */
  .invitation-preview-window {
    height: 250px;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }
  .theme-style-romantic_terracotta {
    background: linear-gradient(135deg, #FFF8F6 0%, #FDF0EC 50%, #F5D8D4 100%);
  }
  .theme-style-classic_gold {
    background: linear-gradient(135deg, #1C1B1F 0%, #151417 60%, #2A241C 100%);
  }
  .theme-style-emerald_botanical {
    background: linear-gradient(135deg, #F7F9F6 0%, #EBF2EC 50%, #DCE8DE 100%);
  }

  /* Mini Mockup Frame Inside Window */
  .mini-mockup-frame {
    width: 240px;
    padding: 1.25rem 1rem;
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
    transition: transform var(--transition-base);
  }
  .invitation-preview-window:hover .mini-mockup-frame {
    transform: scale(1.03);
  }

  /* Specific theme styling for mini mockup */
  .theme-style-romantic_terracotta .mini-mockup-frame {
    background: white;
    border: 1px solid #EDD5CE;
    color: #2C1810;
  }
  .theme-style-romantic_terracotta .mini-mockup-names {
    color: #8B5E52;
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 700;
  }
  .mini-motif-romantic {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
    font-size: 1.1rem;
  }

  .theme-style-classic_gold .mini-mockup-frame {
    background: #18171B;
    border: 1px solid #C5A059;
    color: #F5E6E0;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(197, 160, 89, 0.15);
  }
  .theme-style-classic_gold .mini-mockup-names {
    color: #E6CA85;
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 700;
    text-shadow: 0 1px 4px rgba(230, 202, 133, 0.3);
  }
  .mini-motif-gold {
    margin-bottom: 0.25rem;
    font-size: 1.2rem;
  }

  .theme-style-emerald_botanical .mini-mockup-frame {
    background: white;
    border: 1px solid #A8C4B0;
    color: #1E3326;
  }
  .theme-style-emerald_botanical .mini-mockup-names {
    color: #2D5039;
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 700;
  }
  .mini-motif-emerald {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
    font-size: 1.1rem;
  }

  .mini-badge-sub {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    opacity: 0.75;
    text-transform: uppercase;
    font-weight: 700;
  }
  .mini-amp {
    font-family: Georgia, serif;
    font-style: italic;
    opacity: 0.65;
  }
  .mini-mockup-divider {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    width: 80%;
    margin: 0.35rem 0;
  }
  .divider-line {
    flex: 1;
    height: 1px;
    background: currentColor;
    opacity: 0.2;
  }
  .divider-gem {
    font-size: 0.75rem;
  }
  .mini-mockup-date {
    font-size: 0.68rem;
    font-weight: 600;
    opacity: 0.85;
  }
  .mini-mockup-venue {
    font-size: 0.62rem;
    opacity: 0.65;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 190px;
    margin-top: 0.15rem;
  }
  .mini-open-pill {
    margin-top: 0.6rem;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.2rem 0.65rem;
    border-radius: var(--radius-full);
    border: 1px solid currentColor;
    opacity: 0.85;
  }

  /* Hover Overlay on Preview */
  .preview-hover-cta {
    position: absolute;
    inset: 0;
    background: rgba(44, 24, 16, 0.45);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity var(--transition-base);
  }
  .invitation-preview-window:hover .preview-hover-cta {
    opacity: 1;
  }
  .hover-cta-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    color: var(--color-accent);
    padding: 0.6rem 1.1rem;
    border-radius: var(--radius-full);
    font-size: 0.82rem;
    font-weight: 700;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    transform: translateY(6px);
    transition: transform var(--transition-base);
  }
  .invitation-preview-window:hover .hover-cta-badge {
    transform: translateY(0);
  }

  /* Card Body Content */
  .template-card-body {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .theme-vibes-chip {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-accent);
  }
  .template-heading-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
  }
  .template-heading-subtitle {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-bottom: var(--space-2);
  }
  .template-description-text {
    font-size: 0.82rem;
    color: var(--color-text-muted);
    line-height: 1.5;
    margin-bottom: var(--space-3);
  }

  /* Color Palette Section */
  .color-palette-section {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .palette-swatch-list {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .palette-swatch-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  /* Features List */
  .template-features-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .feature-tag-chip {
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--color-text-muted);
    background: var(--color-surface);
    border: 1px solid var(--color-border-light);
    padding: 0.15rem 0.45rem;
    border-radius: var(--radius-sm);
  }
  .best-for-note {
    font-size: 0.75rem;
    color: var(--color-text-subtle);
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-alt);
    border-radius: var(--radius-md);
  }
  .best-for-note strong {
    color: var(--color-accent);
  }

  /* Footer Action Buttons */
  .template-card-footer {
    margin-top: auto;
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border-light);
  }
  .footer-btn-grid {
    display: grid;
    grid-template-columns: 1.3fr 1.1fr 0.8fr;
    gap: var(--space-2);
    align-items: center;
  }
  .btn-active-indicator {
    background: var(--color-surface-alt);
    color: var(--color-accent);
    border-color: var(--color-border);
    font-size: 0.75rem;
    cursor: default;
    padding: 0.45rem 0.5rem;
  }
  .check-icon {
    color: var(--color-success);
    font-weight: 800;
  }
  .btn-set-active {
    font-size: 0.75rem;
    padding: 0.45rem 0.5rem;
  }
  .btn-edit-action {
    font-size: 0.75rem;
    padding: 0.45rem 0.5rem;
  }
  .btn-preview-action {
    font-size: 0.75rem;
    padding: 0.45rem 0.5rem;
  }

  /* --- Customizer View Specifics --- */
  .customizer-header-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-5);
    background: white;
  }
  .customizer-header-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  .customizer-editing-info {
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--color-border);
    padding-left: var(--space-3);
  }
  .customizer-theme-pills {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .theme-pill-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .theme-pill-btn:hover {
    border-color: var(--color-primary-light);
    color: var(--color-accent);
  }
  .theme-pill-btn.active {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
    box-shadow: 0 2px 8px rgba(139, 94, 82, 0.25);
  }
  .active-dot {
    font-size: 0.6rem;
    color: #6BAB8A;
  }

  /* --- Studio Editor Panel & Tabs --- */
  .studio-body-container {
    max-width: 1400px;
  }
  .studio-grid {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: var(--space-6);
    align-items: start;
  }
  .studio-left-column {
    display: flex;
    flex-direction: column;
  }
  .studio-editor-panel {
    padding: 0;
    overflow: hidden;
    background: white;
  }
  .editor-tabs-nav {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
  }
  .editor-tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 1rem 0.75rem;
    border: none;
    background: transparent;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  .editor-tab-btn:hover {
    color: var(--color-text);
  }
  .editor-tab-btn.active {
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
    background: white;
  }
  .editor-tab-content {
    padding: var(--space-6);
  }
  .pane-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-accent);
  }
  .form-section-box {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }
  .form-subheading {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }
  .story-edit-card {
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }
  .story-year-input {
    width: 90px;
    font-weight: 700;
  }
  .btn-delete-text {
    background: none;
    border: none;
    cursor: pointer;
  }
  .bank-edit-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* --- Right Phone Preview Panel --- */
  .studio-preview-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: sticky;
    top: 90px;
  }
  .preview-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
    margin-bottom: var(--space-3);
  }
  .preview-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .preview-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--color-accent);
  }
  .preview-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #6BAB8A;
    box-shadow: 0 0 6px rgba(107, 171, 138, 0.6);
  }
  .preview-guest-select-wrap {
    display: flex;
    align-items: center;
  }
  .form-select-sm {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
    border-radius: var(--radius-md);
  }

  /* Phone Frame Simulation */
  .phone-mockup-wrapper {
    width: 380px;
    height: 740px;
    background: #1A1412;
    border-radius: 46px;
    padding: 12px;
    box-shadow: 0 20px 60px rgba(44, 24, 16, 0.25), 0 0 0 2px #3C2C28;
    position: relative;
  }
  .phone-frame {
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 36px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .phone-notch {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 110px;
    height: 24px;
    background: #1A1412;
    border-radius: 12px;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
  }
  .phone-camera {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #2D3748;
  }
  .phone-speaker {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: #2D3748;
  }
  .phone-screen {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }

  /* --- Modal Preview Styles --- */
  .modal-overlay-backdrop {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgba(26, 20, 18, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
  }
  .modal-preview-card {
    background: white;
    border-radius: var(--radius-2xl);
    width: 100%;
    max-width: 600px;
    max-height: 94vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
  }
  .modal-preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
  }
  .modal-title-left {
    display: flex;
    flex-direction: column;
  }
  .modal-title-text {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--color-accent);
    margin: 0;
  }
  .modal-subtitle-text {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
  .modal-actions-right {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .modal-guest-picker {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .modal-preview-body {
    padding: var(--space-4);
    display: flex;
    justify-content: center;
    overflow-y: auto;
    background: #FAF7F5;
  }
  .modal-phone-wrapper {
    height: 680px;
    width: 360px;
  }

  /* --- Toast Floating Notification --- */
  .toast-floating {
    position: fixed;
    bottom: var(--space-6);
    right: var(--space-6);
    z-index: 1000;
  }
  .toast-content {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    background: var(--color-accent-dark);
    color: white;
    padding: 0.75rem 1.25rem;
    border-radius: var(--radius-full);
    font-size: 0.85rem;
    font-weight: 600;
    box-shadow: 0 10px 30px rgba(44, 24, 16, 0.3);
  }
  .toast-close-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    cursor: pointer;
  }
  .toast-close-btn:hover {
    color: white;
  }

  /* Responsive Breakpoints */
  @media (max-width: 1200px) {
    .template-catalog-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 1024px) {
    .studio-grid {
      grid-template-columns: 1fr;
    }
    .studio-preview-panel {
      position: static;
      margin-top: var(--space-6);
    }
    .customizer-header-card {
      flex-direction: column;
      align-items: flex-start;
    }
    .customizer-theme-pills {
      flex-wrap: wrap;
    }
  }
  @media (max-width: 768px) {
    .template-catalog-grid {
      grid-template-columns: 1fr;
    }
    .flow-nav-tabs {
      grid-template-columns: 1fr;
    }
    .active-summary-card {
      flex-direction: column;
      align-items: flex-start;
    }
    .active-summary-actions {
      width: 100%;
      justify-content: flex-start;
    }
    .modal-preview-header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-3);
    }
    .modal-actions-right {
      width: 100%;
      flex-wrap: wrap;
    }
  }
  @media (max-width: 480px) {
    .phone-mockup-wrapper {
      width: 100%;
      height: 600px;
      padding: 8px;
      border-radius: 28px;
    }
    .phone-frame {
      border-radius: 20px;
    }
    .footer-btn-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
