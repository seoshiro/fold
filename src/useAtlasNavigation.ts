import { useEffect, useState, useSyncExternalStore } from "react";
import {
  createAtlasNavigationStore,
  validFocusKey,
  type AtlasNavigation,
  type AtlasNavigationEnvironment,
  type AtlasView,
} from "./navigation";

function focusKeyOf(element: Element | null): string | null {
  const keyed = element?.closest<HTMLElement>("[data-focus-key]");
  if (keyed && validFocusKey(keyed.dataset.focusKey)) return keyed.dataset.focusKey;
  // Compatibility for existing markup. Explicit keys distinguish a map pin from a list or walk link.
  const place = element?.closest<HTMLElement>("[data-place-key]")?.dataset.placeKey;
  if (place && validFocusKey(`place:${place.replace("/", ":")}`)) return `place:${place.replace("/", ":")}`;
  const city = element?.closest<HTMLElement>("[data-city-key]")?.dataset.cityKey;
  if (city && validFocusKey(`city:${city}`)) return `city:${city}`;
  const tab = element?.closest<HTMLElement>('[role="tab"]');
  if (tab && ["tab-places", "tab-walk", "tab-notes"].includes(tab.id)) return tab.id.replace("-", ":");
  return null;
}

function available(element: HTMLElement) {
  return element.isConnected && !element.closest('[inert],[hidden],[aria-hidden="true"]') &&
    !element.matches(':disabled,[data-visible="false"]') && element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility !== "hidden";
}

function findFocusTarget(key: string | null, context: AtlasNavigation): HTMLElement | null {
  const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-focus-key]"));
  if (key) {
    // Compare values instead of constructing a selector from persisted input.
    const explicit = elements.find((el) => el.dataset.focusKey === key && available(el));
    if (explicit) return explicit;
    const legacy = Array.from(document.querySelectorAll<HTMLElement>("[data-place-key],[data-city-key],[role=tab]"))
      .filter((el) => focusKeyOf(el) === key && available(el))
      .sort((a, b) => Number(a.classList.contains("poi-anchor")) - Number(b.classList.contains("poi-anchor")))[0];
    if (legacy) return legacy;
  }
  const fallback = context.place
    ? document.querySelector<HTMLElement>(".story-paper")
    : context.city
      ? document.getElementById("tab-" + context.tab)
      : elements.find((el) => el.dataset.focusKey === "home") || document.querySelector<HTMLElement>(".city-choices button");
  return fallback && available(fallback) ? fallback : null;
}

/** Only this adapter touches the DOM. The store controls when capture/restoration is safe. */
export function browserNavigationEnvironment(): AtlasNavigationEnvironment {
  let pointerKey: string | null = null;
  return {
    href: () => window.location.href,
    state: () => window.history.state,
    push: (state, url) => window.history.pushState(state, "", url),
    replace: (state, url) => window.history.replaceState(state, "", url),
    back: () => window.history.back(),
    readView: (): AtlasView => ({
      scroll: { x: Math.max(0, window.scrollX), y: Math.max(0, window.scrollY) },
      focusKey: pointerKey || focusKeyOf(document.activeElement),
    }),
    restoreView: (view, context) => {
      pointerKey = null;
      window.scrollTo({ left: view.scroll.x, top: view.scroll.y, behavior: "instant" });
      findFocusTarget(view.focusKey, context)?.focus({ preventScroll: true });
    },
    listen: (onPop, onView, onExit) => {
      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      window.addEventListener("popstate", onPop);
      window.addEventListener("scroll", onView, { passive: true });
      window.addEventListener("pagehide", onExit);
      // Safari may activate a pointer-clicked button without focusing it. Capture its semantic
      // identity before React's click navigation; keyboard focus remains the source otherwise.
      const pointer = (event: PointerEvent) => {
        pointerKey = focusKeyOf(event.target instanceof Element ? event.target : null);
        onView();
      };
      const focus = () => { pointerKey = null; onView(); };
      const keyboard = () => { pointerKey = null; };
      const visibility = () => { if (document.visibilityState === "hidden") onExit(); };
      document.addEventListener("pointerdown", pointer, true);
      document.addEventListener("keydown", keyboard, true);
      document.addEventListener("focusin", focus);
      document.addEventListener("visibilitychange", visibility);
      return () => {
        window.removeEventListener("popstate", onPop);
        window.removeEventListener("scroll", onView);
        window.removeEventListener("pagehide", onExit);
        document.removeEventListener("pointerdown", pointer, true);
        document.removeEventListener("keydown", keyboard, true);
        document.removeEventListener("focusin", focus);
        document.removeEventListener("visibilitychange", visibility);
        window.history.scrollRestoration = previous;
      };
    },
  };
}

/**
 * Intent updates immediately; the UI owns visual presentation and scene readiness.
 * Call completeRestore(pendingRestore.id) only when that exact context is presented,
 * the story enter/exit has ended, and scene settlement corresponds to the latest intent.
 */
export function useAtlasNavigation() {
  const [store] = useState(() => createAtlasNavigationStore(browserNavigationEnvironment()));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => { store.start(); return store.stop; }, [store]);
  return {
    ...snapshot,
    navigate: store.navigate,
    back: store.back,
    setTab: store.setTab,
    setWalkStep: store.setWalkStep,
    completeRestore: store.completeRestore,
  };
}
