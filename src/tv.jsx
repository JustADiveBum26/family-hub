// ── TV WALL DISPLAY — kiosk view for the drop-zone flat screen ────────────────
// Reached from the "📺 TV Display Mode" button on the landing page or by
// bookmarking the app URL with #tv. Read-only, big type, refreshes itself.
import { useState, useEffect, useRef } from "react";
import { DAYS, MEAL_TYPES, GOLD, BORDER, USERS, todayName, billPaid, weekKeyOf, dateOfWeekDay, todayISO, makeS } from "./constants";
import { WeatherScroll } from "./shared";
import { MonthCalendar, EventRow, CountdownStrip, WeeklyCelebrations, EventDetailPopup, eventsOnDay, todayKey } from "./calendar";

const T={bg:"#0d0d08",card:"#141410",border:"#2a2a18",text:"#e8e0c8",sub:"#888",accent:GOLD};
// Built on makeS() (base scale) so the TV always has every key shared
// components expect — a hand-forked copy previously fell behind makeS() as it
// grew (missing grid2/grid2mob/grid3/grid4/page) and could silently break a
// shared component that started relying on one of them. A few keys still get
// TV-specific overrides for bigger, across-the-room-readable type.
const tvS={
  ...makeS("dark",1),
  T,
  card:{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:20,marginBottom:14},
  cardSm:{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:16,marginBottom:10},
  h2:{fontSize:20,color:T.accent,fontWeight:"normal",borderBottom:`1px solid ${T.border}`,paddingBottom:8,marginBottom:12,letterSpacing:"0.05em"},
  label:{fontSize:13,color:T.sub,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6,fontFamily:"monospace"},
  tag:c=>({background:c+"22",color:c,border:`1px solid ${c}44`,borderRadius:5,padding:"4px 12px",fontSize:15,fontFamily:"monospace"}),
  alert:c=>({background:c+"18",border:`1px solid ${c}44`,borderRadius:10,padding:"14px 18px",marginBottom:12}),
};

