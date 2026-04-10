const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const os = require('os');

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
let openai = null;
if (OPENAI_KEY) {
  try {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: OPENAI_KEY });
  } catch (err) {
    console.warn('OpenAI package not available or failed to init, falling back to template generator');
    openai = null;
  }
}

const app = express();
const upload = multer({ dest: path.join(__dirname, 'public', 'uploads') });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/generated', express.static(path.join(__dirname, 'generated')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/generate', upload.single('adFile'), async (req, res) => {
  const landingUrl = req.body.landingUrl || '';
  const adUrl = req.body.adUrl || '';
  const persona = req.body.persona || '';
  const dominantColor = req.body.dominantColor || '';
  const mashup = (req.body.mashup || 'off') === 'on';
  const adFile = req.file ? `/public/uploads/${path.basename(req.file.path)}` : null;

  const reference = adFile || adUrl || 'ad creative (no file)';

  let html = '';
  try {
    if (openai) {
      const prompt = `You are a page generator. Given an ad creative reference: "${reference}" and landing URL: "${landingUrl}" and persona: "${persona}", produce a single self-contained HTML string for a personalized landing page. Keep CSS inline and image references as provided. Include headline, subhead, hero image if available, short benefits, and one CTA button that links to ${landingUrl}.`;

      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'Generate a single valid HTML document.' }, { role: 'user', content: prompt }],
        max_tokens: 1500
      });
      html = resp.choices && resp.choices[0] && resp.choices[0].message.content;
    }
  } catch (err) {
    console.error('OpenAI generation failed:', err?.message || err);
    openai = null; // fallback
  }

  // If mashup is enabled, try to fetch landing page metadata to blend into copy
  let lpTitle = '';
  let lpDesc = '';
  if (mashup && landingUrl) {
    try {
      const resp = await fetch(landingUrl, { method: 'GET' });
      const txt = await resp.text();
      const mtitle = txt.match(/<title>([^<]+)<\/title>/i);
      const mdesc = txt.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) || txt.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
      lpTitle = mtitle ? mtitle[1].trim() : '';
      lpDesc = mdesc ? mdesc[1].trim() : '';
    } catch (err) {
      console.warn('Could not fetch landing page for mashup:', err?.message || err);
    }
  }

  if (!html) {
    // Fallback deterministic generator
    const colors = ['#0b74de', '#e83e8c', '#ff8c00', '#2ecc71', '#6f42c1', '#ff6b6b'];
    const color = dominantColor || colors[Math.floor(Math.random() * colors.length)];
    const headline = persona ? `For ${persona}: Get better results from this offer` : 'Personalized offer just for you';
    const sub = lpTitle ? `Based on: ${lpTitle}` : 'We matched the ad to your needs and created this focused landing page.';
    const hero = adFile ? adFile : (adUrl || '');

    // generate QR code pointing to landing page
    let qrDataUrl = '';
    try {
      qrDataUrl = landingUrl ? await QRCode.toDataURL(landingUrl) : '';
    } catch (err) {
      console.warn('QR generation failed', err?.message || err);
    }

    html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Personalized Page</title>
  <style>
    body{font-family:Inter,system-ui,Arial;margin:0;padding:0;background:#f7f9fc}
    .hero{background:${color};padding:40px;color:white;text-align:center}
    .container{max-width:900px;margin:24px auto;padding:16px;background:white;border-radius:8px}
    .cta{display:inline-block;margin-top:16px;padding:12px 20px;background:${color};color:#fff;border-radius:6px;text-decoration:none}
    img.heroimg{max-width:100%;height:auto;border-radius:8px}
  </style>
</head>
<body>
  <div class="hero">
    <h1>${headline}</h1>
    <p>${sub}</p>
  </div>
    <div class="container">
    ${hero ? `<img class="heroimg" src="${hero}" alt="ad-hero"/>` : ''}
    <h2>Why this is for you</h2>
    <ul>
      <li>Benefit-driven copy tuned to the ad</li>
      <li>Short, scannable sections for conversions</li>
      <li>Clear CTA to complete the user journey</li>
    </ul>
    <a class="cta" href="${landingUrl}" target="_blank">Continue to offer</a>
    ${qrDataUrl ? `<div style="margin-top:18px"><img src="${qrDataUrl}" alt="qr" style="width:120px;border-radius:8px"/><div style="font-size:12px;color:#666">Scan to open</div></div>` : ''}
  </div>
</body>
</html>`;
  }

  const id = uuidv4();
  const filename = path.join(__dirname, 'generated', `${id}.html`);
  fs.mkdirSync(path.join(__dirname, 'generated'), { recursive: true });
  fs.writeFileSync(filename, html, 'utf8');

  // Log generation event for simple analytics
  try {
    const logDir = path.join(__dirname, 'generated');
    const logFile = path.join(logDir, 'generation_logs.json');
    const entry = { id, timestamp: Date.now(), landingUrl, adRef: reference, persona, mashup, dominantColor };
    let arr = [];
    if (fs.existsSync(logFile)) {
      try { arr = JSON.parse(fs.readFileSync(logFile, 'utf8') || '[]'); } catch (e) { arr = []; }
    }
    arr.push(entry);
    fs.writeFileSync(logFile, JSON.stringify(arr, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to write logs', err?.message || err);
  }

  res.json({ preview: `/generated/${id}.html`, id });
});

// Simple admin/stats endpoint showing counts and last entries
app.get('/stats', (req, res) => {
  const logFile = path.join(__dirname, 'generated', 'generation_logs.json');
  if (!fs.existsSync(logFile)) return res.send('<pre>No logs yet</pre>');
  try {
    const arr = JSON.parse(fs.readFileSync(logFile, 'utf8'));
    const count = arr.length;
    const last = arr.slice(-5).reverse();
    let html = `<h2>Generation stats</h2><p>Total: ${count}</p><h3>Last 5</h3><ul>`;
    for (const e of last) html += `<li>${new Date(e.timestamp).toLocaleString()} — ${e.adRef} → ${e.landingUrl} (${e.persona || '—'})</li>`;
    html += `</ul>`;
    res.send(html);
  } catch (err) {
    res.send('<pre>Failed to read logs</pre>');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
