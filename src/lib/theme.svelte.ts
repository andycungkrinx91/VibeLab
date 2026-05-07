export type ThemeId =
	| 'terminal-klasik'
	| 'cyberpunk-neon'
	| 'arch-linux'
	| 'matrix-rain'
	| 'red-alert-soc'
	| 'ice-blue-defense'
	| 'purple-zero-day'
	| 'amber-ops'
	| 'emerald-secure'
	| 'monochrome-hacker';

export interface ThemeOption {
	id: ThemeId;
	name: string;
	color: string; // for the preview swatch
}

export const themes: ThemeOption[] = [
	{ id: 'terminal-klasik', name: 'Terminal Klasik', color: '#00ff00' },
	{ id: 'cyberpunk-neon', name: 'Cyberpunk Neon', color: '#ff00ff' },
	{ id: 'arch-linux', name: 'Arch Linux Terminal', color: '#1793d1' },
	{ id: 'matrix-rain', name: 'Matrix Rain', color: '#03a062' },
	{ id: 'red-alert-soc', name: 'Red Alert SOC', color: '#ff3333' },
	{ id: 'ice-blue-defense', name: 'Ice Blue Defense', color: '#00ffff' },
	{ id: 'purple-zero-day', name: 'Purple Zero-Day', color: '#9d00ff' },
	{ id: 'amber-ops', name: 'Amber Ops', color: '#ffb000' },
	{ id: 'emerald-secure', name: 'Emerald Secure', color: '#00fa9a' },
	{ id: 'monochrome-hacker', name: 'Monochrome Hacker', color: '#ffffff' }
];

class ThemeStore {
	current = $state<ThemeId>('terminal-klasik');

	constructor() {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('vibelab-theme') as ThemeId;
			if (stored && themes.some((t) => t.id === stored)) {
				this.current = stored;
			}
			this.applyTheme(this.current);
		}
	}

	set(themeId: ThemeId) {
		this.current = themeId;
		if (typeof window !== 'undefined') {
			localStorage.setItem('vibelab-theme', themeId);
			this.applyTheme(themeId);
		}
	}

	private applyTheme(themeId: ThemeId) {
		document.documentElement.setAttribute('data-theme', themeId);
	}
}

export const themeState = new ThemeStore();
