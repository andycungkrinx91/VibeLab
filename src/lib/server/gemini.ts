import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	generateWithOpenAIResponses,
	getOpenAIProviderHealth as getOfficialOpenAIProviderHealth
} from '$lib/server/ai/openai-provider';

const SYSTEM_INSTRUCTION =
	'Jawab selalu dalam Bahasa Indonesia yang jelas, ringkas, dan praktis. Fokus pada defensive security: mitigasi, patching, hardening, monitoring, incident response, edukasi, stakeholder communication, dan pengembangan portfolio/CV defensif. Jangan memberikan instruksi eksploitasi ofensif, malware, payload, bypass, evasion, persistence, credential theft, atau penyalahgunaan sistem.';

const RESPONSE_SCHEMA_INSTRUCTION = `
Berikan respons dalam format JSON dengan struktur berikut:
{
  "result": { ... },
  "summary": "Ringkasan penjelasan dalam 1-2 kalimat (Bahasa Indonesia)",
  "recommendations": ["Rekomendasi 1", "Rekomendasi 2", ...],
  "warnings": ["Peringatan opsional 1", ...]
}

Jangan bungkus dengan markdown code block.
`;

const DEFAULT_MAX_OUTPUT_TOKENS = 700;
const DEFAULT_OPENAI_COMPAT_MAX_OUTPUT_TOKENS = 4096;
const DEFAULT_REQUEST_TIMEOUT_MS = 25000;
const CONCISE_PROMPT_MODE = 'concise';

const FALLBACK_GEMINI_TEXT_MODEL = 'gemini-2.5-flash';
const FALLBACK_GEMINI_CHEAP_MODEL = 'gemini-2.5-flash-lite';
const FALLBACK_OPENAI_TEXT_MODEL = 'gpt-5.5';
const FALLBACK_OPENAI_CHEAP_MODEL = 'gpt-5.5-mini';
const FALLBACK_OPENAI_BASE_URL = 'https://api.openai.com/v1';

export type AIProviderId = 'gemini' | 'openai' | 'openai-compatible';
export type AIProviderSelection = AIProviderId | 'invalid';

type LocalEnvMap = Record<string, string>;

export type AIProviderHealth = {
	configured: boolean;
	keyLength: number;
	textModel: string;
	cheapModel: string;
	providerLabel?: string;
	baseUrl?: string;
};

export type AIHealth = {
	ok: boolean;
	activeProvider: AIProviderSelection;
	providerLabel: string;
	providers: {
		gemini: AIProviderHealth;
		openai: AIProviderHealth;
		openaiCompatible: AIProviderHealth;
	};
};

export interface SecurityAIResponse {
	ok: boolean;
	provider: AIProviderSelection;
	providerLabel: string;
	model: string;
	app: string;
	action: string;
	result: any;
	summary: string;
	recommendations: string[];
	warnings?: string[];
	error?: string;
}

let geminiClient: GoogleGenAI | null = null;
let geminiClientKey = '';
const localEnvOverrides = loadLocalEnvOverrides();

function readEnvValue(name: string) {
	const runtimeValue = (env as Record<string, string | undefined>)[name];
	if (typeof runtimeValue === 'string' && runtimeValue.trim()) {
		return runtimeValue.trim();
	}

	return (localEnvOverrides[name] || '').trim();
}

function parseDotenvFile(content: string) {
	const values: LocalEnvMap = {};

	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const equalsIndex = trimmed.indexOf('=');
		if (equalsIndex === -1) continue;

		const key = trimmed.slice(0, equalsIndex).trim();
		let value = trimmed.slice(equalsIndex + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		values[key] = value;
	}

	return values;
}

function loadLocalEnvOverrides() {
	const candidates = ['.env.local', '.env'];
	const merged: LocalEnvMap = {};

	for (const fileName of candidates) {
		const filePath = resolve(process.cwd(), fileName);
		if (!existsSync(filePath)) continue;

		try {
			Object.assign(merged, parseDotenvFile(readFileSync(filePath, 'utf8')));
		} catch {
			// ignore unreadable local dotenv files
		}
	}

	return merged;
}

