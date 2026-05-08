<script lang="ts">
	import MotionShell from '$lib/components/MotionShell.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppTutorial from '$lib/components/AppTutorial.svelte';
	import { requestSecurityAI } from '$lib/utils/ai-client';

	interface Deadline {
		id: string;
		title: string;
		asset: string;
		cveId: string;
		severity: string;
		owner: string;
		dueDate: string;
	}

	let deadlines = $state<Deadline[]>([
		{
			id: '1',
			title: 'Update OpenSSL',
			asset: 'Payment Gateway',
			cveId: 'CVE-2022-3602',
			severity: 'High',
			owner: 'Backend Team',
			dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
		}
	]);

	let newTitle = $state('');
	let newAsset = $state('');
	let newCveId = $state('');
	let newSeverity = $state('High');
	let newOwner = $state('');
	let newDueDate = $state('');

	let aiChecklist = $state<string[] | null>(null);
	let aiMessage = $state<string | null>(null);
	let isLoadingAI = $state(false);
	let copyStatus = $state('');

	$effect(() => {
		if (typeof window === 'undefined') return;
		const stored = localStorage.getItem('patch-deadlines');
		if (!stored) return;
		try {
			deadlines = JSON.parse(stored);
		} catch {
			// Ignore malformed local state and keep the app usable.
		}
	});

	function saveDeadlines() {
		if (typeof window === 'undefined') return;
		localStorage.setItem('patch-deadlines', JSON.stringify(deadlines));
	}

	function addDeadline() {
		if (!newTitle || !newAsset || !newCveId || !newDueDate) return;
		deadlines = [
			...deadlines,
			{
				id: Date.now().toString(),
				title: newTitle,
				asset: newAsset,
				cveId: newCveId,
				severity: newSeverity,
				owner: newOwner,
				dueDate: newDueDate
			}
		];
		saveDeadlines();

		newTitle = '';
		newAsset = '';
		newCveId = '';
		newOwner = '';
		newDueDate = '';
	}

	function removeDeadline(id: string) {
		deadlines = deadlines.filter((d) => d.id !== id);
		saveDeadlines();
	}

	function getUrgency(dueDate: string) {
		const daysLeft = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 3600 * 24));
		if (daysLeft < 0) return { state: 'Overdue', color: 'text-critical', days: daysLeft };
		if (daysLeft <= 3) return { state: 'Critical', color: 'text-critical', days: daysLeft };
		if (daysLeft <= 7) return { state: 'Warning', color: 'text-warning', days: daysLeft };
		return { state: 'Normal', color: 'text-accent', days: daysLeft };
	}

	async function getAiAdvice(deadline: Deadline) {
		if (isLoadingAI) return;
		isLoadingAI = true;
		aiChecklist = null;
		aiMessage = null;
		copyStatus = '';
		const urgency = getUrgency(deadline.dueDate);

		try {
			const [checklistData, messageData] = await Promise.all([
				requestSecurityAI({
					app: 'patch-deadline-countdown',
					action: 'generate-deadline-checklist',
					input: { ...deadline, urgencyState: urgency.state }
				}),
				requestSecurityAI({
					app: 'patch-deadline-countdown',
					action: 'generate-stakeholder-message',
					input: {
						deadlines: [deadline],
						audience: 'Technical Management',
						urgencyState: urgency.state,
						blockedItems: []
					}
				})
			]);

			if (checklistData.ok) {
				aiChecklist = Array.isArray(checklistData.result.checklist)
					? (checklistData.result.checklist as string[])
					: checklistData.recommendations;
			} else {
				aiChecklist = [checklistData.error || checklistData.summary];
			}
			if (messageData.ok) {
				aiMessage = (messageData.result.message as string) || messageData.summary;
			} else {
				aiMessage = messageData.error || messageData.summary;
			}
		} catch {
			aiMessage = 'Terjadi kesalahan sistem.';
		} finally {
			isLoadingAI = false;
		}
	}

	async function copyAiMessage() {
		if (typeof window === 'undefined' || !aiMessage) return;

		try {
			await navigator.clipboard.writeText(aiMessage);
			copyStatus = 'Pesan disalin.';
		} catch {
			copyStatus = 'Gagal menyalin pesan.';
		}
	}
