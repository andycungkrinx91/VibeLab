<script lang="ts">
  let {
    title,
    category,
    familiarCategory,
    familiarCategorySubtitle,
    securityIdentity,
    description,
    badge,
    aiAction,
    priority,
    workflow,
    icon,
    href
  } = $props<{
    title: string;
    category: string;
    familiarCategory: string;
    familiarCategorySubtitle: string;
    securityIdentity: string;
    description: string;
    badge: string;
    aiAction: string;
    priority: string;
    workflow?: string;
    icon?: string;
    href: string;
  }>();

  function getPriorityClass(p: string) {
    if (p === 'High')   return 'text-critical border-critical/40 bg-critical/10';
    if (p === 'Medium') return 'text-warning border-warning/40 bg-warning/10';
    return 'text-accent border-accent/40 bg-accent/10';
  }
</script>

<a
  {href}
  class="electric-border group relative flex h-full flex-col justify-between rounded-2xl border border-border/60 bg-bg-panel p-5 shadow-md transition-[transform,box-shadow,border-color] duration-300 hover:border-border-highlight hover:shadow-[0_8px_32px_-4px_var(--color-accent-glow)] hover:-translate-y-[4px] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base focus-visible:outline-none sm:p-6"
>
  <!-- Ambient gradient overlay on hover — contained within the rounded card -->
  <div
    class="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/0 via-accent/4 to-accent-secondary/3 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
  ></div>

  <div class="relative z-10">
    <!-- Header row: icon + category tags + priority badge -->
    <div class="mb-4 flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-wrap items-start gap-2">
        {#if icon}
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-bg-base/80 text-lg shadow-[0_0_14px_var(--color-accent-glow)] transition-shadow duration-300 group-hover:shadow-[0_0_22px_var(--color-accent-glow)]"
          >
            {icon}
          </div>
        {/if}

        <!-- App type tag -->
        <div
          class="inline-flex flex-col gap-0.5 rounded-lg border border-border/50 bg-bg-base/70 px-2.5 py-1.5 shadow-sm"
        >
          <span class="text-[9px] font-semibold uppercase tracking-[0.22em] text-text-muted"
            >Jenis App</span
          >
          <span class="text-xs font-semibold text-text-base">{familiarCategory}</span>
          <span class="text-[10px] leading-tight text-text-muted">{familiarCategorySubtitle}</span>
        </div>

        <!-- Security identity tag -->
        <div
          class="inline-flex flex-col justify-center gap-0.5 rounded-lg border border-accent-secondary/25 bg-accent-secondary/8 px-2.5 py-1.5"
        >
          <span
            class="text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-secondary/70"
            >Identity</span
          >
          <span class="text-xs font-medium text-accent-secondary">{securityIdentity}</span>
        </div>

        <!-- Category monospace tag -->
        <span
          class="rounded border border-border/40 bg-bg-base px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-text-muted"
        >
          {category}
        </span>

        {#if workflow}
          <span
            class="rounded-full border border-accent-secondary/30 bg-accent-secondary/10 px-2 py-0.5 text-[10px] font-medium text-accent-secondary"
          >
            {workflow}
          </span>
        {/if}
      </div>

      <!-- Priority badge -->
      <span
        class="shrink-0 rounded border px-2 py-0.5 text-xs {getPriorityClass(priority)}"
      >
        {badge}
      </span>
    </div>

    <!-- Title -->
    <h3
      class="mb-2 text-xl font-bold text-text-base transition-colors duration-200 group-hover:text-accent"
    >
      {title}
    </h3>

    <!-- Description -->
    <p class="mb-5 line-clamp-2 text-sm leading-relaxed text-text-muted">
      {description}
    </p>
  </div>

  <!-- Footer row -->
  <div class="relative z-10 flex items-center justify-between border-t border-border/40 pt-4">
    <div class="flex items-center gap-1.5 text-xs text-text-muted">
      <div class="h-1.5 w-1.5 rounded-full bg-accent opacity-80 animate-pulse"></div>
      <span class="opacity-75">AI: {aiAction}</span>
    </div>

    <span
      class="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent transition-all duration-200 group-hover:bg-accent group-hover:text-bg-base group-hover:shadow-[0_0_12px_var(--color-accent-glow)]"
    >
      Buka App
    </span>
  </div>
</a>
