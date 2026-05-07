import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGeminiHealth } from '$lib/server/gemini';

export const GET: RequestHandler = () => {
	const health = getGeminiHealth();

	return json({
		ok: health.ok,
		hasGeminiKey: health.hasGeminiKey,
		geminiKeyLength: health.geminiKeyLength,
		textModel: health.textModel,
		cheapModel: health.cheapModel
	});
};
