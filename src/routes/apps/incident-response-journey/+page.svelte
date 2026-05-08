<script lang="ts">
	import MotionShell from '$lib/components/MotionShell.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppTutorial from '$lib/components/AppTutorial.svelte';
	import { requestSecurityAI } from '$lib/utils/ai-client';

	const steps = [
		{ id: 'detect', label: 'Detect', icon: '⚡' },
		{ id: 'triage', label: 'Triage', icon: '🔍' },
		{ id: 'contain', label: 'Contain', icon: '🛡️' },
		{ id: 'patch', label: 'Patch', icon: '💊' },
		{ id: 'verify', label: 'Verify', icon: '✅' },
		{ id: 'deploy', label: 'Deploy', icon: '🚀' },
		{ id: 'postmortem', label: 'Postmortem', icon: '📄' }
	];

	let activeStepIndex = $state(0);
	let activeStep = $derived(steps[activeStepIndex]);

	let aiContent = $state<any>({});
	let isLoadingAI = $state(false);

	async function fetchStepExplanation(stepId: string) {
		isLoadingAI = true;
		aiContent[stepId] = null;
		try {
			aiContent[stepId] = await requestSecurityAI({
				app: 'incident-response-journey',
				action: 'explain-ir-step',
				input: {
					step: stepId,
					incidentType: 'Web Server Compromise',
					currentContext: 'General Playbook'
				}
			});
		} catch {
			aiContent[stepId] = {
				ok: false,
				app: 'incident-response-journey',
				action: 'explain-ir-step',
				result: {},
				summary: 'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.',
				recommendations: [],
				warnings: [],
				error: 'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.'
			};
		} finally {
			isLoadingAI = false;
		}
	}

	let quizData = $state<any>(null);
	async function generateQuiz() {
		isLoadingAI = true;
		quizData = null;
		try {
			const data = await requestSecurityAI({
				app: 'incident-response-journey',
				action: 'generate-ir-quiz',
				input: { step: activeStep.label, difficulty: 'Medium' }
			});
			quizData = data.ok
				? data.result
				: {
					question: data.error || data.summary,
					options: [],
					correctAnswer: ''
				};
		} catch {
			quizData = {
				question: 'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.',
				options: [],
				correctAnswer: ''
			};
		} finally {
			isLoadingAI = false;
		}
	}

	let quizAnswered = $state(false);
	let isQuizCorrect = $state(false);

	function answerQuiz(opt: string) {
		if (quizData) {
			quizAnswered = true;
			isQuizCorrect = opt === quizData.correctAnswer;
		}
	}

	$effect(() => {
		// reset quiz on step change
		if (activeStepIndex >= 0) {
			quizData = null;
			quizAnswered = false;
			isQuizCorrect = false;
		}
	});
</script>

