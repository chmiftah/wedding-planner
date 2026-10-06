<script lang="ts">
  import type { DigitalInvitation } from '#lib/stores/wedding';
  import { onMount } from 'svelte';
  import { resolveMusicSrc } from '#lib/utils/music';

  interface Props {
    invitation: DigitalInvitation;
    guestName?: string;
    guestToken?: string;
    isPreview?: boolean;
    onRsvpSubmit?: (rsvpData: { attendance: 'hadir' | 'tidak_hadir'; count: number; message: string; name: string }) => void;
  }

  let {
    invitation,
    guestName = 'Tamu Spesial',
    guestToken = '',
    isPreview = false,
    onRsvpSubmit,
  }: Props = $props();

  const resolvedMusicUrl = $derived(resolveMusicSrc(invitation.cover.bgMusicUrl));

  // State
  let isOpen = $state(false);
  let isPlaying = $state(false);
  let audioRef = $state<HTMLAudioElement | null>(null);
  let copiedBankIndex = $state<number | null>(null);
  let copiedAddress = $state(false);
  let activeNav = $state<'cover' | 'couple' | 'events' | 'story' | 'gallery' | 'rsvp' | 'gift'>('cover');

  // RSVP Form State
  let rsvpAttendance = $state<'hadir' | 'tidak_hadir'>('hadir');
  let rsvpGuestCount = $state(2);
  let rsvpSenderName = $state('');
  $effect(() => {
    if (guestName && guestName !== 'Tamu Spesial') {
      rsvpSenderName = guestName;
    }
  });
  let rsvpMessage = $state('');
  let rsvpSubmitted = $state(false);

  // Lightbox Photo Modal State
  let selectedPhoto = $state<string | null>(null);

  // Countdown timer reactive calculation
  let days = $state(0);
  let hours = $state(0);
  let minutes = $state(0);
  let seconds = $state(0);

  function updateCountdown() {
    const targetDateStr = invitation.events.resepsi.date || invitation.events.akad.date;
    if (!targetDateStr) return;
    const target = new Date(targetDateStr + 'T09:00:00').getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, target - now);

    days = Math.floor(diff / (1000 * 60 * 60 * 24));
    hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    seconds = Math.floor((diff % (1000 * 60)) / 1000);
  }

  let timer: any;
  onMount(() => {
    updateCountdown();
    timer = setInterval(updateCountdown, 1000);

    // Otomatis putar musik ketika web diakses jika diizinkan browser
    let cleanupGesture: (() => void) | null = null;
    const startAudio = () => {
      if (audioRef && !isPlaying) {
        audioRef.play().then(() => {
          isPlaying = true;
          if (cleanupGesture) cleanupGesture();
        }).catch(() => {
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

    const autoTimer = setTimeout(startAudio, 300);

    // Scroll spy for bottom floating navigation dock
    const handleScroll = () => {
      const sections = ['cover', 'couple', 'events', 'story', 'gallery', 'rsvp', 'gift'] as const;
      const scrollPos = window.scrollY + 250;

      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = sections[i];
        const el = document.getElementById(`${sec}-section`);
        if (el && el.offsetTop <= scrollPos) {
          activeNav = sec;
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearInterval(timer);
      clearTimeout(autoTimer);
      if (cleanupGesture) cleanupGesture();
      window.removeEventListener('scroll', handleScroll);
    };
  });

  function handleOpenInvitation() {
    isOpen = true;
    if (audioRef && !isPlaying) {
      audioRef.play().then(() => {
        isPlaying = true;
      }).catch(() => {
        isPlaying = false;
      });
    }

    // Scroll to the couple section with smooth animation
    setTimeout(() => {
      const coupleEl = document.getElementById('couple-section');
      if (coupleEl) {
        coupleEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 200);
  }

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(`${sectionId}-section`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

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

  function copyBank(accNumber: string, index: number) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(accNumber);
      copiedBankIndex = index;
      setTimeout(() => {
        if (copiedBankIndex === index) copiedBankIndex = null;
      }, 2500);
    }
  }

  function copyAddress(address: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(address);
      copiedAddress = true;
      setTimeout(() => { copiedAddress = false; }, 2500);
    }
  }

  function handleFormSubmit(e: SubmitEvent) {
    e.preventDefault();
    const sender = rsvpSenderName.trim() || guestName;
    const msg = rsvpMessage.trim();

    if (onRsvpSubmit) {
      onRsvpSubmit({
        attendance: rsvpAttendance,
        count: rsvpAttendance === 'hadir' ? rsvpGuestCount : 0,
        message: msg,
        name: sender,
      });
    }

    rsvpSubmitted = true;
  }

  function formatDateID(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  function getGoogleCalendarUrl(event: { title: string; date: string; startTime: string; endTime: string; venueName: string; venueAddress: string }) {
    if (!event.date) return '#';
    const dateClean = event.date.replace(/-/g, '');
    const startClean = (event.startTime || '09:00').replace(/[^0-9]/g, '').padEnd(4, '0');
    const endClean = (event.endTime || '12:00').replace(/[^0-9]/g, '').padEnd(4, '0');
    const startIso = `${dateClean}T${startClean}00`;
    const endIso = `${dateClean}T${endClean}00`;
    const text = encodeURIComponent(`Pernikahan ${invitation.couple.groomNickname} & ${invitation.couple.brideNickname} (${event.title})`);
    const details = encodeURIComponent(`Menghadiri acara ${event.title} di ${event.venueName}`);
    const location = encodeURIComponent(`${event.venueName}, ${event.venueAddress}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  }

  // Cover couple photo fallback
  const coverCouplePhoto = $derived(
    invitation.cover.coverPhoto ||
    invitation.couple.groomPhoto ||
    invitation.couple.bridePhoto ||
    '/images/themes/romantic-arch-real.jpg'
  );
</script>

<div class="invitation-wrapper {isOpen ? 'is-opened' : 'is-closed'}">
  <!-- Subtle Linen Texture & Soft Bokeh Overlay -->
  <div class="paper-texture-overlay" aria-hidden="true"></div>

  <!-- Ambient Floating Petals -->
  <div class="ambient-petals-wrap" aria-hidden="true">
    <div class="falling-petal p1"></div>
    <div class="falling-petal p2"></div>
    <div class="falling-petal p3"></div>
    <div class="falling-petal p4"></div>
    <div class="falling-petal p5"></div>
    <div class="falling-petal p6"></div>
  </div>

  <!-- Background Audio Player -->
  {#if resolvedMusicUrl}
    <audio
      bind:this={audioRef}
      src={resolvedMusicUrl}
      loop
      preload="auto"
    ></audio>

    <!-- Floating Audio Control Disc Button -->
    <button
      class="floating-audio-btn {isPlaying ? 'playing' : 'paused'}"
      onclick={toggleAudio}
      title={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
      aria-label={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
    >
      <div class="disc-vinyl">
        <div class="disc-grooves"></div>
        <div class="disc-center-label">
          <span>🎵</span>
        </div>
      </div>
      {#if isPlaying}
        <span class="music-wave-bar bar-1"></span>
        <span class="music-wave-bar bar-2"></span>
        <span class="music-wave-bar bar-3"></span>
      {/if}
    </button>
  {/if}

  <!-- ============================================== -->
  <!-- 1. HERO COVER / THE WEDDING OF (MATCH IMAGE 1)  -->
  <!-- ============================================== -->
  <section id="cover-section" class="cover-hero-section {isOpen ? 'cover-opened' : ''}">
    <!-- Botanical Watercolor Garland Accent at Top of Cover -->
    <div class="cover-floral-bg-top" aria-hidden="true"></div>
    <!-- Botanical Arch Frame (Dome Top) -->
    <div class="cover-hero-inner">
      <!-- Top Floral Accent -->
      <div class="top-botanical-crest" aria-hidden="true">
        <svg width="60" height="24" viewBox="0 0 100 40" fill="none" stroke="currentColor">
          <path d="M10 20 C30 10, 40 30, 50 15 C60 30, 70 10, 90 20" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="50" cy="15" r="3" fill="currentColor"/>
          <path d="M35 15 C33 5, 45 8, 48 13" stroke-width="1.2"/>
          <path d="M65 15 C67 5, 55 8, 52 13" stroke-width="1.2"/>
        </svg>
      </div>

      <div class="cover-eyebrow">
        <span>{invitation.cover.title || 'THE WEDDING OF'}</span>
      </div>

      <!-- Arched Prewedding Photo Dome -->
      <div class="cover-arch-container">
        <div class="cover-arch-frame">
          <img
            src={coverCouplePhoto}
            alt="{invitation.couple.groomNickname} & {invitation.couple.brideNickname}"
            class="cover-arch-img"
          />
          <div class="cover-arch-gradient"></div>
        </div>

        <!-- Floral Wreath Wrap at Base of Arch -->
        <div class="cover-floral-wrap" aria-hidden="true">
          <img src="/wedding-bouquet.jpg" alt="" class="floral-garland-img" />
        </div>
      </div>

      <!-- Couple Title in Calligraphy Script -->
      <h1 class="cover-couple-script">
        <span class="couple-name-groom">{invitation.couple.groomNickname}</span>
        <span class="couple-ampersand">&amp;</span>
        <span class="couple-name-bride">{invitation.couple.brideNickname}</span>
      </h1>

      <!-- Date Badge -->
      <p class="cover-date-text">
        {formatDateID(invitation.events.resepsi.date || invitation.events.akad.date)}
      </p>

      <!-- Countdown Pills on Cover (Hari, Jam, Menit, Detik) -->
      <div class="cover-countdown-pills">
        <div class="countdown-pill">
          <span class="pill-val">{days}</span>
          <span class="pill-lbl">Hari</span>
        </div>
        <div class="countdown-pill">
          <span class="pill-val">{hours}</span>
          <span class="pill-lbl">Jam</span>
        </div>
        <div class="countdown-pill">
          <span class="pill-val">{minutes}</span>
          <span class="pill-lbl">Menit</span>
        </div>
        <div class="countdown-pill">
          <span class="pill-val">{seconds}</span>
          <span class="pill-lbl">Detik</span>
        </div>
      </div>

      <!-- Luxury Guest Box "Kepada Yth" -->
      <div class="cover-guest-card">
        <span class="guest-card-label">Kepada Yth. Bapak/Ibu/Saudara/i:</span>
        <h2 class="guest-card-name">{guestName}</h2>
        <span class="guest-card-hint">Mohon maaf bila ada kesalahan penulisan nama / gelar</span>

        <!-- Open Button with Animated Seal -->
        <button class="btn-open-invitation" onclick={handleOpenInvitation}>
          <span class="seal-icon-mini">💌</span>
          <span>Buka Undangan</span>
          <svg class="arrow-down-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </section>

  <!-- ============================================== -->
  <!-- MAIN SCROLLABLE INVITATION CONTENT              -->
  <main id="invitation-main" class="invitation-main-content">
    <!-- SECTION: SALAM & BASMALAH & AYAT (AR-RUM 21) -->
    <section class="invite-section bismillah-section">
      <div class="section-card paper-emboss-card text-center">
        <!-- Calligraphy Basmalah -->
        <div class="arabic-basmalah" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        <h3 class="salam-heading">Assalamu’alaikum Warahmatullahi Wabarakatuh</h3>
        <p class="salam-intro">
          Dengan memohon Rahmat dan Ridho Allah Subhanahu wa Ta'ala, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir dalam pernikahan putra-putri kami:
        </p>

        <!-- Ar-Rum 21 Quote -->
        {#if invitation.quote.enabled && invitation.quote.text}
          <div class="ar-rum-quote-box">
            <div class="quote-decor-mark">❝</div>
            <p class="quote-verse-text">{invitation.quote.text}</p>
            <span class="quote-verse-source">— {invitation.quote.source || 'QS. Ar-Rum: 21'} —</span>
          </div>
        {/if}
      </div>
    </section>

    <!-- SECTION: THE COUPLE / MEMPELAI (MATCH IMAGE 1 & 2) -->
    <section id="couple-section" class="invite-section couple-section">
      <div class="section-title-wrap">
        <span class="title-eyebrow">Dua Hati Satu Janji</span>
        <h2 class="title-calligraphy">Kedua Mempelai</h2>
        <div class="title-ornament-line">
          <span class="ornament-leaf">🌿</span>
        </div>
      </div>

      <div class="couple-profiles-container">
        <!-- Mempelai Wanita / Bride -->
        <div class="profile-card">
          <div class="profile-arch-wrapper">
            <div class="profile-arch-frame">
              {#if invitation.couple.bridePhoto}
                <img src={invitation.couple.bridePhoto} alt={invitation.couple.brideFullName} class="profile-photo" />
              {:else}
                <div class="profile-placeholder">👰</div>
              {/if}
            </div>
            <div class="profile-wreath" aria-hidden="true">
              <img src="/wedding-bouquet.jpg" alt="" class="wreath-img" />
            </div>
          </div>

          <h3 class="profile-script-name">{invitation.couple.brideNickname}</h3>
          <h4 class="profile-full-name">{invitation.couple.brideFullName}</h4>
          <p class="profile-parents">{invitation.couple.brideParents}</p>

          {#if invitation.couple.brideInstagram}
            <a
              href="https://instagram.com/{invitation.couple.brideInstagram.replace('@', '')}"
              target="_blank"
              rel="noopener noreferrer"
              class="instagram-button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span>@{invitation.couple.brideInstagram.replace('@', '')}</span>
            </a>
          {/if}
        </div>

        <!-- Monogram Divider -->
        <div class="couple-monogram-divider">
          <div class="monogram-badge">
            <span class="monogram-amp">&amp;</span>
          </div>
        </div>

        <!-- Mempelai Pria / Groom -->
        <div class="profile-card">
          <div class="profile-arch-wrapper">
            <div class="profile-arch-frame">
              {#if invitation.couple.groomPhoto}
                <img src={invitation.couple.groomPhoto} alt={invitation.couple.groomFullName} class="profile-photo" />
              {:else}
                <div class="profile-placeholder">🤵</div>
              {/if}
            </div>
            <div class="profile-wreath" aria-hidden="true">
              <img src="/wedding-bouquet.jpg" alt="" class="wreath-img" />
            </div>
          </div>

          <h3 class="profile-script-name">{invitation.couple.groomNickname}</h3>
          <h4 class="profile-full-name">{invitation.couple.groomFullName}</h4>
          <p class="profile-parents">{invitation.couple.groomParents}</p>

          {#if invitation.couple.groomInstagram}
            <a
              href="https://instagram.com/{invitation.couple.groomInstagram.replace('@', '')}"
              target="_blank"
              rel="noopener noreferrer"
              class="instagram-button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span>@{invitation.couple.groomInstagram.replace('@', '')}</span>
            </a>
          {/if}
        </div>
      </div>
    </section>

    <!-- SECTION: SAVE THE DATE / RANGKAIAN ACARA (MATCH IMAGE 1, 2, 3) -->
    <section id="events-section" class="invite-section events-section">
      <div class="section-title-wrap">
        <span class="title-eyebrow">SAVE THE DATE</span>
        <h2 class="title-calligraphy">Rangkaian Acara</h2>
        <div class="title-ornament-line">
          <span class="ornament-leaf">❦</span>
        </div>
      </div>

      <!-- Live Countdown Card -->
      <div class="event-countdown-card paper-emboss-card mb-6">
        <span class="countdown-card-label">Menghitung Hari Bahagia</span>
        <div class="countdown-grid">
          <div class="countdown-box">
            <span class="countdown-number">{days}</span>
            <span class="countdown-tag">Hari</span>
          </div>
          <div class="countdown-box">
            <span class="countdown-number">{hours}</span>
            <span class="countdown-tag">Jam</span>
          </div>
          <div class="countdown-box">
            <span class="countdown-number">{minutes}</span>
            <span class="countdown-tag">Menit</span>
          </div>
          <div class="countdown-box">
            <span class="countdown-number">{seconds}</span>
            <span class="countdown-tag">Detik</span>
          </div>
        </div>
      </div>

      <!-- Event Cards: Akad & Resepsi (Dua kartu terpisah bertingkat seperti Image 1) -->
      <div class="event-cards-stack">
        <!-- 1. Akad Nikah Card -->
        {#if invitation.events.akad.enabled}
          <div class="event-paper-card">
            <div class="card-inner-frame">
              <div class="event-header-icon">
                <span class="icon-ring">💍</span>
              </div>
              <h3 class="event-script-title">{invitation.events.akad.title || 'Akad Nikah'}</h3>
              
              <div class="event-date-row">
                <span class="event-day-date">{formatDateID(invitation.events.akad.date)}</span>
                <span class="event-time-badge">
                  Pukul {invitation.events.akad.startTime} - {invitation.events.akad.endTime} WIB
                </span>
              </div>

              <div class="event-divider-line"></div>

              <div class="event-location-block">
                <span class="location-tag">Bertempat di:</span>
                <h4 class="venue-name">{invitation.events.akad.venueName}</h4>
                <p class="venue-address">{invitation.events.akad.venueAddress}</p>
              </div>

              <div class="event-action-buttons">
                {#if invitation.events.akad.mapsUrl}
                  <a
                    href={invitation.events.akad.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-event-link btn-maps"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>Petunjuk Lokasi (Maps)</span>
                  </a>
                {/if}

                {#if invitation.events.akad.date}
                  <a
                    href={getGoogleCalendarUrl({
                      title: invitation.events.akad.title,
                      date: invitation.events.akad.date,
                      startTime: invitation.events.akad.startTime,
                      endTime: invitation.events.akad.endTime,
                      venueName: invitation.events.akad.venueName,
                      venueAddress: invitation.events.akad.venueAddress
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-event-link btn-calendar"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>Simpan ke Kalender</span>
                  </a>
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <!-- 2. Resepsi Pernikahan Card -->
        {#if invitation.events.resepsi.enabled}
          <div class="event-paper-card highlight-card">
            <div class="card-inner-frame">
              <div class="event-header-icon">
                <span class="icon-ring">🥂</span>
              </div>
              <h3 class="event-script-title">{invitation.events.resepsi.title || 'Resepsi Pernikahan'}</h3>
              
              <div class="event-date-row">
                <span class="event-day-date">{formatDateID(invitation.events.resepsi.date)}</span>
                <span class="event-time-badge">
                  Pukul {invitation.events.resepsi.startTime} - {invitation.events.resepsi.endTime} WIB
                </span>
              </div>

              <div class="event-divider-line"></div>

              <div class="event-location-block">
                <span class="location-tag">Bertempat di:</span>
                <h4 class="venue-name">{invitation.events.resepsi.venueName}</h4>
                <p class="venue-address">{invitation.events.resepsi.venueAddress}</p>
              </div>

              <div class="event-action-buttons">
                {#if invitation.events.resepsi.mapsUrl}
                  <a
                    href={invitation.events.resepsi.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-event-link btn-maps"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>Petunjuk Lokasi (Maps)</span>
                  </a>
                {/if}

                {#if invitation.events.resepsi.date}
                  <a
                    href={getGoogleCalendarUrl({
                      title: invitation.events.resepsi.title,
                      date: invitation.events.resepsi.date,
                      startTime: invitation.events.resepsi.startTime,
                      endTime: invitation.events.resepsi.endTime,
                      venueName: invitation.events.resepsi.venueName,
                      venueAddress: invitation.events.resepsi.venueAddress
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-event-link btn-calendar"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>Simpan ke Kalender</span>
                  </a>
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </section>

    <!-- SECTION: DRESS CODE (FROM IMAGE 3 & 4) -->
    <section class="invite-section dress-code-section">
      <div class="section-card paper-emboss-card text-center">
        <span class="title-eyebrow">PANDUAN BUSANA</span>
        <h3 class="dress-title">Dress Code</h3>
        <p class="dress-desc">
          Demi keselarasan dokumentasi dan suasana acara, kami mengundang para tamu untuk mengenakan busana bernuansa:
        </p>

        <!-- Color Swatch Circles -->
        <div class="swatches-row">
          <div class="swatch-item">
            <span class="swatch-circle" style="background: #C9847A;"></span>
            <span class="swatch-label">Terracotta</span>
          </div>
          <div class="swatch-item">
            <span class="swatch-circle" style="background: #E8B4B8;"></span>
            <span class="swatch-label">Rose Blush</span>
          </div>
          <div class="swatch-item">
            <span class="swatch-circle" style="background: #E6D5C3;"></span>
            <span class="swatch-label">Warm Nude</span>
          </div>
          <div class="swatch-item">
            <span class="swatch-circle" style="background: #8B5E52;"></span>
            <span class="swatch-label">Mocha</span>
          </div>
          <div class="swatch-item">
            <span class="swatch-circle" style="background: #4A4A4A;"></span>
            <span class="swatch-label">Charcoal</span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION: OUR LOVE STORY / CERITA CINTA (MATCH IMAGE 3 & 4) -->
    {#if invitation.loveStory.enabled && invitation.loveStory.stories.length > 0}
      <section id="story-section" class="invite-section story-section">
        <div class="section-title-wrap">
          <span class="title-eyebrow">OUR STORY</span>
          <h2 class="title-calligraphy">Kisah Cinta Kami</h2>
          <div class="title-ornament-line">
            <span class="ornament-leaf">❦</span>
          </div>
        </div>

        <div class="story-timeline-container">
          {#each invitation.loveStory.stories as item, idx}
            <div class="story-card-node">
              <div class="node-year-pill">{item.year}</div>
              <div class="story-bubble-card">
                <h4 class="story-node-title">{item.title}</h4>
                <p class="story-node-text">{item.story}</p>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- SECTION: GALLERY / FOTO (MATCH IMAGE 3 & 4) -->
    {#if invitation.gallery.enabled && invitation.gallery.photos.length > 0}
      <section id="gallery-section" class="invite-section gallery-section">
        <div class="section-title-wrap">
          <span class="title-eyebrow">MOMEN INDAH</span>
          <h2 class="title-calligraphy">Galeri Foto</h2>
          <div class="title-ornament-line">
            <span class="ornament-leaf">📸</span>
          </div>
        </div>

        <div class="gallery-masonry-grid">
          {#each invitation.gallery.photos as photo, idx}
            <button
              class="gallery-photo-card"
              onclick={() => selectedPhoto = photo}
              type="button"
              aria-label="Lihat foto {idx + 1}"
            >
              <img src={photo} alt="Prewedding {idx + 1}" class="gallery-img" loading="lazy" />
              <div class="gallery-zoom-overlay">
                <span>🔍</span>
              </div>
            </button>
          {/each}
        </div>
      </section>
    {/if}

    <!-- SECTION: WEDDING GIFT / AMPLOP DIGITAL (MATCH IMAGE 1 & 3) -->
    {#if invitation.gift.enabled && (invitation.gift.bankAccounts.length > 0 || invitation.gift.shippingAddress.enabled)}
      <section id="gift-section" class="invite-section gift-section">
        <div class="section-title-wrap">
          <span class="title-eyebrow">TANDA KASIH</span>
          <h2 class="title-calligraphy">Kado Pernikahan</h2>
          <div class="title-ornament-line">
            <span class="ornament-leaf">🎁</span>
          </div>
          <p class="section-intro">
            Doa restu Anda merupakan karunia terindah bagi kami. Bagi yang ingin memberikan tanda kasih secara digital atau fisik:
          </p>
        </div>

        <div class="gift-cards-container">
          {#each invitation.gift.bankAccounts as acc, i}
            <div class="luxury-bank-card">
              <div class="bank-card-top">
                <span class="bank-badge">{acc.bank}</span>
                <span class="bank-chip-graphic"></span>
              </div>
              <div class="bank-card-body">
                <span class="acc-num-display">{acc.accountNumber}</span>
                <span class="acc-holder-display">a.n {acc.accountHolder}</span>
              </div>
              <button
                class="btn-copy-account"
                onclick={() => copyBank(acc.accountNumber, i)}
                type="button"
              >
                {#if copiedBankIndex === i}
                  <span>✓ Nomor Rekening Tersalin</span>
                {:else}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>Salin Nomor Rekening</span>
                {/if}
              </button>
            </div>
          {/each}

          {#if invitation.gift.shippingAddress.enabled && invitation.gift.shippingAddress.address}
            <div class="shipping-address-card">
              <div class="shipping-card-header">
                <span class="gift-box-icon">📦</span>
                <h4>Kirim Kado Fisik</h4>
              </div>
              <p class="ship-recipient"><strong>Penerima:</strong> {invitation.gift.shippingAddress.recipient}</p>
              <p class="ship-address">{invitation.gift.shippingAddress.address}</p>
              {#if invitation.gift.shippingAddress.phone}
                <p class="ship-phone">Telp: {invitation.gift.shippingAddress.phone}</p>
              {/if}
              <button
                class="btn-copy-ship"
                onclick={() => copyAddress(`${invitation.gift.shippingAddress.recipient} - ${invitation.gift.shippingAddress.address} (${invitation.gift.shippingAddress.phone})`)}
                type="button"
              >
                {copiedAddress ? '✓ Alamat Berhasil Disalin!' : 'Salin Alamat Lengkap'}
              </button>
            </div>
          {/if}
        </div>
      </section>
    {/if}

    <!-- SECTION: RSVP & WISHES / UCAPAN (MATCH IMAGE 1 & 4) -->
    <section id="rsvp-section" class="invite-section rsvp-section">
      <div class="section-title-wrap">
        <span class="title-eyebrow">KONFIRMASI KEHADIRAN</span>
        <h2 class="title-calligraphy">RSVP &amp; Ucapan</h2>
        <div class="title-ornament-line">
          <span class="ornament-leaf">💌</span>
        </div>
      </div>

      <!-- Form Box -->
      <div class="rsvp-form-container paper-emboss-card">
        {#if rsvpSubmitted}
          <div class="rsvp-thankyou-box">
            <span class="thankyou-heart">💌</span>
            <h3>Terima Kasih Banyak!</h3>
            <p>Konfirmasi dan untaian doa restu Anda telah kami terima dengan penuh kebahagiaan.</p>
          </div>
        {:else}
          <form onsubmit={handleFormSubmit} class="rsvp-form-grid">
            <div class="form-field-group">
              <label for="rsvp-name" class="field-label">Nama Anda</label>
              <input
                id="rsvp-name"
                type="text"
                bind:value={rsvpSenderName}
                placeholder="Nama Lengkap / Panggilan"
                required
                class="field-input"
              />
            </div>

            <div class="form-field-group">
              <span class="field-label">Konfirmasi Kehadiran</span>
              <div class="attendance-pills">
                <label class="attendance-pill {rsvpAttendance === 'hadir' ? 'selected' : ''}">
                  <input
                    type="radio"
                    name="attendance"
                    value="hadir"
                    bind:group={rsvpAttendance}
                  />
                  <span>✓ Hadir</span>
                </label>
                <label class="attendance-pill {rsvpAttendance === 'tidak_hadir' ? 'selected' : ''}">
                  <input
                    type="radio"
                    name="attendance"
                    value="tidak_hadir"
                    bind:group={rsvpAttendance}
                  />
                  <span>Maaf, Belum Bisa</span>
                </label>
              </div>
            </div>

            {#if rsvpAttendance === 'hadir'}
              <div class="form-field-group">
                <label for="rsvp-count" class="field-label">Jumlah Tamu</label>
                <select id="rsvp-count" bind:value={rsvpGuestCount} class="field-input">
                  <option value={1}>1 Orang</option>
                  <option value={2}>2 Orang</option>
                  <option value={3}>3 Orang</option>
                  <option value={4}>4 Orang</option>
                </select>
              </div>
            {/if}

            <div class="form-field-group">
              <label for="rsvp-message" class="field-label">Untaian Doa &amp; Ucapan</label>
              <textarea
                id="rsvp-message"
                bind:value={rsvpMessage}
                rows="3"
                placeholder="Tuliskan ucapan dan doa tulus untuk kedua mempelai..."
                required
                class="field-input field-textarea"
              ></textarea>
            </div>

            <button type="submit" class="btn-send-rsvp">
              <span>Kirim Konfirmasi &amp; Doa</span>
              <span>💌</span>
            </button>
          </form>
        {/if}
      </div>

      <!-- Live Wishes List / Feed -->
      {#if invitation.wishes && invitation.wishes.length > 0}
        <div class="wishes-stream-container">
          <h4 class="wishes-stream-title">
            <span>Doa &amp; Harapan Tamu Undangan ({invitation.wishes.length})</span>
          </h4>

          <div class="wishes-stream-list">
            {#each invitation.wishes as wish}
              <div class="wish-speech-bubble">
                <div class="wish-author-row">
                  <span class="wish-name">{wish.name}</span>
                  <span class="wish-status-badge {wish.attendance === 'hadir' ? 'badge-attending' : 'badge-absent'}">
                    {wish.attendance === 'hadir' ? '✓ Hadir' : 'Berhalangan'}
                  </span>
                </div>
                <p class="wish-body">{wish.message}</p>
                <span class="wish-date-meta">{wish.createdAt}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </section>

    <!-- SECTION: CLOSING / FOOTER (MATCH IMAGE 1 & 4) -->
    <footer class="invite-footer-section">
      <div class="footer-botanical-ornament">🌸 ❦ 🌸</div>
      <p class="footer-blessing-text">
        Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kami.
      </p>

      <h3 class="footer-script-names">
        {invitation.couple.groomNickname} &amp; {invitation.couple.brideNickname}
      </h3>
      <p class="footer-family-text">Beserta Keluarga Besar Kedua Mempelai</p>

      <div class="footer-branding">
        <span>Designed with love by</span>
        <strong>💍 Nikahku</strong>
      </div>
    </footer>
  </main>

  <!-- ============================================== -->
  <!-- FLOATING BOTTOM DOCK NAVIGATION (MATCH IMAGE 1) -->
  <!-- ============================================== -->
  {#if isOpen}
    <nav class="floating-bottom-dock" aria-label="Navigasi Undangan">
      <button
        class="dock-item {activeNav === 'cover' ? 'active' : ''}"
        onclick={() => scrollToSection('cover')}
        title="Beranda"
        aria-label="Beranda"
        type="button"
      >
        <svg class="dock-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20V10.5z"></path>
          <path d="M9 21V13h6v8"></path>
        </svg>
      </button>

      <button
        class="dock-item {activeNav === 'couple' ? 'active' : ''}"
        onclick={() => scrollToSection('couple')}
        title="Kedua Mempelai"
        aria-label="Kedua Mempelai"
        type="button"
      >
        <svg class="dock-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>

      <button
        class="dock-item {activeNav === 'events' ? 'active' : ''}"
        onclick={() => scrollToSection('events')}
        title="Rangkaian Acara"
        aria-label="Rangkaian Acara"
        type="button"
      >
        <svg class="dock-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2.5" ry="2.5"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
          <path d="M9 16l2 2 4-4"></path>
        </svg>
      </button>

      {#if invitation.loveStory.enabled || (invitation.gallery.enabled && invitation.gallery.photos.length > 0)}
        <button
          class="dock-item {activeNav === 'gallery' || activeNav === 'story' ? 'active' : ''}"
          onclick={() => scrollToSection(invitation.gallery.photos.length > 0 ? 'gallery' : 'story')}
          title="Galeri & Cerita"
          aria-label="Galeri & Cerita"
          type="button"
        >
          <svg class="dock-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2.5" ry="2.5"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </button>
      {/if}

      <button
        class="dock-item {activeNav === 'rsvp' ? 'active' : ''}"
        onclick={() => scrollToSection('rsvp')}
        title="RSVP & Doa"
        aria-label="RSVP & Doa"
        type="button"
      >
        <svg class="dock-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"></path>
        </svg>
      </button>

      {#if invitation.gift.enabled}
        <button
          class="dock-item {activeNav === 'gift' ? 'active' : ''}"
          onclick={() => scrollToSection('gift')}
          title="Kado Pernikahan"
          aria-label="Kado Pernikahan"
          type="button"
        >
          <svg class="dock-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 12 20 22 4 22 4 12"></polyline>
            <rect x="2" y="7" width="20" height="5" rx="1"></rect>
            <line x1="12" y1="22" x2="12" y2="7"></line>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
          </svg>
        </button>
      {/if}
    </nav>
  {/if}

  <!-- Photo Lightbox Modal -->
  {#if selectedPhoto}
    <div
      class="lightbox-backdrop"
      onclick={() => selectedPhoto = null}
      onkeydown={(e) => e.key === 'Escape' && (selectedPhoto = null)}
      role="button"
      tabindex="0"
    >
      <div class="lightbox-content">
        <img src={selectedPhoto} alt="Prewedding Zoom" class="lightbox-img" />
        <button class="lightbox-close-btn" onclick={() => selectedPhoto = null}>✕</button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* ========================================================= */
  /* COLOR PALETTE & LUXURY TYPOGRAPHY SYSTEM                  */
  /* ========================================================= */
  .invitation-wrapper {
    --terracotta-primary: #C9847A;
    --terracotta-dark: #8B5E52;
    --terracotta-deep: #5A362C;
    --rose-blush: #F5E6E0;
    --warm-linen: #FAF6F0;
    --paper-card: #FFFFFF;
    --gold-accent: #D4A373;
    --gold-light: #F2E4D6;
    --text-heading: #2B1810;
    --text-body: #4E342E;
    --text-muted: #7E5E52;
    --border-warm: #EADBD4;

    /* Fonts matching user references */
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    color: var(--text-body);
    background: var(--warm-linen);
    position: relative;
    max-width: 480px;
    margin: 0 auto;
    overflow-x: hidden;
    box-shadow: 0 10px 50px rgba(90, 54, 44, 0.12);
    min-height: 100vh;
  }

  /* Paper & Fine Linen Overlay */
  .paper-texture-overlay {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(201, 132, 122, 0.04) 1px, transparent 1px);
    background-size: 16px 16px;
    pointer-events: none;
    z-index: 1;
  }

  /* Ambient Petals */
  .ambient-petals-wrap {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 2;
  }

  .falling-petal {
    position: absolute;
    width: 14px;
    height: 14px;
    background: rgba(201, 132, 122, 0.35);
    border-radius: 12px 0 12px 0;
    animation: petalFall 12s linear infinite;
  }
  .falling-petal.p1 { left: 10%; top: -20px; animation-duration: 11s; animation-delay: 0s; }
  .falling-petal.p2 { left: 35%; top: -20px; animation-duration: 14s; animation-delay: 2s; }
  .falling-petal.p3 { left: 60%; top: -20px; animation-duration: 10s; animation-delay: 4s; }
  .falling-petal.p4 { left: 85%; top: -20px; animation-duration: 13s; animation-delay: 1s; }
  .falling-petal.p5 { left: 20%; top: -20px; animation-duration: 15s; animation-delay: 5s; }
  .falling-petal.p6 { left: 75%; top: -20px; animation-duration: 12s; animation-delay: 3s; }

  @keyframes petalFall {
    0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
    15% { opacity: 0.6; }
    85% { opacity: 0.6; }
    100% { transform: translateY(1200px) rotate(360deg); opacity: 0; }
  }

  /* Floating Vinyl Audio Control */
  .floating-audio-btn {
    position: fixed;
    top: 24px;
    right: max(16px, calc(50% - 224px));
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--terracotta-dark);
    border: 2px solid #FFFFFF;
    box-shadow: 0 6px 20px rgba(90, 54, 44, 0.3);
    cursor: pointer;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s ease;
  }
  .floating-audio-btn:hover {
    transform: scale(1.08);
  }

  .disc-vinyl {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #2C1810;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #D4A373;
  }
  .floating-audio-btn.playing .disc-vinyl {
    animation: spin 3.5s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .disc-center-label {
    font-size: 13px;
    line-height: 1;
  }

  /* ========================================================= */
  /* 1. HERO COVER (EXACT MATCH FOR USER SCREENSHOT IMAGE 1)   */
  /* ========================================================= */
  .cover-hero-section {
    min-height: 100vh;
    padding: 40px 20px 80px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #FDF9F6 0%, #F5ECE8 60%, #EBDCD4 100%);
    position: relative;
    z-index: 10;
    text-align: center;
    transition: all 0.5s ease;
    overflow: hidden;
  }

  /* Botanical Watercolor Garland Header - Cover */
  .cover-floral-bg-top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 180px;
    background-image: url('/wedding-floral-arch.jpg');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center top;
    opacity: 0.12;
    pointer-events: none;
    z-index: 0;
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%);
  }

  .cover-hero-inner {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .top-botanical-crest {
    color: var(--terracotta-primary);
    margin-bottom: 8px;
    opacity: 0.85;
  }

  .cover-eyebrow {
    font-family: 'Cinzel', 'Playfair Display', serif;
    font-size: 11px;
    letter-spacing: 0.28em;
    color: var(--terracotta-dark);
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  /* Arched Prewedding Photo Dome */
  .cover-arch-container {
    position: relative;
    width: 250px;
    height: 320px;
    margin-bottom: 24px;
  }

  .cover-arch-frame {
    width: 100%;
    height: 100%;
    border-radius: 125px 125px 24px 24px;
    overflow: hidden;
    border: 4px solid #FFFFFF;
    box-shadow: 0 12px 36px rgba(139, 94, 82, 0.22);
    position: relative;
    background: #E8D5CE;
  }

  .cover-arch-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 25%;
    display: block;
    transition: transform 0.6s ease;
  }

  .cover-arch-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 65%, rgba(62, 39, 35, 0.28) 100%);
  }

  .cover-floral-wrap {
    position: absolute;
    bottom: -18px;
    left: 50%;
    transform: translateX(-50%);
    width: 180px;
    height: 70px;
    pointer-events: none;
    z-index: 2;
  }

  .floral-garland-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
  }

  /* Couple Title Calligraphy (Great Vibes / Alex Brush Style) */
  .cover-couple-script {
    font-family: 'Alex Brush', 'Dancing Script', cursive;
    font-size: 46px;
    line-height: 1.1;
    color: var(--terracotta-deep);
    font-weight: 400;
    margin: 8px 0 12px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .couple-ampersand {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 30px;
    color: var(--terracotta-primary);
  }

  .cover-date-text {
    font-family: 'Cinzel', 'Playfair Display', serif;
    font-size: 13px;
    letter-spacing: 0.12em;
    color: var(--terracotta-dark);
    font-weight: 600;
    margin: 0 0 20px 0;
  }

  /* Countdown Pills on Cover */
  .cover-countdown-pills {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 28px;
  }

  .countdown-pill {
    background: #A66E64;
    color: #FFFFFF;
    width: 58px;
    padding: 8px 0;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4px 12px rgba(166, 110, 100, 0.28);
  }

  .countdown-pill .pill-val {
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .countdown-pill .pill-lbl {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.9;
    margin-top: 3px;
  }

  /* Luxury Guest Card */
  .cover-guest-card {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(201, 132, 122, 0.3);
    border-radius: 20px;
    padding: 24px 20px;
    width: 100%;
    box-shadow: 0 8px 24px rgba(90, 54, 44, 0.08);
  }

  .guest-card-label {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
    display: block;
    margin-bottom: 8px;
  }

  .guest-card-name {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-heading);
    margin: 0 0 6px 0;
  }

  .guest-card-hint {
    font-size: 11px;
    color: var(--text-muted);
    font-style: italic;
    display: block;
    margin-bottom: 20px;
  }

  .btn-open-invitation {
    background: linear-gradient(135deg, var(--terracotta-primary) 0%, var(--terracotta-dark) 100%);
    color: #FFFFFF;
    border: none;
    padding: 12px 28px;
    border-radius: 30px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.03em;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(139, 94, 82, 0.35);
    transition: all 0.25s ease;
  }

  .btn-open-invitation:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(139, 94, 82, 0.45);
  }

  .arrow-down-icon {
    animation: bounceDown 1.8s infinite;
  }

  @keyframes bounceDown {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(4px); }
  }

  /* ========================================================= */
  /* MAIN INVITATION SECTIONS & CARDS                          */
  /* ========================================================= */
  .invitation-main-content {
    position: relative;
    z-index: 5;
    padding-bottom: 120px;
  }

  .invite-section {
    padding: 44px 20px;
  }

  /* Section Title Elements */
  .section-title-wrap {
    text-align: center;
    margin-bottom: 32px;
  }

  .title-eyebrow {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.22em;
    color: var(--terracotta-primary);
    text-transform: uppercase;
    font-weight: 600;
    display: block;
    margin-bottom: 4px;
  }

  .title-calligraphy {
    font-family: 'Alex Brush', cursive;
    font-size: 42px;
    line-height: 1.15;
    color: var(--text-heading);
    font-weight: 400;
    margin: 0 0 8px 0;
  }

  .title-ornament-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .title-ornament-line::before,
  .title-ornament-line::after {
    content: '';
    width: 40px;
    height: 1px;
    background: var(--border-warm);
  }
  .ornament-leaf {
    color: var(--terracotta-primary);
    font-size: 13px;
  }

  .section-intro {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
    max-width: 380px;
    margin: 8px auto 0 auto;
    text-align: center;
  }

  /* Paper Emboss Card Styling */
  .paper-emboss-card {
    background: var(--paper-card);
    border: 1px solid var(--border-warm);
    border-radius: 20px;
    padding: 28px 22px;
    box-shadow: 0 8px 24px rgba(90, 54, 44, 0.05);
  }

  /* 1. Bismillah & Salam */
  .arabic-basmalah {
    font-size: 28px;
    color: var(--terracotta-deep);
    font-family: 'Traditional Arabic', 'Scheherazade', 'Amiri', serif;
    margin-bottom: 16px;
    line-height: 1.8;
  }

  .salam-heading {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-heading);
    margin-bottom: 10px;
  }

  .salam-intro {
    font-size: 13px;
    color: var(--text-body);
    line-height: 1.7;
    margin-bottom: 20px;
  }

  .ar-rum-quote-box {
    background: rgba(245, 230, 224, 0.45);
    border-left: 3px solid var(--terracotta-primary);
    padding: 16px;
    border-radius: 8px;
    text-align: center;
  }

  .quote-decor-mark {
    font-size: 24px;
    line-height: 1;
    color: var(--terracotta-primary);
    margin-bottom: 4px;
  }

  .quote-verse-text {
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-body);
    line-height: 1.7;
    margin: 0 0 8px 0;
  }

  .quote-verse-source {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    font-weight: 600;
    color: var(--terracotta-dark);
  }

  /* ========================================================= */
  /* COUPLE PROFILES (ARCH DOME PORTRAITS - MATCH IMAGE 1 & 2)  */
  /* ========================================================= */
  .couple-profiles-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
    align-items: center;
  }

  .profile-card {
    background: var(--paper-card);
    border: 1px solid var(--border-warm);
    border-radius: 24px;
    padding: 32px 20px 24px 20px;
    width: 100%;
    text-align: center;
    box-shadow: 0 8px 24px rgba(90, 54, 44, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .profile-arch-wrapper {
    position: relative;
    width: 170px;
    height: 220px;
    margin-bottom: 16px;
  }

  .profile-arch-frame {
    width: 100%;
    height: 100%;
    border-radius: 85px 85px 16px 16px;
    overflow: hidden;
    border: 3px solid #FFFFFF;
    box-shadow: 0 8px 20px rgba(139, 94, 82, 0.18);
    background: #E8D5CE;
  }

  .profile-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .profile-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60px;
    background: #F3E4DC;
  }

  .profile-wreath {
    position: absolute;
    bottom: -14px;
    left: 50%;
    transform: translateX(-50%);
    width: 140px;
    height: 50px;
    pointer-events: none;
  }

  .wreath-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .profile-script-name {
    font-family: 'Alex Brush', cursive;
    font-size: 38px;
    line-height: 1.1;
    color: var(--terracotta-deep);
    font-weight: 400;
    margin: 4px 0 6px 0;
  }

  .profile-full-name {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-heading);
    margin: 0 0 6px 0;
  }

  .profile-parents {
    font-size: 12.5px;
    color: var(--text-muted);
    line-height: 1.5;
    margin: 0 0 16px 0;
  }

  .instagram-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: rgba(201, 132, 122, 0.12);
    color: var(--terracotta-dark);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }
  .instagram-button:hover {
    background: var(--terracotta-primary);
    color: #FFFFFF;
  }

  .couple-monogram-divider {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .monogram-badge {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--terracotta-primary) 0%, var(--terracotta-dark) 100%);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(139, 94, 82, 0.25);
  }

  .monogram-amp {
    font-family: 'Alex Brush', cursive;
    font-size: 30px;
    line-height: 1;
  }

  /* ========================================================= */
  /* EVENTS SECTION (AKAD & RESEPSI CARDS - MATCH IMAGE 1)     */
  /* ========================================================= */
  .event-countdown-card {
    text-align: center;
  }

  .countdown-card-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    display: block;
    margin-bottom: 12px;
  }

  .countdown-grid {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .countdown-box {
    background: #A66E64;
    color: #FFFFFF;
    width: 60px;
    padding: 10px 0;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4px 12px rgba(166, 110, 100, 0.22);
  }

  .countdown-number {
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
  }

  .countdown-tag {
    font-size: 10px;
    text-transform: uppercase;
    margin-top: 4px;
    opacity: 0.9;
  }

  /* Event Paper Cards Stack */
  .event-cards-stack {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .event-paper-card {
    background: var(--paper-card);
    border: 1px solid var(--border-warm);
    border-radius: 20px;
    padding: 8px;
    box-shadow: 0 8px 24px rgba(90, 54, 44, 0.06);
  }

  .card-inner-frame {
    border: 1px dashed rgba(201, 132, 122, 0.4);
    border-radius: 14px;
    padding: 24px 16px;
    text-align: center;
  }

  .event-header-icon {
    margin-bottom: 6px;
  }
  .icon-ring {
    font-size: 24px;
  }

  .event-script-title {
    font-family: 'Alex Brush', cursive;
    font-size: 38px;
    line-height: 1.1;
    color: var(--terracotta-deep);
    font-weight: 400;
    margin: 0 0 10px 0;
  }

  .event-date-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin-bottom: 14px;
  }

  .event-day-date {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-heading);
  }

  .event-time-badge {
    font-size: 12px;
    color: var(--terracotta-dark);
    font-weight: 600;
  }

  .event-divider-line {
    width: 60px;
    height: 1px;
    background: var(--border-warm);
    margin: 14px auto;
  }

  .event-location-block {
    margin-bottom: 20px;
  }

  .location-tag {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    display: block;
    margin-bottom: 4px;
  }

  .venue-name {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-heading);
    margin: 0 0 4px 0;
  }

  .venue-address {
    font-size: 12.5px;
    color: var(--text-body);
    line-height: 1.5;
    margin: 0;
  }

  .event-action-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .btn-event-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 24px;
    font-size: 12.5px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .btn-maps {
    background: var(--terracotta-primary);
    color: #FFFFFF;
    box-shadow: 0 4px 12px rgba(201, 132, 122, 0.3);
  }
  .btn-maps:hover {
    background: var(--terracotta-dark);
  }

  .btn-calendar {
    background: rgba(201, 132, 122, 0.12);
    color: var(--terracotta-dark);
  }
  .btn-calendar:hover {
    background: rgba(201, 132, 122, 0.22);
  }

  /* ========================================================= */
  /* DRESS CODE SECTION (MATCH IMAGE 3 & 4)                    */
  /* ========================================================= */
  .dress-title {
    font-family: 'Alex Brush', cursive;
    font-size: 34px;
    color: var(--terracotta-deep);
    margin: 0 0 6px 0;
  }

  .dress-desc {
    font-size: 12.5px;
    color: var(--text-muted);
    line-height: 1.6;
    margin: 0 0 20px 0;
  }

  .swatches-row {
    display: flex;
    justify-content: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .swatch-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .swatch-circle {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
    border: 2px solid #FFFFFF;
  }

  .swatch-label {
    font-size: 10.5px;
    color: var(--text-muted);
    font-weight: 500;
  }

  /* ========================================================= */
  /* OUR STORY TIMELINE                                        */
  /* ========================================================= */
  .story-timeline-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    padding-left: 24px;
  }

  .story-timeline-container::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 10px;
    bottom: 10px;
    width: 2px;
    background: var(--border-warm);
  }

  .story-card-node {
    position: relative;
  }

  .node-year-pill {
    position: absolute;
    left: -24px;
    top: 12px;
    transform: translateX(-50%);
    background: var(--terracotta-primary);
    color: #FFFFFF;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 12px;
    box-shadow: 0 2px 6px rgba(201, 132, 122, 0.35);
  }

  .story-bubble-card {
    background: var(--paper-card);
    border: 1px solid var(--border-warm);
    border-radius: 16px;
    padding: 16px;
    margin-left: 12px;
    box-shadow: 0 4px 14px rgba(90, 54, 44, 0.04);
  }

  .story-node-title {
    font-family: 'Playfair Display', serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-heading);
    margin: 0 0 6px 0;
  }

  .story-node-text {
    font-size: 12px;
    color: var(--text-body);
    line-height: 1.6;
    margin: 0;
  }

  /* ========================================================= */
  /* GALLERY MASONRY                                           */
  /* ========================================================= */
  .gallery-masonry-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .gallery-photo-card {
    border: none;
    padding: 0;
    background: none;
    border-radius: 14px;
    overflow: hidden;
    position: relative;
    aspect-ratio: 1;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(90, 54, 44, 0.08);
  }

  .gallery-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }

  .gallery-photo-card:hover .gallery-img {
    transform: scale(1.05);
  }

  .gallery-zoom-overlay {
    position: absolute;
    inset: 0;
    background: rgba(62, 39, 35, 0.3);
    opacity: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    transition: opacity 0.2s ease;
  }
  .gallery-photo-card:hover .gallery-zoom-overlay {
    opacity: 1;
  }

  /* Lightbox */
  .lightbox-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .lightbox-content {
    position: relative;
    max-width: 90vw;
    max-height: 85vh;
  }

  .lightbox-img {
    max-width: 100%;
    max-height: 85vh;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }

  .lightbox-close-btn {
    position: absolute;
    top: -40px;
    right: 0;
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
  }

  /* ========================================================= */
  /* WEDDING GIFT / AMPLOP DIGITAL                             */
  /* ========================================================= */
  .gift-cards-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 20px;
  }

  .luxury-bank-card {
    background: linear-gradient(135deg, #FAF4EF 0%, #F5EAE4 100%);
    border: 1px solid var(--border-warm);
    border-radius: 18px;
    padding: 20px;
    box-shadow: 0 6px 18px rgba(90, 54, 44, 0.06);
    text-align: left;
  }

  .bank-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .bank-badge {
    font-family: 'Cinzel', serif;
    font-weight: 700;
    font-size: 15px;
    color: var(--terracotta-deep);
  }

  .bank-chip-graphic {
    width: 32px;
    height: 24px;
    border-radius: 4px;
    background: linear-gradient(135deg, #E6CA85 0%, #C5A059 100%);
  }

  .bank-card-body {
    margin-bottom: 16px;
  }

  .acc-num-display {
    font-family: 'DM Sans', monospace;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--text-heading);
    display: block;
    margin-bottom: 4px;
  }

  .acc-holder-display {
    font-size: 12px;
    color: var(--text-muted);
  }

  .btn-copy-account {
    width: 100%;
    padding: 9px;
    border-radius: 20px;
    background: var(--terracotta-primary);
    color: #FFFFFF;
    border: none;
    font-size: 12.5px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .btn-copy-account:hover {
    background: var(--terracotta-dark);
  }

  .shipping-address-card {
    background: var(--paper-card);
    border: 1px solid var(--border-warm);
    border-radius: 18px;
    padding: 20px;
    text-align: left;
  }

  .shipping-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .shipping-card-header h4 {
    margin: 0;
    font-size: 14px;
    color: var(--text-heading);
  }

  .ship-recipient, .ship-address, .ship-phone {
    font-size: 12px;
    color: var(--text-body);
    margin: 0 0 4px 0;
  }

  .btn-copy-ship {
    margin-top: 10px;
    width: 100%;
    padding: 8px;
    border-radius: 20px;
    background: rgba(201, 132, 122, 0.12);
    color: var(--terracotta-dark);
    border: none;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  /* ========================================================= */
  /* RSVP & WISHES FEED                                        */
  /* ========================================================= */
  .rsvp-form-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
    text-align: left;
  }

  .field-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-heading);
    display: block;
    margin-bottom: 6px;
  }

  .field-input {
    width: 100%;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid var(--border-warm);
    background: #FAF6F0;
    font-size: 13px;
    color: var(--text-heading);
    font-family: inherit;
    box-sizing: border-box;
  }
  .field-input:focus {
    outline: none;
    border-color: var(--terracotta-primary);
    background: #FFFFFF;
  }

  .field-textarea {
    resize: vertical;
  }

  .attendance-pills {
    display: flex;
    gap: 10px;
  }

  .attendance-pill {
    flex: 1;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid var(--border-warm);
    background: #FAF6F0;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .attendance-pill input {
    display: none;
  }
  .attendance-pill.selected {
    background: var(--terracotta-primary);
    border-color: var(--terracotta-primary);
    color: #FFFFFF;
  }

  .btn-send-rsvp {
    background: linear-gradient(135deg, var(--terracotta-primary) 0%, var(--terracotta-dark) 100%);
    color: #FFFFFF;
    border: none;
    padding: 12px;
    border-radius: 24px;
    font-size: 13.5px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(139, 94, 82, 0.25);
  }

  .rsvp-thankyou-box {
    text-align: center;
    padding: 24px 12px;
  }
  .thankyou-heart {
    font-size: 40px;
  }

  /* Wishes Stream */
  .wishes-stream-container {
    margin-top: 32px;
  }

  .wishes-stream-title {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    color: var(--text-heading);
    text-align: center;
    margin-bottom: 16px;
  }

  .wishes-stream-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 380px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .wish-speech-bubble {
    background: #FFFFFF;
    border: 1px solid var(--border-warm);
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 4px 14px rgba(90, 54, 44, 0.06);
  }

  .wish-author-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .wish-name {
    font-weight: 700;
    font-size: 13.5px;
    color: var(--text-heading);
  }

  .wish-status-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 12px;
  }
  .badge-attending {
    background: #E8F5E9;
    color: #2E7D32;
  }
  .badge-absent {
    background: #FFEBEE;
    color: #C62828;
  }

  .wish-body {
    font-size: 13px;
    color: var(--text-body);
    line-height: 1.6;
    margin: 0 0 8px 0;
  }

  .wish-date-meta {
    font-size: 11px;
    color: var(--text-muted);
  }

  /* ========================================================= */
  /* FOOTER / CLOSING SECTION                                  */
  /* ========================================================= */
  .invite-footer-section {
    padding: 44px 20px 64px 20px;
    text-align: center;
    background: linear-gradient(180deg, rgba(250, 246, 240, 0) 0%, rgba(201, 132, 122, 0.10) 100%);
  }

  .footer-botanical-ornament {
    font-size: 20px;
    color: var(--terracotta-primary);
    margin-bottom: 18px;
  }

  .footer-blessing-text {
    font-size: 13px;
    color: var(--text-body);
    line-height: 1.8;
    max-width: 400px;
    margin: 0 auto 24px auto;
  }

  .footer-script-names {
    font-family: 'Alex Brush', cursive;
    font-size: 48px;
    color: var(--terracotta-deep);
    margin: 0 0 6px 0;
    line-height: 1.2;
  }

  .footer-family-text {
    font-size: 12px;
    color: var(--text-muted);
    font-style: italic;
    margin: 0 0 32px 0;
  }

  .footer-branding {
    font-size: 11px;
    color: var(--text-muted);
  }

  /* ========================================================= */
  /* FLOATING BOTTOM DOCK (MATCH IMAGE 1 - NO TEXT, CLEAN SVG) */
  /* ========================================================= */
  .floating-bottom-dock {
    position: fixed;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 90;
    background: rgba(139, 94, 82, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 40px;
    padding: 6px 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 12px 36px rgba(90, 54, 44, 0.38), 0 2px 8px rgba(0, 0, 0, 0.12);
    width: auto;
    max-width: calc(100vw - 32px);
  }

  .dock-item {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.72);
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    padding: 0;
  }

  .dock-svg {
    transition: transform 0.25s ease;
  }

  .dock-item:hover {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-2px);
  }

  .dock-item:hover .dock-svg {
    transform: scale(1.1);
  }

  .dock-item.active {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.32);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.4);
    transform: translateY(-2px) scale(1.05);
  }

  .dock-item.active .dock-svg {
    stroke-width: 2.2;
    transform: scale(1.08);
  }
</style>
