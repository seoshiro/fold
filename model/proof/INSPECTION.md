# Source-model detail inspection

Rendered from `model/fold-master.blend`, without changing geometry or the runtime scene. Exact camera, engine, file hash and sampling conditions are recorded beside each render set. The landmark, poster and fold-pose pass preceded the final portable texture embedding; `source-pack-audit.json` verifies identical mesh coordinates, faces, transforms, material assignments, material image bytes and camera in both source containers. Detail and underside views use the final packed source.

- `paper-closeup.png`: Kyoto fully open, 1000 × 750, CPU Cycles, 24 samples, four threads, no denoising. The near wing has a visible thin edge. River strokes remain on the continuous wing surface; the house and bridge cards rise from that same surface.
- `wing-underside.png`: the same open pose from a deliberately low inspection angle. The render ground is hidden and the image has transparent film so the ground cannot obscure the lower sheets. The underside is present, including the attached lower folds; no missing lower faces or obvious architecture protrusion through the deck is visible in this view.
- `kyoto-landmarks.png`: the wider Kiyomizu-inspired hall, open veranda trestles, decorative pagoda, machiya and bridge, without interface labels. The hall, not the decorative pagoda, is the Kiyomizu place anchor.
- `lisbon-landmarks.png`: separated hillside rows with mixed roof profiles and paper terrace risers, a larger windowed yellow tram, and the broad bastion/arched loggia/turret silhouette of the Belém-inspired tower. The buildings remain thin die-cut cards with shallow return folds.

The two landmark views use 1400 × 1000, CPU Cycles, 24 samples and four threads. `landmark-render-conditions.json` records the exact source hash and camera. The refreshed five fold-pose stills have their own `hinge-render-conditions.json`. `export-audit.json` records structural GLB checks, including all 48 hinge names and nine place anchors retained from the previous export. The four transparent fallback posters use the same geometry and material image bytes as the packed source; their source and output hashes are in `../poster-manifest.json`.

## Limits visible in these proofs

The river is made from slightly raised ink strokes, not a perfectly flat printed texture. At this macro scale those strokes read as embossed lines. The thin façades and shallow return folds are an artistic pop-up construction rather than a mechanically engineered paper kit.

The low-sample Cycles renders contain sampling grain. Do not treat all visible grain as paper fibers, or these still images as evidence of browser frame rate, continuous animation quality or collision-free motion. This underside inspection concerns the fully open pose; intermediate source poses are recorded separately in `hinge-000.png` through `hinge-100.png`.
