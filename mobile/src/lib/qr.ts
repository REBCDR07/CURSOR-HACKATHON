function tokenFromUrl(raw: string): string | null {
  try {
    const url = new URL(raw);

    const explicit = url.searchParams.get('token');
    if (explicit) return explicit.trim();

    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return null;

    const shareIndex = parts.findIndex((p) => p === 'shared' || p === 'partage');
    if (shareIndex >= 0 && parts[shareIndex + 1]) {
      return decodeURIComponent(parts[shareIndex + 1]).trim();
    }

    return decodeURIComponent(parts[parts.length - 1]).trim();
  } catch {
    return null;
  }
}

export function extractTokenFromQRData(data: string): string | null {
  const raw = data.trim();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { token?: unknown };
    if (typeof parsed?.token === 'string' && parsed.token.trim()) {
      return parsed.token.trim();
    }
  } catch {
    // continue with non-JSON formats
  }

  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('healthpocket://')) {
    return tokenFromUrl(raw);
  }

  if (raw.startsWith('token=')) {
    const value = raw.slice('token='.length).trim();
    return value || null;
  }

  return raw;
}
