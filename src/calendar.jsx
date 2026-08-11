// ── FAMILY CALENDAR — shared events, separate from the meal planner ──────────
// Parents + Bradyn can add/edit; everyone can view. Data syncs via fp2:events.
import { useState, useEffect } from "react";
import { store } from "./store";
import { USERS, GOLD } from "./constants";

const OWNERS=[{key:"family",label:"Family",emoji:"👨‍👩‍👦‍👦",color:GOLD},...USERS];
// Fallback when an event isn't tagged to anyone — a grandparent's birthday isn't
// really "for the family" as a unit, so leaving the owner picker empty shouldn't
// silently become "Family". Not selectable directly; it's what an empty owners
// list resolves to.
const UNASSIGNED={key:"unassigned",label:"Not specific to us",emoji:"🎉",color:"#8a8a8a"};
const EVENT_CATS=[
  {key:"birthday",label:"Birthday",emoji:"🎂"},
  {key:"anniversary",label:"Anniversary",emoji:"💍"},
  {key:"work",label:"Work",emoji:"💼"},
  {key:"school",label:"School",emoji:"🎒"},
  {key:"sports",label:"Sports",emoji:"⚽"},
  {key:"appointment",label:"Appointment",emoji:"🩺"},
  {key:"activity",label:"Activity",emoji:"🎉"},
  {key:"trip",label:"Trip",emoji:"✈️"},
  {key:"holiday",label:"Holiday",emoji:"🎆"},
  {key:"concert",label:"Concert",emoji:"🎤"},
  {key:"movie",label:"Movie / Show",emoji:"🎬"},
  {key:"other",label:"Other",emoji:"📌"},
];
const WEEK_HEAD=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const pad2=n=>String(n).padStart(2,"0");
const dateKey=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const parseKey=k=>new Date(k+"T12:00:00");
const todayKey=()=>dateKey(new Date());
// Events can be tagged with several people (owners: ["brad","parker"]). Older
// events only have a single `owner` string — both shapes are supported.
const evOwners=ev=>{
  const keys=(ev.owners&&ev.owners.length)?ev.owners:(ev.owner?[ev.owner]:null);
  if(!keys)return[UNASSIGNED];
  const found=keys.map(k=>OWNERS.find(o=>o.key===k)).filter(Boolean);
  return found.length?found:[UNASSIGNED];
};
const ownerOf=ev=>evOwners(ev)[0]||OWNERS[0];
const catOf=ev=>EVENT_CATS.find(c=>c.key===(ev.category||"other"))||EVENT_CATS[EVENT_CATS.length-1];
const monthDay=k=>k.slice(5);
// Yearly-recurring events (birthdays, anniversaries) match on month+day alone,
// regardless of year — no need to re-add them every year.
const spansDay=(ev,key)=>ev.repeatYearly?monthDay(ev.date)===monthDay(key):(ev.date<=key&&key<=(ev.endDate||ev.date));
const fmtTime=t=>{if(!t)return"";const[h,m]=t.split(":").map(Number);const ap=h>=12?"PM":"AM";const h12=h%12===0?12:h%12;return m?`${h12}:${pad2(m)} ${ap}`:`${h12} ${ap}`;};
const fmtDayLong=key=>parseKey(key).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
const fmtDayShort=key=>parseKey(key).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
const ordinal=n=>{const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);};
// Given the specific calendar day an event is showing on (occKey — matters for
// yearly-recurring events, whose stored `date` keeps its original year), compute
// just the ordinal ("39th"). Returns null if no origin year was given, or the
// math doesn't make sense yet (event is in the future).
const ordinalAge=(ev,occKey)=>{
  if(!ev.originYear||!occKey)return null;
  const occYear=parseInt(occKey.slice(0,4),10);
  const n=occYear-ev.originYear;
  if(n<0)return null;
  return ordinal(n);
};
// For Birthday/Anniversary events, the "What" field is just a name ("Mary Beth",
// "Brad & Mary Beth") — the displayed title is generated fresh every time from
// the name + current age/anniversary number, so it never goes stale year to year
// (nothing is baked into storage). Every other category shows its title as typed.
const displayTitle=(ev,occKey)=>{
  if(ev.category!=="birthday"&&ev.category!=="anniversary")return ev.title;
  const noun=ev.category==="anniversary"?"Anniversary":"Birthday";
  const ord=ordinalAge(ev,occKey||ev.date);
  const name=ev.title||"Someone";
  return ord?`${name}'s ${ord} ${noun}`:`${name}'s ${noun}`;
};

