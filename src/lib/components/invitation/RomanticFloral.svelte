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

    // Otomatis putar musik ketika web diakses
    let cleanupGesture: (() => void) | null = null;
    const startAudio = () => {
      if (audioRef && !isPlaying) {
        audioRef.play().then(() => {
          isPlaying = true;
          if (cleanupGesture) cleanupGesture();
        }).catch(() => {
          // Jika browser membatasi autoplay tanpa interaksi (browser policy),
          // pasang listener pada sentuhan / scroll / klik pertama di layar mana saja
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

    const autoTimer = setTimeout(startAudio, 250);

    return () => {
      clearInterval(timer);
      clearTimeout(autoTimer);
      if (cleanupGesture) cleanupGesture();
    };
  });

  function handleOpenInvitation() {
    isOpen = true;
    if (audioRef && !isPlaying) {
      audioRef.play().then(() => {
        isPlaying = true;
      }).catch(() => {
        // Autoplay policy prevented playback, keep paused
        isPlaying = false;
      });
    }

    // Scroll to the main content
    setTimeout(() => {
      const mainEl = document.getElementById('invitation-content');
      if (mainEl) {
        mainEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
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
</script>

<div class="invitation-wrapper {isOpen ? 'is-opened' : 'is-closed'}">
  <!-- Ambient Floating Rose Petals -->
  <div class="ambient-petals-wrap" aria-hidden="true">
    <div class="falling-petal p1"></div>
    <div class="falling-petal p2"></div>
    <div class="falling-petal p3"></div>
    <div class="falling-petal p4"></div>
    <div class="falling-petal p5"></div>
    <div class="falling-petal p6"></div>
    <div class="falling-petal p7"></div>
    <div class="falling-petal p8"></div>
    <div class="falling-petal p9"></div>
    <div class="falling-petal p10"></div>
  </div>

  <!-- Ambient Swaying Floral Corners -->
  <div class="swaying-floral-corner corner-top-left" aria-hidden="true">
    <img src="/wedding-bouquet.jpg" alt="" class="corner-flower-img" />
  </div>
  <div class="swaying-floral-corner corner-bottom-right" aria-hidden="true">
    <img src="/wedding-bouquet.jpg" alt="" class="corner-flower-img" />
  </div>

  <!-- Hidden Background Music -->
  {#if resolvedMusicUrl}
    <audio
      bind:this={audioRef}
      src={resolvedMusicUrl}
      loop
      preload="auto"
    ></audio>

    <!-- Floating Audio Control Button -->
    {#if isOpen || isPlaying}
      <button
        class="floating-audio-btn {isPlaying ? 'playing' : 'paused'}"
        onclick={toggleAudio}
        title={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
        aria-label={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
      >
        <svg class="disc-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
    {/if}
  {/if}

  <!-- ============================================== -->
  <!-- 1. FULLSCREEN GATE COVER (COVER PEMBUKA)        -->
  <!-- ============================================== -->
  <section class="gate-cover {isOpen ? 'gate-unlocked' : ''}">
    <!-- Two-Door Sliding Gate Doors -->
    <div class="gate-door gate-door-left" aria-hidden="true">
      <div class="door-bg-image" style="background-image: url('/images/themes/romantic-arch-real.jpg');"></div>
      <div class="door-gradient-tint"></div>
      <div class="door-border-trim left-trim"></div>
    </div>
    <div class="gate-door gate-door-right" aria-hidden="true">
      <div class="door-bg-image" style="background-image: url('/images/themes/romantic-arch-real.jpg');"></div>
      <div class="door-gradient-tint"></div>
      <div class="door-border-trim right-trim"></div>
    </div>

    <div class="gate-content">
      <div class="gate-badge">
        <span class="gate-rings">💍</span>
        <span>{invitation.cover.title || 'THE WEDDING OF'}</span>
      </div>

      <h1 class="gate-couple-title">
        <span class="gate-groom">{invitation.couple.groomNickname}</span>
        <span class="gate-ampersand">&amp;</span>
        <span class="gate-bride">{invitation.couple.brideNickname}</span>
      </h1>

      <p class="gate-date">
        {formatDateID(invitation.events.resepsi.date || invitation.events.akad.date)}
      </p>

      <div class="gate-guest-box">
        <span class="gate-guest-label">Kepada Yth. Bapak/Ibu/Saudara/i:</span>
        <h3 class="gate-guest-name">{guestName}</h3>
        <p class="gate-guest-note">Mohon maaf bila ada kesalahan penulisan nama/gelar</p>
      </div>

      <button class="gate-open-btn" onclick={handleOpenInvitation}>
        <div class="wax-seal-wrapper">
          <img src="/images/themes/wax-seal-real.jpg" alt="Wax Seal" class="gate-wax-seal" />
          <span class="wax-seal-pulse-ring"></span>
        </div>
        <span>Buka Undangan</span>
        <span class="btn-sparkle-icon">✨</span>
      </button>
    </div>
  </section>

  <!-- ============================================== -->
  <!-- MAIN INVITATION CONTENT (SCROLLABLE)           -->
  <!-- ============================================== -->
  <main id="invitation-content" class="invitation-main">
    <!-- Header Minimalist Monogram -->
    <header class="invite-header">
      <div class="monogram-circle">
        <span>{invitation.couple.groomNickname.charAt(0)}</span>
        <span class="monogram-amp">&amp;</span>
        <span>{invitation.couple.brideNickname.charAt(0)}</span>
      </div>
      <p class="invite-header-tagline">Walimatul Ursy</p>
    </header>

    <!-- SECTION: QUOTE / AYAT -->
    {#if invitation.quote.enabled && invitation.quote.text}
      <section class="invite-section quote-section">
        <div class="quote-card">
          <div class="quote-ornament">🌿 ❦ 🌿</div>
          <p class="quote-text">"{invitation.quote.text}"</p>
          <span class="quote-source">— {invitation.quote.source} —</span>
        </div>
      </section>
    {/if}

    <!-- SECTION: THE COUPLE (MEMPELAI) -->
    <section class="invite-section couple-section">
      <div class="section-title-wrap">
        <span class="section-subtitle">Dua Hati Satu Janji</span>
        <h2 class="section-title">Mempelai</h2>
        <div class="title-divider"></div>
        <p class="section-intro">
          Dengan memohon rahmat dan ridho Allah Subhanahu wa Ta'ala, kami bermaksud menyelenggarakan syukuran pernikahan putra-putri kami:
        </p>
      </div>

      <div class="couple-grid">
        <!-- Groom Card -->
        <div class="couple-card groom-card">
          <div class="couple-avatar-wrap">
            {#if invitation.couple.groomPhoto}
              <img src={invitation.couple.groomPhoto} alt={invitation.couple.groomFullName} class="couple-avatar-img" />
            {:else}
              <div class="couple-avatar-placeholder">🤵</div>
            {/if}
          </div>
          <h3 class="couple-full-name">{invitation.couple.groomFullName}</h3>
          <p class="couple-parents">{invitation.couple.groomParents}</p>
          {#if invitation.couple.groomInstagram}
            <a
              href="https://instagram.com/{invitation.couple.groomInstagram.replace('@', '')}"
              target="_blank"
              rel="noopener noreferrer"
              class="instagram-pill"
            >
              <span>📷</span>
              <span>@{invitation.couple.groomInstagram.replace('@', '')}</span>
            </a>
          {/if}
        </div>

        <div class="couple-center-ampersand">
          <div class="ampersand-badge">&amp;</div>
        </div>

        <!-- Bride Card -->
        <div class="couple-card bride-card">
          <div class="couple-avatar-wrap">
            {#if invitation.couple.bridePhoto}
              <img src={invitation.couple.bridePhoto} alt={invitation.couple.brideFullName} class="couple-avatar-img" />
            {:else}
              <div class="couple-avatar-placeholder">👰</div>
            {/if}
          </div>
          <h3 class="couple-full-name">{invitation.couple.brideFullName}</h3>
          <p class="couple-parents">{invitation.couple.brideParents}</p>
          {#if invitation.couple.brideInstagram}
            <a
              href="https://instagram.com/{invitation.couple.brideInstagram.replace('@', '')}"
              target="_blank"
              rel="noopener noreferrer"
              class="instagram-pill"
            >
              <span>📷</span>
              <span>@{invitation.couple.brideInstagram.replace('@', '')}</span>
            </a>
          {/if}
        </div>
      </div>
    </section>

    <!-- SECTION: ACARA / EVENTS -->
    <section class="invite-section events-section">
      <div class="section-title-wrap">
        <span class="section-subtitle">Waktu &amp; Tempat</span>
        <h2 class="section-title">Rangkaian Acara</h2>
        <div class="title-divider"></div>
      </div>

      <!-- Live Countdown -->
      <div class="countdown-container">
        <div class="countdown-unit">
          <span class="countdown-num">{days}</span>
          <span class="countdown-lbl">Hari</span>
        </div>
        <div class="countdown-sep">:</div>
        <div class="countdown-unit">
          <span class="countdown-num">{hours}</span>
          <span class="countdown-lbl">Jam</span>
        </div>
        <div class="countdown-sep">:</div>
        <div class="countdown-unit">
          <span class="countdown-num">{minutes}</span>
          <span class="countdown-lbl">Menit</span>
        </div>
        <div class="countdown-sep">:</div>
        <div class="countdown-unit">
          <span class="countdown-num">{seconds}</span>
          <span class="countdown-lbl">Detik</span>
        </div>
      </div>

      <div class="events-cards-grid">
        <!-- Akad Card -->
        {#if invitation.events.akad.enabled}
          <div class="event-card">
            <div class="event-icon-badge">💍</div>
            <h3 class="event-title">{invitation.events.akad.title}</h3>
            <p class="event-date-text">{formatDateID(invitation.events.akad.date)}</p>
            <p class="event-time-text">Pukul {invitation.events.akad.startTime} - {invitation.events.akad.endTime}</p>

            <div class="event-venue-box">
              <strong class="venue-name">{invitation.events.akad.venueName}</strong>
              <p class="venue-address">{invitation.events.akad.venueAddress}</p>
            </div>

            <div class="event-actions">
              {#if invitation.events.akad.mapsUrl}
                <a
                  href={invitation.events.akad.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-event-action"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  Petunjuk Lokasi (Maps)
                </a>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Resepsi Card -->
        {#if invitation.events.resepsi.enabled}
          <div class="event-card event-card-highlight">
            <div class="event-icon-badge">🎉</div>
            <h3 class="event-title">{invitation.events.resepsi.title}</h3>
            <p class="event-date-text">{formatDateID(invitation.events.resepsi.date)}</p>
            <p class="event-time-text">Pukul {invitation.events.resepsi.startTime} - {invitation.events.resepsi.endTime}</p>

            <div class="event-venue-box">
              <strong class="venue-name">{invitation.events.resepsi.venueName}</strong>
              <p class="venue-address">{invitation.events.resepsi.venueAddress}</p>
            </div>

            <div class="event-actions">
              {#if invitation.events.resepsi.mapsUrl}
                <a
                  href={invitation.events.resepsi.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-event-action"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  Petunjuk Lokasi (Maps)
                </a>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </section>

    <!-- SECTION: LOVE STORY -->
    {#if invitation.loveStory.enabled && invitation.loveStory.stories.length > 0}
      <section class="invite-section story-section">
        <div class="section-title-wrap">
          <span class="section-subtitle">Perjalanan Kisah Kami</span>
          <h2 class="section-title">Cerita Cinta</h2>
          <div class="title-divider"></div>
        </div>

        <div class="timeline-wrap">
          {#each invitation.loveStory.stories as item}
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-bubble">
                <span class="timeline-year">{item.year}</span>
                <h4 class="timeline-item-title">{item.title}</h4>
                <p class="timeline-desc">{item.story}</p>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- SECTION: GALLERY -->
    {#if invitation.gallery.enabled && invitation.gallery.photos.length > 0}
      <section class="invite-section gallery-section">
        <div class="section-title-wrap">
          <span class="section-subtitle">Momen Berharga</span>
          <h2 class="section-title">Galeri Foto</h2>
          <div class="title-divider"></div>
        </div>

        <div class="gallery-grid">
          {#each invitation.gallery.photos as photo, idx}
            <div class="gallery-item-wrap">
              <img src={photo} alt="Prewedding {idx + 1}" class="gallery-photo" loading="lazy" />
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- SECTION: GIFT / AMPLOP DIGITAL -->
    {#if invitation.gift.enabled && (invitation.gift.bankAccounts.length > 0 || invitation.gift.shippingAddress.enabled)}
      <section class="invite-section gift-section">
        <div class="section-title-wrap">
          <span class="section-subtitle">Tanda Kasih</span>
          <h2 class="section-title">Kado Pernikahan</h2>
          <div class="title-divider"></div>
          <p class="section-intro">
            Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Dan jika memberi adalah ungkapan tanda kasih Anda, Anda dapat memberi kado secara digital atau fisik:
          </p>
        </div>

        <div class="gift-cards-list">
          {#each invitation.gift.bankAccounts as acc, i}
            <div class="bank-card">
              <div class="bank-chip"></div>
              <div class="bank-info-row">
                <span class="bank-name">{acc.bank}</span>
                <span class="bank-holder">a.n {acc.accountHolder}</span>
              </div>
              <div class="bank-acc-row">
                <span class="acc-number">{acc.accountNumber}</span>
                <button
                  class="btn-copy-acc"
                  onclick={() => copyBank(acc.accountNumber, i)}
                >
                  {copiedBankIndex === i ? '✓ Tersalin' : 'Salin Rekening'}
                </button>
              </div>
            </div>
          {/each}

          {#if invitation.gift.shippingAddress.enabled && invitation.gift.shippingAddress.address}
            <div class="address-gift-card">
              <div class="address-header">
                <span class="gift-icon">🎁</span>
                <h4>Kirim Kado Fisik</h4>
              </div>
              <p class="address-recipient"><strong>Penerima:</strong> {invitation.gift.shippingAddress.recipient}</p>
              <p class="address-text">{invitation.gift.shippingAddress.address}</p>
              {#if invitation.gift.shippingAddress.phone}
                <p class="address-phone">No. Telp: {invitation.gift.shippingAddress.phone}</p>
              {/if}
              <button
                class="btn-copy-address"
                onclick={() => copyAddress(`${invitation.gift.shippingAddress.recipient} - ${invitation.gift.shippingAddress.address} (${invitation.gift.shippingAddress.phone})`)}
              >
                {copiedAddress ? '✓ Alamat Tersalin!' : 'Salin Alamat Lengkap'}
              </button>
            </div>
          {/if}
        </div>
      </section>
    {/if}

    <!-- SECTION: RSVP & WISHES (BUKU TAMU & DOA) -->
    <section class="invite-section rsvp-section">
      <div class="section-title-wrap">
        <span class="section-subtitle">Doa &amp; Konfirmasi</span>
        <h2 class="section-title">RSVP &amp; Ucapan</h2>
        <div class="title-divider"></div>
      </div>

      <!-- Form Box -->
      <div class="rsvp-form-card">
        {#if rsvpSubmitted}
          <div class="rsvp-success-box">
            <span class="success-icon">💌</span>
            <h3>Terima Kasih Banyak!</h3>
            <p>Konfirmasi kehadiran dan untaian doa restu Anda telah kami terima dengan penuh rasa syukur.</p>
          </div>
        {:else}
          <form onsubmit={handleFormSubmit} class="rsvp-form">
            <div class="form-field">
              <label for="rsvp-name">Nama Anda</label>
              <input
                id="rsvp-name"
                type="text"
                bind:value={rsvpSenderName}
                placeholder="Nama Lengkap / Panggilan"
                required
                class="input-custom"
              />
            </div>

            <div class="form-field">
              <label>Konfirmasi Kehadiran</label>
              <div class="attendance-radio-group">
                <label class="radio-pill {rsvpAttendance === 'hadir' ? 'active' : ''}">
                  <input
                    type="radio"
                    name="attendance"
                    value="hadir"
                    bind:group={rsvpAttendance}
                  />
                  <span>✓ Ya, Saya Hadir</span>
                </label>
                <label class="radio-pill {rsvpAttendance === 'tidak_hadir' ? 'active' : ''}">
                  <input
                    type="radio"
                    name="attendance"
                    value="tidak_hadir"
                    bind:group={rsvpAttendance}
                  />
                  <span>Maaf, Belum Bisa Hadir</span>
                </label>
              </div>
            </div>

            {#if rsvpAttendance === 'hadir'}
              <div class="form-field">
                <label for="rsvp-count">Jumlah Tamu Hadir</label>
                <select id="rsvp-count" bind:value={rsvpGuestCount} class="input-custom">
                  <option value={1}>1 Orang</option>
                  <option value={2}>2 Orang</option>
                  <option value={3}>3 Orang</option>
                  <option value={4}>4 Orang</option>
                </select>
              </div>
            {/if}

            <div class="form-field">
              <label for="rsvp-message">Ucapan &amp; Doa Restu</label>
              <textarea
                id="rsvp-message"
                bind:value={rsvpMessage}
                rows="3"
                placeholder="Tuliskan ucapan selamat dan doa untuk kedua mempelai..."
                required
                class="input-custom"
              ></textarea>
            </div>

            <button type="submit" class="btn-submit-rsvp">
              <span>Kirim Konfirmasi &amp; Doa</span>
              <span>💌</span>
            </button>
          </form>
        {/if}
      </div>

      <!-- Live Wishes Feed -->
      {#if invitation.wishes && invitation.wishes.length > 0}
        <div class="wishes-feed-card">
          <h4 class="wishes-title">
            <span>Untaian Doa &amp; Harapan ({invitation.wishes.length})</span>
          </h4>

          <div class="wishes-list">
            {#each invitation.wishes as wish}
              <div class="wish-item">
                <div class="wish-header">
                  <span class="wish-author">{wish.name}</span>
                  <span class="wish-badge {wish.attendance === 'hadir' ? 'badge-hadir' : 'badge-absen'}">
                    {wish.attendance === 'hadir' ? '✓ Hadir' : 'Berhalangan'}
                  </span>
                </div>
                <p class="wish-message">{wish.message}</p>
                <span class="wish-time">{wish.createdAt}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </section>

    <!-- SECTION: CLOSING / TERIMA KASIH -->
    <footer class="invite-footer">
      <div class="footer-floral">🌸 ❦ 🌸</div>
      <p class="footer-thanks">
        Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kami.
      </p>

      <h3 class="footer-couple-names">
        {invitation.couple.groomNickname} &amp; {invitation.couple.brideNickname}
      </h3>
      <p class="footer-family">Beserta Keluarga Besar Kedua Mempelai</p>

      <div class="nikahku-watermark">
        <span>Created with love by</span>
        <strong>💍 Nikahku</strong>
      </div>
    </footer>
  </main>
</div>

<style>
  /* --- Color Palette & Font Styles --- */
  .invitation-wrapper {
    --terracotta: #C9847A;
    --terracotta-dark: #8B5E52;
    --blush: #F5E6E0;
    --sand: #FFF8F6;
    --card-bg: #FFFFFF;
    --text-primary: #2C1810;
    --text-muted: #7A5850;
    --gold: #D4956A;
    --border-soft: #EDD5CE;

    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    color: var(--text-primary);
    background: var(--sand);
    position: relative;
    max-width: 480px;
    margin: 0 auto;
    overflow-x: hidden;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.08);
  }

  /* --- Floating Audio Player --- */
  .floating-audio-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--terracotta-dark);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    z-index: 100;
    transition: transform 0.2s ease;
  }
  .floating-audio-btn:hover {
    transform: scale(1.08);
  }
  .floating-audio-btn.playing .disc-icon {
    animation: spin 3s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Ambient Floating Rose Petals */
  .ambient-petals-wrap {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 99;
    overflow: hidden;
  }
  .falling-petal {
    position: absolute;
    top: -30px;
    background: radial-gradient(circle at 30% 30%, #F5C6BE 0%, #D88E83 60%, #B86B60 100%);
    border-radius: 70% 30% 70% 30% / 60% 40% 60% 40%;
    opacity: 0.65;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.08));
    animation: petalFall linear infinite;
  }
  .p1  { left: 8%;  width: 14px; height: 18px; animation-duration: 9s;  animation-delay: 0s; }
  .p2  { left: 22%; width: 18px; height: 22px; animation-duration: 12s; animation-delay: 2s; }
  .p3  { left: 38%; width: 12px; height: 15px; animation-duration: 8s;  animation-delay: 4s; }
  .p4  { left: 52%; width: 16px; height: 20px; animation-duration: 11s; animation-delay: 1s; }
  .p5  { left: 68%; width: 13px; height: 16px; animation-duration: 10s; animation-delay: 3s; }
  .p6  { left: 82%; width: 17px; height: 21px; animation-duration: 13s; animation-delay: 5s; }
  .p7  { left: 92%; width: 14px; height: 17px; animation-duration: 9.5s; animation-delay: 2.5s; }
  .p8  { left: 15%; width: 15px; height: 19px; animation-duration: 11.5s; animation-delay: 6s; }
  .p9  { left: 45%; width: 11px; height: 14px; animation-duration: 8.5s; animation-delay: 7s; }
  .p10 { left: 75%; width: 16px; height: 20px; animation-duration: 10.5s; animation-delay: 4.5s; }

  @keyframes petalFall {
    0% {
      transform: translateY(0) rotate(0deg) translateX(0);
      opacity: 0;
    }
    10% { opacity: 0.7; }
    90% { opacity: 0.7; }
    100% {
      transform: translateY(105vh) rotate(360deg) translateX(40px);
      opacity: 0;
    }
  }

  /* Swaying Floral Corners */
  .swaying-floral-corner {
    position: fixed;
    z-index: 98;
    pointer-events: none;
    opacity: 0.85;
    animation: gentleSway 6s ease-in-out infinite alternate;
  }
  .corner-top-left {
    top: -20px;
    left: -20px;
    transform-origin: top left;
  }
  .corner-bottom-right {
    bottom: -20px;
    right: -20px;
    transform-origin: bottom right;
    transform: rotate(180deg);
  }
  .corner-flower-img {
    width: 140px;
    height: auto;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.12));
  }
  @keyframes gentleSway {
    0% { transform: rotate(0deg) scale(1); }
    100% { transform: rotate(4deg) scale(1.02); }
  }

  /* Gate Doors */
  .gate-door {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    z-index: 1;
    overflow: hidden;
    transition: transform 1.2s cubic-bezier(0.77, 0, 0.175, 1);
  }
  .gate-door-left {
    left: 0;
    transform: translateX(0);
  }
  .gate-door-right {
    right: 0;
    transform: translateX(0);
  }
  .gate-unlocked .gate-door-left {
    transform: translateX(-101%);
  }
  .gate-unlocked .gate-door-right {
    transform: translateX(101%);
  }
  .door-bg-image {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 200%;
    background-size: cover;
    background-position: center;
    opacity: 0.45;
  }
  .gate-door-left .door-bg-image {
    left: 0;
  }
  .gate-door-right .door-bg-image {
    right: 0;
  }
  .door-gradient-tint {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255, 248, 246, 0.5) 0%, rgba(245, 230, 224, 0.88) 100%);
  }
  .door-border-trim {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, transparent, rgba(201, 132, 122, 0.6), transparent);
  }
  .left-trim { right: 0; }
  .right-trim { left: 0; }

  /* Wax Seal on Button */
  .wax-seal-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .wax-seal-pulse-ring {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1px dashed rgba(255, 255, 255, 0.7);
    animation: rotateSlow 8s linear infinite;
  }
  @keyframes rotateSlow {
    to { transform: rotate(360deg); }
  }
  .btn-sparkle-icon {
    font-size: 0.9rem;
    animation: pulseSparkle 2s ease-in-out infinite;
  }
  @keyframes pulseSparkle {
    0%, 100% { opacity: 0.6; transform: scale(0.9); }
    50% { opacity: 1; transform: scale(1.15); }
  }

  /* --- 1. Gate Cover (Fullscreen Overlay) --- */
  .gate-cover {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem 1.5rem;
    position: relative;
    background: radial-gradient(circle at center, #FFF9F7 0%, #F5E6E0 100%);
    transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }
  .gate-wax-seal {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    border: 1.5px solid rgba(255, 255, 255, 0.7);
  }
  .gate-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    width: 100%;
    max-width: 380px;
  }
  .gate-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    letter-spacing: 0.25em;
    color: var(--terracotta-dark);
    text-transform: uppercase;
    font-weight: 600;
  }
  .gate-couple-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2.75rem;
    font-weight: 600;
    line-height: 1.15;
    color: var(--terracotta-dark);
    margin: 0.5rem 0;
  }
  .gate-groom, .gate-bride {
    display: block;
  }
  .gate-ampersand {
    font-style: italic;
    font-size: 1.75rem;
    color: var(--terracotta);
    margin: 0.25rem 0;
    display: block;
  }
  .gate-date {
    font-size: 0.95rem;
    color: var(--text-muted);
    font-weight: 500;
    letter-spacing: 0.05em;
  }
  .gate-guest-box {
    margin-top: 1.5rem;
    padding: 1.25rem 1.5rem;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border-soft);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(139, 94, 82, 0.06);
    width: 100%;
  }
  .gate-guest-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    display: block;
    margin-bottom: 0.4rem;
  }
  .gate-guest-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--terracotta-dark);
    margin: 0 0 0.4rem;
  }
  .gate-guest-note {
    font-size: 0.75rem;
    color: #A88880;
    margin: 0;
  }
  .gate-open-btn {
    margin-top: 1rem;
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.85rem 2rem;
    background: linear-gradient(135deg, var(--terracotta) 0%, var(--terracotta-dark) 100%);
    color: white;
    border: none;
    border-radius: 9999px;
    font-size: 0.95rem;
    font-weight: 600;
    box-shadow: 0 6px 18px rgba(139, 94, 82, 0.25);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .gate-open-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(139, 94, 82, 0.35);
  }

  /* When gate is opened */
  .is-opened .gate-cover {
    min-height: 80vh;
    padding-bottom: 4rem;
  }

  /* --- Main Content Section Styles --- */
  .invitation-main {
    padding: 0 1.25rem 4rem;
  }
  .invite-header {
    text-align: center;
    padding: 3rem 0 2rem;
  }
  .monogram-circle {
    width: 68px;
    height: 68px;
    border: 2px solid var(--terracotta);
    border-radius: 50%;
    margin: 0 auto 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.4rem;
    color: var(--terracotta-dark);
    background: white;
  }
  .monogram-amp {
    font-style: italic;
    font-size: 1rem;
    color: var(--terracotta);
  }
  .invite-header-tagline {
    font-size: 0.85rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .invite-section {
    margin-bottom: 3.5rem;
  }
  .section-title-wrap {
    text-align: center;
    margin-bottom: 2rem;
  }
  .section-subtitle {
    display: block;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--terracotta);
    font-weight: 600;
    margin-bottom: 0.3rem;
  }
  .section-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2rem;
    color: var(--terracotta-dark);
    margin: 0;
  }
  .title-divider {
    width: 48px;
    height: 2px;
    background: var(--terracotta);
    margin: 0.75rem auto 1rem;
    border-radius: 2px;
  }
  .section-intro {
    font-size: 0.88rem;
    line-height: 1.6;
    color: var(--text-muted);
    max-width: 380px;
    margin: 0 auto;
  }

  /* --- Quote Card --- */
  .quote-card {
    background: white;
    border-radius: 16px;
    padding: 2rem 1.5rem;
    text-align: center;
    border: 1px solid var(--border-soft);
    box-shadow: 0 4px 16px rgba(139, 94, 82, 0.04);
  }
  .quote-ornament {
    font-size: 1rem;
    color: var(--terracotta);
    margin-bottom: 1rem;
  }
  .quote-text {
    font-style: italic;
    font-size: 0.92rem;
    line-height: 1.7;
    color: var(--text-primary);
    margin: 0 0 1rem;
  }
  .quote-source {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--terracotta-dark);
    letter-spacing: 0.05em;
  }

  /* --- Mempelai (Couple) --- */
  .couple-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .couple-card {
    background: white;
    border-radius: 16px;
    padding: 2rem 1.5rem;
    text-align: center;
    border: 1px solid var(--border-soft);
    box-shadow: 0 4px 16px rgba(139, 94, 82, 0.04);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .couple-avatar-wrap {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 3px solid var(--terracotta);
    padding: 3px;
    margin-bottom: 1rem;
    overflow: hidden;
  }
  .couple-avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  .couple-avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--blush);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.25rem;
  }
  .couple-full-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.35rem;
    color: var(--terracotta-dark);
    margin: 0 0 0.5rem;
  }
  .couple-parents {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0 0 1rem;
    line-height: 1.5;
  }
  .instagram-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.85rem;
    border-radius: 9999px;
    background: var(--sand);
    border: 1px solid var(--border-soft);
    font-size: 0.8rem;
    color: var(--terracotta-dark);
    text-decoration: none;
    font-weight: 500;
  }
  .couple-center-ampersand {
    display: flex;
    justify-content: center;
    margin: -0.5rem 0;
  }
  .ampersand-badge {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--terracotta);
    color: white;
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(201, 132, 122, 0.3);
  }

  /* --- Countdown --- */
  .countdown-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }
  .countdown-unit {
    background: white;
    border: 1px solid var(--border-soft);
    border-radius: 12px;
    padding: 0.65rem 0.85rem;
    text-align: center;
    min-width: 60px;
  }
  .countdown-num {
    display: block;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--terracotta-dark);
  }
  .countdown-lbl {
    font-size: 0.7rem;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .countdown-sep {
    font-weight: 700;
    color: var(--terracotta);
    font-size: 1.25rem;
  }

  /* --- Event Cards --- */
  .events-cards-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .event-card {
    background: white;
    border: 1px solid var(--border-soft);
    border-radius: 16px;
    padding: 1.75rem 1.5rem;
    text-align: center;
    box-shadow: 0 4px 16px rgba(139, 94, 82, 0.04);
  }
  .event-card-highlight {
    border-color: var(--terracotta);
    background: radial-gradient(circle at top, #FFFBF9 0%, #FFFFFF 100%);
  }
  .event-icon-badge {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }
  .event-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.35rem;
    color: var(--terracotta-dark);
    margin: 0 0 0.5rem;
  }
  .event-date-text {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--terracotta);
    margin: 0 0 0.25rem;
  }
  .event-time-text {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0 0 1.25rem;
  }
  .event-venue-box {
    background: var(--sand);
    border-radius: 10px;
    padding: 0.85rem 1rem;
    margin-bottom: 1.25rem;
  }
  .venue-name {
    display: block;
    font-size: 0.95rem;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }
  .venue-address {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.4;
  }
  .btn-event-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--terracotta-dark);
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 600;
  }

  /* --- Timeline Story --- */
  .timeline-wrap {
    position: relative;
    padding-left: 2rem;
  }
  .timeline-wrap::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 10px;
    bottom: 10px;
    width: 2px;
    background: var(--border-soft);
  }
  .timeline-item {
    position: relative;
    margin-bottom: 1.5rem;
  }
  .timeline-dot {
    position: absolute;
    left: -2rem;
    top: 6px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--terracotta);
    border: 3px solid white;
    box-shadow: 0 0 0 2px var(--terracotta);
  }
  .timeline-bubble {
    background: white;
    border: 1px solid var(--border-soft);
    border-radius: 12px;
    padding: 1rem 1.25rem;
  }
  .timeline-year {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--terracotta);
    background: var(--sand);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    margin-bottom: 0.35rem;
  }
  .timeline-item-title {
    font-size: 1rem;
    color: var(--terracotta-dark);
    margin: 0 0 0.35rem;
  }
  .timeline-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.5;
  }

  /* --- Gallery --- */
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  .gallery-item-wrap {
    aspect-ratio: 4/5;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
  .gallery-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  .gallery-photo:hover {
    transform: scale(1.04);
  }

  /* --- Digital Gift Cards --- */
  .gift-cards-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .bank-card {
    background: linear-gradient(135deg, #3C241E 0%, #25140F 100%);
    color: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 6px 18px rgba(44, 24, 16, 0.2);
    position: relative;
    overflow: hidden;
  }
  .bank-chip {
    width: 36px;
    height: 26px;
    border-radius: 4px;
    background: linear-gradient(135deg, #E5C07B 0%, #C99700 100%);
    margin-bottom: 1.25rem;
  }
  .bank-info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
  }
  .bank-name {
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .bank-holder {
    color: rgba(255, 255, 255, 0.75);
  }
  .bank-acc-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .acc-number {
    font-family: monospace;
    font-size: 1.15rem;
    letter-spacing: 0.1em;
  }
  .btn-copy-acc {
    background: rgba(255, 255, 255, 0.18);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
  }
  .btn-copy-acc:hover {
    background: rgba(255, 255, 255, 0.28);
  }

  .address-gift-card {
    background: white;
    border: 1px solid var(--border-soft);
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
  }
  .address-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  .address-header h4 {
    margin: 0;
    font-size: 1rem;
    color: var(--terracotta-dark);
  }
  .address-recipient {
    font-size: 0.88rem;
    margin: 0 0 0.35rem;
  }
  .address-text {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin: 0 0 0.5rem;
    line-height: 1.5;
  }
  .address-phone {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0 0 1rem;
  }
  .btn-copy-address {
    padding: 0.5rem 1rem;
    background: var(--sand);
    border: 1px solid var(--border-soft);
    border-radius: 8px;
    font-size: 0.8rem;
    color: var(--terracotta-dark);
    font-weight: 600;
    cursor: pointer;
  }

  /* --- RSVP & Form --- */
  .rsvp-form-card {
    background: white;
    border: 1px solid var(--border-soft);
    border-radius: 16px;
    padding: 1.75rem 1.5rem;
    box-shadow: 0 4px 16px rgba(139, 94, 82, 0.04);
    margin-bottom: 2rem;
  }
  .rsvp-success-box {
    text-align: center;
    padding: 1.5rem 0.5rem;
  }
  .success-icon {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 0.75rem;
  }
  .rsvp-success-box h3 {
    color: var(--terracotta-dark);
    margin: 0 0 0.5rem;
  }
  .rsvp-success-box p {
    font-size: 0.88rem;
    color: var(--text-muted);
    margin: 0;
  }
  .form-field {
    margin-bottom: 1.25rem;
  }
  .form-field label {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--terracotta-dark);
    margin-bottom: 0.4rem;
  }
  .input-custom {
    width: 100%;
    padding: 0.65rem 0.85rem;
    border-radius: 8px;
    border: 1px solid var(--border-soft);
    background: var(--sand);
    font-family: inherit;
    font-size: 0.9rem;
    color: var(--text-primary);
    box-sizing: border-box;
  }
  .input-custom:focus {
    outline: none;
    border-color: var(--terracotta);
    background: white;
  }
  .attendance-radio-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .radio-pill {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.65rem 0.5rem;
    border-radius: 8px;
    border: 1px solid var(--border-soft);
    background: var(--sand);
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
  }
  .radio-pill input {
    display: none;
  }
  .radio-pill.active {
    background: var(--terracotta);
    border-color: var(--terracotta);
    color: white;
  }
  .btn-submit-rsvp {
    width: 100%;
    padding: 0.85rem;
    background: linear-gradient(135deg, var(--terracotta) 0%, var(--terracotta-dark) 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    box-shadow: 0 4px 14px rgba(139, 94, 82, 0.2);
  }

  /* --- Wishes Feed --- */
  .wishes-feed-card {
    background: white;
    border: 1px solid var(--border-soft);
    border-radius: 16px;
    padding: 1.5rem;
  }
  .wishes-title {
    font-size: 1rem;
    color: var(--terracotta-dark);
    margin: 0 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-soft);
  }
  .wishes-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 380px;
    overflow-y: auto;
    padding-right: 0.25rem;
  }
  .wish-item {
    background: var(--sand);
    border-radius: 10px;
    padding: 0.85rem 1rem;
  }
  .wish-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
  }
  .wish-author {
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--terracotta-dark);
  }
  .wish-badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    font-weight: 600;
  }
  .badge-hadir {
    background: #EBF7F1;
    color: #4A8C6A;
  }
  .badge-absen {
    background: #FDEAEB;
    color: #C0565A;
  }
  .wish-message {
    font-size: 0.82rem;
    color: var(--text-primary);
    margin: 0 0 0.35rem;
    line-height: 1.45;
  }
  .wish-time {
    font-size: 0.7rem;
    color: #A88880;
  }

  /* --- Footer --- */
  .invite-footer {
    text-align: center;
    padding-top: 2rem;
  }
  .footer-floral {
    font-size: 1.15rem;
    color: var(--terracotta);
    margin-bottom: 1rem;
  }
  .footer-thanks {
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.6;
    margin: 0 0 1.5rem;
  }
  .footer-couple-names {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.5rem;
    color: var(--terracotta-dark);
    margin: 0 0 0.25rem;
  }
  .footer-family {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0 0 2rem;
  }
  .nikahku-watermark {
    font-size: 0.75rem;
    color: #A88880;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
  }
</style>
