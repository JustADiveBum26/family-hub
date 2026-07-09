// ── FAMILY CALENDAR — shared events, separate from the meal planner ──────────
// Parents + Bradyn can add/edit; everyone can view. Data syncs via fp2:events.
import { useState, useEffect } from "react";
import { store } from "./store";
import { USERS, GOLD } from "./constants";

const OWNERS=[{key:"family",label:"Family",emoji:"👨‍👩‍👦‍👦",color:GOLD},...USERS];
const EVENT_CATS=[
  {key:"work",label:"Work",emoji:"💼"},
  {key:"school",label:"School",emoji:"🎒"},
  {key:"sports",label:"Sports",emoji:"🏈"},
  {key:"appointment",label:"Appointment",emoji:"🩺"},
  {key:"activity",label:"Activity",emoji:"🎉"},
  {key:"trip",label:"Trip",emoji:"✈️"},
  {key:"other",label:"Other",emoji:"📌"},
];
const WEEK_HEAD=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const pad2=n=>String(n).padStart(2,"0");
const dateKey=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const parseKey=k=>new Date(k+"T12:00:00");
const todayKey=()=>dateKey(new Date());
// Events can be tagged with several people (owners: ["brad","parker"]). Older
// events only have a single `owner` string — both shapes are supported.
const evOwners=ev=>{const keys=(ev.owners&&ev.owners.length)?ev.owners:[ev.owner||"family"];return keys.map(k=>OWNERS.find(o=>o.key===k)).filter(Boolean);};
const ownerOf=ev=>evOwners(ev)[0]||OWNERS[0];
const catOf=ev=>EVENT_CATS.find(c=>c.key===(ev.category||"other"))||EVENT_CATS[EVENT_CATS.length-1];
const spansDay=(ev,key)=>ev.date<=key&&key<=(ev.endDate||ev.date);
const fmtTime=t=>{if(!t)return"";const[h,m]=t.split(":").map(Number);const ap=h>=12?"PM":"AM";const h12=h%12===0?12:h%12;return m?`${h12}:${pad2(m)} ${ap}`:`${h12} ${ap}`;};
const fmtDayLong=key=>parseKey(key).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
const fmtDayShort=key=>parseKey(key).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});

const eventsOnDay=(events,key)=>(events||[]).filter(ev=>spansDay(ev,key))
  .sort((a,b)=>(a.time||"")<(b.time||"")?-1:(a.time||"")>(b.time||"")?1:0);

// Events starting (or still running) within the next `days` days, soonest first.
const upcomingEvents=(events,days=7)=>{
  const start=todayKey();
  const end=dateKey(new Date(Date.now()+days*864e5));
  return(events||[])
    .filter(ev=>(ev.endDate||ev.date)>=start&&ev.date<=end)
    .sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:(a.time||"")<(b.time||"")?-1:1);
};

// Narrow-screen hook so the month grid can switch from chips to dots on phones.
function useIsNarrow(bp=700){
  const [narrow,setNarrow]=useState(typeof window!=="undefined"&&window.innerWidth<=bp);
  useEffect(()=>{
    const mq=window.matchMedia(`(max-width:${bp}px)`);
    const fn=e=>setNarrow(e.matches);
    setNarrow(mq.matches);
    mq.addEventListener?mq.addEventListener("change",fn):mq.addListener(fn);
    return()=>{mq.removeEventListener?mq.removeEventListener("change",fn):mq.removeListener(fn);};
  },[bp]);
  return narrow;
}

