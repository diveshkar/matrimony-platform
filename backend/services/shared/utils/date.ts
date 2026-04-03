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
