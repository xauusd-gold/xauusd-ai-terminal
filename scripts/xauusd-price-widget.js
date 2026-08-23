(() => {
  const API = 'https://api.gold-api.com/price/XAU';
  const INTERVAL = 5000;
  let el = null;
  let lastPrice = null;
  let lastSourceUpdate = null;

  // Dark transparent glass theme + visible animated network background.
  const networkStyle = document.createElement('style');
  networkStyle.textContent = `
    html,body{background:#020712!important;color:#eef7ff!important}
    body:before{z-index:-3!important;background:radial-gradient(circle at 10% 8%,rgba(0,111,190,.22) 0,transparent 32%),radial-gradient(circle at 88% 20%,rgba(0,174,255,.14) 0,transparent 30%),linear-gradient(145deg,#01040a 0%,#03101d 52%,#01050d 100%)!important}
    body:after{z-index:-2!important;opacity:.035!important;background-image:radial-gradient(#5dcfff 1px,transparent 1px)!important}
    body>.shell{position:relative;z-index:1}
    .glass{background:rgba(2,10,22,.42)!important;border:1px solid rgba(84,180,239,.22)!important;box-shadow:0 18px 55px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.05)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important}
    header.glass{background:rgba(2,9,18,.52)!important}
    .intro.glass{background:rgba(2,10,22,.38)!important}
    .next{background:linear-gradient(145deg,rgba(4,62,91,.58),rgba(0,126,154,.46))!important;border:1px solid rgba(74,205,255,.28)!important;box-shadow:0 18px 55px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.06)!important}
    .toolbar.glass{background:rgba(2,9,18,.48)!important}
    .event.glass{background:rgba(2,10,22,.38)!important}
    .stat{background:rgba(3,14,28,.36)!important;border-color:rgba(84,180,239,.2)!important}
    .chip,.refresh{background:rgba(3,15,29,.48)!important;color:#eaf7ff!important;border-color:rgba(84,180,239,.24)!important}
    .chip.active{background:#0b6fe8!important;color:#fff!important}
    .brand h1,.intro h2,.section-head h3,.event h4,.metric b{color:#f1f8ff!important}
    .brand p,.intro p,.stat span,.status,.section-head p,.datebar span,.event-title p,.metric span,.footer{color:#9bb8c9!important}
    .eyebrow{color:#26c7ff!important}
    .flag{background:rgba(18,79,112,.34)!important;border:1px solid rgba(87,198,255,.18)!important}
    .impact{background:rgba(24,116,157,.28)!important;color:#7edaff!important}
    .signal.wait{background:rgba(150,98,13,.28)!important;color:#ffd166!important}
    .signal.long{background:rgba(0,132,93,.22)!important;color:#55e6b4!important}
    .signal.short{background:rgba(190,37,67,.22)!important;color:#ff8297!important}
    #xauPriceWidget{background:rgba(2,12,24,.54)!important;border-color:rgba(84,180,239,.24)!important;color:#eef7ff!important;box-shadow:0 8px 24px rgba(0,0,0,.3)!important}
    #ferihaNetworkCanvas{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:.95;mix-blend-mode:screen}
  `;
  document.head.appendChild(networkStyle);

  const canvas = document.createElement('canvas');
  canvas.id = 'ferihaNetworkCanvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let particles = [];
  let width = 0, height = 0, dpr = 1;

  const resizeNetwork = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(42, Math.min(90, Math.round((width * height) / 18000)));
    particles = Array.from({length: count}, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * .28,
      vy: (Math.random() - .5) * .28,
      r: Math.random() * 2 + 1,
      phase: Math.random() * Math.PI * 2
    }));
  };

  const drawNetwork = (time = 0) => {
    ctx.clearRect(0, 0, width, height);
    const maxDist = Math.min(230, Math.max(145, width * .14));
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;
    }
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * .32;
          ctx.strokeStyle = `rgba(18,125,178,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    for (const p of particles) {
      const pulse = .7 + Math.sin(time * .0014 + p.phase) * .3;
      ctx.beginPath();
      ctx.fillStyle = `rgba(10,132,190,${.8 * pulse})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = `rgba(38,176,231,${.12 * pulse})`;
      ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(drawNetwork);
  };

  const bootNetwork = () => {
    resizeNetwork();
    requestAnimationFrame(drawNetwork);
  };
  window.addEventListener('resize', resizeNetwork, { passive: true });
  bootNetwork();

  const ensureWidget = () => {
    if (el && document.body.contains(el)) return el;
    const host = document.querySelector('.brand');
    if (!host) return null;
    el = document.createElement('div');
    el.id = 'xauPriceWidget';
    el.style.cssText = 'margin-left:auto;min-width:220px;padding:10px 14px;border:1px solid rgba(41,118,139,.14);border-radius:16px;background:rgba(255,255,255,.72);box-shadow:0 8px 24px rgba(49,109,125,.08)';
    host.parentElement.insertBefore(el, host.nextSibling);
    return el;
  };

  const render = (price, sourceUpdatedAt, live) => {
    const node = ensureWidget();
    if (!node) return;
    const p = Number(price);
    if (!Number.isFinite(p)) return;
    const change = lastPrice === null ? null : p - lastPrice;
    const pct = lastPrice && lastPrice !== 0 ? (change / lastPrice) * 100 : null;
    const sourceDate = sourceUpdatedAt ? new Date(sourceUpdatedAt) : null;
    const validDate = sourceDate && !Number.isNaN(sourceDate.getTime());
    const tick = validDate ? sourceDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }) + ' IST' : new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }) + ' IST';
    const changeText = change === null ? 'Waiting for next tick…' : `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(3)}%)`;
    const changeColor = change === null ? '#9bb8c9' : change >= 0 ? '#55e6b4' : '#ff8297';
    node.innerHTML = `<div style="font-size:10px;letter-spacing:1.1px;text-transform:uppercase;color:#9bb8c9;font-weight:800">XAU/USD <span style="color:${live ? '#55e6b4' : '#ff8297'}">● ${live ? 'LIVE' : 'OFFLINE'}</span></div><div style="font:800 24px Manrope;margin-top:2px;line-height:1.1;color:#f1f8ff">$${p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style="font-size:11px;color:${changeColor}">${changeText}</div><div style="font-size:9px;color:#9bb8c9;margin-top:2px">Last source tick: ${tick}</div>`;
  };

  const loadGoldPrice = async () => {
    try {
      const r = await fetch(`${API}?_=${Date.now()}`, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(`Gold API HTTP ${r.status}`);
      const data = await r.json();
      const price = Number(data.price);
      if (!Number.isFinite(price)) throw new Error('Invalid XAU price');
      const sourceUpdatedAt = data.updatedAt || data.timestamp || null;
      render(price, sourceUpdatedAt, true);
      lastPrice = price;
      lastSourceUpdate = sourceUpdatedAt;
    } catch (e) {
      console.warn('XAU/USD live feed:', e);
      const node = ensureWidget();
      if (node && lastPrice !== null) render(lastPrice, lastSourceUpdate, false);
      else if (node) node.innerHTML = '<div style="font-size:10px;letter-spacing:1.1px;text-transform:uppercase;color:#ff8297;font-weight:800">XAU/USD ● OFFLINE</div><div style="font-size:11px;color:#9bb8c9;margin-top:5px">Live price feed unavailable</div>';
    }
  };

  const boot = () => {
    loadGoldPrice();
    setInterval(loadGoldPrice, INTERVAL);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
