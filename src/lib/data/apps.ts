export interface AppMeta {
	id: string;
	title: string;
	category: string;
	description: string;
	status: string;
	aiAction: string;
	priority: string;
	href: string;
}

export const apps: AppMeta[] = [
	{
		id: 'threat-runner',
		title: 'Threat Runner',
		category: 'Detect',
		description: 'Simulasi deteksi ancaman dan respons cepat.',
		status: 'Active',
		aiAction: 'Analisis Anomali',
		priority: 'High',
		href: '/apps/threat-runner'
	},
	{
		id: 'analyst-portfolio-builder',
		title: 'Analyst Portfolio Builder',
		category: 'Triage',
		description: 'Susun portofolio dan laporan analisis keamanan.',
		status: 'Ready',
		aiAction: 'Review Portofolio',
		priority: 'Medium',
		href: '/apps/analyst-portfolio-builder'
	},
	{
		id: 'risk-dashboard',
		title: 'Risk Dashboard',
		category: 'Triage',
		description: 'Visualisasi skor risiko dan metrik ancaman.',
		status: 'Active',
		aiAction: 'Generate Insight',
		priority: 'High',
		href: '/apps/risk-dashboard'
	},
	{
		id: 'cvss-calculator',
		title: 'CVSS Calculator',
		category: 'Triage',
		description: 'Kalkulator skor tingkat keparahan kerentanan.',
		status: 'Ready',
		aiAction: 'Rekomendasi CVSS',
		priority: 'Medium',
		href: '/apps/cvss-calculator'
	},
	{
		id: 'patch-monitor',
		title: 'Patch Monitor Status',
		category: 'Patch',
		description: 'Pantau status penerapan patch sistem.',
		status: 'Active',
		aiAction: 'Prioritas Patch',
		priority: 'High',
		href: '/apps/patch-monitor'
	},
	{
		id: 'secureops-habit-tracker',
		title: 'SecureOps Habit Tracker',
		category: 'Verify',
		description: 'Lacak rutinitas dan kebiasaan operasional keamanan.',
		status: 'Ready',
		aiAction: 'Evaluasi Kebiasaan',
		priority: 'Low',
		href: '/apps/secureops-habit-tracker'
	},
	{
		id: 'threat-briefing-player',
		title: 'Threat Briefing Player',
		category: 'Detect',
		description: 'Putar ringkasan ancaman keamanan harian.',
		status: 'Ready',
		aiAction: 'Ringkasan Ancaman',
		priority: 'Medium',
		href: '/apps/threat-briefing-player'
	},
	{
		id: 'incident-response-journey',
		title: 'Incident Response Journey',
		category: 'Deploy',
		description: 'Peta langkah respons insiden dari awal hingga pemulihan.',
		status: 'Active',
		aiAction: 'Panduan Respons',
		priority: 'High',
		href: '/apps/incident-response-journey'
	},
	{
		id: 'cve-resource-library',
		title: 'CVE Resource Library',
		category: 'Triage',
		description: 'Pustaka referensi data kerentanan CVE.',
		status: 'Ready',
		aiAction: 'Pencarian CVE',
		priority: 'Medium',
		href: '/apps/cve-resource-library'
	},
	{
		id: 'patch-deadline-countdown',
		title: 'Patch Deadline Countdown',
		category: 'Patch',
		description: 'Hitung mundur batas waktu penerapan patch kritis.',
		status: 'Active',
		aiAction: 'Peringatan Deadline',
		priority: 'High',
		href: '/apps/patch-deadline-countdown'
	}
];
