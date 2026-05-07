<script lang="ts">
	import { themeState, themes } from '$lib/theme.svelte';

	let isOpen = $state(false);
	const menuId = 'theme-switcher-menu';

	function toggle() {
		isOpen = !isOpen;
	}

	function selectTheme(id: (typeof themes)[number]['id']) {
		themeState.set(id);
		isOpen = false;
	}
</script>

<div class="relative inline-block text-left">
	<button
		type="button"
		class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-bg-panel px-4 py-2 text-sm font-medium text-text-base shadow-sm transition-all duration-200 hover:bg-accent hover:text-bg-base hover:shadow-accent-glow focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-base focus:outline-none"
		onclick={toggle}
		aria-expanded={isOpen}
		aria-haspopup="true"
		aria-controls={menuId}
	>
		<span>Tema Visual</span>
		<div
			class="flex h-4 w-4 items-center justify-center rounded-full"
			style="background-color: {themes.find((t) => t.id === themeState.current)?.color ||
				'#00ff00'}"
		></div>
		<svg
			class="-mr-1 ml-2 h-4 w-4"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			aria-hidden="true"
		>
			<path
				fill-rule="evenodd"
				d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
				clip-rule="evenodd"
			/>
		</svg>
	</button>

	{#if isOpen}
		<div
			id={menuId}
			class="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md border border-border bg-bg-panel shadow-lg shadow-accent-glow transition-all duration-200 focus:outline-none"
		>
			<div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby={menuId}>
				{#each themes as theme}
					<button
						type="button"
						class="flex w-full items-center px-4 py-2 text-left text-sm transition-colors duration-150 hover:bg-bg-base hover:text-accent"
						role="menuitem"
						onclick={() => selectTheme(theme.id)}
					>
						<span
							class="mr-3 flex h-3 w-3 shrink-0 rounded-full"
							style="background-color: {theme.color}; box-shadow: 0 0 5px {theme.color};"
						></span>
						<span
							class="flex-1 {themeState.current === theme.id
								? 'font-bold text-accent'
								: 'text-text-base'}"
						>
							{theme.name}
						</span>
						{#if themeState.current === theme.id}
							<svg
								class="h-4 w-4 text-accent"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
