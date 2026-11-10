# Navigation and restoration contract

`useAtlasNavigation()` owns route intent and browser history. `nav` contains canonical `city`, `place`, `tab` and zero-based `walkStep`. The existing `initialNavigation`, `navigationUrl`, saved-language and saved-place interfaces remain available.

- `navigate(patch, { replace?, focusKey? })` records the outgoing entry first. Same-city navigation retains tab and stop; changing city resets them unless explicitly supplied. `focusKey` specifies the destination, not the return trigger.
- `setTab` and `setWalkStep` accept values or functional setters and replace the current entry. They do not add Back-stack noise or move scroll/focus.
- Use `back()` for story Close, Back to city, Back to crane and Escape. It traverses a known app parent. On a deep link/reload without a verifiable adjacent parent, it restores the saved parent or a safe contextual parent in place rather than potentially leaving the app.
- `pendingRestore` contains `{ id, context, scroll: { x, y }, focusKey }`. Keep this pending until the matching content is mounted, the old story has finished closing, and the latest scene target has settled. Then call `completeRestore(id)`. A superseded ID, mismatched entry or mismatched context is ignored. There is no timer-based automatic restoration inside the hook.
- Add stable, untranslated `data-focus-key` values to focusable controls. Current examples are `city:almaty`, `city-title:almaty`, `tab:walk`, `walk:almaty:1`, `place:almaty:bazaar`, `pin:almaty:bazaar`, `story:almaty:bazaar` and `home`. Focus resolution skips hidden, disabled and inert controls and uses a safe contextual fallback. Focus uses `preventScroll` after scroll restoration.

The URL also contains tab and a one-based `stop` parameter, for example `?city=almaty&place=bazaar&tab=walk&stop=2`. Only IDs from content are accepted. Unknown tab/stop values fall back safely; existing deployment paths, unrelated query parameters and hashes are retained.

History uses the namespaced, versioned `__foldAtlas` state. Restoration validates entry ID, current URL, content IDs, tab, stop bounds, scroll coordinates and semantic focus key. Foreign/malformed state is not a source of route context. Other object-state metadata is retained when replacing the current entry.

Scroll/focus are captured continuously, including pointer activation in browsers that do not focus clicked buttons. History writes are bounded to avoid browser frequency limits; the newest viewport is retained in a per-entry cache and forced to history before explicit navigation, contextual Back, pagehide and document hiding. Cache restoration requires the same validated entry ID, URL and route context. The popstate handler never writes outgoing DOM state into the destination. View capture is suspended while a visual transition/restoration is pending. Native automatic scroll restoration is disabled only while the hook is mounted and its previous value is restored on cleanup.

## Deterministic verification

`src/atlas-navigation.test.ts` covers the reported Almaty/walk/stop-2/Bazaar journey, browser Back/Forward, contextual Back, reload, deep links, foreign/malformed history, stale restoration tokens, rapid changes, same-city preservation, city resets, focus keys, bounded history writes, pagehide flushing and lifecycle cleanup. Run:

```sh
npm test -- src/navigation.test.ts src/atlas-navigation.test.ts
npm run build
```

These are model/controller tests. They do not replace browser checks of actual scene settlement, scrolling or assistive-technology focus behavior.
