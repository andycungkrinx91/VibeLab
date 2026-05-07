export interface AppMeta {
	id: string;
	slug: string;
	route: string;
	path: string;
	title: string;
	category: string;
	familiarCategory: string;
	familiarCategorySubtitle: string;
	securityIdentity: string;
	description: string;
	badge: string;
	priority: string;
	workflow: string;
	aiAction: string;
	icon: string;
}

export const APPS: AppMeta[] = [
	{
		id: 'threat-runner',
		slug: 'threat-runner',
		route: '/apps/threat-runner',
		path: '/apps/threat-runner',
		title: 'Threat Runner',
		category: 'Training',
		familiarCategory: 'Retro Arcade Games',
		familiarCategorySubtitle: 'Game pertahanan cyber',
		securityIdentity: 'Cyber Defense Game',
		description: 'Modern cyber arcade mini-game. Protect the server core and learn to avoid threats.',
		badge: 'Active',
		priority: 'Low',
		workflow: 'Detect',
		aiAction: 'Mission Generation',
		icon: '🕹️'
	},
	{
		id: 'risk-dashboard',
		slug: 'risk-dashboard',
		route: '/apps/risk-dashboard',
		path: '/apps/risk-dashboard',
		title: 'Risk Dashboard',
		category: 'Monitoring',
		familiarCategory: 'Interactive Dashboards',
		familiarCategorySubtitle: 'Dashboard risiko security',
		securityIdentity: 'Security Ops Dashboard',
		description: 'Track security findings, risk scores, and asset exposure in a centralized view.',
		badge: 'Critical',
		priority: 'High',
		workflow: 'Triage',
		aiAction: 'Risk Analysis',
		icon: '📊'
	},
	{
		id: 'cvss-calculator',
		slug: 'cvss-calculator',
		route: '/apps/cvss-calculator',
		path: '/apps/cvss-calculator',
		title: 'CVSS Risk Calculator',
		category: 'Triage',
		familiarCategory: 'Smart Calculators',
		familiarCategorySubtitle: 'Kalkulator prioritas patch',
		securityIdentity: 'Vulnerability Risk Calculator',
		description: 'Calculate severity scores and get AI-driven mitigation and SLA recommendations.',
		badge: 'Tool',
		priority: 'Medium',
		workflow: 'Triage',
		aiAction: 'Score Explanation',
		icon: '🧮'
	},
	{
		id: 'patch-monitor',
		slug: 'patch-monitor',
		route: '/apps/patch-monitor',
		path: '/apps/patch-monitor',
		title: 'Patch Monitor Status',
		category: 'Remediation',
		familiarCategory: 'Productivity Utilities',
		familiarCategorySubtitle: 'Tracker lifecycle patch',
		securityIdentity: 'Patch Lifecycle Tracker',
		description: 'Track patch status and the lifecycle of vulnerability fixes from detection to verification.',
		badge: 'Scheduled',
		priority: 'High',
		workflow: 'Patch',
		aiAction: 'Patch Planning',
		icon: '🔁'
	},
	{
		id: 'patch-deadline-countdown',
		slug: 'patch-deadline-countdown',
		route: '/apps/patch-deadline-countdown',
		path: '/apps/patch-deadline-countdown',
		title: 'Patch Deadline Countdown',
		category: 'Remediation',
		familiarCategory: 'Event Countdowners',
		familiarCategorySubtitle: 'Countdown deadline patch',
		securityIdentity: 'Patch SLA Countdown',
		description: 'SLA countdown and remediation deadline tracker with Slack escalation generator.',
		badge: 'Warning',
		priority: 'High',
		workflow: 'Patch',
		aiAction: 'Escalation Gen',
		icon: '⏳'
	},
	{
		id: 'incident-response-journey',
		slug: 'incident-response-journey',
		route: '/apps/incident-response-journey',
		path: '/apps/incident-response-journey',
		title: 'Incident Response Journey',
		category: 'Response',
		familiarCategory: 'Interactive Storyboards',
		familiarCategorySubtitle: 'Simulasi perjalanan incident response',
		securityIdentity: 'Incident Response Story',
		description: 'Interactive timeline covering Detect, Triage, Contain, Patch, Verify, and Deploy.',
		badge: 'Framework',
		priority: 'High',
		workflow: 'Verify / Deploy',
		aiAction: 'Step Explanation',
		icon: '🧭'
	},
	{
		id: 'cve-resource-library',
		slug: 'cve-resource-library',
		route: '/apps/cve-resource-library',
		path: '/apps/cve-resource-library',
		title: 'CVE Resource Library',
		category: 'Knowledge',
		familiarCategory: 'Resource Libraries',
		familiarCategorySubtitle: 'Library referensi CVE dan security',
		securityIdentity: 'CVE Knowledge Base',
		description: 'Searchable knowledge base covering CVEs, hardening, and security best practices.',
		badge: 'Library',
		priority: 'Low',
		workflow: 'Education',
		aiAction: 'Resource Explanation',
		icon: '📚'
	},
	{
		id: 'threat-briefing-player',
		slug: 'threat-briefing-player',
		route: '/apps/threat-briefing-player',
		path: '/apps/threat-briefing-player',
		title: 'Threat Briefing Player',
		category: 'Intelligence',
		familiarCategory: 'Custom Media Players',
		familiarCategorySubtitle: 'Player briefing threat intelligence',
		securityIdentity: 'Threat Briefing Player',
		description: 'Interactive audio-visual player for mock security briefings and action extraction.',
		badge: 'Updated',
		priority: 'Medium',
		workflow: 'Detect / Education',
		aiAction: 'Action Extraction',
		icon: '🎧'
	},
	{
		id: 'secureops-habit-tracker',
		slug: 'secureops-habit-tracker',
		route: '/apps/secureops-habit-tracker',
		path: '/apps/secureops-habit-tracker',
		title: 'SecureOps Habit Tracker',
		category: 'Training',
		familiarCategory: 'Daily Habit Logs',
		familiarCategorySubtitle: 'Checklist kebiasaan SecureOps',
		securityIdentity: 'Security Habit Tracker',
		description: 'Daily security checklist and streak counter with weekly AI coaching.',
		badge: 'Daily',
		priority: 'Medium',
		workflow: 'Monitoring',
		aiAction: 'Security Coaching',
		icon: '✅'
	},
	{
		id: 'analyst-portfolio-builder',
		slug: 'analyst-portfolio-builder',
		route: '/apps/analyst-portfolio-builder',
		path: '/apps/analyst-portfolio-builder',
		title: 'Analyst Portfolio Builder',
		category: 'Career',
		familiarCategory: 'Personal Portfolios',
		familiarCategorySubtitle: 'Builder profil analis security',
		securityIdentity: 'Security Profile Builder',
		description: 'Build a premium security operator dossier and export a recruiter-friendly profile.',
		badge: 'Personal',
		priority: 'Low',
		workflow: 'Portfolio',
		aiAction: 'Bio Generation',
		icon: '👤'
	}
];

export function getAppBySlug(slug: string) {
	return APPS.find((app) => app.slug === slug || app.id === slug);
}

export const APP_PATTERN_SHOWCASE = [
	'threat-runner',
	'risk-dashboard',
	'patch-monitor',
	'analyst-portfolio-builder',
	'threat-briefing-player',
	'cvss-calculator',
	'incident-response-journey',
	'cve-resource-library',
	'patch-deadline-countdown',
	'secureops-habit-tracker'
]
	.map((slug) => getAppBySlug(slug))
	.filter((app): app is AppMeta => Boolean(app));
