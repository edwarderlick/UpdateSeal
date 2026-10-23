import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('Vercel SPA fallback', () => {
  it('rewrites application routes to index.html after filesystem matches', () => {
    const raw = readFileSync(join(frontendRoot, 'vercel.json'), 'utf8');
    const config = JSON.parse(raw) as {
      rewrites?: Array<{ source: string; destination: string }>;
      routes?: unknown;
    };

    expect(config.routes).toBeUndefined();
    expect(config.rewrites).toEqual([
      { source: '/(.*)', destination: '/index.html' },
    ]);
  });
});
