// ── TV WALL DISPLAY — kiosk view for the drop-zone flat screen ────────────────
// Reached from the "📺 TV Display Mode" button on the landing page or by
// bookmarking the app URL with #tv. Read-only, big type, refreshes itself.
import { useState, useEffect } from "react";
import { DAYS, MEAL_TYPES, GOLD, BORDER, USERS, todayName, billPaid, weekKeyOf, dateOfWeekDay } from "./constants";
import { WeatherStrip } from "./shared";
import { MonthCalendar, EventRow, CountdownStrip, eventsOnDay, todayKey } from "./calendar";

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
  // Kiosk behavior: tick the clock, and re-pull family data every 5 minutes so
  // the wall screen stays current without anyone touching it.
  useEffect(()=>{const id=setInterval(()=>setNow(new Date()),15000);return()=>clearInterval(id);},[]);
  useEffect(()=>{if(!onRefresh)return;const id=setInterval(()=>{onRefresh();},5*60*1000);return()=>clearInterval(id);},[onRefresh]);
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
  return(<div style={{background:T.bg,height:"100vh",fontFamily:"Georgia,serif",color:T.text,padding:"12px 18px",boxSizing:"border-box",display:"flex",flexDirection:"column",overflow:"hidden"}}>
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
    <div style={{flexShrink:0}}><CountdownStrip events={events} S={tvS}/></div>
    {/* Main: fills whatever height is left — never pushes the sign-in row off-screen */}
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,54fr) minmax(0,46fr)",gap:14,flex:"1 1 auto",minHeight:0}}>
      {/* Left: wider month calendar */}
      <div style={{display:"flex",flexDirection:"column",minHeight:0}}>
        <div style={{...tvS.card,flex:"1 1 auto",minHeight:0,overflowY:"auto",padding:14,marginBottom:dueSoon.length>0?6:0}}>
          <MonthCalendar events={events} S={tvS} selectedKey={tKey}/>
        </div>
        {dueSoon.length>0&&<div style={{...tvS.alert("#FF9800"),display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",padding:"7px 12px",marginBottom:0,flexShrink:0}}>
          <span style={{color:"#FF9800",fontWeight:"bold",fontSize:12}}>Bills:</span>
          {dueSoon.map(b=>{const dl=Math.ceil((new Date(b.dueDate+"T12:00:00")-now)/(864e5));return <span key={b.id} style={{...tvS.tag("#FF9800"),fontSize:11,padding:"3px 8px"}}>{b.name} — {dl===0?"Today":dl===1?"Tmrw":dl+"d"}</span>;})}
        </div>}
      </div>
      {/* Right: Today leads (prominent), Menu + Shopping condensed below, tasks last */}
      <div style={{display:"flex",flexDirection:"column",minHeight:0,gap:8}}>
        <div style={{...tvS.card,marginBottom:0,flex:"0 1 auto",maxHeight:"38vh",minHeight:0,overflowY:"auto",padding:14}}>
          <div style={{...tvS.h2,fontSize:15,marginBottom:6,paddingBottom:6}}>Today{tomorrowEvents.length>0?" / Tomorrow":""}</div>
          {todayEvents.length===0&&<div style={{fontSize:13,color:T.sub}}>Nothing scheduled today</div>}
          {todayEvents.map(ev=><EventRow key={ev.id} ev={ev} S={tvS}/>)}
          {tomorrowEvents.length>0&&<>
            <div style={{...tvS.label,marginTop:10}}>Tomorrow</div>
            {tomorrowEvents.map(ev=><EventRow key={ev.id} ev={ev} S={tvS}/>)}
          </>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,flex:"1 1 auto",minHeight:0}}>
          <div style={{...tvS.card,marginBottom:0,display:"flex",flexDirection:"column",minHeight:0,padding:12}}>
            <div style={{...tvS.h2,fontSize:13,marginBottom:5,paddingBottom:5}}>🍽 Menu This Week</div>
            <div style={{overflowY:"auto",minHeight:0,flex:1}}>
              {DAYS.map((d,di)=>{
                const isToday=d===tn;
                // On Sunday, show tomorrow (next week's Monday) dinner in Monday's row.
                const src=(tomorrowIsNextWeek&&d===tomorrowDayName?nextWeekPlan:mealPlan)||{};
                const dinner=(src[d]||{}).Dinner;
                return(<div key={d} style={{display:"flex",gap:8,padding:"3px 0",borderBottom:`1px solid #1a1a0f`,alignItems:"baseline",background:isToday?GOLD+"11":"transparent"}}>
                  <span style={{fontSize:10,color:isToday?GOLD:T.sub,fontFamily:"monospace",minWidth:50,fontWeight:isToday?"bold":"normal"}}>{d.slice(0,3).toUpperCase()} {dateOfWeekDay(weekKeyOf(),di).getDate()}</span>
                  <span style={{fontSize:12,color:dinner?T.text:"#333",fontStyle:dinner?"normal":"italic"}}>{dinner||"—"}</span>
                </div>);
              })}
            </div>
          </div>
          <div style={{...tvS.card,marginBottom:0,display:"flex",flexDirection:"column",minHeight:0,padding:12}}>
            <div style={{...tvS.h2,fontSize:13,marginBottom:5,paddingBottom:5}}>🛒 Shopping ({unchecked.length})</div>
            <div style={{overflowY:"auto",minHeight:0,flex:1}}>
              {unchecked.length===0&&<div style={{fontSize:12,color:T.sub}}>List is empty!</div>}
              {unchecked.map(i=><div key={i.id} style={{display:"flex",gap:8,padding:"3px 0",borderBottom:"1px solid #1a1a0f",alignItems:"center"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:GOLD,flexShrink:0}}/>
                <span style={{fontSize:12,color:T.text}}>{i.qty&&i.qty!=="1"?i.qty+"× ":""}{i.name}</span>
              </div>)}
            </div>
          </div>
        </div>
        {todayChores.length>0&&<div style={{...tvS.card,marginTop:0,marginBottom:0,padding:"8px 12px",flexShrink:0}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:10,color:T.sub,fontFamily:"monospace",letterSpacing:"0.1em"}}>TASKS:</span>
            {todayChores.slice(0,6).map(c=>{const u=USERS.find(x=>x.key===c.assignee);return(
              <span key={c.id} style={{...tvS.tag(u?.color||GOLD),fontSize:11,padding:"3px 9px"}}>{u?.emoji} {u?.label}: {c.task}</span>
            );})}
          </div>
        </div>}
      </div>
    </div>
    {/* Footer: sign in straight from the TV, or leave TV mode — always visible, never needs scrolling */}
    <div style={{display:"flex",justifyContent:"center",gap:8,alignItems:"center",marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`,flexWrap:"wrap",flexShrink:0}}>
      <span style={{fontSize:10,color:T.sub,fontFamily:"monospace",letterSpacing:"0.15em"}}>SIGN IN:</span>
      {USERS.map(u=><button key={u.key} onClick={()=>onLogin&&onLogin(u.key)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:`${u.color}12`,border:`2px solid ${u.color}55`,borderRadius:10,cursor:"pointer",color:u.color,fontFamily:"Georgia,serif",fontSize:13,fontWeight:"bold"}}>{u.emoji} {u.label}</button>)}
      <button onClick={onExit} style={{...tvS.btnGhost,padding:"7px 14px",fontSize:12}}>↩ Exit TV Mode</button>
    </div>
  </div>);
}

export { TVDisplay };