</script>

	<div class="mx-auto mt-8 flex min-h-0 w-full max-w-6xl flex-col gap-6">
		<MotionShell delay={0}>
			<AppHeader appId="patch-deadline-countdown" />
		</MotionShell>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Main Content -->
		<MotionShell delay={100} class="flex flex-col gap-6 lg:col-span-2">
			<!-- Add Form -->
			<div class="rounded-lg border border-border bg-bg-panel p-6 shadow-md">
				<h3 class="mb-4 border-b border-border pb-2 font-semibold text-text-base">
					Add New Deadline
				</h3>
				<div class="mb-4 grid grid-cols-2 gap-4">
					<input
						bind:value={newTitle}
						placeholder="Judul Patch (e.g. Update Nginx)"
						class="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
					/>
					<input
						bind:value={newAsset}
						placeholder="Aset (e.g. Frontend Server)"
						class="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
					/>
					<input
						bind:value={newCveId}
						placeholder="CVE ID (e.g. CVE-2024-1234)"
						class="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
					/>
					<select
						bind:value={newSeverity}
						class="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
					>
						<option value="Low">Low</option>
						<option value="Medium">Medium</option>
						<option value="High">High</option>
						<option value="Critical">Critical</option>
					</select>
					<input
						bind:value={newOwner}
						placeholder="Owner (e.g. Tim DevOps)"
						class="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
					/>
					<input
						type="date"
						bind:value={newDueDate}
						class="rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
					/>
				</div>
				<button
					onclick={addDeadline}
					class="w-full rounded bg-accent/20 py-2 font-bold text-accent transition-colors hover:bg-accent/30"
				>
					+ Tambah Deadline
				</button>
			</div>

			<!-- Deadlines List -->
			<div class="flex flex-col gap-4">
				{#if deadlines.length === 0}
					<div
						class="rounded-lg border border-dashed border-border/50 p-8 text-center text-text-muted"
					>
						Belum ada deadline patch. Semuanya aman! 🎉
					</div>
				{/if}
				{#each deadlines as d}
					{@const urgency = getUrgency(d.dueDate)}
					<div
						class="rounded-lg border {urgency.state === 'Overdue' || urgency.state === 'Critical'
							? 'border-critical/50'
							: 'border-border'} flex items-center justify-between bg-bg-panel p-4 shadow-md"
					>
						<div>
							<div class="mb-1 flex items-center gap-2">
								<h4 class="text-lg font-bold text-text-base">{d.title}</h4>
								<span class="rounded border border-border/50 bg-bg-base px-2 py-0.5 text-xs"
									>{d.cveId}</span
								>
								<span
									class="rounded border border-border/50 bg-bg-base px-2 py-0.5 text-xs font-bold text-accent-secondary"
									>{d.severity}</span
								>
							</div>
							<div class="flex items-center gap-3 text-sm text-text-muted">
								<span>🏢 {d.asset}</span>
								<span>👤 {d.owner}</span>
							</div>
						</div>

						<div class="flex items-center gap-4">
							<div class="text-right">
								<div class="text-3xl font-bold {urgency.color} tabular-nums">
									{Math.abs(urgency.days)}
								</div>
								<div class="text-xs font-bold text-text-muted uppercase">
									{urgency.days < 0 ? 'Hari Terlambat' : 'Hari Lagi'}
								</div>
							</div>

							<div class="flex flex-col gap-2">
				<button
					onclick={() => getAiAdvice(d)}
					disabled={isLoadingAI}
					class="rounded bg-accent/10 px-3 py-1 text-xs text-accent transition-colors hover:bg-accent/20"
				>
					AI Assist
								</button>
								<button
									onclick={() => removeDeadline(d.id)}
									class="rounded bg-critical/10 px-3 py-1 text-xs text-critical transition-colors hover:bg-critical/20"
								>
									Selesai
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</MotionShell>

		<!-- Right Col: AI Assistant -->
		<MotionShell delay={200} class="flex flex-col lg:col-span-1">
			<div
				class="sticky top-24 flex max-h-[calc(100dvh-6rem)] min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-bg-panel p-6 shadow-md"
			>
				<h3 class="mb-4 border-b border-border pb-2 font-semibold text-accent">AI Patch Advisor</h3>

				<div class="flex-1 overflow-y-auto min-h-0">
					{#if isLoadingAI}
						<div class="animate-pulse space-y-4">
							<div class="h-4 w-1/4 rounded bg-border/50"></div>
							<div class="h-4 w-full rounded bg-border/50"></div>
							<div class="h-4 w-5/6 rounded bg-border/50"></div>
							<div class="mt-4 h-10 w-full rounded bg-border/50"></div>
						</div>
					{:else if aiChecklist || aiMessage}
						<div class="space-y-6">
							{#if aiChecklist && aiChecklist.length > 0}
								<div>
									<div class="mb-2 text-xs font-bold text-text-muted uppercase">
										Remediation Checklist
									</div>
									<ul class="space-y-2">
										{#each aiChecklist as item}
											<li class="flex items-start text-sm">
												<input type="checkbox" class="mt-1 mr-2 accent-accent" />
												<span class="leading-tight text-text-base">{item}</span>
											</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if aiMessage}
								<div>
									<div class="mb-2 text-xs font-bold text-warning uppercase">
										Stakeholder Update / Slack Draft
									</div>
						<div
							class="rounded border border-border/50 bg-bg-base p-3 font-mono text-sm whitespace-pre-line text-text-muted"
						>
							{aiMessage}
						</div>
						<button
							type="button"
							onclick={copyAiMessage}
							disabled={!aiMessage}
							class="mt-2 w-full rounded border border-border py-1 text-center text-xs text-text-muted hover:border-accent hover:text-accent"
						>
							Copy Message
						</button>
						{#if copyStatus}
							<div class="mt-2 text-xs text-text-muted">{copyStatus}</div>
						{/if}
					</div>
							{/if}
						</div>
					{:else}
						<div class="flex flex-col items-center py-12 text-center text-sm text-text-muted">
							<span class="mb-2 text-4xl opacity-50">🤖</span>
							Pilih 'AI Assist' pada salah satu deadline untuk mendapatkan checklist remediasi dan draft
							laporan ke stakeholder.
						</div>
					{/if}
				</div>
			</div>
		</MotionShell>
	</div>

	<AppTutorial
		purpose="Memantau deadline SLA patch dan urgensi remediasi vulnerability."
		howToUse="Buat deadline, isi aset/CVE/severity/owner, lalu lihat countdown dan gunakan AI Assist untuk tiap item."
		aiAction="Generate Deadline Checklist dan Generate Stakeholder Message."
		output="Countdown, urgency state, checklist remediasi, dan pesan eskalasi."
		securityNote="Deadline tracking membantu governance patch dan mengurangi window of exposure."
	/>
</div>
