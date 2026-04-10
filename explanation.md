# System Overview

Flow
- User provides an ad creative (upload or URL) and a landing page URL via the web form.
- The server receives the input, and either (A) calls OpenAI (if `OPENAI_API_KEY` set) to generate a single self-contained HTML document, or (B) uses a deterministic template fallback that injects the ad reference and landing URL into a conversion-focused layout.
- The server saves the generated HTML in `generated/<id>.html` and returns a preview link to the frontend.

Unique features added in this build
- Dominant color extraction: client-side canvas extracts an approximate dominant color from uploaded creatives and applies it to the generated page for cohesive branding.
- Mashup mode: server optionally fetches the landing page title/meta and blends it into the generated copy to increase contextual relevance.
- QR code: generated pages include a QR code that links to the original landing page for easy mobile handoff from the creative.
- Simple analytics: generation events are logged to `generated/generation_logs.json`; a lightweight `/stats` route summarizes recent activity.

Key components / agent design
- Frontend: simple form + preview iframe (`views/index.ejs`, `public/js/main.js`).
- Backend: Express server (`server.js`) handling uploads with `multer`, optional OpenAI integration, and fallback generator.
- Storage: generated HTML files under `generated/` served by Express.

Handling edge cases
- Random changes: the fallback generator includes random color selection and copy variations to simulate diversity. When using OpenAI, temperature and prompt control handle randomness.
- Broken UI: the frontend gracefully shows errors; server logs failures and falls back to template generator when OpenAI fails.
- Hallucinations: when using model output, keep the generated page clearly labeled as "personalized page" and keep CTAs linking to the original landing URL only. For production, validate model output (sanitization, allowed domains, and content filters) before publishing.
- Inconsistent outputs: include a preview step (this prototype shows an iframe preview). For production, run multiple generations and pick the highest-scoring variant using heuristics (readability, length, presence of CTA).

Assumptions
- Prototype does not perform image understanding; image uploads are embedded as-is. For full vision-based personalization, integrate a vision model or metadata extractor.
- OpenAI key is optional; the prototype works without it.

Next steps to make it production-ready
- Add content-safety checks and sanitization.
- Add A/B testing harness to evaluate generated pages.
- Integrate image analysis (vision) to extract color palettes and messaging cues from creatives.
- Add persistent datastore and authentication for multi-user flows.
