const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173';

async function readJson(path, init) {
	const response = await fetch(`${baseUrl}${path}`, init);
	const text = await response.text();
	try {
		return JSON.parse(text);
	} catch {
		return { ok: false, raw: text, status: response.status };
	}
}

async function main() {
	const health = await readJson('/api/ai/health');
	console.log('[health]', JSON.stringify({
		ok: health.ok,
		activeProvider: health.activeProvider,
		providerLabel: health.providerLabel,
		providers: {
			gemini: health.providers?.gemini?.configured,
			openai: health.providers?.openai?.configured,
			openaiCompatible: health.providers?.openaiCompatible?.configured
		}
	}, null, 2));

	const ai = await readJson('/api/ai/security', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			app: 'cvss-calculator',
			action: 'explain-cvss-risk',
			input: {
				severity: 'High',
				assetCriticality: 'High',
				internetExposed: true,
				exploitAvailable: false,
				sensitiveData: true,
				patchComplexity: 'Medium',
				compensatingControls: 'WAF aktif',
				calculatedRiskScore: 82,
				calculatedSeverity: 'High',
				recommendedSla: '7 hari'
			}
		})
	});

	console.log('[ai]', JSON.stringify({
		ok: ai.ok,
		provider: ai.provider,
		providerLabel: ai.providerLabel,
		model: ai.model,
		summary: ai.summary,
		error: ai.error
	}, null, 2));
}

main().catch((error) => {
	console.error('[test-ai-providers] failed:', error?.message || error);
	process.exit(1);
});