const eventsOnDay=(events,key)=>(events||[]).filter(ev=>spansDay(ev,key))
  .sort((a,b)=>(a.time||"")<(b.time||"")?-1:(a.time||"")>(b.time||"")?1:0);

// For a yearly-recurring event, find its next occurrence on/after `fromKey`
// (this year if it hasn't happened yet, otherwise next year).
const nextOccurrence=(ev,fromKey)=>{
  const from=parseKey(fromKey),orig=parseKey(ev.date);
  let next=new Date(from.getFullYear(),orig.getMonth(),orig.getDate(),12);
  if(dateKey(next)<fromKey)next=new Date(from.getFullYear()+1,orig.getMonth(),orig.getDate(),12);
  return dateKey(next);
};

// Events starting (or still running) within the next `days` days, soonest first.
// Yearly events are normalized to their next occurrence first so the usual
// date-range filter/sort just works.
const upcomingEvents=(events,days=7)=>{
  const start=todayKey();
  const end=dateKey(new Date(Date.now()+days*864e5));
  return(events||[])
    .map(ev=>ev.repeatYearly?{...ev,date:nextOccurrence(ev,start),endDate:""}:ev)
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
function MonthCalendar({events,S,selectedKey,onSelectDay,initialMonth}){
  const narrow=useIsNarrow();
  const today=todayKey();
  const [cur,setCur]=useState(()=>{const d=initialMonth?parseKey(initialMonth):new Date();return new Date(d.getFullYear(),d.getMonth(),1);});
  const monthLabel=cur.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const goMonth=off=>setCur(new Date(cur.getFullYear(),cur.getMonth()+off,1));
  const goToday=()=>{const d=new Date();setCur(new Date(d.getFullYear(),d.getMonth(),1));onSelectDay&&onSelectDay(today);};
  const offset=cur.getDay();
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
                  {ev.time&&ev.date===c.key?<span style={{color:o.color,fontFamily:"monospace"}}>{fmtTime(ev.time)} </span>:null}{catOf(ev).emoji} {displayTitle(ev,c.key)}
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

// ── DATE FIELD — click to pick a date off a real calendar instead of typing ────
function DateField({S,label,value,onChange,placeholder="Pick a date"}){
  const [open,setOpen]=useState(false);
  return(<div style={{position:"relative"}}>
    {label&&<div style={S.label}>{label}</div>}
    <button type="button" onClick={()=>setOpen(o=>!o)} style={{...S.input,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
      <span style={{color:value?S.T.text:S.T.sub}}>{value?fmtDayShort(value):placeholder}</span>
      <span>📅</span>
    </button>
    {open&&<>
      <div style={{position:"fixed",inset:0,zIndex:60}} onClick={()=>setOpen(false)}/>
      <div style={{position:"absolute",zIndex:61,top:"100%",left:0,marginTop:4,background:S.T.card,border:`1px solid ${S.T.border}`,borderRadius:10,padding:12,boxShadow:"0 8px 24px rgba(0,0,0,0.4)",minWidth:280}} onClick={e=>e.stopPropagation()}>
        <MonthCalendar events={[]} S={S} selectedKey={value} initialMonth={value||undefined} onSelectDay={k=>{onChange(k);setOpen(false);}}/>
      </div>
    </>}
  </div>);
}

// ── EVENT ROW (used in day detail + upcoming lists) ───────────────────────────
// onClick (optional) makes the whole row open the shared EventDetailPopup
// instead of/alongside the inline canEdit buttons — used by every list that
// wants "click to see full details" rather than editing right in the list.
function EventRow({ev,S,showDate,canEdit,onEdit,onDelete,onDeleteSeries,occKey,onClick}){
  const os=evOwners(ev),o=os[0]||OWNERS[0],c=catOf(ev);
  const multi=ev.endDate&&ev.endDate!==ev.date;
  return(<div onClick={onClick} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:`1px solid ${S.T.border}`,alignItems:"flex-start",cursor:onClick?"pointer":"default"}}>
    <div style={{width:4,alignSelf:"stretch",borderRadius:2,background:os.length>1?`linear-gradient(${os.map(x=>x.color).join(",")})`:o.color,flexShrink:0}}/>
    {ev.photo&&<img src={ev.photo} alt="" style={{width:40,height:40,borderRadius:8,objectFit:"cover",flexShrink:0}}/>}
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:14,color:S.T.text,fontWeight:"bold"}}>{c.emoji} {displayTitle(ev,occKey)}</div>
      <div style={{fontSize:11,color:S.T.sub,marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
        {os.map(x=><span key={x.key} style={{color:x.color}}>{x.emoji} {x.label}</span>)}
        {showDate&&<span>{fmtDayShort(ev.date)}{multi?" → "+fmtDayShort(ev.endDate):""}</span>}
        {ev.time&&<span>{fmtTime(ev.time)}{ev.endTime?" – "+fmtTime(ev.endTime):""}</span>}
        {!showDate&&multi&&<span>thru {fmtDayShort(ev.endDate)}</span>}
        {ev.repeatYearly&&<span>🎂 yearly</span>}
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

// Photos are stored inline as compressed data URLs (the whole app lives in one
// Firestore document, so keeping each photo small — a thumbnail, really — avoids
// ever bumping into Firestore's 1MB per-document limit).
function resizeImageFile(file,maxDim=360,quality=0.6){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        let{width,height}=img;
        if(width>height){if(width>maxDim){height=Math.round(height*maxDim/width);width=maxDim;}}
        else if(height>maxDim){width=Math.round(width*maxDim/height);height=maxDim;}
        const canvas=document.createElement("canvas");
        canvas.width=width;canvas.height=height;
        canvas.getContext("2d").drawImage(img,0,0,width,height);
        resolve(canvas.toDataURL("image/jpeg",quality));
      };
      img.onerror=reject;
      img.src=reader.result;
    };
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

// ── ADD / EDIT FORM ───────────────────────────────────────────────────────────
function EventForm({S,initial,defaultDate,currentUser,onSave,onCancel}){
  const blank={title:"",owners:["family"],category:"other",date:defaultDate||todayKey(),endDate:"",time:"",endTime:"",notes:"",photo:"",originYear:"",countdown:false,repeatWeekly:false,repeatUntil:"",repeatYearly:false};
  const [f,setF]=useState(initial?{...blank,...initial,owners:(initial.owners&&initial.owners.length)?initial.owners:(initial.owner?[initial.owner]:[]),repeatWeekly:false,repeatUntil:""}:blank);
  const [err,setErr]=useState("");
  const [photoBusy,setPhotoBusy]=useState(false);
  const set=(k,v)=>{setF(x=>({...x,[k]:v}));setErr("");};
  // "Family" means everyone; tapping it again clears it — not every event has to
  // be tied to someone (a grandparent's birthday isn't really "for the family").
  const toggleOwner=key=>{
    setF(x=>{
      if(key==="family")return{...x,owners:x.owners.includes("family")?[]:["family"]};
      let next=x.owners.filter(k=>k!=="family");
      next=next.includes(key)?next.filter(k=>k!==key):[...next,key];
      return{...x,owners:next};
    });
    setErr("");
  };
  const handlePhotoFile=async e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    setPhotoBusy(true);
    try{const dataUrl=await resizeImageFile(file);set("photo",dataUrl);}
    catch(err){setErr("Could not load that image.");}
    setPhotoBusy(false);
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
      <div style={{gridColumn:"1/-1"}}>
        <div style={S.label}>{f.category==="birthday"?"Whose birthday? *":f.category==="anniversary"?"Whose/what anniversary? *":"What *"}</div>
        <input style={S.input} placeholder={f.category==="birthday"?"e.g. Mary Beth":f.category==="anniversary"?"e.g. Brad & Mary Beth, or Our Wedding":"e.g. Brad works 3–11, Parker's game..."} value={f.title} onChange={e=>set("title",e.target.value)}/>
        {(f.category==="birthday"||f.category==="anniversary")&&<div style={{fontSize:10,color:S.T.sub,marginTop:3}}>Just the name — "{f.category==="birthday"?"Birthday":"Anniversary"}" and the age/year get added automatically.</div>}
      </div>
      <div style={{gridColumn:"1/-1"}}>
        <div style={S.label}>Who is this for? (optional — tap to select, tap again to clear)</div>
        <div style={{fontSize:11,color:S.T.sub,marginBottom:6}}>Leave blank if it's not really about one of us — a grandparent's birthday, a family friend's anniversary, etc.</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {OWNERS.map(o=>{const on=f.owners.includes(o.key);return(
            <button key={o.key} onClick={()=>toggleOwner(o.key)} style={{padding:"7px 12px",borderRadius:10,fontSize:13,fontFamily:"Georgia,serif",cursor:"pointer",background:on?o.color+"33":"transparent",border:`2px solid ${on?o.color:S.T.border}`,color:on?o.color:S.T.sub,fontWeight:on?"bold":"normal",WebkitTapHighlightColor:"transparent"}}>{o.emoji} {o.label}{on?" ✓":""}</button>
          );})}
        </div>
      </div>
      <div><div style={S.label}>Type</div><select style={S.select} value={f.category} onChange={e=>{const cat=e.target.value;setF(x=>({...x,category:cat,repeatYearly:(cat==="birthday"||cat==="anniversary")?true:x.repeatYearly}));setErr("");}}>{EVENT_CATS.map(c=><option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}</select></div>
      {(f.category==="birthday"||f.category==="anniversary")&&<div>
        <div style={S.label}>{f.category==="birthday"?"Year of Birth (optional)":"Year of Anniversary (optional)"}</div>
        <input style={S.input} type="number" placeholder="e.g. 1990" min="1900" max={new Date().getFullYear()} value={f.originYear} onChange={e=>set("originYear",e.target.value)}/>
        <div style={{fontSize:10,color:S.T.sub,marginTop:3}}>{f.category==="birthday"?"Shows the age turning each year":"Shows which anniversary it is each year"}</div>
      </div>}
      {(f.category==="birthday"||f.category==="anniversary")&&f.title.trim()&&<div style={{gridColumn:"1/-1",fontSize:12,color:S.T.accent}}>
        Will show as: <strong>{displayTitle({title:f.title.trim(),category:f.category,originYear:f.originYear?+f.originYear:null},f.date)}</strong>
      </div>}
      <DateField S={S} label="Date *" value={f.date} onChange={v=>set("date",v)}/>
      {f.category!=="birthday"&&f.category!=="anniversary"&&<>
        <DateField S={S} label="End date (optional)" value={f.endDate} onChange={v=>set("endDate",v)} placeholder="No end date"/>
        <div><div style={S.label}>Start time (optional)</div><input style={S.input} type="time" value={f.time} onChange={e=>set("time",e.target.value)}/></div>
        <div><div style={S.label}>End time (optional)</div><input style={S.input} type="time" value={f.endTime} onChange={e=>set("endTime",e.target.value)}/></div>
        <div style={{gridColumn:"1/-1"}}><div style={S.label}>Notes</div><input style={S.input} placeholder="Anything the family should know..." value={f.notes} onChange={e=>set("notes",e.target.value)}/></div>
        <div style={{gridColumn:"1/-1"}}>
          <div style={S.label}>Photo (optional)</div>
          {f.photo
            ?<div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <img src={f.photo} alt="" style={{width:56,height:56,borderRadius:8,objectFit:"cover",border:`1px solid ${S.T.border}`}}/>
              <label style={{...S.btnGhost,cursor:"pointer",padding:"7px 14px",fontSize:12}}>{photoBusy?"Loading...":"Change"}<input type="file" accept="image/*" onChange={handlePhotoFile} style={{display:"none"}}/></label>
              <button style={S.btnDanger} onClick={()=>set("photo","")}>✕ Remove</button>
            </div>
            :<label style={{...S.btnGhost,cursor:"pointer",padding:"8px 16px",fontSize:13,display:"inline-block"}}>{photoBusy?"Loading...":"📷 Add a Photo"}<input type="file" accept="image/*" onChange={handlePhotoFile} style={{display:"none"}}/></label>
          }
        </div>
      </>}
    </div>
    <div style={{marginBottom:10}}>
      <label style={{display:"flex",gap:6,alignItems:"center",fontSize:13,color:S.T.text,cursor:"pointer"}}>
        <input type="checkbox" checked={!!f.countdown} onChange={e=>set("countdown",e.target.checked)} style={{accentColor:S.T.accent,width:16,height:16}}/>
        ⏳ Show as countdown — big "days to go" tile on home screens and the TV
      </label>
    </div>
    <div style={{marginBottom:10}}>
      <label style={{display:"flex",gap:6,alignItems:"center",fontSize:13,color:S.T.text,cursor:"pointer"}}>
        <input type="checkbox" checked={!!f.repeatYearly} onChange={e=>{const on=e.target.checked;setF(x=>({...x,repeatYearly:on,repeatWeekly:on?false:x.repeatWeekly}));setErr("");}} style={{accentColor:S.T.accent,width:16,height:16}}/>
        🎂 Repeats every year — birthdays, anniversaries. No need to re-add it annually.
      </label>
    </div>
    {!initial&&!f.repeatYearly&&<div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:10}}>
      <label style={{display:"flex",gap:6,alignItems:"center",fontSize:13,color:S.T.text,cursor:"pointer"}}>
        <input type="checkbox" checked={f.repeatWeekly} onChange={e=>set("repeatWeekly",e.target.checked)} style={{accentColor:S.T.accent,width:16,height:16}}/>
        Repeats weekly
      </label>
      {f.repeatWeekly&&<div style={{display:"flex",gap:6,alignItems:"center"}}>
        <span style={{fontSize:12,color:S.T.sub}}>until</span>
        <div style={{width:180}}><DateField S={S} value={f.repeatUntil} onChange={v=>set("repeatUntil",v)} placeholder="Pick end date"/></div>
      </div>}
    </div>}
    {err&&<div style={{color:"#f44336",fontSize:12,marginBottom:8}}>{err}</div>}
    <div style={{display:"flex",gap:8}}>
      <button style={S.btn()} onClick={submit}>{initial?"Save Changes":"Add Event"}</button>
      <button style={S.btnGhost} onClick={onCancel}>Cancel</button>
    </div>
  </div>);
}

