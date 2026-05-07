<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		delay = 0,
		class: className = ''
	}: { children: Snippet; delay?: number; class?: string } = $props();
</script>

<!--
  MotionShell: wraps content in a fade-in-up entrance animation.
  Starts at opacity-0 so the animation fills in naturally.
  prefers-reduced-motion is handled in layout.css.
-->
<div
	class="animate-fade-in-up opacity-0 {className}"
	style="animation-delay: {delay}ms; animation-fill-mode: both;"
>
	{@render children()}
</div>
