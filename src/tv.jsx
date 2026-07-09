// ── TV WALL DISPLAY — kiosk view for the drop-zone flat screen ────────────────
// Reached from the "📺 TV Display Mode" button on the landing page or by
// bookmarking the app URL with #tv. Read-only, big type, refreshes itself.
import { useState, useEffect } from "react";
import { DAYS, MEAL_TYPES, GOLD, BORDER, USERS, todayName, billPaid, weekKeyOf, dateOfWeekDay } from "./constants";
import { WeatherStrip } from "./shared";
import { MonthCalendar, EventRow, eventsOnDay, todayKey } from "./calendar";

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

function TVDisplay({mealPlan,nextWeekPlan,events,shopList,bills,messages,chores,appSettings,onExit,onRefresh}){
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
  return(<div style={{background:T.bg,minHeight:"100vh",fontFamily:"Georgia,serif",color:T.text,padding:"18px 24px",boxSizing:"border-box"}}>
    {/* Header: identity, clock, weather */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:20,flexWrap:"wrap",marginBottom:16}}>
      <div>
        <div style={{fontSize:12,color:"#555",letterSpacing:"0.28em",fontFamily:"monospace"}}>THE</div>
        <div style={{fontSize:34,color:T.text}}>Family <span style={{color:GOLD}}>Hub</span></div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:56,fontWeight:"bold",color:T.text,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{now.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}</div>
        <div style={{fontSize:20,color:GOLD,marginTop:4}}>{now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
      </div>
      <WeatherStrip big/>
      <button onClick={onExit} style={{...tvS.btnGhost,position:"fixed",top:10,right:10,opacity:0.5,zIndex:10}}>✕</button>
    </div>
    {pinned.length>0&&<div style={{...tvS.alert(GOLD),display:"flex",gap:16,flexWrap:"wrap"}}>
      {pinned.map(m=><div key={m.id} style={{fontSize:18}}>📌 <strong style={{color:GOLD}}>{m.authorLabel}:</strong> {m.text}</div>)}
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"minmax(0,58fr) minmax(0,42fr)",gap:16,alignItems:"start"}}>
      {/* Left: big month calendar */}
      <div>
        <div style={{...tvS.card,zoom:1.3}}>
          <MonthCalendar events={events} S={tvS} selectedKey={tKey}/>
        </div>
        {dueSoon.length>0&&<div style={{...tvS.alert("#FF9800"),display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{color:"#FF9800",fontWeight:"bold",fontSize:16}}>Bills this week:</span>
          {dueSoon.map(b=>{const dl=Math.ceil((new Date(b.dueDate+"T12:00:00")-now)/(864e5));return <span key={b.id} style={tvS.tag("#FF9800")}>{b.name} — {dl===0?"Today":dl===1?"Tomorrow":dl+"d"}</span>;})}
        </div>}
      </div>
      {/* Right: today/tomorrow, meals, shopping, tasks */}
      <div>
        <div style={tvS.card}>
          <div style={tvS.h2}>Today</div>
          {todayEvents.length===0&&<div style={{fontSize:17,color:T.sub}}>Nothing scheduled today</div>}
          <div style={{zoom:1.15}}>{todayEvents.map(ev=><EventRow key={ev.id} ev={ev} S={tvS}/>)}</div>
          {tomorrowEvents.length>0&&<>
            <div style={{...tvS.label,marginTop:14}}>Tomorrow</div>
            {tomorrowEvents.map(ev=><EventRow key={ev.id} ev={ev} S={tvS}/>)}
          </>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div style={{...tvS.card,marginBottom:0}}>
            <div style={tvS.h2}>🍽 This Week</div>
            {DAYS.map((d,di)=>{
              const isToday=d===tn;
              // On Sunday, show tomorrow (next week's Monday) dinner in Monday's row.
              const src=(tomorrowIsNextWeek&&d===tomorrowDayName?nextWeekPlan:mealPlan)||{};
              const dinner=(src[d]||{}).Dinner;
              return(<div key={d} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:`1px solid #1a1a0f`,alignItems:"baseline",background:isToday?GOLD+"11":"transparent"}}>
                <span style={{fontSize:13,color:isToday?GOLD:T.sub,fontFamily:"monospace",minWidth:66,fontWeight:isToday?"bold":"normal"}}>{d.slice(0,3).toUpperCase()} {dateOfWeekDay(weekKeyOf(),di).getDate()}</span>
                <span style={{fontSize:16,color:dinner?T.text:"#333",fontStyle:dinner?"normal":"italic"}}>{dinner||"—"}</span>
              </div>);
            })}
          </div>
          <div style={{...tvS.card,marginBottom:0}}>
            <div style={tvS.h2}>🛒 Shopping ({unchecked.length})</div>
            {unchecked.length===0&&<div style={{fontSize:16,color:T.sub}}>List is empty!</div>}
            {unchecked.slice(0,10).map(i=><div key={i.id} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:"1px solid #1a1a0f",alignItems:"center"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:GOLD,flexShrink:0}}/>
              <span style={{fontSize:16,color:T.text}}>{i.qty&&i.qty!=="1"?i.qty+"× ":""}{i.name}</span>
            </div>)}
            {unchecked.length>10&&<div style={{fontSize:14,color:T.sub,marginTop:6}}>+{unchecked.length-10} more</div>}
          </div>
        </div>
        {todayChores.length>0&&<div style={{...tvS.card,marginTop:14}}>
          <div style={tvS.h2}>✅ Today's Tasks</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {todayChores.map(c=>{const u=USERS.find(x=>x.key===c.assignee);return(
              <span key={c.id} style={{...tvS.tag(u?.color||GOLD),fontSize:16,padding:"7px 14px"}}>{u?.emoji} {u?.label}: {c.task}</span>
            );})}
          </div>
        </div>}
      </div>
    </div>
  </div>);
}

export { TVDisplay };