// ── EVENT DETAIL POPUP — click any event anywhere and see/edit it here ───────
// The one place clicking an event leads to, from the month grid, the
// Birthdays view, Countdown/Celebrations tiles, or the Upcoming Events
// widget. Shows everything on that day; when the viewer can edit (setEvents
// + canEdit both given), each event gets Edit/Delete controls right here —
// callers that omit setEvents/canEdit automatically get a view-only popup
// (e.g. the public home screen, the TV display, Parker/Ryder's views).
function EventDetailPopup({dayKey,events,setEvents,currentUser,canEdit,S,onClose}){
  const [editingEv,setEditingEv]=useState(null);
  if(!dayKey)return null;
  const dayEvents=eventsOnDay(events,dayKey);
  const canActuallyEdit=!!(canEdit&&typeof setEvents==="function");
  const save=u=>{setEvents(u);store.save("fp2:events",u);};
  const updateEvent=f=>{
    save((events||[]).map(ev=>ev.id===editingEv.id?{...ev,title:f.title.trim(),owners:f.owners,owner:f.owners[0]||"",category:f.category,date:f.date,endDate:f.endDate||"",time:f.time||"",endTime:f.endTime||"",notes:f.notes.trim(),photo:f.photo||"",originYear:f.originYear?+f.originYear:null,countdown:!!f.countdown,repeatYearly:!!f.repeatYearly}:ev));
    setEditingEv(null);
  };
  const del=id=>{save((events||[]).filter(ev=>ev.id!==id));setEditingEv(null);};
  const delSeries=seriesId=>{save((events||[]).filter(ev=>ev.seriesId!==seriesId));setEditingEv(null);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
    <div style={{...S.card,maxWidth:520,width:"100%",maxHeight:"85vh",overflowY:"auto",marginBottom:0}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{...S.h2,marginBottom:0,paddingBottom:0,border:"none",fontSize:18}}>{dayKey===todayKey()?"Today — ":""}{fmtDayLong(dayKey)}</div>
        <button onClick={onClose} style={{...S.btnGhost,padding:"7px 14px",fontSize:13}}>✕ Close</button>
      </div>
      {editingEv
        ?<EventForm S={S} initial={editingEv} currentUser={currentUser} onSave={updateEvent} onCancel={()=>setEditingEv(null)}/>
        :<>
          {dayEvents.length===0&&<div style={{fontSize:14,color:S.T.sub}}>Nothing scheduled.</div>}
          {dayEvents.map(ev=><EventRow key={ev.id} ev={ev} S={S} occKey={dayKey} canEdit={canActuallyEdit} onEdit={setEditingEv} onDelete={del} onDeleteSeries={delSeries}/>)}
        </>
      }
    </div>
  </div>);
}

