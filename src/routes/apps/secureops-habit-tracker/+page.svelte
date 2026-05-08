<script lang="ts">
	import { onMount } from 'svelte';
	import MotionShell from '$lib/components/MotionShell.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import AppTutorial from '$lib/components/AppTutorial.svelte';
	import { requestSecurityAI } from '$lib/utils/ai-client';

	type Habit = { id: string; label: string; checked: boolean };
	type DayRecord = { date: string; completed: boolean; progress: number };
	type StorageShape = {
		habits: Habit[];
		records: Record<string, DayRecord>;
	};

	const STORAGE_KEY = 'secureops-habits';
	const baseHabits = (): Habit[] => [
		{ id: 'log', label: 'Review Security Logs', checked: false },
		{ id: 'dep', label: 'Dependency Scan', checked: false },
		{ id: 'sec', label: 'Secret Scan', checked: false },
		{ id: 'bak', label: 'Backup Verification', checked: false },
		{ id: 'acc', label: 'Access Review', checked: false },
		{ id: 'cve', label: 'CVE Feed Review', checked: false }
	];

	function todayKey(date = new Date()) {
		return date.toISOString().slice(0, 10);
	}

	function dateOffsetKey(offset: number) {
		const d = new Date();
		d.setDate(d.getDate() - offset);
		return todayKey(d);
	}

	function loadStorage(): StorageShape | null {
		if (typeof window === 'undefined') return null;
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		try {
			const parsed = JSON.parse(raw) as Partial<StorageShape>;
			return {
				habits: Array.isArray(parsed.habits) ? (parsed.habits as Habit[]) : baseHabits(),
				records: parsed.records && typeof parsed.records === 'object' ? parsed.records : {}
			};
		} catch {
			return null;
		}
	}

	let currentDate = $state(todayKey());
	let habits = $state<Habit[]>(baseHabits());
	let records = $state<Record<string, DayRecord>>({});
	let isReady = $state(false);
	let aiCoachMessage = $state<string | null>(null);
	let aiNextSteps = $state<string[] | null>(null);
	let aiError = $state('');
	let isLoadingAI = $state(false);

	let completedItems = $derived(habits.filter((habit) => habit.checked).map((habit) => habit.label));
	let missedItems = $derived(habits.filter((habit) => !habit.checked).map((habit) => habit.label));
	let progress = $derived(Math.round((completedItems.length / habits.length) * 100));
	let allCompleted = $derived(progress === 100);
	let streak = $derived(computeStreak(records, currentDate));
	let weeklyProgress = $derived(buildWeeklyProgress(records));

	function computeStreak(recordMap: Record<string, DayRecord>, date: string) {
		let total = 0;
		let cursor = date;
		while (recordMap[cursor]?.completed) {
			total += 1;
			const prev = new Date(`${cursor}T00:00:00`);
			prev.setDate(prev.getDate() - 1);
			cursor = todayKey(prev);
		}
		return total;
	}

	function buildWeeklyProgress(recordMap: Record<string, DayRecord>) {
		return Array.from({ length: 7 }, (_, index) => {
			const date = dateOffsetKey(6 - index);
			return recordMap[date] || { date, completed: false, progress: 0 };
		});
	}

	function persistState(nextHabits = habits, nextRecords = records) {
		if (typeof window === 'undefined') return;
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ habits: nextHabits, records: nextRecords })
		);
	}

	function updateTodayRecord(nextHabits: Habit[]) {
		const nextRecords = {
			...records,
			[currentDate]: {
				date: currentDate,
				completed: nextHabits.every((habit) => habit.checked),
				progress: Math.round((nextHabits.filter((habit) => habit.checked).length / nextHabits.length) * 100)
			}
		};
		records = nextRecords;
		persistState(nextHabits, nextRecords);
	}

	function toggleHabit(id: string) {
		habits = habits.map((habit) => (habit.id === id ? { ...habit, checked: !habit.checked } : habit));
		updateTodayRecord(habits);
	}

	onMount(() => {
		const stored = loadStorage();
		if (stored) {
			records = stored.records || {};
			const todayRecord = stored.records?.[currentDate];
			if (todayRecord) {
				habits = stored.habits.length ? stored.habits : baseHabits();
			} else {
				habits = baseHabits();
			}
		}

		updateTodayRecord(habits);
		isReady = true;
	});

	async function getCoaching() {
		if (!isReady || isLoadingAI) return; // prevent duplicate calls
		isLoadingAI = true;
		aiCoachMessage = null;
		aiNextSteps = null;
		aiError = '';

		try {
			const data = await requestSecurityAI({
				app: 'secureops-habit-tracker',
				action: 'generate-security-coaching',
				input: {
					completedItems,
					missedItems,
					progressPercent: progress,
					streak,
					weeklyProgress,
					currentDate
				}
			});
			if (data.ok) {
				aiCoachMessage = (data.result.coachMessage as string) || data.summary;
				aiNextSteps = Array.isArray(data.result.nextSteps)
					? (data.result.nextSteps as string[])
					: data.recommendations;
			} else {
				aiError = data.error || data.summary;
			}
		} catch {
			aiError = 'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.';
		} finally {
			isLoadingAI = false;
		}
	}

	function dayLabel(date: string) {
		const d = new Date(`${date}T00:00:00`);
		return d.toLocaleDateString('id-ID', { weekday: 'short' });
	}
