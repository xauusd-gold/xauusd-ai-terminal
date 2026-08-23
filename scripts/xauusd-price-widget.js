(() => {
  const API = 'https://api.gold-api.com/price/XAU';
  const INTERVAL = 5000;
  let el = null;
  let lastPrice = null;
  let lastSourceUpdate = null;

  const compactStyle = document.createElement('style');
  compactStyle.id = 'ferihaCompactUi';
  compactStyle.textContent = `
    /* Desktop terminal header */
    header{padding:18px 24px!important;border-radius:20px!important;gap:18px!important;min-height:78px!important}
    .logo{width:48px!important;height:48px!important;border-radius:14px!important;font-size:20px!important}
    .brand{gap:12px!important}.brand h1{font-size:26px!important;letter-spacing:-.8px!important}.brand p{font-size:14px!important;margin-top:3px!important}
    .live{font-size:13px!important;gap:8px!important;white-space:nowrap}.dot{width:9px!important;height:9px!important}

    /* Hero: larger typography, still compact enough for the 3-row calendar */
    .hero{margin:12px 0!important;gap:12px!important}.intro{padding:21px!important;border-radius:20px!important}
    .intro h2{font-size:39px!important;line-height:1.04!important;letter-spacing:-1.7px!important;margin:7px 0!important;max-width:780px!important}
    .intro p{font-size:14px!important;line-height:1.42!important;margin:7px 0!important;max-width:820px!important}
    .eyebrow{font-size:11px!important;letter-spacing:1.3px!important}
    .stats{gap:8px!important;margin-top:13px!important}.stat{padding:10px 12px!important;border-radius:13px!important}.stat b{font-size:19px!important}.stat span{font-size:11px!important}
    .next{padding:21px!important;border-radius:20px!important}.next h3{font-size:24px!important;line-height:1.15!important;margin:7px 0!important}.next small{font-size:11px!important}.countdown{font-size:40px!important}

    /* Toolbar and calendar headings */
    .toolbar{padding:8px 12px!important;border-radius:15px!important;gap:8px!important;top:5px!important}.filters{gap:6px!important}.chip,.refresh{padding:7px 11px!important;font-size:13px!important}.status{font-size:12px!important}
    .section-head{margin:16px 3px 8px!important}.section-head h3{font-size:22px!important}.section-head p{font-size:12px!important}.day{margin-bottom:10px!important}.datebar{margin:0 0 6px 7px!important}.datebar strong{font-size:16px!important}.datebar span{font-size:12px!important}

    /* Event rows: readable but keep the 3-row desktop density */
    .event{padding:15px 17px!important;border-radius:16px!important;gap:11px!important;margin-bottom:7px!important;min-height:104px!important;grid-template-columns:minmax(215px,1.6fr) repeat(3,minmax(82px,.55fr)) minmax(135px,.7fr)!important}
    .event:hover{transform:none!important;box-shadow:none!important}.event-title{gap:11px!important}.flag{width:40px!important;height:40px!important;border-radius:11px!important;font-size:17px!important}
    .event h4{font-size:19px!important;margin-bottom:2px!important;line-height:1.2!important}.event-title p,.metric span{font-size:13px!important;line-height:1.2!important}.metric b{font-size:15px!important;margin-top:2px!important}
    .impact{padding:4px 9px!important;font-size:10px!important}.signal{padding:10px 12px!important;border-radius:11px!important}.signal b{font-size:18px!important}.signal small{font-size:12px!important}
    .expand{display:none!important}.footer{margin-top:10px!important;padding:10px!important;font-size:11px!important}

    /* Live price card */
    #xauPriceWidget{min-width:250px!important;padding:10px 13px!important;border-radius:14px!important}
    #xauPriceWidget div:first-child{font-size:11px!important;letter-spacing:1.1px!important}
    #xauPriceWidget div:nth-child(2){font-size:28px!important;line-height:1.08!important}
    #xauPriceWidget div:nth-child(3){font-size:12px!important}.xau-top-meta{font:700 13px Manrope;color:#64808a;white-space:nowrap}

    @media(max-width:950px){
      .brand h1{font-size:22px!important}.hero{grid-template-columns:1fr!important}.intro h2{font-size:34px!important}
      .event{grid-template-columns:1fr 1fr 1fr!important}.event-title{grid-column:1/-1!important}.signal{grid-column:2/4!important}
      #xauPriceWidget{min-width:210px!important}
    }
    @media(max-width:620px){
      header{padding:12px!important;min-height:62px!important}.brand h1{font-size:18px!important}.brand p{display:none!important}.logo{width:38px!important;height:38px!important}
      .live{font-size:10px!important}.hero{gap:8px!important}.intro{padding:15px!important}.intro h2{font-size:27px!important}.intro p{font-size:12px!important}.next{padding:15px!important}.next h3{font-size:20px!important}.countdown{font-size:31px!important}
      .toolbar{padding:7px!important}.event{grid-template-columns:1fr 1fr!important;padding:10px!important;min-height:90px!important}.signal{grid-column:1/-1!important}
      #xauPriceWidget{min-width:0!important;padding:7px 9px!important}.xau-top-meta{display:none!important}
    }
  `;
  document.head.appendChild(compactStyle);

  const ensureTopMeta = () => {
    const header = document.querySelector('header');
    const live = header?.querySelector('.live');
    if (!header || !live || header.querySelector('.xau-top-meta')) return;
    const meta = document.createElement('span');
    meta.className = 'xau-top-meta';
    meta.textContent = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    }).format(new Date()) + ' IST';
    live.parentElement.insertBefore(meta, live);
    setInterval(() => {
      meta.textContent = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
      }).format(new Date()) + ' IST';
    }, 30000);
  };

  const ensureWidget = () => {
    if (el && document.body.contains(el)) return el;
    const host = document.querySelector('.brand');
    if (!host) return null;
    el = document.createElement('div');
    el.id = 'xauPriceWidget';
    el.style.cssText = 'margin-left:auto;min-width:250px;padding:10px 13px;border:1px solid rgba(41,118,139,.14);border-radius:14px;background:rgba(255,255,255,.72);box-shadow:0 8px 24px rgba(49,109,125,.06)';
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
    node.innerHTML = `<div style="font-size:11px;letter-spacing:1.1px;text-transform:uppercase;color:#64808a;font-weight:800">XAU/USD <span style="color:${live ? '#07966f' : '#e34e65'}">● ${live ? 'LIVE' : 'OFFLINE'}</span></div><div style="font:800 28px Manrope;margin-top:2px;line-height:1.08">$${p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style="font-size:12px;color:${changeColor}">${changeText}</div><div style="font-size:9px;color:#64808a;margin-top:2px">Last source tick: ${tick}</div>`;
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
      else if (node) node.innerHTML = '<div style="font-size:11px;letter-spacing:1.1px;text-transform:uppercase;color:#e34e65;font-weight:800">XAU/USD ● OFFLINE</div><div style="font-size:12px;color:#64808a;margin-top:5px">Live price feed unavailable</div>';
    }
  };

  const boot = () => {
    ensureTopMeta();
    loadGoldPrice();
    setInterval(loadGoldPrice, INTERVAL);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
