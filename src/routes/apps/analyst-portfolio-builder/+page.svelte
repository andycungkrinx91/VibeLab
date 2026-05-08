<script lang="ts">
	import MotionShell from '$lib/components/MotionShell.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppTutorial from '$lib/components/AppTutorial.svelte';
	import { requestSecurityAI } from '$lib/utils/ai-client';

	let nama = $state('');
	let role = $state('');
	let skills = $state('');
	let tools = $state('');
	let certifications = $state('');
	let achievements = $state('');
	let projects = $state('');
	let links = $state('');

	let aiBio = $state<string | null>(null);
	let aiImprovedProjects = $state<string[] | null>(null);
	let aiReview = $state<string | null>(null);
	let aiAtsCv = $state<string | null>(null);
	let aiAtsRecommendations = $state<string[] | null>(null);

	let isLoadingBio = $state(false);
	let isLoadingProjects = $state(false);
	let isLoadingReview = $state(false);
	let isLoadingAts = $state(false);
	let aiError = $state('');

	function splitByComma(value: string) {
		return value
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);
	}

	function splitByLine(value: string) {
		return value
			.split('\n')
			.map((item) => item.replace(/^[-*]\s*/, '').trim())
			.filter(Boolean);
	}

	async function generateBio() {
		isLoadingBio = true;
		aiBio = null;
		aiError = '';
		try {
			const data = await requestSecurityAI({
				app: 'analyst-portfolio-builder',
				action: 'generate-security-bio',
				input: {
					nama,
					role,
					skills: splitByComma(skills),
					tools: splitByComma(tools),
					certifications: splitByComma(certifications),
					achievements: splitByComma(achievements),
					links: splitByLine(links)
				}
			});
			aiBio = data.ok
				? ((data.result.bio as string) || data.summary)
				: data.error || data.summary;
		} catch {
			aiBio = 'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.';
		} finally {
			isLoadingBio = false;
		}
	}

	async function improveProjects() {
		isLoadingProjects = true;
		aiImprovedProjects = null;
		aiError = '';
		try {
			const data = await requestSecurityAI({
				app: 'analyst-portfolio-builder',
				action: 'improve-security-projects',
				input: {
					projects: projects.split('\n').filter((p) => p.trim() !== ''),
					targetRole: role,
					tone: 'professional'
				}
			});
			aiImprovedProjects = data.ok
				? Array.isArray(data.result.improvedProjects)
					? (data.result.improvedProjects as string[])
					: [data.summary]
				: [data.error || data.summary];
		} catch {
			aiImprovedProjects = ['Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.'];
		} finally {
			isLoadingProjects = false;
		}
	}

	async function reviewProfile() {
		isLoadingReview = true;
		aiReview = null;
		aiError = '';
		try {
			const data = await requestSecurityAI({
				app: 'analyst-portfolio-builder',
				action: 'review-analyst-profile',
				input: {
					profile: { nama, role, skills, tools, certifications, achievements, projects },
					targetRole: role,
					experienceLevel: 'Mid-Level'
				}
			});
			aiReview = data.ok ? ((data.result.review as string) || data.summary) : data.error || data.summary;
		} catch {
			aiReview = 'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.';
		} finally {
			isLoadingReview = false;
		}
	}

	async function generateAtsCv() {
		isLoadingAts = true;
		aiAtsCv = null;
		aiAtsRecommendations = null;
		aiError = '';
		try {
			const data = await requestSecurityAI({
				app: 'analyst-portfolio-builder',
				action: 'generate-ats-cv',
				input: {
					nama,
					role,
					skills: splitByComma(skills),
					tools: splitByComma(tools),
					certifications: splitByComma(certifications),
					projects: splitByLine(projects),
					achievements: splitByComma(achievements),
					links: splitByLine(links)
				}
			});
			if (data.ok) {
				const summary = (data.result.atsSummary as string) || data.summary || 'CV ATS siap digunakan.';
				const sections = Array.isArray(data.result.sections) ? (data.result.sections as string[]) : [];
				const bullets = Array.isArray(data.result.bullets) ? (data.result.bullets as string[]) : [];
				const body = [summary, '', ...sections, '', ...bullets.map((bullet: string) => `- ${bullet}`)]
					.filter(Boolean)
					.join('\n');
				aiAtsCv = body;
				aiAtsRecommendations = Array.isArray(data.result.recommendations)
					? (data.result.recommendations as string[])
					: data.recommendations;
			} else {
				aiAtsCv = data.error || data.summary;
			}
		} catch {
			aiAtsCv = 'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.';
		} finally {
			isLoadingAts = false;
		}
	}

	function exportAtsCv() {
		if (typeof window === 'undefined') return;

		const content = aiAtsCv || buildFallbackCv();
		const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const fileName = `vibesec-ats-cv-${(nama || 'analis').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
		const link = document.createElement('a');
		link.href = url;
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(url);
	}

	function buildFallbackCv() {
		return [
			`# ${nama || 'Nama Analis'}`,
			`**Role:** ${role || 'Security Analyst'}`,
			'',
			'## Summary',
			'Profil profesional keamanan siber yang berfokus pada deteksi, triage, hardening, dan incident response.',
			'',
			'## Skills',
			...splitByComma(skills).map((item) => `- ${item}`),
			'',
			'## Tools',
			...splitByComma(tools).map((item) => `- ${item}`)
		].join('\n');
	}
