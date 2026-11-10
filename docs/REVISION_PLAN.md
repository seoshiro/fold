# Coherent journey revision

Baseline: e4bbae77719fde0bcc35e3e60e0d14565ecb55c1. Preserve the red/ivory paper atlas, three cities, nine sourced stories, EN/RU/KK, saved places, URL access and fallback. No additional Higgsfield generation is planned.

## Acceptance sequence

Cold entrance → actual wing unfolds into the home crane → Kyoto → a place opens a paper story from its own location → readable HTML → the same story folds closed → the prior city view, focus and scroll return. Repeat with browser Back/Forward, rapid reversal, Lisbon and Almaty.

## Defects to address

1. History entries retain city, tab, walk stop, scroll and semantic focus. Reproduce Almaty → Walk stop 2 → Green Bazaar → browser Back; restore Walk stop 2 rather than Places.
2. Navigation intent and visible presentation are distinct. Retain outgoing story identity until its closing motion finishes. HTML and 3D share the presentation progress, rather than independent CSS entrance/removal.
3. City text and geometry/poster agree throughout the switch. A stale fallback poster cannot accompany a new city title. Loading/error paths must remain usable.
4. Mobile gets its own tighter framing and compact controls, preserving the head/tail silhouette and readable open city.
5. Landmarks have distinct readable silhouettes, especially Lisbon's terrain, tram and Belém. Existing names and factual story anchors remain stable.
6. Label layout checks complete measured bounds, overlap and screen/panel exclusions; obstructed labels do not obscure architecture. The ordinary HTML list is always available.
7. Intro articulates the real wing, remains skippable and session-once, and honors reduced motion without delaying real loading.

## Evidence gates

- Source tests for navigation validation/restoration, latest-intent interruption, presentation identity, labels and intro continuity.
- Build, type check and asset hash/count verification.
- Actual browser checks on the revised public review path, including EN/RU/KK, Back/Forward, narrow layouts and fallback.
- Continuous real-WebGL recording and isolated frame intervals only if the environment can actually render and capture them. Report blocked or unrun checks without substituting screenshots or unit tests.

The previous published build remains recoverable. Work is in revision/coherent-journey; checkpoint/pre-journey-review retains the baseline locally. The public preview is not declared fully accepted until the actual evidence supports that claim.
