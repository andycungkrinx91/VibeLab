<script lang="ts">
	import MotionShell from '$lib/components/MotionShell.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppTutorial from '$lib/components/AppTutorial.svelte';
	import { requestSecurityAI } from '$lib/utils/ai-client';

	let playlists = $state([
		{
			id: 1,
			title: 'Critical CVE-2024-XXXX Briefing',
			category: 'Vulnerability',
			duration: '02:45',
			transcript:
				'Pagi ini kita menghadapi kerentanan kritis CVE-2024-XXXX pada framework yang kita gunakan. Kerentanan ini memungkinkan eksekusi kode jarak jauh tanpa otentikasi. Semua server di zona DMZ harus segera dipatch. Workaround sementara adalah dengan menambahkan rule WAF untuk memblokir payload spesifik.'
		},
		{
			id: 2,
			title: 'Cloud Run Hardening Guide',
			category: 'Infrastructure',
			duration: '04:12',
			transcript:
				'Untuk meningkatkan keamanan layanan Cloud Run kita, pastikan untuk menonaktifkan akses publik jika tidak diperlukan, gunakan VPC Service Controls, dan pastikan service account yang digunakan hanya memiliki izin minimum yang dibutuhkan (principle of least privilege).'
		},
		{
			id: 3,
			title: 'Dependency Risk Update',
			category: 'AppSec',
			duration: '01:50',
			transcript:
				'Hasil scan terbaru menunjukkan ada beberapa dependensi dengan risiko tinggi di repositori utama kita. Kita perlu segera memperbarui package log4j dan menghapus library usang yang tidak lagi dikelola oleh komunitas.'
		},
		{
			id: 4,
			title: 'Secret Leak Prevention',
			category: 'DevSecOps',
			duration: '03:20',
			transcript:
				'Terdapat insiden kecil kemarin di mana API key tersimpan di dalam commit. Kita akan mengimplementasikan pre-commit hooks untuk mendeteksi secrets sebelum kode di-push ke repositori. Tolong semua engineer segera melakukan rotasi kunci yang terpengaruh.'
		}
	]);

	let activeIndex = $state(0);
	let activeBriefing = $derived(playlists[activeIndex]);

	let isPlaying = $state(false);
	let progress = $state(0);

	let aiSummary = $state<string | null>(null);
	let aiActionItems = $state<string[] | null>(null);
	let aiSlackUpdate = $state<string | null>(null);
	let isLoadingAI = $state(false);

	let progressInterval: any;

	function togglePlay() {
		isPlaying = !isPlaying;
		if (isPlaying) {
			progressInterval = setInterval(() => {
				if (progress < 100) {
					progress += 1;
				} else {
					isPlaying = false;
					clearInterval(progressInterval);
					progress = 0;
				}
			}, 300);
		} else {
			clearInterval(progressInterval);
		}
	}

	function selectBriefing(index: number) {
		activeIndex = index;
		isPlaying = false;
		progress = 0;
		clearInterval(progressInterval);
		aiSummary = null;
		aiActionItems = null;
		aiSlackUpdate = null;
	}

	async function analyzeBriefing() {
		isLoadingAI = true;
		aiSummary = null;
		aiActionItems = null;
		aiSlackUpdate = null;

		try {
			const [summaryData, actionData] = await Promise.all([
				requestSecurityAI({
					app: 'threat-briefing-player',
					action: 'summarize-threat-briefing',
					input: {
						title: activeBriefing.title,
						category: activeBriefing.category,
						transcript: activeBriefing.transcript,
						audience: 'Executive'
					}
				}),
				requestSecurityAI({
					app: 'threat-briefing-player',
					action: 'extract-briefing-actions',
					input: {
						title: activeBriefing.title,
						category: activeBriefing.category,
						transcript: activeBriefing.transcript,
						environmentContext: 'Production'
					}
				})
			]);

			aiSummary = summaryData.ok
				? ((summaryData.result.summary as string) || summaryData.summary)
				: summaryData.error || summaryData.summary;

			if (actionData.ok) {
				aiActionItems = Array.isArray(actionData.result.actionItems)
					? (actionData.result.actionItems as string[])
					: actionData.recommendations;
				aiSlackUpdate = (actionData.result.slackUpdate as string) || actionData.summary;
			} else {
				aiSlackUpdate = actionData.error || actionData.summary;
			}
		} catch {
			aiSummary = 'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.';
		} finally {
			isLoadingAI = false;
		}
	}
