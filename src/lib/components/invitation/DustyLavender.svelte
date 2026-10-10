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

    // Otomatis putar audio dengan fallback interaksi pertama
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
      const mainEl = document.getElementById('lavender-invitation-content');
      if (mainEl) {
        mainEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 120);
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

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
</script>

<div class="lavender-theme-wrapper {isOpen ? 'is-opened' : 'is-closed'}">
  {#if resolvedMusicUrl}
    <audio
      bind:this={audioRef}
      src={resolvedMusicUrl}
      loop
      preload="auto"
    ></audio>

    <!-- Floating Audio Control Disk with Golden Glow -->
    <button
      type="button"
      class="lavender-music-btn {isPlaying ? 'spinning' : 'paused'}"
      onclick={toggleAudio}
      title={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
      aria-label="Kontrol Pemutar Musik"
    >
      <div class="music-disc-inner">
        <span class="disc-core"></span>
        <span class="disc-symbol">♫</span>
      </div>
      <span class="music-glow-ring"></span>
    </button>
  {/if}

  <!-- ============================================== -->
  <!-- LUXURY FLOATING UNIVERSE (PETALS & STARDUST)   -->
  <!-- ============================================== -->
  <div class="luxury-floating-universe" aria-hidden="true">
    <!-- 12 Floating Watercolor Petals -->
    <span class="fl-petal petal-1"></span>
    <span class="fl-petal petal-2"></span>
    <span class="fl-petal petal-3"></span>
    <span class="fl-petal petal-4"></span>
    <span class="fl-petal petal-5"></span>
    <span class="fl-petal petal-6"></span>
    <span class="fl-petal petal-7"></span>
    <span class="fl-petal petal-8"></span>
    <span class="fl-petal petal-9"></span>
    <span class="fl-petal petal-10"></span>
    <span class="fl-petal petal-11"></span>
    <span class="fl-petal petal-12"></span>

    <!-- 10 Floating Golden Stardust Sparkles -->
    <span class="fl-sparkle sparkle-1">✦</span>
    <span class="fl-sparkle sparkle-2">✧</span>
    <span class="fl-sparkle sparkle-3">★</span>
    <span class="fl-sparkle sparkle-4">✦</span>
    <span class="fl-sparkle sparkle-5">✧</span>
    <span class="fl-sparkle sparkle-6">★</span>
    <span class="fl-sparkle sparkle-7">✦</span>
    <span class="fl-sparkle sparkle-8">✧</span>
    <span class="fl-sparkle sparkle-9">★</span>
    <span class="fl-sparkle sparkle-10">✦</span>

    <!-- Ambient Glowing Ethereal Orbs -->
    <span class="fl-orb orb-1"></span>
    <span class="fl-orb orb-2"></span>
    <span class="fl-orb orb-3"></span>

    <!-- Floating Side Botanical Vines -->
    <div class="floating-side-branch left">
      <svg width="40" height="180" viewBox="0 0 40 180" fill="none">
        <path d="M5 0 C25 40 15 90 30 140 C35 155 20 170 10 180" stroke="#C5A059" stroke-width="1.2" stroke-opacity="0.35" fill="none"/>
        <path d="M12 25 C25 20 28 35 15 38 Z" fill="#8B88A8" fill-opacity="0.25" stroke="#C5A059" stroke-width="0.8" stroke-opacity="0.4"/>
        <path d="M18 60 C32 55 35 70 22 73 Z" fill="#676483" fill-opacity="0.2" stroke="#C5A059" stroke-width="0.8" stroke-opacity="0.4"/>
        <path d="M22 100 C36 95 38 110 25 113 Z" fill="#8B88A8" fill-opacity="0.25" stroke="#C5A059" stroke-width="0.8" stroke-opacity="0.4"/>
        <path d="M28 135 C40 130 42 145 30 148 Z" fill="#676483" fill-opacity="0.2" stroke="#C5A059" stroke-width="0.8" stroke-opacity="0.4"/>
      </svg>
    </div>
    <div class="floating-side-branch right">
      <svg width="40" height="180" viewBox="0 0 40 180" fill="none">
        <path d="M35 0 C15 40 25 90 10 140 C5 155 20 170 30 180" stroke="#C5A059" stroke-width="1.2" stroke-opacity="0.35" fill="none"/>
        <path d="M28 25 C15 20 12 35 25 38 Z" fill="#8B88A8" fill-opacity="0.25" stroke="#C5A059" stroke-width="0.8" stroke-opacity="0.4"/>
        <path d="M22 60 C8 55 5 70 18 73 Z" fill="#676483" fill-opacity="0.2" stroke="#C5A059" stroke-width="0.8" stroke-opacity="0.4"/>
        <path d="M18 100 C4 95 2 110 15 113 Z" fill="#8B88A8" fill-opacity="0.25" stroke="#C5A059" stroke-width="0.8" stroke-opacity="0.4"/>
        <path d="M12 135 C0 130 -2 145 10 148 Z" fill="#676483" fill-opacity="0.2" stroke="#C5A059" stroke-width="0.8" stroke-opacity="0.4"/>
      </svg>
    </div>
  </div>

  {#snippet floralCorner(position = 'top-left')}
    <div class="card-floral-corner {position}" aria-hidden="true">
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
        <!-- Soft Botanical Aura -->
        <ellipse cx="26" cy="26" rx="24" ry="24" fill="#676483" opacity="0.08"/>

        <!-- Primary Golden Vine Tendrils -->
        <path d="M5 5 C25 15 55 10 95 6" stroke="#C5A059" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M22 11 Q38 18 52 14" stroke="#DFBD74" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M5 5 C15 25 10 55 6 95" stroke="#C5A059" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M11 22 Q18 38 14 52" stroke="#DFBD74" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M6 6 Q35 35 68 52" stroke="#C5A059" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/>
        <path d="M8 8 Q52 35 52 68" stroke="#DFBD74" stroke-width="1" stroke-linecap="round" opacity="0.7"/>

        <!-- Horizontal Lavender & Botanical Sprig (Top Border) -->
        <ellipse cx="32" cy="11" rx="4.5" ry="7.5" transform="rotate(-35 32 11)" fill="#8B88A8"/>
        <ellipse cx="40" cy="10" rx="4" ry="7" transform="rotate(-20 40 10)" fill="#676483"/>
        <ellipse cx="48" cy="9.5" rx="4" ry="6.5" transform="rotate(-10 48 9.5)" fill="#9F9CB8"/>
        <ellipse cx="56" cy="9" rx="3.5" ry="6" transform="rotate(-5 56 9)" fill="#8B88A8"/>
        <ellipse cx="64" cy="8.5" rx="3.5" ry="5.5" transform="rotate(5 64 8.5)" fill="#676483"/>
        <ellipse cx="72" cy="8" rx="3" ry="5" transform="rotate(10 72 8)" fill="#9F9CB8"/>
        <ellipse cx="80" cy="7.5" rx="2.5" ry="4.5" transform="rotate(15 80 7.5)" fill="#B3B1C6"/>
        <ellipse cx="88" cy="7" rx="2" ry="4" transform="rotate(20 88 7)" fill="#C8C5DC"/>
        <ellipse cx="94" cy="6.5" rx="1.5" ry="3" fill="#DFBD74"/>

        <!-- Eucalyptus Leaves (Top) -->
        <path d="M36 12 C44 4 54 8 52 16 C46 18 38 16 36 12 Z" fill="#9F9CB8" opacity="0.6"/>
        <path d="M58 10 C66 3 74 6 72 13 C67 15 60 14 58 10 Z" fill="#B3B1C6" opacity="0.65"/>
        <path d="M78 8 C84 3 90 5 88 10 C85 12 80 11 78 8 Z" fill="#C5A059" opacity="0.6"/>

        <!-- Vertical Lavender & Botanical Sprig (Side Border) -->
        <ellipse cx="11" cy="32" rx="7.5" ry="4.5" transform="rotate(35 11 32)" fill="#8B88A8"/>
        <ellipse cx="10" cy="40" rx="7" ry="4" transform="rotate(20 10 40)" fill="#676483"/>
        <ellipse cx="9.5" cy="48" rx="6.5" ry="4" transform="rotate(10 9.5 48)" fill="#9F9CB8"/>
        <ellipse cx="9" cy="56" rx="6" ry="3.5" transform="rotate(5 9 56)" fill="#8B88A8"/>
        <ellipse cx="8.5" cy="64" rx="5.5" ry="3.5" transform="rotate(-5 8.5 64)" fill="#676483"/>
        <ellipse cx="8" cy="72" rx="5" ry="3" transform="rotate(-10 8 72)" fill="#9F9CB8"/>
        <ellipse cx="7.5" cy="80" rx="4.5" ry="2.5" transform="rotate(-15 7.5 80)" fill="#B3B1C6"/>
        <ellipse cx="7" cy="88" rx="4" ry="2" transform="rotate(-20 7 88)" fill="#C8C5DC"/>
        <ellipse cx="6.5" cy="94" rx="3" ry="1.5" fill="#DFBD74"/>

        <!-- Eucalyptus Leaves (Side) -->
        <path d="M12 36 C4 44 8 54 16 52 C18 46 16 38 12 36 Z" fill="#9F9CB8" opacity="0.6"/>
        <path d="M10 58 C3 66 6 74 13 72 C15 67 14 60 10 58 Z" fill="#B3B1C6" opacity="0.65"/>
        <path d="M8 78 C3 84 5 90 10 88 C12 85 11 80 8 78 Z" fill="#C5A059" opacity="0.6"/>

        <!-- Secondary Blossoms -->
        <circle cx="50" cy="24" r="8" fill="#E8E4F2" stroke="#DFBD74" stroke-width="0.8"/>
        <circle cx="50" cy="24" r="5" fill="#9F9CB8"/>
        <circle cx="50" cy="24" r="2.5" fill="#C5A059"/>

        <circle cx="24" cy="50" r="8" fill="#E8E4F2" stroke="#DFBD74" stroke-width="0.8"/>
        <circle cx="24" cy="50" r="5" fill="#9F9CB8"/>
        <circle cx="24" cy="50" r="2.5" fill="#C5A059"/>

        <!-- Diagonal Inward Leaf Sprays -->
        <ellipse cx="38" cy="38" rx="7" ry="12" transform="rotate(-45 38 38)" fill="#B3B1C6" opacity="0.5"/>
        <ellipse cx="48" cy="48" rx="5" ry="9" transform="rotate(-45 48 48)" fill="#8B88A8" opacity="0.6"/>
        <ellipse cx="58" cy="58" rx="3" ry="6" transform="rotate(-45 58 58)" fill="#DFBD74" opacity="0.8"/>

        <!-- Grand Corner Rose / Peony Bouquet -->
        <circle cx="20" cy="20" r="16" fill="#F4F2F9" stroke="#C5A059" stroke-width="1"/>
        <path d="M10 16 C12 7 24 7 28 12 C32 17 28 27 22 28 C14 29 8 23 10 16 Z" fill="#D6D2E6" opacity="0.85"/>
        <path d="M14 24 C10 32 18 36 26 33 C32 30 33 22 28 16 C22 14 16 18 14 24 Z" fill="#B8B4D0" opacity="0.85"/>
        <path d="M25 12 C34 14 36 24 30 29 C24 32 17 26 18 18 C19 13 22 11 25 12 Z" fill="#9B96BA" opacity="0.9"/>
        <circle cx="21" cy="21" r="7.5" fill="#676483"/>
        <circle cx="20.5" cy="20.5" r="4.5" fill="#8B88A8"/>
        <circle cx="20" cy="20" r="2.5" fill="#F7E7CE" stroke="#C5A059" stroke-width="0.8"/>

        <!-- Golden Sparkles & Pistils -->
        <circle cx="38" cy="28" r="2" fill="#DFBD74"/>
        <circle cx="28" cy="38" r="2" fill="#DFBD74"/>
        <circle cx="68" cy="20" r="1.5" fill="#C5A059"/>
        <circle cx="20" cy="68" r="1.5" fill="#C5A059"/>
        <circle cx="48" cy="34" r="1" fill="#F7E7CE"/>
        <circle cx="34" cy="48" r="1" fill="#F7E7CE"/>
        <circle cx="85" cy="18" r="1" fill="#DFBD74"/>
        <circle cx="18" cy="85" r="1" fill="#DFBD74"/>
      </svg>
    </div>
  {/snippet}

  {#snippet floralCrest()}
    <div class="card-floral-crest" aria-hidden="true">
      <svg width="100%" height="100%" viewBox="0 0 220 54" fill="none">
        <!-- Golden Vine Arches -->
        <path d="M110 27 C80 12 45 18 8 28" stroke="#C5A059" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M110 27 C140 12 175 18 212 28" stroke="#C5A059" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M100 24 C82 16 60 22 38 27" stroke="#DFBD74" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M120 24 C138 16 160 22 182 27" stroke="#DFBD74" stroke-width="1.2" stroke-linecap="round"/>

        <!-- Left Lavender Sprig -->
        <ellipse cx="80" cy="19" rx="5.5" ry="3.5" transform="rotate(-15 80 19)" fill="#8B88A8"/>
        <ellipse cx="68" cy="16" rx="5" ry="3.2" transform="rotate(-25 68 16)" fill="#676483"/>
        <ellipse cx="56" cy="15" rx="4.5" ry="3" transform="rotate(-30 56 15)" fill="#9F9CB8"/>
        <ellipse cx="44" cy="16" rx="4" ry="2.8" transform="rotate(-20 44 16)" fill="#8B88A8"/>
        <ellipse cx="32" cy="19" rx="3.8" ry="2.5" transform="rotate(-15 32 19)" fill="#B3B1C6"/>
        <ellipse cx="22" cy="22" rx="3.2" ry="2" transform="rotate(-10 22 22)" fill="#C8C5DC"/>
        <ellipse cx="14" cy="25" rx="2.5" ry="1.6" fill="#DFBD74"/>

        <!-- Left Eucalyptus Leaves -->
        <path d="M74 21 C66 27 58 24 62 18 C67 15 72 17 74 21 Z" fill="#B3B1C6" opacity="0.65"/>
        <path d="M50 20 C42 26 36 23 40 17 C45 15 49 17 50 20 Z" fill="#9F9CB8" opacity="0.6"/>
        <path d="M28 22 C22 27 18 25 21 20 C24 18 27 19 28 22 Z" fill="#DFBD74" opacity="0.65"/>

        <!-- Right Lavender Sprig -->
        <ellipse cx="140" cy="19" rx="5.5" ry="3.5" transform="rotate(15 140 19)" fill="#8B88A8"/>
        <ellipse cx="152" cy="16" rx="5" ry="3.2" transform="rotate(25 152 16)" fill="#676483"/>
        <ellipse cx="164" cy="15" rx="4.5" ry="3" transform="rotate(30 164 15)" fill="#9F9CB8"/>
        <ellipse cx="176" cy="16" rx="4" ry="2.8" transform="rotate(20 176 16)" fill="#8B88A8"/>
        <ellipse cx="188" cy="19" rx="3.8" ry="2.5" transform="rotate(15 188 19)" fill="#B3B1C6"/>
        <ellipse cx="198" cy="22" rx="3.2" ry="2" transform="rotate(10 198 22)" fill="#C8C5DC"/>
        <ellipse cx="206" cy="25" rx="2.5" ry="1.6" fill="#DFBD74"/>

        <!-- Right Eucalyptus Leaves -->
        <path d="M146 21 C154 27 162 24 158 18 C153 15 148 17 146 21 Z" fill="#B3B1C6" opacity="0.65"/>
        <path d="M170 20 C178 26 184 23 180 17 C175 15 171 17 170 20 Z" fill="#9F9CB8" opacity="0.6"/>
        <path d="M192 22 C198 27 202 25 199 20 C196 18 193 19 192 22 Z" fill="#DFBD74" opacity="0.65"/>

        <!-- Flanking Secondary Rosebuds -->
        <circle cx="92" cy="24" r="8" fill="#F4F2F9" stroke="#C5A059" stroke-width="0.9"/>
        <circle cx="92" cy="24" r="5" fill="#8B88A8"/>
        <circle cx="92" cy="24" r="2" fill="#F7E7CE"/>

        <circle cx="128" cy="24" r="8" fill="#F4F2F9" stroke="#C5A059" stroke-width="0.9"/>
        <circle cx="128" cy="24" r="5" fill="#8B88A8"/>
        <circle cx="128" cy="24" r="2" fill="#F7E7CE"/>

        <!-- Grand Central Blooming Rose -->
        <circle cx="110" cy="26" r="14" fill="#FAF8FE" stroke="#C5A059" stroke-width="1.2"/>
        <path d="M102 22 C104 14 116 14 118 22 C122 28 116 35 110 35 C104 35 98 28 102 22 Z" fill="#D6D2E6" opacity="0.85"/>
        <path d="M105 28 C102 34 111 38 117 33 C122 28 120 22 115 20 C110 18 106 22 105 28 Z" fill="#B8B4D0" opacity="0.9"/>
        <circle cx="110" cy="26" r="7" fill="#676483"/>
        <circle cx="110" cy="26" r="4" fill="#8B88A8"/>
        <circle cx="110" cy="26" r="2" fill="#F7E7CE" stroke="#C5A059" stroke-width="0.6"/>

        <!-- Gold Sparkles & Floating Star Accents -->
        <circle cx="110" cy="8" r="2" fill="#DFBD74"/>
        <circle cx="98" cy="11" r="1.5" fill="#C5A059"/>
        <circle cx="122" cy="11" r="1.5" fill="#C5A059"/>
        <circle cx="78" cy="10" r="1.2" fill="#DFBD74"/>
        <circle cx="142" cy="10" r="1.2" fill="#DFBD74"/>
        <circle cx="48" cy="9" r="1" fill="#C5A059"/>
        <circle cx="172" cy="9" r="1" fill="#C5A059"/>
      </svg>
    </div>
  {/snippet}

  <!-- ============================================== -->
  <!-- 1. COVER / HERO SCREEN                         -->
  <!-- ============================================== -->
  <section class="lavender-cover-screen">
    <div class="cover-backdrop">
      <img
        src={invitation.cover.coverPhoto || '/images/themes/lavender-arch-real.jpg'}
        alt="Wedding Backdrop"
        class="cover-bg-image"
      />
      <div class="cover-overlay"></div>
    </div>

    <div class="cover-card-container">
      <div class="cover-card-glass">
        <!-- Floating Floral Border Accents -->
        {@render floralCorner('top-left')}
        {@render floralCorner('top-right')}
        {@render floralCorner('bottom-left')}
        {@render floralCorner('bottom-right')}
        <!-- Luxury Botanical Crest Motif with Gold Accent -->
        <div class="botanical-crest">
          <svg width="52" height="52" viewBox="0 0 100 100" fill="none" class="crest-svg">
            <circle cx="50" cy="50" r="46" stroke="#C5A059" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.85"/>
            <circle cx="50" cy="50" r="41" stroke="#676483" stroke-width="0.8" opacity="0.45"/>
            <path d="M50 18 C40 33, 28 43, 23 58 C33 53, 44 63, 50 82 C56 63, 67 53, 77 58 C72 43, 60 33, 50 18 Z" fill="#676483" fill-opacity="0.18" stroke="#C5A059" stroke-width="1.2"/>
            <circle cx="50" cy="50" r="4.5" fill="#C5A059"/>
          </svg>
        </div>

        <span class="cover-eyebrow">✦ THE WEDDING CELEBRATION ✦</span>

        <h1 class="cover-couple-names">
          <span class="couple-name groom">{invitation.couple.groomNickname || 'Rama'}</span>
          <span class="couple-amp">&amp;</span>
          <span class="couple-name bride">{invitation.couple.brideNickname || 'Sinta'}</span>
        </h1>

        <div class="cover-divider-flourish">
          <span class="line line-gold"></span>
          <span class="flower-dot">⚜️</span>
          <span class="line line-gold"></span>
        </div>

        <p class="cover-date-text">
          {formatDateID(invitation.events.resepsi.date || invitation.events.akad.date)}
        </p>

        <!-- Guest Invitation Box with Gold Accent -->
        <div class="guest-salutation-card">
          <span class="guest-salutation-label">Kepada Yth. Bapak/Ibu/Saudara/i:</span>
          <h3 class="guest-salutation-name">{guestName}</h3>
          <span class="guest-salutation-sub">Di Tempat</span>
        </div>

        <!-- Royal 3D Wax Seal with Floating Hover -->
        <div
          class="wax-seal-container"
          onclick={handleOpenInvitation}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && handleOpenInvitation()}
          title="Klik segel lilin untuk membuka undangan"
        >
          <div class="wax-seal-aura"></div>
          <div class="royal-wax-seal">
            <div class="seal-inner-groove">
              <span class="seal-monogram">
                {(invitation.couple.groomNickname || 'R')[0]}&amp;{(invitation.couple.brideNickname || 'S')[0]}
              </span>
              <span class="seal-crest">⚜️</span>
            </div>
            <div class="seal-sheen"></div>
          </div>
          <span class="seal-prompt">✦ Ketuk Segel Emas Untuk Membuka ✦</span>
        </div>

        <button
          type="button"
          class="btn-open-invitation"
          onclick={handleOpenInvitation}
        >
          <span class="btn-icon">💌</span>
          <span>Buka Undangan Resmi</span>
        </button>
      </div>
    </div>
  </section>

  <!-- ============================================== -->
  <!-- 2. MAIN INVITATION CONTENT                     -->
  <!-- ============================================== -->
  <main id="lavender-invitation-content" class="lavender-main-content">
    
    <!-- SECTION: SALAM & QUOTE -->
    <section id="sec-quote" class="lavender-section section-quote">
      <div class="section-container">
        <div class="botanical-header-ornament">
          <span class="lavender-sprig">🪻</span>
        </div>

        <div class="bismillah-arabic">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>
        
        <p class="greeting-lead">
          Assalamu’alaikum Warahmatullahi Wabarakatuh
        </p>
        
        <p class="greeting-body">
          Dengan memohon rahmat dan ridho Allah Subhanahu Wa Ta’ala, kami mengundang Bapak/Ibu/Saudara/i sekalian untuk menghadiri dan memberikan doa restu pada pernikahan putra-putri kami:
        </p>

        {#if invitation.quote.enabled && invitation.quote.text}
          <div class="quote-card">
            {@render floralCrest()}
            {@render floralCorner('top-left')}
            {@render floralCorner('top-right')}
            <div class="quote-mark open">“</div>
            <p class="quote-content">{invitation.quote.text}</p>
            <div class="quote-mark close">”</div>
            {#if invitation.quote.source}
              <div class="quote-source">— {invitation.quote.source}</div>
            {/if}
          </div>
        {/if}
      </div>
    </section>

    <!-- SECTION: MEMPELAI (THE COUPLE) -->
    <section id="sec-couple" class="lavender-section section-couple">
      <div class="section-container">
        <div class="section-title-wrap">
          <span class="section-subtitle-pill">Mempelai Berbahagia</span>
          <h2 class="section-heading">Sang Mempelai</h2>
        </div>

        <div class="couple-showcase-grid">
          <!-- MEMPELAI PRIA -->
          <div class="person-card">
            {@render floralCorner('top-left')}
            {@render floralCorner('top-right')}
            {@render floralCorner('bottom-right')}
            <div class="person-photo-frame">
              <div class="photo-aura-glow"></div>
              <img
                src={invitation.couple.groomPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80'}
                alt={invitation.couple.groomFullName}
                class="person-img"
              />
              <div class="frame-floral-decor top-right">🪻</div>
            </div>
            <h3 class="person-full-name">{invitation.couple.groomFullName}</h3>
            <p class="person-parents">{invitation.couple.groomParents}</p>
            {#if invitation.couple.groomInstagram}
              <a
                href="https://instagram.com/{invitation.couple.groomInstagram}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-social-pill"
              >
                <span>@{invitation.couple.groomInstagram}</span>
              </a>
            {/if}
          </div>

          <!-- LIGATURE & -->
          <div class="couple-connector">
            <span class="connector-amp">&amp;</span>
          </div>

          <!-- MEMPELAI WANITA -->
          <div class="person-card">
            {@render floralCorner('top-left')}
            {@render floralCorner('top-right')}
            {@render floralCorner('bottom-left')}
            <div class="person-photo-frame">
              <div class="photo-aura-glow"></div>
              <img
                src={invitation.couple.bridePhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80'}
                alt={invitation.couple.brideFullName}
                class="person-img"
              />
              <div class="frame-floral-decor top-left">🪻</div>
            </div>
            <h3 class="person-full-name">{invitation.couple.brideFullName}</h3>
            <p class="person-parents">{invitation.couple.brideParents}</p>
            {#if invitation.couple.brideInstagram}
              <a
                href="https://instagram.com/{invitation.couple.brideInstagram}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-social-pill"
              >
                <span>@{invitation.couple.brideInstagram}</span>
              </a>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION: COUNTDOWN TIMER -->
    <section id="sec-countdown" class="lavender-section section-countdown">
      <div class="section-container">
        <div class="countdown-glass-panel">
          {@render floralCrest()}
          {@render floralCorner('top-left')}
          {@render floralCorner('top-right')}
          <span class="countdown-eyebrow">MENGHITUNG HARI BAHAGIA</span>
          <h3 class="countdown-title">Menuju Akad &amp; Resepsi</h3>

          <div class="countdown-timer-grid">
            <div class="timer-box">
              <span class="timer-number">{days}</span>
              <span class="timer-label">HARI</span>
            </div>
            <div class="timer-box">
              <span class="timer-number">{hours}</span>
              <span class="timer-label">JAM</span>
            </div>
            <div class="timer-box">
              <span class="timer-number">{minutes}</span>
              <span class="timer-label">MENIT</span>
            </div>
            <div class="timer-box">
              <span class="timer-number">{seconds}</span>
              <span class="timer-label">DETIK</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION: DETAIL ACARA (WEDDING EVENTS) -->
    <section id="sec-events" class="lavender-section section-events">
      <div class="section-container">
        <div class="section-title-wrap">
          <span class="section-subtitle-pill">Waktu &amp; Lokasi</span>
          <h2 class="section-heading">Rangkaian Acara</h2>
        </div>

        <div class="events-grid">
          {#if invitation.events.akad.enabled}
            <div class="event-card">
              {@render floralCorner('top-right')}
              {@render floralCorner('bottom-left')}
              <div class="event-badge-icon">💍</div>
              <h3 class="event-title">{invitation.events.akad.title}</h3>
              <div class="event-divider"></div>
              
              <div class="event-meta-row">
                <span class="meta-icon">📅</span>
                <span class="meta-text">{formatDateID(invitation.events.akad.date)}</span>
              </div>
              <div class="event-meta-row">
                <span class="meta-icon">⏰</span>
                <span class="meta-text">{invitation.events.akad.startTime} - {invitation.events.akad.endTime}</span>
              </div>
              <div class="event-meta-row">
                <span class="meta-icon">📍</span>
                <div class="meta-venue-block">
                  <strong>{invitation.events.akad.venueName}</strong>
                  <p>{invitation.events.akad.venueAddress}</p>
                </div>
              </div>

              {#if invitation.events.akad.mapsUrl}
                <a
                  href={invitation.events.akad.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-maps"
                >
                  <span>Buka Petunjuk Arah Google Maps</span>
                  <span class="arrow">↗</span>
                </a>
              {/if}
            </div>
          {/if}

          {#if invitation.events.resepsi.enabled}
            <div class="event-card primary-event">
              {@render floralCrest()}
              {@render floralCorner('top-left')}
              {@render floralCorner('top-right')}
              {@render floralCorner('bottom-right')}
              <div class="event-badge-icon">🎉</div>
              <h3 class="event-title">{invitation.events.resepsi.title}</h3>
              <div class="event-divider"></div>

              <div class="event-meta-row">
                <span class="meta-icon">📅</span>
                <span class="meta-text">{formatDateID(invitation.events.resepsi.date)}</span>
              </div>
              <div class="event-meta-row">
                <span class="meta-icon">⏰</span>
                <span class="meta-text">{invitation.events.resepsi.startTime} - {invitation.events.resepsi.endTime}</span>
              </div>
              <div class="event-meta-row">
                <span class="meta-icon">📍</span>
                <div class="meta-venue-block">
                  <strong>{invitation.events.resepsi.venueName}</strong>
                  <p>{invitation.events.resepsi.venueAddress}</p>
                </div>
              </div>

              {#if invitation.events.resepsi.mapsUrl}
                <a
                  href={invitation.events.resepsi.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn-maps"
                >
                  <span>Buka Petunjuk Arah Google Maps</span>
                  <span class="arrow">↗</span>
                </a>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </section>

    <!-- SECTION: OUR STORY (TIMELINE - KUNIKAA SIGNATURE) -->
    {#if invitation.loveStory?.enabled && invitation.loveStory.stories.length > 0}
      <section id="sec-story" class="lavender-section section-story">
        <div class="section-container">
          <div class="section-title-wrap">
            <span class="section-subtitle-pill">Kisah Dua Hati</span>
            <h2 class="section-heading">Cerita Cinta Kami</h2>
          </div>

          <div class="story-timeline">
            {#each invitation.loveStory.stories as item, idx}
              <div class="timeline-item {idx % 2 === 0 ? 'left' : 'right'}">
                <div class="timeline-dot">
                  <span>{idx + 1}</span>
                </div>
                <div class="timeline-card">
                  {@render floralCorner('top-right')}
                  <span class="timeline-year">{item.year}</span>
                  <h4 class="timeline-title">{item.title}</h4>
                  <p class="timeline-desc">{item.story}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </section>
    {/if}

    <!-- SECTION: GALERI FOTO -->
    {#if invitation.gallery?.enabled && invitation.gallery.photos.length > 0}
      <section id="sec-gallery" class="lavender-section section-gallery">
        <div class="section-container">
          <div class="section-title-wrap">
            <span class="section-subtitle-pill">Galeri Kenangan</span>
            <h2 class="section-heading">Momen Bahagia</h2>
          </div>

          <div class="gallery-mosaic-grid">
            {#each invitation.gallery.photos as photo, i}
              <div class="gallery-photo-item">
                <img src={photo} alt="Momen Pre-wedding {i + 1}" class="gallery-img" />
              </div>
            {/each}
          </div>
        </div>
      </section>
    {/if}

    <!-- SECTION: AMPLOP DIGITAL / WEDDING GIFT -->
    {#if invitation.gift?.enabled}
      <section id="sec-gift" class="lavender-section section-gift">
        <div class="section-container">
          <div class="section-title-wrap">
            <span class="section-subtitle-pill">Tanda Kasih</span>
            <h2 class="section-heading">Amplop &amp; Hadiah Digital</h2>
            <p class="section-desc">
              Doa restu Anda merupakan karunia terindah bagi kami. Namun apabila Anda berkehendak memberikan tanda kasih, Anda dapat menyalurkannya melalui:
            </p>
          </div>

          <div class="gift-cards-grid">
            {#each invitation.gift.bankAccounts as bank, idx}
              <div class="bank-card">
                {@render floralCorner('top-right')}
                {@render floralCorner('bottom-left')}
                <div class="bank-card-header">
                  <span class="bank-name">{bank.bank}</span>
                  <span class="bank-chip">💳</span>
                </div>
                <div class="account-num-row">
                  <span class="account-num">{bank.accountNumber}</span>
                  <button
                    type="button"
                    class="btn-copy-account"
                    onclick={() => copyBank(bank.accountNumber, idx)}
                  >
                    {copiedBankIndex === idx ? 'Tersalin ✓' : 'Salin'}
                  </button>
                </div>
                <div class="account-holder">a.n. {bank.accountHolder}</div>
              </div>
            {/each}
          </div>

          {#if invitation.gift.shippingAddress?.enabled}
            <div class="shipping-card">
              {@render floralCorner('top-right')}
              <div class="shipping-icon">🎁</div>
              <div class="shipping-content">
                <h4>Kirim Kado Fisik</h4>
                <p><strong>Penerima:</strong> {invitation.gift.shippingAddress.recipient}</p>
                <p><strong>Alamat:</strong> {invitation.gift.shippingAddress.address}</p>
                <p><strong>No. HP:</strong> {invitation.gift.shippingAddress.phone}</p>
              </div>
              <button
                type="button"
                class="btn-copy-address"
                onclick={() => copyAddress(`${invitation.gift.shippingAddress.recipient} - ${invitation.gift.shippingAddress.address} (${invitation.gift.shippingAddress.phone})`)}
              >
                {copiedAddress ? 'Alamat Tersalin ✓' : 'Salin Alamat'}
              </button>
            </div>
          {/if}
        </div>
      </section>
    {/if}

    <!-- SECTION: RSVP & DOA RESTU -->
    <section id="sec-rsvp" class="lavender-section section-rsvp">
      <div class="section-container">
        <div class="section-title-wrap">
          <span class="section-subtitle-pill">Konfirmasi Kehadiran</span>
          <h2 class="section-heading">RSVP &amp; Doa Restu</h2>
          <p class="section-desc">
            Kehadiran Anda sangat berarti bagi kami. Silakan konfirmasikan kehadiran Anda melalui formulir di bawah ini.
          </p>
        </div>

        <div class="rsvp-form-container">
          {@render floralCrest()}
          {@render floralCorner('top-left')}
          {@render floralCorner('top-right')}
          {@render floralCorner('bottom-left')}
          {@render floralCorner('bottom-right')}
          {#if rsvpSubmitted}
            <div class="rsvp-success-card">
              <span class="success-icon">💌</span>
              <h3>Terima Kasih Banyak!</h3>
              <p>Konfirmasi dan doa restu Anda telah berhasil dikirimkan kepada kedua mempelai.</p>
              <button
                type="button"
                class="btn-reset-rsvp"
                onclick={() => (rsvpSubmitted = false)}
              >
                Kirim Pesan Lain
              </button>
            </div>
          {:else}
            <form onsubmit={handleFormSubmit} class="rsvp-form">
              <div class="form-group">
                <label for="rsvp-name" class="form-label">Nama Anda</label>
                <input
                  id="rsvp-name"
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap Anda"
                  class="form-input"
                  bind:value={rsvpSenderName}
                />
              </div>

              <div class="form-group">
                <span class="form-label">Konfirmasi Kehadiran</span>
                <div class="attendance-pills">
                  <button
                    type="button"
                    class="attendance-pill {rsvpAttendance === 'hadir' ? 'selected' : ''}"
                    onclick={() => (rsvpAttendance = 'hadir')}
                  >
                    <span>✓ Hadir</span>
                  </button>
                  <button
                    type="button"
                    class="attendance-pill {rsvpAttendance === 'tidak_hadir' ? 'selected' : ''}"
                    onclick={() => (rsvpAttendance = 'tidak_hadir')}
                  >
                    <span>✕ Tidak Hadir</span>
                  </button>
                </div>
              </div>

              {#if rsvpAttendance === 'hadir'}
                <div class="form-group">
                  <label for="rsvp-count" class="form-label">Jumlah Tamu yang Hadir</label>
                  <select id="rsvp-count" class="form-select" bind:value={rsvpGuestCount}>
                    <option value={1}>1 Orang</option>
                    <option value={2}>2 Orang</option>
                    <option value={3}>3 Orang</option>
                    <option value={4}>4 Orang</option>
                  </select>
                </div>
              {/if}

              <div class="form-group">
                <label for="rsvp-msg" class="form-label">Ucapan &amp; Doa Restu</label>
                <textarea
                  id="rsvp-msg"
                  rows="3"
                  required
                  placeholder="Tuliskan ucapan selamat dan doa untuk kedua mempelai..."
                  class="form-textarea"
                  bind:value={rsvpMessage}
                ></textarea>
              </div>

              <button type="submit" class="btn-submit-rsvp">
                <span>Kirim Konfirmasi &amp; Doa</span>
                <span>💌</span>
              </button>
            </form>
          {/if}

          <!-- Wishes Board -->
          {#if invitation.wishes && invitation.wishes.length > 0}
            <div class="wishes-board">
              <h4 class="wishes-board-title">Doa &amp; Ucapan Kerabat ({invitation.wishes.length})</h4>
              <div class="wishes-list">
                {#each invitation.wishes as wish}
                  <div class="wish-item">
                    <div class="wish-item-header">
                      <strong class="wish-author">{wish.name}</strong>
                      <span class="wish-badge {wish.attendance === 'hadir' ? 'badge-hadir' : 'badge-absen'}">
                        {wish.attendance === 'hadir' ? 'Hadir' : 'Tidak Hadir'}
                      </span>
                    </div>
                    <p class="wish-message">{wish.message}</p>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </section>

    <!-- SECTION: PENUTUP -->
    <footer class="lavender-footer">
      <div class="section-container text-center">
        <div class="footer-crest">🪻</div>
        <p class="footer-thanks">
          Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu bagi kami berdua.
        </p>
        <p class="footer-family">
          Wassalamu’alaikum Warahmatullahi Wabarakatuh
        </p>
        <div class="footer-couple-sig">
          {invitation.couple.groomNickname} &amp; {invitation.couple.brideNickname}
        </div>
        <p class="footer-family-names">Beserta Keluarga Besar Kedua Mempelai</p>
      </div>
    </footer>

  </main>

  <!-- Floating Quick Dock Navigation -->
  {#if isOpen}
    <nav class="floating-quick-dock animate-fade-in" aria-label="Navigasi Undangan Cepat">
      <div class="dock-glass-capsule">
        <button type="button" class="dock-btn" onclick={() => scrollToSection('sec-quote')} title="Salam">
          <span class="dock-icon">🕊️</span>
          <span class="dock-label">Salam</span>
        </button>
        <button type="button" class="dock-btn" onclick={() => scrollToSection('sec-couple')} title="Mempelai">
          <span class="dock-icon">💍</span>
          <span class="dock-label">Mempelai</span>
        </button>
        <button type="button" class="dock-btn" onclick={() => scrollToSection('sec-countdown')} title="Waktu">
          <span class="dock-icon">⏳</span>
          <span class="dock-label">Waktu</span>
        </button>
        <button type="button" class="dock-btn" onclick={() => scrollToSection('sec-events')} title="Acara">
          <span class="dock-icon">📅</span>
          <span class="dock-label">Acara</span>
        </button>
        {#if invitation.loveStory?.enabled && invitation.loveStory.stories.length > 0}
          <button type="button" class="dock-btn" onclick={() => scrollToSection('sec-story')} title="Kisah">
            <span class="dock-icon">📖</span>
            <span class="dock-label">Kisah</span>
          </button>
        {/if}
        {#if invitation.gallery?.enabled && invitation.gallery.photos.length > 0}
          <button type="button" class="dock-btn" onclick={() => scrollToSection('sec-gallery')} title="Galeri">
            <span class="dock-icon">📸</span>
            <span class="dock-label">Galeri</span>
          </button>
        {/if}
        {#if invitation.gift?.enabled}
          <button type="button" class="dock-btn" onclick={() => scrollToSection('sec-gift')} title="Kado">
            <span class="dock-icon">🎁</span>
            <span class="dock-label">Kado</span>
          </button>
        {/if}
        <button type="button" class="dock-btn dock-btn-highlight" onclick={() => scrollToSection('sec-rsvp')} title="RSVP">
          <span class="dock-icon">💌</span>
          <span class="dock-label">RSVP</span>
        </button>
      </div>
    </nav>
  {/if}
</div>

<style>
  /* ========================================= */
  /* DUSTY LAVENDER THEME (KUNIKAA PALETTE)    */
  /* Colors: #676483, #8B88A8, #EBE9F4, #F3F1FA*/
  /* ========================================= */
  .lavender-theme-wrapper {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: #F3F1FA;
    color: #2E2C3D;
    font-family: 'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif;
    overflow-x: hidden;
  }

  /* Music Button with Luxury Gold Border & Floating Pulse */
  .lavender-music-btn {
    position: fixed;
    top: 22px;
    right: 20px;
    z-index: 999;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: rgba(103, 100, 131, 0.92);
    backdrop-filter: blur(10px);
    border: 2px solid #C5A059;
    box-shadow: 0 6px 20px rgba(103, 100, 131, 0.4), 0 0 12px rgba(197, 160, 89, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .lavender-music-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 24px rgba(103, 100, 131, 0.5), 0 0 18px rgba(197, 160, 89, 0.6);
  }
  .music-disc-inner {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #8B88A8;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #F5E5C9;
    font-size: 14px;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
  .lavender-music-btn.spinning .music-disc-inner {
    animation: spinDisc 3.5s linear infinite;
  }
  .music-glow-ring {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1px solid rgba(212, 175, 55, 0.6);
    animation: musicPulse 2.5s ease-out infinite;
    pointer-events: none;
  }
  @keyframes spinDisc {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes musicPulse {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(1.4); opacity: 0; }
  }

  /* ========================================================= */
  /* LUXURY FLOATING UNIVERSE (PETALS, STARDUST, ORBS & VINES)  */
  /* ========================================================= */
  .luxury-floating-universe {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 5;
    overflow: hidden;
  }

  /* Floating Watercolor Lilac/Lavender Petals */
  .fl-petal {
    position: absolute;
    border-radius: 50% 0 50% 50%;
    background: linear-gradient(135deg, rgba(139, 136, 168, 0.72) 0%, rgba(200, 190, 220, 0.5) 60%, rgba(255, 235, 248, 0.35) 100%);
    box-shadow: 0 4px 10px rgba(103, 100, 131, 0.18);
    filter: drop-shadow(0 2px 5px rgba(103, 100, 131, 0.15));
    pointer-events: none;
  }
  .petal-1  { width: 16px; height: 16px; left: 8%;  animation: petalFall1 14s linear infinite; animation-delay: 0s; }
  .petal-2  { width: 22px; height: 22px; left: 24%; animation: petalFall2 18s linear infinite; animation-delay: -4s; }
  .petal-3  { width: 14px; height: 14px; left: 42%; animation: petalFall3 12s linear infinite; animation-delay: -7s; }
  .petal-4  { width: 18px; height: 18px; left: 58%; animation: petalFall1 16s linear infinite; animation-delay: -2s; }
  .petal-5  { width: 15px; height: 15px; left: 72%; animation: petalFall2 20s linear infinite; animation-delay: -9s; }
  .petal-6  { width: 20px; height: 20px; left: 88%; animation: petalFall3 15s linear infinite; animation-delay: -5s; }
  .petal-7  { width: 13px; height: 13px; left: 16%; animation: petalFall2 13s linear infinite; animation-delay: -11s; }
  .petal-8  { width: 17px; height: 17px; left: 33%; animation: petalFall1 17s linear infinite; animation-delay: -8s; }
  .petal-9  { width: 21px; height: 21px; left: 51%; animation: petalFall3 19s linear infinite; animation-delay: -13s; }
  .petal-10 { width: 14px; height: 14px; left: 66%; animation: petalFall1 14s linear infinite; animation-delay: -6s; }
  .petal-11 { width: 19px; height: 19px; left: 82%; animation: petalFall2 16s linear infinite; animation-delay: -3s; }
  .petal-12 { width: 15px; height: 15px; left: 93%; animation: petalFall3 18s linear infinite; animation-delay: -10s; }

  @keyframes petalFall1 {
    0% { top: -8%; transform: translateX(0) rotate(0deg) scale(0.9); opacity: 0; }
    10% { opacity: 0.85; }
    50% { transform: translateX(36px) rotate(180deg) scale(1.05); }
    90% { opacity: 0.75; }
    100% { top: 108%; transform: translateX(-24px) rotate(360deg) scale(0.9); opacity: 0; }
  }
  @keyframes petalFall2 {
    0% { top: -8%; transform: translateX(0) rotate(45deg) scale(0.85); opacity: 0; }
    15% { opacity: 0.8; }
    60% { transform: translateX(-42px) rotate(-160deg) scale(1); }
    90% { opacity: 0.7; }
    100% { top: 108%; transform: translateX(28px) rotate(-340deg) scale(0.85); opacity: 0; }
  }
  @keyframes petalFall3 {
    0% { top: -8%; transform: translateX(0) rotate(-30deg) scale(1); opacity: 0; }
    12% { opacity: 0.9; }
    45% { transform: translateX(30px) rotate(120deg) scale(1.1); }
    88% { opacity: 0.8; }
    100% { top: 108%; transform: translateX(-36px) rotate(310deg) scale(0.95); opacity: 0; }
  }

  /* Floating Golden Stardust Sparkles */
  .fl-sparkle {
    position: absolute;
    color: #F7E7CE;
    text-shadow: 0 0 8px #C5A059, 0 0 16px rgba(212, 175, 55, 0.8);
    pointer-events: none;
    font-family: serif;
    line-height: 1;
  }
  .sparkle-1  { font-size: 16px; left: 12%; animation: sparkleRise1 15s linear infinite; animation-delay: 0s; }
  .sparkle-2  { font-size: 20px; left: 28%; animation: sparkleRise2 18s linear infinite; animation-delay: -4s; }
  .sparkle-3  { font-size: 14px; left: 45%; animation: sparkleRise1 13s linear infinite; animation-delay: -7s; }
  .sparkle-4  { font-size: 18px; left: 63%; animation: sparkleRise2 16s linear infinite; animation-delay: -2s; }
  .sparkle-5  { font-size: 22px; left: 78%; animation: sparkleRise1 20s linear infinite; animation-delay: -9s; }
  .sparkle-6  { font-size: 15px; left: 91%; animation: sparkleRise2 14s linear infinite; animation-delay: -5s; }
  .sparkle-7  { font-size: 17px; left: 18%; animation: sparkleRise1 17s linear infinite; animation-delay: -11s; }
  .sparkle-8  { font-size: 21px; left: 38%; animation: sparkleRise2 19s linear infinite; animation-delay: -8s; }
  .sparkle-9  { font-size: 13px; left: 54%; animation: sparkleRise1 12s linear infinite; animation-delay: -13s; }
  .sparkle-10 { font-size: 19px; left: 84%; animation: sparkleRise2 15s linear infinite; animation-delay: -6s; }

  @keyframes sparkleRise1 {
    0%   { bottom: -6%; transform: translateY(0) scale(0.6) rotate(0deg); opacity: 0; }
    20%  { opacity: 0.9; transform: translateY(-40px) scale(1.3) rotate(90deg); }
    50%  { opacity: 0.45; transform: translateY(-120px) scale(0.9) rotate(180deg); }
    80%  { opacity: 0.85; transform: translateY(-220px) scale(1.2) rotate(270deg); }
    100% { bottom: 106%; transform: translateY(-320px) scale(0.5) rotate(360deg); opacity: 0; }
  }
  @keyframes sparkleRise2 {
    0%   { bottom: -6%; transform: translateY(0) scale(0.7) rotate(0deg); opacity: 0; }
    25%  { opacity: 0.95; transform: translateY(-50px) scale(1.4) rotate(-90deg); }
    55%  { opacity: 0.4; transform: translateY(-130px) scale(0.8) rotate(-180deg); }
    85%  { opacity: 0.9; transform: translateY(-230px) scale(1.25) rotate(-270deg); }
    100% { bottom: 106%; transform: translateY(-330px) scale(0.6) rotate(-360deg); opacity: 0; }
  }

  /* Ethereal Glowing Ambient Orbs */
  .fl-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(45px);
    pointer-events: none;
    opacity: 0.38;
    animation: orbPulse 9s ease-in-out infinite alternate;
  }
  .orb-1 {
    width: 280px; height: 280px; top: 12%; left: -60px;
    background: radial-gradient(circle, rgba(139, 136, 168, 0.5) 0%, rgba(212, 175, 55, 0.22) 60%, transparent 80%);
  }
  .orb-2 {
    width: 320px; height: 320px; top: 52%; right: -80px;
    background: radial-gradient(circle, rgba(212, 175, 55, 0.38) 0%, rgba(103, 100, 131, 0.22) 60%, transparent 80%);
    animation-delay: -4.5s;
  }
  .orb-3 {
    width: 260px; height: 260px; bottom: 8%; left: 8%;
    background: radial-gradient(circle, rgba(139, 136, 168, 0.45) 0%, rgba(230, 202, 133, 0.28) 60%, transparent 80%);
    animation-delay: -2s;
  }
  @keyframes orbPulse {
    0% { transform: scale(0.88) translate(0, 0); opacity: 0.25; }
    100% { transform: scale(1.18) translate(25px, -25px); opacity: 0.5; }
  }

  /* Floating Side Botanical Branches */
  .floating-side-branch {
    position: fixed;
    top: 32%;
    z-index: 6;
    pointer-events: none;
    opacity: 0.65;
    filter: drop-shadow(0 4px 10px rgba(103, 100, 131, 0.2));
  }
  .floating-side-branch.left {
    left: 8px;
    animation: branchFloatLeft 6s ease-in-out infinite alternate;
  }
  .floating-side-branch.right {
    right: 8px;
    animation: branchFloatRight 7s ease-in-out infinite alternate;
  }
  @keyframes branchFloatLeft {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(-16px) rotate(3deg); }
  }
  @keyframes branchFloatRight {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(-18px) rotate(-3deg); }
  }

  /* ========================================= */
  /* COVER SCREEN (ROYAL WAX SEAL & GOLD CARD) */
  /* ========================================= */
  .lavender-cover-screen {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    overflow: hidden;
  }

  .cover-backdrop {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .cover-bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(235, 233, 244, 0.78) 0%, rgba(243, 241, 250, 0.92) 100%);
    backdrop-filter: blur(2px);
  }

  .cover-card-container {
    position: relative;
    z-index: 5;
    width: 100%;
    max-width: 440px;
    animation: floatCoverCard 6s ease-in-out infinite alternate;
  }
  @keyframes floatCoverCard {
    0% { transform: translateY(0); }
    100% { transform: translateY(-7px); }
  }

  .cover-card-glass {
    position: relative;
    overflow: visible;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1.5px solid rgba(197, 160, 89, 0.55);
    border-radius: 28px;
    padding: 2.75rem 1.75rem 2.25rem;
    text-align: center;
    box-shadow: 0 20px 50px rgba(103, 100, 131, 0.18), inset 0 0 0 2px rgba(255, 255, 255, 0.7), inset 0 0 30px rgba(212, 175, 55, 0.08);
  }

  .botanical-crest {
    display: flex;
    justify-content: center;
    margin-bottom: 0.8rem;
  }
  .crest-svg {
    filter: drop-shadow(0 2px 8px rgba(197, 160, 89, 0.35));
  }

  .cover-eyebrow {
    display: block;
    font-size: 11px;
    letter-spacing: 0.28em;
    font-weight: 700;
    color: #676483;
    margin-bottom: 0.5rem;
  }

  .cover-couple-names {
    margin: 0.5rem 0;
    font-family: 'Alex Brush', 'Dancing Script', cursive;
    font-size: 3.4rem;
    line-height: 1.15;
    color: #2E2C3D;
    font-weight: 400;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .cover-couple-names .couple-name {
    background: linear-gradient(135deg, #3D3951 0%, #C5A059 35%, #F7E7CE 50%, #C5A059 65%, #3D3951 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: goldFoilShimmer 8s linear infinite;
    filter: drop-shadow(0 2px 4px rgba(103, 100, 131, 0.15));
  }
  @keyframes goldFoilShimmer {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }

  .couple-amp {
    font-size: 2rem;
    color: #C5A059;
    font-family: 'Cinzel', 'Playfair Display', serif;
    margin: -0.25rem 0;
    text-shadow: 0 0 8px rgba(197, 160, 89, 0.4);
  }

  .cover-divider-flourish {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 1.25rem 0 0.8rem;
  }
  .cover-divider-flourish .line-gold {
    width: 45px;
    height: 1.5px;
    background: linear-gradient(90deg, transparent, #C5A059, transparent);
  }
  .cover-divider-flourish .flower-dot {
    font-size: 1.1rem;
    filter: drop-shadow(0 0 6px rgba(197, 160, 89, 0.4));
  }

  .cover-date-text {
    font-family: 'Cinzel', 'Playfair Display', serif;
    font-size: 14px;
    font-weight: 600;
    color: #676483;
    letter-spacing: 0.08em;
    margin-bottom: 1.5rem;
  }

  .guest-salutation-card {
    background: #F3F1FA;
    border: 1px dashed rgba(197, 160, 89, 0.5);
    border-radius: 14px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    box-shadow: inset 0 0 10px rgba(103, 100, 131, 0.04);
  }
  .guest-salutation-label {
    display: block;
    font-size: 11.5px;
    color: #7A7A7A;
    margin-bottom: 4px;
  }
  .guest-salutation-name {
    margin: 0;
    font-size: 1.18rem;
    font-weight: 700;
    color: #2E2C3D;
  }
  .guest-salutation-sub {
    display: block;
    font-size: 11px;
    color: #7A7A7A;
    margin-top: 2px;
  }

  /* Royal 3D Wax Seal Stamp with Hover Float & Glow */
  .wax-seal-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0.5rem auto 1.5rem;
    cursor: pointer;
    position: relative;
    user-select: none;
  }
  .wax-seal-aura {
    position: absolute;
    width: 90px;
    height: 90px;
    top: -5px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212, 175, 55, 0.45) 0%, rgba(103, 100, 131, 0) 70%);
    animation: sealAuraPulse 3s ease-in-out infinite alternate;
  }
  .royal-wax-seal {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #8B88A8 0%, #676483 50%, #434057 100%);
    border: 2.5px solid #C5A059;
    box-shadow: 0 12px 28px rgba(67, 64, 87, 0.48), 0 0 18px rgba(212, 175, 55, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.5), inset 0 -3px 6px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: sealHover 3.5s ease-in-out infinite alternate;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .wax-seal-container:hover .royal-wax-seal {
    transform: scale(1.08) translateY(-4px);
    box-shadow: 0 16px 36px rgba(67, 64, 87, 0.6), 0 0 28px rgba(212, 175, 55, 0.65);
  }
  .seal-inner-groove {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    border: 1px dashed rgba(245, 222, 179, 0.75);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
  }
  .seal-monogram {
    font-family: 'Alex Brush', cursive;
    font-size: 1.45rem;
    color: #F7E7CE;
    line-height: 1;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 0 6px rgba(212, 175, 55, 0.85);
  }
  .seal-crest {
    font-size: 10px;
    margin-top: 2px;
    filter: drop-shadow(0 0 4px rgba(212, 175, 55, 0.8));
  }
  .seal-sheen {
    position: absolute;
    top: 7px;
    left: 15px;
    width: 20px;
    height: 11px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: rotate(-35deg);
    filter: blur(1px);
  }
  .seal-prompt {
    display: block;
    margin-top: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #C5A059;
    text-transform: uppercase;
    text-shadow: 0 1px 4px rgba(212, 175, 55, 0.3);
  }
  @keyframes sealHover {
    0% { transform: translateY(0); }
    100% { transform: translateY(-6px); }
  }
  @keyframes sealAuraPulse {
    0% { transform: scale(0.85); opacity: 0.3; }
    100% { transform: scale(1.25); opacity: 0.75; }
  }

  .btn-open-invitation {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 13px 22px;
    background: linear-gradient(135deg, #676483, #8B88A8);
    color: #ffffff;
    border: 1.5px solid rgba(197, 160, 89, 0.6);
    border-radius: 999px;
    font-size: 14.5px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(103, 100, 131, 0.38), 0 0 12px rgba(197, 160, 89, 0.3);
    transition: all 0.25s ease;
  }
  .btn-open-invitation:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 26px rgba(103, 100, 131, 0.48), 0 0 18px rgba(197, 160, 89, 0.5);
  }

  /* ========================================= */
  /* MAIN INVITATION CONTENT                   */
  /* ========================================= */
  .lavender-main-content {
    background: #F3F1FA;
    padding-bottom: 4rem;
  }

  .lavender-section {
    padding: 3.5rem 1.25rem;
  }

  .section-container {
    max-width: 580px;
    margin: 0 auto;
  }

  .section-title-wrap {
    text-align: center;
    margin-bottom: 2.25rem;
  }

  .section-subtitle-pill {
    display: inline-block;
    padding: 3px 14px;
    background: rgba(103, 100, 131, 0.12);
    color: #676483;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }

  .section-heading {
    font-family: 'Cinzel', 'Playfair Display', serif;
    font-size: 2rem;
    font-weight: 700;
    color: #2E2C3D;
    margin: 0;
  }

  .section-desc {
    font-size: 13.5px;
    color: #676483;
    line-height: 1.6;
    margin: 0.5rem auto 0;
    max-width: 460px;
  }

  /* QUOTE SECTION */
  .section-quote {
    text-align: center;
    background: #EBE9F4;
    border-bottom: 1px solid rgba(103, 100, 131, 0.15);
  }
  .bismillah-arabic {
    font-family: 'Amiri', 'Traditional Arabic', serif;
    font-size: 1.8rem;
    color: #676483;
    margin: 0.75rem 0 1.25rem;
  }
  .greeting-lead {
    font-weight: 700;
    font-size: 15px;
    color: #2E2C3D;
    margin-bottom: 0.5rem;
  }
  .greeting-body {
    font-size: 13.5px;
    line-height: 1.7;
    color: #676483;
    margin-bottom: 1.5rem;
  }
  .quote-card {
    background: #ffffff;
    border: 1.5px solid rgba(197, 160, 89, 0.45);
    border-radius: 22px;
    padding: 2rem 1.75rem 1.5rem;
    box-shadow: 0 8px 25px rgba(103, 100, 131, 0.08), inset 0 0 15px rgba(212, 175, 55, 0.04);
    position: relative;
    overflow: visible;
    margin-top: 1.5rem;
  }
  .quote-mark {
    font-size: 2.5rem;
    font-family: 'Cinzel', serif;
    color: #8B88A8;
    line-height: 0;
    height: 14px;
    display: inline-block;
  }
  .quote-content {
    font-size: 13.5px;
    line-height: 1.75;
    color: #4A475C;
    font-style: italic;
    margin: 0.5rem 0;
  }
  .quote-source {
    font-size: 12px;
    font-weight: 700;
    color: #676483;
  }

  /* COUPLE SECTION */
  .couple-showcase-grid {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
  }
  .person-card {
    width: 100%;
    position: relative;
    overflow: visible;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(10px);
    border: 1.5px solid rgba(197, 160, 89, 0.45);
    border-radius: 26px;
    padding: 2.25rem 1.5rem;
    text-align: center;
    box-shadow: 0 14px 35px rgba(103, 100, 131, 0.12), inset 0 0 25px rgba(212, 175, 55, 0.05);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .person-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 45px rgba(103, 100, 131, 0.18), 0 0 20px rgba(212, 175, 55, 0.2);
  }
  .person-photo-frame {
    position: relative;
    width: 170px;
    height: 235px;
    margin: 0 auto 1.5rem;
    border-radius: 85px 85px 24px 24px;
    overflow: hidden;
    border: 3.5px solid #C5A059;
    box-shadow: 0 10px 25px rgba(103, 100, 131, 0.22), 0 0 18px rgba(212, 175, 55, 0.28);
  }
  .photo-aura-glow {
    position: absolute;
    inset: -15px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, rgba(139, 136, 168, 0.15) 50%, transparent 70%);
    pointer-events: none;
    z-index: 1;
    animation: auraPulse 4s ease-in-out infinite alternate;
  }
  @keyframes auraPulse {
    0% { opacity: 0.35; transform: scale(0.92); }
    100% { opacity: 0.85; transform: scale(1.08); }
  }
  .person-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .frame-floral-decor {
    position: absolute;
    font-size: 1.5rem;
    z-index: 2;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
  }
  .frame-floral-decor.top-right { top: 8px; right: 8px; }
  .frame-floral-decor.top-left { top: 8px; left: 8px; }

  .person-full-name {
    font-family: 'Cinzel', 'Playfair Display', serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: #2E2C3D;
    margin: 0 0 0.4rem;
  }
  .person-parents {
    font-size: 12.5px;
    line-height: 1.5;
    color: #676483;
    margin-bottom: 1rem;
  }
  .btn-social-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    background: #F3F1FA;
    border: 1px solid rgba(197, 160, 89, 0.6);
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: #676483;
    text-decoration: none;
    transition: all 0.25s ease;
  }
  .btn-social-pill:hover {
    background: linear-gradient(135deg, #676483, #8B88A8);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(103, 100, 131, 0.3);
  }

  .couple-connector {
    font-family: 'Alex Brush', cursive;
    font-size: 3.8rem;
    color: #C5A059;
    line-height: 1;
    text-shadow: 0 0 10px rgba(197, 160, 89, 0.4);
  }

  /* COUNTDOWN PANEL */
  .section-countdown {
    padding-top: 1rem;
    padding-bottom: 2rem;
  }
  .countdown-glass-panel {
    position: relative;
    overflow: visible;
    background: linear-gradient(135deg, #4A4660 0%, #676483 50%, #3D3951 100%);
    border: 1.5px solid rgba(197, 160, 89, 0.55);
    border-radius: 28px;
    padding: 2.5rem 1.75rem;
    text-align: center;
    color: #ffffff;
    box-shadow: 0 16px 40px rgba(67, 64, 87, 0.35), 0 0 20px rgba(212, 175, 55, 0.2), inset 0 0 30px rgba(212, 175, 55, 0.08);
  }
  .countdown-eyebrow {
    display: block;
    font-size: 11px;
    letter-spacing: 0.22em;
    font-weight: 700;
    color: #F7E7CE;
    margin-bottom: 4px;
    text-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
  }
  .countdown-title {
    font-family: 'Cinzel', serif;
    font-size: 1.6rem;
    margin: 0 0 1.5rem;
  }
  .countdown-timer-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    max-width: 440px;
    margin: 0 auto;
  }
  .timer-box {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(245, 222, 179, 0.4);
    border-radius: 16px;
    padding: 14px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.25);
  }
  .timer-number {
    font-size: 2rem;
    font-weight: 800;
    font-family: 'Cinzel', serif;
    color: #F7E7CE;
    text-shadow: 0 0 10px rgba(212, 175, 55, 0.7);
    line-height: 1;
  }
  .timer-label {
    font-size: 10px;
    letter-spacing: 0.15em;
    opacity: 0.85;
    margin-top: 4px;
  }

  /* EVENTS SECTION */
  .events-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .event-card {
    position: relative;
    overflow: visible;
    background: #ffffff;
    border: 1.5px solid rgba(197, 160, 89, 0.45);
    border-radius: 22px;
    padding: 2.25rem 1.5rem;
    text-align: center;
    box-shadow: 0 10px 28px rgba(103, 100, 131, 0.08);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .event-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 35px rgba(103, 100, 131, 0.14), 0 0 15px rgba(212, 175, 55, 0.15);
  }
  .event-card.primary-event {
    border-color: #C5A059;
    box-shadow: 0 12px 32px rgba(103, 100, 131, 0.12), 0 0 16px rgba(212, 175, 55, 0.18);
    background: linear-gradient(180deg, #FFFFFF 0%, #FAF8FF 100%);
  }
  .event-badge-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  .event-title {
    font-family: 'Cinzel', serif;
    font-size: 1.4rem;
    color: #2E2C3D;
    margin: 0 0 1rem;
  }
  .event-divider {
    width: 60px;
    height: 2px;
    background: #B3B1C6;
    margin: 0 auto 1.25rem;
  }
  .event-meta-row {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 10px;
    font-size: 13.5px;
    color: #4A475C;
    margin-bottom: 0.75rem;
    text-align: left;
  }
  .meta-venue-block p {
    margin: 2px 0 0;
    font-size: 12.5px;
    color: #7A7A7A;
  }
  .btn-maps {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 1rem;
    padding: 9px 18px;
    background: #676483;
    color: #ffffff;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }
  .btn-maps:hover {
    background: #8B88A8;
    transform: translateY(-2px);
  }

  /* TIMELINE SECTION */
  .story-timeline {
    position: relative;
    padding: 1rem 0;
  }
  .story-timeline::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 20px;
    width: 2px;
    background: #B3B1C6;
  }
  .timeline-item {
    position: relative;
    padding-left: 50px;
    margin-bottom: 2rem;
  }
  .timeline-dot {
    position: absolute;
    left: 8px;
    top: 4px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #676483;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 8px rgba(103, 100, 131, 0.4);
  }
  .timeline-card {
    position: relative;
    overflow: visible;
    background: #ffffff;
    border: 1.5px solid rgba(197, 160, 89, 0.4);
    border-radius: 18px;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 6px 18px rgba(103, 100, 131, 0.07);
  }
  .timeline-year {
    display: inline-block;
    padding: 2px 10px;
    background: #EBE9F4;
    color: #676483;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .timeline-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #2E2C3D;
    margin: 0 0 6px;
  }
  .timeline-desc {
    font-size: 13px;
    line-height: 1.6;
    color: #676483;
    margin: 0;
  }

  /* GALLERY SECTION */
  .gallery-mosaic-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .gallery-photo-item {
    aspect-ratio: 1;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(103, 100, 131, 0.12);
  }
  .gallery-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
  .gallery-photo-item:hover .gallery-img {
    transform: scale(1.05);
  }

  /* GIFT SECTION - LUXURY METALLIC FINISH */
  .gift-cards-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }
  .bank-card {
    position: relative;
    overflow: visible;
    background: linear-gradient(135deg, #2D2B3A 0%, #3D3951 55%, #201E2B 100%);
    border: 1.5px solid #C5A059;
    border-radius: 20px;
    padding: 1.5rem 1.75rem;
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.25), 0 0 15px rgba(212, 175, 55, 0.15);
    color: #F5E5C9;
  }
  .bank-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.6rem;
  }
  .bank-name {
    font-weight: 800;
    font-size: 1.15rem;
    color: #F7E7CE;
    letter-spacing: 0.08em;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  }
  .bank-chip {
    font-size: 1.4rem;
    filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.7));
  }
  .account-num-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(197, 160, 89, 0.38);
    padding: 10px 14px;
    border-radius: 12px;
    margin-bottom: 0.5rem;
  }
  .account-num {
    font-family: 'Cinzel', monospace;
    font-size: 1.2rem;
    font-weight: 700;
    color: #F7E7CE;
    letter-spacing: 0.1em;
    text-shadow: 0 0 8px rgba(212, 175, 55, 0.5);
  }
  .btn-copy-account {
    padding: 6px 14px;
    background: linear-gradient(135deg, #C5A059, #E6CA85);
    color: #1F1D28;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(197, 160, 89, 0.4);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .btn-copy-account:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(197, 160, 89, 0.6);
  }
  .btn-copy-address {
    padding: 8px 16px;
    background: linear-gradient(135deg, #676483, #8B88A8);
    color: #ffffff;
    border: none;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(103, 100, 131, 0.3);
    transition: all 0.2s ease;
  }
  .btn-copy-address:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(103, 100, 131, 0.4);
  }
  .account-holder {
    font-size: 12.5px;
    color: #C8C5DC;
  }

  .shipping-card {
    position: relative;
    overflow: visible;
    background: #EBE9F4;
    border: 1.5px solid rgba(197, 160, 89, 0.45);
    border-radius: 18px;
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    box-shadow: 0 6px 18px rgba(103, 100, 131, 0.08);
  }
  .shipping-icon {
    font-size: 1.6rem;
  }
  .shipping-content h4 {
    margin: 0 0 4px;
    font-size: 1rem;
    color: #2E2C3D;
  }
  .shipping-content p {
    margin: 2px 0;
    font-size: 12.5px;
    color: #4A475C;
  }

  /* RSVP SECTION */
  .rsvp-form-container {
    position: relative;
    overflow: visible;
    background: #ffffff;
    border: 1.5px solid rgba(197, 160, 89, 0.5);
    border-radius: 28px;
    padding: 2.25rem 1.5rem;
    box-shadow: 0 14px 35px rgba(103, 100, 131, 0.12), inset 0 0 25px rgba(212, 175, 55, 0.05);
  }
  .rsvp-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
  }
  .form-label {
    font-size: 13px;
    font-weight: 700;
    color: #2E2C3D;
  }
  .form-input, .form-select, .form-textarea {
    width: 100%;
    padding: 10px 14px;
    background: #F3F1FA;
    border: 1px solid #B3B1C6;
    border-radius: 12px;
    font-size: 13.5px;
    color: #2E2C3D;
    font-family: inherit;
    transition: border-color 0.2s ease;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    outline: none;
    border-color: #676483;
    background: #ffffff;
  }
  .attendance-pills {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .attendance-pill {
    padding: 10px;
    border-radius: 12px;
    background: #F3F1FA;
    border: 1.5px solid #B3B1C6;
    font-size: 13px;
    font-weight: 700;
    color: #676483;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .attendance-pill.selected {
    background: #676483;
    border-color: #676483;
    color: #ffffff;
  }
  .btn-submit-rsvp {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: linear-gradient(135deg, #676483, #8B88A8);
    color: #ffffff;
    border: none;
    border-radius: 999px;
    font-size: 14.5px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(103, 100, 131, 0.3);
    margin-top: 0.5rem;
    transition: all 0.2s ease;
  }
  .btn-submit-rsvp:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(103, 100, 131, 0.4);
  }

  .rsvp-success-card {
    text-align: center;
    padding: 2rem 1rem;
  }
  .rsvp-success-card .success-icon {
    font-size: 3rem;
  }
  .rsvp-success-card h3 {
    margin: 0.75rem 0 0.5rem;
    color: #2E2C3D;
  }
  .rsvp-success-card p {
    color: #676483;
    font-size: 13.5px;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }
  .btn-reset-rsvp {
    padding: 8px 18px;
    background: #EBE9F4;
    border: 1px solid #676483;
    border-radius: 999px;
    color: #676483;
    font-weight: 600;
    cursor: pointer;
  }

  /* WISHES BOARD */
  .wishes-board {
    margin-top: 2.25rem;
    padding-top: 1.5rem;
    border-top: 1px solid #EBE9F4;
    text-align: left;
  }
  .wishes-board-title {
    font-size: 1rem;
    font-weight: 700;
    color: #2E2C3D;
    margin: 0 0 1rem;
  }
  .wishes-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 380px;
    overflow-y: auto;
    padding-right: 4px;
  }
  .wish-item {
    background: #F3F1FA;
    border-radius: 12px;
    padding: 12px 14px;
    border-left: 3px solid #676483;
  }
  .wish-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .wish-author {
    font-size: 13px;
    color: #2E2C3D;
  }
  .wish-badge {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 700;
  }
  .badge-hadir {
    background: rgba(107, 171, 138, 0.2);
    color: #3B7E58;
  }
  .badge-absen {
    background: rgba(184, 114, 106, 0.2);
    color: #8B443B;
  }
  .wish-message {
    font-size: 12.5px;
    line-height: 1.5;
    color: #4A475C;
    margin: 0;
  }

  /* FOOTER */
  .lavender-footer {
    padding: 3rem 1.25rem 2rem;
    text-align: center;
    background: #EBE9F4;
    border-top: 1px solid rgba(103, 100, 131, 0.15);
  }
  .footer-crest {
    font-size: 2rem;
    margin-bottom: 0.75rem;
  }
  .footer-thanks {
    font-size: 13.5px;
    line-height: 1.7;
    color: #676483;
    max-width: 480px;
    margin: 0 auto 0.75rem;
  }
  .footer-family {
    font-size: 13px;
    font-weight: 600;
    color: #4A475C;
    margin-bottom: 1.5rem;
  }
  .footer-couple-sig {
    font-family: 'Alex Brush', cursive;
    font-size: 2.8rem;
    color: #2E2C3D;
    line-height: 1.2;
    margin-bottom: 0.4rem;
  }
  .footer-family-names {
    font-size: 12px;
    color: #7A7A7A;
    margin: 0;
  }

  /* ========================================= */
  /* FLOATING QUICK NAVIGATION DOCK            */
  /* ========================================= */
  .floating-quick-dock {
    position: fixed;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 990;
    max-width: 95vw;
  }
  .dock-glass-capsule {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.84);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1.5px solid rgba(197, 160, 89, 0.55);
    border-radius: 999px;
    box-shadow: 0 14px 35px rgba(103, 100, 131, 0.22), 0 0 15px rgba(212, 175, 55, 0.2);
  }
  .dock-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 6px 9px;
    background: transparent;
    border: none;
    border-radius: 999px;
    color: #676483;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 44px;
  }
  .dock-btn:hover {
    background: rgba(103, 100, 131, 0.12);
    color: #2E2C3D;
    transform: translateY(-2px);
  }
  .dock-btn.dock-btn-highlight {
    background: linear-gradient(135deg, #676483, #8B88A8);
    color: #ffffff;
    box-shadow: 0 4px 10px rgba(103, 100, 131, 0.35);
  }
  .dock-btn.dock-btn-highlight:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(103, 100, 131, 0.45);
  }
  .dock-icon {
    font-size: 13px;
    line-height: 1;
  }
  .dock-label {
    font-size: 9.5px;
    letter-spacing: 0.02em;
  }
  @media (max-width: 520px) {
    .dock-glass-capsule {
      gap: 2px;
      padding: 4px 6px;
    }
    .dock-btn {
      padding: 4px 6px;
      min-width: 36px;
    }
    .dock-label {
      display: none;
    }
    .dock-icon {
      font-size: 16px;
    }
  }

  /* ========================================= */
  /* FLORAL CORNER & CREST BORDER ORNAMENTS    */
  /* ========================================= */
  .card-floral-corner {
    position: absolute;
    width: 105px;
    height: 105px;
    z-index: 12;
    pointer-events: none;
    filter: drop-shadow(0 6px 14px rgba(103, 100, 131, 0.32));
    animation: cornerFloraFloat 5s ease-in-out infinite alternate;
  }
  .card-floral-corner.top-left {
    top: -24px;
    left: -24px;
  }
  .card-floral-corner.top-right {
    top: -24px;
    right: -24px;
    transform: scaleX(-1);
    animation: cornerFloraFloatTR 5s ease-in-out infinite alternate -1.5s;
  }
  .card-floral-corner.bottom-left {
    bottom: -24px;
    left: -24px;
    transform: scaleY(-1);
    animation: cornerFloraFloatBL 5s ease-in-out infinite alternate -2.5s;
  }
  .card-floral-corner.bottom-right {
    bottom: -24px;
    right: -24px;
    transform: scale(-1);
    animation: cornerFloraFloatBR 5s ease-in-out infinite alternate -3.5s;
  }

  @keyframes cornerFloraFloat {
    0% { transform: translateY(0); }
    100% { transform: translateY(-5px) rotate(2deg); }
  }
  @keyframes cornerFloraFloatTR {
    0% { transform: scaleX(-1) translateY(0); }
    100% { transform: scaleX(-1) translateY(-5px) rotate(-2deg); }
  }
  @keyframes cornerFloraFloatBL {
    0% { transform: scaleY(-1) translateY(0); }
    100% { transform: scaleY(-1) translateY(5px) rotate(-2deg); }
  }
  @keyframes cornerFloraFloatBR {
    0% { transform: scale(-1) translateY(0); }
    100% { transform: scale(-1) translateY(5px) rotate(2deg); }
  }

  .card-floral-crest {
    position: absolute;
    top: -26px;
    left: 50%;
    transform: translateX(-50%);
    width: 220px;
    height: 54px;
    z-index: 12;
    pointer-events: none;
    filter: drop-shadow(0 5px 12px rgba(103, 100, 131, 0.28));
    animation: crestFloat 5s ease-in-out infinite alternate;
  }
  @keyframes crestFloat {
    0% { transform: translateX(-50%) translateY(0); }
    100% { transform: translateX(-50%) translateY(-4px); }
  }

  @media (max-width: 520px) {
    .card-floral-corner {
      width: 78px;
      height: 78px;
    }
    .card-floral-corner.top-left {
      top: -18px;
      left: -18px;
    }
    .card-floral-corner.top-right {
      top: -18px;
      right: -18px;
    }
    .card-floral-corner.bottom-left {
      bottom: -18px;
      left: -18px;
    }
    .card-floral-corner.bottom-right {
      bottom: -18px;
      right: -18px;
    }

    .card-floral-crest {
      width: 168px;
      height: 42px;
      top: -20px;
    }
  }
</style>