function TVDisplay({mealPlan,nextWeekPlan,events,shopList,bills,messages,chores,appSettings,onExit,onLogin,onRefresh}){
  const [now,setNow]=useState(new Date());
  // Tap/click any day on the calendar to see its full event details — hover
  // doesn't work here since most TVs have no pointer, and touchscreens have
  // no hover state at all.
  const [selDay,setSelDay]=useState(null);
  // Kiosk behavior: tick the clock, and re-pull family data every 5 minutes so
  // the wall screen stays current without anyone touching it.
  useEffect(()=>{const id=setInterval(()=>setNow(new Date()),15000);return()=>clearInterval(id);},[]);
  useEffect(()=>{if(!onRefresh)return;const id=setInterval(()=>{onRefresh();},5*60*1000);return()=>clearInterval(id);},[onRefresh]);
  // Fire TV's built-in browser forces a visible address bar and reports it
  // inconsistently through `100vh` (and doesn't support `100dvh` on older
  // units), so the page renders taller than what's actually visible and the
  // sign-in row gets clipped. Measuring window.innerHeight directly sidesteps
  // that — it always reflects the real visible area.
  const [vh,setVh]=useState(typeof window!=="undefined"?window.innerHeight:800);
  useEffect(()=>{
    const update=()=>setVh(window.innerHeight);
    update();
    window.addEventListener("resize",update);
    window.addEventListener("orientationchange",update);
    return()=>{window.removeEventListener("resize",update);window.removeEventListener("orientationchange",update);};
  },[]);
  // Goodnight mode: dim the whole display during a configured overnight
  // window (Settings > Feature Toggles) instead of leaving it full-brightness
  // glaring into a dark room all night.
  const gn=appSettings?.goodnightMode||{};
  const gnStart=gn.start??21,gnEnd=gn.end??7;
  const hour=now.getHours();
  const inNight=!!gn.enabled&&(gnStart<gnEnd?(hour>=gnStart&&hour<gnEnd):(hour>=gnStart||hour<gnEnd));
  // The screen goes fully black during the goodnight window — not just
  // dimmed — and only lights back up on a tap/click, auto-returning to
  // black after a short period of no interaction.
  const WAKE_MS=30000;
  const [awake,setAwake]=useState(false);
  const wakeTimerRef=useRef(null);
  useEffect(()=>{if(inNight)setAwake(false);},[inNight]);
  const wake=()=>{
    setAwake(true);
    clearTimeout(wakeTimerRef.current);
    wakeTimerRef.current=setTimeout(()=>setAwake(false),WAKE_MS);
  };
  useEffect(()=>()=>clearTimeout(wakeTimerRef.current),[]);
  const asleep=inNight&&!awake;
  const tn=todayName();
  const tKey=todayKey();
  const tomorrowKey=(()=>{const d=new Date(now);d.setDate(d.getDate()+1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;})();
  const todayEvents=eventsOnDay(events,tKey);
  const tomorrowEvents=eventsOnDay(events,tomorrowKey);
  const unchecked=(shopList||[]).filter(i=>!i.checked);
  const pinned=(messages||[]).filter(m=>m.approved&&m.pinned);
  const dueSoon=(bills||[]).filter(b=>{if(billPaid(b))return false;const dl=Math.ceil((new Date(b.dueDate+"T12:00:00")-now)/(864e5));return dl>=0&&dl<=7;});
  const showFor=id=>{
    if(id==="brad"&&!appSettings?.showAdultChores?.brad)return false;
    if(id==="maryBeth"&&!appSettings?.showAdultChores?.maryBeth)return false;
    if(id==="bradyn"&&!appSettings?.showAdultChores?.bradyn)return false;
    return true;
  };
  const todayChores=(chores||[]).filter(c=>showFor(c.assignee)&&c.days&&c.days.includes(tn)&&!(c.donedays||{})[todayISO()]);
  const tomorrowIsNextWeek=DAYS.indexOf(tn)===6;
  const tomorrowDayName=DAYS[(DAYS.indexOf(tn)+1)%7];
  const tonightDinner=mealPlan[tn]?.Dinner||"";
  // Right-hand panel rotates through Today/Tomorrow, Meal Plan, Shopping, and
  // Tasks so each gets a full-size view instead of being crammed into a
  // quarter of the screen — a lot easier to read from across the room.
  const panels=[
    {key:"today",label:`Today${tomorrowEvents.length>0?" / Tomorrow":""}`,body:(<>
      {todayEvents.length===0&&<div style={{fontSize:14,color:T.sub}}>Nothing scheduled today</div>}
      {todayEvents.map(ev=><EventRow key={ev.id} ev={ev} S={tvS} occKey={tKey}/>)}
      {tomorrowEvents.length>0&&<>
        <div style={{...tvS.label,marginTop:10}}>Tomorrow</div>
        {tomorrowEvents.map(ev=><EventRow key={ev.id} ev={ev} S={tvS} occKey={tomorrowKey}/>)}
      </>}
    </>)},
    {key:"meal",label:"🍽 Menu This Week",body:(<>
      {DAYS.map((d,di)=>{
        const isToday=d===tn;
        const src=(tomorrowIsNextWeek&&d===tomorrowDayName?nextWeekPlan:mealPlan)||{};
        const dinner=(src[d]||{}).Dinner;
        return(<div key={d} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid #1a1a0f`,alignItems:"baseline",background:isToday?GOLD+"11":"transparent"}}>
          <span style={{fontSize:13,color:isToday?GOLD:T.sub,fontFamily:"monospace",minWidth:60,fontWeight:isToday?"bold":"normal"}}>{d.slice(0,3).toUpperCase()} {dateOfWeekDay(weekKeyOf(),di).getDate()}</span>
          <span style={{fontSize:15,color:dinner?T.text:"#333",fontStyle:dinner?"normal":"italic"}}>{dinner||"—"}</span>
        </div>);
      })}
    </>)},
    {key:"shopping",label:`🛒 Shopping (${unchecked.length})`,body:(<>
      {unchecked.length===0&&<div style={{fontSize:14,color:T.sub}}>List is empty!</div>}
      {unchecked.map(i=><div key={i.id} style={{display:"flex",gap:10,padding:"5px 0",borderBottom:"1px solid #1a1a0f",alignItems:"center"}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:GOLD,flexShrink:0}}/>
        <span style={{fontSize:14,color:T.text}}>{i.qty&&i.qty!=="1"?i.qty+"× ":""}{i.name}</span>
      </div>)}
    </>)},
    ...(todayChores.length>0?[{key:"tasks",label:"✅ Today's Tasks",body:(<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {todayChores.map(c=>{const u=USERS.find(x=>x.key===c.assignee);return(
        <span key={c.id} style={{...tvS.tag(u?.color||GOLD),fontSize:13,padding:"6px 12px"}}>{u?.emoji} {u?.label}: {c.task}</span>
      );})}
    </div>)}]:[]),
  ];
  const [panelIdx,setPanelIdx]=useState(0);
  useEffect(()=>{
    if(panels.length<=1)return;
    const id=setInterval(()=>setPanelIdx(i=>(i+1)%panels.length),9000);
    return()=>clearInterval(id);
  },[panels.length]);
  const activePanel=panels[panelIdx%panels.length];
  return(<div onClick={asleep?wake:undefined} onTouchStart={asleep?wake:undefined} style={{background:T.bg,height:vh,fontFamily:"Georgia,serif",color:T.text,padding:"12px 18px",boxSizing:"border-box",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
    {asleep&&<div style={{position:"absolute",inset:0,background:"#000",zIndex:9999,cursor:"pointer"}}/>}
    {/* Header: identity, clock, weather — always stays at the top */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap",marginBottom:8,flexShrink:0}}>
      <div>
        <div style={{fontSize:9,color:"#555",letterSpacing:"0.28em",fontFamily:"monospace"}}>THE</div>
        <div style={{fontSize:22,color:T.text}}>Family <span style={{color:GOLD}}>Hub</span></div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:29,fontWeight:"bold",color:T.text,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{now.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</div>
        <div style={{fontSize:11,color:GOLD,marginTop:2}}>{now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
      </div>
      <div style={{zoom:0.78}}><WeatherScroll big/></div>
      <button onClick={onExit} style={{...tvS.btnGhost,position:"fixed",top:8,right:8,opacity:0.85,zIndex:10,fontSize:13,padding:"7px 14px"}}>✕ Exit</button>
    </div>
    {/* Tonight's dinner: its own full-width banner rather than a fourth header
        item — logo/clock/weather keep the header row entirely to themselves
        so it can't get squeezed into wrapping on narrower TV resolutions. */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"8px 18px",marginBottom:8,flexShrink:0,borderRadius:12,border:`1px solid ${GOLD}55`,background:GOLD+"0f"}}>
      <span style={{fontSize:11,color:T.sub,fontFamily:"monospace",letterSpacing:"0.15em"}}>🍽 TONIGHT'S DINNER</span>
      <span style={{fontSize:22,color:tonightDinner?GOLD:"#555",fontWeight:tonightDinner?"bold":"normal",fontStyle:tonightDinner?"normal":"italic"}}>{tonightDinner||"Nothing planned"}</span>
    </div>
    {pinned.length>0&&<div style={{...tvS.alert(GOLD),display:"flex",gap:12,flexWrap:"wrap",padding:"8px 14px",marginBottom:6,flexShrink:0}}>
      {pinned.map(m=><div key={m.id} style={{fontSize:13}}>📌 <strong style={{color:GOLD}}>{m.authorLabel}:</strong> {m.text}</div>)}
    </div>}
    <div style={{flexShrink:0}}><WeeklyCelebrations events={events} S={tvS}/></div>
    <div style={{flexShrink:0}}><CountdownStrip events={events} S={tvS}/></div>
    {/* Main: fills whatever height is left — never pushes the sign-in row off-screen */}
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,54fr) minmax(0,46fr)",gap:14,flex:"1 1 auto",minHeight:0}}>
      {/* Left: full month calendar */}
      <div style={{display:"flex",flexDirection:"column",minHeight:0}}>
        <div style={{...tvS.card,flex:"1 1 auto",minHeight:0,overflowY:"auto",padding:14,marginBottom:dueSoon.length>0?6:0}}>
          <MonthCalendar events={events} S={tvS} selectedKey={selDay||tKey} onSelectDay={setSelDay}/>
        </div>
        {dueSoon.length>0&&<div style={{...tvS.alert("#FF9800"),display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",padding:"7px 12px",marginBottom:0,flexShrink:0}}>
          <span style={{color:"#FF9800",fontWeight:"bold",fontSize:12}}>Bills:</span>
          {dueSoon.map(b=>{const dl=Math.ceil((new Date(b.dueDate+"T12:00:00")-now)/(864e5));return <span key={b.id} style={{...tvS.tag("#FF9800"),fontSize:11,padding:"3px 8px"}}>{b.name} — {dl===0?"Today":dl===1?"Tmrw":dl+"d"}</span>;})}
        </div>}
      </div>
      {/* Right: a single full-size panel that auto-rotates through Today/Tomorrow,
          Meal Plan, Shopping, and Tasks — one thing at a time, easy to read from
          across the room. Dots at the bottom show what's next. */}
      <div style={{...tvS.card,marginBottom:0,display:"flex",flexDirection:"column",minHeight:0,padding:18}}>
        <div style={{...tvS.h2,fontSize:17,marginBottom:8,paddingBottom:8}}>{activePanel.label}</div>
        <div style={{overflowY:"auto",minHeight:0,flex:1}}>{activePanel.body}</div>
        {panels.length>1&&<div style={{display:"flex",justifyContent:"center",gap:6,marginTop:12,flexShrink:0}}>
          {panels.map((p,i)=><div key={p.key} style={{width:i===panelIdx%panels.length?18:7,height:7,borderRadius:4,background:i===panelIdx%panels.length?GOLD:T.border,transition:"width 0.3s,background 0.3s"}}/>)}
        </div>}
      </div>
    </div>
    {/* Day detail popup: tap any day on the calendar to see everything on it.
        Read-only here — no setEvents/canEdit passed — same as every other
        unauthenticated view of this popup. */}
    <EventDetailPopup dayKey={selDay} events={events} S={tvS} onClose={()=>setSelDay(null)}/>
    {/* Footer: sign in straight from the TV, or leave TV mode — always visible, never needs scrolling */}
    <div style={{display:"flex",justifyContent:"center",gap:8,alignItems:"center",marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`,flexWrap:"wrap",flexShrink:0}}>
      <span style={{fontSize:10,color:T.sub,fontFamily:"monospace",letterSpacing:"0.15em"}}>SIGN IN:</span>
      {USERS.map(u=><button key={u.key} onClick={()=>onLogin&&onLogin(u.key)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:`${u.color}12`,border:`2px solid ${u.color}55`,borderRadius:10,cursor:"pointer",color:u.color,fontFamily:"Georgia,serif",fontSize:13,fontWeight:"bold"}}>{u.emoji} {u.label}</button>)}
      <button onClick={onExit} style={{...tvS.btnGhost,padding:"7px 14px",fontSize:12}}>↩ Exit TV Mode</button>
    </div>
  </div>);
}

export { TVDisplay };
