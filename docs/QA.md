# FOLD browser QA

## Scope and status

This is a work-in-progress QA log, not a declaration that FOLD is finished. Initial functional testing used public preview `https://seoshiro.github.io/fold/`, commit `a9ad3d8ba9008053c6d57f2207d0dae8fdee3687` on 2026-11-10. The initial model is intermediate; known geometry/lighting corrections and transparent fallback posters were still being prepared. Do not reuse initial screenshots as final-quality evidence.

## Actual test environments

- Cloud Chrome: public UI works but WebGL context creation failed in this environment. The app fell back to its paper edition. This does not establish a failure on hardware browsers. No 3D performance claim comes from this environment.
- Windows laptop, local Chrome: actual live WebGL rendered. Exact CSS viewport overrides verified using `innerWidth` and `innerHeight`. Browser version and graphics renderer still need the opt-in sampler. This is not a physical phone or Safari test.
- No recording was running during the functional checks below. No credits were spent.

## Initial snapshot: verified results, approximately 12:03–12:20 UTC

- All three cities open. All nine places open with real article content and source links: Kyoto (Kiyomizu-dera, Gion, Kamo River), Lisbon (Alfama, Tram 28, Belém Tower), Almaty (Ascension Cathedral, Green Bazaar, Kok Tobe). Each returns to its own city.
- Kiyomizu saved successfully. EN → RU → KK preserves selected city, selected story and saved count. Reload preserves KK, the same story deep link and saved state.
- Saved collection removes the place; reload retains the empty collection.
- Almaty guided walk advances 1 → 2 → 3, disables Next at the last stop, and Previous returns to stop 2. Notes contains substantive city-specific text.
- Browser Back/Forward returns Almaty ↔ Green Bazaar with correct URL and heading. Escape returns story → city → crane.
- Direct loading `?fallback=1&city=lisbon&place=tram28` opens the correct story. Saving and switching to RU work. Try 3D again restores one canvas and state `place` without losing city, story, RU or the saved item. The forced fallback query remains a test mechanism.
- Story reading at 390×844 scrolls normally and has no horizontal document overflow.
- A settled desktop Kyoto state was confirmed as `data-scene=city`, so the intro does eventually end. Actual intro duration has not yet been measured.

## Initial snapshot: reproducible defects reported for correction

1. **Return focus does not return to selected place.** Opening Gion from Places, then Back to the city, ultimately focused the first list item (Kiyomizu-dera). Its previous DOM trigger was unmounted. Corrected; public retest on `4bd5725` returned focus to `kyoto/gion`.
2. **Saved dialog initial Shift+Tab escapes.** Open Saved places, with initial focus on the dialog section, then Shift+Tab: focused footer link `Beibars Ileskhan` outside the dialog. Corrected; public retest on `4bd5725` kept initial Shift+Tab on the last dialog control, and forward Tab wrapped to Close.
3. **Mobile home selector below screen.** At 360×800 and scrollY=0, header ended at y=80, but `.experience` began at y=185 because the first scene's 105px top margin collapsed outside it. Main height580, city choices y=799.6–850.6, below the 800px viewport. Corrected; public retest on `4bd5725` placed the chooser at y=694.6–745.6 within the 800px viewport.
4. **Small targets.** Initial mobile language targets were roughly12–14×44px, scene tools21×32px. Corrected on mobile in `4bd5725`: language buttons38×44px, all five scene tools44×44px. Desktop language widths were still approximately14px in that snapshot; a subsequent patch is pending.

The initial1366×768 home document was14px taller than the viewport; this alone is not a failure if the primary controls fit. Do not hide overflowing content to mask a layout problem.

## Reproducible opt-in test tools

### Frame intervals

Open `?qa=1`, wait for the desired scene to settle and click **Sample frame intervals (20s)**. The module is imported only for the explicit query. It does not upload data or automatically start a test.

- No recording, screenshots or other heavy tests during the20s sample. Close unrelated heavy work where possible; record any remaining load.
- Sample callbacks from `requestAnimationFrame`, not GPU render timings or instantaneous website FPS.
- Records p50/p95/p99, maximum interval, counts above33.4/50ms, supported long tasks, scene changes, UA, viewport, DPR, renderer, visibility and resize conditions.
- Download the complete JSON with raw intervals. State the exact device/browser and scenario with the report.
- A renderer string can establish software rendering (SwiftShader/llvmpipe etc.). Other strings do not by themselves prove a particular physical device or performance class.

### Viewport simulation and continuous recording

Open `qa-viewports.html`. Select1366×768,1440×900,1920×1080,360×800,390×844,768×1024 or844×390. The iframe has that exact CSS size; large sizes may extend beyond the outer viewport. These are simulated browser viewports, not tests on physical phones/tablets.

