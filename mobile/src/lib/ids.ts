export const generateId = () =>
  Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

export function formatDateTimeFr(value: string): string {
  return new Date(value).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}
