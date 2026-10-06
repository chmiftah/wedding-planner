<script lang="ts">
  import { page } from '$app/state';
  import { wedding, addInvitationWish } from '#lib/stores/wedding';
  import RomanticFloral from '#lib/components/invitation/RomanticFloral.svelte';
  import ClassicGold from '#lib/components/invitation/ClassicGold.svelte';
  import EmeraldBotanical from '#lib/components/invitation/EmeraldBotanical.svelte';

  const token = $derived(page.params.token);
  const guest = $derived($wedding.guests.find(g => g.rsvpToken === token));

  const guestName = $derived(
    guest?.name || (token === 'preview' || token === 'tamu-spesial' ? 'Tamu Spesial' : 'Tamu Undangan')
  );

  function handleRsvp(data: { attendance: 'hadir' | 'tidak_hadir'; count: number; message: string; name: string }) {
    // 1. If guest matched, update guest store
    if (guest) {
      wedding.update(s => ({
        ...s,
        guests: s.guests.map(g =>
          g.rsvpToken === token
            ? {
                ...g,
                rsvpStatus: data.attendance,
                guestCount: data.count,
                rsvpMessage: data.message,
                rsvpRespondedAt: new Date().toISOString().slice(0, 10),
              }
            : g
        ),
      }));
    }

    // 2. Add to public wishes list
    addInvitationWish({
      name: data.name,
      message: data.message,
      attendance: data.attendance,
    });
  }
</script>

<svelte:head>
  <title>Undangan Pernikahan {$wedding.invitation.couple.groomNickname} &amp; {$wedding.invitation.couple.brideNickname}</title>
  <meta name="description" content="Undangan Pernikahan Digital {$wedding.invitation.couple.groomFullName} &amp; {$wedding.invitation.couple.brideFullName}" />
</svelte:head>

<div class="public-invitation-container theme-{$wedding.invitation.theme}">
  {#if $wedding.invitation.theme === 'classic_gold'}
    <ClassicGold
      invitation={$wedding.invitation}
      guestName={guestName}
      guestToken={token}
      isPreview={false}
      onRsvpSubmit={handleRsvp}
    />
  {:else if $wedding.invitation.theme === 'emerald_botanical'}
    <EmeraldBotanical
      invitation={$wedding.invitation}
      guestName={guestName}
      guestToken={token}
      isPreview={false}
      onRsvpSubmit={handleRsvp}
    />
  {:else}
    <RomanticFloral
      invitation={$wedding.invitation}
      guestName={guestName}
      guestToken={token}
      isPreview={false}
      onRsvpSubmit={handleRsvp}
    />
  {/if}
</div>

<style>
  .public-invitation-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
  }
  .public-invitation-container.theme-romantic_terracotta {
    background: #FFF8F6;
  }
  .public-invitation-container.theme-classic_gold {
    background: #121214;
  }
  .public-invitation-container.theme-emerald_botanical {
    background: #F7F9F6;
  }
</style>
