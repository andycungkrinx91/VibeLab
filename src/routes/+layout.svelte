<script lang="ts">
	import './layout.css';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import PageBoot from '$lib/components/PageBoot.svelte';
	import RouteTransition from '$lib/components/RouteTransition.svelte';
	let { children } = $props();
</script>

<svelte:head>
	<title>VibeSec Lab</title>
</svelte:head>

<PageBoot />
<RouteTransition />

<!-- Global Background Effects -->
<div class="bg-scanlines pointer-events-none fixed inset-0 z-[-1] opacity-40"></div>
<div class="pointer-events-none fixed inset-0 z-[-1] bg-grid opacity-20"></div>
<!-- Radial vignette for cinematic depth -->
<div
	class="pointer-events-none fixed inset-0 z-[-1]"
	style="background: radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--accent) 5%, transparent), transparent 70%);"
></div>

<div class="relative z-0 flex min-h-dvh flex-col overflow-x-hidden text-text-base">
	<header
		class="sticky top-0 z-50 border-b border-border/40 bg-bg-panel/85 shadow-[0_1px_24px_-4px_var(--color-accent-glow)] backdrop-blur-md"
	>
		<!-- Top accent bar -->
		<div class="h-[2px] w-full bg-gradient-to-r from-transparent via-accent to-transparent opacity-60"></div>

		<div class="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16 sm:px-6">
			<!-- Brand -->
			<a
				href="/"
				class="btn-shimmer group inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-3 py-1.5 font-bold tracking-wider text-accent transition-all duration-200 hover:border-accent hover:bg-accent/15 hover:shadow-[0_0_18px_var(--color-accent-glow)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base focus-visible:outline-none"
			>
				<span class="text-base sm:text-xl">VibeSec Lab</span>
				<span class="animate-pulse font-mono font-normal opacity-70">_</span>
			</a>

			<!-- Desktop Nav -->
			<nav class="ml-8 hidden flex-1 items-center gap-6 md:flex">
				<a
					href="/apps"
					class="nav-link inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-bg-base/60 px-3 py-1.5 text-sm font-semibold text-text-muted hover:border-accent/40 hover:bg-accent/10 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base focus-visible:outline-none"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-accent opacity-60"></span>
					Command Center Apps
				</a>
			</nav>

			<div class="flex items-center gap-3">
				<!-- Mobile Nav link -->
				<a
					href="/apps"
					class="nav-link mr-1 inline-flex items-center rounded-full border border-border/50 bg-bg-base/60 px-3 py-1.5 text-xs font-semibold text-text-muted hover:border-accent/40 hover:bg-accent/10 hover:text-accent md:hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base focus-visible:outline-none"
				>
					Apps
				</a>
				<ThemeSwitcher />
			</div>
		</div>
	</header>

<main class="container mx-auto flex min-h-0 flex-1 flex-col overflow-x-hidden p-4 sm:p-6 lg:p-8">
	{@render children()}
</main>
</div>
