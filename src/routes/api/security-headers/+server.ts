import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const CHECKED_HEADERS = [
	{ name: 'Content-Security-Policy', weight: 20 },
	{ name: 'Strict-Transport-Security', weight: 20 },
	{ name: 'X-Content-Type-Options', weight: 15 },
	{ name: 'X-Frame-Options', weight: 15 },
	{ name: 'Referrer-Policy', weight: 10 },
	{ name: 'Permissions-Policy', weight: 10 },
	{ name: 'Cross-Origin-Opener-Policy', weight: 5 },
	{ name: 'Cross-Origin-Resource-Policy', weight: 3 },
	{ name: 'Cross-Origin-Embedder-Policy', weight: 2 }
];

function emptyCheckedHeaders() {
	return CHECKED_HEADERS.map((item) => ({
		name: item.name,
		present: false,
		value: null,
		weight: item.weight
	}));
}

function normalizeTarget(input: string) {
	const trimmed = (input || '').trim();
	if (!trimmed) return null;

	let normalized = trimmed;
	if (!/^https?:\/\//i.test(normalized)) {
		normalized = `https://${normalized}`;
	}

	try {
		const url = new URL(normalized);
		const host = url.hostname.toLowerCase();
		const blockedHosts = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
		const isPrivate172 = /^172\.(1[6-9]|2\d|3[01])\./.test(host);
		const isPrivateIp =
			host.startsWith('10.') ||
			host.startsWith('192.168.') ||
			host.startsWith('169.254.');
		if (blockedHosts.includes(host) || isPrivate172 || isPrivateIp) {
			return null;
		}
		return url.toString();
	} catch {
		return null;
	}
}

function getGrade(score: number) {
	if (score >= 85) return 'A';
	if (score >= 70) return 'B';
	if (score >= 50) return 'C';
	return 'D';
}

function friendlyError() {
	return 'Pemindaian header gagal. Coba domain publik lain atau periksa kembali URL yang dimasukkan.';
}

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 8000);
	try {
		return await fetch(url, {
			...options,
			signal: controller.signal,
			redirect: 'follow',
			headers: {
				accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				...(options.headers || {})
			}
		});
	} finally {
		clearTimeout(timeout);
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => null);
		const target = normalizeTarget(body?.url || body?.domain || '');

		if (!target) {
			return json(
				{
					ok: false,
					url: body?.url || '',
					grade: 'D',
					score: 0,
					presentHeaders: [],
					missingHeaders: CHECKED_HEADERS.map((item) => item.name),
					checkedHeaders: emptyCheckedHeaders(),
					summary: 'Masukkan domain atau URL yang valid.',
					error: 'URL atau domain tidak valid.'
				},
				{ status: 400 }
			);
		}

		let response: Response | null = null;
		let fetchError: unknown = null;

		try {
			response = await fetchWithTimeout(target, { method: 'HEAD' });
		} catch (error) {
			fetchError = error;
		}

		if (!response || !response.ok) {
			try {
				response = await fetchWithTimeout(target, { method: 'GET' });
			} catch (error) {
				fetchError = error;
			}
		}

		if (!response) {
			return json(
				{
					ok: false,
					url: target,
					grade: 'D',
					score: 0,
					presentHeaders: [],
					missingHeaders: CHECKED_HEADERS.map((item) => item.name),
					checkedHeaders: emptyCheckedHeaders(),
					summary: friendlyError(),
					error: friendlyError()
				},
				{ status: 502 }
			);
		}

		const presentHeaders: string[] = [];
		const missingHeaders: string[] = [];
		const checkedHeaders = CHECKED_HEADERS.map((item) => {
			const value = response?.headers.get(item.name) || '';
			const present = Boolean(value);
			if (present) presentHeaders.push(item.name);
			else missingHeaders.push(item.name);
			return {
				name: item.name,
				present,
				value: value || null,
				weight: item.weight
			};
		});

		const score = checkedHeaders.reduce((acc, header) => acc + (header.present ? header.weight : 0), 0);
		const grade = getGrade(score);
		const summary =
			missingHeaders.length === 0
				? 'Header security sangat baik. Sebagian besar proteksi browser-side sudah tersedia.'
				: `Ditemukan ${missingHeaders.length} header yang belum ada. Prioritaskan perbaikan pada header penting seperti CSP, HSTS, dan Referrer-Policy.`;

		return json({
			ok: true,
			url: target,
			grade,
			score,
			presentHeaders,
			missingHeaders,
			checkedHeaders,
			summary,
			error: undefined,
			fetchError: fetchError ? friendlyError() : undefined
		});
	} catch {
		return json(
			{
				ok: false,
				url: '',
				grade: 'D',
				score: 0,
					presentHeaders: [],
					missingHeaders: CHECKED_HEADERS.map((item) => item.name),
					checkedHeaders: emptyCheckedHeaders(),
					summary: friendlyError(),
					error: friendlyError()
				},
			{ status: 500 }
		);
	}
};
