import { afterEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { FoldScene, type CityId, type FoldTarget } from './scene';

// Exercise the real navigation/pose methods without constructing a canvas, renderer,
// browser, loader or RAF loop. Timeline time is advanced explicitly, never wall-clocked.
type Headless = any;
const fixtures: Headless[] = [];
function fixture(): Headless {
  const instance = Object.create(FoldScene.prototype) as Headless;
  const orbit = new THREE.Group(), model = new THREE.Group(), wing = new THREE.Group();
  orbit.add(model); model.add(wing); wing.position.set(-.9, .69, .23); wing.rotation.z = .17;
  const story = new THREE.Group(); wing.add(story); story.position.set(3.7, .04, 1.18);
  const anchors = new Map<string, THREE.Object3D>();
  const cityRoots = new Map<CityId, THREE.Object3D>();
  const positions: Record<CityId, number[][]> = {
    kyoto: [[2.56, .96, .05], [1.6, .65, 1.5], [2.8, .37, 1.25]],
    lisbon: [[2.55, .95, .75], [2.18, .62, 1.32], [3.88, .91, .85]],
    almaty: [[2.93, 1.42, .8], [1.76, .58, .51], [3, 1.42, -.08]],
  };
  for (const city of Object.keys(positions) as CityId[]) {
    const root = new THREE.Group(); root.position.y = .025; wing.add(root); cityRoots.set(city, root);
    positions[city].forEach((position, index) => {
      const anchor = new THREE.Object3D(); anchor.position.fromArray(position); root.add(anchor);
      anchors.set(`${city}-poi-${index}`, anchor);
    });
  }
  Object.assign(instance, {
    orbit, model, anchors, cityRoots, story, storyOriginal: story.position.clone(),
    ready: true, disposed: false, startedIntro: true, state: 'city',
    options: { onState() {} }, presentation: { city: 'kyoto', place: null }, activeStory: null, transition: null, viewTween: null,
    width: 1366, height: 650, covers: [], hinges: new Map(),
    neckPivot: new THREE.Group(), tailPivot: new THREE.Group(),
    projected: new THREE.Vector3(), focusPoint: new THREE.Vector3(),
    camera: new THREE.OrthographicCamera(-6, 6, 4, -4, .1, 100),
    target: { city: 'kyoto', place: null, focus: null, reducedMotion: false },
    pose: { wing: 1, kyoto: 1, lisbon: 0, almaty: 0, story: 0, view: 1, intro: 1,
      dragX: 0, dragY: 0, zoom: 1, focus: 0, focusX: 0, focusY: 0, focusZ: 0,
      storyX: story.position.x, storyZ: story.position.z },
  });
  orbit.updateMatrixWorld(true); instance.applyPose(); fixtures.push(instance); return instance;
}
function change(s: Headless, patch: Partial<FoldTarget>) {
  s.setTarget({ ...s.target, ...patch });
  s.transition.pause();
  s.applyPose();
}
function advance(s: Headless, seconds: number) {
  s.transition.time(seconds, false); s.applyPose(); s.orbit.updateMatrixWorld(true);
}
function settle(s: Headless) { advance(s, s.transition.duration()); }
function camera(s: Headless) { return s.camera.position.clone() as THREE.Vector3; }
function storyPosition(s: Headless) { return s.story.position.clone() as THREE.Vector3; }
function same(a: THREE.Vector3, b: THREE.Vector3) { expect(a.distanceTo(b)).toBeLessThan(1e-10); }
function expectedStory(s: Headless, city: CityId, index: number) {
  const anchor = s.anchors.get(`${city}-poi-${index}`) as THREE.Object3D;
  const local = s.story.parent.worldToLocal(anchor.getWorldPosition(new THREE.Vector3()));
  return new THREE.Vector3(local.x + .1, s.storyOriginal.y + .015, local.z + .07);
}
function expectOriginalFocusEndpoint(s: Headless, city: CityId, index: number) {
  const point = (s.anchors.get(`${city}-poi-${index}`) as THREE.Object3D).getWorldPosition(new THREE.Vector3());
  // Same settled camera endpoint as the original implementation, including view=1.
  const expected = new THREE.Vector3(.25 + 2.45 + (point.x - 2.2) * .15 + 1.3,
    1.88 - .10 + (point.y - 1.4) * .13 + 5.7 + .2, -.20 + 12.5);
  expect(camera(s).distanceTo(expected)).toBeLessThan(1e-6);
}
afterEach(() => {
  for (const s of fixtures.splice(0)) s.transition?.kill();
  gsap.globalTimeline.clear(); gsap.ticker.sleep();
});

describe('scene retargeting continuity, deterministic GSAP time', () => {
  it('moves between settled Walk stops without an immediate camera jump', () => {
    const s = fixture(); change(s, { focus: 0 }); settle(s);
    expectOriginalFocusEndpoint(s, 'kyoto', 0);
    const before = camera(s);
    change(s, { focus: 1 }); same(camera(s), before);
    advance(s, .001); expect(camera(s).distanceTo(before)).toBeLessThan(1e-6);
    advance(s, .35); expect(camera(s).distanceTo(before)).toBeGreaterThan(.001);
    settle(s); expectOriginalFocusEndpoint(s, 'kyoto', 1);
  });

  it('rebases rapid Walk changes and a focused city switch from the current camera', () => {
    const s = fixture(); change(s, { focus: 0 }); settle(s);
    change(s, { focus: 1 }); advance(s, .23);
    let before = camera(s); change(s, { focus: 2 }); same(camera(s), before);
    advance(s, .17); before = camera(s);
    change(s, { city: 'lisbon', focus: 1 }); same(camera(s), before);
    settle(s); expectOriginalFocusEndpoint(s, 'lisbon', 1);
    before = camera(s); change(s, { city: 'almaty', focus: null }); same(camera(s), before);
    advance(s, .35); expect(s.pose.focus).toBeGreaterThan(0);
    settle(s); expect(s.pose.focus).toBe(0);
  });

  it('fades focus on return to the crane and keeps drag-aware focused endpoints', () => {
    const s = fixture(); change(s, { focus: 2 }); settle(s);
    s.pose.dragX = .21; s.pose.dragY = -.08; s.applyPose();
    expectOriginalFocusEndpoint(s, 'kyoto', 2);
    const before = camera(s); change(s, { city: null, focus: null }); same(camera(s), before);
    advance(s, .2); same(camera(s), before); // Home framing begins at the existing .4s cue.
    settle(s); expect(s.pose.focus).toBe(0);
    expect(camera(s).distanceTo(new THREE.Vector3(1.55, 7.58, 12.3))).toBeLessThan(1e-10);
  });

  it('keeps the visible story at its old origin until folded, then opens the new origin', () => {
    const s = fixture(); change(s, { place: 0 }); settle(s);
    const old = storyPosition(s), rotation = s.story.rotation.x;
    change(s, { place: 1 }); same(storyPosition(s), old); expect(s.story.rotation.x).toBe(rotation);
    advance(s, .125); same(storyPosition(s), old); expect(s.pose.story).toBeGreaterThan(0);
    advance(s, .42); expect(s.pose.story).toBe(0); expect(s.story.visible).toBe(false);
    expect(storyPosition(s).distanceTo(expectedStory(s, 'kyoto', 1))).toBeLessThan(1e-6);
    settle(s); expect(s.pose.story).toBe(1); expect(s.story.visible).toBe(true);
  });

  it('preserves the live origin while closing and through interrupted story replacements', () => {
    const s = fixture(); change(s, { place: 0 }); settle(s);
    const original = storyPosition(s);
    change(s, { place: null }); same(storyPosition(s), original);
    advance(s, .1); same(storyPosition(s), original);
    change(s, { place: 1 }); same(storyPosition(s), original);
    advance(s, .12); same(storyPosition(s), original);
    change(s, { place: 2 }); same(storyPosition(s), original);
    advance(s, .42); expect(s.pose.story).toBe(0);
    expect(storyPosition(s).distanceTo(expectedStory(s, 'kyoto', 2))).toBeLessThan(1e-6);
    advance(s, .6); const reopening = storyPosition(s), currentAngle = s.story.rotation.x;
    change(s, { place: 1 }); same(storyPosition(s), reopening); expect(s.story.rotation.x).toBe(currentAngle);
    settle(s); expect(storyPosition(s).distanceTo(expectedStory(s, 'kyoto', 1))).toBeLessThan(1e-6);
  });

  it('cancels pending relocation when the latest intent returns to the displayed story', () => {
    const s = fixture(); change(s, { place: 0 }); settle(s);
    const original = storyPosition(s);
    change(s, { place: 1 }); advance(s, .12);
    change(s, { place: 0 }); same(storyPosition(s), original);
    settle(s); same(storyPosition(s), original); expect(s.pose.story).toBe(1);
  });

  it('folds before relocating across cities, including reduced motion', () => {
    for (const reducedMotion of [false, true]) {
      const s = fixture(); change(s, { place: 0, reducedMotion }); settle(s);
      const original = storyPosition(s);
      change(s, { city: 'almaty', place: 2 }); same(storyPosition(s), original);
      advance(s, .42 * (reducedMotion ? .12 : 1));
      expect(s.pose.story).toBe(0); expect(s.story.visible).toBe(false);
      settle(s); expect(storyPosition(s).distanceTo(expectedStory(s, 'almaty', 2))).toBeLessThan(1e-6);
      expect(s.pose.story).toBe(1);
    }
  });
});

describe('scene owns semantic presentation milestones', () => {
  it('retains story identity and origin through the complete reverse fold', () => {
    const s = fixture(), events: any[] = [];
    s.options.onPresentation = (p: unknown) => events.push(p);
    change(s, { place: 0 }); advance(s, .02);
    expect(events).toEqual([]);
    settle(s); expect(s.presentation).toEqual({ city: 'kyoto', place: 0 });
    const origin = storyPosition(s);
    change(s, { place: null }); advance(s, .40);
    expect(s.presentation).toEqual({ city: 'kyoto', place: 0 }); same(storyPosition(s), origin);
    expect(s.pose.story).toBeGreaterThan(0);
    settle(s); expect(s.pose.story).toBe(0);
    expect(s.presentation).toEqual({ city: 'kyoto', place: null }); same(storyPosition(s), origin);
  });

  it('commits the new city only after the old geometry closes and hides new copy until its rise', () => {
    const s = fixture(); change(s, { place: 0 }); settle(s);
    change(s, { city: 'lisbon', place: 2 }); advance(s, .30);
    expect(s.presentation).toEqual({ city: 'kyoto', place: 0 });
    advance(s, .65); expect(s.pose.kyoto).toBe(0); expect(s.presentation.city).toBe('kyoto');
    advance(s, .67); expect(s.presentation).toEqual({ city: 'lisbon', place: null });
    let frame: any; s.options.onFrame = (value: unknown) => { frame = value; };
    s.updatePresentationFrame(); expect(frame.panel).toBe(0);
    advance(s, 1.44); expect(s.presentation).toEqual({ city: 'lisbon', place: 2 });
    settle(s); s.updatePresentationFrame(); expect(frame.panel).toBe(1); expect(frame.story).toBe(1);
  });

  it('kills pending city/story commits on rapid reversal and settles only the latest full context', () => {
    const s = fixture(), settled: any[] = [];
    s.options.onSettled = (value: unknown) => settled.push(value);
    change(s, { city: 'lisbon', place: 1, context: 'old' }); advance(s, .40);
    change(s, { city: 'almaty', place: 2, context: 'middle' }); advance(s, .55);
    change(s, { city: 'kyoto', place: 0, context: 'latest' }); settle(s);
    expect(s.presentation).toEqual({ city: 'kyoto', place: 0 });
    expect(settled.map(t => t.context)).toEqual(['latest']);
    change(s, { context: 'same-pose-new-tab' });
    expect(settled.at(-1).context).toBe('same-pose-new-tab');
  });

  it('unfolds the whole real wing during intro and skip settles it immediately', () => {
    const s = fixture(); s.startedIntro = false; s.wingPivot = new THREE.Group();
    s.target = { city: null, place: null, reducedMotion: false }; s.pose.wing = 0;
    change(s, { intro: true }); expect(s.wingPivot.rotation.z).toBeCloseTo(1.12);
    advance(s, 1.5); expect(s.wingPivot.rotation.z).toBeGreaterThan(.1); expect(s.wingPivot.rotation.z).toBeLessThan(1.1);
    expect(s.pose.wing).toBe(0); // No empty-city cover pulse.
    s.skipIntro(); s.applyPose(); expect(s.wingPivot.rotation.z).toBe(0); expect(s.state).toBe('crane');
  });

  it('keeps automatic mobile framing continuous across city and story visibility thresholds', () => {
    const s = fixture(); s.width = 390; s.height = 300;
    const body = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 2)); s.model.add(body);
    const city = s.cityRoots.get('kyoto'); city.name = 'CITY_kyoto';
    const extra = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)); extra.position.x = 20; city.add(extra);
    s.story.name = 'STORY_TAB';
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1)); s.story.add(leaf);
    const corners = (mesh: THREE.Mesh) => {
      mesh.geometry.computeBoundingBox(); const b = mesh.geometry.boundingBox!; const points: THREE.Vector3[] = [];
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) points.push(new THREE.Vector3(x, y, z));
      return points;
    };
    s.framingBounds = new Map([body, extra, leaf].map(mesh => [mesh, corners(mesh)]));
    s.pose.kyoto = .001999; s.applyPose(); const beforeCity = s.camera.top, position = camera(s);
    s.pose.kyoto = .002001; s.applyPose();
    expect(Math.abs(s.camera.top - beforeCity)).toBeLessThan(.001); expect(camera(s).distanceTo(position)).toBeLessThan(.001);
    s.pose.storyX = 30; s.pose.story = .003999; s.applyPose(); const beforeStory = s.camera.top;
    s.pose.story = .004001; s.applyPose(); expect(Math.abs(s.camera.top - beforeStory)).toBeLessThan(.002);
  });
});

describe('retargets before the city presentation cue', () => {
  it('does not lose a city commit when a story is cancelled while the city is still opening', () => {
    const s = fixture(); s.presentation = { city: null, place: null };
    s.target = { city: null, place: null, reducedMotion: false }; s.pose.kyoto = 0; s.pose.wing = 0;
    change(s, { city: 'kyoto', place: 0 }); advance(s, .20);
    change(s, { place: null }); expect(s.presentation.city).toBe(null);
    settle(s); expect(s.presentation).toEqual({ city: 'kyoto', place: null });
  });
  it('waits for architecture when a same-city story is requested midway through opening', () => {
    const s = fixture(); s.presentation = { city: null, place: null };
    s.target = { city: null, place: null, reducedMotion: false }; s.pose.kyoto = 0; s.pose.wing = 0;
    change(s, { city: 'kyoto' }); advance(s, .70);
    expect(s.presentation.city).toBe('kyoto'); expect(s.pose.kyoto).toBeLessThan(.5);
    change(s, { place: 2 }); advance(s, .50);
    expect(s.presentation.place).toBe(null); expect(s.pose.story).toBe(0);
    settle(s); expect(s.presentation).toEqual({ city: 'kyoto', place: 2 });
  });
});
