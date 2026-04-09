export function formatInitials(value: string | null | undefined): string {
  if (!value) return '?';
  return value
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
