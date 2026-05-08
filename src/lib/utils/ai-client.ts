export const DEFAULT_SECURITY_AI_ERROR = 'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.';

const CACHE_TTL_MS = 10 * 60 * 1000;
const COOLDOWN_MS = 10 * 1000;
const CACHE_PREFIX = 'vibesec-ai-cache';
const COOLDOWN_PREFIX = 'vibesec-ai-cooldown';
const LAST_PROVIDER_KEY = 'vibesec-ai-last-provider';
const CACHE_REUSE_MESSAGE = 'Untuk menghemat kuota AI, hasil sebelumnya digunakan kembali.';

export type SecurityAIClientResponse = {
	ok: boolean;
	provider?: string;
	providerLabel?: string;
	model?: string;
	app: string;
	action: string;
	result: Record<string, unknown>;
	summary: string;
	recommendations: string[];
	warnings: string[];
	error?: string;
};

type CacheEntry = {
	timestamp: number;
	response: SecurityAIClientResponse;
};

function safeStorage(storage: 'localStorage' | 'sessionStorage') {
	if (typeof window === 'undefined') return null;
	try {
		return window[storage];
	} catch {
		return null;
	}
}

function getStoredValue(storage: 'localStorage' | 'sessionStorage', key: string) {
	const bucket = safeStorage(storage);
	if (!bucket) return null;
	try {
		return bucket.getItem(key);
	} catch {
		return null;
 	}
}

function setStoredValue(storage: 'localStorage' | 'sessionStorage', key: string, value: string) {
	const bucket = safeStorage(storage);
	if (!bucket) return;
	try {
		bucket.setItem(key, value);
	} catch {
		// ignore storage failures
	}
}

function stableStringify(value: unknown): string {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value);
	}

	if (Array.isArray(value)) {
		return `[${value.map((item) => stableStringify(item)).join(',')}]`;
	}

	const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
	return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}

function hashString(value: string) {
	let hash = 0x811c9dc5;
	for (let i = 0; i < value.length; i += 1) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(36);
}

function getKnownProviderId() {
	return getStoredValue('localStorage', LAST_PROVIDER_KEY) || 'unknown';
}

function rememberProviderId(provider?: string) {
	if (provider) {
		setStoredValue('localStorage', LAST_PROVIDER_KEY, provider);
	}
}

function buildCacheKey(provider: string, app: string, action: string, input: unknown) {
	return `${CACHE_PREFIX}:${provider}:${app}:${action}:${hashString(stableStringify(input))}`;
}

function readCacheEntry(cacheKey: string): CacheEntry | null {
	const raw = getStoredValue('localStorage', cacheKey);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as CacheEntry;
		if (!parsed || typeof parsed.timestamp !== 'number' || !parsed.response) return null;
		return parsed;
	} catch {
		return null;
	}
}

function writeCacheEntry(cacheKey: string, response: SecurityAIClientResponse) {
	setStoredValue('localStorage', cacheKey, JSON.stringify({ timestamp: Date.now(), response } satisfies CacheEntry));
}

function getCooldownKey(provider: string, app: string, action: string) {
	return `${COOLDOWN_PREFIX}:${provider}:${app}:${action}`;
}

function readCooldownTs(cooldownKey: string) {
	const raw = getStoredValue('sessionStorage', cooldownKey);
	const parsed = raw ? Number(raw) : NaN;
	return Number.isFinite(parsed) ? parsed : 0;
}

function writeCooldownTs(cooldownKey: string, timestamp: number) {
	setStoredValue('sessionStorage', cooldownKey, String(timestamp));
}

function addCacheReuseMessage(response: SecurityAIClientResponse): SecurityAIClientResponse {
	const warnings = response.warnings.includes(CACHE_REUSE_MESSAGE)
		? response.warnings
		: [CACHE_REUSE_MESSAGE, ...response.warnings];

	const summary = response.summary.startsWith(CACHE_REUSE_MESSAGE)
		? response.summary
		: `${CACHE_REUSE_MESSAGE}\n${response.summary}`.trim();

	return { ...response, summary, warnings };
}

function buildCooldownResponse(app: string, action: string): SecurityAIClientResponse {
	return {
		ok: false,
		app,
		action,
		result: {},
		summary: 'Tunggu 10 detik sebelum mencoba lagi untuk menghemat kuota AI.',
		recommendations: ['Coba lagi setelah cooldown selesai.', 'Gunakan hasil sebelumnya bila input sama.'],
		warnings: [],
		error: 'Tunggu 10 detik sebelum mencoba lagi untuk menghemat kuota AI.'
	};
}

