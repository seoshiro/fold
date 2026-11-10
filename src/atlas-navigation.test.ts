import { describe, expect, it } from "vitest";
import {
  ATLAS_HISTORY_KEY,
  atlasNavigationUrl,
  createAtlasNavigationStore,
  initialAtlasNavigation,
  readAtlasHistoryState,
  type AtlasNavigation,
  type AtlasNavigationEnvironment,
  type AtlasView,
} from "./navigation";

const base = "https://seoshiro.github.io/fold/";
const defaultNav: AtlasNavigation = { city: null, place: null, tab: "places", walkStep: 0 };
const view = (y = 0, focusKey: string | null = null): AtlasView => ({ scroll: { x: 0, y }, focusKey });
const clone = <T,>(value: T): T => structuredClone(value);

function browser(href = base, state: unknown = null) {
  const entries = [{ href, state }];
  let index = 0;
  let sequence = 0;
  let currentView = view();
  let onPop = () => {};
  let onView = () => {};
  let onExit = () => {};
  let clock = 0;
  let writes = 0;
  let backCalls = 0;
  let queuedBack = false;
  let rejectWrite = false;
  const restored: { context: AtlasNavigation; view: AtlasView }[] = [];
  const env: AtlasNavigationEnvironment = {
    href: () => entries[index].href,
    state: () => clone(entries[index].state),
    push: (next, url) => {
      if (rejectWrite) throw Error("history disabled");
      entries.splice(index + 1, Infinity, { href: new URL(url, entries[index].href).href, state: clone(next) });
      index++;
    },
    replace: (next, url) => {
      if (rejectWrite) throw Error("history disabled");
      writes++;
      entries[index] = { href: new URL(url, entries[index].href).href, state: clone(next) };
    },
    back: () => { backCalls++; queuedBack = true; },
    readView: () => clone(currentView),
    restoreView: (next, context) => {
      currentView = { scroll: { ...next.scroll }, focusKey: next.focusKey };
      restored.push({ context: clone(context), view: clone(currentView) });
      onView(); // browser focus/scroll events can fire synchronously during restoration
    },
    listen: (pop, changedView, exit) => {
      onPop = pop; onView = changedView; onExit = exit;
      return () => { onPop = () => {}; onView = () => {}; onExit = () => {}; };
    },
    makeId: () => `test_${++sequence}`,
    now: () => clock,
  };
  const traverse = (delta: number, beforePop?: () => void) => {
    index += delta;
    if (index < 0 || index >= entries.length) throw Error("outside FOLD history");
    beforePop?.();
    onPop();
  };
  return {
    env, restored, entries,
    get index() { return index; },
    get backCalls() { return backCalls; },
    get writes() { return writes; },
    tick: (ms: number) => { clock += ms; },
    pagehide: () => onExit(),
    get currentView() { return currentView; },
    setView: (next: AtlasView, notify = true) => { currentView = clone(next); if (notify) onView(); },
    traverse,
    flushBack: () => { if (queuedBack) { queuedBack = false; traverse(-1); } },
    corrupt: (next: unknown) => { entries[index].state = clone(next); },
    rejectWrites: () => { rejectWrite = true; },
  };
}
function started(href = base, state: unknown = null) {
  const b = browser(href, state);
  const store = createAtlasNavigationStore(b.env);
  store.start();
  const settle = () => {
    const pending = store.getSnapshot().pendingRestore;
    if (pending) expect(store.completeRestore(pending.id)).toBe(true);
  };
  settle();
  return { b, store, settle };
}
function openBazaarWalk() {
  const result = started();
  result.store.navigate({ city: "almaty", place: null });
  result.settle();
  result.store.setTab("walk");
  result.store.setWalkStep(1);
  result.b.setView(view(532, "walk:almaty:1"));
  result.store.navigate({ city: "almaty", place: "bazaar" });
  result.settle();
  return result;
}

