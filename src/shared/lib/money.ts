export const LOCKS_PER_DL = 100;
export const DL_PER_BGL = 100;
export const LOCKS_PER_BGL = LOCKS_PER_DL * DL_PER_BGL;

const idrFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

export function formatIdr(value: number): string {
  return `Rp ${idrFormatter.format(value)}`;
}

export function formatLocks(totalLocks: number): string {
  return formatLockUnits(totalLocks);
}

export function formatDlWl(totalLocks: number): string {
  return formatLockUnits(totalLocks);
}

export function formatLockUnits(totalLocks: number): string {
  const normalized = Math.max(0, Math.trunc(totalLocks));
  const bgl = Math.floor(normalized / LOCKS_PER_BGL);
  const afterBgl = normalized % LOCKS_PER_BGL;
  const dl = Math.floor(afterBgl / LOCKS_PER_DL);
  const wl = afterBgl % LOCKS_PER_DL;

  if (bgl === 0 && dl === 0 && wl === 0) return "0 wl";

  const parts: string[] = [];
  if (bgl > 0) parts.push(`${bgl} bgl`);
  if (dl > 0) parts.push(`${dl} dl`);
  if (wl > 0) parts.push(`${wl} wl`);
  return parts.join(" ");
}

export function locksFromIdr(amountIdr: number, rateIdrPerDl: number): number {
  if (amountIdr <= 0 || rateIdrPerDl <= 0) return 0;
  return Math.floor((amountIdr / rateIdrPerDl) * LOCKS_PER_DL);
}

export function calculateFee(amountIdr: number, percent: number): number {
  if (amountIdr <= 0 || percent <= 0) return 0;
  return Math.ceil(amountIdr * (percent / 100));
}

export function parsePositiveInteger(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