// ── MONTH GRID ────────────────────────────────────────────────────────────────
function MonthCalendar({events,S,selectedKey,onSelectDay}){
  const narrow=useIsNarrow();
  const today=todayKey();
  const [cur,setCur]=useState(()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),1);});
  const monthLabel=cur.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const goMonth=off=>setCur(new Date(cur.getFullYear(),cur.getMonth()+off,1));
  const goToday=()=>{const d=new Date();setCur(new Date(d.getFullYear(),d.getMonth(),1));onSelectDay&&onSelectDay(today);};
  const offset=(cur.getDay()+6)%7;
  const daysInMonth=new Date(cur.getFullYear(),cur.getMonth()+1,0).getDate();
  const cells=[];
  const totalCells=Math.ceil((offset+daysInMonth)/7)*7;
  for(let i=0;i<totalCells;i++){
    const dayNum=i-offset+1;
    const d=new Date(cur.getFullYear(),cur.getMonth(),dayNum);
    cells.push({key:dateKey(d),inMonth:dayNum>=1&&dayNum<=daysInMonth,num:d.getDate()});
  }
  const navBtn={background:"transparent",border:`1px solid ${S.T.border}`,borderRadius:8,padding:narrow?"8px 14px":"6px 14px",color:S.T.text,fontSize:16,cursor:"pointer",fontFamily:"Georgia,serif",lineHeight:1};
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8,flexWrap:"wrap"}}>
      <div style={{fontSize:narrow?18:22,color:S.T.accent,fontFamily:"Georgia,serif"}}>📅 {monthLabel}</div>
      <div style={{display:"flex",gap:6}}>
        <button style={navBtn} onClick={()=>goMonth(-1)}>‹</button>
        <button style={{...navBtn,fontSize:12}} onClick={goToday}>Today</button>
        <button style={navBtn} onClick={()=>goMonth(1)}>›</button>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:narrow?3:5}}>
      {WEEK_HEAD.map(w=><div key={w} style={{textAlign:"center",fontSize:narrow?9:11,color:S.T.sub,fontFamily:"monospace",letterSpacing:"0.1em",padding:"2px 0"}}>{narrow?w[0]+w[1]:w.toUpperCase()}</div>)}
      {cells.map(c=>{
        const dayEvents=c.inMonth?eventsOnDay(events,c.key):[];
        const isToday=c.key===today;
        const isSel=c.key===selectedKey;
        const maxChips=narrow?0:3;
        return(<div key={c.key} onClick={()=>c.inMonth&&onSelectDay&&onSelectDay(c.key)}
          style={{minHeight:narrow?52:92,borderRadius:8,padding:narrow?"4px 3px":"6px 6px",cursor:c.inMonth?"pointer":"default",
            background:isSel?S.T.accent+"22":isToday?S.T.accent+"11":c.inMonth?S.T.bg:"transparent",
            border:`1px solid ${isSel?S.T.accent:isToday?S.T.accent+"88":c.inMonth?S.T.border:"transparent"}`,
            opacity:c.inMonth?1:0.25,overflow:"hidden",WebkitTapHighlightColor:"transparent"}}>
          <div style={{fontSize:narrow?12:13,fontWeight:isToday?"bold":"normal",color:isToday?S.T.accent:S.T.text,textAlign:narrow?"center":"left",marginBottom:2}}>{c.num}</div>
          {narrow
            ?<div style={{display:"flex",gap:2,justifyContent:"center",flexWrap:"wrap"}}>
              {dayEvents.slice(0,4).map(ev=><div key={ev.id} style={{width:6,height:6,borderRadius:"50%",background:ownerOf(ev).color}}/>)}
              {dayEvents.length>4&&<div style={{fontSize:8,color:S.T.sub,lineHeight:"6px"}}>+</div>}
            </div>
            :<>
              {dayEvents.slice(0,maxChips).map(ev=>{const os=evOwners(ev),o=os[0];return(
                <div key={ev.id} style={{background:o.color+"22",border:`1px solid ${o.color}55`,borderRadius:4,padding:"1px 4px",marginBottom:2,fontSize:10,color:S.T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {os.length>1&&os.slice(0,4).map(o2=><span key={o2.key} style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:o2.color,marginRight:2,verticalAlign:"middle"}}/>)}
                  {ev.time&&ev.date===c.key?<span style={{color:o.color,fontFamily:"monospace"}}>{fmtTime(ev.time)} </span>:null}{catOf(ev).emoji} {ev.title}
                </div>);})}
              {dayEvents.length>maxChips&&<div style={{fontSize:9,color:S.T.sub}}>+{dayEvents.length-maxChips} more</div>}
            </>
          }
        </div>);
      })}
    </div>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:10}}>
      {OWNERS.map(o=><div key={o.key} style={{display:"flex",gap:4,alignItems:"center"}}><div style={{width:8,height:8,borderRadius:"50%",background:o.color}}/><span style={{fontSize:10,color:S.T.sub}}>{o.label}</span></div>)}
    </div>
  </div>);
}

