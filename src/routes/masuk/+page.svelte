<script lang="ts">
  import { onMount } from 'svelte';
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  interface Props {
    form?: ActionData;
  }

  let { form }: Props = $props();

  let showPassword = $state(false);
  let isLoading = $state(false);
  let localWeddingPayload = $state('');

  onMount(() => {
    try {
      const saved = localStorage.getItem('wedding-planner-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.info && (parsed.wizardCompleted || parsed.info.brideName || parsed.info.groomName)) {
          const submission = {
            brideName: parsed.info.brideName || 'Mempelai Wanita',
            groomName: parsed.info.groomName || 'Mempelai Pria',
            weddingDate: parsed.info.weddingDate || null,
            dateNote: parsed.info.dateNote || '',
            venueType: parsed.info.venueType || 'gedung',
            style: parsed.info.style || 'menengah',
            guestCount: parsed.info.guestCount || 100,
            totalBudget: parsed.info.totalBudget || 0,
            monthlySavingsTarget: parsed.monthlySavingsTarget || 0,
            fundingSources: (parsed.fundingSources || []).map((f: any) => ({
              type: f.type,
              name: f.name,
              confirmedAmount: f.confirmedAmount,
              isEstimate: f.isEstimate,
              notes: f.notes || '',
            })),
          };
          localWeddingPayload = JSON.stringify(submission);
        }
      }
    } catch (e) {
      console.warn('Gagal membaca rencana pernikahan lokal:', e);
    }
  });
</script>

<svelte:head>
  <title>Masuk — Wedding Planner</title>
  <meta name="description" content="Masuk ke akun Wedding Planner Anda untuk mengelola anggaran, vendor, dan undangan pernikahan impian." />
</svelte:head>

<div class="auth-page">
  <div class="auth-card">
    <!-- Header Brand -->
    <div class="auth-header">
      <a href="/" class="auth-logo" title="Kembali ke Beranda">
        <span class="auth-logo-icon">💍</span>
        <span class="auth-logo-text">Wedding Planner</span>
      </a>
      <h1 class="auth-title">Selamat Datang</h1>
      <p class="auth-subtitle">Masuk untuk melanjutkan perencanaan pernikahan impian Anda</p>
    </div>

    <!-- Error Alert -->
    {#if form?.error}
      <div class="auth-error-banner" role="alert">
        <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 flex-shrink-0">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>{form.error}</span>
      </div>
    {/if}

    <!-- Form -->
    <form
      method="POST"
      class="auth-form"
      use:enhance={() => {
        isLoading = true;
        return async ({ update }) => {
          isLoading = false;
          await update();
        };
      }}
    >
      {#if localWeddingPayload}
        <input type="hidden" name="localWeddingData" value={localWeddingPayload} />
      {/if}
      <div class="form-group">
        <label for="email" class="form-label">Alamat Email</label>
        <div class="input-wrapper">
          <span class="input-icon">✉️</span>
          <input
            id="email"
            name="email"
            type="email"
            required
            autocomplete="email"
            placeholder="nama@email.com"
            class="form-input"
            value={form?.email ?? ''}
          />
        </div>
      </div>

      <div class="form-group">
        <div class="flex-between">
          <label for="password" class="form-label">Kata Sandi</label>
        </div>
        <div class="input-wrapper">
          <span class="input-icon">🔒</span>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="form-input"
          />
          <button
            type="button"
            class="toggle-password-btn"
            onclick={() => (showPassword = !showPassword)}
            title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            aria-label="Tampilkan atau sembunyikan kata sandi"
          >
            {showPassword ? '👁️' : '🙈'}
          </button>
        </div>
      </div>

      <button type="submit" class="submit-btn" disabled={isLoading}>
        {#if isLoading}
          <span class="spinner"></span>
          <span>Memproses...</span>
        {:else}
          <span>Masuk ke Akun</span>
          <span class="arrow-icon">→</span>
        {/if}
      </button>
    </form>

    <!-- Footer Switcher -->
    <div class="auth-footer">
      <p>
        Belum memiliki akun?
        <a href="/daftar" class="auth-link">Daftar sekarang gratis</a>
      </p>
      <div class="auth-back-link">
        <a href="/">← Kembali ke Halaman Utama</a>
      </div>
    </div>
  </div>
</div>

<style>
  .auth-page {
    min-height: calc(100vh - 80px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-8) var(--space-4);
    background: radial-gradient(circle at 50% 20%, rgba(201, 132, 122, 0.08) 0%, rgba(255, 248, 246, 0.6) 70%),
      var(--color-surface);
  }

  .auth-card {
    width: 100%;
    max-width: 440px;
    background: #ffffff;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl, 20px);
    box-shadow: 0 10px 30px rgba(139, 94, 82, 0.08), 0 2px 8px rgba(139, 94, 82, 0.04);
    padding: var(--space-10) var(--space-8);
    position: relative;
    overflow: hidden;
  }

  .auth-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--color-primary-light), var(--color-primary), var(--color-accent));
  }

  .auth-header {
    text-align: center;
    margin-bottom: var(--space-8);
  }

  .auth-logo {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    text-decoration: none;
    margin-bottom: var(--space-4);
  }

  .auth-logo-icon {
    font-size: 1.5rem;
  }

  .auth-logo-text {
    font-family: var(--font-display);
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--color-text);
  }

  .auth-title {
    font-family: var(--font-display);
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 var(--space-2) 0;
  }

  .auth-subtitle {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
    line-height: 1.5;
  }

  .auth-error-banner {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    background: var(--color-danger-bg);
    border: 1px solid rgba(192, 86, 90, 0.25);
    color: var(--color-danger);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-lg, 12px);
    font-size: var(--font-size-sm);
    margin-bottom: var(--space-6);
    animation: shake 0.3s ease;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .flex-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .form-label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: var(--space-3);
    font-size: 1rem;
    pointer-events: none;
    opacity: 0.7;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem var(--space-4) 0.75rem 2.6rem;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-lg, 12px);
    font-size: var(--font-size-base);
    color: var(--color-text);
    background: #ffffff;
    transition: all 0.2s ease;
    outline: none;
    font-family: inherit;
  }

  .form-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(201, 132, 122, 0.2);
  }

  .toggle-password-btn {
    position: absolute;
    right: var(--space-3);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    padding: 0.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .toggle-password-btn:hover {
    opacity: 1;
  }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    padding: 0.85rem var(--space-6);
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    color: #ffffff;
    border: none;
    border-radius: var(--radius-lg, 12px);
    font-size: var(--font-size-base);
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(201, 132, 122, 0.35);
    transition: all 0.2s ease;
    margin-top: var(--space-2);
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(201, 132, 122, 0.45);
  }

  .submit-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .arrow-icon {
    font-size: 1.1rem;
    transition: transform 0.2s ease;
  }

  .submit-btn:hover:not(:disabled) .arrow-icon {
    transform: translateX(3px);
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .auth-footer {
    margin-top: var(--space-8);
    text-align: center;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .auth-link {
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .auth-link:hover {
    color: var(--color-accent-dark);
    text-decoration: underline;
  }

  .auth-back-link {
    margin-top: var(--space-4);
  }

  .auth-back-link a {
    color: var(--color-text-subtle);
    font-size: var(--font-size-xs);
    text-decoration: none;
  }

  .auth-back-link a:hover {
    color: var(--color-text);
  }
</style>
