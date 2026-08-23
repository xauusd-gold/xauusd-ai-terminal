(() => {
  const API = 'https://api.gold-api.com/price/XAU';
  const INTERVAL = 5000;
  let el = null;
  let lastPrice = null;
  let lastSourceUpdate = null;

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
