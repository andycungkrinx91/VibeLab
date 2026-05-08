import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { askSecurityAI, getAIHealth } from '$lib/server/gemini';

const ALLOWED_ACTIONS: Record<string, string[]> = {
	'threat-runner': ['generate-threat-mission', 'summarize-incident'],
	'risk-dashboard': ['analyze-risk-dashboard'],
	'cvss-calculator': ['explain-cvss-risk'],
	'patch-monitor': ['generate-patch-plan', 'generate-stakeholder-update'],
	'incident-response-journey': [
		'explain-ir-step',
		'generate-ir-quiz',
		'generate-postmortem-template'
	],
	'analyst-portfolio-builder': [
		'generate-security-bio',
		'improve-security-projects',
		'review-analyst-profile',
		'generate-ats-cv'
	],
	'secureops-habit-tracker': ['generate-security-coaching'],
	'threat-briefing-player': ['summarize-threat-briefing', 'extract-briefing-actions'],
	'cve-resource-library': ['explain-security-resource'],
	'patch-deadline-countdown': ['generate-deadline-checklist', 'generate-stakeholder-message']
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const aiHealth = getAIHealth();
		const activeProviderConfig =
			aiHealth.activeProvider === 'openai-compatible'
				? aiHealth.providers.openaiCompatible
				: aiHealth.activeProvider === 'openai'
					? aiHealth.providers.openai
					: aiHealth.providers.gemini;
		const activeModel = activeProviderConfig.textModel;
		const baseError = (message: string, app = '', action = '') => ({
			ok: false,
			provider: aiHealth.activeProvider,
			providerLabel: aiHealth.providerLabel,
			model: activeModel,
			app,
			action,
			result: {},
			summary: message,
			recommendations: [],
			warnings: [],
			error: message
		});

		const body = await request.json().catch(() => null);
		if (!body || typeof body !== 'object') {
			return json(baseError('Permintaan tidak valid.'), { status: 400 });
		}

		const { app, action, input } = body;

		if (!app || typeof app !== 'string') {
			return json(baseError('Aplikasi tidak valid.'), { status: 400 });
		}

		if (!action || typeof action !== 'string') {
			return json(baseError('Aksi tidak valid.', app), { status: 400 });
		}

		if (!ALLOWED_ACTIONS[app]?.includes(action)) {
			return json(baseError('Kombinasi aplikasi dan aksi tidak diizinkan.', app, action), { status: 403 });
		}

		let prompt = '';

		switch (app) {
			case 'threat-runner':
				if (action === 'generate-threat-mission') {
					prompt = `Buatlah misi pertahanan siber singkat. Hasilkan field 'missionTitle' (string) dan 'objectives' (array of string) di dalam objek 'result'.`;
				} else if (action === 'summarize-incident') {
					prompt = `Buatlah ringkasan insiden berdasarkan performa permainan (skor, health, threats, dsb). Hasilkan field 'status' (string, e.g., 'Aman', 'Kritis') dan 'remediationChecklist' (array of string) di dalam objek 'result'.`;
				}
				break;
			case 'risk-dashboard':
				if (action === 'analyze-risk-dashboard') {
					prompt = `Analisa hasil scan security headers untuk domain atau URL yang diberikan. Berikan ringkasan singkat, prioritas hardening yang manajer-friendly, dan jelaskan dampak defensif dari header yang hilang. Hasilkan field 'priority' (string), 'managerSummary' (string), 'hardeningSuggestions' (array of string), dan 'recommendedHeaderExamples' (array of string) di dalam objek 'result'. Jangan berikan instruksi ofensif.`;
				}
				break;
			case 'cvss-calculator':
				if (action === 'explain-cvss-risk') {
					prompt = `Jelaskan mengapa skor risiko tinggi atau rendah, dan sarankan Service Level Agreement (SLA) untuk patch. Hasilkan field 'explanation' (string) dan 'suggestedSla' (string) di dalam objek 'result'.`;
				}
				break;
			case 'patch-monitor':
				if (action === 'generate-patch-plan') {
					prompt = `Buatlah rencana harian untuk melakukan patch di Patch Monitor Status. Hasilkan field 'dailyPlan' (array of string) di dalam objek 'result'.`;
				} else if (action === 'generate-stakeholder-update') {
					prompt = `Buatlah laporan pembaruan patch untuk stakeholder di Patch Monitor Status. Hasilkan field 'report' (string) di dalam objek 'result'.`;
				}
				break;
			case 'incident-response-journey':
				if (action === 'explain-ir-step') {
					prompt = `Jelaskan langkah incident response yang dipilih (Detect, Triage, dsb). Hasilkan field 'explanation' (string) di dalam objek 'result'.`;
				} else if (action === 'generate-ir-quiz') {
					prompt = `Buatlah kuis singkat tentang langkah incident response tersebut. Hasilkan field 'question' (string), 'options' (array of string), dan 'correctAnswer' (string) di dalam objek 'result'.`;
				} else if (action === 'generate-postmortem-template') {
					prompt = `Buatlah template dokumen postmortem untuk insiden tersebut. Hasilkan field 'template' (string dengan format markdown) di dalam objek 'result'.`;
				}
				break;
			case 'analyst-portfolio-builder':
				if (action === 'generate-security-bio') {
					prompt = `Buatlah bio profil keamanan siber (cybersecurity bio) profesional dalam Bahasa Indonesia berdasarkan data yang diberikan (nama, role, skills, dsb). Hasilkan field 'bio' (string) di dalam objek 'result'.`;
				} else if (action === 'improve-security-projects') {
					prompt = `Perbaiki dan tingkatkan deskripsi ringkasan proyek keamanan siber menjadi lebih profesional dan menarik (recruiter-friendly) dalam Bahasa Indonesia. Hasilkan field 'improvedProjects' (array of string) di dalam objek 'result'.`;
				} else if (action === 'review-analyst-profile') {
					prompt = `Review profil analis keamanan siber ini. Berikan umpan balik (feedback) dan saran peningkatan yang konstruktif dalam Bahasa Indonesia. Hasilkan field 'review' (string) di dalam objek 'result'.`;
				} else if (action === 'generate-ats-cv') {
					prompt = `Buat CV ATS-friendly dan ringkasan portfolio recruiter-friendly dalam Bahasa Indonesia. Gunakan data nama, role, skills, tools, certifications, projects, achievements, dan links. Hasilkan field 'atsSummary' (string), 'sections' (array of string), 'bullets' (array of string), dan 'recommendations' (array of string) di dalam objek 'result'. Sertakan istilah teknis bahasa Inggris yang natural bila relevan. Jangan menambahkan informasi yang tidak ada di input.`;
				}
				break;
			case 'secureops-habit-tracker':
				if (action === 'generate-security-coaching') {
					prompt = `Berikan ulasan kebiasaan keamanan mingguan (weekly habit review), saran dari security coach, dan rencana peningkatan selanjutnya dalam Bahasa Indonesia berdasarkan data habit tracker yang diberikan. Hasilkan field 'coachMessage' (string) dan 'nextSteps' (array of string) di dalam objek 'result'.`;
				}
				break;
			case 'threat-briefing-player':
				if (action === 'summarize-threat-briefing') {
					prompt = `Buatlah ringkasan ancaman (threat briefing) eksekutif berdasarkan transkrip yang diberikan dalam Bahasa Indonesia. Hasilkan field 'summary' (string) di dalam objek 'result'.`;
				} else if (action === 'extract-briefing-actions') {
					prompt = `Ekstrak langkah-langkah aksi (action items) atau update bergaya Slack dari transkrip threat briefing yang diberikan dalam Bahasa Indonesia. Hasilkan field 'actionItems' (array of string) dan 'slackUpdate' (string) di dalam objek 'result'.`;
				}
				break;
			case 'cve-resource-library':
				if (action === 'explain-security-resource') {
					prompt = `Jelaskan resource keamanan, konsep keamanan, atau command/snippet yang diberikan dalam Bahasa Indonesia dengan sederhana. Sertakan checklist jika relevan. Hasilkan field 'explanation' (string) dan 'checklist' (array of string) di dalam objek 'result'.`;
				}
				break;
			case 'patch-deadline-countdown':
				if (action === 'generate-deadline-checklist') {
					prompt = `Buatlah checklist remediasi (remediation checklist) untuk menambal kerentanan (patch vulnerability) berdasarkan detail deadline dan urgensi yang diberikan dalam Bahasa Indonesia. Hasilkan field 'checklist' (array of string) di dalam objek 'result'.`;
				} else if (action === 'generate-stakeholder-message') {
					prompt = `Buatlah pesan eskalasi gaya Slack atau pembaruan stakeholder (stakeholder update) mengenai status deadline patch ini dalam Bahasa Indonesia. Hasilkan field 'message' (string) di dalam objek 'result'.`;
				}
				break;
		default:
				return json(baseError('Aplikasi tidak dikenal.', app, action), { status: 400 });
		}

		const aiResponse = await askSecurityAI(app, action, input, prompt);
		return json(aiResponse);
	} catch (err) {
		console.error('[AI API] request failed');
		const aiHealth = getAIHealth();
		const activeProviderConfig =
			aiHealth.activeProvider === 'openai-compatible'
				? aiHealth.providers.openaiCompatible
				: aiHealth.activeProvider === 'openai'
					? aiHealth.providers.openai
					: aiHealth.providers.gemini;
		return json(
			{
				ok: false,
				provider: aiHealth.activeProvider,
				providerLabel: aiHealth.providerLabel,
				model: activeProviderConfig.textModel,
				app: 'unknown',
				action: 'unknown',
				result: {},
				summary: 'Terjadi kesalahan pemrosesan pada server.',
				recommendations: [],
				warnings: [],
				error: 'Terjadi kesalahan sistem.'
			},
			{ status: 500 }
		);
	}
};
