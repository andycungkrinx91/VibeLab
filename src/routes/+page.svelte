<script lang="ts">
	import MotionShell from '$lib/components/MotionShell.svelte';
	import BentoAppCard from '$lib/components/BentoAppCard.svelte';
	import { APPS } from '$lib/metadata';
</script>

<div class="mx-auto mt-8 flex min-h-0 w-full max-w-6xl flex-col gap-12">
	<!-- Hero Section -->
	<MotionShell delay={0}>
		<div
			class="electric-border electric-border-active relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-bg-panel/50 px-4 py-12 text-center backdrop-blur-sm"
		>
			<div
				class="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent"
			></div>

			<div
				class="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent"
			>
				<span class="relative flex h-2 w-2">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"
					></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
				</span>
				System Online
			</div>

			<h1 class="mb-4 text-4xl font-black tracking-tight text-text-base md:text-6xl">
				VibeSec Lab <span class="font-mono font-normal text-accent opacity-80">_</span>
			</h1>

			<p class="mb-8 max-w-2xl text-lg leading-relaxed text-text-muted md:text-xl">
				Playground interaktif untuk <span
					class="border-b border-accent/50 font-semibold text-text-base">CVE intelligence</span
				>,
				<span class="border-b border-warning/50 font-semibold text-text-base">patch planning</span>,
				dan
				<span class="border-b border-critical/50 font-semibold text-text-base"
					>incident response</span
				>.
			</p>

			<a
				href="/apps"
				class="btn-shimmer inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-4 font-bold text-bg-base transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_var(--color-accent-glow)]"
			>
				Masuk Command Center
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</a>
		</div>
	</MotionShell>

	<!-- Workflow Pipeline -->
	<MotionShell delay={100}>
		<div class="flex flex-col gap-4">
			<div
				class="flex items-center gap-2 px-2 text-sm font-bold tracking-widest text-text-muted uppercase"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
						clip-rule="evenodd"
					/>
				</svg>
				Security Workflow
			</div>
			<div class="grid grid-cols-2 gap-4 md:grid-cols-5">
				{#each ['Detect', 'Triage', 'Patch', 'Verify', 'Deploy'] as step, i}
					<div
						class="group relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-panel p-4"
					>
						<div
							class="absolute -right-2 -bottom-4 text-2xl font-black text-bg-base opacity-20 drop-shadow-[0_0_1px_var(--color-text-muted)] transition-all duration-300 group-hover:drop-shadow-[0_0_2px_var(--color-accent)]"
						>
							0{i + 1}
						</div>
						<span
							class="z-10 font-mono text-sm text-text-base transition-colors group-hover:text-accent"
							>{step}</span
						>
					</div>
				{/each}
			</div>
		</div>
	</MotionShell>

	<!-- Apps Grid Preview -->
	<MotionShell delay={200}>
		<div class="flex flex-col gap-6">
			<div class="flex items-center justify-between px-2">
				<div
					class="flex items-center gap-2 text-sm font-bold tracking-widest text-text-muted uppercase"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
						/>
					</svg>
					Available Modules
				</div>
				<a
					href="/apps"
					class="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-bg-base focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base focus-visible:outline-none"
				>
					View All Modules &rarr;
				</a>
			</div>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each APPS.slice(0, 6) as app}
					<BentoAppCard {...app} href={app.route} />
				{/each}
			</div>
		</div>
	</MotionShell>

	<!-- System Widgets -->
	<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-4">
		<MotionShell delay={300} class="md:col-span-1">
			<div
				class="hover-lift h-full rounded-lg border border-border bg-bg-panel p-6 shadow-md transition-all duration-300"
			>
				<h3 class="mb-2 text-xs font-semibold tracking-wider text-text-muted uppercase">
					Status Sistem
				</h3>
				<div class="text-3xl font-bold text-accent">Online</div>
				<div class="mt-4 flex gap-1">
					{#each Array(5) as _, i}
						<div class="h-1.5 flex-1 rounded-full bg-accent opacity-{100 - i * 20}"></div>
					{/each}
				</div>
			</div>
		</MotionShell>

		<MotionShell delay={350} class="md:col-span-1">
			<div
				class="hover-lift h-full rounded-lg border border-border bg-bg-panel p-6 shadow-md transition-all duration-300"
			>
				<h3 class="mb-2 text-xs font-semibold tracking-wider text-text-muted uppercase">
					Threat Level
				</h3>
				<div class="text-3xl font-bold text-warning">Elevated</div>
				<div class="mt-4 flex gap-1">
					{#each Array(5) as _, i}
						<div class="h-1.5 flex-1 rounded-full {i < 3 ? 'bg-warning' : 'bg-bg-base'}"></div>
					{/each}
				</div>
			</div>
		</MotionShell>

		<MotionShell delay={400} class="md:col-span-2">
			<div
				class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-bg-panel shadow-md"
			>
				<div class="flex items-center justify-between border-b border-border bg-bg-base px-4 py-2">
					<div class="text-xs font-medium tracking-wider text-text-muted uppercase">
						Command Log
					</div>
					<div class="flex gap-2">
						<div class="h-2 w-2 rounded-full bg-critical/50"></div>
						<div class="h-2 w-2 rounded-full bg-warning/50"></div>
						<div class="h-2 w-2 rounded-full bg-accent/50"></div>
					</div>
				</div>
				<div class="flex-1 p-4 font-mono text-xs leading-relaxed">
					<div class="mb-1 text-text-muted">
						[sys] initializing landing sequence... <span class="text-accent">OK</span>
					</div>
					<div class="mb-1 text-text-muted">
						[net] establishing secure tunnel... <span class="text-accent">OK</span>
					</div>
					<div class="mb-1 text-text-muted">
						[ai] gemini interface connected... <span class="text-accent">OK</span>
					</div>
					<div class="mt-2 flex items-center">
						<span class="mr-2 text-accent">root@vibesec:~#</span>
						<span class="inline-block h-3 w-1.5 animate-pulse bg-accent"></span>
					</div>
				</div>
			</div>
		</MotionShell>
	</div>

	<!-- Narrative -->
	<MotionShell delay={500}>
		<div class="mx-auto mt-8 max-w-3xl border-t border-border/50 pt-12 pb-8 text-center">
			<h2 class="mb-4 text-xl font-bold text-text-base">Membangun VibeSec Lab</h2>
			<p class="text-sm leading-relaxed text-text-muted">
				Proyek ini mendemonstrasikan perbedaan antara <span class="text-text-base"
					>raw vibe coding</span
				>
				(sekadar prompt tanpa arah) dan
				<span class="font-bold text-accent text-text-base">mature vibe coding</span> menggunakan Product
				Requirements Document (PRD), Design System yang jelas, dan kontrak AI terstruktur. VibeSec Lab
				adalah hasil dari eksekusi bertahap menggunakan Gemini CLI, SvelteKit, dan Tailwind v4.
			</p>
		</div>
	</MotionShell>
</div>
