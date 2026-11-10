# Higgsfield paper provenance

FOLD used **one generation costing 2.75 Higgsfield credits**, within its separate 150-credit cap. Remaining project allowance: **147.25 credits**. No repeat generation, credit purchase or subscription purchase was made.

## Generation

- Model: **GPT Image 2.6**, model ID `gpt_image_2_6`, provider OpenAI.
- Job ID: `050d8611-24a3-469c-a223-2e525135851f`.
- Parameters: one image, 1:1, 2k, high quality, opaque PNG. The complete exact prompt and parameters are in `assets/higgsfield/fold-paper-001/prompt.txt` and `params.json`.
- Exact preflight quote: **2.75 credits**. Actual debit: **2.75 credits**, verified by the matching account-balance delta. Full account balances are not published. No provider invoice was available.
- Original: `assets/higgsfield/fold-paper-001/original.png`, 2048×2048 RGB, 5,173,768 bytes, preserved unchanged. SHA-256: `1ae4c125bf5174047ca948aae3a14827316e70f24dd0aeed9cbf6b6d0e757cdc`.

## Preparation and outputs

The purpose was a subtle washi surface for the actual Blender crane. The image contains fine irregular cellulose-like fibers, no lettering, objects, folds or baked directional shadows. The original was slightly too yellow and its edges were not exactly matched. These issues were corrected locally without another generation.

`tools/prepare_higgsfield_paper.py` performs deterministic Lanczos downsampling, normalization toward warm ivory RGB 234/223/201, restrained color variation, and 24px cosine edge blending. The original and an exact-seam working master remain available. The script requires Python, Pillow and NumPy and makes no external calls.

- Runtime albedo: `public/textures/higgsfield-washi-albedo.webp`, 1024², **113,208 bytes**, WebP quality 94, sRGB. Mean opposite-edge mismatch is below 0.8/255 after compression.
- Optional height: `public/textures/higgsfield-washi-height.webp`, 1024², 412,764 bytes. A high-pass luminance derivative, not measured physical depth. Use linear color space and restrained bump strength only if it improves the site.
- Exact processing, dimensions, file sizes and SHA-256 hashes: `assets/higgsfield/fold-paper-001/processing.json`.

## Acceptance

**Texture inspection is complete; actual site acceptance remains pending desktop WebGL QA.** Closed, intermediate, unfolded and close-up views must be checked in the site's lighting for seams, sparkle, plastic-looking relief and loading cost. No second generation has been submitted or scheduled. A future retry requires a concrete flaw, a current quote, and sufficient remaining project allowance.

The paper was generated for this project through the user's connected Higgsfield account, subject to applicable Higgsfield/provider terms. No third-party paper photograph or city mesh was copied; no CC0 claim is made.

## Publication record

`assets/higgsfield/fold-paper-001/provenance.json` is the sanitized publication manifest and includes a file allowlist. Raw service receipts are retained locally in the git-ignored `local-receipts/` directory and **must not be published**. Public records contain no service download URLs, account-balance values or credentials. `docs/generation-ledger.json` records the project spend separately from earlier projects.
