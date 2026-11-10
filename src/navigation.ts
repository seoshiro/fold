import { cities, type CityId, type Lang } from "./content";

export type Navigation = { city: CityId | null; place: string | null };
export type AtlasTab = "places" | "walk" | "notes";
export type AtlasNavigation = Navigation & { tab: AtlasTab; walkStep: number };
export type AtlasView = { scroll: { x: number; y: number }; focusKey: string | null };
export type AtlasRestore = AtlasView & { id: number; context: AtlasNavigation };

type EntryReference = {
  id: string;
  url: string;
  context: AtlasNavigation;
  view: AtlasView;
};
export type AtlasHistoryEntry = EntryReference & {
  version: 1;
  parent: EntryReference | null;
};
export const ATLAS_HISTORY_KEY = "__foldAtlas";
const tabs: readonly string[] = ["places", "walk", "notes"];
const zeroView = (): AtlasView => ({ scroll: { x: 0, y: 0 }, focusKey: null });
const relativeUrl = (url: URL) => url.pathname + url.search + url.hash;
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const initialNavigation = (href = location.href): Navigation => {
  const p = new URL(href).searchParams;
  const city = cities.find((c) => c.id === p.get("city"));
  return {
    city: city?.id ?? null,
    place: city?.places.some((q) => q.id === p.get("place")) ? p.get("place") : null,
  };
};

/** URL IDs and the one-based stop parameter are independent of the display language. */
export function initialAtlasNavigation(href = location.href): AtlasNavigation {
  const nav = initialNavigation(href);
  const params = new URL(href).searchParams;
  const city = cities.find((c) => c.id === nav.city);
  const tab = params.get("tab");
  const stop = params.get("stop");
  const step = stop && /^[1-9]\d*$/.test(stop) ? Number(stop) - 1 : 0;
  return {
    ...nav,
    tab: city && tabs.includes(tab || "") ? (tab as AtlasTab) : "places",
    walkStep: city && Number.isSafeInteger(step) && step < city.places.length ? step : 0,
  };
}

export function navigationUrl(n: Navigation, href = location.href) {
  const url = new URL(href);
  for (const key of ["city", "place", "tab", "stop"]) url.searchParams.delete(key);
  if (n.city) url.searchParams.set("city", n.city);
  if (n.city && n.place) url.searchParams.set("place", n.place);
  return relativeUrl(url);
}

export function atlasNavigationUrl(n: AtlasNavigation, href = location.href) {
  const url = new URL(navigationUrl(n, href), href);
  if (n.city && n.tab !== "places") url.searchParams.set("tab", n.tab);
  if (n.city && n.walkStep > 0) url.searchParams.set("stop", String(n.walkStep + 1));
  return relativeUrl(url);
}

export function sameAtlasNavigation(a: AtlasNavigation, b: AtlasNavigation) {
  return a.city === b.city && a.place === b.place && a.tab === b.tab && a.walkStep === b.walkStep;
}

export function validFocusKey(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9:_/.-]{0,127}$/i.test(value);
}

function validContext(value: unknown): value is AtlasNavigation {
  if (!record(value) || typeof value.tab !== "string" || !tabs.includes(value.tab) || !Number.isInteger(value.walkStep)) return false;
  if (value.city === null) return value.place === null && value.tab === "places" && value.walkStep === 0;
  const city = cities.find((c) => c.id === value.city);
  return !!city && (value.place === null || city.places.some((p) => p.id === value.place)) &&
    (value.walkStep as number) >= 0 && (value.walkStep as number) < city.places.length;
}

function validView(value: unknown): value is AtlasView {
  if (!record(value) || !record(value.scroll)) return false;
  return [value.scroll.x, value.scroll.y].every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1e7) &&
    (value.focusKey === null || validFocusKey(value.focusKey));
}

function validReference(value: unknown, href: string): value is EntryReference {
  if (!record(value) || typeof value.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.id) ||
      typeof value.url !== "string" || !validContext(value.context) || !validView(value.view)) return false;
  try {
    const url = new URL(value.url, href);
    const here = new URL(href);
    return url.origin === here.origin && url.pathname === here.pathname && relativeUrl(url) === value.url &&
      sameAtlasNavigation(value.context, initialAtlasNavigation(url.href));
  } catch { return false; }
}

/** Never restore a state copied from a different URL, a stale schema, or foreign history. */
export function readAtlasHistoryState(state: unknown, href: string): AtlasHistoryEntry | null {
  if (!record(state)) return null;
  const entry = state[ATLAS_HISTORY_KEY];
  if (!record(entry) || entry.version !== 1) return null;
  const parent = entry.parent;
  if (!validReference(entry, href) || entry.url !== relativeUrl(new URL(href)) ||
      !(parent === null || (validReference(parent, href) && parent.id !== entry.id))) return null;
  // Clone only known fields. No DOM references, arbitrary selectors or external state enter the model.
  const copy = (v: EntryReference): EntryReference => ({
    id: v.id, url: v.url, context: { city: v.context.city, place: v.context.place, tab: v.context.tab, walkStep: v.context.walkStep },
    view: { scroll: { ...v.view.scroll }, focusKey: v.view.focusKey },
  });
  return { ...copy(entry), version: 1, parent: parent ? copy(parent) : null };
}

