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

  let isOpen = $state(false);
  let isPlaying = $state(false);
  let audioRef = $state<HTMLAudioElement | null>(null);
  let copiedBankIndex = $state<number | null>(null);
  let copiedAddress = $state(false);
  let activeNav = $state<'cover' | 'couple' | 'events' | 'story' | 'gallery' | 'rsvp' | 'gift'>('cover');

  let rsvpAttendance = $state<'hadir' | 'tidak_hadir'>('hadir');
  let rsvpGuestCount = $state(2);
  let rsvpSenderName = $state('');
  let rsvpMessage = $state('');
  let rsvpSubmitted = $state(false);

  $effect(() => {
    if (guestName && guestName !== 'Tamu Spesial') {
      rsvpSenderName = guestName;
    }
  });

  // Countdown timer
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

    const handleScroll = () => {
      const sections = ['cover', 'couple', 'events', 'story', 'gallery', 'rsvp', 'gift'] as const;
      const scrollPos = window.scrollY + 250;

      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = sections[i];
        const el = document.getElementById(`em-${sec}-section`);
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

    setTimeout(() => {
      const coupleEl = document.getElementById('em-couple-section');
      if (coupleEl) {
        coupleEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 200);
  }

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(`em-${sectionId}-section`);
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

  const coverCouplePhoto = $derived(
    invitation.cover.coverPhoto ||
    invitation.couple.groomPhoto ||
    invitation.couple.bridePhoto ||
    '/images/themes/botanical-arch-real.jpg'
  );
</script>

<div class="emerald-wrapper {isOpen ? 'is-opened' : 'is-closed'}">
  <!-- Subtle Botanical Paper Texture -->
  <div class="botanical-paper-texture" aria-hidden="true"></div>

  <!-- Audio Player -->
  {#if resolvedMusicUrl}
    <audio
      bind:this={audioRef}
      src={resolvedMusicUrl}
      loop
      preload="auto"
    ></audio>

    <button
      class="floating-audio-btn {isPlaying ? 'playing' : 'paused'}"
      onclick={toggleAudio}
      title={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
      aria-label={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
    >
      <div class="disc-vinyl">
        <div class="disc-center-label">
          <span>🌿</span>
        </div>
      </div>
    </button>
  {/if}

  <!-- ============================================== -->
  <!-- 1. HERO COVER (MATCH IMAGE 2: RENITA & YUSRIN) -->
  <!-- ============================================== -->
  <section id="em-cover-section" class="emerald-cover-hero {isOpen ? 'cover-opened' : ''}">
    <!-- Botanical Photo Background -->
    <div class="em-cover-floral-bg" aria-hidden="true"></div>
    <div class="em-cover-floral-top" aria-hidden="true"></div>
    <div class="emerald-hero-inner">
      <div class="botanical-crest-icon" aria-hidden="true">🌿 ❦ 🌿</div>
      <div class="cover-eyebrow">WEDDING INVITATION</div>

      <!-- Arched Dome Frame with Botanical Border -->
      <div class="emerald-arch-container">
        <div class="emerald-arch-frame">
          <img
            src={coverCouplePhoto}
            alt="{invitation.couple.groomNickname} & {invitation.couple.brideNickname}"
            class="emerald-arch-img"
          />
          <div class="emerald-arch-tint"></div>
        </div>
      </div>

      <!-- Couple Names in Clean Serif -->
      <h1 class="emerald-couple-heading">
        <span class="em-groom">{invitation.couple.groomNickname}</span>
        <span class="em-amp">&amp;</span>
        <span class="em-bride">{invitation.couple.brideNickname}</span>
      </h1>

      <p class="emerald-date-badge">
        {formatDateID(invitation.events.resepsi.date || invitation.events.akad.date)}
      </p>

      <!-- Countdown Pills Sage -->
      <div class="emerald-countdown-pills">
        <div class="em-pill">
          <span class="pill-val">{days}</span>
          <span class="pill-lbl">Hari</span>
        </div>
        <div class="em-pill">
          <span class="pill-val">{hours}</span>
          <span class="pill-lbl">Jam</span>
        </div>
        <div class="em-pill">
          <span class="pill-val">{minutes}</span>
          <span class="pill-lbl">Menit</span>
        </div>
        <div class="em-pill">
          <span class="pill-val">{seconds}</span>
          <span class="pill-lbl">Detik</span>
        </div>
      </div>

      <!-- Guest Card -->
      <div class="emerald-guest-card">
        <span class="guest-card-label">Kepada Yth. Bapak/Ibu/Saudara/i:</span>
        <h2 class="guest-card-name">{guestName}</h2>
        <span class="guest-card-hint">Tanpa mengurangi rasa hormat, kami mengundang Anda untuk hadir</span>

        <button class="btn-emerald-open" onclick={handleOpenInvitation}>
          <span>🌿 Buka Undangan</span>
        </button>
      </div>
    </div>
  </section>

  <!-- ============================================== -->
  <!-- MAIN SCROLLABLE CONTENT                        -->
  <!-- ============================================== -->
  <main class="emerald-main-content">
    <!-- Basmalah & Salam -->
    <section class="em-section text-center">
      <div class="em-paper-card">
        <div class="arabic-basmalah" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
        <h3 class="salam-title">Assalamu’alaikum Warahmatullahi Wabarakatuh</h3>
        <p class="salam-text">
          Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Dengan memohon rahmat dan ridho-Nya, kami bermaksud melangsungkan pernikahan:
        </p>

        {#if invitation.quote.enabled && invitation.quote.text}
          <div class="em-quote-box">
            <p class="em-quote-text">"{invitation.quote.text}"</p>
            <span class="em-quote-source">— {invitation.quote.source || 'QS. Ar-Rum: 21'} —</span>
          </div>
        {/if}
      </div>
    </section>

    <!-- Couple Profiles -->
    <section id="em-couple-section" class="em-section">
      <div class="em-title-wrap text-center">
        <span class="em-eyebrow">Dua Insan Menuju Ridho-Nya</span>
        <h2 class="em-script-title">Kedua Mempelai</h2>
        <div class="em-divider">🌿</div>
      </div>

      <div class="em-couple-list">
        <!-- Bride -->
        <div class="em-profile-card">
          <div class="em-portrait-arch">
            {#if invitation.couple.bridePhoto}
              <img src={invitation.couple.bridePhoto} alt={invitation.couple.brideFullName} class="em-portrait-img" />
            {:else}
              <div class="em-portrait-placeholder">👰</div>
            {/if}
          </div>
          <h3 class="em-profile-name">{invitation.couple.brideFullName}</h3>
          <span class="em-profile-nick">({invitation.couple.brideNickname})</span>
          <p class="em-parents">{invitation.couple.brideParents}</p>

          {#if invitation.couple.brideInstagram}
            <a
              href="https://instagram.com/{invitation.couple.brideInstagram.replace('@', '')}"
              target="_blank"
              rel="noopener noreferrer"
              class="em-insta-pill"
            >
              <span>📷 @{invitation.couple.brideInstagram.replace('@', '')}</span>
            </a>
          {/if}
        </div>

        <div class="em-monogram-center">
          <div class="em-monogram-circle">&amp;</div>
        </div>

        <!-- Groom -->
        <div class="em-profile-card">
          <div class="em-portrait-arch">
            {#if invitation.couple.groomPhoto}
              <img src={invitation.couple.groomPhoto} alt={invitation.couple.groomFullName} class="em-portrait-img" />
            {:else}
              <div class="em-portrait-placeholder">🤵</div>
            {/if}
          </div>
          <h3 class="em-profile-name">{invitation.couple.groomFullName}</h3>
          <span class="em-profile-nick">({invitation.couple.groomNickname})</span>
          <p class="em-parents">{invitation.couple.groomParents}</p>

          {#if invitation.couple.groomInstagram}
            <a
              href="https://instagram.com/{invitation.couple.groomInstagram.replace('@', '')}"
              target="_blank"
              rel="noopener noreferrer"
              class="em-insta-pill"
            >
              <span>📷 @{invitation.couple.groomInstagram.replace('@', '')}</span>
            </a>
          {/if}
        </div>
      </div>
    </section>

    <!-- Events Section -->
    <section id="em-events-section" class="em-section">
      <div class="em-title-wrap text-center">
        <span class="em-eyebrow">SAVE THE DATE</span>
        <h2 class="em-script-title">Rangkaian Acara</h2>
        <div class="em-divider">❦</div>
      </div>

      <div class="em-event-stack">
        {#if invitation.events.akad.enabled}
          <div class="em-event-card">
            <span class="em-event-icon">💍</span>
            <h3 class="em-event-heading">{invitation.events.akad.title || 'Akad Nikah'}</h3>
            <p class="em-event-date">{formatDateID(invitation.events.akad.date)}</p>
            <span class="em-event-time">Pukul {invitation.events.akad.startTime} - {invitation.events.akad.endTime} WIB</span>
            
            <div class="em-event-loc">
              <strong>{invitation.events.akad.venueName}</strong>
              <p>{invitation.events.akad.venueAddress}</p>
            </div>

            <div class="em-event-links">
              {#if invitation.events.akad.mapsUrl}
                <a href={invitation.events.akad.mapsUrl} target="_blank" rel="noopener noreferrer" class="em-btn-action">
                  📍 Buka Google Maps
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
                  class="em-btn-action-alt"
                >
                  🗓️ Simpan ke Kalender
                </a>
              {/if}
            </div>
          </div>
        {/if}

        {#if invitation.events.resepsi.enabled}
          <div class="em-event-card highlight">
            <span class="em-event-icon">🥂</span>
            <h3 class="em-event-heading">{invitation.events.resepsi.title || 'Resepsi Pernikahan'}</h3>
            <p class="em-event-date">{formatDateID(invitation.events.resepsi.date)}</p>
            <span class="em-event-time">Pukul {invitation.events.resepsi.startTime} - {invitation.events.resepsi.endTime} WIB</span>
            
            <div class="em-event-loc">
              <strong>{invitation.events.resepsi.venueName}</strong>
              <p>{invitation.events.resepsi.venueAddress}</p>
            </div>

            <div class="em-event-links">
              {#if invitation.events.resepsi.mapsUrl}
                <a href={invitation.events.resepsi.mapsUrl} target="_blank" rel="noopener noreferrer" class="em-btn-action">
                  📍 Buka Google Maps
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
                  class="em-btn-action-alt"
                >
                  🗓️ Simpan ke Kalender
                </a>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </section>

    <!-- Dress Code -->
    <section class="em-section text-center">
      <div class="em-paper-card">
        <span class="em-eyebrow">DRESS CODE</span>
        <h3 class="dress-title">Nuansa Busana</h3>
        <p class="dress-desc">Warna pakaian yang disarankan demi keindahan dokumentasi:</p>
        <div class="em-swatches-row">
          <div class="swatch-item">
            <span class="swatch-circle" style="background: #4F6D58;"></span>
            <span class="swatch-lbl">Sage Green</span>
          </div>
          <div class="swatch-item">
            <span class="swatch-circle" style="background: #2E4A35;"></span>
            <span class="swatch-lbl">Forest</span>
          </div>
          <div class="swatch-item">
            <span class="swatch-circle" style="background: #D9D2C7;"></span>
            <span class="swatch-lbl">Champagne</span>
          </div>
          <div class="swatch-item">
            <span class="swatch-circle" style="background: #8F7D6B;"></span>
            <span class="swatch-lbl">Warm Taupe</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Story -->
    {#if invitation.loveStory.enabled && invitation.loveStory.stories.length > 0}
      <section id="em-story-section" class="em-section">
        <div class="em-title-wrap text-center">
          <span class="em-eyebrow">OUR STORY</span>
          <h2 class="em-script-title">Cerita Cinta</h2>
          <div class="em-divider">❦</div>
        </div>

        <div class="em-story-timeline">
          {#each invitation.loveStory.stories as item}
            <div class="em-story-item">
              <span class="em-story-year">{item.year}</span>
              <div class="em-story-content">
                <h4>{item.title}</h4>
                <p>{item.story}</p>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Gallery -->
    {#if invitation.gallery.enabled && invitation.gallery.photos.length > 0}
      <section id="em-gallery-section" class="em-section">
        <div class="em-title-wrap text-center">
          <span class="em-eyebrow">MOMEN KAMI</span>
          <h2 class="em-script-title">Galeri Prewedding</h2>
          <div class="em-divider">📸</div>
        </div>

        <div class="em-gallery-grid">
          {#each invitation.gallery.photos as photo}
            <div class="em-gallery-card">
              <img src={photo} alt="Prewedding" class="em-gallery-img" loading="lazy" />
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Gift -->
    {#if invitation.gift.enabled}
      <section id="em-gift-section" class="em-section">
        <div class="em-title-wrap text-center">
          <span class="em-eyebrow">TANDA KASIH</span>
          <h2 class="em-script-title">Amplop Digital</h2>
          <div class="em-divider">🎁</div>
        </div>

        <div class="em-gift-cards">
          {#each invitation.gift.bankAccounts as acc, i}
            <div class="em-bank-card">
              <div class="bank-top">
                <span class="bank-name">{acc.bank}</span>
                <span class="bank-chip"></span>
              </div>
              <span class="acc-num">{acc.accountNumber}</span>
              <span class="acc-name">a.n {acc.accountHolder}</span>
              <button class="em-btn-copy" onclick={() => copyBank(acc.accountNumber, i)}>
                {copiedBankIndex === i ? '✓ Nomor Tersalin' : 'Salin Nomor Rekening'}
              </button>
            </div>
          {/each}

          {#if invitation.gift.shippingAddress.enabled}
            <div class="em-ship-card">
              <h4>Kirim Kado Fisik</h4>
              <p><strong>Penerima:</strong> {invitation.gift.shippingAddress.recipient}</p>
              <p>{invitation.gift.shippingAddress.address}</p>
              <button
                class="em-btn-copy"
                onclick={() => copyAddress(`${invitation.gift.shippingAddress.recipient} - ${invitation.gift.shippingAddress.address}`)}
              >
                {copiedAddress ? '✓ Alamat Tersalin' : 'Salin Alamat'}
              </button>
            </div>
          {/if}
        </div>
      </section>
    {/if}

    <!-- RSVP -->
    <section id="em-rsvp-section" class="em-section">
      <div class="em-title-wrap text-center">
        <span class="em-eyebrow">KONFIRMASI</span>
        <h2 class="em-script-title">RSVP &amp; Ucapan</h2>
        <div class="em-divider">💌</div>
      </div>

      <div class="em-paper-card">
        {#if rsvpSubmitted}
          <div class="text-center py-6">
            <span class="text-3xl">💌</span>
            <h3 class="font-bold text-lg mt-2">Terima Kasih!</h3>
            <p class="text-sm text-gray-600 mt-1">Konfirmasi dan ucapan Anda telah kami terima.</p>
          </div>
        {:else}
          <form onsubmit={handleFormSubmit} class="em-form">
            <div class="form-group mb-3">
              <label class="em-label" for="em-name">Nama Anda</label>
              <input id="em-name" type="text" bind:value={rsvpSenderName} class="em-input" required />
            </div>

            <div class="form-group mb-3">
              <label class="em-label">Konfirmasi Kehadiran</label>
              <div class="em-pills-row">
                <label class="em-pill-opt {rsvpAttendance === 'hadir' ? 'active' : ''}">
                  <input type="radio" value="hadir" bind:group={rsvpAttendance} />
                  <span>✓ Hadir</span>
                </label>
                <label class="em-pill-opt {rsvpAttendance === 'tidak_hadir' ? 'active' : ''}">
                  <input type="radio" value="tidak_hadir" bind:group={rsvpAttendance} />
                  <span>Berhalangan</span>
                </label>
              </div>
            </div>

            <div class="form-group mb-4">
              <label class="em-label" for="em-msg">Pesan &amp; Doa</label>
              <textarea id="em-msg" bind:value={rsvpMessage} class="em-input" rows="3" required></textarea>
            </div>

            <button type="submit" class="em-btn-submit">Kirim Doa &amp; Konfirmasi</button>
          </form>
        {/if}
      </div>

      <!-- Wishes Stream -->
      {#if invitation.wishes && invitation.wishes.length > 0}
        <div class="em-wishes-list mt-6">
          {#each invitation.wishes as wish}
            <div class="em-wish-bubble">
              <div class="flex justify-between items-center mb-1">
                <strong>{wish.name}</strong>
                <span class="text-xs px-2 py-0.5 rounded {wish.attendance === 'hadir' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                  {wish.attendance === 'hadir' ? 'Hadir' : 'Absen'}
                </span>
              </div>
              <p class="text-sm text-gray-700">{wish.message}</p>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Footer -->
    <footer class="em-footer text-center">
      <div class="em-divider">🌿 ❦ 🌿</div>
      <p class="em-closing-text">
        Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.
      </p>
      <h3 class="em-closing-names">{invitation.couple.groomNickname} &amp; {invitation.couple.brideNickname}</h3>
      <p class="em-closing-sub">Beserta Keluarga Besar</p>
    </footer>
  </main>

  <!-- Floating Bottom Dock Navigation -->
  {#if isOpen}
    <nav class="em-floating-dock" aria-label="Navigasi Undangan">
      <button
        class="em-dock-btn {activeNav === 'cover' ? 'active' : ''}"
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
        class="em-dock-btn {activeNav === 'couple' ? 'active' : ''}"
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
        class="em-dock-btn {activeNav === 'events' ? 'active' : ''}"
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
          class="em-dock-btn {activeNav === 'gallery' || activeNav === 'story' ? 'active' : ''}"
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
        class="em-dock-btn {activeNav === 'rsvp' ? 'active' : ''}"
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
          class="em-dock-btn {activeNav === 'gift' ? 'active' : ''}"
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
</div>

<style>
  .emerald-wrapper {
    --sage-dark: #2E4A35;
    --sage-primary: #4F6D58;
    --sage-light: #88AA95;
    --sage-bg: #F5F7F4;
    --paper-card: #FFFFFF;
    --text-heading: #1C3023;
    --text-body: #344C3D;
    --text-muted: #647B6D;
    --border-sage: #DCE5DF;

    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    color: var(--text-body);
    background: var(--sage-bg);
    position: relative;
    max-width: 480px;
    margin: 0 auto;
    overflow-x: hidden;
    box-shadow: 0 10px 40px rgba(46, 74, 53, 0.12);
    min-height: 100vh;
  }

  .botanical-paper-texture {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(79, 109, 88, 0.05) 1px, transparent 1px);
    background-size: 16px 16px;
    pointer-events: none;
    z-index: 1;
  }

  /* Audio player button */
  .floating-audio-btn {
    position: fixed;
    top: 24px;
    right: max(16px, calc(50% - 224px));
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--sage-dark);
    border: 2px solid #FFFFFF;
    box-shadow: 0 6px 20px rgba(46, 74, 53, 0.3);
    cursor: pointer;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .floating-audio-btn.playing {
    animation: spin 3.5s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Cover */
  .emerald-cover-hero {
    min-height: 100vh;
    padding: 40px 20px 80px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #F9FAF8 0%, #EDF2EE 60%, #DFE7E1 100%);
    text-align: center;
    position: relative;
    z-index: 10;
    overflow: hidden;
  }

  /* Botanical Photo Background Layers */
  .em-cover-floral-bg {
    position: absolute;
    inset: 0;
    background-image: url('/images/themes/botanical-arch-real.jpg');
    background-size: cover;
    background-position: center;
    opacity: 0.09;
    pointer-events: none;
    z-index: 0;
    filter: saturate(1.3) hue-rotate(-10deg);
  }
  .em-cover-floral-top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 300px;
    background-image: url('/wedding-floral-arch.jpg');
    background-size: cover;
    background-position: center top;
    opacity: 0.15;
    pointer-events: none;
    z-index: 0;
    filter: hue-rotate(100deg) saturate(0.8) brightness(0.85);
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
  }

  .emerald-hero-inner {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .botanical-crest-icon {
    font-size: 18px;
    color: var(--sage-primary);
    margin-bottom: 8px;
  }

  .cover-eyebrow {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.28em;
    color: var(--sage-dark);
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .emerald-arch-container {
    width: 250px;
    height: 320px;
    border-radius: 125px 125px 24px 24px;
    overflow: hidden;
    border: 4px solid #FFFFFF;
    box-shadow: 0 12px 36px rgba(46, 74, 53, 0.2);
    position: relative;
    margin-bottom: 24px;
    background: #DCE5DF;
  }

  .emerald-arch-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 25%;
  }

  .emerald-couple-heading {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    color: var(--text-heading);
    letter-spacing: 0.08em;
    font-weight: 700;
    text-transform: uppercase;
    margin: 8px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .em-amp {
    font-family: 'Alex Brush', cursive;
    font-size: 32px;
    color: var(--sage-primary);
    font-weight: 400;
  }

  .emerald-date-badge {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    color: var(--sage-dark);
    letter-spacing: 0.1em;
    margin-bottom: 20px;
    font-weight: 600;
  }

  .emerald-countdown-pills {
    display: flex;
    gap: 10px;
    margin-bottom: 28px;
  }

  .em-pill {
    background: var(--sage-dark);
    color: #FFFFFF;
    width: 58px;
    padding: 8px 0;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4px 12px rgba(46, 74, 53, 0.25);
  }

  .em-pill .pill-val {
    font-size: 18px;
    font-weight: 700;
  }

  .em-pill .pill-lbl {
    font-size: 10px;
    text-transform: uppercase;
    opacity: 0.9;
  }

  .emerald-guest-card {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid var(--border-sage);
    border-radius: 20px;
    padding: 24px 20px;
    width: 100%;
    box-shadow: 0 8px 24px rgba(46, 74, 53, 0.08);
  }

  .guest-card-label {
    font-size: 12px;
    color: var(--text-muted);
    display: block;
    margin-bottom: 6px;
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
    margin-bottom: 18px;
  }

  .btn-emerald-open {
    background: var(--sage-primary);
    color: #FFFFFF;
    border: none;
    padding: 12px 28px;
    border-radius: 30px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(79, 109, 88, 0.35);
  }

  /* Main content */
  .emerald-main-content {
    padding-bottom: 120px;
  }

  .em-section {
    padding: 40px 20px;
  }

  .em-paper-card {
    background: var(--paper-card);
    border: 1px solid var(--border-sage);
    border-radius: 20px;
    padding: 28px 20px;
    box-shadow: 0 6px 20px rgba(46, 74, 53, 0.04);
  }

  .arabic-basmalah {
    font-size: 26px;
    color: var(--sage-dark);
    font-family: 'Traditional Arabic', serif;
    margin-bottom: 14px;
  }

  .salam-title {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-heading);
    margin-bottom: 10px;
  }

  .salam-text {
    font-size: 12.5px;
    color: var(--text-body);
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .em-quote-box {
    background: #F0F4F1;
    border-left: 3px solid var(--sage-primary);
    padding: 14px;
    border-radius: 8px;
  }

  .em-quote-text {
    font-size: 12px;
    font-style: italic;
    line-height: 1.6;
    margin: 0 0 6px 0;
  }

  .em-quote-source {
    font-size: 11px;
    font-weight: 600;
    color: var(--sage-dark);
  }

  /* Titles */
  .em-eyebrow {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 0.2em;
    color: var(--sage-primary);
    text-transform: uppercase;
    font-weight: 600;
    display: block;
    margin-bottom: 4px;
  }

  .em-script-title {
    font-family: 'Alex Brush', cursive;
    font-size: 40px;
    color: var(--text-heading);
    margin: 0 0 4px 0;
    font-weight: 400;
  }

  .em-divider {
    color: var(--sage-primary);
    font-size: 14px;
    margin-bottom: 24px;
  }

  /* Couple */
  .em-couple-list {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .em-profile-card {
    background: var(--paper-card);
    border: 1px solid var(--border-sage);
    border-radius: 24px;
    padding: 28px 20px;
    text-align: center;
    box-shadow: 0 6px 20px rgba(46, 74, 53, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .em-portrait-arch {
    width: 160px;
    height: 210px;
    border-radius: 80px 80px 16px 16px;
    overflow: hidden;
    border: 3px solid #FFFFFF;
    box-shadow: 0 8px 20px rgba(46, 74, 53, 0.15);
    margin-bottom: 16px;
    background: #DCE5DF;
  }

  .em-portrait-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .em-portrait-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 54px;
    background: #E8F0EA;
  }

  .em-profile-name {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-heading);
    margin: 0;
  }

  .em-profile-nick {
    font-family: 'Alex Brush', cursive;
    font-size: 26px;
    color: var(--sage-primary);
    display: block;
    margin-bottom: 6px;
  }

  .em-parents {
    font-size: 12px;
    color: var(--text-muted);
    margin: 0 0 14px 0;
    line-height: 1.5;
  }

  .em-insta-pill {
    padding: 6px 14px;
    background: #F0F4F1;
    color: var(--sage-dark);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
  }

  .em-monogram-center {
    display: flex;
    justify-content: center;
  }

  .em-monogram-circle {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--sage-dark);
    color: #FFFFFF;
    font-family: 'Alex Brush', cursive;
    font-size: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Events */
  .em-event-stack {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .em-event-card {
    background: var(--paper-card);
    border: 1px solid var(--border-sage);
    border-radius: 20px;
    padding: 24px 20px;
    text-align: center;
    box-shadow: 0 6px 20px rgba(46, 74, 53, 0.05);
  }
  .em-event-card.highlight {
    border-color: var(--sage-primary);
  }

  .em-event-icon {
    font-size: 24px;
    display: block;
    margin-bottom: 8px;
  }

  .em-event-heading {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-heading);
    margin: 0 0 6px 0;
  }

  .em-event-date {
    font-weight: 600;
    color: var(--sage-dark);
    font-size: 14px;
    margin: 0;
  }

  .em-event-time {
    font-size: 12px;
    color: var(--text-muted);
    display: block;
    margin-bottom: 12px;
  }

  .em-event-loc strong {
    font-size: 14px;
    color: var(--text-heading);
    display: block;
  }
  .em-event-loc p {
    font-size: 12px;
    color: var(--text-body);
    margin: 4px 0 16px 0;
  }

  .em-event-links {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .em-btn-action {
    background: var(--sage-primary);
    color: #FFFFFF;
    padding: 9px 18px;
    border-radius: 24px;
    font-size: 12.5px;
    font-weight: 600;
    text-decoration: none;
  }

  .em-btn-action-alt {
    background: #E8F0EA;
    color: var(--sage-dark);
    padding: 9px 18px;
    border-radius: 24px;
    font-size: 12.5px;
    font-weight: 600;
    text-decoration: none;
  }

  /* Dress code */
  .dress-title {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-heading);
    margin: 0 0 6px 0;
  }
  .dress-desc {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 16px;
  }
  .em-swatches-row {
    display: flex;
    justify-content: center;
    gap: 14px;
  }
  .swatch-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .swatch-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  .swatch-lbl {
    font-size: 10px;
    color: var(--text-muted);
  }

  /* Story */
  .em-story-timeline {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .em-story-item {
    background: var(--paper-card);
    border: 1px solid var(--border-sage);
    border-radius: 16px;
    padding: 16px;
  }
  .em-story-year {
    display: inline-block;
    background: var(--sage-primary);
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 10px;
    margin-bottom: 6px;
  }
  .em-story-content h4 {
    margin: 0 0 4px 0;
    font-size: 14px;
    color: var(--text-heading);
  }
  .em-story-content p {
    margin: 0;
    font-size: 12px;
    color: var(--text-body);
  }

  /* Gallery */
  .em-gallery-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .em-gallery-card {
    border-radius: 14px;
    overflow: hidden;
    aspect-ratio: 1;
  }
  .em-gallery-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Gift */
  .em-gift-cards {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .em-bank-card, .em-ship-card {
    background: var(--paper-card);
    border: 1px solid var(--border-sage);
    border-radius: 16px;
    padding: 18px;
    text-align: left;
  }
  .bank-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .bank-name {
    font-weight: 700;
    color: var(--sage-dark);
  }
  .bank-chip {
    width: 28px;
    height: 20px;
    background: #C5A059;
    border-radius: 4px;
  }
  .acc-num {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.05em;
    display: block;
  }
  .acc-name {
    font-size: 12px;
    color: var(--text-muted);
    display: block;
    margin-bottom: 12px;
  }
  .em-btn-copy {
    width: 100%;
    padding: 8px;
    background: var(--sage-primary);
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  /* Form */
  .em-form {
    text-align: left;
  }
  .em-label {
    font-size: 12px;
    font-weight: 600;
    display: block;
    margin-bottom: 4px;
    color: var(--text-heading);
  }
  .em-input {
    width: 100%;
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid var(--border-sage);
    background: #F8FAF8;
    font-size: 13px;
    box-sizing: border-box;
  }
  .em-pills-row {
    display: flex;
    gap: 8px;
  }
  .em-pill-opt {
    flex: 1;
    padding: 8px;
    border-radius: 10px;
    border: 1px solid var(--border-sage);
    background: #F8FAF8;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .em-pill-opt input {
    display: none;
  }
  .em-pill-opt.active {
    background: var(--sage-primary);
    color: white;
  }
  .em-btn-submit {
    width: 100%;
    padding: 11px;
    background: var(--sage-dark);
    color: white;
    border: none;
    border-radius: 24px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
  }

  .em-wish-bubble {
    background: var(--paper-card);
    border: 1px solid var(--border-sage);
    border-radius: 14px;
    padding: 12px;
    margin-bottom: 8px;
  }

  /* Footer */
  .em-footer {
    padding: 30px 20px 60px 20px;
  }
  .em-closing-text {
    font-size: 12px;
    line-height: 1.6;
    margin-bottom: 12px;
  }
  .em-closing-names {
    font-family: 'Alex Brush', cursive;
    font-size: 38px;
    color: var(--sage-dark);
    margin: 0;
  }
  .em-closing-sub {
    font-size: 11px;
    color: var(--text-muted);
  }

  /* Floating Dock */
  .em-floating-dock {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 90;
    background: rgba(46, 74, 53, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 40px;
    padding: 6px 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 12px 36px rgba(46, 74, 53, 0.38), 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  .em-dock-btn {
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

  .em-dock-btn .dock-svg {
    transition: transform 0.25s ease;
  }

  .em-dock-btn:hover {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-2px);
  }

  .em-dock-btn:hover .dock-svg {
    transform: scale(1.1);
  }

  .em-dock-btn.active {
    color: #FFFFFF;
    background: rgba(255, 255, 255, 0.32);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.4);
    transform: translateY(-2px) scale(1.05);
  }

  .em-dock-btn.active .dock-svg {
    stroke-width: 2.2;
    transform: scale(1.08);
  }
</style>
