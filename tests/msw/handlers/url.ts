export const API_URL = 'http://localhost:5236/api';

export function url(path: string): string {
  return `${API_URL}${path}`;
}
