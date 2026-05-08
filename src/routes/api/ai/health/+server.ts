import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAIHealth } from '$lib/server/gemini';

export const GET: RequestHandler = () => {
	const health = getAIHealth();

	return json({
		ok: health.ok,
		activeProvider: health.activeProvider,
		providerLabel: health.providerLabel,
		providers: {
			gemini: {
				configured: health.providers.gemini.configured,
				keyLength: health.providers.gemini.keyLength,
				textModel: health.providers.gemini.textModel,
				cheapModel: health.providers.gemini.cheapModel
			},
			openai: {
				configured: health.providers.openai.configured,
				keyLength: health.providers.openai.keyLength,
				textModel: health.providers.openai.textModel,
				cheapModel: health.providers.openai.cheapModel
			},
			openaiCompatible: {
				configured: health.providers.openaiCompatible.configured,
				keyLength: health.providers.openaiCompatible.keyLength,
				baseUrl: health.providers.openaiCompatible.baseUrl,
				textModel: health.providers.openaiCompatible.textModel,
				cheapModel: health.providers.openaiCompatible.cheapModel,
				providerLabel: health.providers.openaiCompatible.providerLabel
			}
		}
	});
};
