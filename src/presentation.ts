/** Screen-space bridge for the semantic HTML extension of the model's story leaf. */
export type Rect = { left: number; top: number; right: number; bottom: number };
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const ease = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
export type ViewContext = { tab: 'places' | 'walk' | 'notes'; walkStep: number };
export function contextAtCityCommit(visibleCity: string | null, nextCity: string | null, current: ViewContext, intent: ViewContext): ViewContext {
  // A closing story can commit place=null while the outgoing city is still
  // visible. Keep that city's Walk/Notes context until the city itself changes.
  return visibleCity === nextCity ? current : { tab: intent.tab, walkStep: intent.walkStep };
}
export function storyAppearance(progress: number, origin: { x: number; y: number }, sheet: { left: number; top: number }) {
  const p = ease(progress), folded = 1 - p;
  return {
    transform: `translate3d(${(origin.x - sheet.left) * folded}px,${(origin.y - sheet.top) * folded}px,0) perspective(1400px) rotateY(${-67 * folded}deg) rotateZ(${-11 * folded}deg) scale(${.025 + .975 * p},${.012 + .988 * p})`,
    opacity: clamp01(progress * 6),
    ink: ease((progress - .55) / .4),
    readable: progress >= .97,
  };
}
export const intersects = (a: Rect, b: Rect, gap = 6) => a.left < b.right + gap && a.right + gap > b.left && a.top < b.bottom + gap && a.bottom + gap > b.top;
/** Uses the complete measured label, not only its anchor. Hidden labels retain list controls. */
export function placeLabel(point: { x: number; y: number }, size: { width: number; height: number }, frame: Rect, occupied: Rect[], geometry: Rect[], cityLabel = false): { x: number; y: number; rect: Rect } | null {
  const offsets = cityLabel ? [[0, 0], [0, -34], [0, 34]] : [[0, -45], [0, 45], [-size.width / 2 - 26, 0], [size.width / 2 + 26, 0], [0, -78], [0, 78]];
  for (const [dx, dy] of offsets) {
    const x = point.x + dx, y = point.y + dy;
    const rect = { left: x - size.width / 2, right: x + size.width / 2, top: y - size.height / 2, bottom: y + size.height / 2 };
    if (rect.left < frame.left || rect.right > frame.right || rect.top < frame.top || rect.bottom > frame.bottom) continue;
    if (occupied.some(r => intersects(rect, r))) continue;
    if (!cityLabel && geometry.some(r => intersects(rect, r, 3))) continue;
    return { x, y, rect };
  }
  return null;
}
/** Latest intent wins even if an older poster resolves after the newer image. */
export class PosterTransition<T> {
  private version = 0;
  async request(value: T, src: string, load: (src: string) => Promise<void>, commit: (value: T, src: string, failed: boolean) => void, placeholder: string) {
    const version = ++this.version;
    let actual = src, failed = false;
    try { await load(src); } catch {
      actual = placeholder; failed = true;
      try { await load(placeholder); } catch { /* Plain paper remains a usable failure state. */ }
    }
    if (version === this.version) commit(value, actual, failed);
  }
  cancel() { this.version++; }
}
export async function preloadPoster(src: string) {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve(); image.onerror = () => reject(new Error('Poster failed to load')); image.src = src;
  });
  if (image.decode) await image.decode();
}
