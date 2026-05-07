<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import MotionShell from '$lib/components/MotionShell.svelte';
import AppPageShell from '$lib/components/AppPageShell.svelte';
import AppTutorial from '$lib/components/AppTutorial.svelte';
	import {
		initAudio,
		loadSoundEnabled,
		playCollect,
		playDamage,
		playGameOver,
		playHit,
		playShoot,
		playStart,
		setSoundEnabled
	} from '$lib/audio/game-audio';

	// Game State
	let score = $state(0);
	let health = $state(100);
	let timer = $state(60);
	let threatLevel = $state('Low');
	let isPlaying = $state(false);
	let isGameOver = $state(false);
	let highScore = $state(0);
	let soundEnabled = $state(true);

	// AI State
	let mission = $state<any>(null);
	let incidentSummary = $state<any>(null);
	let isLoadingAI = $state(false);
	let aiError = $state('');

	// Game Objects
	type Entity = { id: number; type: 'patch' | 'malware'; x: number; y: number; speed: number };
	type Projectile = { id: number; x: number; y: number; speed: number };
	let entities = $state<Entity[]>([]);
	let projectiles = $state<Projectile[]>([]);
	let playerX = $state(50);
	let gameAreaRef: HTMLDivElement;

	let animationId: number;
	let lastTime = 0;
	let spawnTimer = 0;
	let nextId = 0;
	let nextProjectileId = 0;
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let removeKeyboardListener: (() => void) | null = null;

	onMount(() => {
		soundEnabled = loadSoundEnabled(true);

		const stored = localStorage.getItem('vibelab-threat-runner-highscore');
		if (stored) highScore = parseInt(stored, 10);
		fetchMission();

		const handleKeydown = (event: KeyboardEvent) => {
			if (!isPlaying) return;

			if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
				event.preventDefault();
				movePlayer(-6);
				return;
			}

			if (event.code === 'ArrowRight' || event.code === 'KeyD') {
				event.preventDefault();
				movePlayer(6);
				return;
			}

			if (event.code === 'Space') {
				event.preventDefault();
				shootProjectile();
			}
		};

		window.addEventListener('keydown', handleKeydown);
		removeKeyboardListener = () => window.removeEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		clearGameLoop();
		removeKeyboardListener?.();
	});

	async function fetchMission() {
		isLoadingAI = true;
		aiError = '';
		try {
			const res = await fetch('/api/ai/security', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					app: 'threat-runner',
					action: 'generate-threat-mission',
					input: { difficulty: 'Normal', threatLevel: 'Elevated', targetSystem: 'Mainframe Core' }
				})
			});
			const data = await res.json();
			if (data.ok) {
				mission = data;
			} else {
				aiError = data.summary || data.error;
			}
		} catch (e) {
			aiError = 'Koneksi ke AI gagal.';
		} finally {
			isLoadingAI = false;
		}
	}

	async function fetchSummary() {
		isLoadingAI = true;
		try {
			const res = await fetch('/api/ai/security', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					app: 'threat-runner',
					action: 'summarize-incident',
					input: { score, health, duration: 60 - timer, finalThreatLevel: threatLevel }
				})
			});
			const data = await res.json();
			if (data.ok) {
				incidentSummary = data;
			} else {
				incidentSummary = data;
			}
		} catch (e) {
			incidentSummary = {
				ok: false,
				summary: 'Fitur AI gagal sementara, tetapi permainan tetap bisa digunakan dengan data lokal.',
				result: { status: 'Tinjauan', remediationChecklist: [] }
			};
		} finally {
			isLoadingAI = false;
		}
	}

	function clearGameLoop() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}

		if (animationId) {
			cancelAnimationFrame(animationId);
		}
	}

	function resetGameState() {
		score = 0;
		health = 100;
		timer = 60;
		threatLevel = 'Low';
		entities = [];
		projectiles = [];
		playerX = 50;
		incidentSummary = null;
	}

	function startGame() {
		clearGameLoop();
		initAudio();
		playStart();
		resetGameState();
		isPlaying = true;
		isGameOver = false;
		lastTime = performance.now();
		animationId = requestAnimationFrame(gameLoop);

		timerInterval = setInterval(() => {
			if (!isPlaying) return;
			timer -= 1;
			if (timer <= 0 || health <= 0) {
				endGame();
				return;
			}
			if (score > 10) threatLevel = 'Medium';
			if (score > 30) threatLevel = 'High';
			if (score > 50) threatLevel = 'Critical';
		}, 1000);
	}

	function endGame() {
		if (isGameOver) return;
		isPlaying = false;
		isGameOver = true;
		clearGameLoop();
		playGameOver();
		if (score > highScore) {
			highScore = score;
			if (typeof window !== 'undefined') {
				localStorage.setItem('vibelab-threat-runner-highscore', highScore.toString());
			}
		}
		fetchSummary();
	}

	function updateThreatLevel() {
		if (score > 50) threatLevel = 'Critical';
		else if (score > 30) threatLevel = 'High';
		else if (score > 10) threatLevel = 'Medium';
		else threatLevel = 'Low';
	}

	function movePlayer(delta: number) {
		playerX = Math.min(92, Math.max(8, playerX + delta));
	}

	function shootProjectile() {
		if (!isPlaying) return;
		initAudio();
		playShoot();
		projectiles = [
			...projectiles,
			{ id: nextProjectileId++, x: playerX, y: 84, speed: 2.2 }
		];
	}

	function applyDamage(amount: number) {
		health = Math.max(0, health - amount);
		playDamage();
		if (health <= 0) {
			endGame();
		}
	}

	function gameLoop(time: number) {
		if (!isPlaying) return;
		const delta = time - lastTime;
		lastTime = time;

		spawnTimer += delta;
		if (spawnTimer > (threatLevel === 'Critical' ? 400 : threatLevel === 'High' ? 600 : 1000)) {
			spawnEntity();
			spawnTimer = 0;
		}

		const movedProjectiles = projectiles
			.map((projectile) => ({ ...projectile, y: projectile.y - projectile.speed * (delta / 16) }))
			.filter((projectile) => projectile.y > -10);

		let movedEntities: Entity[] = [];
		for (const entity of entities) {
			const nextY = entity.y + entity.speed * (delta / 16);
			if (nextY < 100) {
				movedEntities.push({ ...entity, y: nextY });
			} else if (entity.type === 'patch') {
				applyDamage(5);
			} else {
				applyDamage(20);
			}
		}

		const remainingProjectiles: Projectile[] = [];
		for (const projectile of movedProjectiles) {
			const hitIndex = movedEntities.findIndex((entity) => {
				const dx = Math.abs(projectile.x - entity.x);
				const dy = Math.abs(projectile.y - entity.y);
				return dx < 4.5 && dy < 6;
			});

			if (hitIndex >= 0) {
				const hit = movedEntities[hitIndex];
				movedEntities = movedEntities.filter((_, index) => index !== hitIndex);
				if (hit.type === 'malware') {
					score += 10;
					playHit();
				} else {
					score += 5;
					playCollect();
				}
				updateThreatLevel();
			} else {
				remainingProjectiles.push(projectile);
			}
		}

		entities = movedEntities;
		projectiles = remainingProjectiles;

		if (health <= 0) {
			endGame();
			return;
		}

		updateThreatLevel();

		animationId = requestAnimationFrame(gameLoop);
	}

	function spawnEntity() {
		const isMalware = Math.random() > 0.4;
		entities = [
			...entities,
			{
				id: nextId++,
				type: isMalware ? 'malware' : 'patch',
				x: Math.random() * 90, // Percentage
				y: 0,
				speed: Math.random() * 0.5 + 0.5 + (threatLevel === 'Critical' ? 1 : 0)
			}
		];
	}

	function catchEntity(id: number) {
		const entity = entities.find((e) => e.id === id);
		if (!entity) return;

		if (entity.type === 'patch') {
			score += 5;
			playCollect();
		} else {
			score += 10;
			playHit();
		}
		entities = entities.filter((e) => e.id !== id);
		updateThreatLevel();
	}

	function toggleSound() {
		soundEnabled = !soundEnabled;
		setSoundEnabled(soundEnabled);
		if (soundEnabled) {
			initAudio();
		}
	}