<div class="mx-auto mt-8 flex min-h-0 w-full max-w-5xl flex-col gap-6">
		<MotionShell delay={0}>
			<AppHeader appId="incident-response-journey" />
		</MotionShell>

	<!-- Timeline -->
	<MotionShell delay={100}>
		<div class="relative overflow-hidden rounded-lg border border-border bg-bg-panel p-6 shadow-md">
			<!-- Tracing Beam -->
			<div
				class="absolute top-14 bottom-6 left-6 z-0 w-0.5 bg-border md:top-14 md:right-6 md:bottom-auto md:left-6 md:left-auto md:h-0.5 md:w-full"
			></div>
			<div
				class="absolute top-14 left-6 z-0 w-0.5 bg-accent shadow-[0_0_10px_var(--color-accent-glow)] transition-all duration-500 md:top-14 md:left-6 md:left-auto md:h-0.5"
				style="bottom: {100 -
					(activeStepIndex / (steps.length - 1)) * 100}%; md:bottom: auto; md:right: {100 -
					(activeStepIndex / (steps.length - 1)) * 100}%; md:width: {(activeStepIndex /
					(steps.length - 1)) *
					100}%"
			></div>

			<div class="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:gap-0">
				{#each steps as step, i}
					<button
						class="group flex items-center gap-4 text-left md:flex-col md:gap-2 md:text-center"
						onclick={() => (activeStepIndex = i)}
					>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-bg-panel transition-all duration-300
							{i <= activeStepIndex
								? 'border-accent text-accent shadow-[0_0_15px_var(--color-accent-glow)]'
								: 'border-border text-text-muted'}
							{i === activeStepIndex ? 'scale-110 bg-accent/10' : ''}
						"
						>
							{step.icon}
						</div>
						<div
							class="text-sm font-bold {i <= activeStepIndex
								? 'text-text-base'
								: 'text-text-muted'}"
						>
							{step.label}
						</div>
					</button>
				{/each}
			</div>
		</div>
	</MotionShell>

	<!-- Content Area -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Explanation Panel -->
		<MotionShell delay={200} class="flex min-h-0 flex-col">
			<div
				class="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-bg-panel shadow-md"
			>
				<div class="flex items-center justify-between border-b border-border bg-bg-base px-4 py-3">
					<h3 class="flex items-center gap-2 font-mono font-bold text-accent-secondary">
						<span class="text-accent">>_</span>
						{activeStep.label} Phase
					</h3>
					<button
						onclick={() => fetchStepExplanation(activeStep.id)}
						disabled={isLoadingAI}
						class="rounded border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-bg-base disabled:opacity-50"
					>
						{isLoadingAI ? 'Memuat...' : aiContent[activeStep.id] ? 'Muat Ulang AI' : 'Muat AI'}
					</button>
				</div>
				<div class="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed text-text-base">
					{#if isLoadingAI && !aiContent[activeStep.id]}
						<div class="animate-pulse text-text-muted">Memuat instruksi playbook...</div>
					{:else if aiContent[activeStep.id]}
						<p class="mb-4">
							{aiContent[activeStep.id].result?.explanation || aiContent[activeStep.id].summary}
						</p>
						{#if aiContent[activeStep.id].recommendations?.length > 0}
							<div class="mt-4 mb-2 border-b border-border/50 pb-1 text-xs text-text-muted">
								Tindakan Defensif:
							</div>
							<ul class="space-y-2">
								{#each aiContent[activeStep.id].recommendations as rec}
									<li
										class="flex items-start text-text-base before:mr-2 before:text-accent-secondary before:content-['-']"
									>
										{rec}
									</li>
								{/each}
							</ul>
						{/if}
					{:else}
						<div class="text-text-muted">Klik tombol “Muat AI” untuk menampilkan penjelasan fase ini.</div>
					{/if}
				</div>
			</div>
		</MotionShell>

		<!-- Interactive Panel (Quiz / Postmortem) -->
		<MotionShell delay={300} class="flex min-h-0 flex-col">
			<div
				class="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-bg-panel shadow-md"
			>
				<div class="border-b border-border bg-bg-base px-4 py-3">
					<h3 class="flex items-center gap-2 font-bold text-warning">Knowledge Check</h3>
				</div>
				<div class="flex flex-1 flex-col items-center justify-center p-6 text-center">
					{#if !quizData && !isLoadingAI}
						<div class="mb-4 text-sm text-text-muted">
							Uji pengetahuan Anda tentang fase {activeStep.label}.
						</div>
						<button
							onclick={generateQuiz}
							class="btn-shimmer rounded border border-warning bg-warning/10 px-6 py-2 font-bold text-warning transition-colors hover:bg-warning hover:text-bg-base"
						>
							Mulai Kuis AI
						</button>
					{:else if isLoadingAI}
						<div class="animate-pulse text-text-muted">Menyiapkan skenario...</div>
					{:else if quizData}
						<div class="w-full text-left">
							<p class="mb-4 font-bold text-text-base">{quizData.question}</p>
							<div class="flex flex-col gap-2">
								{#each quizData.options || [] as opt}
									<button
										onclick={() => answerQuiz(opt)}
										disabled={quizAnswered}
										class="rounded border p-3 text-left text-sm transition-all duration-300
										{quizAnswered && opt === quizData.correctAnswer ? 'border-accent bg-accent/20 text-accent' : ''}
										{quizAnswered && opt !== quizData.correctAnswer ? 'border-border opacity-50' : ''}
										{!quizAnswered ? 'border-border bg-bg-base hover:border-accent-secondary' : ''}
										"
									>
										{opt}
									</button>
								{/each}
							</div>
							{#if quizAnswered}
								<div
									class="mt-4 rounded p-3 text-center font-bold {isQuizCorrect
										? 'border border-accent bg-accent/10 text-accent'
										: 'border border-critical bg-critical/10 text-critical'}"
								>
									{isQuizCorrect
										? 'Tepat Sekali! Sesuai prosedur.'
										: 'Kurang Tepat. Review kembali prosedur ' + activeStep.label + '.'}
								</div>
								<div class="mt-4 text-center">
									<button
										onclick={() => {
											quizData = null;
											quizAnswered = false;
										}}
										class="text-xs text-text-muted hover:underline">Reset Kuis</button
									>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</MotionShell>
	</div>

	<AppTutorial
		purpose="Memahami alur incident response dari Detect sampai Postmortem secara interaktif."
		howToUse="Pilih step di timeline untuk membaca penjelasan fase, lalu gunakan kuis untuk menguji pemahaman."
		aiAction="Gunakan AI Explain Step, Generate IR Quiz, dan Generate Postmortem Template."
		output="Penjelasan langkah, kuis singkat, dan template postmortem defensif."
		securityNote="Incident response yang baik membutuhkan alur yang jelas, dokumentasi, dan tindakan defensif yang terukur."
	/>
</div>
