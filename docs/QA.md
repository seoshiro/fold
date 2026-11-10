# FOLD browser QA

## Current result

Checked public preview https://seoshiro.github.io/fold/ on 2026-11-10. Final code snapshot: `2397591342b02ab36f6947bd8a182d0e4ead9285`, confirmed in the browser as `index-vhscoSH7.js`.

- Functional checks cover all three cities and nine stories, saving/removing/reloading, EN/RU/KK selection preservation, deep links, history, Escape, guided walks, Notes and fallback recovery. Version-specific details are below.
- Reported focus, dialog trapping, narrow-home layout, mobile targets and tab keyboard defects were corrected and retested.
- Actual WebGL screenshots cover the current-model home, three city endpoints and mobile layouts. The final Kyoto screenshot uses the final directional lighting. Static inspection is explicitly labeled and does not establish animation quality.
- Final asset diagnostics confirm the revised model: 1,320,752 bytes, revision `076641059a3e`, 351 primitive meshes, Kyoto cover opening -3.02 radians and pivot y≈0.18. Numeric pose diagnostics serialize correctly.
- **No continuous normal-speed video or valid foreground performance benchmark was obtained.** The recorded RAF intervals were heavily throttled. Reduced motion, native 200% zoom, physical phones and Safari remain unverified.

This is an evidence-based preview report, not a claim that every requested acceptance test passed.

## Conditions and timing evidence

Actual WebGL testing used a Windows laptop with Chrome157. The final sample reported ANGLE AMD Radeon(TM) Graphics (0x1681), Direct3D11, at1366×768 CSS pixels and DPR≈1. This is the reported renderer path, not a claim about every hardware configuration. Cloud Chrome could not create WebGL in its environment and fell back to the paper edition; it was not used for 3D performance conclusions. Viewport simulation is not a physical-device test. No credits were spent.

The isolated final sample began at13:00:21.749 UTC and ended by the helper's wall-clock limit after20,006.3ms. No recording, screenshots, resizing or other heavy browser tests ran during it. It produced only27 intervals: eight near7–8ms, followed by roughly one-second gaps. p95=1007.2ms, p99/max=1007.9ms; no long tasks were reported. `wasHidden=false`, but the native window had earlier been reported minimized. The observed pattern is consistent with severe window throttling despite document visibility. The sampler explicitly marks a foreground performance claim unsupported.

The sample had no input during capture, but state remained `unfolding` after earlier tab changes, while wing/Kyoto pose values were already1 and focus approached0. Do not relabel it a settled-idle benchmark. One earlier RAF-only sample remained pending for roughly two minutes and was abandoned before screenshots resumed. No second performance sample was run under the same unsuitable conditions.

Raw evidence: [frame-sample-invalid-foreground.json](evidence/frame-sample-invalid-foreground.json), originally exported as `2397591-frame-sample-INVALID-foreground-2026-11-10T13-00-21-749Z.json`. It includes raw intervals, scene/pose diagnostics and stated conditions. **These numbers are not normal foreground website FPS or GPU render timings.**

## Final and corrected checks

Final `2397591`:

- ArrowRight from Walk selects/focuses Places. Only the selected tab has tabindex0; others have -1. End selects/focuses Notes; Home selects/focuses Walk.
- Static inspection reaches Kyoto `data-scene=city`, and the revised asset/pose JSON is readable. The prior GSAP-cache circular serialization defect is fixed.
- Forced fallback `?fallback=1&city=kyoto&place=gion` opens Gion without a canvas. The versioned Kyoto poster loads completely at1245×770, rather than showing a broken image.
- Final Kyoto lighting has clearer facet separation than the previous ambient-heavy version. Fine paper-fiber quality is not established by these screenshot sizes.

Retested on `4bd5725`, with guided-walk focus additionally checked on `f9c5885`:

- Gion → Back to the city returns focus to its semantic key `kyoto/gion`, rather than Kiyomizu-dera.
- Saved dialog initial Shift+Tab reaches the last Remove control; Tab wraps to Close. Both remain inside the dialog.
- At360×800, home chooser bounds are y=694.6–745.6 and fit the viewport. The previous collapsing-margin bug placed them below the screen.
- Mobile language controls measure38×44px, five scene controls44×44px, and story hotspots44×44px. Place indices are11px at0.85 opacity.
- Guided Walk stop2 → Green Bazaar story → Back preserves stop2 and returns focus to Read the story (`almaty/bazaar`).
- Test-added saved items were removed through their controls. Reload retained Saved00, restoring the initial empty collection.

## Functional coverage and version history

Initial functional pass used `a9ad3d8` at approximately12:03–12:20 UTC:

