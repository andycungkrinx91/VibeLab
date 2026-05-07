import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SYSTEM_INSTRUCTION = `Jawab selalu dalam Bahasa Indonesia yang jelas, ringkas, dan praktis. Fokus pada defensive security: mitigasi, patching, hardening, monitoring, incident response, dan edukasi. Jangan memberikan instruksi eksploitasi ofensif. Jika diminta eksploitasi ofensif, berikan respon defensif yang aman dalam Bahasa Indonesia.`;
const FALLBACK_TEXT_MODEL = 'gemini-2.5-flash';
const FALLBACK_CHEAP_MODEL = 'gemini-2.5-flash-lite';

let ai: GoogleGenAI | null = null;
let aiApiKey = '';

export type GeminiHealth = {
	ok: boolean;
	hasGeminiKey: boolean;
	geminiKeyLength: number;
	textModel: string;
	cheapModel: string;
};

function getGeminiConfig(): GeminiHealth {
	const geminiKey = (env.GEMINI_API_KEY || '').trim();
	const textModel = env.GEMINI_TEXT_MODEL || FALLBACK_TEXT_MODEL;
	const cheapModel = env.GEMINI_CHEAP_MODEL || FALLBACK_CHEAP_MODEL;

	return {
		ok: Boolean(geminiKey),
		hasGeminiKey: Boolean(geminiKey),
		geminiKeyLength: geminiKey.length,
		textModel,
		cheapModel
	};
}

function logGeminiConfig(context: string) {
	const config = getGeminiConfig();
	const googleApiKeyPresent = Boolean((process.env.GOOGLE_API_KEY || '').trim());
	console.info('[Gemini] config', {
		context,
		hasGeminiKey: config.hasGeminiKey,
		geminiKeyLength: config.geminiKeyLength,
		googleApiKeyPresent,
		textModel: config.textModel,
		cheapModel: config.cheapModel
	});
}

function ignoreConflictingGoogleKey() {
	const googleApiKey = (process.env.GOOGLE_API_KEY || '').trim();
	if (!googleApiKey) return;

	console.warn('[Gemini] GOOGLE_API_KEY detected; ignoring in favor of GEMINI_API_KEY', {
		googleApiKeyLength: googleApiKey.length
	});

	delete process.env.GOOGLE_API_KEY;
}

function parseSecurityResponseText(app: string, action: string, text: string): SecurityAIResponse {
	let parsed: any;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error('GEMINI_JSON_PARSE_FAILED');
	}

	return {
		ok: true,
		app,
		action,
		result: parsed.result || {},
		summary: parsed.summary || '',
		recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
		warnings: Array.isArray(parsed.warnings) ? parsed.warnings : []
	};
}

function summarizeGeminiRestError(raw: string) {
	try {
		const parsed = JSON.parse(raw) as {
			error?: { message?: string; status?: string; code?: number };
		};
		const message = parsed.error?.message || parsed.error?.status || '';
		if (message) return message.slice(0, 200);
		if (typeof parsed.error?.code === 'number') return `code:${parsed.error.code}`;
	} catch {
		// ignore JSON parse failures for error payloads
	}

	return raw.slice(0, 200);
}

function parseDotenvFile(content: string) {
	const values: Record<string, string> = {};

	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const equalsIndex = trimmed.indexOf('=');
		if (equalsIndex === -1) continue;

		const key = trimmed.slice(0, equalsIndex).trim();
		let value = trimmed.slice(equalsIndex + 1).trim();

		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}

		values[key] = value;
	}

	return values;
}

function loadLocalGeminiFileConfig() {
	const candidates = ['.env.local', '.env'];
	const merged: Record<string, string> = {};

	for (const fileName of candidates) {
		const filePath = resolve(process.cwd(), fileName);
		if (!existsSync(filePath)) continue;

		try {
			Object.assign(merged, parseDotenvFile(readFileSync(filePath, 'utf8')));
		} catch {
			// ignore unreadable local dotenv files
		}
	}

	const apiKey = (merged.GEMINI_API_KEY || '').trim();
	if (!apiKey) return null;

	return {
		apiKey,
		textModel: (merged.GEMINI_TEXT_MODEL || '').trim() || undefined,
		cheapModel: (merged.GEMINI_CHEAP_MODEL || '').trim() || undefined
	};
}

async function generateContentViaRest(
	apiKey: string,
	modelName: string,
	app: string,
	action: string,
	finalPrompt: string
): Promise<SecurityAIResponse> {
	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-goog-api-key': apiKey
			},
			body: JSON.stringify({
				contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
				systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
				generationConfig: { responseMimeType: 'application/json' }
			})
		}
	);

	if (!response.ok) {
		const rawError = await response.text();
		const detail = summarizeGeminiRestError(rawError);
		console.warn('[Gemini] REST request failed', {
			app,
			action,
			status: response.status,
			statusText: response.statusText,
			detail,
			textModel: modelName
		});
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

	return parseSecurityResponseText(app, action, text);
}