function toStringArray(value: unknown) {
	return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toResultObject(value: unknown) {
	return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function pickTextCandidate(result: Record<string, unknown>) {
	const candidates = [
		result.summary,
		result.explanation,
		result.message,
		result.report,
		result.bio,
		result.review,
		result.coachMessage,
		result.atsSummary,
		result.slackUpdate,
		result.status
	];

	for (const candidate of candidates) {
		if (typeof candidate === 'string' && candidate.trim()) {
			return candidate.trim();
		}
	}

	return '';
}

function normalizeResponse(payload: unknown, app: string, action: string): SecurityAIClientResponse {
	const data = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
	const ok = Boolean(data.ok);
	const result = toResultObject(data.result);
	const recommendations = toStringArray(data.recommendations);
	const warnings = toStringArray(data.warnings);
	const summaryCandidate =
		typeof data.summary === 'string' && data.summary.trim() ? data.summary.trim() : pickTextCandidate(result);
	const errorCandidate =
		typeof data.error === 'string' && data.error.trim() ? data.error.trim() : ok ? '' : summaryCandidate || DEFAULT_SECURITY_AI_ERROR;

	return {
		ok,
		provider: typeof data.provider === 'string' ? data.provider : undefined,
		providerLabel: typeof data.providerLabel === 'string' ? data.providerLabel : undefined,
		model: typeof data.model === 'string' ? data.model : undefined,
		app: typeof data.app === 'string' && data.app ? data.app : app,
		action: typeof data.action === 'string' && data.action ? data.action : action,
		result,
		summary: summaryCandidate || (ok ? 'AI selesai diproses.' : DEFAULT_SECURITY_AI_ERROR),
		recommendations,
		warnings,
		...(errorCandidate ? { error: errorCandidate } : {})
	};
}

export async function requestSecurityAI(params: {
	app: string;
	action: string;
	input: unknown;
}): Promise<SecurityAIClientResponse> {
	const { app, action, input } = params;
	const provider = getKnownProviderId();
	const cacheKey = buildCacheKey(provider, app, action, input);
	const cachedEntry = readCacheEntry(cacheKey);
	if (cachedEntry && Date.now() - cachedEntry.timestamp <= CACHE_TTL_MS) {
		rememberProviderId(cachedEntry.response.provider);
		return addCacheReuseMessage(cachedEntry.response);
	}

	const cooldownKey = getCooldownKey(provider, app, action);
	const lastCallTs = readCooldownTs(cooldownKey);
	if (lastCallTs && Date.now() - lastCallTs < COOLDOWN_MS) {
		return buildCooldownResponse(app, action);
	}

	writeCooldownTs(cooldownKey, Date.now());

	try {
		const response = await fetch('/api/ai/security', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ app, action, input })
		});

		const rawText = await response.text();
		if (!rawText.trim()) {
			return {
				ok: false,
				app,
				action,
				result: {},
				summary: DEFAULT_SECURITY_AI_ERROR,
				recommendations: ['Coba lagi beberapa saat.'],
				warnings: [],
				error: DEFAULT_SECURITY_AI_ERROR
			};
		}

		let parsed: unknown = null;
		try {
			parsed = JSON.parse(rawText);
		} catch {
			return {
				ok: false,
				app,
				action,
				result: {},
				summary: DEFAULT_SECURITY_AI_ERROR,
				recommendations: ['Coba lagi beberapa saat.'],
				warnings: [],
				error: response.ok ? DEFAULT_SECURITY_AI_ERROR : `Server mengembalikan respons non-JSON (${response.status}).`
			};
		}

		const normalized = normalizeResponse(parsed, app, action);
		rememberProviderId(normalized.provider);

		if (!response.ok && normalized.ok) {
			return {
				...normalized,
				ok: false,
				error: normalized.error || normalized.summary || DEFAULT_SECURITY_AI_ERROR
			};
		}

		if (normalized.ok) {
			writeCacheEntry(buildCacheKey(normalized.provider || provider, app, action, input), normalized);
		}

		return normalized;
	} catch {
		return {
			ok: false,
			app,
			action,
			result: {},
			summary: DEFAULT_SECURITY_AI_ERROR,
			recommendations: ['Coba lagi beberapa saat.', 'Periksa konfigurasi provider AI di server.'],
			warnings: [],
			error: DEFAULT_SECURITY_AI_ERROR
		};
	}
}
