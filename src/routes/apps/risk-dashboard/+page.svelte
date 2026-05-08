<script lang="ts">
	import MotionShell from '$lib/components/MotionShell.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppTutorial from '$lib/components/AppTutorial.svelte';
	import { requestSecurityAI } from '$lib/utils/ai-client';

	type ScanHeader = {
		name: string;
		present: boolean;
		value: string | null;
		weight: number;
	};

	type ScanResult = {
		ok: boolean;
		url: string;
		grade: 'A' | 'B' | 'C' | 'D';
		score: number;
		presentHeaders: string[];
		missingHeaders: string[];
		checkedHeaders: ScanHeader[];
		summary: string;
		error?: string;
	};

	let targetUrl = $state('');
	let isScanning = $state(false);
	let scanResult = $state<ScanResult | null>(null);
	let scanError = $state('');
	let isLoadingAI = $state(false);
	let aiAnalysis = $state<any>(null);
	let aiError = $state('');

	const sampleTargets = ['https://example.com', 'https://developer.mozilla.org'];

	function normalizeTarget(value: string) {
		const trimmed = value.trim();
		if (!trimmed) return '';
		return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
	}

	function canScan(value: string) {
		const trimmed = value.trim();
		if (!trimmed) return false;
		return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(trimmed);
	}

	async function scanHeaders() {
		const normalized = normalizeTarget(targetUrl);
		if (!normalized) {
			scanError = 'Masukkan domain atau URL yang valid.';
			scanResult = null;
			return;
		}

		isScanning = true;
		scanError = '';
		aiAnalysis = null;
		aiError = '';

		try {
			const res = await fetch('/api/security-headers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: normalized })
			});
			const data = await res.json();
			scanResult = data;

			if (!data.ok) {
				scanError = data.summary || data.error || 'Pemindaian gagal.';
			}
		} catch {
			scanError = 'Pemindaian gagal. Coba domain publik lain atau cek koneksi server.';
			scanResult = null;
		} finally {
			isScanning = false;
		}
	}

	async function analyzeRisk() {
		if (!scanResult || isLoadingAI) return; // prevent duplicate AI calls
		isLoadingAI = true;
		aiError = '';
		try {
			aiAnalysis = await requestSecurityAI({
				app: 'risk-dashboard',
				action: 'analyze-risk-dashboard',
				input: {
					url: scanResult.url,
					grade: scanResult.grade,
					score: scanResult.score,
					presentHeaders: scanResult.presentHeaders,
					missingHeaders: scanResult.missingHeaders,
					checkedHeaders: scanResult.checkedHeaders
				}
			});
			aiError = aiAnalysis.ok ? '' : aiAnalysis.error || aiAnalysis.summary;
		} catch {
			aiError = 'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.';
		} finally {
			isLoadingAI = false;
		}
	}

	function getGradeClass(grade: string) {
		if (grade === 'A') return 'border-accent bg-accent/10 text-accent';
		if (grade === 'B') return 'border-accent-secondary bg-accent-secondary/10 text-accent-secondary';
		if (grade === 'C') return 'border-warning bg-warning/10 text-warning';
		return 'border-critical bg-critical/10 text-critical';
	}

	function getHeaderStatusClass(present: boolean) {
		return present ? 'border-accent/30 bg-accent/10 text-accent' : 'border-critical/30 bg-critical/10 text-critical';
	}
</script>