describe("validated, language-independent atlas context", () => {
  it("reads deep-linked tab and one-based stop while preserving the original navigation API", () => {
    expect(initialAtlasNavigation(base + "?city=almaty&place=bazaar&tab=walk&stop=2")).toEqual({
      city: "almaty", place: "bazaar", tab: "walk", walkStep: 1,
    });
    expect(atlasNavigationUrl({ city: "almaty", place: "bazaar", tab: "walk", walkStep: 1 }, base + "?qa=1#content"))
      .toBe("/fold/?qa=1&city=almaty&place=bazaar&tab=walk&stop=2#content");
  });
  it.each(["-1", "0", "4", "2.5", "NaN", "Infinity", "1e1", "02", "999999999999999999999999"])("rejects malformed stop %s", (stop) => {
    expect(initialAtlasNavigation(base + `?city=almaty&tab=walk&stop=${stop}`).walkStep).toBe(0);
  });
  it("rejects translated IDs, foreign place pairs and tabs, and context without a city", () => {
    expect(initialAtlasNavigation(base + "?city=Алматы&place=bazaar&tab=walk&stop=2")).toEqual(defaultNav);
    expect(initialAtlasNavigation(base + "?city=kyoto&place=bazaar&tab=Прогулка&stop=2")).toEqual({
      city: "kyoto", place: null, tab: "places", walkStep: 1,
    });
  });
  it("does not restore copied state, old schema versions, invalid focus selectors or out-of-range values", () => {
    const { b } = openBazaarWalk();
    const href = b.env.href();
    const valid = b.env.state() as Record<string, any>;
    expect(readAtlasHistoryState(valid, href)).not.toBeNull();
    expect(readAtlasHistoryState(valid, base + "?city=kyoto")).toBeNull();
    for (const mutate of [
      (s: any) => { s.version = 2; },
      (s: any) => { s.context.walkStep = 3; },
      (s: any) => { s.context.tab = ["walk"]; },
      (s: any) => { s.view.scroll.y = -1; },
      (s: any) => { s.view.scroll.y = Infinity; },
      (s: any) => { s.view.focusKey = 'button[onclick="bad"]'; },
      (s: any) => { s.context.place = "gion"; },
      (s: any) => { s.parent.url = "https://example.com/"; },
      (s: any) => { s.parent.id = s.id; },
    ]) {
      const invalid = clone(valid);
      mutate(invalid[ATLAS_HISTORY_KEY]);
      expect(readAtlasHistoryState(invalid, href)).toBeNull();
    }
  });
});

