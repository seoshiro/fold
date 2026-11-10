# FOLD paper master

Original thin-paper sculpture built in Blender 4.3.2 by `tools/build_model.py`. The approved concept images were visual references, not imported textures or hidden background planes. All camera-visible architecture, trees, rivers, wings, body, neck and tail are actual mesh geometry. This is an artistic pop-up construction, not a claim that every part folds from one uncut square.

## Source and controls

- `fold-master.blend`: one master crane, separate covers, 48 independently named architecture hinges, three city groups, label anchors and story tab. Textures are packed. Timeline 1–100 demonstrates closed to open geometry. Only Kyoto is enabled for rendering by default; enable the descendants of another CITY group to inspect it.
- `../public/models/fold-master.glb`: web export of the same geometry. The render-only camera, ground and lights are excluded.
- `../src/scene.ts`: single transform owner. GSAP animates scalar pose values; WebGL draws only while dirty. Switching cities replaces the current intent and continues from actual pose values.
- `viewer.html`: isolated visual proof page when served by Vite. `window.__FOLD_SCENE.setProgress('kyoto', 0.5)` holds a reproducible intermediate pose; `getStats()` returns actual renderer draw calls, triangles, current pose and viewport.

Blender axes are Z-up. The glTF export is Y-up. Every architecture `HINGE_` uses a local X baseline, and every folder is a child of the common `WING_attachment`. Neither city navigation nor story navigation replaces the canvas or swaps the crane.

## Rebuild

From the repository root:

    blender -b --python tools/build_model.py -- --proof --render
    blender -b --python tools/finalize_model.py
    python tools/optimize_glb.py
    python tools/package_posters.py

`tools/render_model.py` can re-render a saved source without rerunning geometry generation. Add `-- --proof` for the five intermediate views. The installed Blender build lacks OpenImageDenoise, so renders intentionally use CPU Cycles without denoising. Runtime shadows are real-time and are not Blender's baked ground.

## Material provenance

The initial paper map is original deterministic procedural work. One approved Higgsfield generation improves the final washi albedo; the generation and processing records are documented separately. The web uses 1024px WebP albedo and restrained high-pass bump. A 512px JPEG is embedded in the GLB as an optional-texture failure fallback. All other materials are original flat printed inks with roughness 1 and metalness 0.

## Physical interpretation and limits

Architecture uses thin die-cut cards with shallow return folds and pitched paper roof facets. Its closed footprint fits within a layered folio envelope; it is not a mechanically engineered retail pop-up book. Exact paper collision solving is not performed. The animated scene uses rigid fold rotations, not elastic facade scaling, cloth simulation or hidden screenshot swaps. Landmark groups are explicit artistic interpretations rather than metric scans. The temple hall is the Kiyomizu story anchor; the small tiered pagoda is an unnamed decorative Kyoto motif.

The source is made to be inspected and edited. City geometry, material slots and hinge nodes remain distinct. Meshes sharing a rigid parent and material are joined to reduce draw calls; this does not merge independent animated pivots. See `asset-manifest.json` for evaluated counts and exact export size.

Final master: 24,688 evaluated triangles across 228 rigid mesh objects, before visibility culling. Optimized GLB: 1,320,752 bytes. The optional high-pass image is not a tangent-space normal map; the optimizer strips Blender’s incorrect normal link and the runtime uses it as a small bump perturbation.
