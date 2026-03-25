export function formatDate(value: string | null): string {
  if (!value) {
    return 'Sin dato';
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return 'Sin dato';
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
