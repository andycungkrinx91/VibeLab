<script lang="ts">
	import MotionShell from '$lib/components/MotionShell.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppTutorial from '$lib/components/AppTutorial.svelte';

	let severity = $state('High');
	let assetCriticality = $state('High');
	let internetExposed = $state(false);
	let exploitAvailable = $state(false);
	let sensitiveData = $state(true);
	let patchComplexity = $state('Medium');

	let riskScore = $derived.by(() => {
		let score = 50;
		if (severity === 'Critical') score += 30;
		if (severity === 'High') score += 20;
		if (assetCriticality === 'Critical') score += 20;
		if (assetCriticality === 'High') score += 10;
		if (internetExposed) score += 20;
		if (exploitAvailable) score += 15;
		if (sensitiveData) score += 10;
		if (patchComplexity === 'High') score += 5; // Harder to patch = higher risk
		return Math.min(100, score);
	});

	let finalSeverity = $derived.by(() => {
		if (riskScore >= 90) return 'Critical';
		if (riskScore >= 70) return 'High';
		if (riskScore >= 40) return 'Medium';
		return 'Low';
	});

	let aiAnalysis = $state<any>(null);
	let isLoadingAI = $state(false);

	async function explainRisk() {
		isLoadingAI = true;
		aiAnalysis = null;
		try {
			const res = await fetch('/api/ai/security', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					app: 'cvss-calculator',
					action: 'explain-cvss-risk',
					input: {
						severity,
						assetCriticality,
						internetExposed,
						exploitAvailable,
						sensitiveData,
						patchComplexity,
						calculatedRiskScore: riskScore,
						calculatedSeverity: finalSeverity
					}
				})
			});
			const data = await res.json();
			if (data.ok) {
				aiAnalysis = data;
			} else {
				aiAnalysis = data;
			}
		} catch (e) {
			aiAnalysis = {
				ok: false,
				error: 'Fitur AI gagal sementara, tetapi aplikasi tetap bisa digunakan dengan data lokal.'
			};
		} finally {
			isLoadingAI = false;
		}
	}

	function getSeverityColor(sev: string) {
		if (sev === 'Critical') return 'text-critical';
		if (sev === 'High') return 'text-warning';
		if (sev === 'Medium') return 'text-accent-secondary';
		return 'text-accent';
	}

	function getSeverityBg(sev: string) {
		if (sev === 'Critical') return 'bg-critical';
		if (sev === 'High') return 'bg-warning';
		if (sev === 'Medium') return 'bg-accent-secondary';
		return 'bg-accent';
	}