function getAI() {
	const config = getGeminiConfig();
	const apiKey = (env.GEMINI_API_KEY || '').trim();
	if (!config.hasGeminiKey) {
		logGeminiConfig('missing-key');
		throw new Error('GEMINI_API_KEY belum tersedia di server. Periksa file .env lalu restart server.');
	}
	ignoreConflictingGoogleKey();
	if (!ai || aiApiKey !== apiKey) {
		logGeminiConfig(ai ? 'reinit' : 'init');
		ai = new GoogleGenAI({ apiKey });
		aiApiKey = apiKey;
	}
	return ai;
}

function friendlyGeminiError(error: unknown) {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();
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
			message.includes('403')
		) {
			return 'API key Gemini tidak valid atau sudah kedaluwarsa. Perbarui GEMINI_API_KEY lalu restart server.';
		}
	}

	return 'Fitur AI gagal sementara, tetapi aplikasi tetap bisa digunakan dengan data lokal.';
}

export interface SecurityAIResponse {
	ok: boolean;
	app: string;
	action: string;
	result: any;
	summary: string;
	recommendations: string[];
	warnings?: string[];
	error?: string;
}

export async function askSecurityAI(
	app: string,
	action: string,
	input: any,
	prompt: string,
	modelName?: string
): Promise<SecurityAIResponse> {
	const config = getGeminiConfig();
	const apiKey = (env.GEMINI_API_KEY || '').trim();
	if (!config.hasGeminiKey) {
		logGeminiConfig('missing-key');
		return {
			ok: false,
			app,
			action,
			result: {},
			summary: 'GEMINI_API_KEY belum tersedia di server. Periksa file .env lalu restart server.',
			recommendations: [],
			warnings: [],
			error: 'GEMINI_API_KEY belum tersedia di server. Periksa file .env lalu restart server.'
		};
	}

	ignoreConflictingGoogleKey();
	const resolvedModel = modelName || config.textModel;
	const jsonSchemaPrompt = `
Berikan respons dalam format JSON dengan struktur yang tepat berikut (jangan bungkus dengan markdown block):
{
  "result": { ... }, // objek spesifik sesuai konteks aplikasi (bisa berupa metrics, data tambahan, dsb)
  "summary": "Ringkasan penjelasan dalam 1-2 kalimat (Bahasa Indonesia)",
  "recommendations": ["Rekomendasi 1", "Rekomendasi 2", ...],
  "warnings": ["Peringatan opsional 1", ...]
}
`;

	const finalPrompt = `
Konteks Aplikasi: ${app}
Aksi: ${action}
Input Data: ${JSON.stringify(input)}

Tugas:
${prompt}

${jsonSchemaPrompt}
`;

	try {
		const client = getAI();
		const response = await client.models.generateContent({
			model: resolvedModel,
			contents: finalPrompt,
			config: {
				systemInstruction: SYSTEM_INSTRUCTION,
				responseMimeType: 'application/json'
			}
		});

		const text = response.text || '';
		if (!text) {
			throw new Error('GEMINI_EMPTY_RESPONSE');
		}

		return parseSecurityResponseText(app, action, text);
	} catch (error) {
		console.warn('[Gemini] SDK request failed; trying REST fallback', {
			app,
			action,
			hasGeminiKey: config.hasGeminiKey,
			geminiKeyLength: config.geminiKeyLength,
			textModel: resolvedModel
		});

		try {
			return await generateContentViaRest(apiKey, resolvedModel, app, action, finalPrompt);
		} catch (restError) {
			console.error('[Gemini] REST fallback failed', {
				app,
				action,
				hasGeminiKey: config.hasGeminiKey,
				geminiKeyLength: config.geminiKeyLength,
				textModel: resolvedModel
			});

			const localFileConfig = loadLocalGeminiFileConfig();
			if (localFileConfig && localFileConfig.apiKey !== apiKey) {
				console.warn('[Gemini] Retrying with local .env override', {
					app,
					action,
					localKeyLength: localFileConfig.apiKey.length,
					localTextModel: localFileConfig.textModel || resolvedModel
				});

				try {
					return await generateContentViaRest(
						localFileConfig.apiKey,
						localFileConfig.textModel || resolvedModel,
						app,
						action,
						finalPrompt
					);
				} catch (localFileError) {
					console.error('[Gemini] local .env override failed', {
						app,
						action,
						localKeyLength: localFileConfig.apiKey.length,
						localTextModel: localFileConfig.textModel || resolvedModel
					});
					return {
						ok: false,
						app,
						action,
						result: {},
						summary: friendlyGeminiError(localFileError),
						recommendations: [],
						warnings: [],
						error: friendlyGeminiError(localFileError)
					};
				}
			}

			return {
				ok: false,
				app,
				action,
				result: {},
				summary: friendlyGeminiError(restError),
				recommendations: [],
				warnings: [],
				error: friendlyGeminiError(restError)
			};
		}
	}
}

export function getGeminiHealth() {
	return getGeminiConfig();
}
