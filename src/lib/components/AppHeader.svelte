<script lang="ts">
	import { getAppBySlug } from '$lib/metadata';

	let { appId } = $props<{ appId: string }>();

	let app = $derived(getAppBySlug(appId));
</script>

{#if app}
	<div
		class="electric-border electric-border-active relative overflow-hidden rounded-2xl border border-border/60 bg-bg-panel/70 p-5 shadow-lg backdrop-blur-sm sm:p-6"
	>
		<!-- Subtle top glow line -->
		<div
			class="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"
		></div>

		<div class="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
			<!-- Left: back button + meta -->
			<div class="flex min-w-0 flex-1 gap-3 sm:gap-4">
				<!-- Back button with glow breathing -->
				<a
					href="/apps"
					aria-label="Kembali ke Command Center"
					title="Kembali ke Command Center"
					class="back-btn-glow btn-shimmer group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-bg-base/80 text-accent shadow-[0_0_12px_var(--color-accent-glow)] hover:border-accent hover:bg-accent/10 hover:shadow-[0_0_28px_var(--color-accent-glow)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base focus-visible:outline-none sm:h-12 sm:w-12"
				>
					<svg
						class="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M15 18l-6-6 6-6" />
					</svg>
				</a>

				<!-- App meta block -->
				<div class="min-w-0 flex-1">
					<!-- Category breadcrumb tags -->
					<div
						class="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-text-muted"
					>
						<span
							class="inline-flex items-center gap-1 rounded-full border border-border/60 bg-bg-base/70 px-2.5 py-1 text-text-muted"
						>
							Jenis App
						</span>
						<span
							class="rounded-full border border-accent/35 bg-accent/10 px-2.5 py-1 text-accent shadow-[0_0_10px_var(--color-accent-glow)]"
						>
							{app.familiarCategory}
						</span>
						<span class="text-text-muted/70">{app.familiarCategorySubtitle}</span>
					</div>

					<!-- Icon + title row -->
					<div class="flex flex-wrap items-center gap-3">
						{#if app.icon}
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-bg-base/80 text-lg shadow-[0_0_16px_var(--color-accent-glow)] sm:h-11 sm:w-11"
							>
								{app.icon}
							</div>
						{/if}
						<div class="min-w-0">
							<h1 class="truncate text-2xl font-bold text-text-base sm:text-3xl">{app.title}</h1>
							<!-- Identity + category chips -->
							<div class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
								<span
									class="rounded border border-accent-secondary/30 bg-accent-secondary/10 px-2 py-0.5 font-semibold text-accent-secondary"
								>
									{app.securityIdentity}
								</span>
								<span class="rounded border border-border/50 bg-bg-base/70 px-2 py-0.5">
									{app.category}
								</span>
							</div>
						</div>
					</div>

					<p class="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted">{app.description}</p>
				</div>
			</div>

			<!-- Right: meta badges -->
			<div class="flex flex-wrap gap-2 md:justify-end">
				<span
					class="rounded border border-border/50 bg-bg-base/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted"
				>
					{app.badge}
				</span>
				<span
					class="rounded border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent"
				>
					{app.workflow}
				</span>
				<span
					class="rounded border border-warning/30 bg-warning/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-warning"
				>
					{app.priority}
				</span>
				<span
					class="rounded border border-border/50 bg-bg-base/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-base"
				>
					AI: {app.aiAction}
				</span>
			</div>
		</div>
	</div>
{/if}
