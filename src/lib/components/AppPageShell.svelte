<script lang="ts">
  import { APPS } from '$lib/metadata';
  import MotionShell from '$lib/components/MotionShell.svelte';
  import AppHeader from '$lib/components/AppHeader.svelte';

  let {
    appId,
    children
  } = $props<{ appId: string; children: any }>();

  let currentIndex = $derived(APPS.findIndex((a) => a.slug === appId || a.id === appId));
  let prevApp = $derived(currentIndex > 0 ? APPS[currentIndex - 1] : null);
  let nextApp = $derived(currentIndex < APPS.length - 1 ? APPS[currentIndex + 1] : null);
</script>

<div class="flex flex-col min-h-screen">
  <!-- App Header -->
  <header class="mb-6 sm:mb-8">
    <AppHeader {appId} />

    <!-- Navigation hint bar -->
    <div
      class="mt-3 flex flex-col gap-2 rounded-lg border border-border/50 bg-bg-base/40 px-4 py-2.5 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-2">
        <span class="font-semibold text-text-base">Navigasi app</span>
        <span class="hidden opacity-50 sm:inline">•</span>
        <span>Urutan module mempertahankan flow aplikasi yang sudah ada.</span>
      </div>
    </div>
  </header>

  <main class="flex-1">
    <MotionShell delay={80}>
      {@render children()}
    </MotionShell>
  </main>

  <!-- Prev / Next Navigation -->
  <footer class="mt-12 border-t border-border/40 pt-6 pb-8">
    <div class="flex items-center justify-between gap-4">
		{#if prevApp}
			<a
				href={prevApp.route}
				class="nav-link group flex min-w-0 max-w-[48%] flex-col items-start gap-1 rounded-xl border border-border/50 bg-bg-panel/60 px-4 py-3 transition-[border-color,background-color,box-shadow] duration-200 hover:border-accent/30 hover:bg-bg-panel hover:shadow-[0_4px_16px_-4px_var(--color-accent-glow)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base focus-visible:outline-none"
			>
          <span class="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
            <svg class="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-0.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M11 3.5L6 8l5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
            Sebelumnya
          </span>
          <span class="truncate text-sm font-semibold text-accent">{prevApp.title}</span>
        </a>
      {:else}
        <div></div>
      {/if}

		{#if nextApp}
			<a
				href={nextApp.route}
				class="nav-link group flex min-w-0 max-w-[48%] flex-col items-end gap-1 rounded-xl border border-border/50 bg-bg-panel/60 px-4 py-3 text-right transition-[border-color,background-color,box-shadow] duration-200 hover:border-accent/30 hover:bg-bg-panel hover:shadow-[0_4px_16px_-4px_var(--color-accent-glow)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base focus-visible:outline-none"
			>
          <span class="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
            Berikutnya
            <svg class="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M5 3.5L10 8l-5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </span>
          <span class="truncate text-sm font-semibold text-accent">{nextApp.title}</span>
        </a>
      {:else}
        <div></div>
      {/if}
    </div>
  </footer>
</div>
