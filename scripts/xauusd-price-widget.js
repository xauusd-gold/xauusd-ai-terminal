(() => {
  const API = 'https://api.gold-api.com/price/XAU';
  const INTERVAL = 5000;
  let el = null;
  let lastPrice = null;
  let lastSourceUpdate = null;

  // Visual layer: animated financial-network background + dark glass UI.
  const visualStyle = document.createElement('style');
  visualStyle.id = 'ferihaAnimatedVisuals';
  visualStyle.textContent = `
    :root{
      --ink:#f4f8ff!important;--muted:#9db0c5!important;--line:rgba(90,160,220,.20)!important;
      --aqua:#19b9ff!important;--blue:#2b8cff!important;--green:#16c784!important;--red:#ff5b6e!important;
      --amber:#e6aa28!important;--glass:rgba(5,14,29,.72)!important;--shadow:0 18px 55px rgba(0,0,0,.34)!important
    }
    html,body{background:#020713!important;color:#f4f8ff!important}
    body:before{background:radial-gradient(circle at 15% 12%,rgba(0,110,255,.16),transparent 32%),radial-gradient(circle at 88% 28%,rgba(0,190,255,.12),transparent 30%),linear-gradient(150deg,#020713 0%,#06101f 52%,#020713 100%)!important}
    body:after{opacity:.07!important;background-image:radial-gradient(#4ba9ff 1px,transparent 1px)!important}
    #ferihaNetworkCanvas{position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;opacity:.72}
    .shell{position:relative;z-index:1}
    .glass{background:linear-gradient(145deg,rgba(7,18,36,.80),rgba(4,12,25,.68))!important;border:1px solid rgba(85,160,225,.20)!important;box-shadow:0 18px 55px rgba(0,0,0,.30)!important;backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important}
    header{border-color:rgba(91,166,232,.22)!important}
    .logo{background:linear-gradient(145deg,#10b9ca,#1768bc)!important;box-shadow:0 10px 28px rgba(22,143,220,.28)!important}
    .brand h1,.intro h2,.section-head h3,.event h4,.next h3{color:#f5f8ff!important}
    .brand p,.intro p,.stat span,.section-head p,.datebar span,.event-title p,.metric span,.status,.footer{color:#91a6bc!important}
    .eyebrow{color:#19b9ff!important}
    .intro h2 span{color:#2b8cff!important}
    .stat{background:rgba(5,18,34,.58)!important;border-color:rgba(83,153,216,.18)!important}
    .stat b{color:#f4f8ff!important}
    .next{background:linear-gradient(145deg,rgba(8,93,148,.88),rgba(6,145,171,.84))!important;border:1px solid rgba(58,185,255,.28)!important}
    .next .eyebrow,.next small{color:#d7f6ff!important}
    .toolbar{background:rgba(5,14,29,.78)!important}
    .chip,.refresh{background:rgba(9,23,43,.76)!important;color:#dcecff!important;border-color:rgba(83,153,216,.22)!important}
    .chip.active{background:linear-gradient(135deg,#147de0,#0a9fda)!important;color:#fff!important;border-color:transparent!important}
    .refresh{color:#54b9ff!important}
    .event{background:linear-gradient(145deg,rgba(8,21,39,.82),rgba(4,13,27,.72))!important;border-color:rgba(83,153,216,.18)!important}
    .event:hover{box-shadow:0 23px 58px rgba(0,0,0,.40)!important}
    .flag{background:rgba(16,48,77,.72)!important}
    .impact{background:rgba(24,88,126,.30)!important;color:#62c7ff!important}
    .signal.wait{background:rgba(91,65,18,.48)!important;color:#f0bd50!important}
    .signal.long{background:rgba(9,112,81,.28)!important;color:#2ee0a0!important}
    .signal.short{background:rgba(133,30,49,.30)!important;color:#ff7180!important}
    .expand{border-color:rgba(83,153,216,.18)!important}
    .meter{background:rgba(85,130,160,.20)!important}
    .empty{background:rgba(5,14,29,.72)!important}
    .footer{color:#70879e!important}
    #xauPriceWidget{min-width:220px!important;padding:10px 14px!important;border:1px solid rgba(74,155,220,.24)!important;border-radius:16px!important;background:rgba(5,16,32,.76)!important;box-shadow:0 8px 24px rgba(0,0,0,.22)!important}
    @media(max-width:620px){#xauPriceWidget{min-width:0!important;padding:7px 9px!important}.brand h1{color:#fff!important}}
  `;
  document.head.appendChild(visualStyle);

  const canvas = document.createElement('canvas');
  canvas.id = 'ferihaNetworkCanvas';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let nodes = [];
  let raf = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const resizeNetwork = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(46, Math.max(24, Math.floor((innerWidth * innerHeight) / 36000)));
    nodes = Array.from({length: count}, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      vx: (Math.random() - .5) * .16, vy: (Math.random() - .5) * .16,
      r: Math.random() * 1.8 + .8, phase: Math.random() * Math.PI * 2
    }));
  };

  const drawNetwork = (t) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = innerWidth + 20;
      if (n.x > innerWidth + 20) n.x = -20;
      if (n.y < -20) n.y = innerHeight + 20;
      if (n.y > innerHeight + 20) n.y = -20;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 185) {
          const alpha = (1 - dist / 185) * .28;
          ctx.strokeStyle = `rgba(37,146,235,${alpha})`;
          ctx.lineWidth = .7;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      const pulse = 1 + Math.sin(t * .0012 + n.phase) * .35;
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r*pulse,0,Math.PI*2);
      ctx.fillStyle = 'rgba(0,151,255,.75)'; ctx.shadowBlur = 9; ctx.shadowColor = 'rgba(0,151,255,.55)'; ctx.fill(); ctx.shadowBlur = 0;
    }
    raf = requestAnimationFrame(drawNetwork);
  };

  resizeNetwork();
  window.addEventListener('resize', resizeNetwork, {passive:true});
  cancelAnimationFrame(raf); raf = requestAnimationFrame(drawNetwork);

  const ensureWidget = () => {
    if (el && document.body.contains(el)) return el;
    const host = document.querySelector('.brand');
    if (!host) return null;
    el = document.createElement('div');
    el.id = 'xauPriceWidget';
    el.style.cssText = 'margin-left:auto;min-width:220px;padding:10px 14px;border:1px solid rgba(74,155,220,.24);border-radius:16px;background:rgba(5,16,32,.76);box-shadow:0 8px 24px rgba(0,0,0,.22)';
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
    const tick = validDate
      ? sourceDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }) + ' IST'
      : new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }) + ' IST';
    const changeText = change === null ? 'Waiting for next tick…' : `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(3)}%)`;
    const changeColor = change === null ? '#91a6bc' : change >= 0 ? '#16c784' : '#ff5b6e';
    node.innerHTML = `<div style="font-size:10px;letter-spacing:1.1px;text-transform:uppercase;color:#91a6bc;font-weight:800">XAU/USD <span style="color:${live ? '#16c784' : '#ff5b6e'}">● ${live ? 'LIVE' : 'OFFLINE'}</span></div><div style="font:800 24px Manrope;color:#f4f8ff;margin-top:2px;line-height:1.1">$${p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style="font-size:11px;color:${changeColor}">${changeText}</div><div style="font-size:9px;color:#91a6bc;margin-top:2px">Last source tick: ${tick}</div>`;
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
      else if (node) node.innerHTML = '<div style="font-size:10px;letter-spacing:1.1px;text-transform:uppercase;color:#ff5b6e;font-weight:800">XAU/USD ● OFFLINE</div><div style="font-size:11px;color:#91a6bc;margin-top:5px">Live price feed unavailable</div>';
    }
  };

  const boot = () => {
    loadGoldPrice();
    setInterval(loadGoldPrice, INTERVAL);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
