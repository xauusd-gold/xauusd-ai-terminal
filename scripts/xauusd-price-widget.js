(() => {
  const API = 'https://api.gold-api.com/price/XAU';
  const INTERVAL = 3000;
  let el = null;

  const ensureWidget = () => {
    if (el && document.body.contains(el)) return el;
    const host = document.querySelector('.brand');
    if (!host) return null;
    el = document.createElement('div');
    el.id = 'xauPriceWidget';
    el.style.cssText = 'margin-left:auto;min-width:220px;padding:12px 16px;border:1px solid rgba(41,118,139,.14);border-radius:18px;background:rgba(255,255,255,.72);box-shadow:0 10px 28px rgba(49,109,125,.08)';
    host.parentElement.insertBefore(el, host.nextSibling);
    return el;
  };

  const render = ({ price, updatedAt, status = 'LIVE' }) => {
    const node = ensureWidget();
    if (!node) return;
    const p = Number(price);
    if (!Number.isFinite(p)) return;
    const time = updatedAt ? new Date(updatedAt) : new Date();
    node.innerHTML = `<div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#64808a;font-weight:800">XAU/USD <span style="color:${status==='LIVE'?'#07966f':'#d28b27'}">● ${status}</span></div><div style="font:800 24px Manrope;margin-top:2px">$${p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style="font-size:10px;color:#64808a;margin-top:2px">Last tick: ${time.toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour12:true})} IST</div>`;
  };

  const loadGoldPrice = async () => {
    try {
      const r = await fetch(`${API}?_=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`Gold API HTTP ${r.status}`);
      const data = await r.json();
      const price = Number(data.price);
      if (!Number.isFinite(price)) throw new Error('Invalid XAU price');
      render({ price, updatedAt: data.updatedAt || data.timestamp || Date.now(), status: 'LIVE' });
    } catch (e) {
      console.warn('XAU/USD live feed:', e);
      const node = ensureWidget();
      if (node) {
        const badge = node.querySelector('span');
        if (badge) { badge.textContent = '● OFFLINE'; badge.style.color = '#e34e65'; }
      }
    }
  };

  loadGoldPrice();
  setInterval(loadGoldPrice, INTERVAL);
})();
