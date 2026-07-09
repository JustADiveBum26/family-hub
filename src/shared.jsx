// ── Shared UI components (login, home screens, widgets) ───────────────────────
import { useState, useEffect } from "react";
import { store } from "./store";
import { DAYS, DSHORT, MEAL_TYPES, GOLD, BORDER, THEMES, USERS, fmt, todayName, billPaid, weekKeyOf, dateOfWeekDay, S } from "./constants";
import { MonthCalendar, UpcomingEvents, EventRow, CountdownStrip, eventsOnDay, todayKey, fmtDayLong } from "./calendar";

function Ring({pct:p=0,size=80,stroke=8,color=GOLD,label,sub}){const r=(size-stroke)/2,circ=2*Math.PI*r,filled=circ*Math.min(p/100,1);return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{position:"relative",width:size,height:size}}><svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a0f" strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${filled} ${circ}`} style={{transition:"stroke-dasharray 0.6s"}}/></svg>{label&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:"bold",color}}>{label}</div>}</div>{sub&&<div style={{fontSize:10,color:"#888",textAlign:"center",maxWidth:80}}>{sub}</div>}</div>);}
function Bar({value,max,color=GOLD,height=6}){return <div style={{background:"#1a1a0f",borderRadius:4,height,overflow:"hidden"}}><div style={{width:`${Math.min(value/Math.max(max,1)*100,100)}%`,height:"100%",background:color,borderRadius:4,transition:"width 0.5s"}}/></div>;}

function PinPad({onSubmit,color="#ff6b35",error}){
  const [pin,setPin]=useState("");
  const add=d=>{if(pin.length<4){const np=pin+d;setPin(np);if(np.length===4)setTimeout(()=>onSubmit(np),150);}};
  return(<div style={{textAlign:"center"}}><div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:20}}>{[0,1,2,3].map(i=><div key={i} style={{width:18,height:18,borderRadius:"50%",background:pin.length>i?color:"transparent",border:`2px solid ${color}`,transition:"background 0.15s"}}/>)}</div>{error&&<div style={{color:"#f44336",fontSize:12,marginBottom:10}}>{error}</div>}<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:220,margin:"0 auto"}}>{[1,2,3,4,5,6,7,8,9,"",0,"X"].map((n,i)=><button key={i} onClick={()=>typeof n==="number"?add(String(n)):n==="X"?setPin(p=>p.slice(0,-1)):null} style={{padding:"15px",fontSize:22,fontFamily:"Georgia,serif",fontWeight:"bold",background:n===""?"transparent":`${color}22`,border:`2px solid ${n===""?"transparent":color}`,borderRadius:12,color:n===""?"transparent":"#fff",cursor:n===""?"default":"pointer"}}>{n}</button>)}</div></div>);
}

