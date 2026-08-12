export const MINIMUM_AGE = 21;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseBirthDate(value: unknown): Date | null {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

export function isAtLeastAge(birthDate: Date, age = MINIMUM_AGE, now = new Date()): boolean {
  const cutoff = new Date(Date.UTC(now.getUTCFullYear() - age, now.getUTCMonth(), now.getUTCDate()));
  return birthDate <= cutoff;
}

export function latestEligibleBirthDate(age = MINIMUM_AGE, now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear() - age, now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);
}
