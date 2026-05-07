<script lang="ts">
	import { onMount } from 'svelte';
	import MotionShell from '$lib/components/MotionShell.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppTutorial from '$lib/components/AppTutorial.svelte';

	type PatchStatus = 'detected' | 'triaged' | 'scheduled' | 'patched' | 'verified';

	interface PatchItem {
		id: string;
		asset: string;
		cve: string;
		severity: string;
		owner: string;
		dueDate: string;
		status: PatchStatus;
	}

	let patchItems = $state<PatchItem[]>([]);
	let isAdding = $state(false);
	let newItem = $state<Partial<PatchItem>>({ status: 'detected', severity: 'Medium' });

	let aiPlan = $state<any>(null);
	let isLoadingAI = $state(false);

	onMount(() => {
		const stored = localStorage.getItem('vibelab-patch-monitor');
		if (stored) {
			try {
				patchItems = JSON.parse(stored);
			} catch {
				patchItems = [];
			}
		} else {
			patchItems = [
				{
					id: '1',
					asset: 'web-srv-01',
					cve: 'CVE-2024-1234',
					severity: 'High',
					owner: 'DevOps',
					dueDate: '2024-05-01',
					status: 'detected'
				},
				{
					id: '2',
					asset: 'db-main',
					cve: 'CVE-2023-9876',
					severity: 'Critical',
					owner: 'DBA',
					dueDate: '2024-04-20',
					status: 'scheduled'
				}
			];
			saveData();
		}
	});

	function saveData() {
		localStorage.setItem('vibelab-patch-monitor', JSON.stringify(patchItems));
	}

	function addItem(e: SubmitEvent) {
		e.preventDefault();
		if (!newItem.asset || !newItem.cve) return;
		patchItems = [...patchItems, { ...newItem, id: Date.now().toString() } as PatchItem];
		isAdding = false;
		newItem = { status: 'detected', severity: 'Medium' };
		saveData();
	}

	function removeItem(id: string) {
		patchItems = patchItems.filter((p) => p.id !== id);
		saveData();
	}

	function updateStatus(id: string, status: PatchStatus) {
		const item = patchItems.find((p) => p.id === id);
		if (item) {
			item.status = status;
			patchItems = [...patchItems]; // trigger reactivity
			saveData();
		}
	}

	async function generatePlan() {
		isLoadingAI = true;
		aiPlan = null;
		try {
			const res = await fetch('/api/ai/security', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					app: 'patch-monitor',
					action: 'generate-patch-plan',
					input: { patchItems, currentDate: new Date().toISOString() }
				})
			});
			const data = await res.json();
			if (data.ok) {
				aiPlan = data;
			} else {
				aiPlan = data;
			}
		} catch (e) {
			aiPlan = {
				ok: false,
				error: 'Fitur AI gagal sementara, tetapi aplikasi tetap bisa digunakan dengan data lokal.',
				summary: 'Fitur AI gagal sementara, tetapi aplikasi tetap bisa digunakan dengan data lokal.'
			};
		} finally {
			isLoadingAI = false;
		}
	}

	const statuses: { value: PatchStatus; label: string; color: string }[] = [
		{ value: 'detected', label: 'Detected', color: 'text-critical border-critical' },
		{ value: 'triaged', label: 'Triaged', color: 'text-warning border-warning' },
		{
			value: 'scheduled',
			label: 'Scheduled',
			color: 'text-accent-secondary border-accent-secondary'
		},
		{ value: 'patched', label: 'Patched', color: 'text-accent border-accent' },
		{ value: 'verified', label: 'Verified', color: 'text-text-muted border-border' }
	];
