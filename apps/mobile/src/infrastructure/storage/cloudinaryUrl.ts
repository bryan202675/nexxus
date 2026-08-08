export function cloudinaryOptimizedUrl(url?: string | null, width = 256) {
  if (!url || !url.includes('/upload/')) return url || '';
  const transform = `f_auto,q_auto,dpr_auto,w_${Math.max(64, Math.round(width))},c_limit`;
  return url.replace('/upload/', `/upload/${transform}/`);
}
