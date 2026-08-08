// ── TV WALL DISPLAY — kiosk view for the drop-zone flat screen ────────────────
// Reached from the "📺 TV Display Mode" button on the landing page or by
// bookmarking the app URL with #tv. Read-only, big type, refreshes itself.
import { useState, useEffect } from "react";
import { DAYS, MEAL_TYPES, GOLD, BORDER, USERS, todayName, billPaid, weekKeyOf, dateOfWeekDay } from "./constants";
import { WeatherStrip } from "./shared";
import { MonthCalendar, EventRow, CountdownStrip, WeeklyCelebrations, eventsOnDay, todayKey, fmtDayLong } from "./calendar";

const T={bg:"#0d0d08",card:"#141410",border:"#2a2a18",text:"#e8e0c8",sub:"#888",accent:GOLD};
// Big-type style object shaped like makeS output so shared components render correctly.
const tvS={
  T,
  card:{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:20,marginBottom:14},
  cardSm:{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:16,marginBottom:10},
  h2:{fontSize:20,color:T.accent,fontWeight:"normal",borderBottom:`1px solid ${T.border}`,paddingBottom:8,marginBottom:12,letterSpacing:"0.05em"},
  label:{fontSize:13,color:T.sub,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6,fontFamily:"monospace"},
  row:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  btn:(c=T.accent)=>({background:c,border:"none",borderRadius:6,padding:"10px 20px",color:"#0d0d08",fontFamily:"Georgia,serif",fontSize:15,cursor:"pointer",fontWeight:"bold"}),
  btnGhost:{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 15px",color:T.sub,fontFamily:"Georgia,serif",fontSize:14,cursor:"pointer"},
  btnDanger:{background:"transparent",border:"1px solid #f4433644",borderRadius:6,padding:"6px 11px",color:"#f44336",fontFamily:"Georgia,serif",fontSize:14,cursor:"pointer"},
  input:{},select:{},
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
  const todayChores=(chores||[]).filter(c=>showFor(c.assignee)&&c.days&&c.days.includes(tn)&&!(c.donedays||{})[tn]);
  const tomorrowIsNextWeek=DAYS.indexOf(tn)===6;
  const tomorrowDayName=DAYS[(DAYS.indexOf(tn)+1)%7];
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
  return(<div style={{background:T.bg,height:vh,fontFamily:"Georgia,serif",color:T.text,padding:"12px 18px",boxSizing:"border-box",display:"flex",flexDirection:"column",overflow:"hidden"}}>
    {/* Header: identity, clock, weather — always stays at the top */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap",marginBottom:8,flexShrink:0}}>
      <div>
        <div style={{fontSize:9,color:"#555",letterSpacing:"0.28em",fontFamily:"monospace"}}>THE</div>
        <div style={{fontSize:22,color:T.text}}>Family <span style={{color:GOLD}}>Hub</span></div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:36,fontWeight:"bold",color:T.text,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{now.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</div>
        <div style={{fontSize:14,color:GOLD,marginTop:2}}>{now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
      </div>
      <div style={{zoom:0.78}}><WeatherStrip big/></div>
      <button onClick={onExit} style={{...tvS.btnGhost,position:"fixed",top:8,right:8,opacity:0.85,zIndex:10,fontSize:13,padding:"7px 14px"}}>✕ Exit</button>
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
    {/* Day detail popup: tap any day on the calendar to see everything on it */}
    {selDay&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setSelDay(null)}>
      <div style={{...tvS.card,maxWidth:520,width:"100%",maxHeight:"80vh",overflowY:"auto",marginBottom:0}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{...tvS.h2,marginBottom:0,paddingBottom:0,border:"none",fontSize:20}}>{selDay===tKey?"Today — ":""}{fmtDayLong(selDay)}</div>
          <button onClick={()=>setSelDay(null)} style={{...tvS.btnGhost,padding:"7px 14px",fontSize:13}}>✕ Close</button>
        </div>
        {eventsOnDay(events,selDay).length===0&&<div style={{fontSize:15,color:T.sub}}>Nothing scheduled.</div>}
        {eventsOnDay(events,selDay).map(ev=><EventRow key={ev.id} ev={ev} S={tvS} occKey={selDay}/>)}
      </div>
    </div>}
    {/* Footer: sign in straight from the TV, or leave TV mode — always visible, never needs scrolling */}
    <div style={{display:"flex",justifyContent:"center",gap:8,alignItems:"center",marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`,flexWrap:"wrap",flexShrink:0}}>
      <span style={{fontSize:10,color:T.sub,fontFamily:"monospace",letterSpacing:"0.15em"}}>SIGN IN:</span>
      {USERS.map(u=><button key={u.key} onClick={()=>onLogin&&onLogin(u.key)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:`${u.color}12`,border:`2px solid ${u.color}55`,borderRadius:10,cursor:"pointer",color:u.color,fontFamily:"Georgia,serif",fontSize:13,fontWeight:"bold"}}>{u.emoji} {u.label}</button>)}
      <button onClick={onExit} style={{...tvS.btnGhost,padding:"7px 14px",fontSize:12}}>↩ Exit TV Mode</button>
    </div>
  </div>);
}

export { TVDisplay };