</script>

	<div class="mx-auto mt-8 flex h-full w-full max-w-6xl flex-col gap-6">
		<MotionShell delay={0}>
			<AppHeader appId="threat-briefing-player" />
		</MotionShell>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Left Col: Playlist & Player -->
		<MotionShell delay={100} class="flex flex-col gap-6 lg:col-span-1">
			<!-- Player Control -->
			<div class="flex flex-col gap-4 rounded-lg border border-border bg-bg-panel p-6 shadow-md">
				<div class="flex flex-col items-center gap-2 text-center">
					<div
						class="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-3xl"
					>
						🎙️
					</div>
					<h3 class="font-bold text-text-base">{activeBriefing.title}</h3>
					<span
						class="rounded bg-border px-2 py-0.5 text-[10px] font-bold text-text-muted uppercase"
						>{activeBriefing.category}</span
					>
				</div>

				<!-- Waveform Simulation -->
				<div class="my-2 flex h-12 items-end justify-center gap-1 opacity-70">
					{#each Array(20) as _, i}
						<div
							class="w-1.5 rounded-t bg-accent transition-all duration-100"
							style="height: {isPlaying ? Math.random() * 100 + '%' : '10%'}"
						></div>
					{/each}
				</div>

				<!-- Progress -->
				<div>
					<div class="h-1.5 w-full overflow-hidden rounded-full bg-bg-base">
						<div
							class="h-full bg-accent transition-all duration-300"
							style="width: {progress}%"
						></div>
					</div>
					<div class="mt-1 flex justify-between text-xs text-text-muted">
						<span>00:00</span>
						<span>{activeBriefing.duration}</span>
					</div>
				</div>

				<button
					onclick={togglePlay}
					class="flex w-full items-center justify-center gap-2 rounded bg-accent py-3 font-bold text-bg-base transition-colors hover:bg-accent/90"
				>
					{#if isPlaying}
						<span>⏸ Pause Briefing</span>
					{:else}
						<span>▶ Play Briefing</span>
					{/if}
				</button>
			</div>

			<!-- Playlist -->
			<div class="flex-1 rounded-lg border border-border bg-bg-panel p-4 shadow-md">
				<h3 class="mb-3 text-sm font-semibold tracking-wider text-text-base uppercase">Queue</h3>
				<div class="space-y-2">
					{#each playlists as item, index}
						<button
							onclick={() => selectBriefing(index)}
							class="flex w-full flex-col gap-1 rounded border p-3 text-left transition-colors {index ===
							activeIndex
								? 'border-accent bg-accent/10'
								: 'border-border/50 bg-bg-base hover:border-accent/50'}"
						>
							<div class="truncate text-sm font-semibold text-text-base">{item.title}</div>
							<div class="flex justify-between text-xs text-text-muted">
								<span>{item.category}</span>
								<span>{item.duration}</span>
							</div>
						</button>
					{/each}
				</div>
			</div>
		</MotionShell>

		<!-- Right Col: Transcript & AI -->
		<MotionShell delay={200} class="flex flex-col gap-6 lg:col-span-2">
			<!-- Transcript -->
			<div class="rounded-lg border border-border bg-bg-panel p-6 shadow-md">
				<div class="mb-4 flex items-center justify-between border-b border-border pb-2">
					<h3 class="font-semibold text-text-base">Live Transcript</h3>
					<button
						onclick={analyzeBriefing}
						disabled={isLoadingAI}
						class="rounded bg-accent/10 px-3 py-1 text-xs font-bold text-accent hover:bg-accent/20 disabled:opacity-50"
					>
						{isLoadingAI ? 'Menganalisa...' : 'AI Analyze'}
					</button>
				</div>
				<div
					class="rounded border border-border/50 bg-bg-base p-4 font-mono text-sm leading-relaxed text-text-muted"
				>
					{activeBriefing.transcript}
				</div>
			</div>

			<!-- AI Output -->
			<div class="flex flex-1 flex-col rounded-lg border border-border bg-bg-panel p-6 shadow-md">
				<h3
					class="mb-4 flex items-center gap-2 border-b border-border pb-2 font-semibold text-accent"
				>
					AI Intelligence Report
				</h3>

				<div class="flex-1 overflow-y-auto">
					{#if isLoadingAI}
						<div class="animate-pulse space-y-4">
							<div class="h-4 w-1/4 rounded bg-border/50"></div>
							<div class="h-4 w-full rounded bg-border/50"></div>
							<div class="h-4 w-5/6 rounded bg-border/50"></div>
							<div class="mt-4 h-10 w-full rounded bg-border/50"></div>
						</div>
					{:else if aiSummary || aiActionItems || aiSlackUpdate}
						<div class="space-y-6">
							{#if aiSummary}
								<div>
									<div class="mb-2 text-xs font-bold text-text-muted uppercase">
										Executive Summary
									</div>
									<p class="text-sm leading-relaxed text-text-base">{aiSummary}</p>
								</div>
							{/if}

							{#if aiActionItems && aiActionItems.length > 0}
								<div>
									<div class="mb-2 text-xs font-bold text-warning uppercase">Action Items</div>
									<ul class="space-y-2">
										{#each aiActionItems as action}
											<li class="flex items-start text-sm">
												<span class="mr-2 text-warning">■</span>
												<span class="text-text-base">{action}</span>
											</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if aiSlackUpdate}
								<div>
									<div class="mb-2 text-xs font-bold text-accent-secondary uppercase">
										Slack Update Draft
									</div>
									<div
										class="rounded border border-border/50 bg-bg-base p-3 font-mono text-sm whitespace-pre-line"
									>
										{aiSlackUpdate}
									</div>
								</div>
							{/if}
						</div>
					{:else}
						<div class="flex flex-col items-center py-12 text-center text-sm text-text-muted">
							<span class="mb-2 text-4xl opacity-50">🧠</span>
							Klik 'AI Analyze' untuk mengekstrak ringkasan dan langkah aksi dari briefing ini.
						</div>
					{/if}
				</div>
			</div>
		</MotionShell>
	</div>

	<AppTutorial
		purpose="Memutar briefing threat intelligence simulasi untuk awareness dan response planning."
		howToUse="Pilih briefing, tekan play/pause, lalu baca transcript di panel kanan."
		aiAction="Klik AI Analyze untuk mendapatkan ringkasan briefing dan action items."
		output="Ringkasan eksekutif, key takeaways, action items, dan draft update singkat."
		securityNote="Briefing membantu awareness dan response planning tanpa memberikan instruksi ofensif."
	/>
</div>