// ── COUNTDOWN TILES — events flagged "countdown" show big days-to-go numbers ──
// Manually-flagged countdown events, plus every birthday/anniversary coming
// up in the next 30 days — merged into one deduped, date-sorted set of tiles
// (an event flagged countdown AND a birthday only shows once). Laid out 3 per
// row; anything past 3 just flows onto additional rows below, and a tile
// drops out on its own once the date passes.
function CountdownStrip({events,S,big,setEvents,canEdit,currentUser}){
  const today=todayKey();
  const horizon=dateKey(new Date(Date.now()+30*864e5));
  const normalized=(events||[]).map(ev=>ev.repeatYearly?{...ev,date:nextOccurrence(ev,today),endDate:""}:ev);
  const manual=normalized.filter(ev=>ev.countdown&&(ev.endDate||ev.date)>=today);
  const birthdays=normalized.filter(ev=>(ev.category==="birthday"||ev.category==="anniversary")&&ev.date>=today&&ev.date<=horizon);
  const seen=new Set();
  const items=[...manual,...birthdays].filter(ev=>{
    if(seen.has(ev.id))return false;
    seen.add(ev.id);return true;
  }).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  const [popupDay,setPopupDay]=useState(null);
  // Cap the strip at 3 visible at a time and rotate through the rest —
  // otherwise a busy month wraps into extra rows and eats the TV screen.
  const pageSize=3;
  const totalPages=Math.max(1,Math.ceil(items.length/pageSize));
  const [page,setPage]=useState(0);
  useEffect(()=>{
    if(totalPages<=1)return;
    const id=setInterval(()=>setPage(p=>(p+1)%totalPages),6000);
    return()=>clearInterval(id);
  },[totalPages]);
  if(items.length===0)return null;
  const safePage=page%totalPages;
  const visible=items.slice(safePage*pageSize,safePage*pageSize+pageSize);
  return(<>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:big?14:10,marginBottom:totalPages>1?(big?6:4):14}}>
      {visible.map(ev=>{
        const days=Math.max(0,Math.round((parseKey(ev.date)-parseKey(today))/864e5));
        const o=ownerOf(ev),c=catOf(ev);
        return(<div key={ev.id} onClick={()=>setPopupDay(ev.date)} style={{cursor:"pointer",background:o.color+"14",border:`1px solid ${o.color}44`,borderRadius:12,padding:big?"14px 18px":"9px 12px",textAlign:"center"}}>
          {ev.photo&&<img src={ev.photo} alt="" style={{width:big?56:36,height:big?56:36,borderRadius:"50%",objectFit:"cover",margin:"0 auto 6px",display:"block",border:`2px solid ${o.color}`}}/>}
          <div style={{fontSize:big?16:11,color:S.T.sub,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{!ev.photo&&c.emoji+" "}{displayTitle(ev,ev.date)}</div>
          <div style={{fontSize:big?42:24,fontWeight:"bold",color:o.color,lineHeight:1.15}}>{days===0?"TODAY!":days}</div>
          {days>0&&<div style={{fontSize:big?13:10,color:S.T.sub}}>{days===1?"day to go":"days to go"} · {fmtDayShort(ev.date)}</div>}
        </div>);
      })}
    </div>
    {totalPages>1&&<div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:14}}>
      {Array.from({length:totalPages}).map((_,i)=><div key={i} style={{width:i===safePage?(big?16:10):(big?7:5),height:big?7:5,borderRadius:4,background:i===safePage?S.T.accent:S.T.border,transition:"width 0.3s,background 0.3s"}}/>)}
    </div>}
    <EventDetailPopup dayKey={popupDay} events={events} setEvents={setEvents} currentUser={currentUser} canEdit={canEdit} S={S} onClose={()=>setPopupDay(null)}/>
  </>);
}

