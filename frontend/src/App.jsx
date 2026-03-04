import { useState, useEffect, useRef, useCallback, useMemo } from "react"

  const FIATS = ["PLN","EUR","USD","GBP","CZK","HUF","CAD","NGN","ILS","JPY"]
  const CRYPTOS = ["USDT","BTC","ETH","USDC"]
  const EXCHANGES_CONFIG = [
    { id:"bybit",   label:"Bybit",   color:"#f7a600" },
    { id:"binance", label:"Binance", color:"#f0b90b" },
  ]
  const CHART_SYMBOLS = [
    { id:"BTCUSDT", label:"BTC", name:"Bitcoin" },
    { id:"ETHUSDT", label:"ETH", name:"Ethereum" },
    { id:"BNBUSDT", label:"BNB", name:"BNB Chain" },
    { id:"SOLUSDT", label:"SOL", name:"Solana" },
    { id:"XRPUSDT", label:"XRP", name:"Ripple" },
  ]
  const INTERVALS = ["15m","1h","4h","1d","1w"]
  const COIN_NAMES = {
    BTC:"Bitcoin",ETH:"Ethereum",BNB:"BNB Chain",SOL:"Solana",XRP:"Ripple",
    ADA:"Cardano",DOT:"Polkadot",LINK:"Chainlink",AVAX:"Avalanche",MATIC:"Polygon",
    DOGE:"Dogecoin",SHIB:"Shiba Inu",LTC:"Litecoin",UNI:"Uniswap",TRX:"TRON",
  }
  const SORT_OPTIONS = [
    { id:"price",  label:"Price" },
    { id:"volume", label:"Volume" },
    { id:"rate",   label:"Completion" },
    { id:"score",  label:"Score" },
  ]
  const COMMON_PAYMENTS = ["BLIK","Revolut","SEPA","Wise","PayPal","Bank Transfer","WebMoney","Paysend","Western Union","Faster Payments"]
  const RATE_FILTERS = [
    { id:0,  label:"All" },
    { id:90, label:"90%+" },
    { id:95, label:"95%+" },
    { id:98, label:"98%+" },
  ]

  // ─── Particles ────────────────────────────────────────────────────────────────
  function ParticleField() {
    const ref = useRef(null)
    const mouseRef = useRef({ x:-1000, y:-1000 })
    useEffect(()=>{
      const cv=ref.current, ctx=cv.getContext("2d")
      const set=()=>{ cv.width=window.innerWidth; cv.height=window.innerHeight }
      set()
      const pts=Array.from({length:110},()=>({
        x:Math.random()*cv.width, y:Math.random()*cv.height,
        vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4,
        r:Math.random()*1.8+.5, o:Math.random()*.55+.12,
      }))
      pts.forEach(p=>{p.ox=p.x;p.oy=p.y})
      let raf
      const draw=()=>{
        ctx.clearRect(0,0,cv.width,cv.height)
        const {x:mx,y:my}=mouseRef.current
        pts.forEach(p=>{
          const dx=p.x-mx,dy=p.y-my,dist=Math.sqrt(dx*dx+dy*dy)
          if(dist<120&&dist>0){const f=(1-dist/120)*2.5;p.vx+=(dx/dist)*f;p.vy+=(dy/dist)*f}
          p.vx+=(p.ox-p.x)*0.012;p.vy+=(p.oy-p.y)*0.012
          p.vx*=0.88;p.vy*=0.88;p.x+=p.vx;p.y+=p.vy
          ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
          ctx.fillStyle=`rgba(90,160,255,${p.o})`;ctx.fill()
        })
        for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
          const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y)
          if(d<100){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(90,160,255,${.09*(1-d/100)})`;ctx.lineWidth=.5;ctx.stroke()}
        }
        raf=requestAnimationFrame(draw)
      }
      draw()
      const onM=e=>{mouseRef.current={x:e.clientX,y:e.clientY}}
      const onL=()=>{mouseRef.current={x:-1000,y:-1000}}
      window.addEventListener("mousemove",onM);window.addEventListener("mouseleave",onL);window.addEventListener("resize",set)
      return()=>{cancelAnimationFrame(raf);window.removeEventListener("mousemove",onM);window.removeEventListener("mouseleave",onL);window.removeEventListener("resize",set)}
    },[])
    return <canvas ref={ref} style={{position:"fixed",top:0,left:0,zIndex:0,pointerEvents:"none"}}/>
  }

  // ─── Chart ────────────────────────────────────────────────────────────────────
  function BinanceChart({data}){
    const wrapRef=useRef(null)
    const canvasRef=useRef(null)
    const [size,setSize]=useState({w:0,h:0})
    const [hovered,setHovered]=useState(null)
    const [crosshair,setCrosshair]=useState(null)
    const isMobile=window.innerWidth<640
    const CHART_H=isMobile?220:300
    const VOL_H=isMobile?50:65
    const TOTAL_H=CHART_H+VOL_H
    const PAD={top:38,right:isMobile?54:78,bottom:20,left:4}
    const MA={ma7:"#f0b90b",ma25:"#e8465a",ma99:"#a855f7"}

    // Step 1: measure wrapper width with ResizeObserver
    useEffect(()=>{
      const wrap=wrapRef.current;if(!wrap)return
      const ro=new ResizeObserver(entries=>{
        const w=Math.floor(entries[0].contentRect.width)
        if(w>0) setSize({w,h:TOTAL_H})
      })
      ro.observe(wrap)
      // initial measure
      const w=Math.floor(wrap.getBoundingClientRect().width)
      if(w>0) setSize({w,h:TOTAL_H})
      return()=>ro.disconnect()
    },[TOTAL_H])

    // Step 2: draw when size or data changes
    useEffect(()=>{
      if(!data.length||!size.w)return
      const canvas=canvasRef.current;if(!canvas)return
      const W=size.w, dpr=window.devicePixelRatio||1
      // Set exact pixel dimensions - never use CSS % on canvas
      canvas.width=W*dpr
      canvas.height=TOTAL_H*dpr
      const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr)
      const cW=W-PAD.left-PAD.right,cH=CHART_H-PAD.top-PAD.bottom
      const prices=data.flatMap(d=>[d.high,d.low])
      const minP=Math.min(...prices),maxP=Math.max(...prices),pR=maxP-minP||1
      const toY=p=>PAD.top+cH-((p-minP)/pR)*cH
      const maxV=Math.max(...data.map(d=>d.volume))
      const toVY=v=>TOTAL_H-4-(v/maxV)*(VOL_H-10)
      const bW=Math.max(1,cW/data.length-1)
      const toX=i=>PAD.left+(i/(data.length-1))*cW
      ctx.strokeStyle="rgba(50,90,180,0.1)";ctx.lineWidth=1
      for(let i=0;i<=5;i++){
        const y=PAD.top+(cH/5)*i
        ctx.beginPath();ctx.moveTo(PAD.left,y);ctx.lineTo(W-PAD.right,y);ctx.stroke()
        const price=maxP-(pR/5)*i
        ctx.fillStyle="rgba(130,170,255,0.45)";ctx.font=`${isMobile?8:9}px DM Mono,monospace`;ctx.textAlign="left"
        ctx.fillText(price>=1000?price.toLocaleString(undefined,{maximumFractionDigits:0}):price.toFixed(4),W-PAD.right+4,y+3)
      }
      if(crosshair){
        ctx.strokeStyle="rgba(130,170,255,0.2)";ctx.lineWidth=1;ctx.setLineDash([3,4])
        ctx.beginPath();ctx.moveTo(crosshair.x,PAD.top);ctx.lineTo(crosshair.x,CHART_H-PAD.bottom);ctx.stroke()
        ctx.beginPath();ctx.moveTo(PAD.left,crosshair.y);ctx.lineTo(W-PAD.right,crosshair.y);ctx.stroke()
        ctx.setLineDash([])
      }
      ;["ma99","ma25","ma7"].forEach(k=>{
        ctx.strokeStyle=MA[k];ctx.lineWidth=1.2;ctx.beginPath();let s=false
        data.forEach((d,i)=>{if(d[k]==null)return;const x=toX(i),y=toY(d[k]);if(!s){ctx.moveTo(x,y);s=true}else ctx.lineTo(x,y)})
        ctx.stroke()
      })
      data.forEach((d,i)=>{
        const x=toX(i),up=d.close>=d.open,col=up?"#26a69a":"#ef5350"
        const bT=toY(Math.max(d.open,d.close)),bB=toY(Math.min(d.open,d.close))
        const bH=Math.max(1,bB-bT),hw=Math.max(.5,bW/2)
        ctx.strokeStyle=col;ctx.lineWidth=1
        ctx.beginPath();ctx.moveTo(x,toY(d.high));ctx.lineTo(x,bT);ctx.moveTo(x,bB);ctx.lineTo(x,toY(d.low));ctx.stroke()
        ctx.fillStyle=up?"rgba(38,166,154,0.9)":"rgba(239,83,80,0.85)";ctx.fillRect(x-hw,bT,bW,bH)
      })
      data.forEach((d,i)=>{
        const x=toX(i),hw=Math.max(.5,bW/2),vy=toVY(d.volume)
        ctx.fillStyle=d.close>=d.open?"rgba(38,166,154,0.3)":"rgba(239,83,80,0.25)"
        ctx.fillRect(x-hw,vy,bW,TOTAL_H-4-vy)
      })
      ctx.strokeStyle="rgba(50,90,180,0.08)";ctx.lineWidth=1
      ctx.beginPath();ctx.moveTo(PAD.left,CHART_H);ctx.lineTo(W-PAD.right,CHART_H);ctx.stroke()
      ctx.fillStyle="rgba(100,140,255,0.3)";ctx.font=`${isMobile?8:9}px DM Mono,monospace`;ctx.textAlign="center"
      const step=Math.ceil(data.length/(isMobile?5:8))
      data.forEach((d,i)=>{if(i%step===0)ctx.fillText(new Date(d.time).toLocaleDateString([],{month:"short",day:"numeric"}),toX(i),TOTAL_H-2)})
      if(!isMobile){
        let lx=PAD.left+4
        ;[["MA(7)","ma7"],["MA(25)","ma25"],["MA(99)","ma99"]].forEach(([label,k])=>{
          const last=[...data].reverse().find(d=>d[k]!=null);if(!last)return
          ctx.font="9px DM Mono,monospace";ctx.fillStyle=MA[k];ctx.textAlign="left"
          const txt=`${label} ${last[k]?.toLocaleString(undefined,{maximumFractionDigits:2})}`
          ctx.fillText(txt,lx,14);lx+=ctx.measureText(txt).width+14
        })
      }
    },[data,size,crosshair,hovered])

    const handleMouseMove=useCallback((e)=>{
      const canvas=canvasRef.current;if(!canvas||!data.length||!size.w)return
      const rect=canvas.getBoundingClientRect()
      const scaleX=size.w/rect.width
      const mx=(e.clientX-rect.left)*scaleX,my=(e.clientY-rect.top)*scaleX
      const cW=size.w-PAD.left-PAD.right
      const idx=Math.round(((mx-PAD.left)/cW)*(data.length-1))
      if(idx>=0&&idx<data.length){setHovered(idx);setCrosshair({x:mx,y:my})}
    },[data,size])

    const hd=hovered!==null?data[hovered]:data[data.length-1]
    return(
      // wrapper: full width, overflow hidden, exact height
      <div ref={wrapRef} style={{width:"100%",overflow:"hidden",position:"relative",height:size.w?TOTAL_H:0}}>
        {hd&&size.w>0&&(
          <div style={{position:"absolute",top:18,left:PAD.left+4,display:"flex",gap:10,zIndex:2,pointerEvents:"none",flexWrap:"wrap"}}>
            {[["O",hd.open],["H",hd.high],["L",hd.low],["C",hd.close]].map(([k,v])=>(
              <span key={k} style={{fontFamily:"DM Mono,monospace",fontSize:10}}>
                <span style={{color:"rgba(100,140,255,0.4)"}}>{k} </span>
                <span style={{color:hd.close>=hd.open?"#26a69a":"#ef5350"}}>{v?.toLocaleString(undefined,{maximumFractionDigits:2})}</span>
              </span>
            ))}
            <span style={{fontFamily:"DM Mono,monospace",fontSize:10}}>
              <span style={{color:"rgba(100,140,255,0.4)"}}>CHG </span>
              <span style={{color:hd.close>=hd.open?"#26a69a":"#ef5350"}}>{(((hd.close-hd.open)/hd.open)*100).toFixed(2)}%</span>
            </span>
          </div>
        )}
        {/* canvas: exact pixel size via JS, NO CSS width/height % */}
        <canvas ref={canvasRef}
          style={{display:"block",cursor:"crosshair",width:size.w||0,height:size.w?TOTAL_H:0}}
          onMouseMove={handleMouseMove}
          onMouseLeave={()=>{setHovered(null);setCrosshair(null)}}/>
      </div>
    )
  }

  // ─── Rate Bar ─────────────────────────────────────────────────────────────────
  function RateBar({rate,trades}){
    const [tip,setTip]=useState(false)
    const col=rate>=95?"#26a69a":rate>=80?"#f7a600":"#ef5350"
    return(
      <div style={{position:"relative",cursor:"default"}} onMouseEnter={()=>setTip(true)} onMouseLeave={()=>setTip(false)}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{flex:1,height:3,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden"}}>
            <div style={{width:`${Math.min(rate,100)}%`,height:"100%",background:col,borderRadius:2}}/>
          </div>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:col,opacity:.85,whiteSpace:"nowrap"}}>{rate.toFixed(0)}%</span>
        </div>
        {tip&&(
          <div style={{position:"absolute",bottom:"calc(100% + 8px)",left:0,background:"rgba(4,10,28,0.98)",border:"1px solid rgba(80,130,255,0.25)",borderRadius:10,padding:"10px 14px",fontFamily:"DM Mono,monospace",fontSize:11,whiteSpace:"nowrap",zIndex:200,pointerEvents:"none",boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
            <div style={{color:"rgba(150,190,255,0.5)",marginBottom:5}}>Seller stats</div>
            <div style={{color:"#fff",marginBottom:3}}>Completion: <span style={{color:col}}>{rate.toFixed(1)}%</span></div>
            <div style={{color:"rgba(150,190,255,0.6)"}}>Total trades: {trades}</div>
          </div>
        )}
      </div>
    )
  }

  // ─── Copy Price ───────────────────────────────────────────────────────────────
  function CopyPrice({price,fiat}){
    const [copied,setCopied]=useState(false)
    const copy=()=>{navigator.clipboard.writeText(String(price));setCopied(true);setTimeout(()=>setCopied(false),1500)}
    return(
      <span onClick={copy} style={{cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4}}>
        <span>{price.toFixed(3)}</span>
        <span style={{fontSize:10,color:"rgba(120,160,255,0.45)",fontFamily:"DM Mono,monospace"}}>{fiat}</span>
        {copied&&<span style={{fontSize:9,color:"#26a69a",fontFamily:"DM Mono,monospace"}}>✓</span>}
      </span>
    )
  }

  // ─── Live Dot ─────────────────────────────────────────────────────────────────
  function LiveDot({lastUpdated}){
    const [pulse,setPulse]=useState(false)
    useEffect(()=>{setPulse(true);const t=setTimeout(()=>setPulse(false),800);return()=>clearTimeout(t)},[lastUpdated])
    return(
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:"#26a69a",boxShadow:pulse?"0 0 0 4px rgba(38,166,154,0.3)":"none",transition:"box-shadow .4s ease"}}/>
        {lastUpdated&&<span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(120,170,255,0.4)"}}>{lastUpdated}</span>}
      </div>
    )
  }

  // ─── Spread Banner ────────────────────────────────────────────────────────────
  function SpreadBanner(){
    const [spread,setSpread]=useState(null)
    useEffect(()=>{
      const load=()=>fetch("https://flowanalytics-production.up.railway.app/p2p/spread")
        .then(r=>r.json()).then(d=>{ if(d.spread) setSpread(d.spread) }).catch(()=>{})
      load();const iv=setInterval(load,60000);return()=>clearInterval(iv)
    },[])
    if(!spread)return null
    const pct=spread.spread_pct
    const pctColor=pct>1?"#3dffa0":pct>0?"#f0b90b":"#ef5350"
    const SideCard=({label,price,currency,advertiser,exchange,url,accentColor})=>(
      <div style={{flex:1,minWidth:"120px",background:"rgba(4,10,28,0.5)",borderRadius:12,padding:"10px 12px",border:`1px solid ${accentColor}22`,display:"flex",flexDirection:"column",gap:5}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:`${accentColor}99`}}>{label}</span>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"rgba(100,140,255,0.35)",background:"rgba(80,120,255,0.08)",padding:"2px 7px",borderRadius:20,border:"1px solid rgba(80,120,255,0.1)"}}>{exchange}</span>
        </div>
        <div style={{fontFamily:"DM Mono,monospace",fontSize:"clamp(16px,4vw,22px)",fontWeight:800,color:accentColor,lineHeight:1}}>
          {price.toFixed(3)}
          <span style={{fontSize:11,fontWeight:400,color:"rgba(180,210,255,0.5)",marginLeft:5}}>{currency}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,minWidth:0}}>
          {url
            ?<a href={url} target="_blank" rel="noreferrer" style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#5ba8ff",textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:3}}>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{advertiser||exchange}</span>
              <span style={{flexShrink:0,opacity:0.6,fontSize:9}}>↗</span>
            </a>
            :<span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#5ba8ff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{advertiser||exchange}</span>
          }
        </div>
        {url&&(
          <a href={url} target="_blank" rel="noreferrer" style={{
            marginTop:4,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:4,
            padding:"5px 10px",borderRadius:8,border:`1px solid ${accentColor}40`,
            background:`${accentColor}0f`,color:accentColor,
            fontFamily:"DM Mono,monospace",fontSize:10,fontWeight:600,
            textDecoration:"none",transition:"all .18s",cursor:"pointer",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=`${accentColor}22`}}
          onMouseLeave={e=>{e.currentTarget.style.background=`${accentColor}0f`}}>
            View advertiser ↗
          </a>
        )}
      </div>
    )
    return(
      <div style={{padding:"14px 14px 16px",borderBottom:"1px solid rgba(38,166,154,0.12)",background:"linear-gradient(135deg,rgba(38,166,154,0.05) 0%,rgba(4,10,28,0.0) 100%)"}}>
        {/* Header row */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <span style={{fontSize:8,letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(38,166,154,0.55)",fontFamily:"DM Mono,monospace"}}>⚡ Best Spread</span>
          <div style={{flex:1,height:1,background:"rgba(38,166,154,0.1)"}}/>
          <div style={{fontFamily:"DM Mono,monospace",fontSize:15,fontWeight:800,color:pctColor,
            background:`${pctColor}15`,padding:"2px 10px",borderRadius:20,border:`1px solid ${pctColor}30`,
            boxShadow:`0 0 12px ${pctColor}20`}}>
            {pct>0?"+":""}{pct}%
          </div>
        </div>
        {/* Cards row - flex-wrap on mobile */}
        <div style={{display:"flex",alignItems:"stretch",gap:8,flexWrap:"wrap"}}>
          <SideCard
            label="Buy"
            price={spread.buy_price}
            currency={spread.fiat}
            advertiser={spread.buy_advertiser}
            exchange={spread.buy_exchange}
            url={spread.buy_url}
            accentColor="#26a69a"
          />
          {/* Arrow center */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:"0 2px",flexShrink:0}}>
            <div style={{width:1,flex:1,background:"rgba(38,166,154,0.1)"}}/>
            <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(38,166,154,0.1)",border:"1px solid rgba(38,166,154,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"rgba(38,166,154,0.7)",flexShrink:0}}>→</div>
            <div style={{width:1,flex:1,background:"rgba(38,166,154,0.1)"}}/>
          </div>
          <SideCard
            label="Sell"
            price={spread.sell_price}
            currency={spread.crypto}
            advertiser={spread.sell_advertiser}
            exchange={spread.sell_exchange}
            url={spread.sell_url}
            accentColor="#4a9eff"
          />
        </div>
      </div>
    )
  }

  // ─── Market Sentiment ─────────────────────────────────────────────────────────
  function MarketSentiment(){
    const [coins,setCoins]=useState([])
    const [collapsed,setCollapsed]=useState(true)
    useEffect(()=>{
      const load=async()=>{
        try{
          const res=await fetch("https://flowanalytics-production.up.railway.app/market/trending")
          const json=await res.json()
          const raw=json.data||[]
          // Normalize: pick the change field whichever name the API uses
          const parsed=raw.slice(0,8).map(c=>({
            symbol:(c.symbol||c.name||"").replace(/USDT$/,"").replace(/BUSD$/,""),
            chg: parseFloat(c.price_change_percent ?? c.priceChangePercent ?? c.change_24h ?? c.change ?? 0),
          })).filter(c=>c.symbol)
          setCoins(parsed)
        }catch(e){}
      }
      load();const iv=setInterval(load,60000);return()=>clearInterval(iv)
    },[])

    // headline tickers (BTC, ETH, first stablecoin)
    const btc=coins.find(c=>c.symbol==="BTC")
    const eth=coins.find(c=>c.symbol==="ETH")
    const stable=coins.find(c=>["USDC","USDT","DAI"].includes(c.symbol))

    const Chip=({label,chg})=>{
      const up=chg>=0
      const col=up?"#26a69a":"#ef5350"
      return(
        <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:7,
          background:up?"rgba(38,166,154,0.08)":"rgba(239,83,80,0.08)",
          border:`1px solid ${col}25`,flexShrink:0}}>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(180,210,255,0.55)"}}>{label}</span>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:10,fontWeight:700,color:col}}>{up?"+":""}{chg.toFixed(2)}%</span>
        </div>
      )
    }
    return(
      <div className="glass-strong" style={{marginBottom:13,overflow:"hidden"}}>
        {/* Header — always visible, click to toggle */}
        <div onClick={()=>setCollapsed(c=>!c)}
          style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none",flexWrap:"nowrap",overflow:"hidden"}}>
          <span style={{fontSize:8,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(120,170,255,0.45)",fontFamily:"DM Mono,monospace",flexShrink:0}}>📊 Sentiment</span>
          <div style={{flex:1,height:1,background:"rgba(80,130,255,0.08)",minWidth:4}}/>
          {/* Show 2-3 headline chips inline when collapsed */}
          <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
            {btc&&<Chip label="BTC" chg={btc.chg}/>}
            {eth&&<Chip label="ETH" chg={eth.chg}/>}
            {stable&&<Chip label={stable.symbol} chg={stable.chg}/>}
          </div>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"rgba(80,130,255,0.3)",marginLeft:4,flexShrink:0,
            transition:"transform .2s",transform:collapsed?"rotate(0deg)":"rotate(180deg)"}}>▼</span>
        </div>
        {/* Expanded: all coins grid */}
        {!collapsed&&(
          <div style={{padding:"2px 14px 12px",display:"flex",gap:6,flexWrap:"wrap"}}>
            {coins.map((c,i)=><Chip key={i} label={c.symbol} chg={c.chg}/>)}
          </div>
        )}
      </div>
    )
  }

  // ─── Calculator ───────────────────────────────────────────────────────────────
  function Calculator({offers,side,fiat:globalFiat,crypto:globalCrypto}){
    const [amount,setAmount]=useState("")
    const fromCur=side==="BUY"?globalFiat:globalCrypto
    const toCur=side==="BUY"?globalCrypto:globalFiat
    const num=parseFloat(amount)||0
    const valid=num>0?offers.filter(o=>num>=o.min_amount&&num<=o.max_amount):offers
    const outOfRange=num>0&&valid.length===0
    const best=valid.length?valid.reduce((a,b)=>{
      const ea=side==="BUY"?a.price*(1+(a.commission||0)/100):a.price*(1-(a.commission||0)/100)
      const eb=side==="BUY"?b.price*(1+(b.commission||0)/100):b.price*(1-(b.commission||0)/100)
      return side==="BUY"?(ea<eb?a:b):(ea>eb?a:b)
    }):null
    const effP=best?(side==="BUY"?best.price*(1+(best.commission||0)/100):best.price*(1-(best.commission||0)/100)):null
    const result=effP&&num?(side==="BUY"?num/effP:num*effP):null
    const [calcOpen,setCalcOpen]=useState(true)
    return(
      <div className="glass-strong" style={{marginBottom:13,overflow:"hidden"}}>
        <div onClick={()=>setCalcOpen(o=>!o)} style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",userSelect:"none"}}>
          <span style={{fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(120,170,255,0.45)",fontFamily:"DM Mono,monospace"}}>⚡ Quick Calculator</span>
          <div style={{flex:1,height:1,background:"rgba(80,130,255,0.08)"}}/>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"rgba(80,130,255,0.3)",transition:"transform .2s",transform:calcOpen?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
        </div>
        {calcOpen&&<div style={{padding:"0 16px 15px"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:120,display:"flex"}}>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"
              style={{flex:1,background:"rgba(4,10,28,0.8)",border:"1px solid rgba(80,130,255,0.18)",borderRight:"none",borderRadius:"10px 0 0 10px",padding:"10px 8px",fontFamily:"DM Mono,monospace",fontSize:15,color:"#fff",outline:"none",minWidth:0}}
              onFocus={e=>e.target.style.borderColor="rgba(80,130,255,0.45)"}
              onBlur={e=>e.target.style.borderColor="rgba(80,130,255,0.18)"}/>
            <div style={{background:"rgba(8,20,55,0.9)",border:"1px solid rgba(80,130,255,0.18)",borderLeft:"none",borderRadius:"0 10px 10px 0",padding:"8px 12px",display:"flex",alignItems:"center",fontFamily:"DM Mono,monospace",fontSize:12,color:"rgba(150,190,255,0.7)",whiteSpace:"nowrap"}}>
              {fromCur}
            </div>
          </div>
          <span style={{color:"rgba(100,150,255,0.4)",fontSize:16,flexShrink:0}}>→</span>
          <div style={{flex:1,minWidth:120,background:"rgba(4,10,28,0.6)",border:`1px solid ${outOfRange?"rgba(239,83,80,0.3)":"rgba(80,130,255,0.1)"}`,borderRadius:10,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:16,fontWeight:600,color:outOfRange?"#ef5350":result?"#26a69a":"rgba(80,130,255,0.2)"}}>
              {result?result.toFixed(side==="BUY"?4:2):"—"}
            </span>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:12,color:"rgba(150,190,255,0.5)",whiteSpace:"nowrap"}}>
              {toCur}
            </span>
          </div>
        </div>
        {outOfRange&&num>0&&(
          <div style={{marginTop:8,fontFamily:"DM Mono,monospace",fontSize:11,color:"#ef5350"}}>
            ⚠ No offers for {num.toLocaleString()} {fromCur}
            {offers.length>0&&` — range: ${offers[0].min_amount.toLocaleString()}–${Math.max(...offers.map(o=>o.max_amount)).toLocaleString()}`}
          </div>
        )}
        </div>}
        {best&&result&&!outOfRange&&(
          <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(100,150,255,0.4)"}}>via</span>
            {best.url
              ?<a href={best.url} target="_blank" rel="noreferrer" style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#5ba8ff",textDecoration:"none"}}>{best.trusted&&"⭐ "}{best.advertiser} ↗</a>
              :<span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#5ba8ff"}}>{best.trusted&&"⭐ "}{best.advertiser}</span>
            }
            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(100,150,255,0.4)"}}>
              @ {best.price.toFixed(3)}{best.commission>0&&<span style={{color:"rgba(239,83,80,0.6)"}}> +{best.commission}% → {effP?.toFixed(3)}</span>}
            </span>
          </div>
        )}
      </div>
    )
  }

  // ─── Mobile Offer Card ────────────────────────────────────────────────────────
  function OfferCard({o,i,isBest,changed,fiat}){
    const exConf=EXCHANGES_CONFIG.find(e=>e.label===o.exchange)
    return(
      <div style={{
        margin:"0 0 10px",padding:"16px",borderRadius:14,
        background:isBest?"rgba(8,28,55,0.85)":"rgba(8,18,50,0.75)",
        border:`1.5px solid ${isBest?"rgba(38,166,154,0.45)":"rgba(70,120,220,0.18)"}`,
        opacity:0,transform:"translateY(6px)",
        animation:`fadeUp .3s forwards ${i*40}ms`,
      }}>
        {/* top row: price + advertiser */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:24,fontWeight:700,color:isBest?"#26a69a":"#e8f4ff",lineHeight:1}}>
              {o.price.toFixed(3)}
              <span style={{fontSize:12,color:"rgba(120,170,255,0.45)",fontWeight:400,marginLeft:5}}>{fiat}</span>
            </div>
            {isBest&&<div style={{marginTop:5,display:"inline-block",fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",background:"rgba(38,166,154,0.15)",color:"#26a69a",padding:"2px 8px",borderRadius:20,fontFamily:"DM Mono,monospace"}}>best price</div>}
          </div>
          <div style={{textAlign:"right"}}>
            {o.url
              ?<a href={o.url} target="_blank" rel="noreferrer" style={{fontSize:14,fontWeight:700,color:"rgba(180,210,255,0.8)",textDecoration:"none",display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end"}}>
                  {o.trusted&&<span>⭐</span>}{o.advertiser}<span style={{fontSize:10,opacity:.5}}>↗</span>
                </a>
              :<div style={{fontSize:14,fontWeight:700,color:"rgba(180,210,255,0.8)",display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end"}}>
                  {o.trusted&&<span>⭐</span>}{o.advertiser}
                </div>
            }
            <div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"rgba(100,150,255,0.4)",marginTop:3,display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end"}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:exConf?.color||"#888",display:"inline-block"}}/>
              {o.exchange}
            </div>
          </div>
        </div>

        {/* stats row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[["Min",o.min_amount.toLocaleString()],["Max",o.max_amount.toLocaleString()],["Fee",o.commission===0?"0%":`${o.commission}%`]].map(([label,val],idx)=>(
            <div key={label} style={{background:"rgba(4,10,28,0.5)",borderRadius:9,padding:"7px 10px"}}>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"rgba(80,130,255,0.4)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>{label}</div>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:13,fontWeight:600,color:idx===2?"#26a69a":"rgba(200,225,255,0.85)"}}>{val}</div>
            </div>
          ))}
        </div>

        {/* bottom: rate bar + payment tags */}
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {o.completion_rate>0&&<div style={{flex:1}}><RateBar rate={o.completion_rate} trades={o.trade_count||0}/></div>}
          {o.payment_methods?.length>0&&(
            <div style={{display:"flex",flexWrap:"wrap",gap:3,justifyContent:"flex-end"}}>
              {o.payment_methods.slice(0,3).map((pm,j)=>(
                <span key={j} style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"rgba(80,130,255,0.55)",background:"rgba(20,50,130,0.25)",border:"1px solid rgba(60,100,200,0.15)",borderRadius:4,padding:"2px 6px",whiteSpace:"nowrap"}}>{pm}</span>
              ))}
              {o.payment_methods.length>3&&<span style={{fontFamily:"DM Mono,monospace",fontSize:8,color:"rgba(80,130,255,0.4)",background:"rgba(20,50,130,0.18)",border:"1px solid rgba(60,100,200,0.1)",borderRadius:4,padding:"2px 5px"}}>+{o.payment_methods.length-3}</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Market Mode ──────────────────────────────────────────────────────────────
  function MarketMode(){
    const [chartData,setChartData]=useState([])
    const [trending,setTrending]=useState([])
    const [symbol,setSymbol]=useState("BTCUSDT")
    const [interval,setInterval]=useState("1d")
    const [loadingChart,setLoadingChart]=useState(true)
    const [loadingTrending,setLoadingTrending]=useState(true)
    const isMobile=window.innerWidth<640

    useEffect(()=>{
      setLoadingChart(true)
      fetch(`https://flowanalytics-production.up.railway.app/market/chart?symbol=${symbol}&interval=${interval}`)
        .then(r=>r.json()).then(d=>{setChartData(d.data||[]);setLoadingChart(false)}).catch(()=>setLoadingChart(false))
    },[symbol,interval])
    useEffect(()=>{
      setLoadingTrending(true)
      fetch("https://flowanalytics-production.up.railway.app/market/trending")
        .then(r=>r.json()).then(d=>{setTrending(d.data||[]);setLoadingTrending(false)}).catch(()=>setLoadingTrending(false))
    },[])

    const last=chartData[chartData.length-1],first=chartData[0]
    const change=last&&first?((last.close-first.close)/first.close*100):null
    const isUp=(change||0)>=0
    const symInfo=CHART_SYMBOLS.find(s=>s.id===symbol)

    // On mobile: 3 cols (no Volume), desktop: 4 cols
    const trendCols=isMobile?"1fr 1fr 0.8fr":"1fr 1fr 0.7fr 0.9fr"

    return(
      <div style={{width:"100%",minWidth:0}}>
        <div className="glass-strong" style={{marginBottom:13, overflow:"hidden", maxWidth:"100%"}}>
          {/* Symbol tabs — scrollable */}
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <div style={{display:"flex",borderBottom:"1px solid rgba(50,90,180,0.08)",minWidth:"max-content",padding:"10px 14px 0"}}>
              {CHART_SYMBOLS.map(s=>(
                <button key={s.id} onClick={()=>setSymbol(s.id)} style={{
                  padding:"6px 11px",border:"none",cursor:"pointer",fontFamily:"DM Mono,monospace",fontSize:12,fontWeight:600,
                  transition:"all .2s",whiteSpace:"nowrap",background:symbol===s.id?"rgba(38,166,154,0.1)":"transparent",
                  color:symbol===s.id?"#26a69a":"rgba(120,170,255,0.4)",
                  borderBottom:symbol===s.id?"2px solid #26a69a":"2px solid transparent",
                  borderRadius:"4px 4px 0 0",marginBottom:-1
                }}>{s.label}/USDT</button>
              ))}
              <div style={{marginLeft:"auto",display:"flex",gap:2,alignItems:"center",paddingBottom:8,paddingLeft:10}}>
                {INTERVALS.map(iv=>(
                  <button key={iv} onClick={()=>setInterval(iv)} style={{
                    padding:"4px 8px",borderRadius:5,border:"none",cursor:"pointer",fontFamily:"DM Mono,monospace",fontSize:11,
                    transition:"all .2s",whiteSpace:"nowrap",
                    background:interval===iv?"rgba(80,130,255,0.14)":"transparent",
                    color:interval===iv?"#c8dcff":"rgba(100,150,255,0.3)"
                  }}>{iv}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Price header */}
          <div style={{padding:"12px 16px 4px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontSize:11,fontFamily:"DM Mono,monospace",color:"rgba(120,170,255,0.4)"}}>{symInfo?.name}</span>
            {last&&<>
              <span style={{fontSize:isMobile?22:28,fontWeight:800,color:"#fff",letterSpacing:"-0.02em",fontFamily:"DM Mono,monospace"}}>
                {last.close.toLocaleString(undefined,{maximumFractionDigits:2})}
              </span>
              {change!==null&&<span style={{fontSize:12,fontFamily:"DM Mono,monospace",color:isUp?"#26a69a":"#ef5350"}}>{isUp?"▲":"▼"} {Math.abs(change).toFixed(2)}%</span>}
              <a href={`https://www.binance.com/en/trade/${symInfo?.label}_USDT`} target="_blank" rel="noreferrer"
                style={{marginLeft:"auto",padding:"5px 12px",borderRadius:8,background:"rgba(38,166,154,0.1)",border:"1px solid rgba(38,166,154,0.2)",color:"#26a69a",fontFamily:"DM Mono,monospace",fontSize:11,textDecoration:"none",whiteSpace:"nowrap",flexShrink:0}}>
                Trade ↗
              </a>
            </>}
          </div>

          {/* Chart */}
          <div style={{minWidth:0,overflow:"hidden"}}>
            {loadingChart
              ?<div style={{height:270,display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(80,130,255,0.3)",fontFamily:"DM Mono,monospace",fontSize:12}}><span className="pulse" style={{marginRight:8}}/>loading...</div>
              :<BinanceChart data={chartData}/>
            }
          </div>
        </div>

        {/* Trending — responsive */}
        <div className="glass-strong" style={{overflow:"hidden"}}>
          <div style={{padding:"11px 16px",borderBottom:"1px solid rgba(50,90,180,0.07)"}}>
            <span style={{fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(100,150,255,0.4)",fontFamily:"DM Mono,monospace"}}>Top Movers 24h</span>
          </div>
          {loadingTrending
            ?<div style={{padding:36,textAlign:"center",color:"rgba(80,130,255,0.3)",fontFamily:"DM Mono,monospace",fontSize:12}}><span className="pulse"/>loading...</div>
            :<>
              {/* Header */}
              <div style={{padding:"8px 16px",display:"grid",gridTemplateColumns:trendCols,gap:8,borderBottom:"1px solid rgba(50,90,180,0.05)"}}>
                {(isMobile?["Symbol","Price","24h"]:["Symbol","Price","24h","Volume"]).map(h=>(
                  <span key={h} style={{fontSize:9,letterSpacing:"0.15em",textTransform:"uppercase",color:"rgba(80,130,255,0.3)",fontFamily:"DM Mono,monospace"}}>{h}</span>
                ))}
              </div>
              {/* Rows */}
              {trending.map((t,i)=>(
                <a key={i} href={`https://www.binance.com/en/trade/${t.symbol}_USDT`} target="_blank" rel="noreferrer"
                  style={{padding:"8px 16px",display:"grid",gridTemplateColumns:trendCols,gap:8,alignItems:"center",borderBottom:"1px solid rgba(50,90,180,0.03)",textDecoration:"none",opacity:0,transform:"translateY(5px)",animation:`fadeUp .3s forwards ${i*18}ms`,transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(80,130,255,0.04)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{minWidth:0}}>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:12,fontWeight:600,color:"#cce0ff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {t.symbol}<span style={{color:"rgba(100,150,255,0.3)",fontWeight:400}}>/USDT</span>
                    </div>
                    {!isMobile&&<div style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"rgba(80,130,255,0.35)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{COIN_NAMES[t.symbol]||""}</div>}
                  </div>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"rgba(180,210,255,0.65)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    ${t.price<1?t.price.toFixed(5):t.price.toLocaleString()}
                  </span>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:12,fontWeight:600,color:t.change>=0?"#26a69a":"#ef5350",whiteSpace:"nowrap"}}>
                    {t.change>=0?"▲":"▼"} {Math.abs(t.change).toFixed(2)}%
                  </span>
                  {!isMobile&&<span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(80,130,255,0.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    ${(t.volume/1_000_000).toFixed(1)}M
                  </span>}
                </a>
              ))}
            </>
          }
        </div>
      </div>
    )
  }

  // ─── Main App ─────────────────────────────────────────────────────────────────
  // ─── Intro Screen ─────────────────────────────────────────────────────────────
  function IntroScreen({onDone}){
    const [phase,setPhase]=useState(0)
    // phase 0: fade in logo, 1: show tagline, 2: fade out
    useEffect(()=>{
      const t1=setTimeout(()=>setPhase(1),600)
      const t2=setTimeout(()=>setPhase(2),2200)
      const t3=setTimeout(()=>onDone(),3100)
      return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3)}
    },[])
    return(
      <div style={{
        position:"fixed",inset:0,zIndex:9999,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        background:"#040a18",
        opacity:phase===2?0:1,
        transition:phase===2?"opacity 0.9s ease":"none",
        pointerEvents:"none",
      }}>
        {/* Animated grid */}
        <div style={{position:"absolute",inset:0,
          backgroundImage:"linear-gradient(rgba(50,100,220,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(50,100,220,0.06) 1px,transparent 1px)",
          backgroundSize:"46px 46px",
          animation:"introGrid 3s ease forwards",
        }}/>
        {/* Orbs */}
        <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(15,55,155,0.35) 0%,transparent 70%)",
          top:-150,left:-100,filter:"blur(80px)",
          animation:"introOrb1 2.5s ease forwards",
        }}/>
        <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(38,166,154,0.15) 0%,transparent 70%)",
          bottom:-100,right:-50,filter:"blur(80px)",
          animation:"introOrb2 2.5s ease forwards",
        }}/>

        {/* Logo mark — animated SVG */}
        <div style={{
          position:"relative",zIndex:1,
          opacity:phase>=0?1:0,
          transform:phase>=0?"translateY(0)":"translateY(20px)",
          transition:"opacity 0.8s ease, transform 0.8s ease",
          marginBottom:32,
          display:"flex",alignItems:"center",justifyContent:"center",
          width:120,height:120,
        }}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{position:"absolute",top:0,left:0}}>
            {/* Outer ring — slow spin */}
            <g style={{transformOrigin:"60px 60px",animation:"spinCW 8s linear infinite"}}>
              <circle cx="60" cy="60" r="56" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
              {/* tick marks on outer ring */}
              {Array.from({length:12},(_,i)=>{
                const a=(i/12)*Math.PI*2, r1=52, r2=56
                return <line key={i}
                  x1={60+r1*Math.cos(a)} y1={60+r1*Math.sin(a)}
                  x2={60+r2*Math.cos(a)} y2={60+r2*Math.sin(a)}
                  stroke="rgba(255,255,255,0.5)" strokeWidth={i%3===0?"1.5":"0.8"}/>
              })}
              {/* dashed arc segments */}
              <circle cx="60" cy="60" r="56" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2"
                strokeDasharray="12 6" strokeDashoffset="0"/>
            </g>

            {/* Middle ring — counter spin */}
            <g style={{transformOrigin:"60px 60px",animation:"spinCCW 5s linear infinite"}}>
              <circle cx="60" cy="60" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
              <circle cx="60" cy="60" r="42" stroke="rgba(255,255,255,0.25)" strokeWidth="1"
                strokeDasharray="5 20" strokeDashoffset="0"/>
              {/* 6 diamond dots */}
              {Array.from({length:6},(_,i)=>{
                const a=(i/6)*Math.PI*2-Math.PI/2
                return <rect key={i}
                  x={60+42*Math.cos(a)-3} y={60+42*Math.sin(a)-3}
                  width="6" height="6" rx="1"
                  fill="white" opacity="0.7"
                  style={{transformOrigin:`${60+42*Math.cos(a)}px ${60+42*Math.sin(a)}px`,transform:"rotate(45deg)"}}/>
              })}
            </g>

            {/* Inner hexagon ring — slow spin */}
            <g style={{transformOrigin:"60px 60px",animation:"spinCW 12s linear infinite"}}>
              {Array.from({length:6},(_,i)=>{
                const a=(i/6)*Math.PI*2-Math.PI/2
                const nx=60+26*Math.cos(a), ny=60+26*Math.sin(a)
                const a2=((i+1)/6)*Math.PI*2-Math.PI/2
                const nx2=60+26*Math.cos(a2), ny2=60+26*Math.sin(a2)
                return <line key={i} x1={nx} y1={ny} x2={nx2} y2={ny2}
                  stroke="rgba(255,255,255,0.35)" strokeWidth="1.2"/>
              })}
            </g>

            {/* Core — pulse */}
            <circle cx="60" cy="60" r="14" fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"
              style={{animation:"introPulseBox 2s ease infinite"}}/>
            <circle cx="60" cy="60" r="5" fill="white" opacity="0.9"/>

            {/* Cross lines through center */}
            <line x1="60" y1="44" x2="60" y2="52" stroke="white" strokeWidth="1" opacity="0.4"/>
            <line x1="60" y1="68" x2="60" y2="76" stroke="white" strokeWidth="1" opacity="0.4"/>
            <line x1="44" y1="60" x2="52" y2="60" stroke="white" strokeWidth="1" opacity="0.4"/>
            <line x1="68" y1="60" x2="76" y2="60" stroke="white" strokeWidth="1" opacity="0.4"/>
          </svg>

          {/* Glow behind */}
          <div style={{
            position:"absolute",width:80,height:80,borderRadius:"50%",
            background:"radial-gradient(circle,rgba(100,160,255,0.18) 0%,transparent 70%)",
            animation:"introPulseBox 2.5s ease infinite",
          }}/>
        </div>

        {/* Title */}
        <div style={{
          position:"relative",zIndex:1,
          opacity:phase>=0?1:0,
          transform:phase>=0?"translateY(0)":"translateY(20px)",
          transition:"opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s",
          textAlign:"center",
        }}>
          <h1 style={{
            fontFamily:"Syne,sans-serif",fontWeight:800,
            fontSize:"clamp(36px,8vw,64px)",
            lineHeight:1.05,letterSpacing:"-0.02em",
            color:"#fff",margin:0,
          }}>
            Meta<span style={{
              background:"linear-gradient(135deg,#4a9eff,#88c4ff,#e0f0ff)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            }}>flow</span>
          </h1>
          <div style={{
            fontFamily:"Syne,sans-serif",fontWeight:800,
            fontSize:"clamp(36px,8vw,64px)",
            lineHeight:1.05,letterSpacing:"-0.02em",
            color:"#fff",
          }}>Analytics</div>
        </div>

        {/* Tagline */}
        <div style={{
          position:"relative",zIndex:1,marginTop:18,
          opacity:phase>=1?1:0,
          transform:phase>=1?"translateY(0)":"translateY(10px)",
          transition:"opacity 0.6s ease, transform 0.6s ease",
          fontFamily:"DM Mono,monospace",fontSize:13,fontWeight:300,
          color:"rgba(120,170,255,0.5)",letterSpacing:"0.18em",
        }}>
          // real-time p2p intelligence
        </div>

        {/* Loading bar */}
        <div style={{
          position:"absolute",bottom:0,left:0,right:0,height:2,
          background:"rgba(80,130,255,0.08)",overflow:"hidden",
        }}>
          <div style={{
            height:"100%",
            background:"linear-gradient(90deg,transparent,rgba(80,160,255,0.6),rgba(38,166,154,0.8),transparent)",
            animation:"introBar 2.8s ease forwards",
          }}/>
        </div>

        <style>{`
          @keyframes introBar{
            0%{transform:translateX(-100%);width:100%;}
            100%{transform:translateX(100%);width:100%;}
          }
          @keyframes introPulseBox{
            0%,100%{box-shadow:0 0 40px rgba(80,130,255,0.15),inset 0 0 20px rgba(80,130,255,0.05);}
            50%{box-shadow:0 0 60px rgba(80,130,255,0.3),inset 0 0 30px rgba(80,130,255,0.1);}
          }
          @keyframes introOrb1{
            0%{opacity:0;transform:scale(0.8);}
            100%{opacity:1;transform:scale(1);}
          }
          @keyframes introOrb2{
            0%{opacity:0;transform:scale(0.8);}
            50%{opacity:1;transform:scale(1);}
          }
          @keyframes spinCW{
            from{transform:rotate(0deg);}
            to{transform:rotate(360deg);}
          }
          @keyframes spinCCW{
            from{transform:rotate(0deg);}
            to{transform:rotate(-360deg);}
          }
        `}</style>
      </div>
    )
  }

  export default function App(){
    const [intro,setIntro]=useState(true)
    const [mode,setMode]=useState("p2p")
    const [offers,setOffers]=useState([])
    const [loading,setLoading]=useState(true)
    const [fiat,setFiat]=useState("PLN")
    const [crypto,setCrypto]=useState("USDT")
    const [side,setSide]=useState("BUY")
    const [exchange,setExchange]=useState("bybit")
    const [sort,setSort]=useState("price")
    const [minRate,setMinRate]=useState(0)
    const [paymentFilter,setPaymentFilter]=useState("")
    const [liveMode,setLiveMode]=useState(true)
    const [lastUpdated,setLastUpdated]=useState(null)
    const [countdown,setCountdown]=useState(25)
    const [error,setError]=useState(null)
    const [isPortrait,setIsPortrait]=useState(window.innerHeight>window.innerWidth&&window.innerWidth<640)
    const prevPricesRef=useRef({})
    const [changedRows,setChangedRows]=useState({})
    const isMobile=window.innerWidth<640
    const TTL=25

    // Detect portrait mode
    useEffect(()=>{
      const check=()=>setIsPortrait(window.innerHeight>window.innerWidth&&window.innerWidth<640)
      window.addEventListener("resize",check);window.addEventListener("orientationchange",check)
      return()=>{window.removeEventListener("resize",check);window.removeEventListener("orientationchange",check)}
    },[])

    const loadOffers=useCallback((f,c,s,ex,sr,mr,pf)=>{
      setError(null)
      const pmParam=pf?`&payment=${encodeURIComponent(pf)}`:""
      fetch(`https://flowanalytics-production.up.railway.app/p2p?fiat=${f}&crypto=${c}&side=${s}&exchange=${ex}&sort=${sr}&min_rate=${mr}${pmParam}`)
        .then(r=>r.json())
        .then(d=>{
          const newOffers=d.offers||[]
          const changed={}
          newOffers.forEach(o=>{
            const key=o.advertiser
            if(prevPricesRef.current[key]!==undefined&&prevPricesRef.current[key]!==o.price)
              changed[key]=o.price>prevPricesRef.current[key]?"up":"down"
          })
          const np={};newOffers.forEach(o=>{np[o.advertiser]=o.price})
          prevPricesRef.current=np
          if(Object.keys(changed).length){setChangedRows(changed);setTimeout(()=>setChangedRows({}),2200)}
          setOffers(newOffers);setLoading(false)
          setLastUpdated(new Date().toLocaleTimeString("pl-PL",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}))
          setCountdown(TTL)
        })
        .catch(()=>{setError("Connection error");setLoading(false)})
    },[])

    useEffect(()=>{
      if(mode!=="p2p")return
      setLoading(true)
      loadOffers(fiat,crypto,side,exchange,sort,minRate,paymentFilter)
      if(!liveMode)return
      const iv=setInterval(()=>{
        if(!document.hidden) loadOffers(fiat,crypto,side,exchange,sort,minRate,paymentFilter)
      },TTL*1000)
      const tick=setInterval(()=>{
        if(!document.hidden) setCountdown(c=>c>0?c-1:TTL)
      },1000)
      // pause/resume on tab visibility
      const onVis=()=>{ if(!document.hidden){ loadOffers(fiat,crypto,side,exchange,sort,minRate,paymentFilter);setCountdown(TTL) } }
      document.addEventListener("visibilitychange",onVis)
      return()=>{clearInterval(iv);clearInterval(tick);document.removeEventListener("visibilitychange",onVis)}
    },[fiat,crypto,side,exchange,sort,minRate,paymentFilter,liveMode,mode,loadOffers])

    // Available payment methods from current offers
    const availablePayments=useMemo(()=>{
      const set=new Set()
      offers.forEach(o=>o.payment_methods?.forEach(pm=>set.add(pm)))
      return ["", ...Array.from(set).sort()]
    },[offers])

    // Client-side score sort & payment filter
    const displayOffers=useMemo(()=>{
      let list=[...offers]
      if(paymentFilter) list=list.filter(o=>o.payment_methods?.some(pm=>pm.toLowerCase().includes(paymentFilter.toLowerCase())))
      if(sort==="score") list.sort((a,b)=>(b.rating_score||0)-(a.rating_score||0))
      return list
    },[offers,paymentFilter,sort])

    const bestPrice=displayOffers.length?(side==="BUY"?Math.min(...displayOffers.map(o=>o.price)):Math.max(...displayOffers.map(o=>o.price))):null

    return(
      <>
        {intro&&<IntroScreen onDone={()=>setIntro(false)}/>}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
                    html,body{
            max-width:100vw;
            canvas { max-width: 100% !important; display: block; }
            }
          body{background:#040a18;min-height:100vh;font-family:'Syne',sans-serif;display:flex;justify-content:center;}
          body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
            background-image:linear-gradient(rgba(50,100,220,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(50,100,220,0.04) 1px,transparent 1px);
            background-size:46px 46px;}
          .bg-orb{position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0;}
          .orb1{width:600px;height:600px;background:radial-gradient(circle,rgba(15,55,155,0.2) 0%,transparent 70%);top:-200px;left:-120px;}
          .orb2{width:500px;height:500px;background:radial-gradient(circle,rgba(0,110,210,0.11) 0%,transparent 70%);bottom:-120px;right:-90px;}
          .orb3{width:320px;height:320px;background:radial-gradient(circle,rgba(38,166,154,0.07) 0%,transparent 70%);top:38%;left:42%;}
          .wrapper{position:relative;z-index:1;min-height:100vh;padding:34px 20px 80px;max-width:1020px;width:100%;min-width:0;}
          .glass-strong{background:rgba(8,16,42,0.55);backdrop-filter:blur(32px) saturate(1.4);-webkit-backdrop-filter:blur(32px) saturate(1.4);border:2px solid rgba(90,140,255,0.18);border-radius:20px;box-shadow:0 0 0 1px rgba(255,255,255,0.04) inset,0 24px 48px rgba(0,0,0,0.35);transform:translateZ(0);}
          .header{margin-bottom:26px;}
          .logo{font-size:11px;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:rgba(100,160,255,0.45);margin-bottom:10px;}
          .title{font-size:clamp(26px,4.5vw,50px);font-weight:800;line-height:1.06;color:#fff;letter-spacing:-.02em;}
          .title span{background:linear-gradient(135deg,#4a9eff,#88c4ff,#e0f0ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
          .subtitle{margin-top:7px;font-size:12px;color:rgba(120,170,255,0.38);font-family:'DM Mono',monospace;font-weight:300;}
          .mode-switcher{display:flex;width:100%;max-width:210px;background:rgba(6,14,36,0.7);border:2px solid rgba(70,120,220,0.15);border-radius:13px;padding:4px;margin-bottom:15px;}
          .mode-btn{flex:1;padding:8px 0;text-align:center;border-radius:9px;border:none;cursor:pointer;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;transition:all .25s;background:transparent;color:rgba(120,170,255,0.35);}
          .mode-btn.active{background:rgba(12,30,90,0.95);color:#fff;box-shadow:0 2px 14px rgba(0,50,180,0.22);}
          .exchange-tabs{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;}
          .ex-tab{padding:7px 13px;border-radius:10px;border:1.5px solid rgba(70,120,220,0.14);background:rgba(6,14,36,0.5);cursor:pointer;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:rgba(120,170,255,0.35);transition:all .2s;display:flex;align-items:center;gap:6px;}
          .ex-tab.active{background:rgba(10,24,72,0.85);border-color:rgba(90,150,255,0.35);color:#d8ecff;}
          .ex-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
          .controls{padding:12px 15px;display:flex;flex-direction:column;gap:8px;margin-bottom:12px;}
          .ctrl-row{display:flex;align-items:center;gap:7px;flex-wrap:nowrap;}
          .ctrl-row-main{flex-wrap:wrap;}
          .ctrl-label{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:rgba(80,130,255,0.35);white-space:nowrap;flex-shrink:0;}
          .ctrl-sep{font-family:'DM Mono',monospace;font-size:14px;color:rgba(80,130,255,0.25);flex-shrink:0;}
          .live-btn{display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:8px;border:none;cursor:pointer;transition:all .2s;}
          .sel-wrap{position:relative;}
          .sel-wrap select{appearance:none;background:rgba(4,10,26,0.88);border:1.5px solid rgba(70,120,220,0.18);color:#b8d4ff;font-family:'DM Mono',monospace;font-size:12px;font-weight:500;padding:7px 26px 7px 10px;border-radius:10px;cursor:pointer;outline:none;transition:border-color .2s;}
          .sel-wrap select:hover{border-color:rgba(70,120,220,0.4);}
          .sel-wrap::after{content:'▾';position:absolute;right:8px;top:50%;transform:translateY(-50%);color:rgba(70,120,220,0.45);pointer-events:none;font-size:9px;}
          .side-toggle{display:flex;background:rgba(4,10,26,0.88);border:1.5px solid rgba(70,120,220,0.18);border-radius:10px;overflow:hidden;}
          .side-btn{padding:7px 15px;font-family:'DM Mono',monospace;font-size:12px;font-weight:700;letter-spacing:.06em;border:none;cursor:pointer;transition:all .25s;color:rgba(120,170,255,0.38);background:transparent;}
          .side-btn.buy-active{background:rgba(38,166,154,0.18);color:#3effc0;border-radius:8px;text-shadow:0 0 14px rgba(38,166,154,0.6);}
          .side-btn.sell-active{background:rgba(239,83,80,0.16);color:#ff7878;border-radius:8px;text-shadow:0 0 14px rgba(239,83,80,0.5);}
          .sort-tabs{display:flex;gap:3px;}
          .sort-btn{padding:6px 9px;border-radius:8px;border:1.5px solid rgba(70,120,220,0.12);background:transparent;cursor:pointer;font-family:'DM Mono',monospace;font-size:10px;color:rgba(120,170,255,0.32);transition:all .2s;}
          .sort-btn.active{background:rgba(10,24,72,0.8);border-color:rgba(90,150,255,0.28);color:#a8ccff;}
          .rate-filter{display:flex;gap:3px;}
          .rf-btn{padding:6px 8px;border-radius:8px;border:1.5px solid rgba(70,120,220,0.11);background:transparent;cursor:pointer;font-family:'DM Mono',monospace;font-size:10px;color:rgba(100,150,255,0.3);transition:all .2s;}
          .rf-btn.active{background:rgba(38,166,154,0.12);border-color:rgba(38,166,154,0.28);color:#26a69a;}
          .meta{margin-left:auto;display:flex;align-items:center;gap:10px;}
          .countdown svg{transform:rotate(-90deg);}
          .countdown-track{fill:none;stroke:rgba(60,100,200,0.12);stroke-width:2;}
          .countdown-fill{fill:none;stroke:rgba(70,140,255,0.5);stroke-width:2;stroke-linecap:round;stroke-dasharray:88;transition:stroke-dashoffset 1s linear;}
          /* Desktop table */
          .table-header{padding:9px 15px;border-bottom:1px solid rgba(60,100,200,0.07);display:grid;grid-template-columns:1.1fr 1fr 1.5fr 0.5fr 2fr;gap:8px;}
          .th{font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:rgba(80,130,255,0.35);font-family:'DM Mono',monospace;}
          .row{padding:9px 15px;display:grid;grid-template-columns:1.1fr 1fr 1.5fr 0.5fr 2fr;gap:8px;align-items:center;border-bottom:1px solid rgba(60,100,200,0.05);transition:background .2s;opacity:0;transform:translateY(5px);animation:fadeUp .28s forwards;}
          .row:hover{background:rgba(70,120,220,0.04);}
          .row.best{background:rgba(38,166,154,0.05);animation:fadeUp .28s forwards,bestFlash .7s ease .05s;}
          .row.price-up{animation:fadeUp .28s forwards,priceUp 2s ease;}
          .row.price-down{animation:fadeUp .28s forwards,priceDown 2s ease;}
          @keyframes fadeUp{to{opacity:1;transform:translateY(0);}}
          @keyframes bestFlash{0%{background:rgba(38,166,154,0.16);}100%{background:rgba(38,166,154,0.05);}}
          @keyframes priceUp{0%,5%{background:rgba(38,166,154,0.16);}100%{background:transparent;}}
          @keyframes priceDown{0%,5%{background:rgba(239,83,80,0.14);}100%{background:transparent;}}
          .price-cell{font-family:'DM Mono',monospace;font-size:13px;font-weight:600;color:#d0e4ff;cursor:pointer;transition:color .15s;}
          .price-cell:hover{color:#fff;}
          .range-cell{font-family:'DM Mono',monospace;font-size:11px;color:rgba(140,180,255,0.55);line-height:1.6;}
          .range-label{font-size:8px;color:rgba(80,130,255,0.35);letter-spacing:.04em;}
          .fee-cell{font-family:'DM Mono',monospace;font-size:11px;color:#26a69a;text-align:center;}
          .adv-wrap{display:flex;flex-direction:column;gap:3px;min-width:0;}
          .adv-name{font-size:12px;color:rgba(180,210,255,0.7);font-weight:600;text-decoration:none;transition:color .15s;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;gap:4px;}
          .adv-name:hover{color:#7ab8ff;}
          .link-icon{opacity:0;font-size:8px;transition:opacity .15s;flex-shrink:0;}
          .adv-name:hover .link-icon{opacity:1;}
          .payment-tags{display:flex;flex-wrap:wrap;gap:2px;}
          .payment-tag{font-family:'DM Mono',monospace;font-size:8px;color:rgba(80,130,255,0.5);background:rgba(20,50,130,0.22);border:1px solid rgba(60,100,200,0.12);border-radius:4px;padding:1px 5px;white-space:nowrap;}
          .best-badge{display:inline-block;font-size:7px;letter-spacing:.08em;text-transform:uppercase;background:rgba(38,166,154,0.14);color:#26a69a;padding:1px 6px;border-radius:20px;margin-left:4px;font-family:'DM Mono',monospace;vertical-align:middle;}
          .loading-state{padding:50px;text-align:center;color:rgba(80,130,255,0.35);font-family:'DM Mono',monospace;font-size:12px;letter-spacing:.1em;}
          .error-state{padding:32px;text-align:center;color:rgba(239,83,80,0.5);font-family:'DM Mono',monospace;font-size:12px;}
          .pulse{display:inline-block;width:6px;height:6px;border-radius:50%;background:#26a69a;margin-right:7px;animation:pulse 1.6s infinite;}
          @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.25;transform:scale(.65);}}
          .divider{width:1px;height:15px;background:rgba(60,100,200,0.14);}
          /* Mobile */
          @media(max-width:640px){
            .wrapper{overflow-x:hidden;padding:20px 12px 60px;}
            .bg-orb{display:none;}
            .glass-strong{border-radius:14px;}
            .controls{padding:10px 12px;gap:8px;}
            .ctrl-row{gap:5px;flex-wrap:wrap;}
            .sel-wrap select{font-size:11px;padding:6px 18px 6px 8px;}
            .side-btn{padding:6px 10px;font-size:11px;}
            .sort-btn,.rf-btn{padding:5px 7px;font-size:9px;}
            .divider{display:none;}
            .meta{align-items:center;}
            .desktop-table{display:none !important;}
            .mobile-cards{display:block !important;}
          }
          @media(min-width:641px){
            .mobile-cards{display:none !important;}
          }
          @media(max-width:400px){
            .title{font-size:24px;}
          }
        `}</style>

        <ParticleField/>
        <div className="bg-orb orb1"/><div className="bg-orb orb2"/><div className="bg-orb orb3"/>

        <div className="wrapper">
          <div className="header">
            <div className="logo">⬡ Metaflow</div>
            <h1 className="title">Meta<span>flow</span><br/>Analytics</h1>
            <p className="subtitle">// real-time · {mode==="p2p"?`${exchange} p2p`:"market overview"}</p>
          </div>

          <div className="mode-switcher">
            <button className={`mode-btn ${mode==="p2p"?"active":""}`} onClick={()=>setMode("p2p")}>P2P</button>
            <button className={`mode-btn ${mode==="market"?"active":""}`} onClick={()=>setMode("market")}>Market</button>
          </div>

          {mode==="market"?(
            isPortrait?(
              <div style={{
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                minHeight:"60vh",gap:20,padding:32,textAlign:"center",
              }}>
                <div style={{fontSize:52, animation:"spinCW 3s linear infinite", display:"inline-block", color:"white"}}>⟳</div>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700,color:"#c8e0ff"}}>Rotate your phone</div>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:12,color:"rgba(120,170,255,0.45)",lineHeight:1.7}}>
                  Market charts require<br/>landscape orientation
                </div>
              </div>
            ):<MarketMode/>
          ):(<>
            <div className="exchange-tabs">
              {EXCHANGES_CONFIG.map(ex=>(
                <button key={ex.id} className={`ex-tab ${exchange===ex.id?"active":""}`} onClick={()=>setExchange(ex.id)}>
                  <span className="ex-dot" style={{background:ex.color}}/>{ex.label}
                </button>
              ))}
            </div>

            <div className="glass-strong controls">
              {/* ROW 1: pair + side */}
              <div className="ctrl-row">
                <div className="sel-wrap">
                  <select value={fiat} onChange={e=>setFiat(e.target.value)}>
                    <optgroup label="Fiat">{FIATS.map(f=><option key={f}>{f}</option>)}</optgroup>
                    <optgroup label="Crypto">{CRYPTOS.map(c=><option key={c}>{c}</option>)}</optgroup>
                  </select>
                </div>
                <span className="ctrl-sep">/</span>
                <div className="sel-wrap">
                  <select value={crypto} onChange={e=>setCrypto(e.target.value)}>
                    <optgroup label="Crypto">{CRYPTOS.map(c=><option key={c}>{c}</option>)}</optgroup>
                    <optgroup label="Fiat">{FIATS.map(f=><option key={f}>{f}</option>)}</optgroup>
                  </select>
                </div>
                <div className="side-toggle" style={{marginLeft:4}}>
                  {["BUY","SELL"].map(s=>(
                    <button key={s} className={`side-btn ${side===s?(s==="BUY"?"buy-active":"sell-active"):""}`} onClick={()=>setSide(s)}>{s}</button>
                  ))}
                </div>
                {/* LIVE — single button, always row 1 end */}
                <div className="meta" style={{marginLeft:"auto"}}>
                  <button onClick={()=>setLiveMode(l=>!l)} className="live-btn" style={{background:liveMode?"rgba(38,166,154,0.12)":"rgba(60,80,150,0.12)"}}>
                    <span style={{width:6,height:6,borderRadius:"50%",flexShrink:0,background:liveMode?"#26a69a":"rgba(120,150,255,0.3)",boxShadow:liveMode?"0 0 6px #26a69a":"none",animation:liveMode?"pulse 1.6s infinite":"none"}}/>
                    <span style={{fontFamily:"DM Mono,monospace",fontSize:9,letterSpacing:"0.1em",color:liveMode?"#26a69a":"rgba(100,140,255,0.35)",fontWeight:600}}>{liveMode?"LIVE":"OFF"}</span>
                  </button>
                  <LiveDot lastUpdated={lastUpdated}/>
                  {liveMode&&<div className="countdown"><svg width="26" height="26" viewBox="0 0 32 32">
                    <circle className="countdown-track" cx="16" cy="16" r="14"/>
                    <circle className="countdown-fill" cx="16" cy="16" r="14" style={{strokeDashoffset:88-(countdown/TTL)*88}}/>
                  </svg></div>}
                </div>
              </div>
              {/* ROW 2: sort + rate */}
              <div className="ctrl-row" style={{flexWrap:"wrap"}}>
                <div className="ctrl-label">Sort</div>
                <div className="sort-tabs">
                  {SORT_OPTIONS.map(o=>(
                    <button key={o.id} className={`sort-btn ${sort===o.id?"active":""}`} onClick={()=>setSort(o.id)}>{o.label}</button>
                  ))}
                </div>
                <div className="divider"/>
                <div className="ctrl-label">Rate</div>
                <div className="rate-filter">
                  {RATE_FILTERS.map(r=>(
                    <button key={r.id} className={`rf-btn ${minRate===r.id?"active":""}`} onClick={()=>setMinRate(r.id)}>{r.label}</button>
                  ))}
                </div>
              </div>
              {/* ROW 3: payment */}
              <div className="ctrl-row">
                <div className="ctrl-label">Pay</div>
                <div className="sel-wrap" style={{flex:1}}>
                  <select value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value)}>
                    <option value="">All methods</option>
                    {availablePayments.filter(p=>p).map(pm=>(
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <MarketSentiment/>
            <div className="glass-strong" style={{overflow:"hidden",marginBottom:13}}>
              <SpreadBanner/>
            </div>
            {!loading&&displayOffers.length>0&&<Calculator offers={displayOffers} side={side} fiat={fiat} crypto={crypto}/>}

            {/* Loading / error state */}
            {(loading&&displayOffers.length===0)||error||displayOffers.length===0?(
              <div className="glass-strong" style={{overflow:"hidden"}}>
                {loading&&offers.length===0
                  ?<div className="loading-state"><span className="pulse"/>fetching offers...</div>
                  :error?<div className="error-state">⚠ {error}</div>
                  :<div className="loading-state">no offers found</div>
                }
              </div>
            ):(
              <>
                {/* ── Desktop table ── */}
                <div className="glass-strong desktop-table" style={{overflow:"hidden"}}>
                  <div className="table-header">
                    <span className="th">Price</span>
                    <span className="th">Min</span>
                    <span className="th">Max / Rate</span>
                    <span className="th">Fee</span>
                    <span className="th">Advertiser</span>
                  </div>
                  {displayOffers.map((o,i)=>{
                    const isBest=o.price===bestPrice
                    const changed=changedRows[o.advertiser]
                    return(
                      <div key={`${o.advertiser}-${i}`}
                        className={`row ${isBest?"best":""} ${changed==="up"?"price-up":changed==="down"?"price-down":""}`}
                        style={{animationDelay:`${i*24}ms`}}>
                        <div className="price-cell" style={isBest?{color:"#26a69a"}:{}}>
                          <CopyPrice price={o.price} fiat={fiat}/>
                          {isBest&&<span className="best-badge">best</span>}
                        </div>
                        <div className="range-cell"><span className="range-label">MIN </span>{o.min_amount.toLocaleString()}</div>
                        <div className="range-cell">
                          <div><span className="range-label">MAX </span>{o.max_amount.toLocaleString()}</div>
                          {o.completion_rate>0&&<div style={{marginTop:3}}><RateBar rate={o.completion_rate} trades={o.trade_count||0}/></div>}
                        </div>
                        <div className="fee-cell">{o.commission===0?"0%":`${o.commission}%`}</div>
                        <div className="adv-wrap">
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                            {o.url
                              ?<a className="adv-name" href={o.url} target="_blank" rel="noreferrer">{o.trusted&&<span style={{fontSize:11}}>⭐</span>}{o.advertiser}<span className="link-icon">↗</span></a>
                              :<span className="adv-name">{o.trusted&&<span style={{fontSize:11}}>⭐</span>}{o.advertiser}</span>
                            }
                            {o.rating_score!=null&&(
                              <span style={{fontFamily:"DM Mono,monospace",fontSize:9,padding:"1px 6px",borderRadius:6,
                                background:o.rating_score>=7?"rgba(38,166,154,0.12)":o.rating_score>=4?"rgba(247,166,0,0.1)":"rgba(239,83,80,0.1)",
                                color:o.rating_score>=7?"#26a69a":o.rating_score>=4?"#f7a600":"#ef5350",
                                border:`1px solid ${o.rating_score>=7?"rgba(38,166,154,0.25)":o.rating_score>=4?"rgba(247,166,0,0.2)":"rgba(239,83,80,0.2)"}`,
                                flexShrink:0,
                              }}>★ {o.rating_score.toFixed(1)}</span>
                            )}
                          </div>
                          {o.payment_methods?.length>0&&(
                            <div className="payment-tags">
                              {o.payment_methods.slice(0,4).map((pm,j)=><span key={j} className="payment-tag">{pm}</span>)}
                              {o.payment_methods.length>4&&<span className="payment-tag">+{o.payment_methods.length-4}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ── Mobile cards ── */}
                <div className="mobile-cards" style={{display:"none"}}>
                  {displayOffers.map((o,i)=>(
                    <OfferCard key={`${o.advertiser}-${i}`} o={o} i={i}
                      isBest={o.price===bestPrice} changed={changedRows[o.advertiser]} fiat={fiat}/>
                  ))}
                </div>
              </>
            )}
          </>)}
        </div>
      </>
    )
  }
