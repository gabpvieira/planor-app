/**
 * Timezone utilities for Brasília (UTC-3)
 */

export const BRASILIA_TIMEZONE = 'America/Sao_Paulo';
export const BRASILIA_UTC_OFFSET = -3;

/**
 * Get current date/time in Brasília timezone
 */
export function getBrasiliaDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BRASILIA_TIMEZONE }));
}

/**
 * Convert any date to Brasília timezone
 */
export function toBrasiliaDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.toLocaleString('en-US', { timeZone: BRASILIA_TIMEZONE }));
}

/**
 * Get current date in YYYY-MM-DD format (Brasília timezone)
 */
export function getBrasiliaDateString(): string {
  const date = getBrasiliaDate();
  return date.toISOString().split('T')[0];
}

/**
 * Format date to ISO string in Brasília timezone
 */
export function toBrasiliaISOString(date?: Date): string {
  const d = date || getBrasiliaDate();
  return new Date(d.toLocaleString('en-US', { timeZone: BRASILIA_TIMEZONE })).toISOString();
}

/**
 * Get start of day in Brasília timezone
 */
export function getBrasiliaStartOfDay(date?: Date | string): Date {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : getBrasiliaDate();
  const brasiliaDate = toBrasiliaDate(d);
  brasiliaDate.setHours(0, 0, 0, 0);
  return brasiliaDate;
}

/**
 * Get end of day in Brasília timezone
 */
export function getBrasiliaEndOfDay(date?: Date | string): Date {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : getBrasiliaDate();
  const brasiliaDate = toBrasiliaDate(d);
  brasiliaDate.setHours(23, 59, 59, 999);
  return brasiliaDate;
}

/**
 * Format date for display in Brazilian format
 */
export function formatBrasilianDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    ...options
  });
}

/**
 * Format datetime for display in Brazilian format
 */
export function formatBrasilianDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    timeZone: BRASILIA_TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'short'
  });
}