// ── THIS WEEK'S BIRTHDAYS & ANNIVERSARIES — prominent homepage banner ─────────
// Sunday–Saturday, matching the calendar's week. Picks up both yearly-recurring
// birthdays/anniversaries (matched by month/day regardless of year) and any
// one-off event someone tagged with those categories.
function WeeklyCelebrations({events,S,big,setEvents,canEdit,currentUser}){
  const now=new Date();
  const start=new Date(now);start.setDate(now.getDate()-now.getDay());
  const days=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return dateKey(d);});
  const today=todayKey();
  const items=[];
  days.forEach(dayKey=>{
    eventsOnDay(events,dayKey).filter(ev=>ev.category==="birthday"||ev.category==="anniversary").forEach(ev=>items.push({ev,dayKey}));
  });
  const [popupDay,setPopupDay]=useState(null);
  if(items.length===0)return null;
  items.sort((a,b)=>a.dayKey<b.dayKey?-1:1);
  return(<div style={{marginBottom:big?16:14}}>
    <div style={{fontSize:big?15:12,color:S.T.sub,fontFamily:"monospace",letterSpacing:"0.12em",marginBottom:8}}>🎉 THIS WEEK</div>
    <div style={{display:"flex",gap:big?14:10,flexWrap:"wrap"}}>
      {items.map(({ev,dayKey})=>{
        const c=catOf(ev);
        const isToday=dayKey===today;
        const accent=c.key==="anniversary"?"#E91E63":"#FF9800";
        const ringColor=isToday?GOLD:accent;
        return(<div key={ev.id+dayKey} onClick={()=>setPopupDay(dayKey)} style={{cursor:"pointer",flex:`1 1 ${big?"200px":"160px"}`,background:ringColor+"14",border:`1px solid ${ringColor}55`,borderRadius:12,padding:big?"14px 16px":"10px 12px",textAlign:"center"}}>
          {ev.photo
            ?<img src={ev.photo} alt="" style={{width:big?52:36,height:big?52:36,borderRadius:"50%",objectFit:"cover",margin:"0 auto 6px",display:"block",border:`2px solid ${ringColor}`}}/>
            :<div style={{fontSize:big?28:20,marginBottom:4}}>{c.emoji}</div>}
          <div style={{fontSize:big?14:12,color:S.T.text,fontWeight:"bold"}}>{displayTitle(ev,dayKey)}</div>
          <div style={{fontSize:big?11:10,color:isToday?GOLD:S.T.sub,fontFamily:"monospace",marginTop:4,fontWeight:isToday?"bold":"normal"}}>{isToday?"TODAY":fmtDayShort(dayKey).split(",")[0]}</div>
        </div>);
      })}
    </div>
    <EventDetailPopup dayKey={popupDay} events={events} setEvents={setEvents} currentUser={currentUser} canEdit={canEdit} S={S} onClose={()=>setPopupDay(null)}/>
  </div>);
}

