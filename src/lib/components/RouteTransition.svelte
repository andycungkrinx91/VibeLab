<script lang="ts">
	import { beforeNavigate, afterNavigate } from '$app/navigation';

	let navigating = $state(false);
	let showOverlay = $state(false);

	beforeNavigate((navigation) => {
		if (navigation.to?.url.pathname !== navigation.from?.url.pathname) {
			navigating = true;
			showOverlay = true;
		}
	});
	afterNavigate(() => {
		navigating = false;
		setTimeout(() => {
			showOverlay = false;
		}, 400); // Wait for fade out
	});
</script>

{#if showOverlay}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm transition-opacity duration-300"
		class:opacity-100={navigating}
		class:opacity-0={!navigating}
	>
		<div class="relative flex flex-col items-center justify-center">
			<!-- Circular Scanner -->
			<svg class="animate-spin-slow h-16 w-16 text-accent" viewBox="0 0 100 100" fill="none">
				<circle
					cx="50"
					cy="50"
					r="45"
					stroke="var(--color-border-highlight)"
					stroke-width="2"
					stroke-dasharray="10 20"
					opacity="0.3"
				/>
				<path
					d="M 50 5 A 45 45 0 0 1 95 50"
					stroke="currentColor"
					stroke-width="4"
					stroke-linecap="round"
				/>
			</svg>

			<div class="mt-4 animate-pulse font-mono text-xs tracking-widest text-accent uppercase">
				Relocating...
			</div>
		</div>
	</div>
{/if}