describe("context-preserving history store", () => {
  it("restores the exact reported Almaty → walk stop 2 → Bazaar → browser Back journey", () => {
    const { b, store, settle } = openBazaarWalk();
    b.setView(view(270, "story:almaty:bazaar"));
    b.traverse(-1);
    expect(store.getSnapshot().nav).toEqual({ city: "almaty", place: null, tab: "walk", walkStep: 1 });
    expect(store.getSnapshot().pendingRestore).toMatchObject({ scroll: { x: 0, y: 532 }, focusKey: "walk:almaty:1" });
    expect(b.currentView.scroll.y).toBe(270); // not restored while reverse fold is still running
    settle();
    expect(b.currentView).toEqual(view(532, "walk:almaty:1"));
    b.traverse(1);
    settle();
    expect(store.getSnapshot().nav.place).toBe("bazaar");
    expect(b.currentView).toEqual(view(270, "story:almaty:bazaar"));
  });
  it("persists outgoing scroll and focus immediately, without overwriting the popstate destination", () => {
    const { b, store, settle } = openBazaarWalk();
    b.setView(view(912, "story:almaty:bazaar"));
    b.traverse(-1, () => b.setView(view(999, "story:almaty:bazaar")));
    expect(store.getSnapshot().pendingRestore?.scroll.y).toBe(532);
    b.setView(view(888, "story:almaty:bazaar")); // outgoing story still on screen during exit
    expect(readAtlasHistoryState(b.env.state(), b.env.href())?.view.scroll.y).toBe(532);
    settle();
    expect(b.currentView.scroll.y).toBe(532);
  });
  it("app Back returns to the known parent entry without adding duplicate history", () => {
    const { b, store, settle } = openBazaarWalk();
    const count = b.entries.length;
    store.back(); store.back();
    expect(b.backCalls).toBe(1);
    b.flushBack(); settle();
    expect(b.entries).toHaveLength(count);
    expect(b.currentView).toEqual(view(532, "walk:almaty:1"));
    expect(store.getSnapshot().nav.walkStep).toBe(1);
  });
  it("restores city-to-home focus and scroll using its original entry", () => {
    const { b, store, settle } = started();
    b.setView(view(180, "city:kyoto"));
    store.navigate({ city: "kyoto", place: null }); settle();
    store.back(); b.flushBack(); settle();
    expect(store.getSnapshot().nav).toEqual(defaultNav);
    expect(b.currentView).toEqual(view(180, "city:kyoto"));
  });
  it("retains tab/stop on same-city story changes and resets only when the city actually changes", () => {
    const { store, settle } = openBazaarWalk();
    store.navigate({ place: "koktobe" }); settle();
    expect(store.getSnapshot().nav).toMatchObject({ tab: "walk", walkStep: 1 });
    store.navigate({ city: "kyoto", place: "gion" }); settle();
    expect(store.getSnapshot().nav).toEqual({ city: "kyoto", place: "gion", tab: "places", walkStep: 0 });
  });
  it("replaces tab/stop context in the current entry and supports functional setters", () => {
    const { b, store } = started(base + "?city=almaty");
    store.setTab("walk"); store.setWalkStep((step) => step + 1);
    store.setTab("notes");
    expect(b.entries).toHaveLength(1);
    expect(b.env.href()).toBe(base + "?city=almaty&tab=notes&stop=2");
    expect(store.getSnapshot().pendingRestore).toBeNull();
    const reload = started(b.env.href(), b.env.state());
    expect(reload.store.getSnapshot().nav).toEqual({ city: "almaty", place: null, tab: "notes", walkStep: 1 });
  });
  it("reload restores validated entry view and contextual Back uses stored parent without risking external traversal", () => {
    const { b } = openBazaarWalk();
    b.setView(view(345, "story:almaty:bazaar"));
    b.pagehide();
    const reloaded = started(b.env.href(), b.env.state());
    expect(reloaded.b.currentView).toEqual(view(345, "story:almaty:bazaar"));
    reloaded.store.back(); reloaded.settle();
    expect(reloaded.b.backCalls).toBe(0);
    expect(reloaded.store.getSnapshot().nav).toMatchObject({ tab: "walk", walkStep: 1, place: null });
    expect(reloaded.b.currentView).toEqual(view(532, "walk:almaty:1"));
  });
  it("deep-link Back stays in the app with the linked tab and stop even when prior history is foreign", () => {
    const { b, store, settle } = started(base + "?city=almaty&place=bazaar&tab=walk&stop=2", { external: true });
    store.back(); settle();
    expect(b.backCalls).toBe(0);
    expect(store.getSnapshot().nav).toEqual({ city: "almaty", place: null, tab: "walk", walkStep: 1 });
    expect(b.env.state()).toMatchObject({ external: true });
    expect(b.currentView.focusKey).toBe("walk:almaty:1");
  });
  it("ignores stale pending restoration after interrupted navigation or tab changes", () => {
    const { b, store, settle } = started();
    store.navigate({ city: "almaty" });
    const stale = store.getSnapshot().pendingRestore!.id;
    store.navigate({ city: "kyoto" });
    expect(store.completeRestore(stale)).toBe(false);
    const second = store.getSnapshot().pendingRestore!.id;
    store.setTab("walk");
    expect(store.completeRestore(second)).toBe(false);
    const before = b.restored.length;
    settle();
    expect(b.restored).toHaveLength(before + 1);
    expect(b.restored.at(-1)?.context).toMatchObject({ city: "kyoto", tab: "walk" });
  });
  it("uses URL defaults rather than stale in-memory context for an unowned browser entry", () => {
    const { b, store, settle } = started(base + "?city=kyoto", { otherRouter: { key: "original" } });
    store.navigate({ city: "almaty", place: "bazaar" }); settle();
    b.entries[0].state = { otherRouter: { key: "original" } };
    b.traverse(-1); settle();
    expect(store.getSnapshot().nav).toEqual({ city: "kyoto", place: null, tab: "places", walkStep: 0 });
    expect(b.env.state()).toMatchObject({ otherRouter: { key: "original" } });
  });
  it("does not apply pending scroll or focus if history was independently replaced", () => {
    const { b, store } = started(base + "?city=almaty");
    store.navigate({ place: "bazaar" });
    const pending = store.getSnapshot().pendingRestore!;
    b.corrupt({ foreign: true });
    expect(store.completeRestore(pending.id)).toBe(false);
  });
  it("survives unavailable history writes without publishing an inconsistent navigation state", () => {
    const { b, store } = started();
    b.rejectWrites();
    expect(() => store.navigate({ city: "almaty" })).not.toThrow();
    expect(store.getSnapshot().nav).toEqual(defaultNav);
  });
  it("bounds high-frequency history writes while retaining the freshest viewport on traversal and pagehide", () => {
    const { b, store, settle } = openBazaarWalk();
    const writes = b.writes;
    for (let y = 1; y <= 100; y++) {
      b.tick(1);
      b.setView(view(y, "story:almaty:bazaar"));
    }
    expect(b.writes - writes).toBeLessThanOrEqual(1);
    b.traverse(-1); settle();
    b.traverse(1); settle();
    expect(b.currentView.scroll.y).toBe(100);
    b.setView(view(101, "story:almaty:bazaar"));
    b.pagehide();
    expect(readAtlasHistoryState(b.env.state(), b.env.href())?.view.scroll.y).toBe(101);
    expect(store.getSnapshot().nav.place).toBe("bazaar");
  });
  it("supports stop/start lifecycle and repeated Back/Forward without duplicate handlers or entries", () => {
    const { b, store, settle } = openBazaarWalk();
    store.stop(); store.start(); store.start();
    for (let i = 0; i < 3; i++) {
      b.traverse(-1); settle();
      expect(store.getSnapshot().nav).toMatchObject({ tab: "walk", walkStep: 1, place: null });
      b.traverse(1); settle();
      expect(store.getSnapshot().nav.place).toBe("bazaar");
    }
    expect(b.entries).toHaveLength(3);
  });
});
