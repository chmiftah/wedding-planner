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
        isPlaying = false;
      });
    }

    setTimeout(() => {
      const mainEl = document.getElementById('emerald-invitation-content');
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

<div class="emerald-theme-wrapper {isOpen ? 'is-opened' : 'is-closed'}">
  <!-- Ambient Floating Botanical Leaves -->
  <div class="ambient-leaves-wrap" aria-hidden="true">
    <div class="falling-leaf l1">🍃</div>
    <div class="falling-leaf l2">🌿</div>
    <div class="falling-leaf l3">🍃</div>
    <div class="falling-leaf l4">🌱</div>
    <div class="falling-leaf l5">🍃</div>
    <div class="falling-leaf l6">🌿</div>
    <div class="falling-leaf l7">🍃</div>
    <div class="falling-leaf l8">🌱</div>
  </div>

  {#if resolvedMusicUrl}
    <audio
      bind:this={audioRef}
      src={resolvedMusicUrl}
      loop
      preload="auto"
    ></audio>

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

  <!-- GATE COVER -->
  <section class="emerald-gate-cover {isOpen ? 'gate-unlocked' : ''}">
    <!-- Sliding Botanical Gate Doors -->
    <div class="gate-door gate-door-left" aria-hidden="true">
      <div class="door-bg-image" style="background-image: url('/images/themes/botanical-arch-real.jpg');"></div>
      <div class="door-gradient-tint"></div>
      <div class="door-border-trim left-trim"></div>
    </div>
    <div class="gate-door gate-door-right" aria-hidden="true">
      <div class="door-bg-image" style="background-image: url('/images/themes/botanical-arch-real.jpg');"></div>
      <div class="door-gradient-tint"></div>
      <div class="door-border-trim right-trim"></div>
    </div>

    <div class="emerald-gate-content">
      <div class="botanical-leaf-top">🌿 🍃 🌿</div>
      <p class="emerald-tagline">{invitation.cover.title || 'THE WEDDING OF'}</p>

      <h1 class="emerald-gate-couple">
        <span class="em-name">{invitation.couple.groomNickname}</span>
        <span class="em-amp">&amp;</span>
        <span class="em-name">{invitation.couple.brideNickname}</span>
      </h1>

      <p class="emerald-gate-date">
        {formatDateID(invitation.events.resepsi.date || invitation.events.akad.date)}
      </p>

      <div class="emerald-guest-card">
        <span class="guest-lbl">Kepada Yth. Bapak/Ibu/Saudara/i:</span>
        <h3 class="guest-name">{guestName}</h3>
        <span class="guest-sub">Kami mengundang Anda hadir di hari bahagia kami</span>
      </div>

      <button class="emerald-open-btn" onclick={handleOpenInvitation}>
        <div class="wax-seal-wrapper">
          <img src="/images/themes/emerald-wax-seal.jpg" alt="Wax Seal" class="gate-wax-seal" />
          <span class="wax-seal-pulse-ring"></span>
        </div>
        <span>Buka Undangan</span>
        <span class="btn-sparkle-icon">🌿</span>
      </button>
    </div>
  </section>

  <!-- MAIN CONTENT -->
  <main id="emerald-invitation-content" class="emerald-main-content">
    <header class="emerald-header">
      <div class="emerald-wreath">
        <span>{invitation.couple.groomNickname.charAt(0)}</span>
        <span class="wreath-amp">&amp;</span>
        <span>{invitation.couple.brideNickname.charAt(0)}</span>
      </div>
      <p class="emerald-subheading">Walimatul Ursy</p>
    </header>

    <!-- QUOTE -->
    {#if invitation.quote.enabled && invitation.quote.text}
      <section class="em-section">
        <div class="em-card quote-card">
          <div class="em-ornament">🌱</div>
          <p class="em-quote-text">"{invitation.quote.text}"</p>
          <span class="em-quote-src">— {invitation.quote.source} —</span>
        </div>
      </section>
    {/if}

    <!-- THE COUPLE -->
    <section class="em-section">
      <div class="em-section-head">
        <span class="em-pre-title">Mempelai Berbahagia</span>
        <h2 class="em-title">Pengantin</h2>
        <div class="em-leaf-divider">🍃 🍃 🍃</div>
      </div>

      <div class="em-couple-grid">
        <div class="em-card couple-card">
          <div class="em-avatar-circle">
            {#if invitation.couple.groomPhoto}
              <img src={invitation.couple.groomPhoto} alt={invitation.couple.groomFullName} class="em-avatar-img" />
            {:else}
              <div class="em-avatar-placeholder">🤵</div>
            {/if}
          </div>
          <h3 class="em-full-name">{invitation.couple.groomFullName}</h3>
          <p class="em-parents">{invitation.couple.groomParents}</p>
          {#if invitation.couple.groomInstagram}
            <a href="https://instagram.com/{invitation.couple.groomInstagram.replace('@', '')}" target="_blank" rel="noopener noreferrer" class="em-ig-pill">
              📷 @{invitation.couple.groomInstagram.replace('@', '')}
            </a>
          {/if}
        </div>

        <div class="em-ampersand-bridge">&amp;</div>

        <div class="em-card couple-card">
          <div class="em-avatar-circle">
            {#if invitation.couple.bridePhoto}
              <img src={invitation.couple.bridePhoto} alt={invitation.couple.brideFullName} class="em-avatar-img" />
            {:else}
              <div class="em-avatar-placeholder">👰</div>
            {/if}
          </div>
          <h3 class="em-full-name">{invitation.couple.brideFullName}</h3>
          <p class="em-parents">{invitation.couple.brideParents}</p>
          {#if invitation.couple.brideInstagram}
            <a href="https://instagram.com/{invitation.couple.brideInstagram.replace('@', '')}" target="_blank" rel="noopener noreferrer" class="em-ig-pill">
              📷 @{invitation.couple.brideInstagram.replace('@', '')}
            </a>
          {/if}
        </div>
      </div>
    </section>

    <!-- EVENTS -->
    <section class="em-section">
      <div class="em-section-head">
        <span class="em-pre-title">Waktu &amp; Tempat</span>
        <h2 class="em-title">Rangkaian Acara</h2>
        <div class="em-leaf-divider">🍃 🍃 🍃</div>
      </div>

      <!-- Countdown -->
      <div class="em-countdown">
        <div class="em-count-box">
          <span class="em-count-val">{days}</span>
          <span class="em-count-lbl">Hari</span>
        </div>
        <div class="em-count-box">
          <span class="em-count-val">{hours}</span>
          <span class="em-count-lbl">Jam</span>
        </div>
        <div class="em-count-box">
          <span class="em-count-val">{minutes}</span>
          <span class="em-count-lbl">Menit</span>
        </div>
        <div class="em-count-box">
          <span class="em-count-val">{seconds}</span>
          <span class="em-count-lbl">Detik</span>
        </div>
      </div>

      <div class="em-events-stack">
        {#if invitation.events.akad.enabled}
          <div class="em-card event-card">
            <span class="em-event-badge">🌿 {invitation.events.akad.title}</span>
            <p class="em-event-date">{formatDateID(invitation.events.akad.date)}</p>
            <p class="em-event-time">Pukul {invitation.events.akad.startTime} - {invitation.events.akad.endTime}</p>

            <div class="em-venue-box">
              <strong>{invitation.events.akad.venueName}</strong>
              <p>{invitation.events.akad.venueAddress}</p>
            </div>

            {#if invitation.events.akad.mapsUrl}
              <a href={invitation.events.akad.mapsUrl} target="_blank" rel="noopener noreferrer" class="em-btn-action">
                Petunjuk Arah (Maps)
              </a>
            {/if}
          </div>
        {/if}

        {#if invitation.events.resepsi.enabled}
          <div class="em-card event-card em-card-highlight">
            <span class="em-event-badge">🎉 {invitation.events.resepsi.title}</span>
            <p class="em-event-date">{formatDateID(invitation.events.resepsi.date)}</p>
            <p class="em-event-time">Pukul {invitation.events.resepsi.startTime} - {invitation.events.resepsi.endTime}</p>

            <div class="em-venue-box">
              <strong>{invitation.events.resepsi.venueName}</strong>
              <p>{invitation.events.resepsi.venueAddress}</p>
            </div>

            {#if invitation.events.resepsi.mapsUrl}
              <a href={invitation.events.resepsi.mapsUrl} target="_blank" rel="noopener noreferrer" class="em-btn-action">
                Petunjuk Arah (Maps)
              </a>
            {/if}
          </div>
        {/if}
      </div>
    </section>

    <!-- LOVE STORY -->
    {#if invitation.loveStory.enabled && invitation.loveStory.stories.length > 0}
      <section class="em-section">
        <div class="em-section-head">
          <span class="em-pre-title">Kisah Perjalanan</span>
          <h2 class="em-title">Cerita Cinta</h2>
          <div class="em-leaf-divider">🍃 🍃 🍃</div>
        </div>

        <div class="em-story-list">
          {#each invitation.loveStory.stories as item}
            <div class="em-card story-card">
              <span class="story-badge">{item.year}</span>
              <h4 class="story-heading">{item.title}</h4>
              <p class="story-text">{item.story}</p>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- GALLERY -->
    {#if invitation.gallery.enabled && invitation.gallery.photos.length > 0}
      <section class="em-section">
        <div class="em-section-head">
          <span class="em-pre-title">Momen Indah</span>
          <h2 class="em-title">Galeri Foto</h2>
          <div class="em-leaf-divider">🍃 🍃 🍃</div>
        </div>

        <div class="em-gallery-grid">
          {#each invitation.gallery.photos as photo}
            <div class="em-gallery-item">
              <img src={photo} alt="Prewedding" class="em-photo" loading="lazy" />
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- DIGITAL GIFT -->
    {#if invitation.gift.enabled && (invitation.gift.bankAccounts.length > 0 || invitation.gift.shippingAddress.enabled)}
      <section class="em-section">
        <div class="em-section-head">
          <span class="em-pre-title">Tanda Kasih</span>
          <h2 class="em-title">Kado Digital</h2>
          <div class="em-leaf-divider">🍃 🍃 🍃</div>
        </div>

        <div class="em-gift-stack">
          {#each invitation.gift.bankAccounts as acc, i}
            <div class="em-bank-card">
              <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-sm text-emerald">{acc.bank}</span>
                <span class="text-xs text-muted">a.n {acc.accountHolder}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="font-mono text-base font-bold">{acc.accountNumber}</span>
                <button class="em-copy-btn" onclick={() => copyBank(acc.accountNumber, i)}>
                  {copiedBankIndex === i ? '✓ Tersalin' : 'Salin Rekening'}
                </button>
              </div>
            </div>
          {/each}

          {#if invitation.gift.shippingAddress.enabled && invitation.gift.shippingAddress.address}
            <div class="em-card text-center p-4">
              <h4 class="text-sm font-bold text-emerald mb-1">Kirim Kado Fisik</h4>
              <p class="text-xs text-muted mb-2">{invitation.gift.shippingAddress.recipient} - {invitation.gift.shippingAddress.address}</p>
              <button class="em-btn-outline" onclick={() => copyAddress(`${invitation.gift.shippingAddress.recipient} - ${invitation.gift.shippingAddress.address}`)}>
                {copiedAddress ? '✓ Alamat Tersalin' : 'Salin Alamat Lengkap'}
              </button>
            </div>
          {/if}
        </div>
      </section>
    {/if}

    <!-- RSVP & WISHES -->
    <section class="em-section">
      <div class="em-section-head">
        <span class="em-pre-title">Konfirmasi &amp; Doa</span>
        <h2 class="em-title">RSVP</h2>
        <div class="em-leaf-divider">🍃 🍃 🍃</div>
      </div>

      <div class="em-card p-4">
        {#if rsvpSubmitted}
          <div class="text-center py-4">
            <span class="text-3xl block mb-2">🌿</span>
            <h3 class="font-bold text-emerald">Terima Kasih!</h3>
            <p class="text-sm text-muted">Doa restu Anda telah kami terima.</p>
          </div>
        {:else}
          <form onsubmit={handleFormSubmit}>
            <div class="form-group mb-3">
              <label class="form-label text-xs font-bold" for="em-name">Nama Anda</label>
              <input id="em-name" type="text" class="em-input" bind:value={rsvpSenderName} required />
            </div>

            <div class="form-group mb-3">
              <span class="form-label text-xs font-bold block mb-1">Kehadiran</span>
              <div class="grid grid-2 gap-2">
                <label class="em-pill {rsvpAttendance === 'hadir' ? 'active' : ''}">
                  <input type="radio" value="hadir" bind:group={rsvpAttendance} />
                  <span>Hadir</span>
                </label>
                <label class="em-pill {rsvpAttendance === 'tidak_hadir' ? 'active' : ''}">
                  <input type="radio" value="tidak_hadir" bind:group={rsvpAttendance} />
                  <span>Berhalangan</span>
                </label>
              </div>
            </div>

            {#if rsvpAttendance === 'hadir'}
              <div class="form-group mb-3">
                <label class="form-label text-xs font-bold" for="em-cnt">Jumlah Tamu</label>
                <select id="em-cnt" class="em-input" bind:value={rsvpGuestCount}>
                  <option value={1}>1 Orang</option>
                  <option value={2}>2 Orang</option>
                  <option value={3}>3 Orang</option>
                </select>
              </div>
            {/if}

            <div class="form-group mb-4">
              <label class="form-label text-xs font-bold" for="em-msg">Doa &amp; Ucapan</label>
              <textarea id="em-msg" rows="3" class="em-input" bind:value={rsvpMessage} required placeholder="Tuliskan ucapan selamat..."></textarea>
            </div>

            <button type="submit" class="em-submit-btn">
              Kirim Ucapan &amp; RSVP
            </button>
          </form>
        {/if}
      </div>

      <!-- Wishes Feed -->
      {#if invitation.wishes && invitation.wishes.length > 0}
        <div class="em-card mt-4 p-4">
          <h4 class="text-sm font-bold text-emerald mb-3">Doa &amp; Harapan ({invitation.wishes.length})</h4>
          <div class="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {#each invitation.wishes as wish}
              <div class="em-wish-item">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-xs">{wish.name}</span>
                  <span class="text-xs {wish.attendance === 'hadir' ? 'text-success' : 'text-danger'}">
                    {wish.attendance === 'hadir' ? '✓ Hadir' : 'Berhalangan'}
                  </span>
                </div>
                <p class="text-xs text-muted mb-1">{wish.message}</p>
                <span class="text-xs opacity-50">{wish.createdAt}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </section>

    <!-- FOOTER -->
    <footer class="emerald-footer">
      <div class="mb-2">🌿 ❦ 🌿</div>
      <h3 class="em-footer-names">{invitation.couple.groomNickname} &amp; {invitation.couple.brideNickname}</h3>
      <p class="text-xs text-muted mb-4">Beserta Keluarga Besar</p>
      <span class="text-xs text-muted opacity-70">💍 Nikahku Digital Wedding</span>
    </footer>
  </main>
</div>

<style>
  .emerald-theme-wrapper {
    --emerald-dark: #203A2B;
    --emerald: #3B5E48;
    --sage: #6B8E76;
    --sage-light: #EBF2EC;
    --bg-sand: #F7F9F6;
    --border-soft: #D5DFD7;
    --card-white: #FFFFFF;

    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: var(--bg-sand);
    color: #1A261F;
    max-width: 480px;
    margin: 0 auto;
    position: relative;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.08);
    overflow-x: hidden;
  }

  .floating-audio-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--emerald);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    z-index: 100;
  }
  .floating-audio-btn.playing .disc-icon { animation: spin 3s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Ambient Floating Botanical Leaves */
  .ambient-leaves-wrap {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 99;
    overflow: hidden;
  }
  .falling-leaf {
    position: absolute;
    top: -30px;
    font-size: 1.25rem;
    opacity: 0.7;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
    animation: leafFall linear infinite;
  }
  .l1 { left: 10%; animation-duration: 10s; animation-delay: 0s; }
  .l2 { left: 24%; animation-duration: 13s; animation-delay: 2s; }
  .l3 { left: 40%; animation-duration: 9s; animation-delay: 4s; }
  .l4 { left: 55%; animation-duration: 11s; animation-delay: 1s; }
  .l5 { left: 70%; animation-duration: 12s; animation-delay: 3s; }
  .l6 { left: 85%; animation-duration: 14s; animation-delay: 5s; }
  .l7 { left: 32%; animation-duration: 9.5s; animation-delay: 6s; }
  .l8 { left: 78%; animation-duration: 11.5s; animation-delay: 7s; }

  @keyframes leafFall {
    0% {
      transform: translateY(0) rotate(0deg) translateX(0);
      opacity: 0;
    }
    10% { opacity: 0.8; }
    90% { opacity: 0.8; }
    100% {
      transform: translateY(105vh) rotate(360deg) translateX(35px);
      opacity: 0;
    }
  }

  /* Gate Cover */
  .emerald-gate-cover {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    text-align: center;
    background: radial-gradient(circle at center, #FFFFFF 0%, #EBF2EC 100%);
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }
  .emerald-gate-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 380px;
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
    opacity: 0.42;
    filter: saturate(1.1);
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
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(235, 242, 236, 0.88) 100%);
  }
  .door-border-trim {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, transparent, rgba(59, 94, 72, 0.4), transparent);
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
  .gate-wax-seal {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    border: 1.5px solid rgba(255, 255, 255, 0.7);
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
    font-size: 0.95rem;
  }

  .botanical-leaf-top {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  .emerald-tagline {
    font-size: 0.75rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--emerald);
    font-weight: 700;
    margin: 0 0 0.5rem;
  }
  .emerald-gate-couple {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2.75rem;
    color: var(--emerald-dark);
    margin: 0 0 0.5rem;
    line-height: 1.15;
  }
  .em-name { display: block; }
  .em-amp { font-style: italic; font-size: 1.75rem; color: var(--sage); display: block; }
  .emerald-gate-date {
    font-size: 0.95rem;
    color: var(--emerald);
    font-weight: 500;
    margin: 0 0 1.5rem;
  }
  .emerald-guest-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(136, 170, 149, 0.35);
    border-radius: 16px;
    padding: 1.25rem 1.5rem;
    width: 100%;
    max-width: 360px;
    box-shadow: 0 8px 24px rgba(45, 75, 57, 0.1);
    margin-bottom: 1.5rem;
  }
  .guest-lbl { font-size: 0.75rem; text-transform: uppercase; color: var(--sage); display: block; margin-bottom: 0.25rem; font-weight: 600; }
  .guest-name { font-size: 1.25rem; font-weight: 700; color: var(--emerald-dark); margin: 0 0 0.25rem; }
  .guest-sub { font-size: 0.75rem; color: #738A79; }
  .emerald-open-btn {
    padding: 0.85rem 2rem;
    background: linear-gradient(135deg, var(--emerald) 0%, var(--emerald-dark) 100%);
    color: white;
    border: none;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    box-shadow: 0 6px 18px rgba(45, 75, 57, 0.3);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .emerald-open-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(45, 75, 57, 0.4);
  }

  /* Main */
  .emerald-main-content { padding: 0 1.25rem 4rem; }
  .emerald-header { text-align: center; padding: 3rem 0 2rem; }
  .emerald-wreath {
    width: 68px;
    height: 68px;
    border: 2px solid var(--emerald);
    border-radius: 50%;
    margin: 0 auto 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.35rem;
    color: var(--emerald-dark);
    background: white;
  }
  .wreath-amp { font-style: italic; font-size: 0.95rem; color: var(--sage); }
  .emerald-subheading { font-size: 0.85rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--sage); font-weight: 600; margin: 0; }

  .em-section { margin-bottom: 3rem; }
  .em-section-head { text-align: center; margin-bottom: 1.5rem; }
  .em-pre-title { font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--sage); font-weight: 700; display: block; }
  .em-title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.85rem; color: var(--emerald-dark); margin: 0.25rem 0; }
  .em-leaf-divider { font-size: 0.8rem; color: var(--sage); letter-spacing: 0.2em; }

  .em-card {
    background: var(--card-white);
    border: 1px solid var(--border-soft);
    border-radius: 14px;
    padding: 1.5rem;
    box-shadow: 0 4px 16px rgba(45, 75, 57, 0.04);
  }
  .quote-card { text-align: center; }
  .em-ornament { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .em-quote-text { font-style: italic; font-size: 0.9rem; line-height: 1.7; margin: 0 0 0.75rem; }
  .em-quote-src { font-size: 0.8rem; font-weight: 700; color: var(--emerald); }

  /* Couple */
  .em-couple-grid { display: flex; flex-direction: column; gap: 1rem; }
  .couple-card { text-align: center; display: flex; flex-direction: column; align-items: center; }
  .em-avatar-circle { width: 90px; height: 90px; border-radius: 50%; border: 3px solid var(--sage-light); box-shadow: 0 0 0 2px var(--emerald); padding: 2px; margin-bottom: 0.75rem; }
  .em-avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
  .em-avatar-placeholder { width: 100%; height: 100%; border-radius: 50%; background: var(--sage-light); display: flex; align-items: center; justify-content: center; font-size: 2rem; }
  .em-full-name { font-family: 'Playfair Display', Georgia, serif; font-size: 1.3rem; color: var(--emerald-dark); margin: 0 0 0.25rem; }
  .em-parents { font-size: 0.8rem; color: #587060; margin: 0 0 0.75rem; }
  .em-ig-pill { font-size: 0.75rem; color: var(--emerald); text-decoration: none; font-weight: 600; background: var(--sage-light); padding: 0.25rem 0.65rem; border-radius: 9999px; }
  .em-ampersand-bridge { text-align: center; font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 1.5rem; color: var(--emerald); }

  /* Countdown */
  .em-countdown { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem; }
  .em-count-box { background: white; border: 1px solid var(--border-soft); border-radius: 8px; padding: 0.5rem 0.75rem; text-align: center; min-width: 58px; }
  .em-count-val { font-size: 1.35rem; font-weight: 700; color: var(--emerald-dark); display: block; }
  .em-count-lbl { font-size: 0.65rem; text-transform: uppercase; color: var(--sage); }

  /* Events */
  .em-events-stack { display: flex; flex-direction: column; gap: 1rem; }
  .event-card { text-align: center; }
  .em-card-highlight { border-color: var(--emerald); background: radial-gradient(circle at top, #FAFCFA 0%, #FFFFFF 100%); }
  .em-event-badge { display: inline-block; font-size: 0.85rem; font-weight: 700; color: var(--emerald); margin-bottom: 0.5rem; }
  .em-event-date { font-size: 0.95rem; font-weight: 700; color: var(--emerald-dark); margin: 0 0 0.25rem; }
  .em-event-time { font-size: 0.8rem; color: #587060; margin: 0 0 1rem; }
  .em-venue-box { background: var(--sage-light); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem; font-size: 0.85rem; }
  .em-btn-action { display: block; width: 100%; padding: 0.65rem; background: var(--emerald); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.8rem; box-sizing: border-box; }

  /* Story */
  .em-story-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .story-badge { font-size: 0.75rem; font-weight: 700; color: var(--emerald); background: var(--sage-light); padding: 0.15rem 0.5rem; border-radius: 4px; display: inline-block; margin-bottom: 0.25rem; }
  .story-heading { font-size: 0.95rem; color: var(--emerald-dark); margin: 0 0 0.25rem; }
  .story-text { font-size: 0.8rem; color: #587060; margin: 0; line-height: 1.5; }

  /* Gallery */
  .em-gallery-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .em-gallery-item { aspect-ratio: 4/5; border-radius: 8px; overflow: hidden; }
  .em-photo { width: 100%; height: 100%; object-fit: cover; }

  /* Gift */
  .em-gift-stack { display: flex; flex-direction: column; gap: 0.75rem; }
  .em-bank-card { background: white; border: 1px solid var(--border-soft); border-radius: 10px; padding: 1rem 1.25rem; }
  .text-emerald { color: var(--emerald-dark); }
  .em-copy-btn { background: var(--sage-light); color: var(--emerald-dark); border: 1px solid var(--border-soft); border-radius: 6px; padding: 0.35rem 0.75rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
  .em-btn-outline { background: white; border: 1px solid var(--border-soft); border-radius: 6px; padding: 0.4rem 0.8rem; font-size: 0.75rem; font-weight: 600; color: var(--emerald-dark); cursor: pointer; }

  /* Form */
  .em-input { width: 100%; padding: 0.6rem; border: 1px solid var(--border-soft); border-radius: 6px; font-size: 0.85rem; box-sizing: border-box; font-family: inherit; }
  .em-pill { border: 1px solid var(--border-soft); padding: 0.5rem; text-align: center; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
  .em-pill input { display: none; }
  .em-pill.active { background: var(--emerald); color: white; border-color: var(--emerald); }
  .em-submit-btn { width: 100%; padding: 0.75rem; background: var(--emerald); color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; }
  .em-wish-item { background: var(--sage-light); border-radius: 6px; padding: 0.65rem; }

  /* Footer */
  .emerald-footer { text-align: center; padding-top: 2rem; }
  .em-footer-names { font-family: 'Playfair Display', Georgia, serif; font-size: 1.4rem; color: var(--emerald-dark); margin: 0 0 0.25rem; }
</style>
