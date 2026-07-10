// NIP-38 user status helpers (kind 30315, d tag = status type).

export const STATUS_KIND = 30315;
export const STATUS_DTAG = 'general';

export function getExpiration(tags: string[][]): number | null {
	const value = tags.find((t) => t[0] === 'expiration')?.[1];
	const n = value ? parseInt(value, 10) : NaN;
	return Number.isFinite(n) ? n : null;
}

export function isExpired(tags: string[][], nowSec: number): boolean {
	const exp = getExpiration(tags);
	return exp !== null && exp <= nowSec;
}

export function relativeTime(createdAt: number, nowSec: number): string {
	const d = Math.max(0, nowSec - createdAt);
	if (d < 60) return 'now';
	if (d < 3600) return `${Math.floor(d / 60)}m`;
	if (d < 86400) return `${Math.floor(d / 3600)}h`;
	return `${Math.floor(d / 86400)}d`;
}

/** Expiration presets for the status editor. Returns a unix timestamp or null. */
export const EXPIRATION_PRESETS: { label: string; expiresAt: (nowSec: number) => number | null }[] = [
	{ label: 'no expiry', expiresAt: () => null },
	{ label: '1h', expiresAt: (now) => now + 3600 },
	{ label: '4h', expiresAt: (now) => now + 4 * 3600 },
	{
		label: 'today',
		expiresAt: () => {
			const end = new Date();
			end.setHours(23, 59, 59, 0);
			return Math.floor(end.getTime() / 1000);
		}
	}
];