</script>

<AppPageShell appId="threat-runner">
	<div class="mb-4 flex items-center justify-between">
		<div class="text-right">
			<div class="text-sm text-text-muted">High Score</div>
			<div class="text-2xl font-bold text-accent-secondary">{highScore}</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Game Area -->
		<MotionShell delay={100} class="h-[500px] lg:col-span-2">
			<div
				bind:this={gameAreaRef}
				class="electric-border electric-border-active relative h-full w-full overflow-hidden rounded-lg border border-border bg-bg-panel shadow-[0_0_20px_var(--color-accent-glow)]"
			>
				{#if !isPlaying && !isGameOver}
					<div
						class="absolute inset-0 flex flex-col items-center justify-center bg-bg-base/80 p-6 backdrop-blur-sm"
					>
						{#if isLoadingAI && !mission}
							<div class="animate-pulse text-accent">Menghubungi AI Security...</div>
						{:else if mission}
							<div
								class="mb-6 max-w-md rounded border border-accent/50 bg-bg-panel p-4 text-center shadow-lg"
							>
								<h2 class="mb-2 text-xl font-bold text-accent">
									{mission.result.missionTitle || 'Misi Pertahanan'}
								</h2>
								<p class="mb-4 text-sm text-text-muted">{mission.summary}</p>
								<ul class="mb-4 text-left text-sm text-text-base">
									{#each mission.result.objectives || [] as obj}
										<li
											class="flex items-center before:mr-2 before:text-accent before:content-['>']"
										>
											{obj}
										</li>
									{/each}
								</ul>
								<button
									onclick={startGame}
									class="btn-shimmer w-full rounded border border-accent bg-accent/20 px-6 py-3 font-bold text-accent transition-colors hover:bg-accent hover:text-bg-base"
								>
									INITIATE DEFENSE
								</button>
							</div>
						{/if}
						{#if aiError}
							<div class="text-sm text-critical">{aiError}</div>
							<button onclick={startGame} class="mt-4 text-accent underline">Lewati & Mulai</button>
						{/if}
					</div>
				{:else if isGameOver}
					<div
						class="absolute inset-0 flex flex-col items-center justify-center bg-bg-base/90 p-6 backdrop-blur-md"
					>
						<h2 class="mb-2 text-3xl font-bold text-critical">SYSTEM COMPROMISED</h2>
						<div class="mb-6 text-xl">Final Score: <span class="text-accent">{score}</span></div>

						{#if isLoadingAI}
							<div class="animate-pulse text-text-muted">Menyusun Incident Report...</div>
						{:else if incidentSummary}
							<div class="mb-6 w-full max-w-lg rounded border border-border bg-bg-panel p-4">
								<div class="mb-2 flex items-center justify-between">
									<div class="font-bold text-accent">Incident Summary</div>
									<div
										class="rounded border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs text-warning"
									>
										{incidentSummary.result.status || 'Tinjauan'}
									</div>
								</div>
								<p class="mb-4 text-sm text-text-base">{incidentSummary.summary}</p>
								<div class="text-xs font-bold text-text-muted">Remediation Checklist:</div>
								<ul class="mt-2 space-y-1 text-sm">
									{#each incidentSummary.result.remediationChecklist || [] as item}
										<li class="flex items-start">
											<span class="mr-2 text-accent-secondary">[ ]</span>
											{item}
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						<button
							onclick={startGame}
							class="btn-shimmer rounded border border-accent bg-transparent px-6 py-2 text-accent transition-colors hover:bg-accent hover:text-bg-base"
						>
							REBOOT SYSTEM
						</button>
					</div>
				{/if}

				<!-- HUD -->
				{#if isPlaying}
					<div
						class="absolute top-0 left-0 z-10 flex w-full items-center justify-between bg-gradient-to-b from-bg-base to-transparent p-4"
					>
						<div class="flex gap-4 font-mono">
							<div>
								<div class="text-xs text-text-muted">SCORE</div>
								<div class="text-lg font-bold text-accent">{score}</div>
							</div>
							<div>
								<div class="text-xs text-text-muted">HEALTH</div>
								<div
									class="text-lg font-bold {health < 30
										? 'animate-pulse text-critical'
										: 'text-accent-secondary'}"
								>
									{health}%
								</div>
							</div>
						</div>
						<div class="flex gap-4 text-right font-mono">
							<div>
								<div class="text-xs text-text-muted">THREAT</div>
								<div
									class="text-lg font-bold {threatLevel === 'Critical'
										? 'text-critical'
										: threatLevel === 'High'
											? 'text-warning'
											: 'text-accent'}"
								>
									{threatLevel}
								</div>
							</div>
							<div>
								<div class="text-xs text-text-muted">TIMER</div>
								<div class="text-lg font-bold text-text-base">{timer}s</div>
							</div>
						</div>
					</div>

					<!-- Health Bar -->
					<div class="absolute bottom-0 left-0 h-1 w-full bg-bg-base">
						<div
							class="h-full bg-accent transition-all duration-300"
							style="width: {health}%"
						></div>
					</div>

					{#each projectiles as projectile (projectile.id)}
						<div
							class="absolute z-20 h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent-glow)]"
							style="left: {projectile.x}%; top: {projectile.y}%; transform: translate(-50%, -50%);"
						></div>
					{/each}

					<div
						class="absolute z-20 flex items-center justify-center rounded-full border border-accent/40 bg-bg-base/80 px-3 py-2 text-lg shadow-[0_0_14px_var(--color-accent-glow)]"
						style="left: {playerX}%; bottom: 1rem; transform: translateX(-50%);"
						aria-label="Cyber defender"
					>
						🛡️
					</div>

					<!-- Entities -->
					{#each entities as entity (entity.id)}
						<button
							class="absolute flex h-10 w-10 items-center justify-center rounded-full border shadow-lg transition-transform hover:scale-110 focus:outline-none"
							style="left: {entity.x}%; top: {entity.y}%; border-color: var(--color-{entity.type ===
							'malware'
								? 'critical'
								: 'accent'}); background-color: var(--color-{entity.type === 'malware'
								? 'critical'
								: 'accent'})20;"
							onclick={() => catchEntity(entity.id)}
						>
							{#if entity.type === 'malware'}
								<span class="text-critical">☠</span>
							{:else}
								<span class="text-accent">★</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</MotionShell>

		<!-- Right Panel -->
		<MotionShell delay={200} class="flex h-full flex-col gap-6">
			<div class="electric-border flex h-full flex-col rounded-lg border border-border bg-bg-panel p-6 shadow-md">
				<div class="mb-4 rounded-lg border border-border/60 bg-bg-base/70 p-4">
					<div class="mb-3 flex items-start justify-between gap-3">
						<div>
							<div class="text-xs font-semibold tracking-[0.22em] text-text-muted uppercase">
								Kontrol
							</div>
							<div class="mt-1 text-sm font-semibold text-text-base">
								A / ← kiri • D / → kanan • Space tembak
							</div>
						</div>
						<button
							type="button"
							aria-pressed={soundEnabled}
							onclick={toggleSound}
							class="rounded-full border px-3 py-1 text-xs font-semibold transition-colors {soundEnabled
								? 'border-accent/30 bg-accent/10 text-accent'
								: 'border-border bg-bg-panel text-text-muted'}"
						>
							Suara: {soundEnabled ? 'Aktif' : 'Mati'}
						</button>
					</div>
					<ul class="grid grid-cols-1 gap-1 text-xs text-text-muted sm:grid-cols-2">
						<li>• Ambil bintang / patch token untuk skor</li>
						<li>• Hancurkan threat untuk skor tambahan</li>
						<li>• Hindari tabrakan dengan threat</li>
						<li>• Audio hanya aktif setelah interaksi</li>
					</ul>
				</div>

				<h3 class="mb-4 text-lg font-semibold text-text-base">System Logs</h3>
				<div
					class="flex-1 overflow-y-auto rounded border border-border/50 bg-bg-base p-3 font-mono text-xs"
				>
					{#if isLoadingAI}
						<div class="animate-pulse text-text-muted">> Menghubungi AI...</div>
					{/if}
					{#if mission && !isPlaying && !isGameOver}
						<div class="text-accent">> Misi Diterima.</div>
						<div class="text-text-muted">> Standby...</div>
					{/if}
					{#if isPlaying}
						<div class="text-accent">> Pertahanan Aktif.</div>
						{#if threatLevel === 'Critical'}
							<div class="animate-pulse text-critical">> PERINGATAN: Serangan Masif!</div>
						{/if}
					{/if}
					{#if isGameOver}
						<div class="text-critical">> Core Terkompromi.</div>
						{#if incidentSummary}
							<div class="text-accent-secondary">> Analisis Selesai.</div>
						{/if}
					{/if}
				</div>
			</div>
		</MotionShell>
	</div>

	<AppTutorial
		purpose="Mensimulasikan pertahanan cyber arcade dengan misi, skor, dan incident report."
		howToUse="Gerakkan defender, tembak threat, ambil patch token/bintang, dan jaga health agar tidak turun."
		aiAction="Generate mission untuk briefing awal dan Summarize Incident untuk laporan akhir."
		output="Skor, high score, laporan insiden, dan checklist remediation defensif."
		securityNote="Fokus pada deteksi, respons, dan remediation tanpa instruksi ofensif."
	/>
</AppPageShell>
