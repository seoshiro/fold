# FOLD revision browser QA

Date: 2026-11-10 UTC  
Review target: https://seoshiro.github.io/fold/review/  
Release: `49f444634d7a67a0ac027b74071956034cf6d84b`  
Browser-observed entry: `assets/index-CKsJtpWG.js`  
Release scene/CSS: `scene-5qmgOc3-.js`, `index-DqoM36Jh.css`  
The original site at `/fold/` was not changed by this QA.

## Summary

The reported Almaty browser Back regression is fixed in the checked live WebGL path. All nine stories opened with the correct city, place, title, and focus, then returned successfully. No blocking functional defect was found in these checked paths.

**Motion acceptance remains open.** No uninterrupted real-WebGL recording was obtained. Still images and settled-state checks below do not establish animation smoothness, frame pacing, or complete transition continuity.

## Test conditions

- Windows laptop DESKTOP-KNKF2FM, connected Google Chrome, actual WebGL rendering. The scene displayed the three-dimensional crane and city geometry, not the fallback poster.
- Exact Chrome version, GPU model, and OS build were not re-measured during this revision pass. Earlier version/GPU reports are not treated as current measurements.
- Desktop city screenshot: 1521×768 image pixels. Subsequent functional checks used a separate active FOLD-only window; desktop story/Back screenshots are 1047×646 image pixels.
- Mobile tests used Chrome viewport overrides requested as **360×800** and **390×844**. These are desktop responsive tests, not physical-phone tests.
- Actual captured content sizes were **345×767** and **375×811** image pixels respectively. DOM content widths were 345 and 375 CSS px, matching the checked document widths without horizontal overflow. Effective viewport height was not separately sampled, so these captures should not be presented as independently verified exact 360×800/390×844 inner viewports.
- Heavy rendering work had ended before this revision test. A background-tab interval occurred initially; it is excluded from all timing conclusions. Subsequent navigation checks ran with the FOLD-only window active.
- Original EN language and zero saved places were preserved at completion. Temporary viewport overrides were reset.

## Navigation and context results

| Check | Result | Observed evidence |
|---|---|---|
| Kyoto → Kiyomizu-dera story → Close | PASS | Returned to Kyoto/Places and focused the initiating Kiyomizu-dera place button. |
| Almaty → RU → Walk → stop 2 → Green Bazaar story → browser Back | PASS | Returned to Almaty, Walk, stop 2, and Green Bazaar. Scroll returned to exactly 72 CSS px; focus returned to Open story. |
| Browser Forward after that Back | PASS | Green Bazaar story reopened with the correct story title and story focus. |
| Second browser Back | PASS | Walk/stop 2, 72 px scroll, and Open story focus were restored again. |
| Story identity during reverse | PASS, sampled state | Immediately after leaving Kyoto/Bazaar stories, the old story identity remained while the scene was returning; it cleared at the settled city state. This is a state observation, not a continuous-motion recording. |
| Rapid Back during an unfinished forward transition | UNRUN | Not covered by the settled-story Back/Forward test above. |
| Fallback Almaty → Lisbon atomic title/poster change | UNRUN on revision | Baseline fallback was available, but the revised fallback switch was not tested in this pass. |

The old public baseline `index-DVkWTar4.js` reproduced the original defect: Almaty Walk stop 2 → Bazaar story → Back incorrectly selected Places and lost initiating focus. That baseline failure is separate from the review-version passes above.

## Nine stories

Each listed story reached its matching city/place identity and title. Story focus was assigned correctly; Close returned to the city. The seven additional mobile story openings had document width equal to the checked viewport content width, with no horizontal overflow.

- Kyoto: Kiyomizu-dera, Gion, Kamo River.
- Lisbon: Alfama, Tram 28, Belém Tower.
- Almaty: Ascension Cathedral, Green Bazaar, Kok Tobe.

This pass verified opening, identity, focus, and return. It was not a new fact-check of every historical paragraph or external source.

## Visual and responsive observations

- Kyoto desktop: the shrine, pagoda, bridge, and river were visible together; geometry and the right-side city panel did not overlap in the captured state.
- Desktop story: the paper story panel remained separate from the crane/city composition.
- Mobile: the complete crane/city composition fit in the checked Almaty, Lisbon, and Kyoto frames. Numeric place markers and scene controls remained visible; the content stacked below the scene.
- Mobile story: the paper panel fit the narrow width, including Russian Green Bazaar and English Kiyomizu-dera text. Opening a story scrolled toward its reading panel; scrolling to the top revealed the complete scene above it.
- Kyoto at the 390×844 requested override: canvas CSS dimensions were **375.20×388.24 px**, with document top **approximately 80 px**, before, during, and after entering the story. No canvas layout-size/top-position jump was detected in those samples. This does not establish the absence of camera or geometry jumps between samples.
- EN/RU/KK title and tab labels switched correctly in all three cities. Lisbon and Kyoto were checked at the 390×844 requested override; Almaty also covered RU/KK walk labels.
- The inspected entrance console log subset contained no warning/error. A complete console or long-session memory audit was not performed.

## Recording and timing limits

- Continuous capture of the page could not be obtained through the available permitted method. No video was recorded, and no canvas recording was substituted.
- A valid isolated 20-second frame-timing sample could not be produced through the available supported browser measurement surface. No FPS, dropped-frame rate, or performance pass is claimed.
- Cold entrance → Kyoto → place → story → return was navigated, but it was **not** captured as one uninterrupted video.
- Reduced-motion behavior and revision fallback switching remain unverified in this browser pass.

## Fresh still evidence

All files below are unedited browser stills, not recordings or synthetic renders. Paths are relative to this report.

| File | Image size | Contents |
|---|---:|---|
| [Kyoto city](evidence/revision-browser/kyoto-city.jpg) | 1521×768 | Settled desktop Kyoto composition. |
| [Kyoto story](evidence/revision-browser/kyoto-story.jpg) | 1047×646 | Desktop Kiyomizu-dera story and scene. |
| [Almaty Back](evidence/revision-browser/almaty-back.jpg) | 1047×646 | RU Walk stop 2 restored after repeated Back/Forward. |
| [Almaty narrow layout](evidence/revision-browser/mobile360-almaty.jpg) | 345×767 | 360×800 requested override, walk stop 2. |
| [Bazaar reading panel](evidence/revision-browser/mobile360-story.jpg) | 345×767 | Narrow Russian story panel. |
| [Bazaar scene and story](evidence/revision-browser/mobile360-story-top.jpg) | 345×767 | Scene above the stacked story. |
| [Lisbon narrow layout](evidence/revision-browser/mobile390-lisbon.jpg) | 375×811 | 390×844 requested override, Lisbon scene. |
| [Kyoto narrow layout](evidence/revision-browser/mobile390-kyoto.jpg) | 375×811 | 390×844 requested override, Kyoto scene. |
| [Kyoto narrow story](evidence/revision-browser/mobile390-kyoto-story.jpg) | 375×811 | Kiyomizu-dera reading panel. |

## Acceptance status

**Functional correction checked successfully; motion acceptance not complete.** A continuous real-WebGL recording and valid isolated frame-timing evidence are still required before claiming the requested motion review is finished.