**Record this FOLD QA tab, no audio (90s)** requests the browser's native tab picker. Choose only this FOLD QA tab. The helper rejects window/desktop capture and requests no audio. All recording remains local until manually downloaded. It hides the QA controls and reloads the iframe so the video includes a cold intro. It stops after90s, through the browser sharing control, or Alt+Shift+R when the wrapper has focus. Download the WebM and inspect its actual content before claiming success. Its30fps capture request is not a website FPS measurement. Do not record and run the frame sampler together.

Recording was attempted but could not be completed in the available native capture interface. No capture source was selected and no recording file was produced. The requesting QA tab closed. A helper's existence is not proof of a successful recording.

## Still required on a corrected public snapshot

- Retest any subsequent changes; the reported focus, dialog, narrow-home layout and mobile target fixes passed on `4bd5725`.
- Actual continuous normal-speed desktop complete path, interruption path and mobile path.
- Stable and intermediate model poses, underside and paper closeups, model framing across all requested viewports.
- Full viewport matrix1366×768,1440×900,1920×1080,360×800,390×844,portrait tablet; resize during transitions; mobile orientation;200% zoom.
- Reduced-motion behavior; rapid/repeated city selection; back during unfolding; focus and keyboard order.
- Cold/repeat input timing, slow/resource-error behavior, no black/loading defects, fallback images after final assets, real context-loss recovery if accessible.
- Separate measured frame-interval and long-task sessions without recording or heavy tests.
- Physical phone and Safari remain untested unless later tested on actual hardware/browser.


## Public retest: 2026-11-10, approximately 12:42–12:48 UTC

Snapshot `4bd57257e357965e9767a38f97a679816551ba5e`, script `index-CJuRFToc.js`:

- Gion → Back to the city restores focus to the Gion button (`data-place-key=kyoto/gion`) after the return update.
- Saved dialog: initial focus is the dialog section. Shift+Tab reaches the last Remove control; Tab wraps to Close. Focus remains within the dialog.
- At360×800: no horizontal document overflow; language buttons38×44px; five scene controls44×44px. Chooser placement is confirmed above. Place indices are11px with0.85 opacity.
- The test-added Tram28 saved item was removed using its Remove control. Reload retained Saved00, restoring the initial empty collection.
- Kamo River story opens at360×800, and the document scrolls vertically without horizontal overflow. Motion was still settling during the immediate bounds observation, so those intermediate transformed bounds are not treated as final layout measurements.
- No warning/error console entries were observed in that narrow-story check.

Snapshot `02c66ecbdd6943e2db4503f8a9aaeafd433b22f3`, script `index-BbAAdBQA.js`:

- Confirmed public deployment in local Chrome. This snapshot versions the model URL to avoid reuse of the previous GLB from cache. Earlier `4bd5725` screenshots may contain the cached older model; they are not final model evidence.
- A clean home screenshot and a Kyoto **mid-fold** screenshot were captured at1366×768. The latter still reports `data-scene=unfolding` and must not be called the settled city state.
- An isolated20s frame sample was started without screenshots, recording, or other browser interactions. It remained pending for roughly two minutes while scene progression was intermittent, even though `document.visibilityState` reported `visible`. The native browser window had earlier been reported minimized. The sample was abandoned by navigation before screenshots resumed. **No valid p95/p99 or smoothness result was obtained.** This observation is an environment limitation, not a measured foreground application performance result.
- The helper was subsequently improved to finish on an independent wall-clock timer, support cancellation, report callback starvation/late completion, and expose immediate scene diagnostics. This revised helper still needs browser verification after deployment.
- The opt-in **Finish current transition for static inspection** control explicitly jumps the actual scene timeline to its endpoint. Any screenshots obtained with it must be labeled static inspection. They cannot validate normal animation duration, transitions or smoothness. The helper records how many times it was used.

## Additional initial-layout coverage

The initial snapshot also passed: home chooser fit at1440×900 and1920×1080; Almaty list fit at768×1024 without horizontal overflow; rapid Lisbon → Kyoto → Almaty and repeated Almaty preserved the final selection and one canvas without observed console errors. All three Walk tabs had three stops with expected Previous/Next boundaries; all three Notes tabs contained city-specific content. These observations need to be distinguished from a full final-snapshot visual matrix.

## Unresolved evidence limits

No continuous normal-speed video has been produced.200% native browser zoom, OS/browser reduced-motion emulation, physical-phone touch behavior, Safari, context-loss recovery and representative foreground frame timing remain unverified. Do not infer these passes from screenshots, CSS viewport simulation, software rendering, or static inspection.
