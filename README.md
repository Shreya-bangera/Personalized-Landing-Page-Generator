# Troopod AI PM — Personalized Landing Page Prototype

This prototype creates a personalized landing page from an input ad creative (upload or URL) and a landing page URL. It includes a server mode with optional OpenAI integration and a client-only demo that runs entirely in the browser (no API keys required).

Live demo
- Client-only demo (no server/OpenAI required):
- https://Shreya-bangera.github.io/Personalized-Landing-Page-Generator/ (served from `docs/`)

Quick start (local)

1. Install dependencies:

```bash
npm install
```

2. (Optional) Set `OPENAI_API_KEY` to enable AI generation (server mode). Without it the server uses the built-in fallback generator.

3. Run locally:

```bash
npm start
# open http://localhost:3000
```

Files of interest

- `server.js` — backend generator, optional OpenAI integration, upload handling, and fallback template
- `views/index.ejs` — frontend input form (upload/link/persona/mashup toggle)
- `public/js/main.js` — client logic, preview iframe, dominant color extraction
- `docs/` — client-only demo (static) and explanation files
- `generated/` — server-written generated HTML files and simple analytics log

Brief Explanation (suitable for a Google Doc)
------------------------------------------------
See `docs/explanation.md` for a concise Google-Doc-ready description. Key points are repeated below so you can copy them directly into a Google Doc:

- Goal: Given an ad creative (image or URL) and a landing page URL, create a short, conversion-focused, personalized landing page that reflects the ad’s tone and visual style.
- Flow: User → Client (color extraction, upload) → Server (OpenAI or fallback generator) → Generated HTML → Preview/Download.

How the system works (flow)
------------------------------------------------
1. Input collection: the user provides an ad creative (image upload or URL), a landing page URL, and optional persona metadata.
2. Client-side preprocessing: if an image is uploaded, the browser extracts an approximate dominant color to inform the page styling.
3. Generation orchestrator: `server.js` receives inputs. If `OPENAI_API_KEY` is set, it will attempt to generate a single, self-contained HTML document via OpenAI. On failure or when no key is set, the server uses a deterministic fallback template.
4. Output: the server writes `generated/<id>.html`, returns a preview link to the frontend, and logs the generation event to `generated/generation_logs.json`.

Key components / agent design
------------------------------------------------
- Frontend: `views/index.ejs` + `public/js/main.js` — collects inputs, performs lightweight image analysis (dominant color), uploads assets, and previews the generated page in an iframe.
- Backend agent: `server.js` — single Express process that acts as the generator agent. Responsibilities: validate input, optionally call OpenAI, apply a safe fallback, write HTML, and log the generation.
- Storage: `generated/` for quick previews in the prototype. For production, replace with object storage (S3) + CDN.

How the system handles specific concerns
------------------------------------------------
- Random changes
	- Controlled randomness is built into the fallback (color choice, copy variants) to avoid monotonous outputs while keeping consistency.
	- With OpenAI, randomness is controlled via prompt engineering and model temperature; for production you can fix temperature or sample multiple candidates and choose the best.

- Broken UI
	- The frontend shows simple errors and a fallback message; uploads are optional.
	- The server falls back to a deterministic template if AI generation fails; logs are written to `generated/generation_logs.json` for diagnosis.
	- For production, add input validation, graceful retries, and user-facing retry/regenerate buttons.

- Hallucinations
	- The prototype does not include a production content-safety pipeline. Recommended mitigations:
		- Sanitize/escape all user-provided text before embedding into HTML.
		- Run a post-generation content filter (classifier) to detect unsafe, fabricated, or misleading claims.
		- Keep CTAs limited to the provided landing URL to avoid redirecting to unexpected destinations.

- Inconsistent outputs
	- Provide preview + regenerate flows in the UI.
	- For production, produce N variants server-side and score them by heuristics (e.g., presence of CTA, read length, readability) or via a small ranking model.

Production considerations
------------------------------------------------
- Security: validate uploads (MIME checks, size limits), scan for malware, and escape content before publishing.
- Reliability: move uploads and generated pages to S3 or an equivalent object store and serve via CDN; monitor and alert on generation failures.
- Cost control: cache repeated generations, add per-user quotas, and cap OpenAI requests per minute.

Final status vs assignment
------------------------------------------------
- Meets the core assignment: users can input ad creatives (upload or link), enter a landing URL, and receive a generated personalized landing page.
- Live demo: a client-only static demo is published via GitHub Pages to satisfy the "Live Demo / Link" requirement (no server needed for the demo). Server features (OpenAI generation, landing-page mashup, analytics) are implemented in `server.js` and need server hosting to run.

Next steps I can take for you
------------------------------------------------
1. Deploy a persistent server demo on Fly/Render (no credit card required for Fly's free tier) and set `OPENAI_API_KEY` as an env var.
2. Add content-safety filtering and a regeneration UI.
3. Implement multi-variant generation + ranking.

If you want any of those, tell me which and I'll implement it.

