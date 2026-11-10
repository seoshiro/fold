# FOLD browser QA

## Scope and status

This is a work-in-progress QA log, not a declaration that FOLD is finished. Initial functional testing used public preview `https://seoshiro.github.io/fold/`, commit `a9ad3d8ba9008053c6d57f2207d0dae8fdee3687` on 2026-11-10. The initial model is intermediate; known geometry/lighting corrections and transparent fallback posters were still being prepared. Do not reuse initial screenshots as final-quality evidence.

## Actual test environments

- Cloud Chrome: public UI works but WebGL context creation failed in this environment. The app fell back to its paper edition. This does not establish a failure on hardware browsers. No 3D performance claim comes from this environment.
- `DESKTOP-KNKF2FM`, Windows, user's local Chrome through the browser extension: actual live WebGL rendered. Exact CSS viewport overrides verified using `innerWidth` and `innerHeight`. Browser version and graphics renderer still need the opt-in sampler. This is not a physical phone or Safari test.
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

1. **Return focus does not return to selected place.** Opening Gion from Places, then Back to the city, ultimately focused the first list item (Kiyomizu-dera). Its previous DOM trigger was unmounted. Developer corrected source to restore by semantic city/place key; public retest pending.
2. **Saved dialog initial Shift+Tab escapes.** Open Saved places, with initial focus on the dialog section, then Shift+Tab: focused footer link `Beibars Ileskhan` outside the dialog. Developer added initial/outside-focus trapping; public retest pending.
3. **Mobile home selector below screen.** At 360×800 and scrollY=0, header ended at y=80, but `.experience` began at y=185 because the first scene's 105px top margin collapsed outside it. Main height580, city choices y=799.6–850.6, below the 800px viewport. Developer added flow-root; public retest pending.
4. **Small targets.** Initial mobile language targets were roughly12–14×44px, scene tools21×32px. Developer enlarged them; public retest pending.

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

Recording has not yet been completed or validated. A helper's existence is not proof of a successful recording.

## Still required on a corrected public snapshot

- Retest all three reported behavioral/layout defects and target sizes.
- Actual continuous normal-speed desktop complete path, interruption path and mobile path.
- Stable and intermediate model poses, underside and paper closeups, model framing across all requested viewports.
- Full viewport matrix1366×768,1440×900,1920×1080,360×800,390×844,portrait tablet; resize during transitions; mobile orientation;200% zoom.
- Reduced-motion behavior; rapid/repeated city selection; back during unfolding; focus and keyboard order.
- Cold/repeat input timing, slow/resource-error behavior, no black/loading defects, fallback images after final assets, real context-loss recovery if accessible.
- Separate measured frame-interval and long-task sessions without recording or heavy tests.
- Physical phone and Safari remain untested unless later tested on actual hardware/browser.
