const genForm = document.getElementById('genForm');

// When an image is selected, extract a dominant-ish color via canvas
document.getElementById('adFile').addEventListener('change', async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  const colorInput = document.getElementById('dominantColor');
  if (!file || !colorInput) return;
  try {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = 40; const h = 40;
    canvas.width = w; canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let r=0,g=0,b=0,count=0;
    for (let i=0;i<data.length;i+=4){
      const alpha = data[i+3];
      if (alpha<128) continue;
      r += data[i]; g += data[i+1]; b += data[i+2]; count++;
    }
    if (count>0) {
      r = Math.round(r/count); g = Math.round(g/count); b = Math.round(b/count);
      const hex = '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
      colorInput.value = hex;
    }
    URL.revokeObjectURL(img.src);
  } catch (err) {
    console.warn('Color extraction failed', err);
  }
});

genForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const resDiv = document.getElementById('result');
  resDiv.innerText = 'Generating...';

  try {
    const resp = await fetch('/generate', { method: 'POST', body: fd });
    const data = await resp.json();
    if (data && data.preview) {
      resDiv.innerHTML = `<a target="_blank" href="${data.preview}">Open generated page</a> — Preview below:`;
      const iframe = document.createElement('iframe');
      iframe.src = data.preview;
      iframe.style.width = '100%';
      iframe.style.height = '600px';
      iframe.style.border = '1px solid #ddd';
      resDiv.appendChild(iframe);
    } else {
      resDiv.innerText = 'Generation failed';
    }
  } catch (err) {
    resDiv.innerText = 'Error: ' + (err.message || err);
  }
});