// ── FULL-SCREEN SHOPPING LIST VIEW ───────────────────────────────────────────
function ShoppingListView({shopList,setShopList,shopSettings,onClose}){
  const [sortMode,setSortMode]=useState("store"); // "store" or "category"
  const saveShop=u=>{setShopList(u);store.save("fp2:shopList",u);};
  const toggle=id=>saveShop(shopList.map(i=>i.id===id?{...i,checked:!i.checked}:i));
  const clearDone=()=>saveShop(shopList.filter(i=>!i.checked));
  const cats=shopSettings?.categories||["Grocery","Dairy","Produce","Meat","Snacks","Beverages","Household","Personal Care","Other"];
  const stores=shopSettings?.stores||["Walmart","Kroger","Target","Costco","Aldi","Other"];
  const unchecked=shopList.filter(i=>!i.checked);
  const checked=shopList.filter(i=>i.checked);
  const doneCount=checked.length;

  // Group unchecked by store then category, or by category then store
  const grouped=sortMode==="store"
    ?[...new Set(unchecked.map(i=>i.store||"No Store"))].sort().reduce((acc,s)=>{
        const storeItems=unchecked.filter(i=>(i.store||"No Store")===s);
        const byCat=cats.reduce((a,c)=>{const ci=storeItems.filter(i=>i.category===c);if(ci.length)a[c]=ci;return a;},{});
        const uncatted=storeItems.filter(i=>!cats.includes(i.category));
        if(uncatted.length)byCat["Other"]=uncatted;
        if(Object.keys(byCat).length)acc[s]=byCat;
        return acc;
      },{})
    :cats.reduce((acc,c)=>{const ci=unchecked.filter(i=>i.category===c);if(ci.length)acc[c]=ci;return acc;},{});

  return(<div style={{position:"fixed",inset:0,background:"#0d0d08",zIndex:4000,display:"flex",flexDirection:"column",overflowY:"auto"}}>
    {/* Header */}
    <div style={{background:"#141410",borderBottom:"1px solid #2a2a18",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:1}}>
      <div style={{fontSize:20,color:"#e8e0c8",fontFamily:"Georgia,serif",fontWeight:"bold"}}>🛒 Shopping List</div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        {doneCount>0&&<button onClick={clearDone} style={{background:"transparent",border:"1px solid #f4433644",borderRadius:8,padding:"8px 14px",color:"#f44336",fontFamily:"Georgia,serif",fontSize:14,cursor:"pointer"}}>Clear Done ({doneCount})</button>}
        <button onClick={onClose} style={{background:"transparent",border:"1px solid #2a2a18",borderRadius:8,padding:"8px 14px",color:"#888",fontFamily:"Georgia,serif",fontSize:14,cursor:"pointer"}}>✕ Close</button>
      </div>
    </div>

    {/* Sort toggle */}
    <div style={{padding:"12px 18px 6px",display:"flex",gap:8,alignItems:"center"}}>
      <span style={{fontSize:13,color:"#555",fontFamily:"monospace"}}>VIEW BY</span>
      <div style={{display:"flex",gap:4,background:"#1a1a0f",borderRadius:10,padding:3}}>
        <button onClick={()=>setSortMode("store")} style={{padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:14,background:sortMode==="store"?GOLD:"transparent",color:sortMode==="store"?"#0d0d08":"#666"}}>Store</button>
        <button onClick={()=>setSortMode("category")} style={{padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:14,background:sortMode==="category"?GOLD:"transparent",color:sortMode==="category"?"#0d0d08":"#666"}}>Category</button>
      </div>
      <span style={{fontSize:13,color:"#555",marginLeft:"auto"}}>{unchecked.length} item{unchecked.length!==1?"s":""} left</span>
    </div>

    {/* List */}
    <div style={{flex:1,padding:"6px 18px 32px"}}>
      {unchecked.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"#444",fontSize:18,fontFamily:"Georgia,serif"}}>All done! 🎉</div>}
      {sortMode==="store"
        ?Object.entries(grouped).map(([storeName,catGroups])=><div key={storeName} style={{marginBottom:24}}>
            <div style={{fontSize:16,color:"#2196F3",fontWeight:"bold",fontFamily:"monospace",letterSpacing:"0.08em",padding:"10px 0 6px",borderBottom:"2px solid #2196F322",marginBottom:8}}>🏪 {storeName}</div>
            {Object.entries(catGroups).map(([cat,items])=><div key={cat} style={{marginBottom:10}}>
              <div style={{fontSize:12,color:"#555",fontFamily:"monospace",letterSpacing:"0.15em",marginBottom:4,paddingLeft:2}}>{cat}</div>
              {items.map(item=><div key={item.id} onClick={()=>toggle(item.id)} style={{display:"flex",gap:14,padding:"14px 12px",marginBottom:4,borderRadius:10,background:"#141410",border:"1px solid #1a1a0f",alignItems:"center",cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
                <div style={{width:28,height:28,borderRadius:6,border:"2px solid #333",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:17,color:"#e8e0c8"}}>{item.qty&&item.qty!=="1"?item.qty+"× ":""}{item.name}</div>
                  {item.addedBy&&item.addedBy!=="Parents"&&<div style={{fontSize:12,color:"#555",marginTop:2}}>{item.addedBy}</div>}
                </div>
              </div>)}
            </div>)}
          </div>)
        :Object.entries(grouped).map(([cat,items])=><div key={cat} style={{marginBottom:20}}>
            <div style={{fontSize:16,color:GOLD,fontWeight:"bold",fontFamily:"monospace",letterSpacing:"0.08em",padding:"10px 0 6px",borderBottom:`2px solid ${GOLD}22`,marginBottom:8}}>{cat}</div>
            {items.map(item=><div key={item.id} onClick={()=>toggle(item.id)} style={{display:"flex",gap:14,padding:"14px 12px",marginBottom:4,borderRadius:10,background:"#141410",border:"1px solid #1a1a0f",alignItems:"center",cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
              <div style={{width:28,height:28,borderRadius:6,border:"2px solid #333",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:17,color:"#e8e0c8"}}>{item.qty&&item.qty!=="1"?item.qty+"× ":""}{item.name}</div>
                <div style={{fontSize:12,color:"#555",marginTop:2}}>{item.store||""}{item.addedBy&&item.addedBy!=="Parents"?" · "+item.addedBy:""}</div>
              </div>
            </div>)}
          </div>)
      }

      {/* Done section */}
      {checked.length>0&&<div style={{marginTop:24,opacity:0.5}}>
        <div style={{fontSize:13,color:"#555",fontFamily:"monospace",letterSpacing:"0.15em",marginBottom:8,borderTop:"1px solid #1a1a0f",paddingTop:16}}>DONE ({doneCount})</div>
        {checked.map(item=><div key={item.id} onClick={()=>toggle(item.id)} style={{display:"flex",gap:14,padding:"12px 12px",marginBottom:4,borderRadius:10,background:"#0d0d08",border:"1px solid #111",alignItems:"center",cursor:"pointer"}}>
          <div style={{width:28,height:28,borderRadius:6,background:"#4CAF50",border:"2px solid #4CAF50",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#0d0d08",fontSize:16,fontWeight:"bold"}}>✓</div>
          <div style={{fontSize:16,color:"#444",textDecoration:"line-through",flex:1}}>{item.name}</div>
        </div>)}
      </div>}
    </div>
  </div>);
}

function LoginModal({user,auth,onSuccess,onClose}){
  const [pwd,setPwd]=useState(""),[confirm,setConfirm]=useState(""),[error,setError]=useState(""),[pinErr,setPinErr]=useState("");
  const u=USERS.find(x=>x.key===user);
  const isPin=u.type==="pin",isFirst=!auth[user],pinNotSet=isPin&&!auth[user];
  const submitPwd=()=>{if(isFirst){if(pwd.length<4){setError("At least 4 characters.");return;}if(pwd!==confirm){setError("Passwords don't match.");return;}onSuccess(pwd);}else{if(pwd!==auth[user]){setError("Wrong password. Try again.");setPwd("");return;}onSuccess(null);}};
  const submitPin=pin=>{if(pin!==auth[user]){setPinErr("Wrong code! Try again.");return;}onSuccess(null);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}><div style={{background:"#141410",border:`2px solid ${u.color}44`,borderRadius:16,padding:32,maxWidth:380,width:"100%"}} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:44,marginBottom:6}}>{u.emoji}</div><div style={{fontSize:22,color:"#e8e0c8",marginBottom:4}}>{isFirst&&!isPin?`Welcome, ${u.label}!`:`Hey ${u.label}!`}</div><div style={{fontSize:13,color:"#666"}}>{isFirst&&!isPin?"Create your password to get started":isPin?pinNotSet?"Your PIN has not been set — ask Brad!":"Enter your 4-digit code":"Enter your password"}</div></div>{isPin&&!pinNotSet&&<PinPad onSubmit={submitPin} color={u.color} error={pinErr}/>}{isPin&&pinNotSet&&<div style={{textAlign:"center",padding:"20px 0",color:"#666",fontSize:14}}>Ask Brad to set your code!</div>}{!isPin&&<div><div style={{marginBottom:12}}><div style={S.label}>{isFirst?"Create Password":"Password"}</div><input autoFocus style={S.input} type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&submitPwd()}/></div>{isFirst&&<div style={{marginBottom:12}}><div style={S.label}>Confirm Password</div><input style={S.input} type="password" value={confirm} onChange={e=>{setConfirm(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&submitPwd()}/></div>}{error&&<div style={{color:"#f44336",fontSize:12,marginBottom:10}}>{error}</div>}<button style={{...S.btn(u.color),width:"100%",padding:"11px",fontSize:15,marginTop:4}} onClick={submitPwd}>{isFirst?"Create Password and Sign In":"Sign In"}</button></div>}<button onClick={onClose} style={{...S.btnGhost,width:"100%",marginTop:12,textAlign:"center"}}>Cancel</button></div></div>);
}

// ── WEATHER STRIP — current conditions + rest-of-week forecast ────────────────
// Location comes from a family-wide saved home location (fp2:weatherLoc, set
// once from the "📍 Set weather location" button); browser geolocation is only
// a fallback. This matters because denied permission prompts and TV browsers
// with no geolocation used to make the widget silently disappear.
// One shared module-level cache: every header/view reuses the same fetch and it
// refreshes at most every 30 minutes.
let weatherCache={at:0,data:null,promise:null};
let weatherLoc=null;
const configureWeather=loc=>{
  if(loc&&loc.lat!=null&&loc.lon!=null){
    const changed=!weatherLoc||weatherLoc.lat!==loc.lat||weatherLoc.lon!==loc.lon;
    weatherLoc=loc;
    if(changed)weatherCache={at:0,data:null,promise:null};
  }
};
const wxIcon=code=>code===0?"☀️":code<=2?"🌤":code<=3?"☁️":code<=48?"🌫":code<=57?"🌧":code<=67?"🌧":code<=77?"❄️":code<=82?"🌦":code<=86?"🌨":"⛈";
const wxDesc=code=>code===0?"Clear":code<=2?"Partly Cloudy":code<=3?"Cloudy":code<=48?"Foggy":code<=67?"Rainy":code<=77?"Snowy":code<=82?"Showers":"Stormy";
function loadWeather(){
  if(weatherCache.data&&Date.now()-weatherCache.at<30*60*1000)return Promise.resolve(weatherCache.data);
  if(weatherCache.promise)return weatherCache.promise;
  weatherCache.promise=(async()=>{
    let lat,lon;
    if(weatherLoc){({lat,lon}=weatherLoc);}
    else{
      const pos=await new Promise((res,rej)=>{
        if(!navigator.geolocation)return rej(new Error("no geolocation"));
        navigator.geolocation.getCurrentPosition(res,rej,{timeout:8000});
      });
      lat=pos.coords.latitude;lon=pos.coords.longitude;
    }
    const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto&forecast_days=7`);
    const d=await r.json();
    const data={
      place:weatherLoc?.name||"",
      current:{temp:Math.round(d.current.temperature_2m),icon:wxIcon(d.current.weathercode),desc:wxDesc(d.current.weathercode),wind:Math.round(d.current.windspeed_10m)},
      days:(d.daily?.time||[]).map((t,i)=>({date:t,day:new Date(t+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"}),icon:wxIcon(d.daily.weathercode[i]),hi:Math.round(d.daily.temperature_2m_max[i]),lo:Math.round(d.daily.temperature_2m_min[i]),rain:d.daily.precipitation_probability_max?.[i]??null})),
    };
    weatherCache={at:Date.now(),data,promise:null};
    return data;
  })();
  weatherCache.promise.catch(()=>{weatherCache.promise=null;});
  return weatherCache.promise;
}
function WeatherStrip({big}){
  const [wx,setWx]=useState(weatherCache.data);
  const [failed,setFailed]=useState(false);
  const [showSearch,setShowSearch]=useState(false);
  const [q,setQ]=useState(""),[results,setResults]=useState(null),[searching,setSearching]=useState(false);
  useEffect(()=>{let live=true;loadWeather().then(d=>{if(live){setWx(d);setFailed(false);}}).catch(()=>{if(live)setFailed(true);});return()=>{live=false;};},[]);
  const search=async()=>{
    if(!q.trim())return;
    setSearching(true);
    try{
      const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=5&language=en&format=json`);
      const d=await r.json();
      setResults(d.results||[]);
    }catch(e){setResults([]);}
    setSearching(false);
  };
  const pick=res=>{
    const loc={name:res.name+(res.admin1?", "+res.admin1:""),lat:res.latitude,lon:res.longitude};
    store.save("fp2:weatherLoc",loc);
    configureWeather(loc);
    setShowSearch(false);setQ("");setResults(null);
    loadWeather().then(d=>{setWx(d);setFailed(false);}).catch(()=>setFailed(true));
  };
  // No data yet: show the fix-it button on failure (never disappear silently).
  if(!wx){
    if(!failed)return null;
    return(<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",padding:"6px 12px",background:"rgba(255,255,255,0.04)",borderRadius:12,border:"1px solid rgba(255,255,255,0.09)"}}>
      {!showSearch&&<button onClick={()=>setShowSearch(true)} style={{background:"transparent",border:"1px dashed rgba(255,255,255,0.25)",borderRadius:8,padding:"7px 14px",color:"#aaa",fontFamily:"Georgia,serif",fontSize:13,cursor:"pointer"}}>📍 Set weather location</button>}
      {showSearch&&<>
        <input autoFocus value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="City name..." style={{background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"7px 12px",color:"#e8e0c8",fontFamily:"Georgia,serif",fontSize:13,outline:"none",width:150}}/>
        <button onClick={search} style={{background:"#C9A84C",border:"none",borderRadius:8,padding:"7px 14px",color:"#0d0d08",fontWeight:"bold",fontFamily:"Georgia,serif",fontSize:13,cursor:"pointer"}}>{searching?"...":"Search"}</button>
        {results&&results.length===0&&<span style={{fontSize:12,color:"#888"}}>No matches</span>}
        {results&&results.map(r=><button key={r.id||r.latitude+","+r.longitude} onClick={()=>pick(r)} style={{background:"rgba(201,168,76,0.15)",border:"1px solid rgba(201,168,76,0.4)",borderRadius:8,padding:"6px 12px",color:"#C9A84C",fontFamily:"Georgia,serif",fontSize:12,cursor:"pointer"}}>{r.name}{r.admin1?", "+r.admin1:""}</button>)}
      </>}
    </div>);
  }
  const fs=big?{t:36,d:15,day:13,hilo:15,ic:34,cic:48,cell:78,gap:12,pad:"14px 20px"}:{t:17,d:10,day:9,hilo:11,ic:17,cic:24,cell:46,gap:4,pad:"6px 12px"};
  return(<div style={{display:"flex",alignItems:"center",gap:big?18:10,padding:fs.pad,background:"rgba(255,255,255,0.04)",borderRadius:big?16:12,border:"1px solid rgba(255,255,255,0.09)",overflowX:"auto",WebkitOverflowScrolling:"touch",maxWidth:"100%"}}>
    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
      <span style={{fontSize:fs.cic}}>{wx.current.icon}</span>
      <div>
        <div style={{fontSize:fs.t,fontWeight:"bold",color:"#e8e0c8",lineHeight:1.05}}>{wx.current.temp}°</div>
        <div style={{fontSize:fs.d,color:"#888",whiteSpace:"nowrap"}}>{wx.current.desc}</div>
      </div>
    </div>
    <div style={{width:1,alignSelf:"stretch",background:"rgba(255,255,255,0.1)",flexShrink:0}}/>
    <div style={{display:"flex",gap:fs.gap}}>
      {wx.days.slice(0,7).map((d,i)=>(
        <div key={d.date} style={{textAlign:"center",minWidth:fs.cell,flexShrink:0}}>
          <div style={{fontSize:fs.day,color:i===0?"#e8e0c8":"#777",fontFamily:"monospace"}}>{i===0?"TODAY":d.day.toUpperCase()}</div>
          <div style={{fontSize:fs.ic,lineHeight:1.25}}>{d.icon}</div>
          <div style={{fontSize:fs.hilo,color:"#e8e0c8",whiteSpace:"nowrap"}}>{d.hi}°<span style={{color:"#666"}}> {d.lo}°</span></div>
          {d.rain!=null&&d.rain>=20&&<div style={{fontSize:fs.day,color:"#4a9eff"}}>💧{d.rain}%</div>}
        </div>
      ))}
    </div>
  </div>);
}

function BillsBanner({bills,S}){
  const today=new Date();
  const due=bills.filter(b=>{if(billPaid(b))return false;const d=new Date(b.dueDate+"T12:00:00");const dl=Math.ceil((d-today)/(864e5));return dl>=0&&dl<=7;});
  if(due.length===0)return null;
  return(<div style={{...S.alert("#FF9800"),display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:14}}>
    <span style={{color:"#FF9800",fontWeight:"bold",fontSize:13}}>Expenses this week:</span>
    {due.map(b=>{const dl=Math.ceil((new Date(b.dueDate+"T12:00:00")-today)/(864e5));return <span key={b.id} style={{...S.tag("#FF9800")}}>{b.name} — {dl===0?"Today":dl===1?"Tomorrow":dl+"d"}</span>;})}
  </div>);
}

// ── PINNED ANNOUNCEMENTS — shown at top of all home screens ───────────────────
function PinnedAnnouncements({messages,S}){
  const pinned=(messages||[]).filter(m=>m.approved&&m.pinned);
  if(pinned.length===0)return null;
  return(<div style={{marginBottom:14}}>
    {pinned.map(m=><div key={m.id} style={{...S.alert(S.T.accent),display:"flex",gap:10,alignItems:"flex-start",marginBottom:6}}>
      <span style={{fontSize:16,flexShrink:0}}>📌</span>
      <div><div style={{fontSize:11,color:S.T.accent,fontWeight:"bold",marginBottom:2}}>{m.authorLabel} — {m.date}</div><div style={{fontSize:14,color:S.T.text}}>{m.text}</div></div>
    </div>)}
  </div>);
}

// ── WEEKLY CHORE BOARD — visible on all home screens ─────────────────────────
function WeeklyChoreBoard({chores,setChores,appSettings,S}){
  const tn=todayName();
  const todayIdx=DAYS.indexOf(tn);
  const saveChores=u=>{setChores(u);store.save("fp2:chores",u);};
  const toggleDay=(choreId,day)=>{
    saveChores(chores.map(c=>{
      if(c.id!==choreId)return c;
      const dd={...(c.donedays||{}),[day]:!(c.donedays||{})[day]};
      return{...c,donedays:dd};
    }));
  };
  const showFor=id=>{
    if(id==="brad"&&!appSettings.showAdultChores?.brad)return false;
    if(id==="maryBeth"&&!appSettings.showAdultChores?.maryBeth)return false;
    if(id==="bradyn"&&!appSettings.showAdultChores?.bradyn)return false;
    return true;
  };
  const recurring=chores.filter(c=>c.days&&c.days.length>0&&showFor(c.assignee));
  if(recurring.length===0)return null;
  return(<div style={S.card}>
    <div style={S.h2}>Weekly Task Board</div>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:480}}>
        <thead><tr>
          <th style={{textAlign:"left",padding:"4px 8px",fontSize:11,color:S.T.sub,fontFamily:"monospace",borderBottom:`1px solid ${S.T.border}`,minWidth:110}}>Who / Task</th>
          {DAYS.map((d,i)=><th key={d} style={{textAlign:"center",padding:"4px 3px",fontSize:10,color:i===todayIdx?S.T.accent:S.T.sub,fontFamily:"monospace",borderBottom:`1px solid ${S.T.border}`,background:i===todayIdx?S.T.accent+"11":"transparent",minWidth:38}}>{DSHORT[i]}</th>)}
        </tr></thead>
        <tbody>{recurring.map(c=>{
          const u=USERS.find(x=>x.key===c.assignee);
          return(<tr key={c.id}>
            <td style={{padding:"6px 8px",borderBottom:`1px solid ${S.T.border}`}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:18}}>{USERS.find(x=>x.key===c.assignee)?.emoji}</span>
                <div><div style={{fontSize:12,color:S.T.text}}>{c.task}</div><div style={{fontSize:10,color:S.T.sub}}>{u?.label}</div></div>
              </div>
            </td>
            {DAYS.map((d,i)=>{
              const sched=c.days.includes(d);
              const done=(c.donedays||{})[d];
              const isToday=i===todayIdx;
              return(<td key={d} style={{textAlign:"center",padding:"4px 2px",borderBottom:`1px solid ${S.T.border}`,background:isToday?S.T.accent+"0a":"transparent"}}>
                {sched
                  ? <div onClick={()=>toggleDay(c.id,d)} style={{width:22,height:22,borderRadius:4,margin:"0 auto",cursor:"pointer",background:done?"#4CAF50":u?.color+"22",border:`2px solid ${done?"#4CAF50":u?.color||GOLD}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,transition:"all 0.15s"}}>{done?"✓":""}</div>
                  : <div style={{width:6,height:6,borderRadius:"50%",background:S.T.border,margin:"0 auto"}}/>
                }
              </td>);
            })}
          </tr>);
        })}</tbody>
      </table>
    </div>
  </div>);
}

// ── PERSONAL HOME SCREEN (Brad / Mary Beth / Bradyn) ─────────────────────────
function PersonalHomeScreen({currentUser,mealPlan,nextWeekPlan,bills,chores,setChores,messages,appSettings,events,S}){
  const today=new Date(),tn=todayName();
  const tomorrowName=DAYS[(DAYS.indexOf(tn)+1)%7];
  const u=USERS.find(x=>x.key===currentUser);
  const dueSoon=(bills||[]).filter(b=>{if(billPaid(b))return false;const d=new Date(b.dueDate+"T12:00:00");const dl=Math.ceil((d-today)/(864e5));return dl>=0&&dl<=7;});
  const showFor=id=>{
    if(id==="brad"&&!appSettings.showAdultChores?.brad)return false;
    if(id==="maryBeth"&&!appSettings.showAdultChores?.maryBeth)return false;
    if(id==="bradyn"&&!appSettings.showAdultChores?.bradyn)return false;
    return true;
  };
  const myOneOff=showFor(currentUser)?(chores||[]).filter(c=>c.assignee===currentUser&&!c.done&&(!c.days||c.days.length===0)):[];
  // On Sunday, "tomorrow" is next week's Monday.
  const todayMeals=mealPlan[tn]||{},tomorrowMeals=(DAYS.indexOf(tn)===6?(nextWeekPlan||{})[tomorrowName]:mealPlan[tomorrowName])||{};
  return(<div style={{padding:"0 0 16px"}}>
    <PinnedAnnouncements messages={messages} S={S}/>
    <CountdownStrip events={events} S={S}/>
    <UpcomingEvents events={events} S={S} days={7} title="📅 Coming Up This Week"/>
    <WeeklyChoreBoard chores={chores||[]} setChores={setChores} appSettings={appSettings} S={S}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14}}>
      <div style={S.card}>
        <div style={S.h2}>Today and Tomorrow</div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:S.T.accent,fontFamily:"monospace",marginBottom:5}}>{tn.toUpperCase()} — TODAY</div>
          {MEAL_TYPES.map(mt=>todayMeals[mt]?<div key={mt} style={{display:"flex",gap:8,marginBottom:3}}><span style={{fontSize:10,color:S.T.sub,minWidth:56,fontFamily:"monospace"}}>{mt==="Breakfast"?"Brkfst":mt}</span><span style={{fontSize:13,color:S.T.text}}>{todayMeals[mt]}</span></div>:null)}
          {!todayMeals.Breakfast&&!todayMeals.Lunch&&!todayMeals.Dinner&&<div style={{fontSize:12,color:S.T.sub}}>Nothing planned yet</div>}
        </div>
        <div style={{borderTop:`1px solid ${S.T.border}`,paddingTop:8}}>
          <div style={{fontSize:11,color:S.T.sub,fontFamily:"monospace",marginBottom:5}}>{tomorrowName.toUpperCase()} — TOMORROW</div>
          {MEAL_TYPES.map(mt=>tomorrowMeals[mt]?<div key={mt} style={{display:"flex",gap:8,marginBottom:3}}><span style={{fontSize:10,color:S.T.sub,minWidth:56,fontFamily:"monospace"}}>{mt==="Breakfast"?"Brkfst":mt}</span><span style={{fontSize:13,color:S.T.text}}>{tomorrowMeals[mt]}</span></div>:null)}
          {!tomorrowMeals.Breakfast&&!tomorrowMeals.Lunch&&!tomorrowMeals.Dinner&&<div style={{fontSize:12,color:S.T.sub}}>Nothing planned yet</div>}
        </div>
      </div>
      {dueSoon.length>0&&<div style={S.card}>
        <div style={S.h2}>Bills Due This Week</div>
        {dueSoon.map(b=>{
          const dl=Math.ceil((new Date(b.dueDate+"T12:00:00")-today)/(864e5));
          const isShared=!b.owner||b.owner==="shared";
          const amt=isShared?b.amount/2:b.amount;
          const paid=isShared?(b.bradPaid&&b.maryBethPaid):b.owner==="brad"?b.bradPaid:b.maryBethPaid;
          return(<div key={b.id} style={{...S.row,padding:"6px 0",borderBottom:`1px solid ${S.T.border}`}}>
            <div><div style={{fontSize:13,color:S.T.text}}>{b.name}</div><div style={{fontSize:11,color:S.T.sub}}>{dl===0?"Today":dl===1?"Tomorrow":dl+" days"}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontFamily:"monospace",color:GOLD,fontWeight:"bold"}}>{fmt(amt)}</div><div style={{fontSize:10,color:paid?"#4CAF50":"#FF9800"}}>{paid?"Paid":"Pending"}</div></div>
          </div>);
        })}
      </div>}
      {myOneOff.length>0&&<div style={S.card}>
        <div style={S.h2}>My Tasks</div>
        {myOneOff.slice(0,8).map(c=><div key={c.id} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:`1px solid ${S.T.border}`,alignItems:"center"}}>
          <div style={{width:14,height:14,borderRadius:3,border:`2px solid ${S.T.border}`,flexShrink:0}}/>
          <div style={{flex:1}}><div style={{fontSize:13,color:S.T.text}}>{c.task}</div>{c.due&&<div style={{fontSize:11,color:S.T.sub}}>Due: {c.due}</div>}</div>
          {appSettings.showPoints&&<span style={{...S.tag(u.color),fontSize:10}}>{c.points||0} pts</span>}
        </div>)}
      </div>}
    </div>
  </div>);
}

function UserHeader({user,onLogout,extra,children,S}){
  const u=USERS.find(x=>x.key===user);
  return(<div style={{background:"linear-gradient(180deg,#1a1a0f,#0d0d08)",borderBottom:`1px solid ${BORDER}`,padding:"12px 16px",position:"sticky",top:0,zIndex:100}}>
    <div style={{maxWidth:1400,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24}}>{u.emoji}</span><div><div style={{fontSize:9,color:"#444",fontFamily:"monospace",letterSpacing:"0.2em"}}>FAMILY HUB</div><div style={{fontSize:15,color:"#e8e0c8"}}>{u.label}</div></div></div>
        <WeatherStrip/>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>{extra}<button onClick={onLogout} style={{...S.btnGhost,fontSize:12}}>Sign Out</button></div>
      </div>
      {children}
    </div>
  </div>);
}

function ThemePicker({currentTheme,onSelect,S}){
  return(<div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
    <span style={{fontSize:11,color:S.T.sub,fontFamily:"monospace"}}>THEME:</span>
    {Object.entries(THEMES).map(([key,t])=>(
      <button key={key} onClick={()=>onSelect(key)} style={{padding:"3px 9px",borderRadius:10,fontSize:11,fontFamily:"Georgia,serif",cursor:"pointer",background:currentTheme===key?t.accent+"33":"transparent",border:`1px solid ${currentTheme===key?t.accent:S.T.border}`,color:currentTheme===key?t.accent:S.T.sub}}>{t.name}</button>
    ))}
  </div>);
}

// ── PUBLIC HOME SCREEN ────────────────────────────────────────────────────────
function PublicHomeScreen({mealPlan,shopList,setShopList,bills,expenses,onLogin,appSettings,messages,shopSettings,events,onTv}){
  const today=new Date(),tn=todayName();
  const [showShopView,setShowShopView]=useState(false);
  const [calDay,setCalDay]=useState(todayKey());
  const calDayEvents=eventsOnDay(events,calDay);
  const tonightDinner=mealPlan[tn]?.Dinner||"";
  const unchecked=shopList.filter(i=>!i.checked);
  const dueSoon=bills.filter(b=>{if(billPaid(b))return false;const d=new Date(b.dueDate+"T12:00:00");return Math.ceil((d-today)/(864e5))>=0&&Math.ceil((d-today)/(864e5))<=7;});
  return(<div style={{...S.page,minHeight:"100vh"}}>
    <div style={{background:"linear-gradient(180deg,#1a1a0f,#0d0d08)",borderBottom:`1px solid ${BORDER}`,padding:"16px 20px"}}>
      <div style={{maxWidth:1300,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div><div style={{fontSize:9,color:"#555",letterSpacing:"0.28em",fontFamily:"monospace"}}>THE</div><h1 style={{margin:"1px 0 0",fontSize:26,fontWeight:"normal",color:"#e8e0c8"}}>Family <span style={{color:GOLD}}>Hub</span></h1><div style={{fontSize:11,color:"#444",fontFamily:"monospace"}}>Brad & Mary Beth</div></div>
          <WeatherStrip/>
          <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#444",fontFamily:"monospace",letterSpacing:"0.12em"}}>TONIGHT</div><div style={{fontSize:16,color:tonightDinner?GOLD:"#333",marginTop:2,fontStyle:tonightDinner?"normal":"italic"}}>{tonightDinner||"Nothing planned"}</div><div style={{fontSize:11,color:"#555",marginTop:3}}>{today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div></div>
        </div>
      </div>
    </div>
    <div style={{maxWidth:1300,margin:"0 auto",padding:"16px 16px"}}>
      {showShopView&&<ShoppingListView shopList={shopList} setShopList={setShopList} shopSettings={shopSettings} onClose={()=>setShowShopView(false)}/>}
      <PinnedAnnouncements messages={messages||[]} S={S}/>
      {dueSoon.length>0&&<BillsBanner bills={bills} S={S}/>}
      <CountdownStrip events={events} S={S}/>
      <div style={S.card}>
        <MonthCalendar events={events} S={S} selectedKey={calDay} onSelectDay={setCalDay}/>
        <div style={{marginTop:14,borderTop:`1px solid ${BORDER}`,paddingTop:10}}>
          <div style={{fontSize:11,color:"#888",fontFamily:"monospace",letterSpacing:"0.12em",marginBottom:4}}>{calDay===todayKey()?"TODAY — ":""}{fmtDayLong(calDay).toUpperCase()}</div>
          {calDayEvents.length===0
            ?<div style={{fontSize:13,color:"#555"}}>Nothing on the calendar. Sign in to add events.</div>
            :calDayEvents.map(ev=><EventRow key={ev.id} ev={ev} S={S}/>)}
        </div>
      </div>
      <div style={{overflowX:"auto",marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(90px,1fr))",gap:6,minWidth:560}}>
          {DAYS.map((d,di)=>{const isToday=d===tn,m=mealPlan[d]||{};return(<div key={d} style={{background:isToday?`${GOLD}18`:"#1a1a0f",border:`1px solid ${isToday?GOLD:BORDER}`,borderRadius:10,padding:"8px 6px",textAlign:"center",minHeight:80}}><div style={{fontSize:9,fontFamily:"monospace",letterSpacing:"0.1em",color:isToday?GOLD:"#555"}}>{d.slice(0,3).toUpperCase()}</div><div style={{fontSize:11,color:isToday?GOLD:"#666",marginBottom:4}}>{dateOfWeekDay(weekKeyOf(),di).toLocaleDateString("en-US",{month:"numeric",day:"numeric"})}</div>{MEAL_TYPES.map(mt=>m[mt]?<div key={mt} style={{marginBottom:2}}><div style={{fontSize:8,color:"#555"}}>{mt==="Breakfast"?"🌅":mt==="Lunch"?"☀️":"🌙"}</div><div style={{fontSize:10,color:isToday?"#e8e0c8":"#888",lineHeight:"1.2"}}>{m[mt]}</div></div>:null)}{!m.Breakfast&&!m.Lunch&&!m.Dinner&&<div style={{fontSize:10,color:"#2a2a18",marginTop:8}}>—</div>}</div>);})}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12,marginBottom:14}}>
        <div style={S.card}><div style={{...S.h2,...S.row}}><span>Shopping List</span><button onClick={()=>setShowShopView(true)} style={{...S.btnGhost,fontSize:12,padding:"4px 12px"}}>🛒 Full View</button></div>{unchecked.length===0?<div style={{color:"#444",fontSize:13,textAlign:"center",padding:"10px 0"}}>Nothing on the list!</div>:unchecked.slice(0,8).map(item=><div key={item.id} style={{display:"flex",gap:10,padding:"5px 0",borderBottom:`1px solid #1a1a0f`,alignItems:"center"}}><div style={{width:7,height:7,borderRadius:"50%",background:GOLD,flexShrink:0}}/><span style={{fontSize:13,color:"#e8e0c8",flex:1}}>{item.qty&&item.qty!=="1"?`${item.qty}x `:""}{item.name}</span>{item.addedBy&&item.addedBy!=="Parents"&&<span style={{fontSize:10,color:"#555"}}>{item.addedBy}</span>}</div>)}{unchecked.length>8&&<div style={{fontSize:11,color:"#555",marginTop:4}}>+{unchecked.length-8} more</div>}</div>
        {dueSoon.length>0&&<div style={S.card}><div style={S.h2}>Due This Week</div>{dueSoon.map(b=>{const dl=Math.ceil((new Date(b.dueDate+"T12:00:00")-today)/(864e5)),paid=b.bradPaid&&b.maryBethPaid;return(<div key={b.id} style={{...S.row,padding:"6px 0",borderBottom:`1px solid #1a1a0f`}}><div><div style={{fontSize:13,color:"#e8e0c8"}}>{b.name}</div><div style={{fontSize:11,color:"#555"}}>{dl===0?"Today":dl===1?"Tomorrow":`${dl} days`}</div></div><div style={{textAlign:"right"}}><div style={{fontFamily:"monospace",color:GOLD,fontSize:12,fontWeight:"bold"}}>{fmt(b.amount/2)} ea</div><div style={{fontSize:10,color:paid?"#4CAF50":"#FF9800"}}>{paid?"Paid":"Pending"}</div></div></div>);})}
        </div>}
      </div>
      <div style={S.card}><div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:11,color:"#555",fontFamily:"monospace",letterSpacing:"0.2em"}}>SIGN IN AS</div></div><div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>{USERS.map(u=><button key={u.key} onClick={()=>onLogin(u.key)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"14px 20px",background:`${u.color}12`,border:`2px solid ${u.color}44`,borderRadius:14,cursor:"pointer",color:"#e8e0c8",fontFamily:"Georgia,serif",minWidth:90}}><span style={{fontSize:32}}>{u.emoji}</span><span style={{fontSize:13,color:u.color,fontWeight:"bold"}}>{u.label}</span></button>)}</div>
      {onTv&&<div style={{textAlign:"center",marginTop:16}}><button onClick={onTv} style={{...S.btnGhost,fontSize:12}}>📺 TV Display Mode</button></div>}</div>
    </div>
  </div>);
}

// ── DAY PILLS (top-level — must not be inside ChoresTab) ─────────────────────
function DayPills({selected,onToggle,S}){
  return(<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>
    {DAYS.map((d,i)=><button key={d} onClick={()=>onToggle(d)} style={{padding:"3px 8px",borderRadius:8,fontSize:10,fontFamily:"Georgia,serif",cursor:"pointer",background:selected.includes(d)?S.T.accent+"33":"transparent",border:`1px solid ${selected.includes(d)?S.T.accent:S.T.border}`,color:selected.includes(d)?S.T.accent:S.T.sub}}>{DSHORT[i]}</button>)}
  </div>);
}

export {
  Ring, Bar, PinPad, ShoppingListView, LoginModal, WeatherStrip, configureWeather, BillsBanner,
  PinnedAnnouncements, WeeklyChoreBoard, PersonalHomeScreen, UserHeader,
  ThemePicker, PublicHomeScreen, DayPills,
};