// ── EVENT ROW (used in day detail + upcoming lists) ───────────────────────────
function EventRow({ev,S,showDate,canEdit,onEdit,onDelete,onDeleteSeries}){
  const os=evOwners(ev),o=os[0]||OWNERS[0],c=catOf(ev);
  const multi=ev.endDate&&ev.endDate!==ev.date;
  return(<div style={{display:"flex",gap:10,padding:"9px 0",borderBottom:`1px solid ${S.T.border}`,alignItems:"flex-start"}}>
    <div style={{width:4,alignSelf:"stretch",borderRadius:2,background:os.length>1?`linear-gradient(${os.map(x=>x.color).join(",")})`:o.color,flexShrink:0}}/>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:14,color:S.T.text,fontWeight:"bold"}}>{c.emoji} {ev.title}</div>
      <div style={{fontSize:11,color:S.T.sub,marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
        {os.map(x=><span key={x.key} style={{color:x.color}}>{x.emoji} {x.label}</span>)}
        {showDate&&<span>{fmtDayShort(ev.date)}{multi?" → "+fmtDayShort(ev.endDate):""}</span>}
        {ev.time&&<span>{fmtTime(ev.time)}{ev.endTime?" – "+fmtTime(ev.endTime):""}</span>}
        {!showDate&&multi&&<span>thru {fmtDayShort(ev.endDate)}</span>}
      </div>
      {ev.notes&&<div style={{fontSize:11,color:S.T.sub,marginTop:2,fontStyle:"italic"}}>{ev.notes}</div>}
    </div>
    {canEdit&&<div style={{display:"flex",gap:4,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
      <button style={{...S.btnGhost,padding:"3px 9px",fontSize:11}} onClick={()=>onEdit(ev)}>Edit</button>
      <button style={{...S.btnDanger,padding:"3px 9px",fontSize:11}} onClick={()=>onDelete(ev.id)}>✕</button>
      {ev.seriesId&&<button style={{...S.btnDanger,padding:"3px 9px",fontSize:11}} onClick={()=>onDeleteSeries(ev.seriesId)}>✕ all repeats</button>}
    </div>}
  </div>);
}

// ── ADD / EDIT FORM ───────────────────────────────────────────────────────────
function EventForm({S,initial,defaultDate,currentUser,onSave,onCancel}){
  const blank={title:"",owners:["family"],category:"other",date:defaultDate||todayKey(),endDate:"",time:"",endTime:"",notes:"",countdown:false,repeatWeekly:false,repeatUntil:""};
  const [f,setF]=useState(initial?{...blank,...initial,owners:(initial.owners&&initial.owners.length)?initial.owners:[initial.owner||"family"],repeatWeekly:false,repeatUntil:""}:blank);
  const [err,setErr]=useState("");
  const set=(k,v)=>{setF(x=>({...x,[k]:v}));setErr("");};
  // "Family" means everyone and can't be combined; picking people drops it.
  const toggleOwner=key=>{
    setF(x=>{
      if(key==="family")return{...x,owners:["family"]};
      let next=x.owners.filter(k=>k!=="family");
      next=next.includes(key)?next.filter(k=>k!==key):[...next,key];
      return{...x,owners:next.length?next:["family"]};
    });
    setErr("");
  };
  const submit=()=>{
    if(!f.title.trim()){setErr("Give the event a name.");return;}
    if(!f.date){setErr("Pick a date.");return;}
    if(f.endDate&&f.endDate<f.date){setErr("End date is before start date.");return;}
    if(f.repeatWeekly&&!f.repeatUntil){setErr("Pick the last date for the weekly repeat.");return;}
    onSave(f);
  };
  return(<div style={{...S.cardSm,border:`1px solid ${S.T.accent}55`}}>
    <div style={{fontSize:14,color:S.T.accent,fontWeight:"bold",marginBottom:10}}>{initial?"Edit Event":"Add to Family Calendar"}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:10}}>
      <div style={{gridColumn:"1/-1"}}><div style={S.label}>What *</div><input style={S.input} placeholder="e.g. Brad works 3–11, Parker's game..." value={f.title} onChange={e=>set("title",e.target.value)}/></div>
      <div style={{gridColumn:"1/-1"}}>
        <div style={S.label}>Who is this for? (tap all that apply)</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {OWNERS.map(o=>{const on=f.owners.includes(o.key);return(
            <button key={o.key} onClick={()=>toggleOwner(o.key)} style={{padding:"7px 12px",borderRadius:10,fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer",background:on?o.color+"33":"transparent",border:`2px solid ${on?o.color:S.T.border}`,color:on?o.color:S.T.sub,fontWeight:on?"bold":"normal",WebkitTapHighlightColor:"transparent"}}>{o.emoji} {o.label}{on?" ✓":""}</button>
          );})}
        </div>
      </div>
      <div><div style={S.label}>Type</div><select style={S.select} value={f.category} onChange={e=>set("category",e.target.value)}>{EVENT_CATS.map(c=><option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}</select></div>
      <div><div style={S.label}>Date *</div><input style={S.input} type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></div>
      <div><div style={S.label}>End date (optional)</div><input style={S.input} type="date" value={f.endDate} onChange={e=>set("endDate",e.target.value)}/></div>
      <div><div style={S.label}>Start time (optional)</div><input style={S.input} type="time" value={f.time} onChange={e=>set("time",e.target.value)}/></div>
      <div><div style={S.label}>End time (optional)</div><input style={S.input} type="time" value={f.endTime} onChange={e=>set("endTime",e.target.value)}/></div>
      <div style={{gridColumn:"1/-1"}}><div style={S.label}>Notes</div><input style={S.input} placeholder="Anything the family should know..." value={f.notes} onChange={e=>set("notes",e.target.value)}/></div>
    </div>
    <div style={{marginBottom:10}}>
      <label style={{display:"flex",gap:6,alignItems:"center",fontSize:13,color:S.T.text,cursor:"pointer"}}>
        <input type="checkbox" checked={!!f.countdown} onChange={e=>set("countdown",e.target.checked)} style={{accentColor:S.T.accent,width:16,height:16}}/>
        ⏳ Show as countdown — big "days to go" tile on home screens and the TV
      </label>
    </div>
    {!initial&&<div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:10}}>
      <label style={{display:"flex",gap:6,alignItems:"center",fontSize:13,color:S.T.text,cursor:"pointer"}}>
        <input type="checkbox" checked={f.repeatWeekly} onChange={e=>set("repeatWeekly",e.target.checked)} style={{accentColor:S.T.accent,width:16,height:16}}/>
        Repeats weekly
      </label>
      {f.repeatWeekly&&<div style={{display:"flex",gap:6,alignItems:"center"}}>
        <span style={{fontSize:12,color:S.T.sub}}>until</span>
        <input style={{...S.input,width:150,padding:"6px 10px"}} type="date" value={f.repeatUntil} onChange={e=>set("repeatUntil",e.target.value)}/>
      </div>}
    </div>}
    {err&&<div style={{color:"#f44336",fontSize:12,marginBottom:8}}>{err}</div>}
    <div style={{display:"flex",gap:8}}>
      <button style={S.btn()} onClick={submit}>{initial?"Save Changes":"Add Event"}</button>
      <button style={S.btnGhost} onClick={onCancel}>Cancel</button>
    </div>
  </div>);
}

// ── COUNTDOWN TILES — events flagged "countdown" show big days-to-go numbers ──
function CountdownStrip({events,S,big}){
  const today=todayKey();
  const items=(events||[]).filter(ev=>ev.countdown&&(ev.endDate||ev.date)>=today).sort((a,b)=>a.date<b.date?-1:1).slice(0,4);
  if(items.length===0)return null;
  return(<div style={{display:"flex",gap:big?14:10,flexWrap:"wrap",marginBottom:14}}>
    {items.map(ev=>{
      const days=Math.max(0,Math.round((parseKey(ev.date)-parseKey(today))/864e5));
      const o=ownerOf(ev),c=catOf(ev);
      return(<div key={ev.id} style={{flex:`1 1 ${big?"210px":"150px"}`,background:o.color+"14",border:`1px solid ${o.color}44`,borderRadius:12,padding:big?"14px 18px":"9px 12px",textAlign:"center"}}>
        <div style={{fontSize:big?16:11,color:S.T.sub,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.emoji} {ev.title}</div>
        <div style={{fontSize:big?42:24,fontWeight:"bold",color:o.color,lineHeight:1.15}}>{days===0?"TODAY!":days}</div>
        {days>0&&<div style={{fontSize:big?13:10,color:S.T.sub}}>{days===1?"day to go":"days to go"} · {fmtDayShort(ev.date)}</div>}
      </div>);
    })}
  </div>);
}

// ── UPCOMING EVENTS LIST (small widget for home screens) ──────────────────────
function UpcomingEvents({events,S,days=7,title="Coming Up"}){
  const up=upcomingEvents(events,days);
  if(up.length===0)return null;
  return(<div style={S.card}>
    <div style={S.h2}>{title}</div>
    {up.slice(0,8).map(ev=><EventRow key={ev.id} ev={ev} S={S} showDate/>)}
    {up.length>8&&<div style={{fontSize:11,color:S.T.sub,marginTop:6}}>+{up.length-8} more this week</div>}
  </div>);
}

// ── FULL CALENDAR TAB ─────────────────────────────────────────────────────────
function CalendarTab({events,setEvents,currentUser,canEdit,S}){
  const [selected,setSelected]=useState(todayKey());
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const save=u=>{setEvents(u);store.save("fp2:events",u);};
  const addEvent=f=>{
    const base={title:f.title.trim(),owners:f.owners,owner:f.owners[0],category:f.category,date:f.date,endDate:f.endDate||"",time:f.time||"",endTime:f.endTime||"",notes:f.notes.trim(),countdown:!!f.countdown,createdBy:currentUser||""};
    let added=[];
    if(f.repeatWeekly&&f.repeatUntil){
      const seriesId=Date.now();
      let d=parseKey(f.date),end=f.endDate?parseKey(f.endDate):null,i=0;
      while(dateKey(d)<=f.repeatUntil&&i<52){
        added.push({...base,id:seriesId+i,seriesId,date:dateKey(d),endDate:end?dateKey(end):""});
        d=new Date(d.getTime()+7*864e5);if(end)end=new Date(end.getTime()+7*864e5);i++;
      }
    }else{
      added=[{...base,id:Date.now()}];
    }
    save([...(events||[]),...added]);
    setShowForm(false);
    setSelected(f.date);
  };
  const updateEvent=f=>{
    save((events||[]).map(ev=>ev.id===editing.id?{...ev,title:f.title.trim(),owners:f.owners,owner:f.owners[0],category:f.category,date:f.date,endDate:f.endDate||"",time:f.time||"",endTime:f.endTime||"",notes:f.notes.trim(),countdown:!!f.countdown}:ev));
    setEditing(null);
  };
  const del=id=>save((events||[]).filter(ev=>ev.id!==id));
  const delSeries=seriesId=>save((events||[]).filter(ev=>ev.seriesId!==seriesId));
  const dayEvents=eventsOnDay(events,selected);
  return(<div>
    {canEdit&&!showForm&&!editing&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
      <button style={S.btn()} onClick={()=>setShowForm(true)}>+ Add Event</button>
    </div>}
    {showForm&&<EventForm S={S} defaultDate={selected} currentUser={currentUser} onSave={addEvent} onCancel={()=>setShowForm(false)}/>}
    {editing&&<EventForm S={S} initial={editing} currentUser={currentUser} onSave={updateEvent} onCancel={()=>setEditing(null)}/>}
    <div style={S.card}>
      <MonthCalendar events={events} S={S} selectedKey={selected} onSelectDay={setSelected}/>
    </div>
    <div style={S.card}>
      <div style={S.h2}>{selected===todayKey()?"Today — ":""}{fmtDayLong(selected)}</div>
      {dayEvents.length===0&&<div style={{fontSize:13,color:S.T.sub,padding:"6px 0"}}>Nothing on the calendar{canEdit?" — tap Add Event to put something here.":"."}</div>}
      {dayEvents.map(ev=><EventRow key={ev.id} ev={ev} S={S} canEdit={canEdit} onEdit={e=>{setEditing(e);setShowForm(false);}} onDelete={del} onDeleteSeries={delSeries}/>)}
    </div>
    <UpcomingEvents events={events} S={S} days={14} title="Next 2 Weeks"/>
  </div>);
}

export { MonthCalendar, UpcomingEvents, EventRow, CalendarTab, CountdownStrip, eventsOnDay, upcomingEvents, todayKey, fmtDayLong };
