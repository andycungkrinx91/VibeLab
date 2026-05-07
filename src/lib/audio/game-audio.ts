const STORAGE_KEY = 'vibelab-threat-runner-sound-enabled';

let audioContext: AudioContext | null = null;
let soundEnabled = true;
let didLoadPreference = false;

function isBrowser() {
	return typeof window !== 'undefined';
}

function ensurePreferenceLoaded(defaultValue = true) {
	if (!isBrowser() || didLoadPreference) return soundEnabled;

	const stored = window.localStorage.getItem(STORAGE_KEY);
	soundEnabled = stored === null ? defaultValue : stored === 'true';
	didLoadPreference = true;
	return soundEnabled;
}

function persistPreference() {
	if (!isBrowser()) return;
	window.localStorage.setItem(STORAGE_KEY, String(soundEnabled));
}

function getContext() {
	if (!isBrowser()) return null;

	try {
		const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!Ctor) return null;

		if (!audioContext) {
			audioContext = new Ctor();
		}

		if (audioContext.state === 'suspended') {
			audioContext.resume().catch(() => undefined);
		}

		return audioContext;
	} catch {
		return null;
	}
}

function playTone({
	frequency,
	duration,
	gain = 0.04,
	type = 'sine',
	startOffset = 0,
	endFrequency,
	frequencyRamp = 0.02
}: {
	frequency: number;
	duration: number;
	gain?: number;
	type?: OscillatorType;
	startOffset?: number;
	endFrequency?: number;
	frequencyRamp?: number;
}) {
	if (!ensurePreferenceLoaded() || !soundEnabled) return;

	const ctx = getContext();
	if (!ctx) return;

	try {
		const now = ctx.currentTime + startOffset;
		const oscillator = ctx.createOscillator();
		const envelope = ctx.createGain();
		oscillator.type = type;
		oscillator.frequency.setValueAtTime(frequency, now);

		if (typeof endFrequency === 'number') {
			oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + frequencyRamp);
		}

		envelope.gain.setValueAtTime(0.0001, now);
		envelope.gain.exponentialRampToValueAtTime(gain, now + 0.01);
		envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

		oscillator.connect(envelope);
		envelope.connect(ctx.destination);
		oscillator.start(now);
		oscillator.stop(now + duration + 0.03);
	} catch {
		// Fail silently; gameplay must continue without sound.
	}
}

function playPattern(steps: Array<{ frequency: number; duration: number; gain?: number; type?: OscillatorType; startOffset?: number; endFrequency?: number; frequencyRamp?: number }>) {
	steps.forEach((step) => playTone(step));
}

export function loadSoundEnabled(defaultValue = true) {
	return ensurePreferenceLoaded(defaultValue);
}

export function getSoundEnabled() {
	return soundEnabled;
}

export function initAudio() {
	ensurePreferenceLoaded();
	return getContext();
}

export function setSoundEnabled(enabled: boolean) {
	soundEnabled = enabled;
	didLoadPreference = true;
	persistPreference();

	if (enabled) {
		initAudio();
	} else if (audioContext?.state === 'running') {
		audioContext.suspend().catch(() => undefined);
	}

	return soundEnabled;
}

export function playStart() {
	playPattern([
		{ frequency: 220, duration: 0.08, gain: 0.03, type: 'triangle' },
		{ frequency: 330, duration: 0.08, gain: 0.035, type: 'triangle', startOffset: 0.09 },
		{ frequency: 440, duration: 0.12, gain: 0.04, type: 'sine', startOffset: 0.18 }
	]);
}

export function playShoot() {
	playTone({ frequency: 620, duration: 0.06, gain: 0.035, type: 'square' });
}

export function playHit() {
	playTone({ frequency: 920, duration: 0.07, gain: 0.035, type: 'triangle', endFrequency: 520 });
}

export function playCollect() {
	playPattern([
		{ frequency: 760, duration: 0.06, gain: 0.03, type: 'triangle' },
		{ frequency: 1040, duration: 0.07, gain: 0.032, type: 'triangle', startOffset: 0.07 }
	]);
}

export function playDamage() {
	playTone({ frequency: 180, duration: 0.12, gain: 0.04, type: 'sawtooth', endFrequency: 120 });
}

export function playGameOver() {
	playPattern([
		{ frequency: 280, duration: 0.11, gain: 0.04, type: 'sawtooth' },
		{ frequency: 220, duration: 0.12, gain: 0.038, type: 'sawtooth', startOffset: 0.12 },
		{ frequency: 160, duration: 0.18, gain: 0.04, type: 'sine', startOffset: 0.25, endFrequency: 110 }
	]);
}

export function playClick() {
	playTone({ frequency: 420, duration: 0.04, gain: 0.02, type: 'triangle' });
}
