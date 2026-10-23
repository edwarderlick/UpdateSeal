import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(frontendRoot, 'dist');
const vercelPath = join(frontendRoot, 'vercel.json');

const vercel = JSON.parse(readFileSync(vercelPath, 'utf8'));
const rewrite = vercel.rewrites?.[0];
if (rewrite?.source !== '/(.*)' || rewrite?.destination !== '/index.html') {
  throw new Error('frontend/vercel.json must rewrite /(.*) to /index.html');
}

if (!existsSync(join(distRoot, 'index.html'))) {
  throw new Error('dist/index.html is missing; run npm run build first');
}

function distFileExists(urlPath) {
  const relativePath = urlPath.replace(/^\//, '');
  const candidate = join(distRoot, relativePath);
  const rel = relative(distRoot, candidate);
  if (rel.startsWith('..') || rel.includes('\0')) {
    return false;
  }
  return existsSync(candidate) && statSync(candidate).isFile();
}

const spaRoutes = [
  '/registry',
  '/verify',
  '/packages/0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal',
  '/packages/0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal/candidates/0.1.0-v2-smoke',
  '/packages/0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal/candidates/0.1.0-v2-smoke/decision',
  '/dashboard',
];

for (const route of spaRoutes) {
  if (distFileExists(route)) {
    throw new Error(`${route} unexpectedly exists as a static file in dist`);
  }
}

const indexHtml = readFileSync(join(distRoot, 'index.html'), 'utf8');
const assetHrefs = [...indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
if (assetHrefs.length === 0) {
  throw new Error('dist/index.html has no /assets/ references');
}

for (const href of assetHrefs) {
  if (!distFileExists(href)) {
    throw new Error(`hashed asset missing: ${href}`);
  }
  const bytes = readFileSync(join(distRoot, href.replace(/^\//, '')), 'utf8');
  if (bytes.includes('<div id="root"') && bytes.includes('index.html')) {
    throw new Error(`${href} looks like index.html rather than a static asset`);
  }
}

console.log(
  JSON.stringify({
    ok: true,
    rewrite,
    spaRoutesChecked: spaRoutes.length,
    assetsChecked: assetHrefs,
  }),
);
