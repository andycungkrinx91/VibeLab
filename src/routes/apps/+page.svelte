<script lang="ts">
	import MotionShell from '$lib/components/MotionShell.svelte';
	import BentoAppCard from '$lib/components/BentoAppCard.svelte';
	import { APPS, APP_PATTERN_SHOWCASE } from '$lib/metadata';

	let searchQuery = $state('');

	let filteredApps = $derived(
		APPS.filter(
			(app) =>
				app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				app.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
				app.familiarCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
				app.familiarCategorySubtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
				app.securityIdentity.toLowerCase().includes(searchQuery.toLowerCase()) ||
				app.description.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<div class="mx-auto mt-8 flex h-full w-full max-w-6xl flex-col gap-8">
	<MotionShell delay={0}>
		<div class="mb-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
			<div>
				<h1 class="mb-2 text-3xl font-bold text-text-base">Command Center Apps</h1>
				<p class="text-sm text-text-muted md:text-base">
					Pilih mini-app untuk menjalankan workflow security: Detect, Triage, Patch, Verify, Deploy.
				</p>
			</div>

			<!-- Search Filter -->
			<div class="relative w-full md:w-64">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<svg
						class="h-4 w-4 text-text-muted"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari modul..."
					class="w-full rounded-lg border border-border bg-bg-panel py-2 pr-4 pl-10 text-sm text-text-base placeholder-text-muted transition-all duration-200 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
				/>
			</div>
		</div>
	</MotionShell>

	<MotionShell delay={50}>
		<div class="electric-border electric-border-static rounded-2xl border border-border/60 bg-bg-panel/50 p-5 shadow-md backdrop-blur-sm">
			<div class="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
				<div>
					<div class="text-xs font-semibold tracking-[0.25em] text-text-muted uppercase">
						10 Pola App Vibe Coding
					</div>
					<p class="mt-2 max-w-4xl text-sm leading-relaxed text-text-muted">
						VibeSec Lab menunjukkan bahwa tema security bisa dikemas ke berbagai pola aplikasi sederhana: game, dashboard, kalkulator, portfolio, media player, library, countdown, habit tracker, dan storyboard interaktif.
					</p>
				</div>
				<span class="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-accent uppercase">
					Pattern map
				</span>
			</div>

			<div class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
				{#each APP_PATTERN_SHOWCASE as app}
					<div class="rounded-xl border border-border/70 bg-bg-base/70 p-3 transition-colors hover:border-accent/30 hover:bg-bg-base/90">
						<div class="flex items-start justify-between gap-3">
							<div>
								<div class="text-sm font-semibold text-text-base">{app.title}</div>
								<div class="mt-1 text-xs text-text-muted">{app.securityIdentity}</div>
							</div>
							<span class="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
								{app.familiarCategory}
							</span>
						</div>
						<div class="mt-2 text-[11px] text-text-muted">{app.familiarCategorySubtitle}</div>
					</div>
				{/each}
			</div>
		</div>
	</MotionShell>

	<!-- Full App Grid -->
	<MotionShell delay={100}>
		{#if filteredApps.length > 0}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredApps as app}
					<BentoAppCard {...app} href={app.route} />
				{/each}
			</div>
		{:else}
			<div
				class="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-bg-panel/50 p-12 text-center"
			>
				<svg
					class="mb-4 h-12 w-12 text-text-muted"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<h3 class="mb-1 text-lg font-semibold text-text-base">Modul Tidak Ditemukan</h3>
				<p class="text-sm text-text-muted">
					Tidak ada mini-app yang cocok dengan pencarian "{searchQuery}".
				</p>
				<button
					class="mt-4 text-sm text-accent decoration-accent/50 underline-offset-4 hover:underline"
					onclick={() => (searchQuery = '')}
				>
					Reset Pencarian
				</button>
			</div>
		{/if}
	</MotionShell>
</div>