<div class="mx-auto mt-8 flex h-full w-full max-w-6xl flex-col gap-6">
	<MotionShell delay={0}>
		<AppHeader appId="risk-dashboard" />
	</MotionShell>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<MotionShell delay={100} class="lg:col-span-2">
			<div class="electric-border rounded-2xl border border-border bg-bg-panel p-6 shadow-md">
				<div class="mb-4 flex items-center justify-between gap-3 border-b border-border/50 pb-3">
					<div>
						<div class="text-xs font-semibold tracking-[0.22em] text-text-muted uppercase">
							Security Header Scanner
						</div>
						<p class="mt-1 text-sm text-text-muted">
							Masukkan domain atau URL untuk mengecek header browser-side hardening.
						</p>
					</div>
					<span class="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">
						Scan defensif
					</span>
				</div>

				<div class="flex flex-col gap-3 sm:flex-row">
					<div class="flex-1">
						<label for="security-header-target" class="mb-2 block text-xs font-semibold tracking-wider text-text-muted uppercase">
							Domain / URL
						</label>
						<input
							id="security-header-target"
							bind:value={targetUrl}
							placeholder="https://example.com"
							class="w-full rounded-lg border border-border bg-bg-base px-4 py-3 text-sm text-text-base outline-none transition-colors focus:border-accent"
						/>
					</div>
					<div class="flex items-end gap-2">
						<button
							onclick={scanHeaders}
							disabled={!canScan(targetUrl) || isScanning}
							class="btn-shimmer inline-flex flex-1 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-bg-base disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
						>
							{isScanning ? 'Scanning...' : 'Scan Security Headers'}
						</button>
						<button
							onclick={() => (targetUrl = sampleTargets[0])}
							class="inline-flex items-center justify-center rounded-lg border border-border/60 bg-bg-base/70 px-4 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-accent/30 hover:bg-accent/10 hover:text-accent"
						>
							Contoh
						</button>
					</div>
				</div>

				{#if scanError}
					<div class="mt-4 rounded-lg border border-critical/30 bg-critical/10 p-4 text-sm text-critical">
						{scanError}
					</div>
				{/if}

				{#if scanResult}
					<div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
						<div class={`electric-border ${scanResult.grade === 'A' ? 'electric-border-active' : 'electric-border-danger'} rounded-xl border p-4 shadow-sm ${getGradeClass(scanResult.grade)}`}>
							<div class="text-xs font-semibold tracking-wider uppercase opacity-80">Grade</div>
							<div class="mt-2 text-4xl font-black">{scanResult.grade}</div>
							<div class="mt-1 text-sm opacity-80">Skor {scanResult.score}/100</div>
						</div>
						<div class="electric-border electric-border-static rounded-xl border border-border bg-bg-base/70 p-4 shadow-sm md:col-span-3">
							<div class="text-xs font-semibold tracking-wider text-text-muted uppercase">Ringkasan</div>
							<p class="mt-2 text-sm leading-relaxed text-text-base">{scanResult.summary}</p>
							<div class="mt-3 text-xs text-text-muted">{scanResult.url}</div>
						</div>
					</div>

					<div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="rounded-xl border border-border bg-bg-base/70 p-4">
							<div class="mb-3 text-xs font-semibold tracking-wider text-text-muted uppercase">Header hadir</div>
							<div class="space-y-2">
								{#each scanResult.presentHeaders as header}
									<div class="rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 text-sm text-accent">{header}</div>
								{/each}
								{#if scanResult.presentHeaders.length === 0}
									<div class="text-sm text-text-muted">Belum ada header yang terdeteksi.</div>
								{/if}
							</div>
						</div>
						<div class="rounded-xl border border-border bg-bg-base/70 p-4">
							<div class="mb-3 text-xs font-semibold tracking-wider text-text-muted uppercase">Header hilang</div>
							<div class="space-y-2">
								{#each scanResult.missingHeaders as header}
									<div class="rounded-lg border border-critical/20 bg-critical/5 px-3 py-2 text-sm text-critical">{header}</div>
								{/each}
								{#if scanResult.missingHeaders.length === 0}
									<div class="text-sm text-text-muted">Semua header inti sudah terpasang.</div>
								{/if}
							</div>
						</div>
					</div>

					<div class="mt-6 rounded-xl border border-border bg-bg-base/70 p-4">
						<div class="mb-3 text-xs font-semibold tracking-wider text-text-muted uppercase">Detail pemeriksaan</div>
						<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
							{#each scanResult.checkedHeaders as header}
								<div class={`rounded-lg border px-3 py-2 text-sm ${getHeaderStatusClass(header.present)}`}>
									<div class="flex items-center justify-between gap-2">
										<span class="font-semibold">{header.name}</span>
										<span class="text-[10px] uppercase tracking-wider">{header.present ? 'Ada' : 'Hilang'}</span>
									</div>
									{#if header.value}
										<div class="mt-1 truncate text-xs opacity-80">{header.value}</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</MotionShell>

		<MotionShell delay={150} class="flex flex-col gap-4">
			<div class="electric-border electric-border-active rounded-2xl border border-border bg-bg-panel p-6 shadow-md">
				<div class="mb-4 flex items-center justify-between border-b border-border/50 pb-2">
					<h3 class="font-semibold text-accent">AI Hardening Advisor</h3>
					<button
						onclick={analyzeRisk}
						disabled={!scanResult || isLoadingAI}
						class="btn-shimmer rounded-lg border border-border/60 bg-bg-base/70 px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:border-accent/30 hover:bg-accent/10 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isLoadingAI ? 'Menganalisis...' : 'Analisa AI'}
					</button>
				</div>

				<div class="max-h-[60vh] overflow-y-auto pr-1">
				{#if isLoadingAI}
					<div class="animate-pulse space-y-3">
						<div class="h-4 w-3/4 rounded bg-border/50"></div>
						<div class="h-4 w-full rounded bg-border/50"></div>
						<div class="h-4 w-5/6 rounded bg-border/50"></div>
					</div>
				{:else if aiAnalysis?.ok}
					<div class="space-y-4">
						<div class="rounded-xl border border-border bg-bg-base/70 p-4">
							<div class="text-xs font-semibold tracking-wider text-text-muted uppercase">Ringkasan AI</div>
							<p class="mt-2 text-sm leading-relaxed text-text-base">
								{aiAnalysis.summary || aiAnalysis.result.managerSummary}
							</p>
						</div>

						<div class="rounded-xl border border-border bg-bg-base/70 p-4">
							<div class="text-xs font-semibold tracking-wider text-text-muted uppercase">Prioritas hardening</div>
							<div class="mt-2 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-sm font-semibold text-warning">
								{aiAnalysis.result.priority || 'Tinggi'}
							</div>
							<ul class="mt-3 space-y-2 text-sm text-text-base">
								{#each aiAnalysis.result.hardeningSuggestions || aiAnalysis.recommendations || [] as item}
									<li class="flex items-start gap-2">
										<span class="mt-1 text-accent">■</span>
										<span>{item}</span>
									</li>
								{/each}
							</ul>
						</div>
					</div>
					{:else if aiError}
						<div class="rounded-xl border border-critical/20 bg-critical/10 p-4 text-sm text-critical">{aiError}</div>
					{:else}
						<div class="rounded-xl border border-dashed border-border/60 bg-bg-base/40 p-4 text-sm text-text-muted">
							Pilih domain lalu jalankan scan untuk melihat rekomendasi AI.
						</div>
				{/if}
				</div>
			</div>
		</MotionShell>
	</div>

	<AppTutorial
		purpose="Mengecek security headers dari domain atau URL dan menilai hardening browser-side secara defensif."
		howToUse="Masukkan domain/URL, klik Scan Security Headers, lalu baca grade, header yang hadir, dan header yang hilang."
		aiAction="Tekan Analisa AI untuk mendapatkan ringkasan prioritas hardening dan contoh header yang perlu ditambahkan."
		output="Grade A/B/C/D, skor, daftar header present/missing, dan rekomendasi hardening yang mudah dibaca."
		securityNote="Security headers membantu melindungi aplikasi dari clickjacking, MIME sniffing, kebocoran referrer, dan risiko browser-side lain tanpa memberi instruksi ofensif."
	/>
</div>
