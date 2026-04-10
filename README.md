# Troopod AI PM — Personalized Landing Page Prototype

This prototype lets a user provide an ad creative (upload or URL) and a landing page URL, and generates a personalized landing page (HTML) tailored to the ad.

Quick start

1. Install dependencies:

```bash
npm install
```

2. (Optional) Set `OPENAI_API_KEY` to enable real AI generation. If unset, the server uses a deterministic fallback template.

3. Run locally:

```bash
npm start
# open http://localhost:3000
```

Expose locally with `ngrok` or deploy to Vercel/Render to provide a live demo link.

Files of interest

- `server.js` — backend generator and file upload
- `views/index.ejs` — frontend form
- `public/js/main.js` — client logic and preview iframe
- `generated/` — output HTML files
- `docs/explanation.md` — brief system explanation you can copy to a Google Doc
