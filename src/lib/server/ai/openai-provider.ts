import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

const FALLBACK_OPENAI_TEXT_MODEL = 'gpt-5.5-mini';
const FALLBACK_OPENAI_CHEAP_MODEL = 'gpt-5.5-mini';

function isThinkingDisabled() {
	return readEnvValue('AI_DISABLE_THINKING').toLowerCase() === 'true';
}

type OpenAIProviderHealth = {
	configured: boolean;
	keyLength: number;
	textModel: string;
	cheapModel: string;
};

let openAIClient: OpenAI | null = null;
let openAIClientKey = '';
let openAIClientTimeoutMs = 0;

function getIntEnvValue(name: string, fallback: number) {
	const value = Number(readEnvValue(name));
	return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getMaxOutputTokens() {
	return getIntEnvValue('AI_MAX_OUTPUT_TOKENS', 700);
}

function getRequestTimeoutMs() {
	return getIntEnvValue('AI_REQUEST_TIMEOUT_MS', 25000);
}

function readEnvValue(name: string) {
	const runtimeValue = (env as Record<string, string | undefined>)[name];
	return typeof runtimeValue === 'string' && runtimeValue.trim() ? runtimeValue.trim() : '';
}

function getClient(apiKey: string) {
	const timeoutMs = getRequestTimeoutMs();
	if (!openAIClient || openAIClientKey !== apiKey || openAIClientTimeoutMs !== timeoutMs) {
		openAIClient = new OpenAI({ apiKey, timeout: timeoutMs });
		openAIClientKey = apiKey;
		openAIClientTimeoutMs = timeoutMs;
	}

	return openAIClient;
}

function extractResponseText(response: any) {
	if (typeof response?.output_text === 'string' && response.output_text.trim()) {
		return response.output_text.trim();
	}

	if (response?.output_text && typeof response.output_text === 'object') {
		try {
			return JSON.stringify(response.output_text).trim();
		} catch {
			// ignore stringification failures
		}
	}

	const pieces: string[] = [];
	for (const item of response?.output || []) {
		for (const content of item?.content || []) {
			if (typeof content?.text === 'string' && content.text.trim()) {
				pieces.push(content.text.trim());
			} else if (content?.text && typeof content.text === 'object') {
				try {
					const text = JSON.stringify(content.text).trim();
					if (text) pieces.push(text);
				} catch {
					// ignore stringification failures
				}
			}
		}
	}

	return pieces.join('').trim();
}

function sanitizeOpenAIError(error: unknown) {
	const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status?: number }).status) : undefined;
	const message = error instanceof Error ? error.message.toLowerCase() : '';

	if (message.includes('api key') || message.includes('authentication') || message.includes('unauthorized') || status === 401 || status === 403) {
		return 'OPENAI_API_KEY tidak valid atau sudah kedaluwarsa. Perbarui OPENAI_API_KEY lalu restart server.';
	}

	if (message.includes('rate limit') || status === 429) {
		return 'OpenAI sedang dibatasi sementara. Coba lagi beberapa saat lagi.';
	}

	if (message.includes('abort') || message.includes('timeout') || message.includes('timed out')) {
		return 'Permintaan ke OpenAI melebihi batas waktu. Coba lagi dengan prompt yang lebih ringkas.';
	}

	if (message.includes('fetch failed') || message.includes('failed to fetch') || message.includes('network') || message.includes('econnrefused') || message.includes('enotfound')) {
		return 'Koneksi ke OpenAI gagal. Periksa OPENAI_API_KEY, konektivitas server, dan endpoint model.';
	}

	if (status === 400 || status === 404) {
		return 'Konfigurasi OpenAI tidak valid. Periksa OPENAI_TEXT_MODEL dan OPENAI_API_KEY.';
	}

	if (status && status >= 500) {
		return 'Layanan OpenAI sedang bermasalah sementara. Coba lagi nanti.';
	}

	return 'Ada masalah dengan AI kali ini. Mohon maaf atas gangguannya.';
}

export function getOpenAIProviderHealth(): OpenAIProviderHealth {
	const apiKey = readEnvValue('OPENAI_API_KEY');
	const textModel = readEnvValue('OPENAI_TEXT_MODEL') || readEnvValue('OPENAI_CHEAP_MODEL') || FALLBACK_OPENAI_TEXT_MODEL;
	const cheapModel = readEnvValue('OPENAI_CHEAP_MODEL') || FALLBACK_OPENAI_CHEAP_MODEL;

	return {
		configured: Boolean(apiKey),
		keyLength: apiKey.length,
		textModel,
		cheapModel
	};
}

export async function generateWithOpenAIResponses(params: {
	apiKey: string;
	model: string;
	globalSafetyInstruction: string;
	prompt: string;
}) {
	const { apiKey, model, globalSafetyInstruction, prompt } = params;
	if (!apiKey) {
		throw new Error('OPENAI_API_KEY belum tersedia di server. Periksa file .env lalu restart server.');
	}

	const client = getClient(apiKey);
	const disableThinking = isThinkingDisabled();
	const maxOutputTokens = getMaxOutputTokens();

	const runOnce = async (disableThinking: boolean) => {
		const response = await client.responses.create({
			model,
			input: [
				{ role: 'system', content: globalSafetyInstruction },
				{ role: 'user', content: prompt }
			],
			max_output_tokens: maxOutputTokens,
			...(disableThinking ? { reasoning: { effort: 'low' } } : {})
		});

		const text = extractResponseText(response);
		if (!text) {
			throw new Error('OPENAI_EMPTY_RESPONSE');
		}

		return text;
	};

	try {
		return await runOnce(disableThinking);
	} catch (firstError) {
		if (!disableThinking) {
			throw new Error(sanitizeOpenAIError(firstError));
		}

		try {
			return await runOnce(false);
		} catch (secondError) {
			throw new Error(sanitizeOpenAIError(secondError || firstError));
		}
	}
}