</script>

	<div class="mx-auto mt-8 flex h-full w-full max-w-5xl flex-col gap-6">
		<MotionShell delay={0}>
			<AppHeader appId="cvss-calculator" />
		</MotionShell>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Calculator Inputs -->
		<MotionShell delay={100}>
			<div class="electric-border rounded-lg border border-border bg-bg-panel p-6 shadow-md">
				<h3 class="mb-4 border-b border-border pb-2 font-semibold text-text-base">
					Scoring Factors
				</h3>

				<div class="space-y-4">
					<div>
						<label for="cvss-severity" class="mb-1 block text-sm text-text-muted">Base Severity (Vendor)</label>
						<select
							id="cvss-severity"
							bind:value={severity}
							onchange={explainRisk}
							class="w-full rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
						>
							<option value="Low">Low</option>
							<option value="Medium">Medium</option>
							<option value="High">High</option>
							<option value="Critical">Critical</option>
						</select>
					</div>

					<div>
						<label for="cvss-asset-criticality" class="mb-1 block text-sm text-text-muted">Asset Criticality</label>
						<select
							id="cvss-asset-criticality"
							bind:value={assetCriticality}
							onchange={explainRisk}
							class="w-full rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
						>
							<option value="Low">Low (Non-essential)</option>
							<option value="Medium">Medium (Internal Tool)</option>
							<option value="High">High (Core Service)</option>
							<option value="Critical">Critical (Revenue Generating)</option>
						</select>
					</div>

					<div>
						<label for="cvss-patch-complexity" class="mb-1 block text-sm text-text-muted">Patch Complexity</label>
						<select
							id="cvss-patch-complexity"
							bind:value={patchComplexity}
							onchange={explainRisk}
							class="w-full rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
						>
							<option value="Low">Low (Auto-update)</option>
							<option value="Medium">Medium (Standard Deploy)</option>
							<option value="High">High (Downtime Required)</option>
						</select>
					</div>

					<div class="pt-2">
						<label class="flex cursor-pointer items-center gap-3">
							<input
								type="checkbox"
								bind:checked={internetExposed}
								onchange={explainRisk}
								class="h-4 w-4 accent-accent"
							/>
							<span class="text-sm text-text-base">Internet Exposed</span>
						</label>
					</div>

					<div>
						<label class="flex cursor-pointer items-center gap-3">
							<input
								type="checkbox"
								bind:checked={exploitAvailable}
								onchange={explainRisk}
								class="h-4 w-4 accent-accent"
							/>
							<span class="text-sm text-text-base">Active Exploit Available (PoC/Wild)</span>
						</label>
					</div>

					<div>
						<label class="flex cursor-pointer items-center gap-3">
							<input
								type="checkbox"
								bind:checked={sensitiveData}
								onchange={explainRisk}
								class="h-4 w-4 accent-accent"
							/>
							<span class="text-sm text-text-base">Processes Sensitive Data (PII/PCI)</span>
						</label>
					</div>
				</div>
			</div>
		</MotionShell>

		<!-- Results & AI -->
		<MotionShell delay={200} class="flex flex-col gap-6">
			<!-- Score Panel -->
			<div class="electric-border electric-border-active rounded-lg border border-border bg-bg-panel p-6 text-center shadow-md">
				<div class="mb-2 text-sm tracking-wider text-text-muted uppercase">
					Contextual Risk Score
				</div>
				<div class="mb-2 text-6xl font-bold {getSeverityColor(finalSeverity)}">
					{riskScore}
				</div>
				<div
					class="inline-block rounded px-3 py-1 text-sm font-bold text-bg-base {getSeverityBg(
						finalSeverity
					)}"
				>
					{finalSeverity}
				</div>

				<div class="mt-6 h-2 w-full overflow-hidden rounded-full bg-bg-base">
					<div
						class="h-full {getSeverityBg(finalSeverity)} transition-all duration-500"
						style="width: {riskScore}%"
					></div>
				</div>
			</div>

			<!-- AI Analysis -->
			<div
				class="electric-border electric-border-active flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-bg-panel shadow-md"
			>
				<div
					class="flex items-center justify-between border-b border-border/50 bg-bg-base px-4 py-3"
				>
					<h3 class="flex items-center gap-2 font-semibold text-accent">AI Mitigation Advisor</h3>
					{#if !aiAnalysis && !isLoadingAI}
					<button onclick={explainRisk} class="btn-shimmer text-xs text-accent hover:underline"
						>Analisa</button
					>
					{/if}
				</div>
				<div class="flex-1 overflow-y-auto p-5">
					{#if isLoadingAI}
						<div class="animate-pulse space-y-3">
							<div class="h-4 w-3/4 rounded bg-border/50"></div>
							<div class="h-4 w-full rounded bg-border/50"></div>
							<div class="h-4 w-5/6 rounded bg-border/50"></div>
						</div>
					{:else if aiAnalysis?.ok}
						<div class="mb-4">
							<div class="mb-1 text-xs text-text-muted uppercase">Explanation</div>
							<p class="text-sm leading-relaxed">
								{aiAnalysis.result.explanation || aiAnalysis.summary}
							</p>
						</div>

						<div class="mb-4">
							<div class="mb-1 text-xs text-text-muted uppercase">Recommended SLA</div>
							<div
								class="inline-block rounded border border-border bg-bg-base px-2 py-1 font-mono text-xs font-bold text-accent-secondary"
							>
								{aiAnalysis.result.suggestedSla}
							</div>
						</div>

						<div>
							<div class="mb-2 text-xs text-text-muted uppercase">Mitigation Plan</div>
							<ul class="space-y-1">
								{#each aiAnalysis.recommendations as rec}
									<li class="flex items-start text-sm">
										<span class="mr-2 text-accent">■</span>
										<span class="text-text-base">{rec}</span>
									</li>
								{/each}
							</ul>
						</div>
					{:else if aiAnalysis?.error}
						<div class="text-sm text-critical">{aiAnalysis.error}</div>
					{:else}
						<div class="py-8 text-center text-sm text-text-muted">
							Klik analisa untuk mendapatkan saran perbaikan berbasis AI.
						</div>
					{/if}
				</div>
			</div>
		</MotionShell>
	</div>

	<AppTutorial
		purpose="Menghitung prioritas risiko vulnerability berdasarkan severity, criticality aset, exposure, dan kontrol patching."
		howToUse="Pilih faktor risiko di panel kiri lalu baca skor, severity badge, dan rekomendasi mitigasi di panel kanan."
		aiAction="Klik Analisa untuk meminta AI menjelaskan kenapa risiko naik atau turun dan memberi saran SLA patch."
		output="Risk score, severity badge, ringkasan mitigasi, dan SLA patch yang disarankan."
		securityNote="Gunakan risk scoring untuk triage defensif dan prioritas patch, bukan untuk eksploitasi."
	/>
</div>
