(() => {
  const loadGoldPrice = async () => {
    try {
      const r = await fetch(`data/market.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error('market.json unavailable');
      const m = await r.json();
      const host = document.querySelector('.brand');
      if (!host || document.getElementById('xauPriceWidget')) return;
      const price = Number(m.price);
      if (!Number.isFinite(price)) return;
      const change = Number(m.change);
      const pct = Number(m.percentChange) * 100;
      const up = Number.isFinite(change) ? change >= 0 : null;
      const el = document.createElement('div');
      el.id = 'xauPriceWidget';
      el.style.cssText = 'margin-left:auto;min-width:220px;padding:12px 16px;border:1px solid rgba(41,118,139,.14);border-radius:18px;background:rgba(255,255,255,.72);box-shadow:0 10px 28px rgba(49,109,125,.08)';
      el.innerHTML = `<div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#64808a;font-weight:800">XAU/USD Live Price</div><div style="font:800 24px Manrope;margin-top:2px">$${price.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style="font-size:12px;color:${up===null?'#64808a':up?'#07966f':'#e34e65'}">${Number.isFinite(change)?`${change>=0?'+':''}${change.toFixed(2)} (${pct>=0?'+':''}${pct.toFixed(3)}%)`: 'Change unavailable'}</div><div style="font-size:10px;color:#64808a;margin-top:2px">Last updated: ${m.generatedAt ? new Date(m.generatedAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',hour12:true})+' IST' : '—'}</div>`;
      host.parentElement.insertBefore(el, host.nextSibling);
    } catch (e) { console.warn('XAU/USD price widget:', e); }
  };
  loadGoldPrice();
  setInterval(loadGoldPrice, 120000);
})();
