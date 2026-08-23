(() => {
  const API = 'https://api.gold-api.com/price/XAU';
  const INTERVAL = 5000;
  let el = null;
  let lastPrice = null;
  let lastSourceUpdate = null;

  const compactStyle = document.createElement('style');
  compactStyle.id = 'ferihaCompactUi';
  compactStyle.textContent = `
    header{padding:12px 17px!important;border-radius:17px!important;gap:12px!important}
    .logo{width:38px!important;height:38px!important;border-radius:11px!important;font-size:16px!important}
    .brand{gap:9px!important}.brand h1{font-size:20px!important}.brand p{font-size:12px!important}
    .live{font-size:11px!important;gap:6px!important}.dot{width:8px!important;height:8px!important}
    .hero{margin:11px 0!important;gap:10px!important}.intro{padding:16px!important;border-radius:17px!important}
    .intro h2{font-size:30px!important;letter-spacing:-1.1px!important;margin:5px 0!important}.intro p{font-size:12px!important;line-height:1.4!important;margin:6px 0!important}
    .eyebrow{font-size:10px!important;letter-spacing:1.1px!important}.stats{gap:6px!important;margin-top:10px!important}.stat{padding:8px 10px!important;border-radius:11px!important}.stat b{font-size:16px!important}.stat span{font-size:10px!important}
    .next{padding:15px!important;border-radius:17px!important}.next h3{font-size:18px!important;margin:5px 0!important}.countdown{font-size:28px!important}.next small{font-size:10px!important}
    .toolbar{padding:7px 10px!important;border-radius:13px!important;gap:7px!important;top:5px!important}.filters{gap:5px!important}.chip,.refresh{padding:6px 9px!important;font-size:12px!important}.status{font-size:11px!important}
    .section-head{margin:13px 3px 7px!important}.section-head h3{font-size:19px!important}.section-head p{font-size:11px!important;margin:2px 0!important}.day{margin-bottom:9px!important}.datebar{margin:0 0 6px 6px!important;gap:6px!important}.datebar strong{font-size:16px!important}.datebar span{font-size:12px!important}
    .event{padding:13px 15px!important;border-radius:15px!important;gap:10px!important;margin-bottom:6px!important;min-height:104px!important;grid-template-columns:minmax(205px,1.6fr) repeat(3,minmax(78px,.55fr)) minmax(128px,.7fr)!important}
    .event:hover{transform:none!important;box-shadow:none!important}.event-title{gap:10px!important}.flag{width:38px!important;height:38px!important;border-radius:10px!important;font-size:16px!important}
    .event h4{font-size:19px!important;margin-bottom:2px!important;line-height:1.22!important}.event-title p,.metric span{font-size:13px!important;line-height:1.2!important}.metric b{font-size:15px!important;margin-top:2px!important}
    .impact{padding:4px 8px!important;font-size:10px!important}.signal{padding:10px 12px!important;border-radius:11px!important}.signal b{font-size:18px!important}.signal small{font-size:12px!important}
    .expand{display:none!important}.meter{height:5px!important}.meter-row{gap:6px!important}.score{font-size:13px!important}.footer{margin-top:10px!important;padding:10px!important;font-size:11px!important}
    #xauPriceWidget{min-width:190px!important;padding:8px 11px!important;border-radius:11px!important}
    #xauPriceWidget div:nth-child(2){font-size:22px!important}
    @media(max-width:950px){.event{grid-template-columns:1fr 1fr 1fr!important}.event-title{grid-column:1/-1!important}.signal{grid-column:2/4!important}}
    @media(max-width:620px){header{padding:10px!important}.brand h1{font-size:17px!important}.brand p{display:none!important}.hero{gap:7px!important}.intro{padding:12px!important}.intro h2{font-size:25px!important}.next{padding:12px!important}.toolbar{padding:7px!important}.event{grid-template-columns:1fr 1fr!important;padding:10px!important;min-height:90px!important}.signal{grid-column:1/-1!important}}
  `;
  document.head.appendChild(compactStyle);

  const ensureWidget = () => {
    if (el && document.body.contains(el)) return el;
    const host = document.querySelector('.brand');
    if (!host) return null;
    el = document.createElement('div');
    el.id = 'xauPriceWidget';
    el.style.cssText = 'margin-left:auto;min-width:190px;padding:8px 11px;border:1px solid rgba(41,118,139,.14);border-radius:11px;background:rgba(255,255,255,.72);box-shadow:0 7px 20px rgba(49,109,125,.06)';
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
    node.innerHTML = `<div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#64808a;font-weight:800">XAU/USD <span style="color:${live ? '#07966f' : '#e34e65'}">● ${live ? 'LIVE' : 'OFFLINE'}</span></div><div style="font:800 22px Manrope;margin-top:1px">$${p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style="font-size:10px;color:${changeColor}">${changeText}</div><div style="font-size:9px;color:#64808a;margin-top:1px">Last source tick: ${tick}</div>`;
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