- All nine stories open with substantive content and source links: Kyoto's Kiyomizu-dera, Gion and Kamo River; Lisbon's Alfama, Tram28 and Belém Tower; Almaty's Ascension Cathedral, Green Bazaar and Kok Tobe. Each returns to its own city.
- Saving Kiyomizu, EN→RU→KK and reload preserve selected city/story, language and saved count. Removing it and reloading retains an empty collection.
- Each city has a three-stop Walk with expected Previous/Next boundaries and substantive city-specific Notes.
- Browser Back/Forward preserves Almaty↔Green Bazaar URL and heading. Escape returns story→city→crane.
- Direct fallback Lisbon/Tram28, saving and RU work. Try3D again restores one canvas and `place` state without losing the selected story, RU or saved item.
- Rapid Lisbon→Kyoto→Almaty and repeated Almaty preserve the final selection and one canvas, with no observed console warnings/errors.

`02c66ec` introduced a content-versioned GLB URL. Earlier `4bd5725` screenshots could contain a cached old model and are not final geometry evidence. The current settled Kyoto view has detailed roofs, pagoda and red bridge; the old water-under-wing issue is no longer visible. `f9c5885` added explicit static inspection; `2397591` fixed its numeric diagnostics, added roving tab keys and refined lighting. The nine-story functional sweep was not repeated in full after these limited changes.

## Responsive and visual coverage

- Initial home chooser fit at1440×900 and1920×1080. The corrected360×800 home fit is recorded above.
- Current-model Kyoto was inspected at1366×768,1440×900,1920×1080,390×844 and768×1024 without horizontal document overflow. The360×800 static view frames the model and scene controls fully. City content continues vertically; reaching the third story/city switcher on narrow screens requires normal scrolling.
- Story reading at390×844 and Kamo River at360×800 scroll vertically without horizontal overflow. Almaty's initial768×1024 list was also checked.
- These observations are not a completed matrix of every city/story at every size. A small desktop vertical scrollbar is allowed; content was not hidden to disguise overflow.

## Screenshot provenance

All listed images are actual browser WebGL pixels, not generated illustrations. Earlier screenshots retain their version names.

- `2397591-desktop-kyoto-static-final.jpg`: final1366×768 Kyoto and lighting, using the explicit Finish current transition control.
- `2397591-mobile360-kyoto-static-final.jpg`: final360×800 Kyoto with the same current lighting and explicit static endpoint; model/controls framed, no horizontal overflow.
- `02c66ec-desktop-home.jpg`: current-model home before the final lighting refinement.
- `02c66ec-desktop-kyoto-settled.jpg`, `02c66ec-mobile390-kyoto-settled.jpg`: Kyoto reached its endpoint normally, but under throttled conditions; they do not prove duration or smoothness.
- `f9c5885-desktop-lisbon-static.jpg`, `f9c5885-desktop-almaty-static.jpg`, `f9c5885-mobile360-kyoto-static.jpg`: explicit static endpoints before the final lighting refinement.
- `f9c5885-almaty-closeup-static.jpg`: static endpoint plus two Zoom in clicks and Look right; cropped from actual browser pixels.

Files with `midfold` or `initial` in their names are intermediate evidence and must not be presented as final endpoint captures.

## Opt-in QA tools

Open `?qa=1` for local-only instrumentation. Read scene diagnostics reports the actual loaded asset and numeric pose. Finish current transition for static inspection jumps the real scene timeline to its endpoint and records its use; this never validates normal motion. Hide QA removes the panel until reload.

Sample frame intervals runs for20s with independent wall-clock completion and a Cancel control. It reports quantiles, raw callback intervals, supported long tasks, state/pose, renderer, viewport and visibility, including starvation/late-completion warnings. Download measurements saves the JSON. Do not record or take screenshots during a sample; record actual foreground/device/workload conditions separately.

`qa-viewports.html` offers exact iframe CSS sizes1366×768,1440×900,1920×1080,360×800,390×844,768×1024 and844×390. Its optional recorder asks for the current FOLD QA tab only, without audio, and rejects window/desktop capture. It hides controls, reloads the iframe and records continuously at normal time until stopped or90s. Recording was attempted but the native capture interface could not be completed: no source was selected and no recording file was produced. The requesting tab closed. The helper's existence is not video proof.

## Remaining limits

Unverified: continuous normal-speed desktop/mobile/interruption videos; representative foreground frame timing; exact intro/transition durations; full final viewport matrix; native200% zoom; reduced-motion mode; real touch devices; Safari; slow/resource-error loading and real WebGL-context-loss recovery. No black-screen guarantee is inferred from sampled screenshots. Temporary viewport overrides were reset after testing, and the public homepage was left open.
