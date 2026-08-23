(() => {
  const API = 'https://api.gold-api.com/price/XAU';
  const INTERVAL = 5000;
  let el = null;
  let lastPrice = null;
  let lastSourceUpdate = null;

  // Animated network background + transparent dark glass theme.
  const networkStyle = document.createElement('style');
  networkStyle.textContent = `
    html,body{background:#02060b!important;color:#e8f4ff!important}
    body:before{background:radial-gradient(circle at 10% 5%,rgba(0,90,150,.20),transparent 35%),radial-gradient(circle at 90% 20%,rgba(0,120,170,.14),transparent 30%),linear-gradient(145deg,#010408 0%,#030a12 52%,#010408 100%)!important}
    body:after{opacity:.08!important;background-image:radial-gradient(rgba(55,160,220,.65) 1px,transparent 1px)!important}
    body>.shell{position:relative;z-index:1}
    .glass,.intro,.toolbar,.event,.empty{background:rgba(3,9,16,.34)!important;border:1px solid rgba(91,178,225,.22)!important;box-shadow:0 18px 55px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.05)!important;backdrop-filter:blur(12px) saturate(130%)!important;-webkit-backdrop-filter:blur(12px) saturate(130%)!important}
    header.glass{background:rgba(3,9,16,.30)!important}
    .stat{background:rgba(2,8,14,.30)!important;border-color:rgba(91,178,225,.18)!important}
    .next{background:rgba(4,18,28,.38)!important;border:1px solid rgba(40,190,230,.28)!important;box-shadow:0 18px 55px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.05)!important;backdrop-filter:blur(12px) saturate(130%)!important;-webkit-backdrop-filter:blur(12px) saturate(130%)!important}
    .chip,.refresh{background:rgba(3,10,17,.38)!important;color:#e8f4ff!important;border-color:rgba(91,178,225,.25)!important}
    .chip.active{background:rgba(19,112,160,.68)!important;color:#fff!important}
    .flag{background:rgba(30,120,160,.20)!important}
    .impact{background:rgba(35,145,190,.18)!important;color:#79d8ff!important}
    .signal.long{background:rgba(5,125,91,.24)!important}.signal.short{background:rgba(190,45,70,.22)!important}.signal.wait{background:rgba(170,105,25,.24)!important}
    .meter{background:rgba(120,170,190,.18)!important}
    .footer,.section-head p,.event-title p,.metric span,.stat span,.brand p,.status{color:#91adbb!important}
    .event h4,.section-head h3,.brand h1,.intro h2,.metric b,.datebar strong{color:#edf7ff!important}
    #ferihaNetworkCanvas{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:.92}
    body:before{z-index:-3!important}body:after{z-index:-2!important}
    #xauPriceWidget{background:rgba(3,10,17,.42)!important;border:1px solid rgba(91,178,225,.24)!important;box-shadow:0 10px 28px rgba(0,0,0,.28)!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important}
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
      p.x += p.vx;p.y += p.vy;
      if (p.x < -20) p.x = width + 20;if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;if (p.y > height + 20) p.y = -20;
    }
    for (let i=0;i<particles.length;i++) for (let j=i+1;j<particles.length;j++) {
      const a=particles[i],b=particles[j],dx=a.x-b.x,dy=a.y-b.y,dist=Math.hypot(dx,dy);
      if(dist<maxDist){ctx.strokeStyle=`rgba(18,125,178,${(1-dist/maxDist)*.32})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    }
    for(const p of particles){const pulse=.7+Math.sin(time*.0014+p.phase)*.3;ctx.beginPath();ctx.fillStyle=`rgba(10,132,190,${.8*pulse})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.fillStyle=`rgba(38,176,231,${.12*pulse})`;ctx.arc(p.x,p.y,p.r*6,0,Math.PI*2);ctx.fill();}
    requestAnimationFrame(drawNetwork);
  };
  const bootNetwork=()=>{resizeNetwork();requestAnimationFrame(drawNetwork)};
  window.addEventListener('resize',resizeNetwork,{passive:true});bootNetwork();

  const ensureWidget=()=>{if(el&&document.body.contains(el))return el;const host=document.querySelector('.brand');if(!host)return null;el=document.createElement('div');el.id='xauPriceWidget';el.style.cssText='margin-left:auto;min-width:220px;padding:10px 14px;border:1px solid rgba(91,178,225,.24);border-radius:16px;background:rgba(3,10,17,.42);box-shadow:0 10px 28px rgba(0,0,0,.28);backdrop-filter:blur(12px)';host.parentElement.insertBefore(el,host.nextSibling);return el};
  const render=(price,sourceUpdatedAt,live)=>{const node=ensureWidget();if(!node)return;const p=Number(price);if(!Number.isFinite(p))return;const change=lastPrice===null?null:p-lastPrice;const pct=lastPrice&&lastPrice!==0?(change/lastPrice)*100:null;const sourceDate=sourceUpdatedAt?new Date(sourceUpdatedAt):null;const validDate=sourceDate&&!Number.isNaN(sourceDate.getTime());const tick=validDate?sourceDate.toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour12:true})+' IST':new Date().toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour12:true})+' IST';const changeText=change===null?'Waiting for next tick…':`${change>=0?'+':''}${change.toFixed(2)} (${pct>=0?'+':''}${pct.toFixed(3)}%)`;const changeColor=change===null?'#91adbb':change>=0?'#20d39c':'#ff6c82';node.innerHTML=`<div style="font-size:10px;letter-spacing:1.1px;text-transform:uppercase;color:#91adbb;font-weight:800">XAU/USD <span style="color:${live?'#20d39c':'#ff6c82'}">● ${live?'LIVE':'OFFLINE'}</span></div><div style="font:800 24px Manrope;color:#edf7ff;margin-top:2px;line-height:1.1">$${p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style="font-size:11px;color:${changeColor}">${changeText}</div><div style="font-size:9px;color:#91adbb;margin-top:2px">Last source tick: ${tick}</div>`};
  const loadGoldPrice=async()=>{try{const r=await fetch(`${API}?_=${Date.now()}`,{cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw new Error(`Gold API HTTP ${r.status}`);const data=await r.json();const price=Number(data.price);if(!Number.isFinite(price))throw new Error('Invalid XAU price');const sourceUpdatedAt=data.updatedAt||data.timestamp||null;render(price,sourceUpdatedAt,true);lastPrice=price;lastSourceUpdate=sourceUpdatedAt}catch(e){console.warn('XAU/USD live feed:',e);const node=ensureWidget();if(node&&lastPrice!==null)render(lastPrice,lastSourceUpdate,false);else if(node)node.innerHTML='<div style="font-size:10px;letter-spacing:1.1px;text-transform:uppercase;color:#ff6c82;font-weight:800">XAU/USD ● OFFLINE</div><div style="font-size:11px;color:#91adbb;margin-top:5px">Live price feed unavailable</div>'}};
  const boot=()=>{loadGoldPrice();setInterval(loadGoldPrice,INTERVAL)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
