(() => {
  const API = 'https://api.gold-api.com/price/XAU';
  const INTERVAL = 5000;
  let el = null;
  let lastPrice = null;
  let lastSourceUpdate = null;

  // Compact terminal density: keeps the existing UI structure but reduces vertical space.
  const compactStyle = document.createElement('style');
  compactStyle.id = 'ferihaCompactUi';
  compactStyle.textContent = `
    header{padding:14px 18px!important;border-radius:20px!important;gap:14px!important}
    .logo{width:42px!important;height:42px!important;border-radius:14px!important;font-size:18px!important}
    .brand{gap:10px!important}.brand h1{font-size:21px!important}.brand p{font-size:12px!important}
    .hero{margin:12px 0!important;gap:12px!important}
    .intro{padding:20px!important;border-radius:20px!important}
    .intro h2{font-size:36px!important;letter-spacing:-1.5px!important;margin:7px 0!important}
    .intro p{font-size:13px!important;line-height:1.45!important;margin:8px 0!important}
    .eyebrow{font-size:10px!important;letter-spacing:1.2px!important}
    .stats{gap:7px!important;margin-top:12px!important}.stat{padding:9px 11px!important;border-radius:13px!important}
    .stat b{font-size:16px!important}.stat span{font-size:10px!important}
    .next{padding:20px!important;border-radius:20px!important}.next h3{font-size:20px!important;margin:7px 0!important}
    .countdown{font-size:34px!important}.next small{font-size:10px!important}
    .toolbar{padding:9px 12px!important;border-radius:16px!important;gap:8px!important;top:6px!important}
    .filters{gap:6px!important}.chip,.refresh{padding:6px 10px!important;font-size:12px!important}
    .status{font-size:11px!important}.section-head{margin:18px 3px 8px!important}.section-head h3{font-size:20px!important}.section-head p{font-size:11px!important}
    .day{margin-bottom:10px!important}.datebar{margin:0 0 6px 8px!important;gap:7px!important}.datebar strong{font-size:14px!important}.datebar span{font-size:11px!important}
    .event{padding:12px 14px!important;border-radius:16px!important;gap:9px!important;margin-bottom:6px!important;grid-template-columns:minmax(190px,1.6fr) repeat(3,minmax(72px,.55fr)) minmax(130px,.7fr)!important}
    .event-title{gap:9px!important}.flag{width:32px!important;height:32px!important;border-radius:10px!important;font-size:15px!important}
    .event h4{font-size:14px!important;margin-bottom:1px!important}.event-title p,.metric span{font-size:10px!important}.metric b{font-size:12px!important;margin-top:1px!important}
    .impact{padding:3px 7px!important;font-size:9px!important}.signal{padding:8px 10px!important;border-radius:12px!important}.signal b{font-size:15px!important}.signal small{font-size:9px!important}
    .expand{padding-top:10px!important;gap:12px!important}.reason b{font-size:12px!important;margin-bottom:2px!important}.reason p{font-size:11px!important;line-height:1.35!important}
    .meter{height:7px!important}.meter-row{gap:8px!important}.score{font-size:15px!important}.footer{margin-top:14px!important;padding:12px!important;font-size:10px!important}
    #xauPriceWidget{min-width:205px!important;padding:8px 12px!important;border-radius:14px!important}
    @media(max-width:950px){.event{grid-template-columns:1fr 1fr 1fr!important}.event-title{grid-column:1/-1!important}.signal{grid-column:2/4!important}}
    @media(max-width:620px){header{padding:12px!important}.brand h1{font-size:18px!important}.hero{gap:9px!important}.intro{padding:16px!important}.intro h2{font-size:30px!important}.next{padding:16px!important}.toolbar{padding:8px!important}.event{grid-template-columns:1fr 1fr!important;padding:11px!important}.signal{grid-column:1/-1!important}.expand{grid-column:1/-1!important}}
  `;
  document.head.appendChild(compactStyle);

  const ensureWidget = () => {
    if (el && document.body.contains(el)) return el;
    const host = document.querySelector('.brand');
    if (!host) return null;
    el = document.createElement('div');
    el.id = 'xauPriceWidget';
    el.style.cssText = 'margin-left:auto;min-width:245px;padding:12px 16px;border:1px solid rgba(41,118,139,.14);border-radius:18px;background:rgba(255,255,255,.72);box-shadow:0 10px 28px rgba(49,109,125,.08)';
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
    const changeColor = change === null ? '#64808a' : change >= 0 ? '#07966f' : '#e34e65';
    node.innerHTML = `<div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#64808a;font-weight:800">XAU/USD <span style="color:${live ? '#07966f' : '#e34e65'}">● ${live ? 'LIVE' : 'OFFLINE'}</span></div><div style="font:800 24px Manrope;margin-top:2px">$${p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style="font-size:12px;color:${changeColor}">${changeText}</div><div style="font-size:10px;color:#64808a;margin-top:2px">Last source tick: ${tick}</div>`;
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
      else if (node) node.innerHTML = '<div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#e34e65;font-weight:800">XAU/USD ● OFFLINE</div><div style="font-size:12px;color:#64808a;margin-top:6px">Live price feed unavailable</div>';
    }
  };

  loadGoldPrice();
  setInterval(loadGoldPrice, INTERVAL);
})();
