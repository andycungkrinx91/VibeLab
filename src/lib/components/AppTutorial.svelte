<script lang="ts">
	let {
		purpose,
		howToUse,
		aiAction,
		output,
		securityNote
	} = $props<{
		purpose: string;
		howToUse: string;
		aiAction: string;
		output: string;
		securityNote: string;
	}>();

	let cards = $derived([
		{ label: 'Tujuan',           value: purpose,      accent: false },
		{ label: 'Cara Pakai',       value: howToUse,     accent: false },
		{ label: 'Aksi AI',          value: aiAction,     accent: false },
		{ label: 'Output',           value: output,       accent: false },
		{ label: 'Catatan Security', value: securityNote, accent: true  }
	]);
</script>

<section
	class="electric-border electric-border-static mt-8 overflow-hidden rounded-2xl border border-border/60 bg-bg-panel/60 shadow-md backdrop-blur-sm"
>
	<!-- Header bar -->
	<div
		class="relative z-10 flex items-center justify-between gap-3 border-b border-border/50 bg-bg-base/40 px-5 py-3.5"
	>
		<div>
			<div class="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Tutorial</div>
			<p class="mt-0.5 text-xs text-text-muted">Panduan singkat penggunaan app.</p>
		</div>
		<span
			class="rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent shadow-[0_0_10px_var(--color-accent-glow)]"
			>How to</span
		>
	</div>

	<!-- Tutorial grid -->
	<div class="relative z-10 grid gap-px bg-border/20 md:grid-cols-2 xl:grid-cols-5">
		{#each cards as card, i}
			<div
				class="bg-bg-panel p-4 transition-colors duration-200 hover:bg-bg-base/60 {card.accent
					? 'border-t border-accent/20 bg-accent/5 xl:border-t-0 xl:border-l xl:border-accent/20'
					: ''}"
			>
				<div
					class="mb-2 text-[10px] font-bold uppercase tracking-wider {card.accent
						? 'text-accent'
						: 'text-text-muted'}"
				>
					{card.label}
				</div>
				<p class="text-sm leading-relaxed text-text-base">{card.value}</p>
			</div>
		{/each}
	</div>
</section>
