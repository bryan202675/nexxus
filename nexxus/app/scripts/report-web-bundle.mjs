import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const trackedExtensions = new Set(['.js', '.css', '.png', '.jpg', '.jpeg', '.webp', '.ttf']);

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    return stat.isDirectory() ? walk(path) : [{ path, size: stat.size }];
  });
}

function extname(path) {
  const index = path.lastIndexOf('.');
  return index === -1 ? '' : path.slice(index).toLowerCase();
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

const files = walk(distDir);
const tracked = files.filter((file) => trackedExtensions.has(extname(file.path)));
const total = tracked.reduce((sum, file) => sum + file.size, 0);

console.log(`Web bundle tracked total: ${formatBytes(total)}`);
console.log('Largest files:');
tracked
  .sort((a, b) => b.size - a.size)
  .slice(0, 12)
  .forEach((file) => {
    console.log(`${formatBytes(file.size).padStart(9)}  ${relative(distDir, file.path)}`);
  });
