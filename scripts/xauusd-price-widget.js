(() => {
  const API = 'https://api.gold-api.com/price/XAU';
  const INTERVAL = 5000;
  let el = null;
  let lastPrice = null;
  let lastSourceUpdate = null;

  const compactStyle = document.createElement('style');
  compactStyle.id = 'ferihaCompactUi';
  compactStyle.textContent = `
    header{padding:10px 15px!important;border-radius:15px!important;gap:11px!important}
    .logo{width:34px!important;height:34px!important;border-radius:10px!important;font-size:14px!important}
    .brand{gap:8px!important}.brand h1{font-size:18px!important}.brand p{font-size:11px!important}
    .live{font-size:10px!important;gap:6px!important}.dot{width:7px!important;height:7px!important}
    .hero{margin:9px 0!important;gap:8px!important}.intro{padding:13px!important;border-radius:15px!important}
    .intro h2{font-size:27px!important;letter-spacing:-1px!important;margin:4px 0!important}.intro p{font-size:11px!important;line-height:1.35!important;margin:5px 0!important}
    .eyebrow{font-size:9px!important;letter-spacing:1px!important}.stats{gap:5px!important;margin-top:8px!important}.stat{padding:7px 8px!important;border-radius:10px!important}.stat b{font-size:14px!important}.stat span{font-size:9px!important}
    .next{padding:13px!important;border-radius:15px!important}.next h3{font-size:16px!important;margin:4px 0!important}.countdown{font-size:25px!important}.next small{font-size:9px!important}
    .toolbar{padding:6px 9px!important;border-radius:12px!important;gap:6px!important;top:5px!important}.filters{gap:4px!important}.chip,.refresh{padding:5px 8px!important;font-size:11px!important}.status{font-size:10px!important}
    .section-head{margin:11px 2px 5px!important}.section-head h3{font-size:17px!important}.section-head p{font-size:10px!important;margin:1px 0!important}.day{margin-bottom:6px!important}.datebar{margin:0 0 4px 5px!important;gap:5px!important}.datebar strong{font-size:14px!important}.datebar span{font-size:10px!important}
    .event{padding:8px 10px!important;border-radius:12px!important;gap:7px!important;margin-bottom:4px!important;min-height:64px!important;grid-template-columns:minmax(170px,1.6fr) repeat(3,minmax(62px,.55fr)) minmax(105px,.7fr)!important}
    .event:hover{transform:none!important;box-shadow:none!important}.event-title{gap:8px!important}.flag{width:30px!important;height:30px!important;border-radius:8px!important;font-size:13px!important}
    .event h4{font-size:15px!important;margin-bottom:0!important;line-height:1.2!important}.event-title p,.metric span{font-size:11px!important;line-height:1.15!important}.metric b{font-size:12px!important;margin-top:0!important}
    .impact{padding:2px 6px!important;font-size:8px!important}.signal{padding:6px 8px!important;border-radius:9px!important}.signal b{font-size:15px!important}.signal small{font-size:9px!important}
    .expand{display:none!important}.meter{height:4px!important}.meter-row{gap:5px!important}.score{font-size:11px!important}.footer{margin-top:8px!important;padding:8px!important;font-size:9px!important}
    #xauPriceWidget{min-width:170px!important;padding:6px 9px!important;border-radius:10px!important}
    #xauPriceWidget div:nth-child(2){font-size:19px!important}
    @media(max-width:950px){.event{grid-template-columns:1fr 1fr 1fr!important}.event-title{grid-column:1/-1!important}.signal{grid-column:2/4!important}}
    @media(max-width:620px){header{padding:9px!important}.brand h1{font-size:16px!important}.brand p{display:none!important}.hero{gap:6px!important}.intro{padding:11px!important}.intro h2{font-size:23px!important}.next{padding:11px!important}.toolbar{padding:6px!important}.event{grid-template-columns:1fr 1fr!important;padding:8px!important}.signal{grid-column:1/-1!important}}
  `;
  document.head.appendChild(compactStyle);

  const ensureWidget = () => {
    if (el && document.body.contains(el)) return el;
    const host = document.querySelector('.brand');
    if (!host) return null;
    el = document.createElement('div');
    el.id = 'xauPriceWidget';
    el.style.cssText = 'margin-left:auto;min-width:185px;padding:7px 10px;border:1px solid rgba(41,118,139,.14);border-radius:11px;background:rgba(255,255,255,.72);box-shadow:0 7px 20px rgba(49,109,125,.06)';
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
    const changeColor = change === null ? '#64808a' : change >= 0 ? '#07966f' : '#e34e65';
    node.innerHTML = `<div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#64808a;font-weight:800">XAU/USD <span style="color:${live ? '#07966f' : '#e34e65'}">● ${live ? 'LIVE' : 'OFFLINE'}</span></div><div style="font:800 19px Manrope;margin-top:1px">$${p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style="font-size:10px;color:${changeColor}">${changeText}</div><div style="font-size:9px;color:#64808a;margin-top:1px">Last source tick: ${tick}</div>`;
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
      else if (node) node.innerHTML = '<div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#e34e65;font-weight:800">XAU/USD ● OFFLINE</div><div style="font-size:10px;color:#64808a;margin-top:4px">Live price feed unavailable</div>';
    }
  };

  loadGoldPrice();
  setInterval(loadGoldPrice, INTERVAL);
})();