</script>

	<div class="mx-auto mt-8 flex h-full w-full max-w-7xl flex-col gap-6">
		<MotionShell delay={0}>
			<AppHeader appId="analyst-portfolio-builder" />
		</MotionShell>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Form Input -->
		<MotionShell delay={100} class="flex flex-col gap-4">
			<div class="space-y-4 rounded-lg border border-border bg-bg-panel p-6 shadow-md">
				<h3 class="border-b border-border pb-2 font-semibold text-text-base">Informasi Dasar</h3>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label for="portfolio-name" class="mb-1 block text-xs text-text-muted">Nama</label>
						<input
							id="portfolio-name"
							bind:value={nama}
							type="text"
							placeholder="John Doe"
							class="w-full rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
						/>
					</div>
					<div>
						<label for="portfolio-role" class="mb-1 block text-xs text-text-muted">Role Impian / Saat Ini</label>
						<input
							id="portfolio-role"
							bind:value={role}
							type="text"
							placeholder="SOC Analyst, Penetration Tester"
							class="w-full rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
						/>
					</div>
				</div>

				<div>
					<label for="portfolio-skills" class="mb-1 block text-xs text-text-muted">Skills (Pisahkan dengan koma)</label>
					<input
						id="portfolio-skills"
						bind:value={skills}
						type="text"
						placeholder="Threat Hunting, Malware Analysis, Incident Response"
						class="w-full rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
					/>
				</div>

				<div>
					<label for="portfolio-tools" class="mb-1 block text-xs text-text-muted">Tools (Pisahkan dengan koma)</label>
					<input
						id="portfolio-tools"
						bind:value={tools}
						type="text"
						placeholder="Splunk, Wireshark, Burp Suite, CrowdStrike"
						class="w-full rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
					/>
				</div>

				<div>
					<label for="portfolio-certifications" class="mb-1 block text-xs text-text-muted"
						>Sertifikasi (Pisahkan dengan koma)</label
					>
					<input
						id="portfolio-certifications"
						bind:value={certifications}
						type="text"
						placeholder="Security+, CEH, OSCP, CISSP"
						class="w-full rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
					/>
				</div>

				<div>
					<label for="portfolio-achievements" class="mb-1 block text-xs text-text-muted"
						>Pencapaian Utama (Pisahkan dengan koma)</label
					>
					<textarea
						id="portfolio-achievements"
						bind:value={achievements}
						rows="2"
						placeholder="Menemukan 5 kerentanan kritikal, Mengurangi waktu respon insiden 30%"
						class="w-full rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
					></textarea>
				</div>

				<div>
					<label for="portfolio-projects" class="mb-1 block text-xs text-text-muted"
						>Proyek Keamanan (Satu proyek per baris)</label
					>
					<textarea
						id="portfolio-projects"
						bind:value={projects}
						rows="3"
						placeholder="- Membuat home lab Active Directory untuk simulasi serangan
