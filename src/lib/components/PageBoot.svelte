<script lang="ts">
	import { onMount } from 'svelte';

	let show = $state(true);
	let stage = $state(0); // 0: booting lines, 1: scanning, 2: bursting, 3: done
	let lines = $state<string[]>([]);

	const bootSequence = [
		'[sys] Initializing VibeSec Core...',
		'[sys] Loading kernel modules...',
		'[sys] Mounting secure filesystem... OK',
		'[net] Establishing encrypted tunnel...',
		'[sys] Bypassing mainframe firewall...',
		'[ui] Injecting CSS theme variables...',
		'[auth] Anonymous session established.'
	];

	onMount(() => {
		// Only run boot once per session
		if (sessionStorage.getItem('vibelab-booted')) {
			show = false;
			return;
		}

		// Simulate terminal boot
		let delay = 0;
		bootSequence.forEach((line, index) => {
			setTimeout(() => {
				lines = [...lines, line];
				if (index === bootSequence.length - 1) {
					setTimeout(() => {
						stage = 1;
					}, 500); // Move to scanner
				}
			}, delay);
			delay += Math.random() * 200 + 100;
		});

		// Scanner to burst
		setTimeout(() => {
			if (stage === 1) {
				stage = 2; // Burst
				setTimeout(() => {
					show = false;
					sessionStorage.setItem('vibelab-booted', 'true');
				}, 600); // Wait for burst animation
			}
		}, delay + 1500);
	});
</script>

{#if show}
	<div
		class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-base font-mono text-accent transition-opacity duration-500 {stage ===
		2
			? 'opacity-0'
			: 'opacity-100'}"
	>
		{#if stage === 0 || stage === 1}
			<div class="bg-scanlines pointer-events-none absolute inset-0 opacity-30"></div>
			<div class="pointer-events-none absolute inset-0 bg-grid opacity-20"></div>

			<div class="mb-12 w-full max-w-2xl px-6">
				{#each lines as line}
					<div
						class="animate-fade-in-up mb-1 text-sm md:text-base"
						style="opacity: 0; animation-duration: 0.2s;"
					>
						{line}
					</div>
				{/each}
				{#if stage === 0}
					<div class="mt-2 h-5 w-3 animate-pulse bg-accent"></div>
				{/if}
			</div>
		{/if}

		{#if stage === 1 || stage === 2}
			<div class="relative flex items-center justify-center {stage === 2 ? 'animate-burst' : ''}">
				<!-- Inner pulse -->
				<div class="animate-pulse-ring absolute h-16 w-16 rounded-full bg-accent-glow"></div>
				<!-- Rotating ring -->
				<svg class="animate-spin-slow h-32 w-32 text-accent" viewBox="0 0 100 100" fill="none">
					<circle
						cx="50"
						cy="50"
						r="45"
						stroke="currentColor"
						stroke-width="2"
						stroke-dasharray="60 40 20 40"
						stroke-linecap="round"
					/>
					<circle
						cx="50"
						cy="50"
						r="35"
						stroke="var(--color-accent-secondary)"
						stroke-width="1"
						stroke-dasharray="10 20"
						opacity="0.7"
					/>
				</svg>
				<!-- Center core -->
				<div
					class="absolute flex h-8 w-8 items-center justify-center rounded-full bg-accent shadow-[0_0_20px_var(--color-accent-glow)]"
				>
					<div class="h-4 w-4 rounded-full bg-bg-base"></div>
				</div>
			</div>

			<div
				class="mt-8 text-sm font-bold tracking-[0.3em] text-accent {stage === 2
					? 'opacity-0'
					: 'animate-pulse'}"
			>
				SYSTEM ONLINE
			</div>
		{/if}
	</div>
{/if}
