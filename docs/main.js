function rgbToHex(r,g,b){return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('')}

async function extractColorFromFile(file){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload = ()=>{
      const w=40,h=40; const c=document.createElement('canvas'); c.width=w; c.height=h;
      const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,w,h);
      const d=ctx.getImageData(0,0,w,h).data; let r=0,g=0,b=0,cnt=0;
      for(let i=0;i<d.length;i+=4){ if(d[i+3]<128) continue; r+=d[i]; g+=d[i+1]; b+=d[i+2]; cnt++ }
      if(cnt===0) return resolve(''); r=Math.round(r/cnt); g=Math.round(g/cnt); b=Math.round(b/cnt); resolve(rgbToHex(r,g,b));
    };
    img.onerror=()=>resolve('');
    img.src = URL.createObjectURL(file);
  });
}

function buildHtml({headline,sub,hero,landingUrl,color}){
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${headline}</title>
  <style>body{font-family:Inter,system-ui,Arial;margin:0;background:#f7f9fc} .hero{background:${color};padding:40px;color:white;text-align:center} .container{max-width:900px;margin:24px auto;padding:16px;background:white;border-radius:8px}.cta{display:inline-block;margin-top:16px;padding:12px 20px;background:${color};color:#fff;border-radius:6px;text-decoration:none} img.heroimg{max-width:100%;height:auto;border-radius:8px}</style>
</head>
<body>
  <div class="hero"><h1>${headline}</h1><p>${sub}</p></div>
  <div class="container">
    ${hero?`<img class="heroimg" src="${hero}"/>`:''}
    <h2>Why this is for you</h2>
    <ul><li>Benefit-driven copy tuned to the ad</li><li>Short, scannable sections for conversions</li><li>Clear CTA to complete the user journey</li></ul>
    <a class="cta" href="${landingUrl}" target="_blank">Continue to offer</a>
    ${landingUrl?`<div style="margin-top:18px"><img src="https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(landingUrl)}&chs=150x150" style="width:120px"/><div style="font-size:12px;color:#666">Scan to open</div></div>`:''}
  </div>
</body>
</html>`;
}

document.getElementById('genForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const landingUrl = document.getElementById('landingUrl').value.trim();
  const adUrl = document.getElementById('adUrl').value.trim();
  const persona = document.getElementById('persona') ? document.getElementById('persona').value.trim() : '';
  const fileInput = document.getElementById('adFile');
  let hero = adUrl || '';
  const note = document.getElementById('note'); note.innerText = 'Generating in browser...';
  if(fileInput && fileInput.files && fileInput.files[0]){
    const file = fileInput.files[0];
    hero = URL.createObjectURL(file);
  }
  let color = document.getElementById('dominantColor').value || '';
  if(!color && fileInput && fileInput.files && fileInput.files[0]){
    color = await extractColorFromFile(fileInput.files[0]) || '#0b74de';
  }
  const headline = persona ? `For ${persona}: Get better results from this offer` : 'Personalized offer just for you';
  const sub = 'A focused, conversion-friendly page generated in your browser.';
  const html = buildHtml({headline,sub,hero,landingUrl,color});
  const w = window.open();
  w.document.open(); w.document.write(html); w.document.close();
  note.innerText = 'Opened generated page in a new tab.';
});

document.getElementById('downloadBtn').addEventListener('click', ()=>{
  const landingUrl = document.getElementById('landingUrl').value.trim();
  const adUrl = document.getElementById('adUrl').value.trim();
  const persona = document.getElementById('persona') ? document.getElementById('persona').value.trim() : '';
  const color = document.getElementById('dominantColor').value || '#0b74de';
  const headline = persona ? `For ${persona}: Get better results from this offer` : 'Personalized offer just for you';
  const sub = 'A focused, conversion-friendly page generated in your browser.';
  const hero = adUrl || '';
  const html = buildHtml({headline,sub,hero,landingUrl,color});
  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='personalized-page.html'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});