- Menulis skrip Python untuk analisis log otomatis"
						class="w-full rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
					></textarea>
				</div>

				<div>
					<label for="portfolio-links" class="mb-1 block text-xs text-text-muted">Link Portofolio (Satu link per baris)</label>
					<textarea
						id="portfolio-links"
						bind:value={links}
						rows="2"
						placeholder="https://linkedin.com/in/username\nhttps://github.com/username"
						class="w-full rounded border border-border bg-bg-base px-3 py-2 text-sm text-text-base outline-none focus:border-accent"
					></textarea>
				</div>
			</div>
		</MotionShell>

		<!-- Live Preview & AI Actions -->
		<MotionShell delay={200} class="flex flex-col gap-6">
			<!-- Live Dossier Card -->
			<div
				class="electric-border electric-border-active relative overflow-hidden rounded-lg border border-accent/50 bg-bg-panel p-6 shadow-md shadow-accent-glow/10"
			>
				<div class="absolute top-0 right-0 p-4 opacity-10">
					<div class="font-mono text-8xl font-bold">ID</div>
				</div>
				<h3 class="mb-1 text-lg font-bold text-accent">{nama || 'Nama Analis'}</h3>
				<div class="mb-4 text-sm tracking-wider text-text-muted uppercase">
					{role || 'Role Keamanan Siber'}
				</div>

				<div class="space-y-4">
					{#if aiBio}
						<div class="rounded border border-border/50 bg-bg-base p-3 text-sm italic">
							"{aiBio}"
						</div>
					{/if}

					<div class="flex flex-wrap gap-2">
						{#each skills.split(',') as skill}
							{#if skill.trim()}
								<span
									class="rounded border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent uppercase"
									>{skill.trim()}</span
								>
							{/if}
						{/each}
						{#each tools.split(',') as tool}
							{#if tool.trim()}
								<span
									class="rounded border border-warning/20 bg-warning/10 px-2 py-1 text-[10px] font-bold text-warning uppercase"
									>{tool.trim()}</span
								>
							{/if}
						{/each}
					</div>

					<div class="space-y-1">
						<div class="mb-1 text-xs text-text-muted uppercase">Sertifikasi Aktif</div>
						{#each certifications.split(',') as cert}
							{#if cert.trim()}
								<div class="flex items-center gap-2 text-sm">
									<span class="text-accent">★</span>
									{cert.trim()}
								</div>
							{/if}
						{/each}
					</div>
				</div>
			</div>

			<!-- AI Actions Panel -->
			<div class="electric-border flex-1 rounded-lg border border-border bg-bg-panel p-6 shadow-md">
				<h3 class="mb-4 border-b border-border pb-2 font-semibold text-text-base">AI Assistant</h3>

				<div class="mb-6 flex flex-col gap-3">
					<button
						onclick={generateBio}
						disabled={isLoadingBio}
						class="btn-shimmer flex w-full items-center justify-between rounded border border-accent/50 bg-accent/10 px-4 py-2 text-left text-sm font-semibold text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<span>1. Generate Professional Bio</span>
						{#if isLoadingBio}<span class="animate-pulse">...</span>{/if}
					</button>
					<button
						onclick={improveProjects}
						disabled={isLoadingProjects}
						class="btn-shimmer flex w-full items-center justify-between rounded border border-warning/50 bg-warning/10 px-4 py-2 text-left text-sm font-semibold text-warning transition-colors hover:bg-warning/20 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<span>2. Polish Project Descriptions</span>
						{#if isLoadingProjects}<span class="animate-pulse">...</span>{/if}
					</button>
					<button
						onclick={reviewProfile}
						disabled={isLoadingReview}
						class="btn-shimmer flex w-full items-center justify-between rounded border border-accent-secondary/50 bg-accent-secondary/10 px-4 py-2 text-left text-sm font-semibold text-accent-secondary transition-colors hover:bg-accent-secondary/20 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<span>3. Get Expert Profile Review</span>
						{#if isLoadingReview}<span class="animate-pulse">...</span>{/if}
					</button>
					<button
						onclick={generateAtsCv}
						disabled={isLoadingAts}
						class="btn-shimmer flex w-full items-center justify-between rounded border border-border bg-bg-base px-4 py-2 text-left text-sm font-semibold text-text-base transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
					>
						<span>4. Generate CV ATS</span>
						{#if isLoadingAts}<span class="animate-pulse">...</span>{/if}
					</button>
				</div>

				<!-- AI Output Display -->
				{#if aiAtsCv || aiImprovedProjects || aiReview}
					<div class="max-h-[55vh] space-y-4 overflow-y-auto rounded-lg border border-border bg-bg-base p-4 text-sm">
						{#if aiAtsCv}
							<div>
								<div class="mb-2 flex items-center justify-between gap-2">
									<h4 class="font-bold text-accent">ATS CV</h4>
							<button
								onclick={exportAtsCv}
								class="btn-shimmer rounded border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-bg-base"
							>
										Export CV
									</button>
								</div>
							<pre class="max-h-[28vh] max-w-full overflow-auto whitespace-pre-wrap rounded border border-border/50 bg-bg-panel p-3 text-sm leading-relaxed text-text-base">{aiAtsCv}</pre>
								{#if aiAtsRecommendations && aiAtsRecommendations.length > 0}
									<ul class="mt-3 space-y-2">
										{#each aiAtsRecommendations as rec}
											<li class="flex items-start text-sm">
												<span class="mr-2 text-accent">•</span>
												<span class="text-text-muted">{rec}</span>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						{/if}

						{#if aiImprovedProjects}
							<div>
								<h4 class="mb-2 font-bold text-warning">Project Improvements:</h4>
								<ul class="list-disc space-y-1 pl-4 text-text-muted">
									{#each aiImprovedProjects as proj}
										<li>{proj}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if aiReview}
							<div>
								<h4 class="mb-2 font-bold text-accent-secondary">Profile Feedback:</h4>
								<p class="whitespace-pre-line text-text-muted">{aiReview}</p>
							</div>
						{/if}
					</div>
				{/if}

				{#if aiError}
					<div class="mt-4 rounded border border-critical/20 bg-critical/10 p-3 text-sm text-critical">
						{aiError}
					</div>
				{/if}
			</div>
		</MotionShell>
	</div>

	<AppTutorial
		purpose="Membantu membangun profil security profesional yang ATS-friendly dan recruiter-friendly."
		howToUse="Isi nama, role, skill, tools, sertifikasi, proyek, pencapaian, dan link lalu gunakan tombol AI untuk membuat bio atau CV ATS."
		aiAction="Generate Bio, Polish Project Descriptions, Get Expert Profile Review, dan Generate CV ATS."
		output="Profil portfolio, bio profesional, deskripsi proyek yang lebih rapi, serta CV ATS lokal yang bisa diekspor."
		securityNote="Tampilkan pengalaman defensif, impact terukur, dan hindari klaim ofensif yang tidak relevan."
	/>
</div>
