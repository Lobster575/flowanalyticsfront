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
  // strip emoji from advertiser names
  const stripEmoji = s => (s||"").replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,"").replace(/\s+/g," ").trim()

  const TR = {
    en: {
      p2p:"P2P", market:"Market", buy:"BUY", sell:"SELL",
      filters:"Filters", applyFilters:"Apply Filters",
      fiatCurrency:"Fiat Currency", crypto:"Crypto", side:"Side",
      exchange:"Exchange", paymentMethod:"Payment Method",
      completionRate:"Completion Rate", sortBy:"Sort By", allMethods:"All methods",
      fetchingOffers:"fetching offers...", noOffersFound:"no offers found",
      connectionError:"Connection error",
      trending:"Trending", gainers:"Gainers", losers:"Losers", favs:"Favs",
      searchSymbol:"Search symbol...",
      live:"LIVE", off:"OFF", bestSpread:"Best Spread",
      marketSentiment:"Market Sentiment", quickCalc:"Quick Calculator",
      viewAdvertiser:"View advertiser",
      bestPrice:"Best Price", sortLabel:"sort", rateLabel:"rate", noOffers:"No offers for",
      min:"Min", max:"Max", fee:"Fee",
      rotatePhone:"Rotate your phone", rotateDesc:"Market charts require landscape orientation",
      noFavs:"Tap \u2605 to save favorites",
      all:"All",
    },
    ru: {
      p2p:"P2P", market:"\u0420\u044b\u043d\u043e\u043a", buy:"\u041a\u0443\u043f\u0438\u0442\u044c", sell:"\u041f\u0440\u043e\u0434\u0430\u0442\u044c",
      filters:"\u0424\u0438\u043b\u044c\u0442\u0440\u044b", applyFilters:"\u041f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c",
      fiatCurrency:"\u0412\u0430\u043b\u044e\u0442\u0430", crypto:"\u041a\u0440\u0438\u043f\u0442\u043e", side:"\u041d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435",
      exchange:"\u0411\u0438\u0440\u0436\u0430", paymentMethod:"\u0421\u043f\u043e\u0441\u043e\u0431 \u043e\u043f\u043b\u0430\u0442\u044b",
      completionRate:"\u0423\u0441\u043f\u0435\u0448\u043d\u043e\u0441\u0442\u044c", sortBy:"\u0421\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u043a\u0430",
      allMethods:"\u0412\u0441\u0435 \u0441\u043f\u043e\u0441\u043e\u0431\u044b",
      fetchingOffers:"\u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0430...", noOffersFound:"\u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b",
      connectionError:"\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u043e\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u044f",
      trending:"\u0422\u043e\u043f", gainers:"\u0420\u043e\u0441\u0442", losers:"\u041f\u0430\u0434\u0435\u043d\u0438\u0435", favs:"\u0418\u0437\u0431\u0440.",
      searchSymbol:"\u041f\u043e\u0438\u0441\u043a...",
      live:"\u042d\u0424\u0418\u0420", off:"\u0412\u042b\u041a\u041b", bestSpread:"\u041b\u0443\u0447\u0448\u0438\u0439 \u0441\u043f\u0440\u0435\u0434",
      marketSentiment:"\u041d\u0430\u0441\u0442\u0440\u043e\u0435\u043d\u0438\u0435 \u0440\u044b\u043d\u043a\u0430", quickCalc:"\u041a\u0430\u043b\u044c\u043a\u0443\u043b\u044f\u0442\u043e\u0440",
      viewAdvertiser:"\u041f\u0440\u043e\u0444\u0438\u043b\u044c",
      bestPrice:"\u041b\u0443\u0447\u0448\u0430\u044f \u0446\u0435\u043d\u0430", sortLabel:"\u0441\u043e\u0440\u0442", rateLabel:"\u0441\u0442\u0430\u0432\u043a\u0430",
      min:"\u041c\u0438\u043d", max:"\u041c\u0430\u043a\u0441", fee:"\u041a\u043e\u043c\u0438\u0441",
      rotatePhone:"\u041f\u043e\u0432\u0435\u0440\u043d\u0438\u0442\u0435 \u0442\u0435\u043b\u0435\u0444\u043e\u043d", rotateDesc:"\u0413\u0440\u0430\u0444\u0438\u043a\u0438 \u0442\u0440\u0435\u0431\u0443\u044e\u0442 \u0433\u043e\u0440\u0438\u0437\u043e\u043d\u0442\u0430\u043b\u044c\u043d\u043e\u0439 \u043e\u0440\u0438\u0435\u043d\u0442\u0430\u0446\u0438\u0438",
      noFavs:"\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u2605 \u0434\u043b\u044f \u0438\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0433\u043e",
      all:"\u0412\u0441\u0435",
    }
  }

  const SORT_OPTIONS_BASE = [
    { id:"price",  en:"Price",      ru:"\u0426\u0435\u043d\u0430" },
    { id:"volume", en:"Volume",     ru:"\u041e\u0431\u044a\u0451\u043c" },
    { id:"rate",   en:"Completion", ru:"\u0423\u0441\u043f\u0435\u0448\u043d\u043e\u0441\u0442\u044c" },
    { id:"score",  en:"Score",      ru:"\u0420\u0435\u0439\u0442\u0438\u043d\u0433" },
  ]
  const RATE_FILTERS_BASE = [
    { id:0,  label:"All",  ru:"\u0412\u0441\u0435" },
    { id:90, label:"90%+", ru:"90%+" },
    { id:95, label:"95%+", ru:"95%+" },
    { id:98, label:"98%+", ru:"98%+" },
  ]

  const COMMON_PAYMENTS = ["BLIK","Revolut","SEPA","Wise","PayPal","Bank Transfer","WebMoney","Paysend","Western Union","Faster Payments"]
  const SORT_OPTIONS = SORT_OPTIONS_BASE.map(o=>({id:o.id,label:o.en}))
  const RATE_FILTERS = RATE_FILTERS_BASE.map(o=>({id:o.id,label:o.label}))

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
  function SpreadBanner({t}){
    const [spread,setSpread]=useState(null)
    const [collapsed,setCollapsed]=useState(false)
    useEffect(()=>{
      const load=()=>fetch("https://flowanalytics-production.up.railway.app/p2p/spread")
        .then(r=>r.json()).then(d=>{ if(d.spread) setSpread(d.spread) }).catch(()=>{})
      load();const iv=setInterval(load,60000);return()=>clearInterval(iv)
    },[])
    if(!spread)return null
    const pct=spread.spread_pct
    const pctColor=pct>1?"#3dffa0":pct>0?"#f0b90b":"#ef5350"
    const SideCard=({label,price,currency,advertiser,exchange,url,accentColor,bg})=>(
      <div style={{flex:1,minWidth:0,background:bg,borderRadius:12,padding:"11px 12px 11px",border:`1.5px solid ${accentColor}30`,display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:`${accentColor}cc`,fontWeight:600}}>{label}</span>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"rgba(100,140,255,0.4)",background:"rgba(80,120,255,0.08)",padding:"2px 8px",borderRadius:20,border:"1px solid rgba(80,120,255,0.12)"}}>{exchange}</span>
        </div>
        <div style={{fontFamily:"DM Mono,monospace",lineHeight:1}}>
          <div style={{fontSize:"clamp(16px,4vw,22px)",fontWeight:800,color:accentColor,letterSpacing:"-0.02em"}}>{price.toFixed(3)}</div>
          <div style={{fontSize:11,color:"rgba(180,210,255,0.4)",marginTop:3}}>{currency}</div>
        </div>
        <div style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"rgba(140,180,255,0.55)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {advertiser||exchange}
        </div>
        {url&&(
          <a href={url} target="_blank" rel="noreferrer" style={{
            display:"flex",alignItems:"center",justifyContent:"center",gap:5,
            padding:"10px 14px",borderRadius:10,border:`1.5px solid ${accentColor}50`,
            background:`${accentColor}18`,color:accentColor,
            fontFamily:"DM Mono,monospace",fontSize:11,fontWeight:700,
            textDecoration:"none",transition:"all .18s",cursor:"pointer",minHeight:42,
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=`${accentColor}28`}}
          onMouseLeave={e=>{e.currentTarget.style.background=`${accentColor}18`}}>
            {(t&&t("viewAdvertiser"))||"View advertiser"} ↗
          </a>
        )}
      </div>
    )
    return(
      <div style={{background:"linear-gradient(135deg,rgba(38,166,154,0.07) 0%,rgba(20,40,100,0.04) 100%)"}}>
        {/* Header — click to collapse */}
        <div onClick={()=>setCollapsed(c=>!c)} style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none"}}>
          <span style={{fontSize:8,letterSpacing:"0.22em",textTransform:"uppercase",color:"rgba(38,166,154,0.5)",fontFamily:"DM Mono,monospace"}}>⚡ Best Spread</span>
          <div style={{flex:1,height:1,background:"rgba(38,166,154,0.1)"}}/>
          <div style={{fontFamily:"DM Mono,monospace",fontSize:"clamp(13px,3.5vw,18px)",fontWeight:900,color:pctColor,
            background:`${pctColor}18`,padding:"4px 14px",borderRadius:24,border:`1.5px solid ${pctColor}40`,
            boxShadow:`0 0 18px ${pctColor}30`,letterSpacing:"-0.01em",flexShrink:0}}>
            {pct>0?"+":""}{pct}%
          </div>
          <span style={{fontFamily:"DM Mono,monospace",fontSize:9,color:"rgba(80,130,255,0.3)",flexShrink:0,transition:"transform .25s",transform:collapsed?"rotate(0deg)":"rotate(180deg)"}}>▼</span>
        </div>
        {/* Cards — smooth collapse via max-height */}
        <div style={{
          maxHeight:collapsed?0:340,
          overflow:"hidden",
          transition:"max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <div style={{padding:"0 10px 12px",display:"flex",gap:8,alignItems:"stretch"}}>
            <SideCard label="BUY" price={spread.buy_price} currency={spread.fiat}
              advertiser={spread.buy_advertiser} exchange={spread.buy_exchange} url={spread.buy_url}
              accentColor="#26a69a" bg="rgba(38,166,154,0.06)"/>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,flexShrink:0,padding:"0 4px"}}>
              <div style={{width:1,flex:1,background:"rgba(38,166,154,0.12)"}}/>
              <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(20,40,80,0.8)",border:"1.5px solid rgba(38,166,154,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"#26a69a",flexShrink:0,boxShadow:"0 0 12px rgba(38,166,154,0.15)"}}>→</div>
              <div style={{width:1,flex:1,background:"rgba(38,166,154,0.12)"}}/>
            </div>
            <SideCard label="SELL" price={spread.sell_price} currency={spread.crypto}
              advertiser={spread.sell_advertiser} exchange={spread.sell_exchange} url={spread.sell_url}
              accentColor="#4a9eff" bg="rgba(74,158,255,0.06)"/>
          </div>
        </div>
      </div>
    )
  }

  // ─── Reusable filter sub-components (defined outside to prevent remount) ─────
  function FilterRow({label,children}){
    return(
      <div style={{marginBottom:14}}>
        <div style={{fontFamily:"DM Mono,monospace",fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(80,130,255,0.4)",marginBottom:7}}>{label}</div>
        {children}
      </div>
    )
  }
  function FilterSel({value,onChange,children}){
    return(
      <div style={{position:"relative"}}>
        <select value={value} onChange={onChange} style={{
          width:"100%",appearance:"none",background:"rgba(4,10,26,0.9)",
          border:"1.5px solid rgba(70,120,220,0.2)",color:"#b8d4ff",
          fontFamily:"DM Mono,monospace",fontSize:13,padding:"12px 32px 12px 12px",
          borderRadius:10,outline:"none",cursor:"pointer",
        }}>{children}</select>
        <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"rgba(70,120,220,0.5)",pointerEvents:"none",fontSize:10}}>▾</span>
      </div>
    )
  }

  // ─── Mobile Filter Panel ─────────────────────────────────────────────────────
  function MobileFilters({fiat,setFiat,crypto,setCrypto,side,setSide,exchange,setExchange,
    paymentFilter,setPaymentFilter,minRate,setMinRate,sort,setSort,sortOptions,rateFilters,availablePayments,
    liveMode,setLiveMode,lastUpdated,countdown,TTL,t,lang}){
    const [open,setOpen]=useState(false)
    const activeCount=[paymentFilter?1:0,minRate>0?1:0,sort!=="price"?1:0].reduce((a,b)=>a+b,0)
    const sortOpts=sortOptions||SORT_OPTIONS_BASE.map(o=>({id:o.id,label:o.en}))
    const rateOpts=rateFilters||RATE_FILTERS_BASE.map(o=>({id:o.id,label:o.label}))
    const tr=t||(k=>k)



    return(
      <div className="mobile-only-block" style={{marginBottom:12}}>
        {/* Top bar: Filters btn + LIVE + countdown */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setOpen(o=>!o)} style={{
            flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            padding:"13px 18px",borderRadius:13,cursor:"pointer",minHeight:48,
            background:open?"rgba(90,150,255,0.14)":"rgba(8,16,42,0.7)",
            border:`1.5px solid ${open?"rgba(90,150,255,0.4)":"rgba(70,120,220,0.18)"}`,
            color:open?"#a8ccff":"rgba(120,170,255,0.6)",
            fontFamily:"DM Mono,monospace",fontSize:12,fontWeight:700,
            transition:"all .2s",
          }}>
            <span style={{fontSize:15}}>⚙</span>
            {tr("filters")}
            {activeCount>0&&<span style={{
              background:"#26a69a",color:"#040a18",borderRadius:"50%",
              width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:9,fontWeight:800,flexShrink:0,
            }}>{activeCount}</span>}
            <span style={{marginLeft:"auto",fontSize:11,opacity:0.4,transition:"transform .2s",transform:open?"rotate(180deg)":"none"}}>▼</span>
          </button>
          {/* Live button */}
          <button onClick={()=>setLiveMode(l=>!l)} style={{
            display:"flex",alignItems:"center",gap:6,padding:"0 14px",
            height:48,borderRadius:13,border:"1.5px solid",cursor:"pointer",
            background:liveMode?"rgba(38,166,154,0.12)":"rgba(60,80,150,0.1)",
            borderColor:liveMode?"rgba(38,166,154,0.35)":"rgba(70,120,220,0.18)",
            flexShrink:0,
          }}>
            <span style={{width:7,height:7,borderRadius:"50%",background:liveMode?"#26a69a":"rgba(120,150,255,0.3)",boxShadow:liveMode?"0 0 6px #26a69a":"none",animation:liveMode?"pulse 1.6s infinite":"none"}}/>
<span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:liveMode?"#26a69a":"rgba(100,140,255,0.35)",fontWeight:600}}>{liveMode?tr("live"):tr("off")}</span>
          </button>
          {liveMode&&<div className="countdown" style={{flexShrink:0}}><svg width="32" height="32" viewBox="0 0 32 32">
            <circle className="countdown-track" cx="16" cy="16" r="14"/>
            <circle className="countdown-fill" cx="16" cy="16" r="14" style={{strokeDashoffset:88-(countdown/TTL)*88}}/>
          </svg></div>}
        </div>

        {/* Active filters summary chips */}
        {!open&&(paymentFilter||minRate>0||sort!=="price")&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
            {sort!=="price"&&<span style={{fontFamily:"DM Mono,monospace",fontSize:10,padding:"3px 10px",borderRadius:20,background:"rgba(38,166,154,0.1)",border:"1px solid rgba(38,166,154,0.25)",color:"#26a69a"}}>{tr("sortLabel")}: {sort}</span>}
            {minRate>0&&<span style={{fontFamily:"DM Mono,monospace",fontSize:10,padding:"3px 10px",borderRadius:20,background:"rgba(38,166,154,0.1)",border:"1px solid rgba(38,166,154,0.25)",color:"#26a69a"}}>{tr("rateLabel")} ≥{minRate}%</span>}
            {paymentFilter&&<span style={{fontFamily:"DM Mono,monospace",fontSize:10,padding:"3px 10px",borderRadius:20,background:"rgba(38,166,154,0.1)",border:"1px solid rgba(38,166,154,0.25)",color:"#26a69a"}}>{paymentFilter}</span>}
          </div>
        )}

        {/* Dropdown panel — smooth open/close */}
        <div style={{
          maxHeight:open?900:0,
          overflow:"hidden",
          transition:"max-height 0.38s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <div className="glass-strong" style={{marginTop:8,padding:"18px 16px 10px",overflow:"visible"}}>
            <FilterRow label={tr("fiatCurrency")}>
              <FilterSel value={fiat} onChange={e=>setFiat(e.target.value)}>
                {FIATS.map(f=><option key={f}>{f}</option>)}
              </FilterSel>
            </FilterRow>
            <FilterRow label={tr("crypto")}>
              <FilterSel value={crypto} onChange={e=>setCrypto(e.target.value)}>
                {CRYPTOS.map(c=><option key={c}>{c}</option>)}
              </FilterSel>
            </FilterRow>
            <FilterRow label={tr("side")}>
              <div style={{display:"flex",gap:8}}>
                {["BUY","SELL"].map(s=>(
                  <button key={s} onClick={()=>setSide(s)} style={{
                    flex:1,padding:"11px",borderRadius:10,border:"1.5px solid",cursor:"pointer",
                    fontFamily:"DM Mono,monospace",fontSize:12,fontWeight:700,minHeight:44,
                    background:side===s?(s==="BUY"?"rgba(38,166,154,0.15)":"rgba(239,83,80,0.12)"):"rgba(4,10,26,0.7)",
                    borderColor:side===s?(s==="BUY"?"rgba(38,166,154,0.4)":"rgba(239,83,80,0.35)"):"rgba(70,120,220,0.18)",
                    color:side===s?(s==="BUY"?"#3effc0":"#ff7878"):"rgba(120,170,255,0.4)",
                  }}>{s}</button>
                ))}
              </div>
            </FilterRow>
            <FilterRow label={tr("exchange")}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {EXCHANGES_CONFIG.map(ex=>(
                  <button key={ex.id} onClick={()=>setExchange(ex.id)} style={{
                    flex:1,padding:"10px",borderRadius:10,border:"1.5px solid",cursor:"pointer",
                    fontFamily:"DM Mono,monospace",fontSize:11,fontWeight:600,minHeight:44,
                    display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                    background:exchange===ex.id?"rgba(10,24,72,0.85)":"rgba(4,10,26,0.7)",
                    borderColor:exchange===ex.id?"rgba(90,150,255,0.4)":"rgba(70,120,220,0.14)",
                    color:exchange===ex.id?"#d8ecff":"rgba(120,170,255,0.35)",
                  }}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:ex.color,flexShrink:0}}/>
                    {ex.label}
                  </button>
                ))}
              </div>
            </FilterRow>
            <FilterRow label={tr("paymentMethod")}>
              <FilterSel value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value)}>
                <option value="">{tr("allMethods")}</option>
                {availablePayments.filter(p=>p).map(pm=><option key={pm} value={pm}>{pm}</option>)}
              </FilterSel>
            </FilterRow>
            <FilterRow label={tr("completionRate")}>
              <div style={{display:"flex",gap:6}}>
                {rateOpts.map(r=>(
                  <button key={r.id} onClick={()=>setMinRate(r.id)} style={{
                    flex:1,padding:"10px 6px",borderRadius:9,border:"1.5px solid",cursor:"pointer",
                    fontFamily:"DM Mono,monospace",fontSize:10,fontWeight:600,minHeight:42,
                    background:minRate===r.id?"rgba(38,166,154,0.14)":"rgba(4,10,26,0.7)",
                    borderColor:minRate===r.id?"rgba(38,166,154,0.4)":"rgba(70,120,220,0.12)",
                    color:minRate===r.id?"#26a69a":"rgba(100,150,255,0.35)",
                  }}>{r.label}</button>
                ))}
              </div>
            </FilterRow>
            <FilterRow label={tr("sortBy")}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {sortOpts.map(o=>(
                  <button key={o.id} onClick={()=>setSort(o.id)} style={{
                    flex:1,padding:"10px 8px",borderRadius:9,border:"1.5px solid",cursor:"pointer",
                    fontFamily:"DM Mono,monospace",fontSize:10,fontWeight:600,minHeight:42,
                    background:sort===o.id?"rgba(80,130,255,0.14)":"rgba(4,10,26,0.7)",
                    borderColor:sort===o.id?"rgba(90,150,255,0.35)":"rgba(70,120,220,0.12)",
                    color:sort===o.id?"#a8ccff":"rgba(100,150,255,0.35)",
                  }}>{o.label}</button>
                ))}
              </div>
            </FilterRow>
            <button onClick={()=>setOpen(false)} style={{
              width:"100%",padding:"13px",borderRadius:11,border:"none",cursor:"pointer",marginTop:4,minHeight:48,
              background:"linear-gradient(135deg,rgba(38,166,154,0.2),rgba(74,158,255,0.15))",
              color:"#7effd4",fontFamily:"DM Mono,monospace",fontSize:12,fontWeight:700,
              border:"1.5px solid rgba(38,166,154,0.3)",
            }}>{tr("applyFilters")} ✓</button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Mobile Market Mode ───────────────────────────────────────────────────────
  function MobileMarketMode({t}){
    const [trending,setTrending]=useState([])
    const [loading,setLoading]=useState(true)
    const [tab,setTab]=useState("trending")
    const [search,setSearch]=useState("")
    const [favs,setFavs]=useState([])

    useEffect(()=>{
      fetch("https://flowanalytics-production.up.railway.app/market/trending")
        .then(r=>r.json()).then(d=>{setTrending(d.data||[]);setLoading(false)}).catch(()=>setLoading(false))
    },[])

    const toggleFav=sym=>{
      setFavs(f=>f.includes(sym)?f.filter(x=>x!==sym):[...f,sym])
    }

    const filtered=trending.filter(coin=>{
      const sym=(coin.symbol||"").toLowerCase()
      if(search&&!sym.includes(search.toLowerCase()))return false
      if(tab==="gainers")return coin.change>=0
      if(tab==="losers")return coin.change<0
      if(tab==="favorites")return favs.includes(coin.symbol)
      return true
    }).sort((a,b)=>{
      if(tab==="gainers")return b.change-a.change
      if(tab==="losers")return a.change-b.change
      return 0
    })

    const tr2=t||(k=>k)
    const tabs=[
      {id:"trending",label:"🔥 "+tr2("trending")},
      {id:"gainers",label:"▲ "+tr2("gainers")},
      {id:"losers",label:"▼ "+tr2("losers")},
      {id:"favorites",label:"★ "+tr2("favs")},
    ]

    return(
      <div style={{width:"100%"}}>
        {/* Search bar */}
        <div style={{position:"relative",marginBottom:12}}>
          <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"rgba(80,130,255,0.35)",pointerEvents:"none"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={tr2("searchSymbol")}
            style={{width:"100%",background:"rgba(8,16,42,0.8)",border:"1.5px solid rgba(70,120,220,0.18)",borderRadius:13,
              padding:"13px 14px 13px 40px",fontFamily:"DM Mono,monospace",fontSize:13,color:"#fff",outline:"none",
              boxSizing:"border-box",minHeight:48}}
            onFocus={e=>e.target.style.borderColor="rgba(90,150,255,0.45)"}
            onBlur={e=>e.target.style.borderColor="rgba(70,120,220,0.18)"}/>
        </div>

        {/* Category tabs */}
        <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:2}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flexShrink:0,padding:"9px 16px",borderRadius:22,border:"1.5px solid",cursor:"pointer",
              fontFamily:"DM Mono,monospace",fontSize:11,fontWeight:700,whiteSpace:"nowrap",minHeight:40,
              transition:"all .2s",
              background:tab===t.id?"rgba(38,166,154,0.15)":"rgba(6,14,36,0.7)",
              borderColor:tab===t.id?"rgba(38,166,154,0.45)":"rgba(70,120,220,0.14)",
              color:tab===t.id?"#26a69a":"rgba(120,170,255,0.4)",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Asset list */}
        <div className="glass-strong" style={{overflow:"hidden"}}>
          {/* Header */}
          <div style={{display:"grid",gridTemplateColumns:"32px 1fr auto 80px",alignItems:"center",padding:"9px 16px",borderBottom:"1px solid rgba(50,90,180,0.08)"}}>
            <div/>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(80,130,255,0.35)"}}>Symbol</span>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(80,130,255,0.35)",textAlign:"right",paddingRight:16}}>Price</span>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(80,130,255,0.35)",textAlign:"center"}}>24h</span>
          </div>

          {loading?(
            <div style={{padding:48,textAlign:"center",fontFamily:"DM Mono,monospace",fontSize:12,color:"rgba(80,130,255,0.35)"}}>
              <span className="pulse" style={{marginRight:8}}/>loading...
            </div>
          ):filtered.length===0?(
            <div style={{padding:48,textAlign:"center",fontFamily:"DM Mono,monospace",fontSize:12,color:"rgba(80,130,255,0.3)"}}>
        {tab==="favorites"&&favs.length===0?tr2("noFavs"):tr2("noOffersFound")}
            </div>
          ):filtered.map((item,i)=>{
            const up=item.change>=0
            const col=up?"#26a69a":"#ef5350"
            const isFav=favs.includes(item.symbol)
            return(
              <div key={i} style={{
                display:"grid",gridTemplateColumns:"32px 1fr auto 80px",
                alignItems:"center",padding:"14px 16px",
                borderBottom:"1px solid rgba(50,90,180,0.05)",
                background:"transparent",transition:"background .15s",minHeight:64,
              }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(80,130,255,0.04)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {/* Fav */}
                <button onClick={()=>toggleFav(item.symbol)} style={{
                  background:"none",border:"none",cursor:"pointer",padding:0,
                  fontSize:16,color:isFav?"#f0b90b":"rgba(80,130,255,0.18)",
                  transition:"color .2s",width:32,height:44,display:"flex",alignItems:"center",justifyContent:"center",
                }}>★</button>
                {/* Symbol */}
                <div style={{minWidth:0}}>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:13,fontWeight:700,color:"#c8e0ff"}}>
                    {item.symbol}<span style={{color:"rgba(100,150,255,0.3)",fontWeight:400,fontSize:11}}>/USDT</span>
                  </div>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(80,130,255,0.38)",marginTop:2}}>
                    Vol ${(item.volume/1_000_000).toFixed(1)}M
                  </div>
                </div>
                {/* Price */}
                <div style={{fontFamily:"DM Mono,monospace",fontSize:13,fontWeight:600,color:"#e8f4ff",textAlign:"right",paddingRight:12}}>
                  ${item.price<1?item.price.toFixed(5):item.price.toLocaleString(undefined,{maximumFractionDigits:2})}
                </div>
                {/* Change badge */}
                <div style={{
                  padding:"7px 6px",borderRadius:9,textAlign:"center",minHeight:36,display:"flex",alignItems:"center",justifyContent:"center",
                  background:up?"rgba(38,166,154,0.12)":"rgba(239,83,80,0.1)",
                  border:`1px solid ${col}25`,
                }}>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:12,fontWeight:700,color:col}}>
                    {up?"+":""}{item.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

    // ─── Market Sentiment ─────────────────────────────────────────────────────────
  function SentimentTicker(){
    const [coins,setCoins]=useState([])
    useEffect(()=>{
      const load=async()=>{
        try{
          const res=await fetch("https://flowanalytics-production.up.railway.app/market/trending")
          const json=await res.json()
          const parsed=(json.data||[]).slice(0,20).map(c=>({
            symbol:(c.symbol||"").replace(/USDT$/,""),
            chg:parseFloat(c.change??0),
          })).filter(c=>c.symbol)
          setCoins(parsed)
        }catch(e){}
      }
      load();const iv=setInterval(load,60000);return()=>clearInterval(iv)
    },[])
    if(!coins.length)return null
    const items=[...coins,...coins]
    return(
      <div style={{overflow:"hidden",background:"rgba(4,10,26,0.6)",border:"1px solid rgba(70,120,220,0.12)",borderRadius:10,padding:"7px 0",marginBottom:10,position:"relative",userSelect:"none"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:28,background:"linear-gradient(90deg,rgba(4,10,26,0.9),transparent)",zIndex:1,pointerEvents:"none"}}/>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:28,background:"linear-gradient(270deg,rgba(4,10,26,0.9),transparent)",zIndex:1,pointerEvents:"none"}}/>
        <div style={{display:"inline-flex",animation:"ticker 38s linear infinite",whiteSpace:"nowrap"}}>
          {items.map((c,i)=>{
            const up=c.chg>=0
            const col=up?"#26a69a":"#ef5350"
            return(
              <span key={i} style={{fontFamily:"DM Mono,monospace",fontSize:11,padding:"0 10px",display:"inline-flex",alignItems:"center",gap:5,flexShrink:0}}>
                <span style={{color:"rgba(180,210,255,0.5)",fontWeight:600}}>{c.symbol}</span>
                <span style={{color:col,fontWeight:700}}>{up?"+":""}{c.chg.toFixed(1)}%</span>
                <span style={{color:"rgba(70,120,220,0.18)",fontSize:8,margin:"0 2px"}}>•</span>
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Calculator (used as standalone tab) ───────────────────────────────────
  function CalcTab({t}){
    const tr=t||(k=>k)
    const [fiat,setFiat]=useState("PLN")
    const [crypto,setCrypto]=useState("USDT")
    const [side,setSide]=useState("BUY")
    const [amount,setAmount]=useState("")
    const [offers,setOffers]=useState([])
    const [loading,setLoading]=useState(false)
    const API="https://flowanalytics-production.up.railway.app"
    useEffect(()=>{
      setLoading(true)
      fetch(`${API}/p2p?fiat=${fiat}&crypto=${crypto}&side=${side}&exchange=bybit&sort=price`)
        .then(r=>r.json()).then(d=>{ setOffers(d.offers||[]); setLoading(false) }).catch(()=>setLoading(false))
    },[fiat,crypto,side])
    const num=parseFloat(amount)||0
    const valid=num>0?offers.filter(o=>num>=o.min_amount&&num<=o.max_amount):offers
    const best=valid.length?valid.reduce((a,b)=>{
      const ea=side==="BUY"?a.price*(1+(a.commission||0)/100):a.price*(1-(a.commission||0)/100)
      const eb=side==="BUY"?b.price*(1+(b.commission||0)/100):b.price*(1-(b.commission||0)/100)
      return side==="BUY"?(ea<eb?a:b):(ea>eb?a:b)
    }):null
    const effP=best?(side==="BUY"?best.price*(1+(best.commission||0)/100):best.price*(1-(best.commission||0)/100)):null
    const result=effP&&num?(side==="BUY"?num/effP:num*effP):null
    const outOfRange=num>0&&valid.length===0
    const fromCur=side==="BUY"?fiat:crypto
    const toCur=side==="BUY"?crypto:fiat
    return(
      <div style={{padding:"4px 0"}}>
        {/* BUY / SELL */}
        <div style={{display:"flex",gap:4,background:"rgba(4,10,26,0.88)",border:"1.5px solid rgba(70,120,220,0.18)",borderRadius:13,overflow:"hidden",padding:4,marginBottom:14}}>
          {[["BUY","rgba(38,166,154,0.18)","#3effc0"],["SELL","rgba(239,83,80,0.16)","#ff7878"]].map(([s,bg,col])=>(
            <button key={s} onClick={()=>setSide(s)} style={{
              flex:1,padding:"11px",border:"none",cursor:"pointer",borderRadius:10,
              fontFamily:"DM Mono,monospace",fontSize:13,fontWeight:800,
              background:side===s?bg:"transparent",color:side===s?col:"rgba(120,170,255,0.35)",
              transition:"all .2s",minHeight:42,
            }}>{s==="BUY"?tr("buy"):tr("sell")}</button>
          ))}
        </div>
        {/* Currency selectors */}
        <div className="glass-strong" style={{padding:"14px",marginBottom:10,display:"flex",gap:10,alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:8,letterSpacing:"0.15em",color:"rgba(80,130,255,0.4)",marginBottom:5,textTransform:"uppercase"}}>{tr("fiatCurrency")}</div>
            <FilterSel value={fiat} onChange={e=>setFiat(e.target.value)}>
              {FIATS.map(f=><option key={f}>{f}</option>)}
            </FilterSel>
          </div>
          <span style={{color:"rgba(100,150,255,0.3)",fontSize:18,marginTop:14,flexShrink:0}}>⇄</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:8,letterSpacing:"0.15em",color:"rgba(80,130,255,0.4)",marginBottom:5,textTransform:"uppercase"}}>{tr("crypto")}</div>
            <FilterSel value={crypto} onChange={e=>setCrypto(e.target.value)}>
              {CRYPTOS.map(c=><option key={c}>{c}</option>)}
            </FilterSel>
          </div>
        </div>
        {/* Amount input */}
        <div className="glass-strong" style={{padding:"14px",marginBottom:10}}>
          <div style={{fontFamily:"DM Mono,monospace",fontSize:8,letterSpacing:"0.15em",color:"rgba(80,130,255,0.4)",marginBottom:8,textTransform:"uppercase"}}>{tr("quickCalc")}</div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:120,display:"flex"}}>
              <input type="number" min="0" value={amount}
                onChange={e=>{ const v=e.target.value; if(v===""||parseFloat(v)>=0) setAmount(v) }}
                placeholder="0.00"
                style={{flex:1,background:"rgba(4,10,28,0.8)",border:"1px solid rgba(80,130,255,0.18)",borderRight:"none",borderRadius:"10px 0 0 10px",padding:"11px 8px",fontFamily:"DM Mono,monospace",fontSize:16,color:"#fff",outline:"none",minWidth:0}}
                onFocus={e=>e.target.style.borderColor="rgba(80,130,255,0.45)"}
                onBlur={e=>e.target.style.borderColor="rgba(80,130,255,0.18)"}/>
              <div style={{background:"rgba(8,20,55,0.9)",border:"1px solid rgba(80,130,255,0.18)",borderLeft:"none",borderRadius:"0 10px 10px 0",padding:"8px 12px",display:"flex",alignItems:"center",fontFamily:"DM Mono,monospace",fontSize:12,color:"rgba(150,190,255,0.7)",whiteSpace:"nowrap"}}>{fromCur}</div>
            </div>
            <span style={{color:"rgba(100,150,255,0.4)",fontSize:16,flexShrink:0}}>→</span>
            <div style={{flex:1,minWidth:120,background:"rgba(4,10,28,0.6)",border:`1px solid ${outOfRange?"rgba(239,83,80,0.3)":"rgba(80,130,255,0.1)"}`,borderRadius:10,padding:"11px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"DM Mono,monospace",fontSize:17,fontWeight:600,color:outOfRange?"#ef5350":result?"#26a69a":"rgba(80,130,255,0.2)"}}>
                {loading?"⋯":result?result.toFixed(side==="BUY"?4:2):"—"}
              </span>
              <span style={{fontFamily:"DM Mono,monospace",fontSize:12,color:"rgba(150,190,255,0.5)",whiteSpace:"nowrap"}}>{toCur}</span>
            </div>
          </div>
          {outOfRange&&num>0&&(
            <div style={{marginTop:8,fontFamily:"DM Mono,monospace",fontSize:11,color:"#ef5350"}}>
              ⚠ {tr("noOffers")||"No offers for"} {num.toLocaleString()} {fromCur}
            </div>
          )}
        </div>
        {/* Best offer detail */}
        {best&&result&&!outOfRange&&(
          <div className="glass-strong" style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(100,150,255,0.4)",flexShrink:0}}>via</span>
            {best.url
              ?<a href={best.url} target="_blank" rel="noreferrer" style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#5ba8ff",textDecoration:"none",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{best.trusted&&"⭐ "}{stripEmoji(best.advertiser)} ↗</a>
              :<span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"#5ba8ff"}}>{stripEmoji(best.advertiser)}</span>
            }
            <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(100,150,255,0.4)",marginLeft:"auto",flexShrink:0}}>
              @ {best.price.toFixed(3)}{best.commission>0&&<span style={{color:"rgba(239,83,80,0.6)"}}> +{best.commission}%</span>}
            </span>
          </div>
        )}
        {/* Top offers list */}
        {!loading&&offers.slice(0,8).map((o,i)=>{
          const isBest=o===best
          return(
            <div key={i} style={{
              display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"10px 14px",marginBottom:4,borderRadius:10,
              background:isBest?"rgba(38,166,154,0.07)":"rgba(8,16,42,0.5)",
              border:`1px solid ${isBest?"rgba(38,166,154,0.3)":"rgba(70,120,220,0.12)"}`,
              animation:`fadeUp .25s forwards ${i*30}ms`,opacity:0,
            }}>
              <div>
                <span style={{fontFamily:"DM Mono,monospace",fontSize:16,fontWeight:700,color:isBest?"#26a69a":"#e8f4ff"}}>{o.price.toFixed(3)}</span>
                <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(120,170,255,0.4)",marginLeft:5}}>{fiat}</span>
              </div>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(120,170,255,0.45)",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"right"}}>
                {stripEmoji(o.advertiser)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ─── Mobile Offer Card ────────────────────────────────────────────────────────
  function OfferCard({o,i,isBest,changed,fiat,t}){
    const exConf=EXCHANGES_CONFIG.find(e=>e.label===o.exchange)
    return(
      <div style={{
        margin:"0 0 8px",padding:"12px 14px",borderRadius:12,
        background:isBest?"rgba(8,28,55,0.85)":"rgba(8,18,50,0.75)",
        border:`1.5px solid ${isBest?"rgba(38,166,154,0.45)":"rgba(70,120,220,0.18)"}`,
        opacity:0,
        animation:`fadeUp .3s forwards ${i*40}ms`,
      }}>
        {/* top row: price + advertiser */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontFamily:"DM Mono,monospace",fontSize:20,fontWeight:700,color:isBest?"#26a69a":"#e8f4ff",lineHeight:1}}>
              {o.price.toFixed(3)}
              <span style={{fontSize:12,color:"rgba(120,170,255,0.45)",fontWeight:400,marginLeft:5}}>{fiat}</span>
            </div>
            {isBest&&<div style={{marginTop:5,display:"inline-block",fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",background:"rgba(38,166,154,0.15)",color:"#26a69a",padding:"2px 8px",borderRadius:20,fontFamily:"DM Mono,monospace"}}>best price</div>}
          </div>
          <div style={{textAlign:"right"}}>
            {o.url
              ?<a href={o.url} target="_blank" rel="noreferrer" style={{fontSize:14,fontWeight:700,color:"rgba(180,210,255,0.8)",textDecoration:"none",display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end"}}>
                  {o.trusted&&<span>⭐</span>}{stripEmoji(o.advertiser)}<span style={{fontSize:10,opacity:.5}}>↗</span>
                </a>
              :<div style={{fontSize:14,fontWeight:700,color:"rgba(180,210,255,0.8)",display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end"}}>
                  {o.trusted&&<span>⭐</span>}{stripEmoji(o.advertiser)}
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
    const [mode,setMode]=useState("p2p")  // "p2p" | "calc" | "market"
    const [lang,setLang]=useState("en")
    const t=k=>TR[lang][k]||TR.en[k]||k
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
    const [isMobile,setIsMobile]=useState(window.innerWidth<640)
    const prevPricesRef=useRef({})
    const [changedRows,setChangedRows]=useState({})
    const TTL=25

    // Detect portrait + mobile — stable, won't flicker on keyboard open
    useEffect(()=>{
      const check=()=>{
        setIsPortrait(window.innerHeight>window.innerWidth&&window.innerWidth<640)
        setIsMobile(window.innerWidth<640)
      }
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

    const sortOptions = SORT_OPTIONS_BASE.map(o=>({id:o.id, label:lang==="ru"?o.ru:o.en}))
    const rateFilters = RATE_FILTERS_BASE.map(o=>({id:o.id, label:lang==="ru"?o.ru:o.label}))

    return(
      <>
        {intro&&<IntroScreen onDone={()=>setIntro(false)}/>}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
                  html, body {
              max-width: 100vw;
              overflow-x: hidden;
            }

            canvas {
              max-width: 100% !important;
              display: block;
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
          .mode-switcher{display:flex;width:100%;max-width:210px;margin-bottom:15px;background:rgba(6,14,36,0.7);border:2px solid rgba(70,120,220,0.15);border-radius:13px;padding:4px;margin-bottom:15px;}
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
          @keyframes fadeUp{from{opacity:0}to{opacity:1;}}
          @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
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
          .desktop-only-flex{display:flex;}
          .desktop-only-block{display:block;}
          .mobile-only-block{display:none;}
          .mobile-only-flex{display:none;}
          @media(max-width:640px){
            .wrapper{padding:16px 12px 80px;}
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
            .desktop-only-flex{display:none !important;}
            .desktop-only-block{display:none !important;}
            .mobile-only-block{display:block !important;}
            .mobile-only-flex{display:flex !important;}
          }
          @media(min-width:641px){
            .mobile-cards{display:none !important;}
            .mobile-only-block{display:none !important;}
            .mobile-only-flex{display:none !important;}
          }
          @media(max-width:400px){
            .title{font-size:22px;}
          }
        `}</style>

        <ParticleField/>
        <div className="bg-orb orb1"/><div className="bg-orb orb2"/><div className="bg-orb orb3"/>

        <div className="wrapper">
          {/* ── Header ── */}
          <div className="header" style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div className="logo">⬡ Metaflow</div>
              {/* Lang toggle */}
              <button onClick={()=>setLang(l=>l==="en"?"ru":"en")} style={{
                display:"flex",alignItems:"center",gap:0,borderRadius:20,overflow:"hidden",border:"1.5px solid rgba(70,120,220,0.2)",
                background:"rgba(6,14,36,0.8)",cursor:"pointer",fontSize:10,fontFamily:"DM Mono,monospace",fontWeight:700,
              }}>
                <span style={{padding:"4px 10px",background:lang==="en"?"rgba(80,130,255,0.2)":"transparent",color:lang==="en"?"#a8ccff":"rgba(80,130,255,0.3)",transition:"all .2s"}}>EN</span>
                <span style={{padding:"4px 10px",background:lang==="ru"?"rgba(80,130,255,0.2)":"transparent",color:lang==="ru"?"#a8ccff":"rgba(80,130,255,0.3)",transition:"all .2s"}}>РУС</span>
              </button>
            </div>
            <h1 className="title">Meta<span>flow</span><br/>Analytics</h1>
            <p className="subtitle">// real-time · {mode==="p2p"?`${exchange} p2p`:"market overview"}</p>
          </div>

          {/* Desktop mode switcher — hidden on mobile (replaced by bottom nav) */}
          <div className="mode-switcher desktop-only-flex" style={{maxWidth:210}}>
            <button className={`mode-btn ${mode==="p2p"?"active":""}`} onClick={()=>setMode("p2p")}>{t("p2p")}</button>
            <button className={`mode-btn ${mode==="market"?"active":""}`} onClick={()=>setMode("market")}>{t("market")}</button>
          </div>

          {mode==="calc"?(
            <CalcTab t={t}/>
          ):mode==="market"?(
            isMobile?(
              <MobileMarketMode t={t}/>
            ):isPortrait?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:20,padding:32,textAlign:"center"}}>
                <div style={{fontSize:52,animation:"spinCW 3s linear infinite",display:"inline-block",color:"white"}}>⟳</div>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700,color:"#c8e0ff"}}>{t("rotatePhone")}</div>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:12,color:"rgba(120,170,255,0.45)",lineHeight:1.7}}>{t("rotateDesc")}</div>
              </div>
            ):<MarketMode/>
          ):(<>
            {/* Mobile: BUY/SELL at very top */}
            <div className="mobile-only-block" style={{marginBottom:10}}>
              <div style={{display:"flex",gap:0,background:"rgba(4,10,26,0.88)",border:"1.5px solid rgba(70,120,220,0.18)",borderRadius:13,overflow:"hidden",padding:4,gap:4}}>
                {[["BUY","buy-active","rgba(38,166,154,0.18)","#3effc0"],["SELL","sell-active","rgba(239,83,80,0.16)","#ff7878"]].map(([s,cls,bg,col])=>(
                  <button key={s} onClick={()=>setSide(s)} style={{
                    flex:1,padding:"12px",border:"none",cursor:"pointer",borderRadius:10,
                    fontFamily:"DM Mono,monospace",fontSize:13,fontWeight:800,letterSpacing:"0.05em",
                    background:side===s?bg:"transparent",
                    color:side===s?col:"rgba(120,170,255,0.35)",
                    transition:"all .25s",minHeight:40,
                  }}>{s==="BUY"?t("buy"):t("sell")}</button>
                ))}
              </div>
            </div>

            {/* Desktop exchange tabs */}
            <div className="exchange-tabs desktop-only-flex">
              {EXCHANGES_CONFIG.map(ex=>(
                <button key={ex.id} className={`ex-tab ${exchange===ex.id?"active":""}`} onClick={()=>setExchange(ex.id)}>
                  <span className="ex-dot" style={{background:ex.color}}/>{ex.label}
                </button>
              ))}
            </div>

            {/* Desktop controls */}
            <div className="glass-strong controls desktop-only-block">
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
                    <button key={s} className={`side-btn ${side===s?(s==="BUY"?"buy-active":"sell-active"):""}`} onClick={()=>setSide(s)}>
                      {s==="BUY"?t("buy"):t("sell")}
                    </button>
                  ))}
                </div>
                <div className="meta" style={{marginLeft:"auto"}}>
                  <button onClick={()=>setLiveMode(l=>!l)} className="live-btn" style={{background:liveMode?"rgba(38,166,154,0.12)":"rgba(60,80,150,0.12)"}}>
                    <span style={{width:6,height:6,borderRadius:"50%",flexShrink:0,background:liveMode?"#26a69a":"rgba(120,150,255,0.3)",boxShadow:liveMode?"0 0 6px #26a69a":"none",animation:liveMode?"pulse 1.6s infinite":"none"}}/>
                    <span style={{fontFamily:"DM Mono,monospace",fontSize:9,letterSpacing:"0.1em",color:liveMode?"#26a69a":"rgba(100,140,255,0.35)",fontWeight:600}}>{liveMode?t("live"):t("off")}</span>
                  </button>
                  <LiveDot lastUpdated={lastUpdated}/>
                  {liveMode&&<div className="countdown"><svg width="26" height="26" viewBox="0 0 32 32">
                    <circle className="countdown-track" cx="16" cy="16" r="14"/>
                    <circle className="countdown-fill" cx="16" cy="16" r="14" style={{strokeDashoffset:88-(countdown/TTL)*88}}/>
                  </svg></div>}
                </div>
              </div>
              <div className="ctrl-row" style={{flexWrap:"wrap"}}>
                <div className="ctrl-label">{t("sortBy")}</div>
                <div className="sort-tabs">
                  {sortOptions.map(o=>(
                    <button key={o.id} className={`sort-btn ${sort===o.id?"active":""}`} onClick={()=>setSort(o.id)}>{o.label}</button>
                  ))}
                </div>
                <div className="divider"/>
                <div className="ctrl-label">{t("completionRate")}</div>
                <div className="rate-filter">
                  {rateFilters.map(r=>(
                    <button key={r.id} className={`rf-btn ${minRate===r.id?"active":""}`} onClick={()=>setMinRate(r.id)}>{r.label}</button>
                  ))}
                </div>
              </div>
              <div className="ctrl-row">
                <div className="ctrl-label">{t("paymentMethod")}</div>
                <div className="sel-wrap" style={{flex:1}}>
                  <select value={paymentFilter} onChange={e=>setPaymentFilter(e.target.value)}>
                    <option value="">{t("allMethods")}</option>
                    {availablePayments.filter(p=>p).map(pm=>(
                      <option key={pm} value={pm}>{pm}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile filter panel */}
            <MobileFilters
              fiat={fiat} setFiat={setFiat} crypto={crypto} setCrypto={setCrypto}
              side={side} setSide={setSide} exchange={exchange} setExchange={setExchange}
              paymentFilter={paymentFilter} setPaymentFilter={setPaymentFilter}
              minRate={minRate} setMinRate={setMinRate}
              sort={sort} setSort={setSort}
              sortOptions={sortOptions} rateFilters={rateFilters}
              availablePayments={availablePayments}
              liveMode={liveMode} setLiveMode={setLiveMode}
              lastUpdated={lastUpdated} countdown={countdown} TTL={TTL}
              t={t} lang={lang}
            />

            {/* Ticker → Spread */}
            <SentimentTicker/>
            <div className="glass-strong" style={{marginBottom:13}}>
              <SpreadBanner t={t}/>
            </div>

            {/* Loading / error state */}
            {(loading&&displayOffers.length===0)||error||displayOffers.length===0?(
              <div className="glass-strong">
                {loading&&offers.length===0
                  ?<div className="loading-state"><span className="pulse"/>{t("fetchingOffers")}</div>
                  :error?<div className="error-state">⚠ {t("connectionError")}</div>
                  :<div className="loading-state">{t("noOffersFound")}</div>
                }
              </div>
            ):(
              <>
                {/* Desktop table — only rendered when not mobile */}
                {!isMobile&&<div className="glass-strong" style={{overflow:"hidden"}}>
                  <div className="table-header">
                    <span className="th">{t("price")}</span>
                    <span className="th">{t("min")}</span>
                    <span className="th">{t("max")} / {t("completionRate")}</span>
                    <span className="th">{t("fee")}</span>
                    <span className="th">Advertiser</span>
                  </div>
                  {displayOffers.map((o,i)=>{
                    const isBest=o.price===bestPrice
                    const changed=changedRows[o.advertiser]
                    const advName=stripEmoji(o.advertiser)
                    return(
                      <div key={`${advName}-${i}`}
                        className={`row ${isBest?"best":""} ${changed==="up"?"price-up":changed==="down"?"price-down":""}`}
                        style={{animationDelay:`${i*24}ms`}}>
                        <div className="price-cell" style={isBest?{color:"#26a69a"}:{}}>
                          <CopyPrice price={o.price} fiat={fiat}/>
                          {isBest&&<span className="best-badge">{t("bestPrice")}</span>}
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
                              ?<a className="adv-name" href={o.url} target="_blank" rel="noreferrer">{o.trusted&&<span style={{fontSize:11}}>⭐</span>}{advName}<span className="link-icon">↗</span></a>
                              :<span className="adv-name">{o.trusted&&<span style={{fontSize:11}}>⭐</span>}{advName}</span>
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
                </div>}

                {/* Mobile cards — only rendered on mobile */}
                {isMobile&&<div>
                  {displayOffers.map((o,i)=>(
                    <OfferCard key={`${stripEmoji(o.advertiser)}-${i}`} o={o} i={i}
                      isBest={o.price===bestPrice} changed={changedRows[o.advertiser]} fiat={fiat} t={t}/>
                  ))}
                </div>}
              </>
            )}
          </>)}
        </div>

        {/* Bottom navigation — mobile only */}
        <nav className="mobile-only-flex" style={{
          position:"fixed",bottom:0,left:0,right:0,zIndex:200,
          background:"rgba(4,10,28,0.97)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
          borderTop:"1px solid rgba(70,120,220,0.2)",
          alignItems:"stretch",height:56,
          paddingBottom:"env(safe-area-inset-bottom,0px)",
        }}>
          {[
            {id:"p2p", label:t("p2p"), svg:<svg width="19" height="19" viewBox="0 0 20 20" fill="none"><path d="M3 7h14M7 3l-4 4 4 4M13 17l4-4-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>},
            {id:"calc", label:t("quickCalc")||"Calc", svg:<svg width="19" height="19" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><line x1="7" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="7" y1="11" x2="9" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="11" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="7" y1="14" x2="9" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="11" y1="14" x2="13" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>},
            {id:"market", label:t("market"), svg:<svg width="19" height="19" viewBox="0 0 20 20" fill="none"><polyline points="2,14 7,9 11,12 18,5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>},
          ].map(tab=>(
            <button key={tab.id} onClick={()=>setMode(tab.id)} style={{
              flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              gap:3,border:"none",cursor:"pointer",background:"transparent",padding:0,
              color:mode===tab.id?"#26a69a":"rgba(100,150,255,0.28)",
              fontFamily:"DM Mono,monospace",fontWeight:700,transition:"color .2s",
              borderTop:mode===tab.id?"2px solid #26a69a":"2px solid transparent",
              minHeight:56,
            }}>
              <span style={{display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>{tab.svg}</span>
              <span style={{fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",marginTop:1}}>{tab.label}</span>
            </button>
          ))}
        </nav>
      </>
    )
  }