</script>

	<div class="mx-auto mt-8 flex h-full w-full max-w-5xl flex-col gap-6">
		<MotionShell delay={0}>
			<AppHeader appId="patch-monitor" />
		</MotionShell>

		<div class="flex flex-wrap justify-end gap-2">
			<button
				onclick={generatePlan}
				class="btn-shimmer rounded border border-border bg-bg-base px-4 py-2 font-bold text-text-base transition-colors hover:text-accent"
			>
				AI Plan
			</button>
			<button
				onclick={() => (isAdding = !isAdding)}
				class="btn-shimmer rounded bg-accent px-4 py-2 font-bold text-bg-base transition-colors hover:bg-accent-secondary"
			>
				+ Tambah
			</button>
		</div>

	{#if aiPlan?.ok && !isLoadingAI}
		<MotionShell
			delay={50}
			class="electric-border electric-border-active rounded-lg border border-accent bg-bg-panel p-4 shadow-[0_0_15px_var(--color-accent-glow)]"
		>
			<div class="mb-2 flex items-center justify-between">
				<h3 class="font-bold text-accent">AI Daily Patch Plan</h3>
				<button onclick={() => (aiPlan = null)} class="text-xs text-text-muted hover:text-text-base"
					>Tutup</button
				>
			</div>
			<p class="mb-3 text-sm text-text-base">{aiPlan.summary}</p>
			<ul class="grid grid-cols-1 gap-2 md:grid-cols-2">
				{#each aiPlan.result.dailyPlan || aiPlan.recommendations as plan}
					<li class="flex items-start rounded border border-border/50 bg-bg-base p-2 text-sm">
						<span class="mr-2 text-accent">✓</span>
						{plan}
					</li>
				{/each}
			</ul>
		</MotionShell>
	{:else if aiPlan?.error}
		<div class="rounded-lg border border-critical/20 bg-critical/10 p-4 text-sm text-critical">
			{aiPlan.error}
		</div>
	{/if}

	{#if isLoadingAI}
		<div class="animate-pulse rounded-lg border border-border p-4 text-center text-text-muted">
			Menyusun rencana patch cerdas...
		</div>
	{/if}

	{#if isAdding}
		<MotionShell delay={50} class="electric-border rounded-lg border border-border bg-bg-panel p-4 shadow-md">
			<form onsubmit={addItem} class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
				<input
					placeholder="Asset"
					bind:value={newItem.asset}
					required
					class="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base"
				/>
				<input
					placeholder="CVE-XXXX-XXXX"
					bind:value={newItem.cve}
					required
					class="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base"
				/>
				<select
					bind:value={newItem.severity}
					class="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base"
				>
					<option value="Low">Low</option>
					<option value="Medium">Medium</option>
					<option value="High">High</option>
					<option value="Critical">Critical</option>
				</select>
				<input
					placeholder="Owner"
					bind:value={newItem.owner}
					required
					class="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base"
				/>
				<input
					type="date"
					bind:value={newItem.dueDate}
					required
					class="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base"
				/>
				<button type="submit" class="btn-shimmer rounded bg-accent px-4 py-2 font-bold text-bg-base"
					>Simpan</button
				>
			</form>
		</MotionShell>
	{/if}

	<!-- Kanban Board -->
	<div class="grid min-h-[500px] flex-1 grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
		{#each statuses as col}
			<MotionShell delay={100} class="electric-border-static flex flex-col rounded border border-border bg-bg-panel p-3">
				<div class="mb-3 flex items-center justify-between border-b border-border pb-2">
					<div class="text-xs font-bold tracking-wider uppercase {col.color.split(' ')[0]}">
						{col.label}
					</div>
					<div class="rounded-full bg-bg-base px-2 py-0.5 text-xs text-text-muted">
						{patchItems.filter((p) => p.status === col.value).length}
					</div>
				</div>

				<div class="flex flex-1 flex-col gap-3 overflow-y-auto">
					{#each patchItems.filter((p) => p.status === col.value) as item (item.id)}
						<div
							class="electric-border group relative flex flex-col rounded border border-border bg-bg-base p-3 shadow-sm transition-colors hover:border-accent/50"
						>
							<div class="mb-1 flex items-center justify-between">
								<span class="font-mono text-xs font-bold text-text-base">{item.cve}</span>
								<span
									class="rounded px-1 text-[10px] font-bold uppercase {item.severity === 'Critical'
										? 'bg-critical/20 text-critical'
										: item.severity === 'High'
											? 'bg-warning/20 text-warning'
											: 'bg-border text-text-muted'}">{item.severity}</span
								>
							</div>
							<div class="mb-2 text-xs text-text-muted">{item.asset}</div>
							<div class="flex items-center justify-between text-[10px] text-text-muted">
								<span>{item.owner}</span>
								<span>{item.dueDate}</span>
							</div>

							<!-- Action Overlay -->
							<div
								class="absolute inset-0 hidden flex-col items-center justify-center rounded bg-bg-panel/90 p-2 backdrop-blur-sm group-hover:flex"
							>
								<div class="mb-2 text-[10px] text-text-base">Pindah ke:</div>
								<select
									class="mb-2 w-full rounded border border-border bg-bg-base text-xs"
									onchange={(e) =>
										updateStatus(item.id, (e.target as HTMLSelectElement).value as PatchStatus)}
								>
									{#each statuses as s}
										<option value={s.value} selected={s.value === item.status}>{s.label}</option>
									{/each}
								</select>
								<button
									onclick={() => removeItem(item.id)}
									class="text-xs text-critical hover:underline">Hapus</button
								>
							</div>
						</div>
					{/each}
					{#if patchItems.filter((p) => p.status === col.value).length === 0}
						<div
							class="flex flex-1 items-center justify-center rounded border border-dashed border-border/50 p-4 text-center text-xs text-text-muted"
						>
							Kosong
						</div>
					{/if}
				</div>
			</MotionShell>
		{/each}
	</div>

	<AppTutorial
		purpose="Memantau lifecycle patch dari deteksi sampai verifikasi secara visual."
		howToUse="Tambahkan item patch, pindahkan status di board, lalu hapus saat selesai."
		aiAction="Klik AI Plan untuk menghasilkan patch plan harian atau stakeholder update."
		output="Status patch, board progress, dan ringkasan prioritas remediasi."
		securityNote="Patch lifecycle membantu mengurangi window of exposure tanpa teknik ofensif."
	/>
</div>