function stripWhitespace(value: string) {
	return value.trim();
}

function getIntEnvValue(name: string, fallback: number) {
	const value = Number(readEnvValue(name));
	return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getMaxOutputTokens() {
	return getIntEnvValue('AI_MAX_OUTPUT_TOKENS', DEFAULT_MAX_OUTPUT_TOKENS);
}

function getOpenAICompatibleMaxOutputTokens() {
	return getIntEnvValue('OPENAI_COMPAT_MAX_OUTPUT_TOKENS', DEFAULT_OPENAI_COMPAT_MAX_OUTPUT_TOKENS);
}

function getRequestTimeoutMs() {
	return getIntEnvValue('AI_REQUEST_TIMEOUT_MS', DEFAULT_REQUEST_TIMEOUT_MS);
}

function isConcisePromptMode() {
	return readEnvValue('AI_PROMPT_MODE').toLowerCase() === CONCISE_PROMPT_MODE;
}

function buildPromptModeInstruction() {
	if (!isConcisePromptMode()) {
		return '';
	}

	return 'Mode ringkas aktif: jawab sepadat mungkin, hindari pengulangan, prioritaskan hasil inti, dan batasi rekomendasi ke 3 poin paling penting.';
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
	if (!timeoutMs) {
		return fetch(input, init);
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		return await fetch(input, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

function isThinkingDisabled() {
	return readEnvValue('AI_DISABLE_THINKING').toLowerCase() === 'true';
}

function coerceProviderText(value: unknown): string {
	if (typeof value === 'string') {
		return value.trim();
	}

	if (Array.isArray(value)) {
		return value.map((item) => coerceProviderText(item)).filter(Boolean).join('\n').trim();
	}

	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;
		if (typeof record.text === 'string') return record.text.trim();
		if ('content' in record) return coerceProviderText(record.content);
		if ('message' in record) return coerceProviderText(record.message);
		if ('output_text' in record) return coerceProviderText(record.output_text);
		try {
			return JSON.stringify(value);
		} catch {
			return '';
		}
	}

	return '';
}

function getProviderId(): AIProviderSelection {
	const provider = readEnvValue('AI_PROVIDER').toLowerCase();
	if (provider === 'gemini' || provider === 'openai' || provider === 'openai-compatible') {
		return provider;
	}

	return 'invalid';
}

function getProviderLabel(provider: AIProviderId | 'invalid') {
	if (provider === 'openai') {
		return 'OpenAI';
	}

	if (provider === 'openai-compatible') {
		return readEnvValue('OPENAI_COMPAT_PROVIDER_LABEL') || 'OpenAI-Compatible';
	}

	if (provider === 'invalid') {
		return 'Konfigurasi Provider Tidak Valid';
	}

	return 'Gemini';
}

function getGeminiProviderHealth(): AIProviderHealth {
	const apiKey = readEnvValue('GEMINI_API_KEY');
	const textModel = readEnvValue('GEMINI_TEXT_MODEL') || FALLBACK_GEMINI_TEXT_MODEL;
	const cheapModel = readEnvValue('GEMINI_CHEAP_MODEL') || FALLBACK_GEMINI_CHEAP_MODEL;

	return {
		configured: Boolean(apiKey),
		keyLength: apiKey.length,
		textModel,
		cheapModel
	};
}

function getOpenAICompatibleProviderHealth(): AIProviderHealth {
	const apiKey = readEnvValue('OPENAI_COMPAT_API_KEY');
	const baseUrl = readEnvValue('OPENAI_COMPAT_BASE_URL') || FALLBACK_OPENAI_BASE_URL;
	const textModel = readEnvValue('OPENAI_COMPAT_TEXT_MODEL') || FALLBACK_OPENAI_TEXT_MODEL;
	const cheapModel = readEnvValue('OPENAI_COMPAT_CHEAP_MODEL') || FALLBACK_OPENAI_CHEAP_MODEL;
	const providerLabel = getProviderLabel('openai-compatible');

	return {
		configured: Boolean(apiKey || baseUrl !== FALLBACK_OPENAI_BASE_URL),
		keyLength: apiKey.length,
		textModel,
		cheapModel,
		providerLabel,
		baseUrl
	};
}

function getOpenAIProviderHealth(): AIProviderHealth {
	const health = getOfficialOpenAIProviderHealth();
	return {
		configured: health.configured,
		keyLength: health.keyLength,
		textModel: health.textModel,
		cheapModel: health.cheapModel
	};
}

function getActiveProviderHealth() {
	const provider = getProviderId();
	if (provider === 'openai-compatible') {
		return { provider, health: getOpenAICompatibleProviderHealth() };
	}

	if (provider === 'openai') {
		return { provider, health: getOpenAIProviderHealth() };
	}

	if (provider === 'gemini') {
		return { provider, health: getGeminiProviderHealth() };
	}

	return { provider, health: { configured: false, keyLength: 0, textModel: FALLBACK_GEMINI_TEXT_MODEL, cheapModel: FALLBACK_GEMINI_CHEAP_MODEL } };
}

export function getAIHealth(): AIHealth {
	const gemini = getGeminiProviderHealth();
	const openai = getOpenAIProviderHealth();
	const openaiCompatible = getOpenAICompatibleProviderHealth();
	const { provider, health } = getActiveProviderHealth();
	const activeProvider = provider === 'invalid' ? 'gemini' : provider;
	const providerLabel = provider === 'invalid' ? getProviderLabel('invalid') : getProviderLabel(provider);

	return {
		ok: provider === 'invalid' ? false : health.configured,
		activeProvider,
		providerLabel,
		providers: {
			gemini,
			openai,
			openaiCompatible
		}
	};
}

export function getGeminiHealth() {
	const gemini = getGeminiProviderHealth();
	return {
		ok: gemini.configured,
		hasGeminiKey: gemini.keyLength > 0,
		geminiKeyLength: gemini.keyLength,
		textModel: gemini.textModel,
		cheapModel: gemini.cheapModel
	};
}

function getGeminiClient(apiKey: string) {
	if (!geminiClient || geminiClientKey !== apiKey) {
		geminiClient = new GoogleGenAI({ apiKey });
		geminiClientKey = apiKey;
	}

	return geminiClient;
}

function buildJsonSchemaPrompt() {
	const conciseModeInstruction = buildPromptModeInstruction();
	return conciseModeInstruction ? `${RESPONSE_SCHEMA_INSTRUCTION}\n${conciseModeInstruction}` : RESPONSE_SCHEMA_INSTRUCTION;
}

function buildFinalPrompt(app: string, action: string, input: any, prompt: string) {
	const conciseModeInstruction = buildPromptModeInstruction();
	return `
${SYSTEM_INSTRUCTION}

${conciseModeInstruction ? `${conciseModeInstruction}\n` : ''}

Konteks Aplikasi: ${app}
Aksi: ${action}
Input Data: ${JSON.stringify(input)}

Tugas:
${prompt}

${buildJsonSchemaPrompt()}
`;
}

function buildBaseResponse(
	provider: AIProviderSelection,
	providerLabel: string,
	model: string,
	app: string,
	action: string
): SecurityAIResponse {
	return {
		ok: false,
		provider,
		providerLabel,
		model,
		app,
		action,
		result: {},
		summary: '',
		recommendations: [],
		warnings: []
	};
}

function extractJsonCandidate(text: string) {
	const trimmed = stripWhitespace(text).replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
	const firstBrace = trimmed.indexOf('{');
	const lastBrace = trimmed.lastIndexOf('}');
	if (firstBrace >= 0 && lastBrace > firstBrace) {
		return trimmed.slice(firstBrace, lastBrace + 1);
	}
	return trimmed;
}

function normalizeParsedResponse(
	provider: AIProviderId,
	providerLabel: string,
	model: string,
	app: string,
	action: string,
	parsed: any,
	fallbackText = ''
): SecurityAIResponse {
	const result = parsed && typeof parsed.result === 'object' && parsed.result ? parsed.result : {};
	const summary = typeof parsed?.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : fallbackText;
	const recommendations = Array.isArray(parsed?.recommendations)
		? parsed.recommendations.filter((item: unknown) => typeof item === 'string')
		: [];
	const warnings = Array.isArray(parsed?.warnings)
		? parsed.warnings.filter((item: unknown) => typeof item === 'string')
		: [];

	return {
		ok: true,
		provider,
		providerLabel,
		model,
		app,
		action,
		result,
		summary: summary || 'AI selesai diproses.',
		recommendations,
		warnings
	};
}

function normalizeTextFallbackResponse(
	provider: AIProviderId,
	providerLabel: string,
	model: string,
	app: string,
	action: string,
	text: string
): SecurityAIResponse {
	const cleaned = stripWhitespace(text);
	return {
		ok: true,
		provider,
		providerLabel,
		model,
		app,
		action,
		result: {},
		summary: cleaned || 'AI selesai diproses.',
		recommendations: [],
		warnings: []
	};
}

function summarizeProviderError(raw: string) {
	try {
		const parsed = JSON.parse(raw) as {
			error?: { message?: string; status?: string; code?: number };
		};
		const message = parsed.error?.message || parsed.error?.status || '';
		if (message) return message.slice(0, 220);
		if (typeof parsed.error?.code === 'number') return `code:${parsed.error.code}`;
	} catch {
		// ignore JSON parse failures for error payloads
	}

	return raw.slice(0, 220);
}

function friendlyProviderError(providerLabel: string, providerId: AIProviderSelection, error: unknown) {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();
		if (providerId === 'invalid') {
			return 'AI_PROVIDER tidak valid. Gunakan gemini, openai, atau openai-compatible lalu restart server.';
		}
		if (providerId === 'gemini') {
			if (message.includes('abort') || message.includes('timeout') || message.includes('timed out')) {
				return 'Permintaan ke Gemini melebihi batas waktu. Coba lagi dengan prompt yang lebih ringkas.';
			}
			if (
				message.includes('429') ||
				message.includes('quota') ||
				message.includes('resource_exhausted') ||
				message.includes('rate limit')
			) {
				return 'Gemini sedang dibatasi sementara. Coba lagi beberapa saat lagi.';
			}
			if (
				message.includes('gemini_api_key') ||
				message.includes('missing gemini_api_key') ||
				message.includes('belum tersedia') ||
				message.includes('not available')
			) {
				return 'GEMINI_API_KEY belum tersedia di server. Periksa file .env lalu restart server.';
			}
			if (
				message.includes('expired') ||
				message.includes('invalid') ||
				message.includes('api key') ||
				message.includes('401') ||
				message.includes('403') ||
				message.includes('400') ||
				message.includes('invalid_argument') ||
				message.includes('not found') ||
				message.includes('model')
			) {
				return 'API key Gemini tidak valid atau sudah kedaluwarsa. Perbarui GEMINI_API_KEY lalu restart server.';
			}
		}

		if (providerId === 'openai-compatible') {
			if (
				message.includes('api key') ||
				message.includes('unauthorized') ||
				message.includes('401') ||
				message.includes('403')
			) {
				return `OPENAI_COMPAT_API_KEY untuk ${providerLabel} tidak valid atau sudah kedaluwarsa. Perbarui konfigurasi lalu restart server.`;
			}
			if (message.includes('abort') || message.includes('timeout') || message.includes('timed out')) {
				return `Permintaan ke ${providerLabel} melebihi batas waktu. Coba lagi dengan prompt yang lebih ringkas.`;
			}
			if (
				message.includes('failed to fetch') ||
				message.includes('fetch failed') ||
				message.includes('econnrefused') ||
				message.includes('enotfound') ||
				message.includes('network')
			) {
				return `Koneksi ke ${providerLabel} gagal. Periksa OPENAI_COMPAT_BASE_URL dan konektivitas server.`;
			}
		}

		if (providerId === 'openai') {
			if (
				message.includes('openai_api_key') ||
				message.includes('openai api key') ||
				message.includes('api key') ||
				message.includes('authentication') ||
				message.includes('unauthorized') ||
				message.includes('401') ||
				message.includes('403')
			) {
				return 'OPENAI_API_KEY tidak valid atau sudah kedaluwarsa. Perbarui OPENAI_API_KEY lalu restart server.';
			}
			if (message.includes('429') || message.includes('rate limit')) {
				return 'OpenAI sedang dibatasi sementara. Coba lagi beberapa saat lagi.';
			}
			if (message.includes('abort') || message.includes('timeout') || message.includes('timed out')) {
				return 'Permintaan ke OpenAI melebihi batas waktu. Coba lagi dengan prompt yang lebih ringkas.';
			}
			if (
				message.includes('failed to fetch') ||
				message.includes('fetch failed') ||
				message.includes('network') ||
				message.includes('econnrefused') ||
				message.includes('enotfound')
			) {
				return 'Koneksi ke OpenAI gagal. Periksa konektivitas server dan konfigurasi model.';
			}
		}
	}

	return 'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.';
}

async function generateWithGemini(
	providerLabel: string,
	model: string,
	app: string,
	action: string,
	input: any,
	prompt: string,
	apiKey: string
): Promise<SecurityAIResponse> {
	const finalPrompt = buildFinalPrompt(app, action, input, prompt);
	const disableThinking = isThinkingDisabled();
	const maxOutputTokens = getOpenAICompatibleMaxOutputTokens();

	const tryGeminiOnce = async (disableThinking: boolean) => {
		const client = getGeminiClient(apiKey);
		const response = await client.models.generateContent({
			model,
			contents: finalPrompt,
			config: disableThinking
				? {
					maxOutputTokens,
					thinkingConfig: {
						thinkingBudget: 0
					}
				}
				: { maxOutputTokens }
		});

		const text = coerceProviderText(response.text);
		if (!text) {
			throw new Error('GEMINI_EMPTY_RESPONSE');
		}

		try {
			const parsed = JSON.parse(extractJsonCandidate(text));
			return normalizeParsedResponse('gemini', providerLabel, model, app, action, parsed, text);
		} catch {
			return normalizeTextFallbackResponse('gemini', providerLabel, model, app, action, text);
		}
	};

	try {
		return await tryGeminiOnce(disableThinking);
	} catch (firstError) {
		if (!disableThinking) {
			const errorMessage = friendlyProviderError(providerLabel, 'gemini', firstError);
			return {
				...buildBaseResponse('gemini', providerLabel, model, app, action),
				ok: false,
				summary: errorMessage,
				error: errorMessage
			};
		}

		try {
			return await generateGeminiViaRest(providerLabel, model, app, action, finalPrompt, apiKey, false);
		} catch (restError) {
			try {
				return await tryGeminiOnce(false);
			} catch (fallbackSdkError) {
				try {
					return await generateGeminiViaRest(providerLabel, model, app, action, finalPrompt, apiKey, true);
				} catch (finalError) {
					const errorMessage = friendlyProviderError(providerLabel, 'gemini', finalError || fallbackSdkError || restError || firstError);
					return {
						...buildBaseResponse('gemini', providerLabel, model, app, action),
						ok: false,
						summary: errorMessage,
						error: errorMessage
					};
				}
			}
		}
	}
}

async function generateGeminiViaRest(
	providerLabel: string,
	model: string,
	app: string,
	action: string,
	finalPrompt: string,
	apiKey: string,
	disableThinking: boolean
): Promise<SecurityAIResponse> {
	const body: Record<string, unknown> = {
		contents: [{ role: 'user', parts: [{ text: finalPrompt }] }]
	};
	const maxOutputTokens = getMaxOutputTokens();

	if (disableThinking) {
		body.generationConfig = {
			maxOutputTokens,
			thinkingConfig: {
				thinkingBudget: 0
			}
		};
	} else {
		body.generationConfig = { maxOutputTokens };
	}

	const response = await fetchWithTimeout(
		`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-goog-api-key': apiKey
			},
			body: JSON.stringify(body)
		}
		,
		getRequestTimeoutMs()
	);

	if (!response.ok) {
		const rawError = await response.text();
		const detail = summarizeProviderError(rawError);
		throw new Error(`Gemini REST request failed with status ${response.status}: ${detail}`);
	}

	const data = await response.json();
	const text =
		data?.candidates?.[0]?.content?.parts
			?.map((part: { text?: string }) => part.text || '')
			.join('') || '';

	if (!text) {
		throw new Error('Gemini REST response kosong.');
	}

	try {
		const parsed = JSON.parse(extractJsonCandidate(text));
		return normalizeParsedResponse('gemini', providerLabel, model, app, action, parsed, text);
	} catch {
		return normalizeTextFallbackResponse('gemini', providerLabel, model, app, action, text);
	}
}

function buildOpenAICompatibleUrl(baseUrl: string) {
	const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
	return new URL('chat/completions', normalizedBase).toString();
}

async function generateWithOpenAICompatible(
	providerLabel: string,
	baseUrl: string,
	model: string,
	app: string,
	action: string,
	input: any,
	prompt: string,
	apiKey: string
): Promise<SecurityAIResponse> {
	const finalPrompt = buildFinalPrompt(app, action, input, prompt);
	const disableThinking = isThinkingDisabled();
	const maxOutputTokens = getMaxOutputTokens();

	const runOnce = async (disableThinking: boolean) => {
		const requestBody: Record<string, unknown> = {
			model,
			messages: [
				{ role: 'system', content: SYSTEM_INSTRUCTION },
				{ role: 'user', content: finalPrompt }
			],
			temperature: 0.4,
			max_tokens: maxOutputTokens
		};

		if (disableThinking) {
			requestBody.reasoning_effort = null;
		}

		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		if (stripWhitespace(apiKey)) {
			headers.Authorization = `Bearer ${apiKey}`;
		}

		const response = await fetchWithTimeout(buildOpenAICompatibleUrl(baseUrl), {
			method: 'POST',
			headers,
			body: JSON.stringify(requestBody)
		}, getRequestTimeoutMs());

		if (!response.ok) {
			const rawError = await response.text();
			const detail = summarizeProviderError(rawError);
			throw new Error(`OpenAI-compatible request failed with status ${response.status}: ${detail}`);
		}

		const data = await response.json();
		const text = coerceProviderText(
			data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || data?.output_text || ''
		);

		if (!text) {
			throw new Error('OpenAI-compatible response kosong.');
		}

		try {
			const parsed = JSON.parse(extractJsonCandidate(String(text)));
			return normalizeParsedResponse('openai-compatible', providerLabel, model, app, action, parsed, String(text));
		} catch {
			return normalizeTextFallbackResponse('openai-compatible', providerLabel, model, app, action, String(text));
		}
	};

	try {
		return await runOnce(disableThinking);
	} catch (firstError) {
		if (!disableThinking) {
			const message = friendlyProviderError(providerLabel, 'openai-compatible', firstError);
			return createMissingProviderResponse('openai-compatible', providerLabel, model, app, action, message);
		}

		try {
			return await runOnce(false);
		} catch (error) {
			const message = friendlyProviderError(providerLabel, 'openai-compatible', error);
			return createMissingProviderResponse('openai-compatible', providerLabel, model, app, action, message);
		}
	}
}

function getActiveProviderConfig() {
	const provider = getProviderId();
	if (provider === 'openai') {
		const health = getOpenAIProviderHealth();
		return {
			provider,
			providerLabel: 'OpenAI',
			model: health.textModel,
			configured: health.configured,
			apiKey: readEnvValue('OPENAI_API_KEY'),
			baseUrl: ''
		};
	}

	if (provider === 'openai-compatible') {
		const health = getOpenAICompatibleProviderHealth();
		return {
			provider,
			providerLabel: health.providerLabel || 'OpenAI-Compatible',
			model: health.textModel,
			configured: health.configured,
			apiKey: readEnvValue('OPENAI_COMPAT_API_KEY'),
			baseUrl: health.baseUrl || FALLBACK_OPENAI_BASE_URL
		};
	}

	if (provider === 'invalid') {
		return {
			provider,
			providerLabel: 'Konfigurasi Provider Tidak Valid',
			model: FALLBACK_GEMINI_TEXT_MODEL,
			configured: false,
			apiKey: '',
			baseUrl: ''
		};
	}

	const health = getGeminiProviderHealth();
	return {
		provider,
		providerLabel: 'Gemini',
		model: health.textModel,
		configured: health.configured,
		apiKey: readEnvValue('GEMINI_API_KEY'),
		baseUrl: ''
	};
}

function createMissingProviderResponse(
	provider: AIProviderSelection,
	providerLabel: string,
	model: string,
	app: string,
	action: string,
	message: string
): SecurityAIResponse {
	return {
		...buildBaseResponse(provider, providerLabel, model, app, action),
		ok: false,
		summary: message,
		error: message
	};
}

export async function askSecurityAI(
	app: string,
	action: string,
	input: any,
	prompt: string,
	modelName?: string
): Promise<SecurityAIResponse> {
	const providerConfig = getActiveProviderConfig();
	const providerModel = modelName || providerConfig.model;

	if (!providerConfig.configured) {
		const message =
			providerConfig.provider === 'invalid'
				? 'AI_PROVIDER tidak valid. Gunakan gemini, openai, atau openai-compatible lalu restart server.'
				: providerConfig.provider === 'openai-compatible'
				? `${providerConfig.providerLabel} belum dikonfigurasi di server. Periksa AI_PROVIDER, OPENAI_COMPAT_BASE_URL, dan model lalu restart server.`
				: providerConfig.provider === 'openai'
					? 'OPENAI_API_KEY belum tersedia di server. Periksa file .env lalu restart server.'
					: 'GEMINI_API_KEY belum tersedia di server. Periksa file .env lalu restart server.';
		return createMissingProviderResponse(
			providerConfig.provider,
			providerConfig.providerLabel,
			providerModel,
			app,
			action,
			message
		);
	}

	if (providerConfig.provider === 'openai-compatible') {
		try {
			return await generateWithOpenAICompatible(
				providerConfig.providerLabel,
				providerConfig.baseUrl,
				providerModel,
				app,
				action,
				input,
				prompt,
				providerConfig.apiKey
			);
		} catch (error) {
			const message = friendlyProviderError(providerConfig.providerLabel, providerConfig.provider, error);
			return createMissingProviderResponse(
				providerConfig.provider,
				providerConfig.providerLabel,
				providerModel,
				app,
				action,
				message
			);
		}
	}

	if (providerConfig.provider === 'openai') {
		try {
			const text = await generateWithOpenAIResponses({
				apiKey: providerConfig.apiKey,
				model: providerModel,
				globalSafetyInstruction: SYSTEM_INSTRUCTION,
				prompt: buildFinalPrompt(app, action, input, prompt)
			});

			try {
				const parsed = JSON.parse(extractJsonCandidate(text));
				return normalizeParsedResponse('openai', providerConfig.providerLabel, providerModel, app, action, parsed, text);
			} catch {
				return normalizeTextFallbackResponse('openai', providerConfig.providerLabel, providerModel, app, action, text);
			}
		} catch (error) {
			const message = friendlyProviderError(providerConfig.providerLabel, providerConfig.provider, error);
			return createMissingProviderResponse(
				providerConfig.provider,
				providerConfig.providerLabel,
				providerModel,
				app,
				action,
				message
			);
		}
	}

	try {
		return await generateWithGemini(
			providerConfig.providerLabel,
			providerModel,
			app,
			action,
			input,
			prompt,
			providerConfig.apiKey
		);
	} catch (error) {
		const message = friendlyProviderError(providerConfig.providerLabel, providerConfig.provider, error);
		return createMissingProviderResponse(
			providerConfig.provider,
			providerConfig.providerLabel,
			providerModel,
			app,
			action,
			message
		);
	}
}
