const API = import.meta.env.VITE_API_URL || '';

export function apiUrl(path) {
  return `${API}${path}`;
}

export function imgUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API}${path}`;
}
