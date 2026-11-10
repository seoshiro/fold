# FOLD revision browser QA

## Scope and evidence standard

Public target: https://seoshiro.github.io/fold/

The requested acceptance artifact is a continuous recording of the actual WebGL scene: cold entrance, Kyoto, place, story, return, then all three cities. A build, unit tests, still images, CPU renders, and fallback UI checks do not satisfy that motion acceptance criterion.

## Baseline, 2026-11-10 UTC

- Repository baseline reported and locally verified: `e4bbae77719fde0bcc35e3e60e0d14565ecb55c1`.
- Public browser-observed entry asset: `assets/index-DVkWTar4.js`.
- Public scene asset in cloud console errors: `assets/scene-Cw22AYzA.js`.
- Exact public-to-commit equivalence has not been independently asserted from these bundle names alone.

### Cloud browser

Environment: managed cloud computer, Chrome CDP browser. Exact browser version was not exposed by the inspected metadata.

1. **PASS, fallback availability:** cold public load at 16:16 UTC showed the paper edition notice and retained language, city, place, and story controls.
2. **BLOCKED, real WebGL:** THREE.WebGLRenderer failed to create a context. Console reported `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, and `BindToCurrentSequence failed`.
3. **FAIL, browser Back preserves walk context:** switched to RU; selected Алматы; selected Прогулка; selected Остановка 2; observed Зелёный базар; opened Открыть историю; URL became `?city=almaty&place=bazaar`; used browser Back. URL returned to `?city=almaty`, but selected tab became Места instead of Прогулка/stop 2. Focus was the page AXWebArea, not the initiating walk control.
4. Scroll restoration was not separately measured in this baseline path.

### User laptop browser

Environment: DESKTOP-KNKF2FM, Windows, connected Chrome extension. Current browser family and connection were verified by supported inventory. A previous report identified Chrome 157 and ANGLE AMD Radeon, but those version/GPU values were not re-measured in this revision baseline and are not asserted as current measurements.

1. **PASS, live scene availability:** created a FOLD-only QA tab through the supported browser interface. Public entrance rendered a paper crane; DOM contained a 1901×763 canvas. No warnings/errors were returned by the queried tab console log subset.
2. **UNRUN, continuous video:** no recording was started or saved. The supported browser API advertised viewport, management, and page assets, but no recording capability.
3. **BLOCKED, native capture route:** previous native access attempts for Chrome window 525168 and capture-picker window 133782 were denied because the current URL could not be determined. Fresh inventory still showed window 525168 with a different GitHub/SAVE SLOT title and 133782 with generic Chrome title. It did not supply materially new target evidence resolving those denials, so neither native operation was retried. No screen, audio, or other private window was captured.
4. Live motion smoothness and frame timing were not accepted from the screenshot or mere canvas presence. No benchmark was run while geometry work was active.

## Revision acceptance pending

Awaiting the new public version from the implementation owner. After it is available, verify the public asset/version before testing:

- Almaty walk stop 2 → Green Bazaar story → browser Back: city, tab, stop, scroll, and focus.
- Browser Forward and subsequent Back without corrupting route context.
- Story close and return controls retain the correct source context.
- Cold entrance → Kyoto → place → story → return as one uninterrupted real-WebGL recording.
- All three cities, return transitions, visible controls, and reduced-motion/fallback behavior as applicable.
- Performance only under an agreed isolated measurement window.

Until a compliant live recording is captured and reviewed, motion acceptance remains **UNVERIFIED**.
