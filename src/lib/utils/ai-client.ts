export const DEFAULT_SECURITY_AI_ERROR =
	'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.';

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
		typeof data.summary === 'string' && data.summary.trim()
			? data.summary.trim()
			: pickTextCandidate(result);
	const errorCandidate =
		typeof data.error === 'string' && data.error.trim()
			? data.error.trim()
			: ok
				? ''
				: summaryCandidate || DEFAULT_SECURITY_AI_ERROR;

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

		if (!response.ok && normalized.ok) {
			return {
				...normalized,
				ok: false,
				error: normalized.error || normalized.summary || DEFAULT_SECURITY_AI_ERROR
			};
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
