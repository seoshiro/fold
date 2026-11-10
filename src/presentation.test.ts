import { describe, expect, it } from 'vitest';
import { contextAtCityCommit, intersects, placeLabel, PosterTransition, storyAppearance } from './presentation';

describe('paper presentation uses one reversible pose', () => {
  it('retains the outgoing city Walk stop until the city presentation actually commits', () => {
    const outgoing = { tab: 'walk' as const, walkStep: 2 }, incoming = { tab: 'places' as const, walkStep: 0 };
    expect(contextAtCityCommit('almaty', 'almaty', outgoing, incoming)).toBe(outgoing);
    expect(contextAtCityCommit('almaty', 'lisbon', outgoing, incoming)).toEqual(incoming);
  });
  it('extends from the selected anchor and is readable only at the unfolded endpoint', () => {
    const folded = storyAppearance(0, { x: 200, y: 150 }, { left: 700, top: 40 });
    expect(folded.transform).toContain('translate3d(-500px,110px,0)');
    expect(folded.opacity).toBe(0); expect(folded.readable).toBe(false); expect(folded.ink).toBe(0);
    const open = storyAppearance(1, { x: 200, y: 150 }, { left: 700, top: 40 });
    expect(open.transform).toContain('translate3d(0px,0px,0)');
    expect(open.transform).toContain('scale(1,1)'); expect(open.readable).toBe(true); expect(open.ink).toBe(1);
    const opening = [.1, .4, .7, .9].map(p => storyAppearance(p, { x: 200, y: 150 }, { left: 700, top: 40 }));
    const closing = [.9, .7, .4, .1].map(p => storyAppearance(p, { x: 200, y: 150 }, { left: 700, top: 40 }));
    expect(closing.reverse()).toEqual(opening);
  });
});

describe('measured label layout', () => {
  const frame = { left: 10, top: 10, right: 390, bottom: 290 };
  it('rejects the full label outside the safe frame even when its anchor is inside', () => {
    expect(placeLabel({ x: 20, y: 100 }, { width: 420, height: 44 }, frame, [], [], true)).toBeNull();
  });
  it('places complete labels apart and clear of panels and actual geometry bounds', () => {
    const geometry = [{ left: 160, top: 120, right: 220, bottom: 160 }];
    const panel = { left: 310, top: 0, right: 400, bottom: 300 };
    const a = placeLabel({ x: 180, y: 145 }, { width: 100, height: 44 }, frame, [panel], geometry)!;
    const b = placeLabel({ x: 185, y: 145 }, { width: 110, height: 44 }, frame, [panel, a.rect], geometry)!;
    expect(a).not.toBeNull(); expect(b).not.toBeNull();
    expect(intersects(a.rect, b.rect)).toBe(false);
    for (const r of [a.rect, b.rect]) {
      expect(intersects(r, panel)).toBe(false); expect(intersects(r, geometry[0], 3)).toBe(false);
    }
  });
  it('hides an unplaceable plaque rather than overlapping geometry', () => {
    expect(placeLabel({ x: 200, y: 150 }, { width: 180, height: 44 }, frame, [], [frame])).toBeNull();
  });
});

describe('atomic fallback poster commit', () => {
  it('retains the current scene until decoded and ignores an older response', async () => {
    const transition = new PosterTransition<string>();
    const finish: Record<string, () => void> = {};
    const load = (src: string) => new Promise<void>(resolve => { finish[src] = resolve; });
    const commits: string[] = [];
    const commit = (city: string, src: string) => commits.push(`${city}:${src}`);
    const first = transition.request('almaty', 'almaty.webp', load, commit, 'crane.svg');
    const last = transition.request('lisbon', 'lisbon.webp', load, commit, 'crane.svg');
    expect(commits).toEqual([]);
    finish['lisbon.webp'](); await last;
    expect(commits).toEqual(['lisbon:lisbon.webp']);
    finish['almaty.webp'](); await first;
    expect(commits).toEqual(['lisbon:lisbon.webp']);
  });
  it('commits a failed target with its neutral placeholder, never the old city image', async () => {
    const transition = new PosterTransition<string>(), result: unknown[] = [];
    await transition.request('kyoto', 'bad.webp', src => src === 'bad.webp' ? Promise.reject(Error('missing')) : Promise.resolve(), (...args) => result.push(args), 'crane.svg');
    expect(result).toEqual([['kyoto', 'crane.svg', true]]);
  });
  it('cancels a pending fallback request on WebGL retry', async () => {
    const transition = new PosterTransition<string>(); let finish!: () => void; let committed = false;
    const pending = transition.request('kyoto', 'k.webp', () => new Promise<void>(resolve => { finish = resolve; }), () => { committed = true; }, 'crane.svg');
    transition.cancel(); finish(); await pending;
    expect(committed).toBe(false);
  });
});
