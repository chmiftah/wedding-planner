<script lang="ts">
  import type { DigitalInvitation } from '#lib/stores/wedding';
  import { onMount } from 'svelte';

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
    return () => clearInterval(timer);
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
      const mainEl = document.getElementById('gold-invitation-content');
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

<div class="gold-theme-wrapper {isOpen ? 'is-opened' : 'is-closed'}">
  {#if invitation.cover.bgMusicUrl}
    <audio
      bind:this={audioRef}
      src={invitation.cover.bgMusicUrl}
      loop
      preload="none"
    ></audio>

    {#if isOpen}
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

  <!-- 1. GATE COVER (ROYAL GOLD) -->
  <section class="gold-gate-cover">
    <div class="gate-border-frame">
      <div class="gate-inner-border">
        <div class="gold-crest">⚜️</div>
        <p class="gate-tagline">{invitation.cover.title || 'THE WEDDING OF'}</p>

        <h1 class="gate-title">
          <span class="gate-name">{invitation.couple.groomNickname}</span>
          <span class="gate-amp">&amp;</span>
          <span class="gate-name">{invitation.couple.brideNickname}</span>
        </h1>

        <div class="gold-divider-ornament">◆ ─── ❖ ─── ◆</div>

        <p class="gate-date">
          {formatDateID(invitation.events.resepsi.date || invitation.events.akad.date)}
        </p>

        <div class="gate-guest-card">
          <span class="guest-invitation-label">Kepada Yth. Bapak/Ibu/Saudara/i:</span>
          <h3 class="guest-name-text">{guestName}</h3>
          <span class="guest-apology">Tanpa mengurangi rasa hormat</span>
        </div>

        <button class="gold-open-btn" onclick={handleOpenInvitation}>
          <span>Buka Undangan</span>
          <span class="btn-arrow">↓</span>
        </button>
      </div>
    </div>
  </section>

  <!-- 2. MAIN CONTENT -->
  <main id="gold-invitation-content" class="gold-main-content">
    <!-- Header Crest -->
    <header class="gold-header">
      <div class="monogram-royal">
        {invitation.couple.groomNickname.charAt(0)} &amp; {invitation.couple.brideNickname.charAt(0)}
      </div>
      <p class="gold-sub-monogram">Walimatul Ursy</p>
    </header>

    <!-- QUOTE -->
    {#if invitation.quote.enabled && invitation.quote.text}
      <section class="gold-section">
        <div class="gold-card quote-box">
          <div class="quote-crest">❖</div>
          <p class="quote-body">"{invitation.quote.text}"</p>
          <p class="quote-author">— {invitation.quote.source} —</p>
        </div>
      </section>
    {/if}

    <!-- THE COUPLE -->
    <section class="gold-section">
      <div class="gold-section-head">
        <span class="gold-pre-title">Mahligai Cinta</span>
        <h2 class="gold-title">Mempelai</h2>
        <div class="gold-line"></div>
      </div>

      <div class="couple-royal-grid">
        <!-- Groom -->
        <div class="gold-card couple-royal-card">
          <div class="avatar-gold-frame">
            {#if invitation.couple.groomPhoto}
              <img src={invitation.couple.groomPhoto} alt={invitation.couple.groomFullName} class="avatar-gold-img" />
            {:else}
              <div class="avatar-fallback">🤵</div>
            {/if}
          </div>
          <h3 class="royal-name">{invitation.couple.groomFullName}</h3>
          <p class="royal-parents">{invitation.couple.groomParents}</p>
          {#if invitation.couple.groomInstagram}
            <a
              href="https://instagram.com/{invitation.couple.groomInstagram.replace('@', '')}"
              target="_blank"
              rel="noopener noreferrer"
              class="royal-ig-link"
            >
              @{invitation.couple.groomInstagram.replace('@', '')}
            </a>
          {/if}
        </div>

        <div class="ampersand-divider">
          <span>&amp;</span>
        </div>

        <!-- Bride -->
        <div class="gold-card couple-royal-card">
          <div class="avatar-gold-frame">
            {#if invitation.couple.bridePhoto}
              <img src={invitation.couple.bridePhoto} alt={invitation.couple.brideFullName} class="avatar-gold-img" />
            {:else}
              <div class="avatar-fallback">👰</div>
            {/if}
          </div>
          <h3 class="royal-name">{invitation.couple.brideFullName}</h3>
          <p class="royal-parents">{invitation.couple.brideParents}</p>
          {#if invitation.couple.brideInstagram}
            <a
              href="https://instagram.com/{invitation.couple.brideInstagram.replace('@', '')}"
              target="_blank"
              rel="noopener noreferrer"
              class="royal-ig-link"
            >
              @{invitation.couple.brideInstagram.replace('@', '')}
            </a>
          {/if}
        </div>
      </div>
    </section>

    <!-- EVENTS -->
    <section class="gold-section">
      <div class="gold-section-head">
        <span class="gold-pre-title">Rangkaian Acara</span>
        <h2 class="gold-title">Waktu &amp; Lokasi</h2>
        <div class="gold-line"></div>
      </div>

      <!-- Countdown -->
      <div class="gold-countdown">
        <div class="count-box">
          <span class="count-val">{days}</span>
          <span class="count-lbl">Hari</span>
        </div>
        <div class="count-box">
          <span class="count-val">{hours}</span>
          <span class="count-lbl">Jam</span>
        </div>
        <div class="count-box">
          <span class="count-val">{minutes}</span>
          <span class="count-lbl">Menit</span>
        </div>
        <div class="count-box">
          <span class="count-val">{seconds}</span>
          <span class="count-lbl">Detik</span>
        </div>
      </div>

      <div class="events-stack">
        {#if invitation.events.akad.enabled}
          <div class="gold-card event-royal-card">
            <h3 class="event-royal-title">{invitation.events.akad.title}</h3>
            <p class="event-royal-date">{formatDateID(invitation.events.akad.date)}</p>
            <p class="event-royal-time">Pukul {invitation.events.akad.startTime} - {invitation.events.akad.endTime}</p>

            <div class="event-royal-venue">
              <strong>{invitation.events.akad.venueName}</strong>
              <p>{invitation.events.akad.venueAddress}</p>
            </div>

            {#if invitation.events.akad.mapsUrl}
              <a href={invitation.events.akad.mapsUrl} target="_blank" rel="noopener noreferrer" class="gold-btn-action">
                Buka Google Maps
              </a>
            {/if}
          </div>
        {/if}

        {#if invitation.events.resepsi.enabled}
          <div class="gold-card event-royal-card highlight-royal">
            <h3 class="event-royal-title">{invitation.events.resepsi.title}</h3>
            <p class="event-royal-date">{formatDateID(invitation.events.resepsi.date)}</p>
            <p class="event-royal-time">Pukul {invitation.events.resepsi.startTime} - {invitation.events.resepsi.endTime}</p>

            <div class="event-royal-venue">
              <strong>{invitation.events.resepsi.venueName}</strong>
              <p>{invitation.events.resepsi.venueAddress}</p>
            </div>

            {#if invitation.events.resepsi.mapsUrl}
              <a href={invitation.events.resepsi.mapsUrl} target="_blank" rel="noopener noreferrer" class="gold-btn-action">
                Buka Google Maps
              </a>
            {/if}
          </div>
        {/if}
      </div>
    </section>

    <!-- LOVE STORY -->
    {#if invitation.loveStory.enabled && invitation.loveStory.stories.length > 0}
      <section class="gold-section">
        <div class="gold-section-head">
          <span class="gold-pre-title">Kisah Cinta</span>
          <h2 class="gold-title">Our Story</h2>
          <div class="gold-line"></div>
        </div>

        <div class="royal-timeline">
          {#each invitation.loveStory.stories as item}
            <div class="royal-story-card gold-card">
              <span class="royal-story-year">{item.year}</span>
              <h4 class="royal-story-title">{item.title}</h4>
              <p class="royal-story-desc">{item.story}</p>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- GALLERY -->
    {#if invitation.gallery.enabled && invitation.gallery.photos.length > 0}
      <section class="gold-section">
        <div class="gold-section-head">
          <span class="gold-pre-title">Galeri Foto</span>
          <h2 class="gold-title">Moments</h2>
          <div class="gold-line"></div>
        </div>

        <div class="royal-gallery-grid">
          {#each invitation.gallery.photos as photo}
            <div class="royal-gallery-item">
              <img src={photo} alt="Prewedding" class="royal-photo" loading="lazy" />
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- DIGITAL GIFT -->
    {#if invitation.gift.enabled && (invitation.gift.bankAccounts.length > 0 || invitation.gift.shippingAddress.enabled)}
      <section class="gold-section">
        <div class="gold-section-head">
          <span class="gold-pre-title">Tanda Kasih</span>
          <h2 class="gold-title">Kado Pernikahan</h2>
          <div class="gold-line"></div>
        </div>

        <div class="gold-gift-stack">
          {#each invitation.gift.bankAccounts as acc, i}
            <div class="gold-bank-card">
              <div class="gold-bank-top">
                <span class="bank-title">{acc.bank}</span>
                <span class="acc-owner">a.n {acc.accountHolder}</span>
              </div>
              <div class="gold-bank-bottom">
                <span class="acc-code">{acc.accountNumber}</span>
                <button class="gold-copy-btn" onclick={() => copyBank(acc.accountNumber, i)}>
                  {copiedBankIndex === i ? '✓ Tersalin' : 'Salin'}
                </button>
              </div>
            </div>
          {/each}

          {#if invitation.gift.shippingAddress.enabled && invitation.gift.shippingAddress.address}
            <div class="gold-card address-box">
              <h4>Kado Fisik</h4>
              <p><strong>Penerima:</strong> {invitation.gift.shippingAddress.recipient}</p>
              <p>{invitation.gift.shippingAddress.address}</p>
              <button class="gold-btn-outline" onclick={() => copyAddress(`${invitation.gift.shippingAddress.recipient} - ${invitation.gift.shippingAddress.address}`)}>
                {copiedAddress ? '✓ Alamat Tersalin' : 'Salin Alamat'}
              </button>
            </div>
          {/if}
        </div>
      </section>
    {/if}

    <!-- RSVP & WISHES -->
    <section class="gold-section">
      <div class="gold-section-head">
        <span class="gold-pre-title">Kehadiran &amp; Doa</span>
        <h2 class="gold-title">RSVP</h2>
        <div class="gold-line"></div>
      </div>

      <div class="gold-card rsvp-box">
        {#if rsvpSubmitted}
          <div class="gold-submitted-view">
            <h3>Terima Kasih Atas Doa Restunya</h3>
            <p>Konfirmasi kehadiran Anda telah tersimpan.</p>
          </div>
        {:else}
          <form onsubmit={handleFormSubmit} class="gold-form">
            <div class="form-group mb-3">
              <label class="form-label" for="g-name">Nama Anda</label>
              <input id="g-name" type="text" class="gold-input" bind:value={rsvpSenderName} required />
            </div>

            <div class="form-group mb-3">
              <span class="form-label block mb-1">Konfirmasi Kehadiran</span>
              <div class="gold-radio-row">
                <label class="gold-radio-pill {rsvpAttendance === 'hadir' ? 'active' : ''}">
                  <input type="radio" value="hadir" bind:group={rsvpAttendance} />
                  <span>Hadir</span>
                </label>
                <label class="gold-radio-pill {rsvpAttendance === 'tidak_hadir' ? 'active' : ''}">
                  <input type="radio" value="tidak_hadir" bind:group={rsvpAttendance} />
                  <span>Berhalangan</span>
                </label>
              </div>
            </div>

            {#if rsvpAttendance === 'hadir'}
              <div class="form-group mb-3">
                <label class="form-label" for="g-count">Jumlah Tamu</label>
                <select id="g-count" class="gold-input" bind:value={rsvpGuestCount}>
                  <option value={1}>1 Orang</option>
                  <option value={2}>2 Orang</option>
                  <option value={3}>3 Orang</option>
                </select>
              </div>
            {/if}

            <div class="form-group mb-4">
              <label class="form-label" for="g-msg">Doa &amp; Ucapan</label>
              <textarea id="g-msg" rows="3" class="gold-input" bind:value={rsvpMessage} required placeholder="Tuliskan ucapan..."></textarea>
            </div>

            <button type="submit" class="gold-btn-submit">
              Kirim Konfirmasi &amp; Doa
            </button>
          </form>
        {/if}
      </div>

      <!-- Wishes Feed -->
      {#if invitation.wishes && invitation.wishes.length > 0}
        <div class="gold-card wishes-royal-feed mt-4">
          <h4 class="wishes-royal-title">Ucapan &amp; Doa ({invitation.wishes.length})</h4>
          <div class="wishes-royal-list">
            {#each invitation.wishes as wish}
              <div class="wish-royal-item">
                <div class="flex justify-between items-center mb-1">
                  <strong>{wish.name}</strong>
                  <span class="text-xs gold-status">{wish.attendance === 'hadir' ? '✓ Hadir' : 'Berhalangan'}</span>
                </div>
                <p class="text-sm">{wish.message}</p>
                <span class="text-xs opacity-60">{wish.createdAt}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </section>

    <!-- FOOTER -->
    <footer class="gold-footer">
      <div class="gold-crest mb-2">⚜️</div>
      <p class="gold-footer-names">{invitation.couple.groomNickname} &amp; {invitation.couple.brideNickname}</p>
      <p class="gold-footer-sub">Beserta Keluarga Besar</p>
      <p class="gold-watermark">💍 Nikahku Digital Wedding</p>
    </footer>
  </main>
</div>

<style>
  .gold-theme-wrapper {
    --gold-main: #C5A059;
    --gold-dark: #8E6D34;
    --bg-dark: #121214;
    --card-dark: #1C1B1F;
    --text-gold-light: #F4EAD4;
    --border-gold: rgba(197, 160, 89, 0.35);

    font-family: 'Playfair Display', Georgia, serif;
    background: var(--bg-dark);
    color: var(--text-gold-light);
    max-width: 480px;
    margin: 0 auto;
    position: relative;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
    overflow-x: hidden;
  }

  .floating-audio-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--gold-main);
    color: var(--bg-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--text-gold-light);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    z-index: 100;
  }
  .floating-audio-btn.playing .disc-icon {
    animation: spin 3s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Gate Cover */
  .gold-gate-cover {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.25rem;
    box-sizing: border-box;
    background: radial-gradient(circle at center, #1E1C24 0%, #121214 100%);
  }
  .gate-border-frame {
    width: 100%;
    border: 1px solid var(--border-gold);
    padding: 6px;
    border-radius: 12px;
  }
  .gate-inner-border {
    border: 1px solid var(--border-gold);
    border-radius: 8px;
    padding: 2.5rem 1.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .gold-crest {
    font-size: 1.5rem;
  }
  .gate-tagline {
    font-size: 0.75rem;
    letter-spacing: 0.25em;
    color: var(--gold-main);
    text-transform: uppercase;
    margin: 0;
  }
  .gate-title {
    font-size: 2.5rem;
    margin: 0.25rem 0;
    line-height: 1.2;
    color: #FFFFFF;
  }
  .gate-amp {
    display: block;
    font-style: italic;
    font-size: 1.6rem;
    color: var(--gold-main);
  }
  .gate-name {
    display: block;
  }
  .gold-divider-ornament {
    color: var(--gold-main);
    font-size: 0.8rem;
    letter-spacing: 0.2em;
  }
  .gate-date {
    font-size: 0.9rem;
    color: #D1D5DB;
    margin: 0;
  }
  .gate-guest-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-gold);
    border-radius: 8px;
    padding: 1.25rem;
    width: 100%;
    margin-top: 0.5rem;
  }
  .guest-invitation-label {
    font-size: 0.75rem;
    color: var(--gold-main);
    display: block;
    margin-bottom: 0.25rem;
  }
  .guest-name-text {
    font-size: 1.25rem;
    color: white;
    margin: 0 0 0.25rem;
  }
  .guest-apology {
    font-size: 0.7rem;
    color: #9CA3AF;
  }
  .gold-open-btn {
    margin-top: 1rem;
    padding: 0.75rem 2rem;
    background: linear-gradient(135deg, var(--gold-main) 0%, var(--gold-dark) 100%);
    color: #121214;
    border: none;
    border-radius: 4px;
    font-weight: 700;
    font-size: 0.9rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Main Content */
  .gold-main-content {
    padding: 2rem 1.25rem 4rem;
  }
  .gold-header {
    text-align: center;
    padding: 2rem 0;
  }
  .monogram-royal {
    font-size: 1.8rem;
    color: var(--gold-main);
    letter-spacing: 0.1em;
  }
  .gold-sub-monogram {
    font-size: 0.8rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #9CA3AF;
  }
  .gold-section {
    margin-bottom: 3.5rem;
  }
  .gold-section-head {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  .gold-pre-title {
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    color: var(--gold-main);
    text-transform: uppercase;
    display: block;
  }
  .gold-title {
    font-size: 1.8rem;
    color: white;
    margin: 0.25rem 0;
  }
  .gold-line {
    width: 40px;
    height: 1px;
    background: var(--gold-main);
    margin: 0.5rem auto 0;
  }

  .gold-card {
    background: var(--card-dark);
    border: 1px solid var(--border-gold);
    border-radius: 8px;
    padding: 1.5rem;
  }
  .quote-box {
    text-align: center;
  }
  .quote-crest {
    color: var(--gold-main);
    margin-bottom: 0.5rem;
  }
  .quote-body {
    font-style: italic;
    line-height: 1.7;
    font-size: 0.9rem;
    margin: 0 0 0.75rem;
  }
  .quote-author {
    font-size: 0.8rem;
    color: var(--gold-main);
    margin: 0;
  }

  /* Couple */
  .couple-royal-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .couple-royal-card {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .avatar-gold-frame {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: 2px solid var(--gold-main);
    padding: 3px;
    margin-bottom: 0.75rem;
  }
  .avatar-gold-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
  .avatar-fallback {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #27272A;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }
  .royal-name {
    font-size: 1.25rem;
    color: white;
    margin: 0 0 0.35rem;
  }
  .royal-parents {
    font-size: 0.8rem;
    color: #9CA3AF;
    margin: 0 0 0.75rem;
  }
  .royal-ig-link {
    color: var(--gold-main);
    font-size: 0.75rem;
    text-decoration: none;
    border-bottom: 1px dashed var(--gold-main);
  }
  .ampersand-divider {
    text-align: center;
    font-size: 1.5rem;
    color: var(--gold-main);
  }

  /* Countdown */
  .gold-countdown {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  .count-box {
    background: var(--card-dark);
    border: 1px solid var(--border-gold);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    text-align: center;
    min-width: 58px;
  }
  .count-val {
    display: block;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--gold-main);
  }
  .count-lbl {
    font-size: 0.65rem;
    text-transform: uppercase;
    color: #9CA3AF;
  }

  /* Events */
  .events-stack {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .event-royal-card {
    text-align: center;
  }
  .event-royal-title {
    font-size: 1.2rem;
    color: var(--gold-main);
    margin: 0 0 0.35rem;
  }
  .event-royal-date {
    font-size: 0.9rem;
    color: white;
    margin: 0 0 0.25rem;
  }
  .event-royal-time {
    font-size: 0.8rem;
    color: #9CA3AF;
    margin: 0 0 1rem;
  }
  .event-royal-venue {
    margin-bottom: 1rem;
    font-size: 0.85rem;
  }
  .gold-btn-action {
    display: block;
    width: 100%;
    padding: 0.65rem;
    background: var(--gold-main);
    color: var(--bg-dark);
    text-align: center;
    text-decoration: none;
    font-weight: 700;
    font-size: 0.8rem;
    border-radius: 4px;
    box-sizing: border-box;
  }

  /* Timeline */
  .royal-timeline {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .royal-story-year {
    color: var(--gold-main);
    font-size: 0.75rem;
    font-weight: 700;
  }
  .royal-story-title {
    margin: 0.25rem 0;
    color: white;
  }
  .royal-story-desc {
    margin: 0;
    font-size: 0.8rem;
    color: #D1D5DB;
    line-height: 1.5;
  }

  /* Gallery */
  .royal-gallery-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .royal-gallery-item {
    aspect-ratio: 4/5;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--border-gold);
  }
  .royal-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Gift */
  .gold-gift-stack {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .gold-bank-card {
    background: #09090B;
    border: 1px solid var(--border-gold);
    border-radius: 8px;
    padding: 1rem 1.25rem;
  }
  .gold-bank-top {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--gold-main);
    margin-bottom: 0.5rem;
  }
  .gold-bank-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .acc-code {
    font-family: monospace;
    font-size: 1.1rem;
    color: white;
  }
  .gold-copy-btn {
    background: var(--gold-main);
    color: var(--bg-dark);
    border: none;
    border-radius: 4px;
    padding: 0.3rem 0.6rem;
    font-weight: 700;
    font-size: 0.75rem;
    cursor: pointer;
  }

  /* Form */
  .gold-input {
    width: 100%;
    padding: 0.6rem;
    background: #09090B;
    border: 1px solid var(--border-gold);
    color: white;
    border-radius: 4px;
    box-sizing: border-box;
    font-family: inherit;
  }
  .gold-radio-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .gold-radio-pill {
    padding: 0.5rem;
    border: 1px solid var(--border-gold);
    text-align: center;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
  }
  .gold-radio-pill input { display: none; }
  .gold-radio-pill.active {
    background: var(--gold-main);
    color: var(--bg-dark);
    font-weight: 700;
  }
  .gold-btn-submit {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, var(--gold-main) 0%, var(--gold-dark) 100%);
    color: var(--bg-dark);
    border: none;
    border-radius: 4px;
    font-weight: 700;
    cursor: pointer;
  }
  .wishes-royal-title {
    color: var(--gold-main);
    margin: 0 0 0.75rem;
    font-size: 0.95rem;
  }
  .wishes-royal-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 300px;
    overflow-y: auto;
  }
  .wish-royal-item {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 4px;
    padding: 0.65rem 0.85rem;
    border-left: 2px solid var(--gold-main);
  }

  /* Footer */
  .gold-footer {
    text-align: center;
    padding-top: 2rem;
  }
  .gold-footer-names {
    font-size: 1.4rem;
    color: white;
    margin: 0 0 0.25rem;
  }
  .gold-footer-sub {
    font-size: 0.8rem;
    color: #9CA3AF;
    margin: 0 0 1.5rem;
  }
  .gold-watermark {
    font-size: 0.75rem;
    color: var(--gold-main);
  }
</style>