/** Keep other consumers' state instead of replacing their metadata. */
export function withAtlasHistoryState(state: unknown, entry: AtlasHistoryEntry) {
  return { ...(record(state) ? state : {}), [ATLAS_HISTORY_KEY]: entry };
}

export type AtlasNavigationEnvironment = {
  href: () => string;
  state: () => unknown;
  push: (state: unknown, url: string) => void;
  replace: (state: unknown, url: string) => void;
  back: () => void;
  readView: () => AtlasView;
  restoreView: (view: AtlasView, context: AtlasNavigation) => void;
  listen: (onPop: () => void, onView: () => void, onExit: () => void) => () => void;
  makeId?: () => string;
  now?: () => number;
};
export type AtlasNavigateOptions = { replace?: boolean; focusKey?: string | null };
export type AtlasNavigationSnapshot = { nav: AtlasNavigation; pendingRestore: AtlasRestore | null };

let idSequence = 0;
function newEntryId() {
  return globalThis.crypto?.randomUUID?.() || `fold_${Date.now()}_${++idSequence}`;
}
function targetView(context: AtlasNavigation, focusKey?: string | null): AtlasView {
  return {
    ...zeroView(),
    focusKey: focusKey === null || validFocusKey(focusKey) ? focusKey : context.place
      ? `story:${context.city}:${context.place}`
      : context.city ? `city-title:${context.city}` : "home",
  };
}
function mergeNavigation(current: AtlasNavigation, patch: Partial<AtlasNavigation>): AtlasNavigation {
  const candidate = { ...current, ...patch };
  const city = cities.find((c) => c.id === candidate.city);
  if (!city) return { city: null, place: null, tab: "places", walkStep: 0 };
  const changedCity = city.id !== current.city;
  return {
    city: city.id,
    place: city.places.some((p) => p.id === candidate.place) ? candidate.place : null,
    tab: tabs.includes(String(patch.tab)) ? patch.tab! : changedCity ? "places" : current.tab,
    walkStep: Number.isInteger(patch.walkStep) && patch.walkStep! >= 0 && patch.walkStep! < city.places.length
      ? patch.walkStep! : changedCity ? 0 : current.walkStep,
  };
}

