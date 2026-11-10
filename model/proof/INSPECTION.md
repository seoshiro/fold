# Source-model detail inspection

Rendered from the packed `model/fold-master.blend`, without changing geometry or the runtime scene. Exact camera, engine, file hash and sampling conditions are in `detail-render-conditions.json`.

- `paper-closeup.png`: Kyoto fully open, 1000 × 750, CPU Cycles, 24 samples, four threads, no denoising. The near wing has a visible thin edge. River strokes remain on the continuous wing surface; the house and bridge cards rise from that same surface.
- `wing-underside.png`: the same open pose from a deliberately low inspection angle. The render ground is hidden and the image has transparent film so the ground cannot obscure the lower sheets. The underside is present, including the attached lower folds; no missing lower faces or obvious architecture protrusion through the deck is visible in this view.

## Limits visible in these proofs

The river is made from slightly raised ink strokes, not a perfectly flat printed texture. At this macro scale those strokes read as embossed lines. The thin façades and shallow return folds are an artistic pop-up construction rather than a mechanically engineered paper kit.

The low-sample Cycles renders contain sampling grain. Do not treat all visible grain as paper fibers, or these still images as evidence of browser frame rate, continuous animation quality or collision-free motion. This underside inspection concerns the fully open pose; intermediate source poses are recorded separately in `hinge-000.png` through `hinge-100.png`.