</script>

<div class="mx-auto mt-8 flex h-full w-full max-w-5xl flex-col gap-6">
	<MotionShell delay={0}>
		<AppHeader appId="secureops-habit-tracker" />
	</MotionShell>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<MotionShell delay={100} class="flex flex-col gap-6">
			<div class="rounded-2xl border border-border bg-bg-panel p-6 shadow-md">
				<div class="mb-6 flex items-center justify-between border-b border-border pb-2">
					<h3 class="font-semibold text-text-base">Daily Checklist</h3>
					<div class="text-sm font-bold {progress === 100 ? 'text-accent' : 'text-warning'}">{progress}%</div>
				</div>

				<div class="space-y-3">
					{#each habits as habit}
						<button
							type="button"
							onclick={() => toggleHabit(habit.id)}
							class="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-bg-base p-3 text-left transition-colors hover:border-accent/50"
							aria-pressed={habit.checked}
						>
							<span class={`flex h-5 w-5 items-center justify-center rounded border text-[10px] font-black ${habit.checked ? 'border-accent bg-accent text-bg-base' : 'border-border text-transparent'}`}>
								✓
							</span>
							<span class="text-sm {habit.checked ? 'text-text-muted line-through' : 'text-text-base'}">{habit.label}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="rounded-2xl border border-accent/30 bg-bg-panel p-6 shadow-md">
					<div class="mb-1 text-sm tracking-wider text-text-muted uppercase">Current Streak</div>
					<div class="text-4xl font-bold text-accent">{streak} <span class="text-2xl">days</span></div>
				</div>
				<div class="rounded-2xl border border-border bg-bg-panel p-6 shadow-md">
					<div class="mb-3 text-sm tracking-wider text-text-muted uppercase">Weekly Progress</div>
					<div class="grid grid-cols-7 gap-2">
						{#each weeklyProgress as day}
							<div class={`rounded-lg border p-2 text-center text-[10px] ${day.completed ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-bg-base text-text-muted'}`}>
								<div class="font-semibold">{dayLabel(day.date)}</div>
								<div class="mt-2 text-lg font-black">{day.progress}%</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</MotionShell>

		<MotionShell delay={200} class="flex flex-col gap-6">
			<div class="flex flex-1 flex-col rounded-2xl border border-border bg-bg-panel p-6 shadow-md">
				<div class="mb-4 flex items-center justify-between border-b border-border pb-2">
					<h3 class="flex items-center gap-2 font-semibold text-accent">Security Coach AI</h3>
					<button
						onclick={getCoaching}
						disabled={isLoadingAI || progress === 0}
						class="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-bold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
					>
						{isLoadingAI ? 'Menganalisa...' : 'Minta Saran'}
					</button>
				</div>

				<div class="flex-1 overflow-y-auto">
					{#if isLoadingAI}
						<div class="mt-4 animate-pulse space-y-3">
							<div class="h-4 w-3/4 rounded bg-border/50"></div>
							<div class="h-4 w-full rounded bg-border/50"></div>
							<div class="h-4 w-5/6 rounded bg-border/50"></div>
						</div>
					{:else if aiError}
						<div class="rounded-xl border border-critical/20 bg-critical/10 p-4 text-sm text-critical">{aiError}</div>
					{:else if aiCoachMessage}
						<div class="mb-6 rounded border border-accent/20 bg-accent/5 p-4 text-sm leading-relaxed">
							{aiCoachMessage}
						</div>

						{#if aiNextSteps && aiNextSteps.length > 0}
							<div>
								<div class="mb-2 text-xs font-bold text-text-muted uppercase">Next Steps & Improvements</div>
								<ul class="space-y-2">
									{#each aiNextSteps as step}
										<li class="flex items-start text-sm">
											<span class="mr-2 text-warning">▸</span>
											<span>{step}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					{:else}
						<div class="flex flex-col items-center py-12 text-center text-sm text-text-muted">
							<span class="mb-2 text-4xl opacity-50">🤖</span>
							Klik 'Minta Saran' untuk mendapatkan review kebiasaan harian Anda dari Security Coach AI.
						</div>
					{/if}
				</div>
			</div>
		</MotionShell>
	</div>

	<AppTutorial
		purpose="Membangun kebiasaan operasi security harian yang konsisten dan mudah dilacak."
		howToUse="Centang checklist harian, pantau progress dan streak, lalu lihat grid mingguan untuk kebiasaan yang sudah selesai."
		aiAction="Klik Minta Saran untuk mendapatkan coaching dan improvement plan dari AI."
		output="Progress harian, streak, grid mingguan, dan rekomendasi kebiasaan berikutnya."
		securityNote="Security hygiene yang konsisten mengurangi risiko operasional dan membantu disiplin defensif."
	/>
</div>