/** A DOM-free store so history traversal and delayed restoration can be tested deterministically. */
export function createAtlasNavigationStore(env: AtlasNavigationEnvironment) {
  const makeId = env.makeId || newEntryId;
  const readEntry = () => readAtlasHistoryState(env.state(), env.href());
  const fresh = (): AtlasHistoryEntry => {
    const context = initialAtlasNavigation(env.href());
    return { version: 1, id: makeId(), url: relativeUrl(new URL(env.href())), context, view: targetView(context), parent: null };
  };
  let entry = readEntry() || fresh();
  let restoreId = 0;
  let snapshot: AtlasNavigationSnapshot = {
    nav: entry.context,
    pendingRestore: { id: ++restoreId, context: entry.context, ...entry.view },
  };
  let unlisten: (() => void) | null = null;
  let backPending = false;
  const knownEntries = new Set<string>([entry.id]);
  const recentViews = new Map<string, EntryReference>();
  const now = env.now || Date.now;
  let lastViewWrite = -Infinity;
  const listeners = new Set<() => void>();
  const emit = () => { for (const listener of listeners) listener(); };
  const matchesCurrentEntry = () => {
    const current = readEntry();
    return current?.id === entry.id && current.url === entry.url;
  };
  const write = (next: AtlasHistoryEntry, replace: boolean, preserveForeign = true) => {
    const state = withAtlasHistoryState(preserveForeign ? env.state() : null, next);
    try {
      if (replace) env.replace(state, next.url);
      else env.push(state, next.url);
      return true;
    } catch { return false; }
  };
  const activate = (next: AtlasHistoryEntry) => {
    entry = next;
    knownEntries.add(entry.id);
    backPending = false;
    snapshot = { nav: entry.context, pendingRestore: { id: ++restoreId, context: entry.context, ...entry.view } };
    emit();
  };
  const capture = (force = false) => {
    // A popstate changes history.state before its handler runs. Never save outgoing DOM into it.
    // During scene transitions the DOM may still represent the old route, so leave the target alone.
    if (snapshot.pendingRestore || backPending || !matchesCurrentEntry()) return;
    const view = env.readView();
    if (!validView(view)) return;
    entry = { ...entry, view };
    recentViews.set(entry.id, entry);
    // Keep recent in-memory snapshots for browser Back/Forward without calling replaceState
    // at animation-frame frequency (some browsers cap history writes).
    if (recentViews.size > 128) recentViews.delete(recentViews.keys().next().value!);
    if (force || now() - lastViewWrite >= 400) {
      if (write(entry, true)) lastViewWrite = now();
    }
  };
  const onPop = () => {
    const incoming = readEntry();
    let next = incoming || fresh();
    const cached = incoming && recentViews.get(incoming.id);
    // The cache is only a newer viewport for this exact validated entry, never a route source.
    if (cached && cached.url === next.url && sameAtlasNavigation(cached.context, next.context)) {
      next = { ...next, view: cached.view };
    }
    if (!incoming) write(next, true);
    activate(next);
  };
  const navigate = (patch: Partial<AtlasNavigation>, options: AtlasNavigateOptions = {}) => {
    if (backPending) return;
    const context = mergeNavigation(entry.context, patch);
    if (sameAtlasNavigation(context, entry.context)) return;
    capture(true);
    const next: AtlasHistoryEntry = {
      version: 1,
      id: options.replace ? entry.id : makeId(),
      url: atlasNavigationUrl(context, env.href()),
      context,
      view: targetView(context, options.focusKey),
      parent: options.replace ? entry.parent : {
        id: entry.id, url: entry.url, context: entry.context, view: entry.view,
      },
    };
    // New entries should not copy another router's position/index metadata.
    if (write(next, !!options.replace, !!options.replace)) activate(next);
  };
  const replaceContext = (patch: Partial<AtlasNavigation>) => {
    if (backPending) return;
    const context = mergeNavigation(entry.context, patch);
    if (sameAtlasNavigation(context, entry.context)) return;
    capture(true);
    const next = { ...entry, context, url: atlasNavigationUrl(context, env.href()) };
    if (!write(next, true)) return;
    entry = next;
    // Tab/stop changes happen in-place. Do not scroll or focus a control on the user's behalf.
    snapshot = {
      nav: context,
      pendingRestore: snapshot.pendingRestore ? {
        ...snapshot.pendingRestore, id: ++restoreId, context,
      } : null,
    };
    emit();
  };
  const back = () => {
    if (backPending || !entry.context.city) return;
    capture(true);
    const parent = entry.parent;
    const canReturn = parent && (entry.context.place !== null || parent.context.city === null);
    if (canReturn && knownEntries.has(parent.id) && matchesCurrentEntry()) {
      backPending = true;
      try { env.back(); return; } catch { backPending = false; }
    }
    // On a fresh deep link/reload we cannot inspect the preceding entry. Never blindly leave FOLD.
    const context = canReturn ? parent.context : entry.context.place
      ? { ...entry.context, place: null }
      : { city: null, place: null, tab: "places" as const, walkStep: 0 };
    const view = canReturn ? parent.view : targetView(context, entry.context.place
      ? (context.tab === "walk" ? `walk:${context.city}:${context.walkStep}` : `place:${context.city}:${entry.context.place}`)
      : `city:${entry.context.city}`);
    const next: AtlasHistoryEntry = {
      version: 1, id: makeId(), context, view, parent: null,
      url: atlasNavigationUrl(context, env.href()),
    };
    if (write(next, true)) activate(next);
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start: () => {
      if (unlisten) return;
      // Claim only the current same-document entry, preserving unrelated state.
      if (!matchesCurrentEntry()) write(entry, true);
      unlisten = env.listen(onPop, () => capture(), () => capture(true));
    },
    stop: () => { capture(true); unlisten?.(); unlisten = null; },
    navigate,
    back,
    setTab: (value: AtlasTab | ((previous: AtlasTab) => AtlasTab)) => {
      replaceContext({ tab: typeof value === "function" ? value(entry.context.tab) : value });
    },
    setWalkStep: (value: number | ((previous: number) => number)) => {
      replaceContext({ walkStep: typeof value === "function" ? value(entry.context.walkStep) : value });
    },
    capture,
    completeRestore: (id: number) => {
      const pending = snapshot.pendingRestore;
      if (!pending || pending.id !== id || backPending || !matchesCurrentEntry() ||
          !sameAtlasNavigation(pending.context, entry.context)) return false;
      env.restoreView(pending, entry.context);
      // A focus/scroll callback may initiate a newer route; it owns its own restoration.
      if (snapshot.pendingRestore?.id !== id) return false;
      snapshot = { nav: entry.context, pendingRestore: null };
      capture(true);
      emit();
      return true;
    },
  };
}

export function safeGet(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
export function readLanguage(): Lang {
  const s = safeGet("fold-language");
  return s === "ru" || s === "kk" ? s : "en";
}
export function readSaved(): string[] {
  try {
    const s = JSON.parse(safeGet("fold-saved") || "[]");
    const keys = new Set(cities.flatMap((c) => c.places.map((p) => c.id + "/" + p.id)));
    return Array.isArray(s)
      ? [...new Set(s.filter((v: unknown) => typeof v === "string" && keys.has(v)))] : [];
  } catch { return []; }
}
