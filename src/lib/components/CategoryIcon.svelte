<script lang="ts">
  interface Props {
    icon?: string;
    size?: number;
    class?: string;
  }

  let { icon = 'catering', size = 18, class: className = '' }: Props = $props();

  const normalizedIcon = $derived((icon || '').trim().toLowerCase());

  const isEmoji = $derived.by(() => {
    if (!icon) return false;
    return /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon) || (icon.length <= 2 && icon.charCodeAt(0) > 127);
  });
</script>

{#if isEmoji}
  <span class="inline-flex items-center justify-center leading-none select-none {className}" style="font-size: {size}px; line-height: 1;">
    {icon}
  </span>
{:else if normalizedIcon === 'catering' || normalizedIcon === 'katering' || normalizedIcon === 'makanan' || normalizedIcon === 'food'}
  <!-- Catering / Utensils & Plate -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0 {className}">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
    <line x1="6" y1="1" x2="6" y2="4"></line>
    <line x1="10" y1="1" x2="10" y2="4"></line>
    <line x1="14" y1="1" x2="14" y2="4"></line>
  </svg>
{:else if normalizedIcon === 'venue' || normalizedIcon === 'gedung' || normalizedIcon === 'lokasi' || normalizedIcon === 'tempat' || normalizedIcon === 'building'}
  <!-- Venue / Building -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0 {className}">
    <path d="M3 21h18"></path>
    <path d="M5 21V7l7-4 7 4v14"></path>
    <path d="M9 10h1"></path>
    <path d="M9 14h1"></path>
    <path d="M14 10h1"></path>
    <path d="M14 14h1"></path>
  </svg>
{:else if normalizedIcon === 'sparkles' || normalizedIcon === 'dekorasi' || normalizedIcon === 'bunga' || normalizedIcon === 'decor'}
  <!-- Decoration / Sparkles -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0 {className}">
    <path d="M12 2l2.2 6.8a1.5 1.5 0 0 0 .95.95L22 12l-6.8 2.2a1.5 1.5 0 0 0-.95.95L12 22l-2.2-6.8a1.5 1.5 0 0 0-.95-.95L2 12l6.8-2.2a1.5 1.5 0 0 0 .95-.95L12 2z"></path>
  </svg>
{:else if normalizedIcon === 'gift' || normalizedIcon === 'camera' || normalizedIcon === 'foto' || normalizedIcon === 'dokumentasi' || normalizedIcon === 'photo'}
  <!-- Camera / Documentation -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0 {className}">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
{:else if normalizedIcon === 'ring' || normalizedIcon === 'busana' || normalizedIcon === 'rias' || normalizedIcon === 'makeup' || normalizedIcon === 'dress'}
  <!-- Wedding Rings -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0 {className}">
    <circle cx="8" cy="14" r="5"></circle>
    <circle cx="16" cy="14" r="5"></circle>
    <path d="M12 9l.6-1.8l1.8-.6l-1.8-.6l-.6-1.8l-.6 1.8l-1.8.6l1.8.6z"></path>
  </svg>
{:else if normalizedIcon === 'invitation' || normalizedIcon === 'undangan' || normalizedIcon === 'souvenir' || normalizedIcon === 'envelope' || normalizedIcon === 'card'}
  <!-- Invitation / Mail -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0 {className}">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
{:else if normalizedIcon === 'music' || normalizedIcon === 'musik' || normalizedIcon === 'hiburan' || normalizedIcon === 'entertainment'}
  <!-- Music / Entertainment -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0 {className}">
    <path d="M9 18V5l12-2v13"></path>
    <circle cx="6" cy="18" r="3"></circle>
    <circle cx="18" cy="16" r="3"></circle>
  </svg>
{:else if normalizedIcon === 'transport' || normalizedIcon === 'transportasi' || normalizedIcon === 'mobil' || normalizedIcon === 'car'}
  <!-- Transport / Car -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0 {className}">
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
    <circle cx="5.5" cy="18.5" r="2.5"></circle>
    <circle cx="18.5" cy="18.5" r="2.5"></circle>
  </svg>
{:else if normalizedIcon === 'checklist' || normalizedIcon === 'administrasi' || normalizedIcon === 'kua' || normalizedIcon === 'dokumen'}
  <!-- Checklist / Admin -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0 {className}">
    <path d="M9 11l3 3L22 4"></path>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
{:else if normalizedIcon === 'budget' || normalizedIcon === 'dana' || normalizedIcon === 'buffer' || normalizedIcon === 'cadangan'}
  <!-- Shield / Buffer Fund -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0 {className}">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
{:else if normalizedIcon === 'savings' || normalizedIcon === 'tabungan' || normalizedIcon === 'uang'}
  <!-- Money / Savings -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0 {className}">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
    <path d="M12 6v2m0 8v2"></path>
  </svg>
{:else}
  <!-- Default / Fallback Category Icon (Sparkle Star) -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block flex-shrink-0 {className}">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
    <line x1="7" y1="7" x2="7.01" y2="7"></line>
  </svg>
{/if}
