export function nowISO(): string {
  return new Date().toISOString();
}

export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

export function ttlFromDays(days: number): number {
  return nowUnix() + days * 86400;
}

export function ttlFromMinutes(minutes: number): number {
  return nowUnix() + minutes * 60;
}

// For launch period
const LAUNCH_START = new Date('2026-04-30T00:00:00Z');
const LAUNCH_END = new Date('2026-05-15T00:00:00Z');

export function isLaunchPeriod(): boolean {
  const now = new Date();
  return now >= LAUNCH_START && now <= LAUNCH_END;
}