// ── UPCOMING EVENTS LIST (small widget for home screens) ──────────────────────
function UpcomingEvents({events,S,days=7,title="Coming Up",setEvents,canEdit,currentUser}){
  const up=upcomingEvents(events,days);
  const [popupDay,setPopupDay]=useState(null);
  if(up.length===0)return null;
  return(<div style={S.card}>
    <div style={S.h2}>{title}</div>
    {up.slice(0,8).map(ev=><EventRow key={ev.id} ev={ev} S={S} showDate onClick={()=>setPopupDay(ev.date)}/>)}
    {up.length>8&&<div style={{fontSize:11,color:S.T.sub,marginTop:6}}>+{up.length-8} more this week</div>}
    <EventDetailPopup dayKey={popupDay} events={events} setEvents={setEvents} currentUser={currentUser} canEdit={canEdit} S={S} onClose={()=>setPopupDay(null)}/>
  </div>);
}

// ── BIRTHDAY / ANNIVERSARY QUICK-ADD — just a name, type, date, optional year ──
function BirthdayQuickForm({S,onSave,onCancel}){
  const blank={title:"",category:"birthday",date:todayKey(),originYear:""};
  const [f,setF]=useState(blank);
  const [err,setErr]=useState("");
  const set=(k,v)=>{setF(x=>({...x,[k]:v}));setErr("");};
  const submit=()=>{
    if(!f.title.trim()){setErr("Give it a name.");return;}
    onSave({title:f.title.trim(),owners:["family"],category:f.category,date:f.date,endDate:"",time:"",endTime:"",notes:"",photo:"",originYear:f.originYear?+f.originYear:null,countdown:false,repeatYearly:true,repeatWeekly:false,repeatUntil:""});
    setF(blank);
  };
  return(<div style={{...S.cardSm,border:`1px solid ${S.T.accent}55`}}>
    <div style={{fontSize:14,color:S.T.accent,fontWeight:"bold",marginBottom:10}}>Add Birthday / Anniversary</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:10}}>
      <div style={{gridColumn:"1/-1"}}>
        <div style={S.label}>{f.category==="birthday"?"Whose birthday? *":"Whose/what anniversary? *"}</div>
        <input style={S.input} placeholder={f.category==="birthday"?"e.g. Mary Beth":"e.g. Brad & Mary Beth, or Our Wedding"} value={f.title} onChange={e=>set("title",e.target.value)}/>
      </div>
      <div>
        <div style={S.label}>Type</div>
        <div style={{display:"flex",gap:6}}>
          <button type="button" onClick={()=>set("category","birthday")} style={{...S.btnGhost,flex:1,textAlign:"center",background:f.category==="birthday"?S.T.accent+"22":"transparent",border:`1px solid ${f.category==="birthday"?S.T.accent:S.T.border}`,color:f.category==="birthday"?S.T.accent:S.T.sub}}>🎂 Birthday</button>
          <button type="button" onClick={()=>set("category","anniversary")} style={{...S.btnGhost,flex:1,textAlign:"center",background:f.category==="anniversary"?S.T.accent+"22":"transparent",border:`1px solid ${f.category==="anniversary"?S.T.accent:S.T.border}`,color:f.category==="anniversary"?S.T.accent:S.T.sub}}>💍 Anniversary</button>
        </div>
      </div>
      <DateField S={S} label="Date *" value={f.date} onChange={v=>set("date",v)}/>
      <div>
        <div style={S.label}>{f.category==="birthday"?"Year of Birth (optional)":"Year of Anniversary (optional)"}</div>
        <input style={S.input} type="number" placeholder="e.g. 1990" min="1900" max={new Date().getFullYear()} value={f.originYear} onChange={e=>set("originYear",e.target.value)}/>
      </div>
      {f.title.trim()&&<div style={{gridColumn:"1/-1",fontSize:12,color:S.T.accent}}>
        Will show as: <strong>{displayTitle({title:f.title.trim(),category:f.category,originYear:f.originYear?+f.originYear:null},f.date)}</strong>
      </div>}
    </div>
    {err&&<div style={{color:"#f44336",fontSize:12,marginBottom:8}}>{err}</div>}
    <div style={{display:"flex",gap:8}}>
      <button style={S.btn()} onClick={submit}>Add</button>
      <button style={S.btnGhost} onClick={onCancel}>Cancel</button>
    </div>
  </div>);
}

