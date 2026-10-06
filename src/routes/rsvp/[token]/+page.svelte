<script lang="ts">
  import { page } from '$app/state';
  import { wedding } from '#lib/stores/wedding';
  import { formatDate } from '#lib/utils/format';

  const token = $derived(page.params.token);
  const guest = $derived($wedding.guests.find(g => g.rsvpToken === token));

  let confirmed = $state<boolean | null>(null);
  let guestCount = $state(1);
  let message = $state('');
  let submitted = $state(false);

  function submit() {
    if (!guest || confirmed === null) return;
    // Update guest in store
    wedding.update(s => ({
      ...s,
      guests: s.guests.map(g =>
        g.rsvpToken === token
          ? {
              ...g,
              rsvpStatus: confirmed ? 'hadir' : 'tidak_hadir',
              guestCount: confirmed ? guestCount : 0,
              rsvpMessage: message,
              rsvpRespondedAt: new Date().toISOString().slice(0, 10),
            }
          : g
      ),
    }));
    submitted = true;
  }
</script>

<svelte:head>
  <title>Konfirmasi Kehadiran — Nikahku</title>
</svelte:head>

<div class="rsvp-page">
  <div class="rsvp-bg">
    <div class="rsvp-blob rsvp-blob-1"></div>
    <div class="rsvp-blob rsvp-blob-2"></div>
  </div>

  <div class="rsvp-container">
    {#if !guest}
      <div class="rsvp-card text-center animate-fade-in">
        <div class="rsvp-emoji">😕</div>
        <h2>Link tidak valid</h2>
        <p class="text-muted mt-2">Link RSVP ini tidak ditemukan atau sudah tidak aktif.</p>
      </div>
    {:else if submitted}
      <div class="rsvp-card text-center animate-scale-in">
        <div class="rsvp-emoji animate-float">
          {confirmed ? '🎉' : '😔'}
        </div>
        <h2 class="text-display mt-4">
          {confirmed ? 'Terima kasih, ' + guest.name + '!' : 'Terima kasih sudah mengabari'}
        </h2>
        <p class="text-muted mt-3 mb-6">
          {#if confirmed}
            Kami sangat senang bisa berbagi momen bahagia ini bersamamu! Sampai jumpa di hari istimewa kami. 💕
          {:else}
            Kami mengerti dan mendoakan yang terbaik untukmu. Terima kasih sudah mengabari kami.
          {/if}
        </p>

        {#if confirmed}
          <div class="confirmation-detail">
            <div class="conf-row">
              <span class="text-muted text-sm">Hadir:</span>
              <span class="font-semibold">{guestCount} orang</span>
            </div>
            {#if $wedding.info.weddingDate}
              <div class="conf-row">
                <span class="text-muted text-sm">Tanggal:</span>
                <span class="font-semibold">{formatDate($wedding.info.weddingDate)}</span>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {:else}
      <div class="rsvp-card animate-fade-in">
        <!-- Invitation Header -->
        <div class="rsvp-invitation-header">
          <div class="rsvp-rings">💍</div>
          <p class="rsvp-inviter text-muted text-sm">Undangan dari</p>
          <h1 class="rsvp-couple-name">
            {$wedding.info.brideName || 'Pengantin'} & {$wedding.info.groomName || 'Pengantin'}
          </h1>
          {#if $wedding.info.weddingDate}
            <div class="rsvp-date-badge">
              📅 {formatDate($wedding.info.weddingDate)}
            </div>
          {/if}
        </div>

        <div class="divider"></div>

        <div class="rsvp-greeting">
          <p class="text-muted">Halo, <strong>{guest.name}</strong>! 👋</p>
          <p class="text-muted text-sm mt-1">
            Kami mengundangmu ke hari istimewa kami. Mohon konfirmasikan kehadiranmu ya.
          </p>
        </div>

        <!-- Confirmation Buttons -->
        <div class="rsvp-confirm-section">
          <p class="form-label mb-3">Apakah kamu bisa hadir? *</p>
          <div class="confirm-choices">
            <button
              class="confirm-btn confirm-yes {confirmed === true ? 'active' : ''}"
              onclick={() => confirmed = true}
            >
              <span class="confirm-icon">✅</span>
              <span>Ya, saya hadir!</span>
            </button>
            <button
              class="confirm-btn confirm-no {confirmed === false ? 'active' : ''}"
              onclick={() => confirmed = false}
            >
              <span class="confirm-icon">😔</span>
              <span>Maaf, tidak bisa hadir</span>
            </button>
          </div>
        </div>

        {#if confirmed === true}
          <div class="rsvp-details animate-fade-in">
            <div class="form-group mb-4">
              <label class="form-label" for="gCount">Berapa orang yang akan hadir (termasuk kamu)?</label>
              <div class="guest-count-picker">
                <button class="count-btn" onclick={() => guestCount = Math.max(1, guestCount - 1)}>−</button>
                <span class="count-display">{guestCount}</span>
                <button class="count-btn" onclick={() => guestCount = Math.min(10, guestCount + 1)}>+</button>
              </div>
            </div>
          </div>
        {/if}

        <div class="form-group mb-6">
          <label class="form-label" for="rsvpMsg">Pesan untuk pengantin (opsional)</label>
          <textarea id="rsvpMsg" class="form-textarea" bind:value={message} placeholder="Tuliskan doa atau ucapan untuk pasangan..." rows="3"></textarea>
        </div>

        <button
          class="btn btn-primary btn-block btn-lg"
          onclick={submit}
          disabled={confirmed === null}
        >
          Kirim Konfirmasi 💌
        </button>
      </div>
    {/if}

    <!-- Brand -->
    <div class="rsvp-brand">
      <a href="/" class="text-subtle text-xs">Dibuat dengan 💍 Nikahku</a>
    </div>
  </div>
</div>

<style>
  .rsvp-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(160deg, var(--color-surface) 0%, var(--color-secondary) 100%);
    padding: var(--space-6) var(--space-4);
    position: relative;
    overflow: hidden;
  }

  .rsvp-bg { position: absolute; inset: 0; pointer-events: none; }

  .rsvp-blob {
    position: absolute; border-radius: 50%;
    filter: blur(50px); opacity: 0.4;
  }

  .rsvp-blob-1 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, #F5D8D4, #E8AFA8);
    top: -100px; right: -100px;
    animation: float 6s ease infinite;
  }

  .rsvp-blob-2 {
    width: 300px; height: 300px;
    background: radial-gradient(circle, #F5E6E0, #EDD5CE);
    bottom: -80px; left: -60px;
    animation: float 8s ease infinite reverse;
  }

  .rsvp-container {
    width: 100%; max-width: 480px;
    position: relative; z-index: 1;
  }

  .rsvp-card {
    background: white;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-2xl);
    padding: var(--space-8);
    box-shadow: var(--shadow-xl);
  }

  /* Invitation Header */
  .rsvp-invitation-header { text-align: center; padding-bottom: var(--space-4); }

  .rsvp-rings { font-size: 2.5rem; margin-bottom: var(--space-3); display: block; }

  .rsvp-inviter { margin-bottom: var(--space-2); }

  .rsvp-couple-name {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--color-accent);
    margin-bottom: var(--space-3);
    line-height: 1.2;
  }

  .rsvp-date-badge {
    display: inline-block;
    background: var(--color-primary-xlight);
    color: var(--color-accent);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    font-weight: 600;
    border: 1px solid var(--color-primary-light);
  }

  .rsvp-greeting { margin-bottom: var(--space-5); }

  .rsvp-emoji { font-size: 4rem; display: block; margin-bottom: var(--space-2); }

  /* Confirm Buttons */
  .rsvp-confirm-section { margin-bottom: var(--space-5); }

  .confirm-choices { display: flex; flex-direction: column; gap: var(--space-3); }

  .confirm-btn {
    display: flex; align-items: center; gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
    border: 2px solid var(--color-border);
    font-size: var(--font-size-base);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-spring);
    font-family: var(--font-body);
    text-align: left;
    color: var(--color-text-muted);
  }

  .confirm-icon { font-size: 1.5rem; }

  .confirm-yes:hover, .confirm-yes.active {
    border-color: var(--color-success);
    background: var(--color-success-bg);
    color: var(--color-success);
    transform: scale(1.01);
  }

  .confirm-no:hover, .confirm-no.active {
    border-color: var(--color-danger);
    background: var(--color-danger-bg);
    color: var(--color-danger);
    transform: scale(1.01);
  }

  /* Guest Count Picker */
  .guest-count-picker {
    display: flex; align-items: center; gap: var(--space-4);
    justify-content: center;
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-xl);
    padding: var(--space-3);
  }

  .count-btn {
    width: 40px; height: 40px; border-radius: 50%;
    background: white; border: 1.5px solid var(--color-border);
    font-size: var(--font-size-xl); font-weight: 700;
    cursor: pointer; transition: all var(--transition-fast);
    display: flex; align-items: center; justify-content: center;
    color: var(--color-accent); font-family: var(--font-body);
  }

  .count-btn:hover {
    background: var(--color-primary-xlight);
    border-color: var(--color-primary);
  }

  .count-display {
    font-family: var(--font-display);
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--color-accent);
    min-width: 60px;
    text-align: center;
  }

  .rsvp-details { margin-bottom: var(--space-4); }

  /* Confirmation Detail */
  .confirmation-detail {
    background: var(--color-primary-xlight);
    border: 1px solid var(--color-primary-light);
    border-radius: var(--radius-xl);
    padding: var(--space-4) var(--space-5);
    display: flex; flex-direction: column; gap: var(--space-2);
  }

  .conf-row { display: flex; justify-content: space-between; font-size: var(--font-size-sm); }

  /* Brand */
  .rsvp-brand { text-align: center; margin-top: var(--space-4); }
</style>