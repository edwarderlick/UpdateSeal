const REOWN_HINTS = ['reown', 'walletconnect project', 'project id', 'wc_project'];

function firstLine(text: string): string {
  const withoutStack = text
    .split('\n')
    .filter((line) => !/^\s*at\s+/.test(line))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return withoutStack.slice(0, 280);
}

export function isWalletRejection(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    const text = String(error).toLowerCase();
    return text.includes('user rejected') || text.includes('user denied') || text.includes('rejected the request');
  }
  const record = error as { code?: unknown; message?: unknown };
  if (record.code === 4001 || record.code === '4001' || record.code === 'ACTION_REJECTED') {
    return true;
  }
  const message = String(record.message ?? '').toLowerCase();
  return (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('rejected the request') ||
    message.includes('request rejected')
  );
}

export function isReceiptTimeout(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return lower.includes('timed out waiting for transaction') || lower.includes('timed out waiting for');
}

export function sanitizeUserError(error: unknown, fallback = 'Registration could not be completed.'): string {
  if (!error) {
    return fallback;
  }
  const raw = error instanceof Error ? error.message : String(error);
  const cleaned = firstLine(raw);
  const lower = cleaned.toLowerCase();
  if (REOWN_HINTS.some((hint) => lower.includes(hint))) {
    return fallback;
  }
  if (!cleaned) {
    return fallback;
  }
  return cleaned;
}