// ── FULL CALENDAR TAB ─────────────────────────────────────────────────────────
function CalendarTab({events,setEvents,currentUser,canEdit,S}){
  const [view,setView]=useState("month"); // "month" or "celebrations"
  const [selected,setSelected]=useState(todayKey());
  const [popupDay,setPopupDay]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const save=u=>{setEvents(u);store.save("fp2:events",u);};
  const addEvent=f=>{
    const base={title:f.title.trim(),owners:f.owners,owner:f.owners[0]||"",category:f.category,date:f.date,endDate:f.endDate||"",time:f.time||"",endTime:f.endTime||"",notes:f.notes.trim(),photo:f.photo||"",originYear:f.originYear?+f.originYear:null,countdown:!!f.countdown,repeatYearly:!!f.repeatYearly,createdBy:currentUser||""};
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
  // Celebrations: every birthday/anniversary, normalized to its next occurrence
  // (same trick upcomingEvents() uses for yearly-recurring events) so the list
  // reads as "who's coming up," not stuck on the year it was first added.
  const today=todayKey();
  const celebrations=(events||[])
    .filter(ev=>ev.category==="birthday"||ev.category==="anniversary")
    .map(ev=>ev.repeatYearly?{...ev,date:nextOccurrence(ev,today),endDate:""}:ev)
    .sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  const openDay=k=>{setSelected(k);setPopupDay(k);};
  return(<div>
    <div style={{display:"flex",gap:4,background:S.T.bg,borderRadius:10,padding:3,marginBottom:12,width:"fit-content"}}>
      <button onClick={()=>setView("month")} style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:13,background:view==="month"?S.T.accent:"transparent",color:view==="month"?"#0d0d08":S.T.sub,fontWeight:view==="month"?"bold":"normal"}}>📅 Month</button>
      <button onClick={()=>setView("celebrations")} style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:13,background:view==="celebrations"?S.T.accent:"transparent",color:view==="celebrations"?"#0d0d08":S.T.sub,fontWeight:view==="celebrations"?"bold":"normal"}}>🎂 Birthdays{celebrations.length>0?` (${celebrations.length})`:""}</button>
    </div>
    {view==="month"&&<>
      {canEdit&&!showForm&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <button style={S.btn()} onClick={()=>setShowForm(true)}>+ Add Event</button>
      </div>}
      {showForm&&<EventForm S={S} defaultDate={selected} currentUser={currentUser} onSave={addEvent} onCancel={()=>setShowForm(false)}/>}
      <div style={S.card}>
        <MonthCalendar events={events} S={S} selectedKey={selected} onSelectDay={openDay}/>
      </div>
      <UpcomingEvents events={events} S={S} days={14} title="Next 2 Weeks" setEvents={setEvents} canEdit={canEdit} currentUser={currentUser}/>
    </>}
    {view==="celebrations"&&<>
      {canEdit&&!showForm&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <button style={S.btn()} onClick={()=>setShowForm(true)}>+ Add Birthday / Anniversary</button>
      </div>}
      {showForm&&<BirthdayQuickForm S={S} onSave={addEvent} onCancel={()=>setShowForm(false)}/>}
      <div style={S.card}>
        <div style={S.h2}>All Birthdays & Anniversaries</div>
        {celebrations.length===0&&<div style={{fontSize:13,color:S.T.sub,padding:"6px 0"}}>None added yet.{canEdit?" Tap Add Birthday / Anniversary to put one here.":""}</div>}
        {celebrations.map(ev=><EventRow key={ev.id} ev={ev} S={S} showDate occKey={ev.date} onClick={()=>setPopupDay(ev.date)}/>)}
      </div>
    </>}
    <EventDetailPopup dayKey={popupDay} events={events} setEvents={setEvents} currentUser={currentUser} canEdit={canEdit} S={S} onClose={()=>setPopupDay(null)}/>
  </div>);
}

export { MonthCalendar, UpcomingEvents, EventRow, CalendarTab, CountdownStrip, WeeklyCelebrations, EventDetailPopup, eventsOnDay, upcomingEvents, todayKey, fmtDayLong };
