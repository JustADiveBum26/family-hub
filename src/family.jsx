// ── Family features: chores, message board, settings, bills, meals, ledger ────
import { useState, useEffect } from "react";
import { store } from "./store";
import { DAYS, DSHORT, MEAL_TYPES, CHORE_MASTER, USERS, GOLD, BILL_CATS, fmt, todayName, billPaid, weekKeyOf, weekKeyOffset, dateOfWeekDay, weekLabel, normalizeWeek } from "./constants";
import { DayPills } from "./shared";

// ── CHORES TAB ────────────────────────────────────────────────────────────────
function ChoresTab({chores,setChores,appSettings,S,currentUser}){
  const isParent=currentUser==="brad"||currentUser==="maryBeth";
  const [showAssign,setShowAssign]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const [editForm,setEditForm]=useState({});
  const [form,setForm]=useState({assignee:"",task:"",customTask:"",points:5,due:"",days:[]});
  const save=u=>{setChores(u);store.save("fp2:chores",u);};
  const showFor=id=>{
    if(id==="brad"&&!appSettings.showAdultChores?.brad)return false;
    if(id==="maryBeth"&&!appSettings.showAdultChores?.maryBeth)return false;
    if(id==="bradyn"&&!appSettings.showAdultChores?.bradyn)return false;
    return true;
  };
  const visibleUsers=USERS.filter(u=>showFor(u.key));
  const firstUser=visibleUsers.length>0?visibleUsers[0].key:"bradyn";
  const showPoints=appSettings.showPoints;
  const toggleDay=d=>setForm(f=>({...f,days:f.days.includes(d)?f.days.filter(x=>x!==d):[...f.days,d]}));
  const toggleEditDay=d=>setEditForm(f=>({...f,days:(f.days||[]).includes(d)?(f.days||[]).filter(x=>x!==d):[...(f.days||[]),d]}));
  const addChore=()=>{
    const task=(form.customTask||form.task||"").trim();
    if(!task)return;
    const assignee=form.assignee||firstUser;
    save([...chores,{id:Date.now(),assignee,task,points:form.points,due:form.due,days:form.days,done:false,donedays:{},createdAt:new Date().toLocaleDateString()}]);
    setForm({assignee:"",task:"",customTask:"",points:5,due:"",days:[]});
    setShowAssign(false);
  };
  const startEdit=c=>{setEditingId(c.id);setEditForm({assignee:c.assignee,task:c.task,points:c.points||5,due:c.due||"",days:c.days||[]});};
  const saveEdit=id=>{save(chores.map(c=>c.id===id?{...c,...editForm}:c));setEditingId(null);};
  const toggleDone=id=>save(chores.map(c=>c.id===id?{...c,done:!c.done,doneAt:!c.done?new Date().toLocaleDateString():null}:c));
  const del=id=>save(chores.filter(c=>c.id!==id));
  const tn=todayName();

  return(<div>
    {isParent&&<div style={{...S.row,marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:15,color:S.T.accent}}>Task Assignments</div>
      <button style={S.btn()} onClick={()=>{setShowAssign(!showAssign);if(!showAssign)setForm({assignee:firstUser,task:"",customTask:"",points:5,due:"",days:[]});}}>{showAssign?"Cancel":"Add Task"}</button>
    </div>}
    {showAssign&&isParent&&<div style={S.card}>
      <div style={S.h2}>Assign a Task</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:10}}>
        <div><div style={S.label}>Who</div><select style={S.select} value={form.assignee||firstUser} onChange={e=>setForm({...form,assignee:e.target.value})}>{visibleUsers.map(u=><option key={u.key} value={u.key}>{u.label}</option>)}</select></div>
        <div><div style={S.label}>Pick from List</div><select style={S.select} value={form.task} onChange={e=>setForm({...form,task:e.target.value,customTask:e.target.value})}><option value="">— select —</option>{CHORE_MASTER.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div><div style={S.label}>Or type custom</div><input style={S.input} placeholder="Custom task..." value={form.customTask} onChange={e=>setForm({...form,customTask:e.target.value})}/></div>
        {showPoints&&<div><div style={S.label}>Points</div><input style={S.input} type="number" value={form.points} onChange={e=>setForm({...form,points:+e.target.value})}/></div>}
        <div><div style={S.label}>One-time due date</div><input style={S.input} type="date" value={form.due} onChange={e=>setForm({...form,due:e.target.value})}/></div>
      </div>
      <div style={{marginBottom:10}}>
        <div style={S.label}>Recurring days (weekly) — pick which days it repeats</div>
        <DayPills selected={form.days} onToggle={toggleDay} S={S}/>
      </div>
      <div style={{fontSize:12,color:S.T.sub,marginBottom:10}}>Task: <strong style={{color:S.T.text}}>{form.customTask||form.task||"none yet"}</strong>{form.days.length>0?" — repeats: "+form.days.map((_,i2)=>DSHORT[DAYS.indexOf(_)]).join(", "):""}</div>
      <button style={S.btn()} onClick={addChore}>Assign Task</button>
    </div>}
    {visibleUsers.length===0&&<div style={{...S.card,textAlign:"center",padding:32,color:S.T.sub}}>No task lists active yet. Enable them in Settings.</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
      {visibleUsers.map(u=>{
        const uc=chores.filter(c=>c.assignee===u.key);
        const recurring2=uc.filter(c=>c.days&&c.days.length>0);
        const oneoff=uc.filter(c=>!c.days||c.days.length===0);
        const done=oneoff.filter(c=>c.done),todo=oneoff.filter(c=>!c.done);
        const pts=done.reduce((s,c)=>s+(c.points||0),0);
        return(<div key={u.key} style={S.card}>
          <div style={{...S.h2,...S.row}}><span>{u.emoji} {u.label}</span><div style={{display:"flex",gap:6,alignItems:"center"}}>{showPoints&&<span style={{...S.tag(u.color),fontSize:10}}>{pts} pts</span>}<span style={{fontSize:11,color:S.T.sub}}>{done.length}/{oneoff.length}</span></div></div>
          {recurring2.length>0&&<div style={{marginBottom:10}}>
            <div style={{...S.label,marginBottom:4}}>RECURRING</div>
            {recurring2.map(c=>{
              if(editingId===c.id)return(<div key={c.id} style={{padding:"8px 0",borderBottom:`1px solid ${S.T.border}`}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div><div style={S.label}>Who</div><select style={S.select} value={editForm.assignee} onChange={e=>setEditForm({...editForm,assignee:e.target.value})}>{visibleUsers.map(u2=><option key={u2.key} value={u2.key}>{u2.label}</option>)}</select></div>
                  <div><div style={S.label}>Task</div><input style={S.input} value={editForm.task} onChange={e=>setEditForm({...editForm,task:e.target.value})}/></div>
                  {showPoints&&<div><div style={S.label}>Points</div><input style={S.input} type="number" value={editForm.points} onChange={e=>setEditForm({...editForm,points:+e.target.value})}/></div>}
                  <div style={{gridColumn:"1/-1"}}><div style={S.label}>Days</div><DayPills selected={editForm.days||[]} onToggle={toggleEditDay} S={S}/></div>
                </div>
                <div style={{display:"flex",gap:6}}><button style={{...S.btn("#4CAF50"),padding:"5px 12px",fontSize:12}} onClick={()=>saveEdit(c.id)}>Save</button><button style={{...S.btnGhost,padding:"5px 10px",fontSize:12}} onClick={()=>setEditingId(null)}>Cancel</button></div>
              </div>);
              const doneToday=(c.donedays||{})[tn];
              const schedToday=c.days.includes(tn);
              return(<div key={c.id} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:`1px solid ${S.T.border}`,alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:S.T.text,marginBottom:3}}>{c.task}</div>
                  <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                    {c.days.map((d2,i2)=><span key={d2} style={{...S.tag(schedToday&&d2===tn?(doneToday?"#4CAF50":S.T.accent):S.T.sub),fontSize:9,padding:"1px 5px"}}>{DSHORT[DAYS.indexOf(d2)]}</span>)}
                  </div>
                </div>
                {schedToday&&<div style={{fontSize:10,color:doneToday?"#4CAF50":"#FF9800",fontFamily:"monospace",whiteSpace:"nowrap"}}>{doneToday?"Done":"Today"}</div>}
                {isParent&&<div style={{display:"flex",gap:4}}><button style={{...S.btnGhost,padding:"2px 7px",fontSize:10}} onClick={()=>startEdit(c)}>Edit</button><button style={S.btnDanger} onClick={()=>del(c.id)}>X</button></div>}
              </div>);
            })}
          </div>}
          {oneoff.length>0&&<div>
            <div style={{...S.label,marginBottom:4}}>ONE-TIME TASKS</div>
            {todo.map(c=>{
              if(editingId===c.id)return(<div key={c.id} style={{padding:"8px 0",borderBottom:`1px solid ${S.T.border}`}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div><div style={S.label}>Who</div><select style={S.select} value={editForm.assignee} onChange={e=>setEditForm({...editForm,assignee:e.target.value})}>{visibleUsers.map(u2=><option key={u2.key} value={u2.key}>{u2.label}</option>)}</select></div>
                  <div><div style={S.label}>Task</div><input style={S.input} value={editForm.task} onChange={e=>setEditForm({...editForm,task:e.target.value})}/></div>
                  <div><div style={S.label}>Due Date</div><input style={S.input} type="date" value={editForm.due} onChange={e=>setEditForm({...editForm,due:e.target.value})}/></div>
                  {showPoints&&<div><div style={S.label}>Points</div><input style={S.input} type="number" value={editForm.points} onChange={e=>setEditForm({...editForm,points:+e.target.value})}/></div>}
                </div>
                <div style={{display:"flex",gap:6}}><button style={{...S.btn("#4CAF50"),padding:"5px 12px",fontSize:12}} onClick={()=>saveEdit(c.id)}>Save</button><button style={{...S.btnGhost,padding:"5px 10px",fontSize:12}} onClick={()=>setEditingId(null)}>Cancel</button></div>
              </div>);
              return(<div key={c.id} style={{display:"flex",gap:8,padding:"7px 0",borderBottom:`1px solid ${S.T.border}`,alignItems:"center"}}>
                <div onClick={()=>toggleDone(c.id)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${S.T.border}`,cursor:"pointer",flexShrink:0}}/>
                <div style={{flex:1}}><div style={{fontSize:13,color:S.T.text}}>{c.task}</div>{c.due&&<div style={{fontSize:11,color:S.T.sub}}>Due: {c.due}</div>}{showPoints&&<div style={{fontSize:11,color:S.T.accent}}>{c.points} pts</div>}</div>
                {isParent&&<div style={{display:"flex",gap:4}}><button style={{...S.btnGhost,padding:"2px 7px",fontSize:10}} onClick={()=>startEdit(c)}>Edit</button><button style={S.btnDanger} onClick={()=>del(c.id)}>X</button></div>}
              </div>);
            })}
            {done.length>0&&<div style={{marginTop:6}}><div style={{...S.label,fontSize:10,marginBottom:3}}>DONE</div>{done.map(c=><div key={c.id} style={{display:"flex",gap:8,padding:"4px 0",alignItems:"center",opacity:0.45}}>
              <div onClick={()=>toggleDone(c.id)} style={{width:18,height:18,borderRadius:4,border:"2px solid #4CAF50",background:"#4CAF50",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#0d0d08",fontSize:11,fontWeight:"bold"}}>✓</div>
              <span style={{fontSize:12,color:S.T.sub,textDecoration:"line-through",flex:1}}>{c.task}</span>
              {isParent&&<button style={S.btnDanger} onClick={()=>del(c.id)}>X</button>}
            </div>)}</div>}
          </div>}
          {uc.length===0&&<div style={{fontSize:13,color:S.T.sub,textAlign:"center",padding:"12px 0"}}>No tasks assigned</div>}
        </div>);
      })}
    </div>
  </div>);
}

// ── KID CHORE VIEW ────────────────────────────────────────────────────────────
function KidChoreView({chores,setChores,userKey,userName,userColor,appSettings,S}){
  const myChores=(chores||[]).filter(c=>c.assignee===userKey);
  const recurring=myChores.filter(c=>c.days&&c.days.length>0);
  const oneoff=myChores.filter(c=>(!c.days||c.days.length===0)&&!c.done);
  const tn=todayName();
  const save=u=>{setChores(u);store.save("fp2:chores",u);};
  const toggleDayDone=(id,day)=>{
    save(chores.map(c=>{
      if(c.id!==id)return c;
      const dd={...(c.donedays||{}),[day]:!(c.donedays||{})[day]};
      return{...c,donedays:dd};
    }));
  };
  return(<div>
    {recurring.length>0&&<div style={S.card}>
      <div style={S.h2}>My Weekly Chores</div>
      {recurring.map(c=>{
        const doneToday=(c.donedays||{})[tn];
        const schedToday=c.days.includes(tn);
        return(<div key={c.id} style={{padding:"8px 0",borderBottom:`1px solid ${S.T.border}`}}>
          <div style={{...S.row,marginBottom:4}}>
            <div style={{fontSize:13,color:doneToday?"#4CAF50":S.T.text,textDecoration:doneToday?"line-through":"none"}}>{c.task}</div>
            {schedToday&&<button onClick={()=>toggleDayDone(c.id,tn)} style={{...S.btn(doneToday?"#4CAF50":userColor||S.T.accent),padding:"4px 12px",fontSize:11}}>{doneToday?"Done!":"Mark Done"}</button>}
          </div>
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
            {DAYS.map((d,i)=>c.days.includes(d)?<span key={d} style={{...S.tag((c.donedays||{})[d]?"#4CAF50":d===tn?S.T.accent:S.T.sub),fontSize:9,padding:"1px 5px"}}>{DSHORT[i]}</span>:null)}
          </div>
        </div>);
      })}
    </div>}
    {oneoff.length>0&&<div style={S.card}>
      <div style={S.h2}>My Tasks</div>
      {oneoff.map(c=><div key={c.id} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:`1px solid ${S.T.border}`,alignItems:"center"}}>
        <div style={{width:16,height:16,borderRadius:3,border:`2px solid ${S.T.border}`,flexShrink:0}}/>
        <div style={{flex:1}}><div style={{fontSize:13,color:S.T.text}}>{c.task}</div>{c.due&&<div style={{fontSize:11,color:S.T.sub}}>Due: {c.due}</div>}</div>
        {appSettings.showPoints&&<span style={{fontSize:10,color:userColor}}>{c.points||0} pts</span>}
      </div>)}
    </div>}
    {myChores.length===0&&<div style={{...S.card,textAlign:"center",padding:32,color:S.T.sub}}>No tasks assigned yet!</div>}
  </div>);
}
// ── MESSAGE BOARD ─────────────────────────────────────────────────────────────
function MessageBoard({messages,setMessages,currentUser,S}){
  const isParent=currentUser==="brad"||currentUser==="maryBeth";
  const [text,setText]=useState("");
  const save=u=>{setMessages(u);store.save("fp2:messages",u);};
  const post=()=>{
    if(!text.trim())return;
    const u=USERS.find(x=>x.key===currentUser);
    const msg={id:Date.now(),author:currentUser,authorLabel:u.label,authorEmoji:u.emoji,text:text.trim(),date:new Date().toLocaleDateString(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),approved:isParent,pinned:false};
    save([msg,...messages]);setText("");
  };
  const approve=id=>save(messages.map(m=>m.id===id?{...m,approved:true}:m));
  const pin=id=>save(messages.map(m=>m.id===id?{...m,pinned:!m.pinned}:m));
  const del=id=>save(messages.filter(m=>m.id!==id));
  const pending=messages.filter(m=>!m.approved);
  const approved=messages.filter(m=>m.approved);
  const pinned=approved.filter(m=>m.pinned);
  const rest=approved.filter(m=>!m.pinned);
  return(<div>
    {isParent&&pending.length>0&&<div style={{...S.alert(S.T.accent),marginBottom:14}}>
      <div style={{color:S.T.accent,fontWeight:"bold",marginBottom:8}}>Pending Approval ({pending.length})</div>
      {pending.map(m=><div key={m.id} style={{...S.row,padding:"8px 0",borderBottom:`1px solid ${S.T.border}`,flexWrap:"wrap",gap:8}}>
        <div><span style={{fontSize:13,color:S.T.text}}>{m.authorEmoji} {m.authorLabel}: </span><span style={{fontSize:13,color:S.T.sub}}>{m.text}</span></div>
        <div style={{display:"flex",gap:6}}><button style={{...S.btn("#4CAF50"),padding:"5px 12px",fontSize:12}} onClick={()=>approve(m.id)}>✓ Approve</button><button style={S.btnDanger} onClick={()=>del(m.id)}>✕</button></div>
      </div>)}
    </div>}
    <div style={S.card}>
      <div style={S.h2}>Family Board</div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <input style={{...S.input,flex:1}} placeholder={isParent?"Post an announcement...":"Suggest something (needs parent approval)..."} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&post()}/>
        <button style={S.btn()} onClick={post}>Post</button>
      </div>
      {!isParent&&<div style={{fontSize:11,color:S.T.sub,marginBottom:12}}>Your posts need a parent to approve before everyone can see them.</div>}
      {pinned.length>0&&<div style={{marginBottom:12}}>{pinned.map(m=><div key={m.id} style={{...S.cardSm,borderLeft:`3px solid ${S.T.accent}`,marginBottom:8}}>
        <div style={{...S.row,marginBottom:4,flexWrap:"wrap",gap:4}}>
          <span style={{fontSize:12,color:S.T.accent}}>📌 {m.authorEmoji} {m.authorLabel}</span>
          <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:10,color:S.T.sub}}>{m.date}</span>{isParent&&<><button style={{...S.btnGhost,padding:"2px 8px",fontSize:11}} onClick={()=>pin(m.id)}>Unpin</button><button style={S.btnDanger} onClick={()=>del(m.id)}>✕</button></>}</div>
        </div>
        <div style={{fontSize:14,color:S.T.text}}>{m.text}</div>
      </div>)}</div>}
      {rest.length===0&&pinned.length===0&&<div style={{textAlign:"center",padding:"24px 0",color:S.T.sub,fontSize:13}}>No announcements yet. Post something!</div>}
      {rest.map(m=><div key={m.id} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:`1px solid ${S.T.border}`,alignItems:"flex-start"}}>
        <div style={{fontSize:22,flexShrink:0}}>{m.authorEmoji}</div>
        <div style={{flex:1}}>
          <div style={{...S.row,marginBottom:2,flexWrap:"wrap",gap:4}}>
            <span style={{fontSize:12,color:S.T.accent,fontWeight:"bold"}}>{m.authorLabel}</span>
            <span style={{fontSize:10,color:S.T.sub}}>{m.date} {m.time}</span>
          </div>
          <div style={{fontSize:13,color:S.T.text}}>{m.text}</div>
        </div>
        {isParent&&<div style={{display:"flex",gap:4,flexShrink:0}}><button style={{...S.btnGhost,padding:"2px 8px",fontSize:11}} onClick={()=>pin(m.id)}>📌</button><button style={S.btnDanger} onClick={()=>del(m.id)}>✕</button></div>}
      </div>)}
    </div>
  </div>);
}

// ── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab({profile,setProfile,appSettings,setAppSettings,shopSettings,setShopSettings,payAccounts,setPayAccounts,S,currentUser}){
  const [local,setLocal]=useState({...profile});
  const [saved,setSaved]=useState(false);
  const saveProfile=()=>{setProfile(local);store.save("fp2:profile",local);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const saveSettings=u=>{setAppSettings(u);store.save("fp2:appSettings",u);};
  const toggleAdultChore=key=>{const u={...appSettings,showAdultChores:{...appSettings.showAdultChores,[key]:!appSettings.showAdultChores?.[key]}};saveSettings(u);};
  const saveShopSettings=u=>{setShopSettings(u);store.save("fp2:shopSettings",u);};
  const savePayAccounts=u=>{setPayAccounts(u);store.save("fp2:payAccounts",u);};
  const [newCat,setNewCat]=useState("");
  const [newStore,setNewStore]=useState("");
  const [newBradAcct,setNewBradAcct]=useState("");
  const [newMBAcct,setNewMBAcct]=useState("");
  const isParent=currentUser==="brad"||currentUser==="maryBeth";
  return(<div>
    {false&&<div style={S.card}>
      <div style={S.h2}>Profile</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:14}}>
        <div><div style={S.label}>Your Name</div><input style={S.input} value={local.myName} onChange={e=>setLocal({...local,myName:e.target.value})}/></div>
        <div><div style={S.label}>Partner Name</div><input style={S.input} value={local.fianceName} onChange={e=>setLocal({...local,fianceName:e.target.value})}/></div>
        <div><div style={S.label}>Your Income</div><input style={S.input} type="number" value={local.myIncome} onChange={e=>setLocal({...local,myIncome:+e.target.value})}/></div>
        <div><div style={S.label}>Partner Income</div><input style={S.input} type="number" value={local.fIncome} onChange={e=>setLocal({...local,fIncome:+e.target.value})}/></div>
        <div><div style={S.label}>Credit Score</div><input style={S.input} type="number" value={local.creditScore} onChange={e=>setLocal({...local,creditScore:+e.target.value})}/></div>
        <div><div style={S.label}>Months to PSLF</div><input style={S.input} type="number" value={local.pslfMonths} onChange={e=>setLocal({...local,pslfMonths:+e.target.value})}/></div>
      </div>
      <button style={S.btn()} onClick={saveProfile}>{saved?"✓ Saved!":"Save Profile"}</button>
    </div>}
    {isParent&&<div style={S.card}>
      <div style={S.h2}>Shopping — Stores</div>
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        <input style={{...S.input,flex:1}} placeholder="Add store (e.g. Walmart)" value={newStore} onChange={e=>setNewStore(e.target.value)}/>
        <button style={S.btn()} onClick={()=>{if(!newStore.trim())return;saveShopSettings({...shopSettings,stores:[...(shopSettings.stores||[]),newStore.trim()]});setNewStore("");}}>Add</button>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {(shopSettings.stores||[]).map(s=><div key={s} style={{display:"flex",gap:4,alignItems:"center",...S.tag(S.T.accent)}}><span>{s}</span><button onClick={()=>saveShopSettings({...shopSettings,stores:(shopSettings.stores||[]).filter(x=>x!==s)})} style={{background:"none",border:"none",color:"#f44336",cursor:"pointer",fontSize:12,padding:"0 2px"}}>×</button></div>)}
      </div>
    </div>}
    {isParent&&<div style={S.card}>
      <div style={S.h2}>Shopping — Categories</div>
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        <input style={{...S.input,flex:1}} placeholder="Add category (e.g. Frozen Foods)" value={newCat} onChange={e=>setNewCat(e.target.value)}/>
        <button style={S.btn()} onClick={()=>{if(!newCat.trim())return;saveShopSettings({...shopSettings,categories:[...(shopSettings.categories||[]),newCat.trim()]});setNewCat("");}}>Add</button>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {(shopSettings.categories||[]).map(c=><div key={c} style={{display:"flex",gap:4,alignItems:"center",...S.tag(S.T.accent)}}><span>{c}</span><button onClick={()=>saveShopSettings({...shopSettings,categories:(shopSettings.categories||[]).filter(x=>x!==c)})} style={{background:"none",border:"none",color:"#f44336",cursor:"pointer",fontSize:12,padding:"0 2px"}}>×</button></div>)}
      </div>
    </div>}
    <div style={S.card}>
      <div style={S.h2}>{currentUser==="brad"?profile.myName:profile.fianceName} — Payment Accounts</div>
      <div style={{fontSize:12,color:S.T.sub,marginBottom:10}}>These are the accounts you pay expenses from.</div>
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        <input style={{...S.input,flex:1}} placeholder="e.g. Chase Checking, Ally HYSA" value={currentUser==="brad"?newBradAcct:newMBAcct} onChange={e=>currentUser==="brad"?setNewBradAcct(e.target.value):setNewMBAcct(e.target.value)}/>
        <button style={S.btn()} onClick={()=>{
          const val=currentUser==="brad"?newBradAcct.trim():newMBAcct.trim();
          if(!val)return;
          const key=currentUser==="brad"?"brad":"maryBeth";
          savePayAccounts({...payAccounts,[key]:[...(payAccounts[key]||[]),val]});
          currentUser==="brad"?setNewBradAcct(""):setNewMBAcct("");
        }}>Add</button>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {(payAccounts[currentUser==="brad"?"brad":"maryBeth"]||[]).map(a=><div key={a} style={{display:"flex",gap:4,alignItems:"center",...S.tag("#2196F3")}}><span>{a}</span><button onClick={()=>{const key=currentUser==="brad"?"brad":"maryBeth";savePayAccounts({...payAccounts,[key]:(payAccounts[key]||[]).filter(x=>x!==a)});}} style={{background:"none",border:"none",color:"#f44336",cursor:"pointer",fontSize:12,padding:"0 2px"}}>×</button></div>)}
      </div>
      {currentUser==="brad"&&payAccounts.maryBeth?.length>0&&<div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${S.T.border}`}}>
        <div style={{fontSize:11,color:S.T.sub,marginBottom:6}}>{profile.fianceName} accounts (view only)</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{(payAccounts.maryBeth||[]).map(a=><span key={a} style={{...S.tag("#E91E63"),opacity:0.7}}>{a}</span>)}</div>
      </div>}
      {currentUser==="maryBeth"&&payAccounts.brad?.length>0&&<div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${S.T.border}`}}>
        <div style={{fontSize:11,color:S.T.sub,marginBottom:6}}>{profile.myName} accounts (view only)</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{(payAccounts.brad||[]).map(a=><span key={a} style={{...S.tag("#2196F3"),opacity:0.7}}>{a}</span>)}</div>
      </div>}
    </div>
    {isParent&&<div style={S.card}>
      <div style={S.h2}>Feature Toggles</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{...S.row,padding:"10px 0",borderBottom:`1px solid ${S.T.border}`}}>
          <div><div style={{fontSize:14,color:S.T.text}}>Points System for Chores</div><div style={{fontSize:12,color:S.T.sub}}>Show chore points on everyone's view</div></div>
          <button onClick={()=>saveSettings({...appSettings,showPoints:!appSettings.showPoints})} style={{...S.btn(appSettings.showPoints?"#4CAF50":S.T.border),padding:"7px 16px",fontSize:12}}>{appSettings.showPoints?"ON":"OFF"}</button>
        </div>
        {[{key:"brad",label:"Brad's Task List"},{key:"maryBeth",label:"Mary Beth's Task List"},{key:"bradyn",label:"Bradyn's Task List"}].map(({key,label})=><div key={key} style={{...S.row,padding:"10px 0",borderBottom:`1px solid ${S.T.border}`}}>
          <div><div style={{fontSize:14,color:S.T.text}}>{label}</div><div style={{fontSize:12,color:S.T.sub}}>Show task list for {label.split("'")[0]}</div></div>
          <button onClick={()=>toggleAdultChore(key)} style={{...S.btn(appSettings.showAdultChores?.[key]?"#4CAF50":S.T.border),padding:"7px 16px",fontSize:12}}>{appSettings.showAdultChores?.[key]?"ON":"OFF"}</button>
        </div>)}
      </div>
    </div>}
  </div>);
}

// ── ADMIN PANEL ───────────────────────────────────────────────────────────────
function AdminPanel({auth,setAuth,S}){
  const [kidPins,setKidPins]=useState({parker:"",ryder:""});
  const [resetConfirm,setResetConfirm]=useState(null);
  const [ownPwd,setOwnPwd]=useState({curr:"",next:"",confirm:""});
  const [ownErr,setOwnErr]=useState(""),[ pinOk,setPinOk]=useState({}),[ ownOk,setOwnOk]=useState(false);
  const saveAuth=u=>{setAuth(u);store.save("fp2:auth",u);};
  const setPin=kid=>{const pin=kidPins[kid];if(!/^\d{4}$/.test(pin)){alert("PIN must be exactly 4 digits.");return;}saveAuth({...auth,[kid]:pin});setPinOk({...pinOk,[kid]:true});setTimeout(()=>setPinOk(p=>({...p,[kid]:false})),2000);setKidPins({...kidPins,[kid]:""});};
  const resetPwd=user=>{saveAuth({...auth,[user]:null});setResetConfirm(null);};
  const changeOwnPwd=()=>{if(ownPwd.curr!==auth.brad){setOwnErr("Current password is wrong.");return;}if(ownPwd.next.length<4){setOwnErr("New password needs at least 4 characters.");return;}if(ownPwd.next!==ownPwd.confirm){setOwnErr("New passwords don't match.");return;}saveAuth({...auth,brad:ownPwd.next});setOwnPwd({curr:"",next:"",confirm:""});setOwnErr("");setOwnOk(true);setTimeout(()=>setOwnOk(false),2500);};
  return(<>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
      <div style={S.card}><div style={S.h2}>Kids' PIN Codes</div>
        {["parker","ryder"].map(kid=>{const u=USERS.find(x=>x.key===kid);return(<div key={kid} style={{marginBottom:18}}><div style={{...S.row,marginBottom:8}}><div style={{fontSize:14,color:S.T.text}}>{u.emoji} {u.label}</div><span style={{...S.tag(auth[kid]?"#4CAF50":"#FF9800"),fontSize:10}}>{auth[kid]?"PIN SET":"NOT SET"}</span></div><div style={{display:"flex",gap:8}}><input style={{...S.input,flex:1,letterSpacing:"0.2em"}} maxLength={4} placeholder="New 4-digit PIN" value={kidPins[kid]} onChange={e=>setKidPins({...kidPins,[kid]:e.target.value.replace(/\D/g,"").slice(0,4)})}/><button style={{...S.btn(u.color),padding:"8px 16px"}} onClick={()=>setPin(kid)}>{pinOk[kid]?"✓ Saved!":"Set PIN"}</button></div></div>);})}
      </div>
      <div style={S.card}><div style={S.h2}>Reset Passwords</div>
        <div style={{fontSize:12,color:S.T.sub,marginBottom:14}}>Resetting clears their password so they can create a new one on next login.</div>
        {["maryBeth","bradyn"].map(user=>{const u=USERS.find(x=>x.key===user);return(<div key={user} style={{...S.row,padding:"10px 0",borderBottom:`1px solid ${S.T.border}`}}><div><div style={{fontSize:14,color:S.T.text}}>{u.emoji} {u.label}</div><div style={{fontSize:11,color:S.T.sub}}>{auth[user]?"Password set":"No password yet"}</div></div>{resetConfirm===user?<div style={{display:"flex",gap:6}}><button style={{...S.btn("#f44336"),padding:"6px 12px",fontSize:12}} onClick={()=>resetPwd(user)}>Confirm Reset</button><button style={{...S.btnGhost,padding:"6px 10px"}} onClick={()=>setResetConfirm(null)}>Cancel</button></div>:<button style={{...S.btnGhost,fontSize:12}} onClick={()=>setResetConfirm(user)}>Reset</button>}</div>);})}
      </div>
    </div>
    <div style={S.card}><div style={S.h2}>Change Your Password</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,alignItems:"flex-end"}}>
        <div><div style={S.label}>Current</div><input style={S.input} type="password" value={ownPwd.curr} onChange={e=>{setOwnPwd({...ownPwd,curr:e.target.value});setOwnErr("");}}/></div>
        <div><div style={S.label}>New Password</div><input style={S.input} type="password" value={ownPwd.next} onChange={e=>{setOwnPwd({...ownPwd,next:e.target.value});setOwnErr("");}}/></div>
        <div><div style={S.label}>Confirm New</div><input style={S.input} type="password" value={ownPwd.confirm} onChange={e=>{setOwnPwd({...ownPwd,confirm:e.target.value});setOwnErr("");}}/></div>
        <button style={S.btn()} onClick={changeOwnPwd}>{ownOk?"✓ Updated!":"Update"}</button>
      </div>
      {ownErr&&<div style={{color:"#f44336",fontSize:12,marginTop:8}}>{ownErr}</div>}
    </div>
  </>);
}

// ── BILL CARD (top-level — must not be inside BillsTab) ──────────────────────
function BillCard({bill,today,togglePaid,setPaidFrom,del,profile,payAccounts,S,editingId,editForm,setEditForm,startEdit,saveEdit,cancelEdit}){
  const due=new Date(bill.dueDate+"T12:00:00"),dl=Math.ceil((due-today)/(864e5));
  const isOver=dl<0,isSoon=dl>=0&&dl<=3;
  const isShared=!bill.owner||bill.owner==="shared";
  const isBradOnly=bill.owner==="brad",isMBOnly=bill.owner==="maryBeth";
  const share=isShared?bill.amount/2:bill.amount;
  if(editingId===bill.id)return(<div style={{...S.card,borderLeft:`4px solid ${S.T.accent}`,marginBottom:8}}>
    <div style={{fontSize:13,color:S.T.accent,fontWeight:"bold",marginBottom:10}}>Edit Expense</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:12}}>
      <div><div style={S.label}>Expense Name</div><input style={S.input} value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})}/></div>
      <div><div style={S.label}>Payee</div><input style={S.input} value={editForm.payee} onChange={e=>setEditForm({...editForm,payee:e.target.value})}/></div>
      <div><div style={S.label}>Category</div><select style={S.select} value={editForm.category} onChange={e=>setEditForm({...editForm,category:e.target.value})}>{BILL_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
      <div><div style={S.label}>Who Pays</div><select style={S.select} value={editForm.owner} onChange={e=>setEditForm({...editForm,owner:e.target.value})}><option value="shared">Shared 50/50</option><option value="brad">{profile.myName} Only</option><option value="maryBeth">{profile.fianceName} Only</option></select></div>
      <div><div style={S.label}>Amount</div><input style={S.input} type="number" value={editForm.amount} onChange={e=>setEditForm({...editForm,amount:e.target.value})}/></div>
      <div><div style={S.label}>Due Date</div><input style={S.input} type="date" value={editForm.dueDate} onChange={e=>setEditForm({...editForm,dueDate:e.target.value})}/></div>
      <div><div style={S.label}>Notes</div><input style={S.input} value={editForm.notes} onChange={e=>setEditForm({...editForm,notes:e.target.value})}/></div>
    </div>
    <div style={{display:"flex",gap:8}}>
      <button style={{...S.btn("#4CAF50"),padding:"8px 18px",fontSize:13}} onClick={()=>saveEdit(bill.id)}>Save Changes</button>
      <button style={S.btnGhost} onClick={cancelEdit}>Cancel</button>
    </div>
  </div>);
  const full=isShared?(bill.bradPaid&&bill.maryBethPaid):isBradOnly?bill.bradPaid:bill.maryBethPaid;
  const edge=full?"#4CAF50":isOver?"#f44336":isSoon?"#FF9800":S.T.border;
  return(<div style={{...S.card,borderLeft:`4px solid ${edge}`,marginBottom:8}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
      <div style={{flex:1}}>
        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
          <span style={{fontSize:15,color:S.T.text,fontWeight:"bold"}}>{bill.name}</span>
          <span style={S.tag(GOLD)}>{bill.category}</span>
          {isShared&&<span style={S.tag("#2196F3")}>Shared</span>}
          {isBradOnly&&<span style={S.tag("#2196F3")}>{profile.myName} Only</span>}
          {isMBOnly&&<span style={S.tag("#E91E63")}>{profile.fianceName} Only</span>}
          {full&&<span style={S.tag("#4CAF50")}>PAID</span>}
          {isOver&&!full&&<span style={S.tag("#f44336")}>OVERDUE</span>}
          {isSoon&&!isOver&&!full&&<span style={S.tag("#FF9800")}>DUE SOON</span>}
        </div>
        <div style={{display:"flex",gap:10,fontSize:12,color:S.T.sub,flexWrap:"wrap"}}>
          {bill.payee&&<span>{bill.payee}</span>}
          <span>{due.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
          <span style={{color:isOver?"#f44336":isSoon?"#FF9800":S.T.sub}}>{isOver?Math.abs(dl)+"d overdue":dl===0?"Today":dl===1?"Tomorrow":dl+" days"}</span>
          {bill.notes&&<span>{bill.notes}</span>}
        </div>
      </div>
      <div style={{textAlign:"right"}}><div style={{fontSize:20,color:GOLD,fontFamily:"monospace",fontWeight:"bold"}}>{fmt(bill.amount)}</div>{isShared&&<div style={{fontSize:11,color:S.T.sub}}>{fmt(share)} each</div>}</div>
    </div>
    <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${S.T.border}`}}>
      {(isShared||isBradOnly)&&<div style={{marginBottom:8}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={()=>togglePaid(bill.id,"brad")} style={{flex:1,minWidth:140,padding:"8px 12px",borderRadius:7,border:`2px solid ${bill.bradPaid?"#4CAF50":"#2196F3"}`,background:bill.bradPaid?"#4CAF5018":"transparent",color:bill.bradPaid?"#4CAF50":"#2196F3",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold",textAlign:"left"}}>{bill.bradPaid?profile.myName+" Paid - "+bill.bradPaidDate:"Mark "+profile.myName+" Paid - "+fmt(share)}</button>
          <select style={{...S.select,maxWidth:160,fontSize:11}} value={bill.paidFromBrad||""} onChange={e=>setPaidFrom(bill.id,"brad",e.target.value)}>
            <option value="">From account...</option>
            {(payAccounts?.brad||[]).map(a=><option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {bill.paidFromBrad&&<div style={{fontSize:10,color:"#2196F3",marginTop:3}}>Paid from: {bill.paidFromBrad}</div>}
      </div>}
      {(isShared||isMBOnly)&&<div style={{marginBottom:8}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={()=>togglePaid(bill.id,"maryBeth")} style={{flex:1,minWidth:140,padding:"8px 12px",borderRadius:7,border:`2px solid ${bill.maryBethPaid?"#4CAF50":"#E91E63"}`,background:bill.maryBethPaid?"#4CAF5018":"transparent",color:bill.maryBethPaid?"#4CAF50":"#E91E63",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold",textAlign:"left"}}>{bill.maryBethPaid?profile.fianceName+" Paid - "+bill.maryBethPaidDate:"Mark "+profile.fianceName+" Paid - "+fmt(share)}</button>
          <select style={{...S.select,maxWidth:160,fontSize:11}} value={bill.paidFromMB||""} onChange={e=>setPaidFrom(bill.id,"maryBeth",e.target.value)}>
            <option value="">From account...</option>
            {(payAccounts?.maryBeth||[]).map(a=><option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {bill.paidFromMB&&<div style={{fontSize:10,color:"#E91E63",marginTop:3}}>Paid from: {bill.paidFromMB}</div>}
      </div>}
      <div style={{display:"flex",gap:6}}>
        <button style={{...S.btnGhost,padding:"5px 12px",fontSize:12}} onClick={()=>startEdit(bill)}>✏ Edit</button>
        <button style={S.btnDanger} onClick={()=>del(bill.id)}>X</button>
      </div>
    </div>
  </div>);
}

function SecHead({label,total,color,S}){
  return(<div style={{...S.row,margin:"14px 0 8px",flexWrap:"wrap",gap:6}}><div style={{fontSize:14,color,fontWeight:"bold",borderLeft:`3px solid ${color}`,paddingLeft:10}}>{label}</div><span style={{...S.tag(color)}}>{fmt(total)}/mo</span></div>);
}

// ── BILLS TAB ─────────────────────────────────────────────────────────────────
function BillsTab({bills,setBills,billHistory,setBillHistory,profile,payAccounts,S}){
  const blank={name:"",payee:"",category:"Utilities",amount:"",dueDate:"",notes:"",owner:"shared",paidFromBrad:"",paidFromMB:""};
  const [form,setForm]=useState(blank),[showForm,setShowForm]=useState(false),[showHistory,setShowHistory]=useState(false),[clearConfirm,setClearConfirm]=useState(false);
  const [editingId,setEditingId]=useState(null),[editForm,setEditForm]=useState({});
  const save=u=>{setBills(u);store.save("fp2:bills",u);};
  const startEdit=b=>{setEditingId(b.id);setEditForm({name:b.name,payee:b.payee||"",category:b.category,owner:b.owner||"shared",amount:String(b.amount),dueDate:b.dueDate,notes:b.notes||""});};
  const saveEdit=id=>{
    if(!editForm.name||!editForm.amount||!editForm.dueDate)return;
    save(bills.map(b=>b.id===id?{...b,name:editForm.name,payee:editForm.payee,category:editForm.category,owner:editForm.owner,amount:+editForm.amount,dueDate:editForm.dueDate,notes:editForm.notes}:b));
    setEditingId(null);
  };
  const cancelEdit=()=>setEditingId(null);
  const saveHistory=u=>{setBillHistory(u);store.save("fp2:billHistory",u);};
  const addBill=()=>{if(!form.name||!form.amount||!form.dueDate)return;save([...bills,{...form,id:Date.now(),amount:+form.amount,bradPaid:false,bradPaidDate:null,maryBethPaid:false,maryBethPaidDate:null}]);setForm(blank);setShowForm(false);};
  const togglePaid=(id,person)=>{
    const bill=bills.find(b=>b.id===id);if(!bill)return;
    const f=person==="brad"?"bradPaid":"maryBethPaid",df=person==="brad"?"bradPaidDate":"maryBethPaidDate";
    const nowPaid=!bill[f];
    save(bills.map(b=>b.id===id?{...b,[f]:nowPaid,[df]:nowPaid?new Date().toLocaleDateString():null}:b));
    if(nowPaid){
      const isShared=!bill.owner||bill.owner==="shared";
      const amt=isShared?bill.amount/2:bill.amount;
      saveHistory([{id:Date.now(),billName:bill.name,person,amount:amt,date:new Date().toLocaleDateString(),billId:id},...billHistory]);
    }
  };
  const del=id=>save(bills.filter(b=>b.id!==id));
  const setPaidFrom=(id,person,acct)=>save(bills.map(b=>b.id===id?{...b,[person==="brad"?"paidFromBrad":"paidFromMB"]:acct}:b));
  const today=new Date();
  // Fully paid bills are archived: they only appear in History, and never count
  // toward the section lists or the owed totals.
  const active=bills.filter(b=>!billPaid(b));
  const paidBills=[...bills].filter(billPaid).sort((a,b)=>new Date(b.dueDate)-new Date(a.dueDate));
  const shared=active.filter(b=>!b.owner||b.owner==="shared").sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  const bradOnly=active.filter(b=>b.owner==="brad").sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  const mbOnly=active.filter(b=>b.owner==="maryBeth").sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  const sharedTotal=shared.reduce((s,b)=>s+b.amount,0);
  const bradTotal=bradOnly.reduce((s,b)=>s+b.amount,0);
  const mbTotal=mbOnly.reduce((s,b)=>s+b.amount,0);
  const bradOwes=shared.filter(b=>!b.bradPaid).reduce((s,b)=>s+b.amount/2,0)+bradOnly.filter(b=>!b.bradPaid).reduce((s,b)=>s+b.amount,0);
  const mbOwes=shared.filter(b=>!b.maryBethPaid).reduce((s,b)=>s+b.amount/2,0)+mbOnly.filter(b=>!b.maryBethPaid).reduce((s,b)=>s+b.amount,0);
  // "Paid" tiles include archived bills so they reflect everything actually paid.
  const isSharedB=b=>!b.owner||b.owner==="shared";
  const bradPaidAmt=bills.filter(b=>isSharedB(b)&&b.bradPaid).reduce((s,b)=>s+b.amount/2,0)+bills.filter(b=>b.owner==="brad"&&b.bradPaid).reduce((s,b)=>s+b.amount,0);
  const mbPaidAmt=bills.filter(b=>isSharedB(b)&&b.maryBethPaid).reduce((s,b)=>s+b.amount/2,0)+bills.filter(b=>b.owner==="maryBeth"&&b.maryBethPaid).reduce((s,b)=>s+b.amount,0);
  return(<>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:14}}>
      {[{l:"Open Bills",v:fmt(sharedTotal+bradTotal+mbTotal),c:GOLD},{l:profile.myName+" Owes",v:fmt(bradOwes),c:"#2196F3"},{l:profile.fianceName+" Owes",v:fmt(mbOwes),c:"#E91E63"},{l:profile.myName+" Paid",v:fmt(bradPaidAmt),c:"#4CAF50"},{l:profile.fianceName+" Paid",v:fmt(mbPaidAmt),c:"#4CAF50"}].map((k,i)=><div key={i} style={{...S.card,marginBottom:0,borderTop:`3px solid ${k.c}`}}><div style={S.label}>{k.l}</div><div style={{fontSize:16,color:k.c,fontFamily:"monospace",fontWeight:"bold"}}>{k.v}</div></div>)}
    </div>
    <div style={{...S.row,marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:15,color:S.T.accent}}>Expense Tracker</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button style={S.btnGhost} onClick={()=>setShowHistory(!showHistory)}>{showHistory?"Hide History":`History${paidBills.length>0?` (${paidBills.length})`:""}`}</button><button style={S.btn()} onClick={()=>setShowForm(!showForm)}>{showForm?"Cancel":"Add Expense"}</button></div>
    </div>
    {showHistory&&<div style={S.card}>
      <div style={{...S.h2,...S.row,flexWrap:"wrap",gap:8}}>
        <span>Paid Bills ({paidBills.length})</span>
        {paidBills.length>0&&(clearConfirm
          ?<div style={{display:"flex",gap:6}}><button style={{...S.btn("#f44336"),padding:"5px 12px",fontSize:12}} onClick={()=>{save(bills.filter(b=>!billPaid(b)));setClearConfirm(false);}}>Confirm Delete All</button><button style={{...S.btnGhost,padding:"5px 10px",fontSize:12}} onClick={()=>setClearConfirm(false)}>Cancel</button></div>
          :<button style={{...S.btnDanger,fontSize:11}} onClick={()=>setClearConfirm(true)}>Delete All Paid</button>)}
      </div>
      {paidBills.length===0&&<div style={{color:S.T.sub,fontSize:13,marginBottom:12}}>Nothing fully paid yet. When a bill is marked paid by everyone responsible, it moves here automatically.</div>}
      {paidBills.map(b=>{
        const isShared2=!b.owner||b.owner==="shared";
        return(<div key={b.id} style={{...S.cardSm,borderLeft:"4px solid #4CAF50",marginBottom:8}}>
          <div style={{...S.row,flexWrap:"wrap",gap:8,alignItems:"flex-start"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
                <span style={{fontSize:14,color:S.T.text,fontWeight:"bold"}}>{b.name}</span>
                <span style={S.tag("#4CAF50")}>PAID</span>
                <span style={S.tag(GOLD)}>{b.category}</span>
              </div>
              <div style={{fontSize:11,color:S.T.sub,display:"flex",gap:10,flexWrap:"wrap"}}>
                <span>Due {new Date(b.dueDate+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                {(isShared2||b.owner==="brad")&&b.bradPaid&&<span style={{color:"#2196F3"}}>{profile.myName}: {b.bradPaidDate}{b.paidFromBrad?` · ${b.paidFromBrad}`:""}</span>}
                {(isShared2||b.owner==="maryBeth")&&b.maryBethPaid&&<span style={{color:"#E91E63"}}>{profile.fianceName}: {b.maryBethPaidDate}{b.paidFromMB?` · ${b.paidFromMB}`:""}</span>}
              </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:15,color:"#4CAF50",fontFamily:"monospace",fontWeight:"bold"}}>{fmt(b.amount)}</span>
              {(isShared2||b.owner==="brad")&&<button style={{...S.btnGhost,padding:"3px 9px",fontSize:11}} onClick={()=>togglePaid(b.id,"brad")}>↩ {profile.myName}</button>}
              {(isShared2||b.owner==="maryBeth")&&<button style={{...S.btnGhost,padding:"3px 9px",fontSize:11}} onClick={()=>togglePaid(b.id,"maryBeth")}>↩ {profile.fianceName}</button>}
              <button style={S.btnDanger} onClick={()=>del(b.id)}>✕</button>
            </div>
          </div>
        </div>);
      })}
      <div style={{...S.h2,marginTop:paidBills.length>0?16:0}}>Payment Log</div>
      {billHistory.length===0?<div style={{color:S.T.sub,fontSize:13}}>No payments logged yet.</div>:<div style={{maxHeight:300,overflowY:"auto"}}>{billHistory.map(h=><div key={h.id} style={{...S.row,padding:"5px 0",borderBottom:`1px solid ${S.T.border}`}}><div><div style={{fontSize:13,color:S.T.text}}>{h.billName}</div><div style={{fontSize:11,color:S.T.sub}}>{h.date} - {h.person==="brad"?profile.myName:profile.fianceName}</div></div><span style={{color:"#4CAF50",fontFamily:"monospace",fontWeight:"bold"}}>{fmt(h.amount)}</span></div>)}</div>}
    </div>}
    {showForm&&<div style={S.card}><div style={S.h2}>New Expense</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:12}}>
        <div><div style={S.label}>Expense Name</div><input style={S.input} placeholder="e.g. Electric Bill" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
        <div><div style={S.label}>Payee</div><input style={S.input} placeholder="e.g. Ameren" value={form.payee} onChange={e=>setForm({...form,payee:e.target.value})}/></div>
        <div><div style={S.label}>Category</div><select style={S.select} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{BILL_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><div style={S.label}>Who Pays</div><select style={S.select} value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})}><option value="shared">Shared 50/50</option><option value="brad">{profile.myName} Only</option><option value="maryBeth">{profile.fianceName} Only</option></select></div>
        <div><div style={S.label}>Amount</div><input style={S.input} type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
        <div><div style={S.label}>Due Date</div><input style={S.input} type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></div>
        <div><div style={S.label}>Notes</div><input style={S.input} placeholder="Any notes..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
      </div>
      <button style={{...S.btn(),padding:"9px 22px"}} onClick={addBill}>Add Expense</button>
    </div>}
    {active.length===0&&<div style={{...S.card,textAlign:"center",padding:40,color:S.T.sub}}>{bills.length===0?"No expenses yet. Click Add Expense to start.":"All caught up! 🎉 Every bill is paid — see History for the details."}</div>}
    {shared.length>0&&<><SecHead label="Shared Expenses - 50/50" total={sharedTotal} color="#2196F3" S={S}/>{shared.map(b=><BillCard key={b.id} bill={b} today={today} togglePaid={togglePaid} setPaidFrom={setPaidFrom} del={del} profile={profile} payAccounts={payAccounts} S={S} editingId={editingId} editForm={editForm} setEditForm={setEditForm} startEdit={startEdit} saveEdit={saveEdit} cancelEdit={cancelEdit}/>)}</>}
    {bradOnly.length>0&&<><SecHead label={profile.myName+"'s Bills"} total={bradTotal} color="#2196F3" S={S}/>{bradOnly.map(b=><BillCard key={b.id} bill={b} today={today} togglePaid={togglePaid} setPaidFrom={setPaidFrom} del={del} profile={profile} payAccounts={payAccounts} S={S} editingId={editingId} editForm={editForm} setEditForm={setEditForm} startEdit={startEdit} saveEdit={saveEdit} cancelEdit={cancelEdit}/>)}</>}
    {mbOnly.length>0&&<><SecHead label={profile.fianceName+"'s Bills"} total={mbTotal} color="#E91E63" S={S}/>{mbOnly.map(b=><BillCard key={b.id} bill={b} today={today} togglePaid={togglePaid} setPaidFrom={setPaidFrom} del={del} profile={profile} payAccounts={payAccounts} S={S} editingId={editingId} editForm={editForm} setEditForm={setEditForm} startEdit={startEdit} saveEdit={saveEdit} cancelEdit={cancelEdit}/>)}</>}
  </>);
}

// ── MEALS TAB ─────────────────────────────────────────────────────────────────
// ── MEAL DETAIL MODAL (top-level component — must NOT be inside MealsTab) ─────
function MealDetailModal({detailSlot,setDetailSlot,mealPlan,mealDetails,shopList,saveDetails,saveShop,onClearMeal,S}){
  const [newIngs,setNewIngs]=useState([{id:1,name:"",qty:"1"},{id:2,name:"",qty:"1"},{id:3,name:"",qty:"1"},{id:4,name:"",qty:"1"},{id:5,name:"",qty:"1"}]);
  const blankIng=()=>({id:Date.now()+Math.random(),name:"",qty:"1"});
  const updateNewIng=(i,field,val)=>setNewIngs(rows=>rows.map((r,ri)=>ri===i?{...r,[field]:val}:r));
  const addNewIngRow=()=>setNewIngs(rows=>[...rows,blankIng()]);
  const removeNewIngRow=i=>setNewIngs(rows=>rows.filter((_,ri)=>ri!==i));
  const slotKey=(day,mt)=>day+"__"+mt;
  const getDetail=(key)=>mealDetails[key]||{ingredients:[],recipe:""};
  const updateDetail=(key,patch)=>{saveDetails({...mealDetails,[key]:{...getDetail(key),...patch}});};
  const addIngredient=(key,ing)=>{const d=getDetail(key);updateDetail(key,{ingredients:[...d.ingredients,{id:Date.now(),...ing}]});};
  const delIngredient=(key,id)=>{const d=getDetail(key);updateDetail(key,{ingredients:d.ingredients.filter(i=>i.id!==id)});};
  const addIngToShop=(ing)=>{
    if(!shopList.find(i=>i.name.toLowerCase()===ing.name.toLowerCase()&&!i.checked)){
      saveShop([...shopList,{id:Date.now(),name:ing.name,qty:ing.qty||"1",category:"Grocery",addedBy:"Meal Plan",checked:false,notes:""}]);
    }
  };
  const addAllIngsToShop=(key)=>{const d=getDetail(key);d.ingredients.forEach(ing=>addIngToShop(ing));};
  const saveNewIngs=(key)=>{
    const valid=newIngs.filter(r=>r.name.trim());
    if(!valid.length)return;
    const d=getDetail(key);
    updateDetail(key,{ingredients:[...d.ingredients,...valid.map(r=>({id:Date.now()+Math.random(),name:r.name.trim(),qty:r.qty||"1"}))]});
    setNewIngs([blankIng(),blankIng(),blankIng(),blankIng(),blankIng()]);
  };
  if(!detailSlot)return null;
  const key=detailSlot.key||slotKey(detailSlot.day,detailSlot.mt);
  const headerTop=detailSlot.day?detailSlot.day.toUpperCase()+" — "+detailSlot.mt.toUpperCase():(detailSlot.sublabel||"MEAL SUGGESTION");
  const mealName=detailSlot.label||(detailSlot.day?mealPlan[detailSlot.day]?.[detailSlot.mt]:"")||"";
  const detail=getDetail(key);
  const shopNames=new Set(shopList.filter(i=>!i.checked).map(i=>i.name.toLowerCase()));
  const close=()=>{setDetailSlot(null);setNewIngs([blankIng(),blankIng(),blankIng(),blankIng(),blankIng()]);};
  const currentRecipe=detail.recipe||"";
  const readyCount=newIngs.filter(r=>r.name.trim()).length;
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={close}>
    <div style={{background:S.T.card,border:`1px solid ${S.T.border}`,borderRadius:14,padding:24,maxWidth:580,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{...S.row,marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:10,color:S.T.sub,fontFamily:"monospace",letterSpacing:"0.15em"}}>{headerTop}</div>
          <div style={{fontSize:18,color:S.T.text,fontWeight:"bold"}}>{mealName||"No meal set"}</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button style={{...S.btn("#4CAF50"),padding:"6px 12px",fontSize:12}} onClick={()=>addAllIngsToShop(key)} disabled={detail.ingredients.length===0}>Add All to List</button>
          {onClearMeal&&detailSlot.day&&mealName&&<button style={{...S.btnDanger,padding:"6px 12px",fontSize:12}} onClick={()=>{onClearMeal(detailSlot.day,detailSlot.mt);close();}}>Clear Meal</button>}
          <button style={{...S.btnGhost,padding:"6px 12px",fontSize:12}} onClick={close}>Close</button>
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <div style={S.h2}>Saved Ingredients</div>
        {detail.ingredients.length===0&&<div style={{fontSize:13,color:S.T.sub,marginBottom:8}}>None saved yet.</div>}
        {detail.ingredients.map(ing=>{
          const onList=shopNames.has(ing.name.toLowerCase());
          return(<div key={ing.id} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:`1px solid ${S.T.border}`,alignItems:"center"}}>
            <div style={{flex:1,fontSize:13,color:S.T.text}}>{ing.qty&&ing.qty!=="1"?ing.qty+" ":""}{ing.name}</div>
            <button onClick={()=>addIngToShop(ing)} style={{...S.btn(onList?"#4CAF50":S.T.accent),padding:"3px 10px",fontSize:11,opacity:onList?0.6:1}}>{onList?"On List":"+ List"}</button>
            <button onClick={()=>delIngredient(key,ing.id)} style={S.btnDanger}>X</button>
          </div>);
        })}
        <div style={{marginTop:12}}>
          <div style={{...S.h2,marginBottom:8}}>Add Ingredients</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${S.T.border}`}}>
              <th style={{...S.label,textAlign:"left",padding:"3px 4px",fontWeight:"normal"}}>Ingredient</th>
              <th style={{...S.label,textAlign:"left",padding:"3px 4px",fontWeight:"normal",width:70}}>Qty</th>
              <th style={{width:26}}></th>
            </tr></thead>
            <tbody>{newIngs.map((row,i)=><tr key={row.id}>
              <td style={{padding:"3px 4px 3px 0"}}><input style={{...S.input,padding:"5px 8px"}} placeholder="e.g. Chicken breast" value={row.name} onChange={e=>updateNewIng(i,"name",e.target.value)}/></td>
              <td style={{padding:"3px 4px"}}><input style={{...S.input,padding:"5px 8px"}} placeholder="1" value={row.qty} onChange={e=>updateNewIng(i,"qty",e.target.value)}/></td>
              <td style={{padding:"3px 0 3px 4px"}}><button onClick={()=>removeNewIngRow(i)} style={{...S.btnDanger,padding:"4px 6px"}}>×</button></td>
            </tr>)}</tbody>
          </table>
          <div style={{display:"flex",gap:8,marginTop:8,justifyContent:"space-between",alignItems:"center"}}>
            <button style={{...S.btnGhost,fontSize:12,padding:"5px 10px"}} onClick={addNewIngRow}>+ Add Row</button>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {readyCount>0&&<span style={{fontSize:11,color:S.T.sub}}>{readyCount} ingredient{readyCount!==1?"s":""} ready</span>}
              <button style={{...S.btn(),padding:"7px 16px",fontSize:12}} onClick={()=>saveNewIngs(key)} disabled={readyCount===0}>Save Ingredients</button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div style={S.h2}>Recipe / Instructions</div>
        <textarea style={{...S.input,height:160,resize:"vertical",lineHeight:1.5}} placeholder="Type or paste your recipe steps here..." defaultValue={currentRecipe} onBlur={e=>updateDetail(key,{recipe:e.target.value})}/>
        <div style={{fontSize:11,color:S.T.sub,marginTop:4}}>Changes save automatically when you click away.</div>
      </div>
    </div>
  </div>);
}

// ── MEALS TAB ─────────────────────────────────────────────────────────────────
function MealsTab({mealPlans,setMealPlans,shopList,setShopList,mealSuggestions,setMealSuggestions,shopRequests,setShopRequests,mealDetails,setMealDetails,shopSettings,profile,S}){
  // Week navigation: plans are stored per week (keyed by Monday's date), so the
  // family can plan next week and look back at past menus.
  const curWk=weekKeyOf();
  const [wk,setWk]=useState(curWk);
  const mealPlan=normalizeWeek(mealPlans[wk]);
  const isCur=wk===curWk,isNext=wk===weekKeyOffset(curWk,1),isPast=wk<curWk;
  const weekTitle=isCur?"This Week":isNext?"Next Week":isPast?"Past Week":"Week of "+weekLabel(wk).split(" – ")[0];
  const [editCell,setEditCell]=useState(null),[cellVal,setCellVal]=useState("");
  const [showAdd,setShowAdd]=useState(false),[newItem,setNewItem]=useState({name:"",qty:"1",category:"Grocery",store:"",notes:""});
  const [addMode,setAddMode]=useState("single");
  const cats=shopSettings?.categories||["Grocery","Dairy","Produce","Meat","Snacks","Beverages","Household","Personal Care","Other"];
  const stores=shopSettings?.stores||["Walmart","Kroger","Target","Costco","Aldi","Other"];
  const blankRow=()=>({id:Date.now()+Math.random(),name:"",qty:"1",category:cats[0]||"Grocery",store:""});
  const [bulkRows,setBulkRows]=useState([blankRow(),blankRow(),blankRow(),blankRow(),blankRow()]);
  const updateRow=(i,field,val)=>setBulkRows(rows=>rows.map((r,ri)=>ri===i?{...r,[field]:val}:r));
  const addRow=()=>setBulkRows(rows=>[...rows,blankRow()]);
  const removeRow=i=>setBulkRows(rows=>rows.filter((_,ri)=>ri!==i));
  const addBulk=()=>{
    const valid=bulkRows.filter(r=>r.name.trim());
    if(!valid.length)return;
    saveShop([...shopList,...valid.map(r=>({...r,name:r.name.trim(),id:Date.now()+Math.random(),addedBy:"Parents",checked:false,notes:""}))]);
    setBulkRows([blankRow(),blankRow(),blankRow(),blankRow(),blankRow()]);
    setShowAdd(false);
  };
  const [filterCat,setFilterCat]=useState("All");
  const [filterStore,setFilterStore]=useState("All");
  const [detailSlot,setDetailSlot]=useState(null);
  const saveWeek=(wkKey,weekPlan)=>{const u={...mealPlans,[wkKey]:weekPlan};setMealPlans(u);store.save("fp2:mealPlans",u);};
  const saveMeals=u=>saveWeek(wk,u);
  const saveShop=u=>{setShopList(u);store.save("fp2:shopList",u);};
  const saveSugg=u=>{setMealSuggestions(u);store.save("fp2:mealSuggestions",u);};
  const saveReqs=u=>{setShopRequests(u);store.save("fp2:shopRequests",u);};
  const saveDetails=u=>{setMealDetails(u);store.save("fp2:mealDetails",u);};
  const saveCell=()=>{if(!editCell)return;saveMeals({...mealPlan,[editCell.day]:{...mealPlan[editCell.day],[editCell.mt]:cellVal}});setEditCell(null);setCellVal("");};
  const clearCell=(day,mt)=>{saveMeals({...mealPlan,[day]:{...mealPlan[day],[mt]:""}});};
  const addItem=()=>{if(!newItem.name)return;saveShop([...shopList,{...newItem,id:Date.now(),addedBy:"Parents",checked:false}]);setNewItem({name:"",qty:"1",category:"Grocery",store:"",notes:""});setShowAdd(false);};
  const toggleItem=id=>saveShop(shopList.map(i=>i.id===id?{...i,checked:!i.checked}:i));
  const delItem=id=>saveShop(shopList.filter(i=>i.id!==id));
  const approveSugg=id=>{
    const s=mealSuggestions.find(x=>x.id===id);
    if(!s)return;
    // Suggestions from Parker/Ryder use dayPreference (a day name → this week).
    // Suggestions from Bradyn use suggestDate (an actual date → its own week).
    let targetDay=s.dayPreference&&s.dayPreference!=="Any day"?s.dayPreference:null;
    let targetWk=curWk;
    if(!targetDay&&s.suggestDate){
      const d=new Date(s.suggestDate+"T12:00:00");
      targetDay=DAYS[d.getDay()===0?6:d.getDay()-1];
      targetWk=weekKeyOf(d);
    }
    if(targetDay){
      const plan=normalizeWeek(mealPlans[targetWk]);
      saveWeek(targetWk,{...plan,[targetDay]:{...plan[targetDay],[s.mealType]:s.meal}});
      // Carry over any ingredients/recipe the kid attached to their suggestion onto the real grid slot
      const suggKey="sugg_"+s.id;
      const suggDetail=mealDetails[suggKey];
      if(suggDetail&&(suggDetail.ingredients?.length>0||suggDetail.recipe?.trim())){
        const gridKey=targetWk+"__"+targetDay+"__"+s.mealType;
        saveDetails({...mealDetails,[gridKey]:suggDetail});
      }
    }
    saveSugg(mealSuggestions.map(x=>x.id===id?{...x,status:"approved"}:x));
  };
  const declineSugg=id=>saveSugg(mealSuggestions.map(s=>s.id===id?{...s,status:"declined"}:s));
  const approveReq=id=>{const r=shopRequests.find(x=>x.id===id);if(r){saveShop([...shopList,{id:Date.now(),name:r.item,qty:r.qty||"1",category:"Grocery",addedBy:r.kidName,checked:false,notes:r.notes||""}]);saveReqs(shopRequests.map(x=>x.id===id?{...x,status:"added"}:x));}};
  const declineReq=id=>saveReqs(shopRequests.map(r=>r.id===id?{...r,status:"declined"}:r));
  const pendS=mealSuggestions.filter(s=>s.status==="pending"),pendR=shopRequests.filter(r=>r.status==="pending");
  const unchecked=shopList.filter(i=>!i.checked),checked=shopList.filter(i=>i.checked);
  const filteredItems=unchecked.filter(i=>(filterStore==="All"||i.store===filterStore)&&(filterCat==="All"||i.category===filterCat));
  const groupedByStore=filterStore==="All"
    ?[...new Set(filteredItems.map(i=>i.store||"No Store"))].reduce((acc,s)=>{const items=filteredItems.filter(i=>(i.store||"No Store")===s);if(items.length>0)acc[s]=items;return acc;},{})
    :{[filterStore]:filteredItems};
  const groupedUnchecked=Object.fromEntries(Object.entries(groupedByStore).map(([s,items])=>[s,cats.reduce((acc,cat)=>{const ci=items.filter(i=>i.category===cat);if(ci.length>0)acc[cat]=ci;return acc;},{})]));
  // Recipe/ingredient details are stored per week. Recipes saved before dated
  // weeks existed used day-only keys — keep using those until a weeked one exists.
  const slotKey=(day,mt)=>{const wkKey=wk+"__"+day+"__"+mt;if(mealDetails[wkKey])return wkKey;const legacy=day+"__"+mt;return mealDetails[legacy]?legacy:wkKey;};
  const hasDetail=(day,mt)=>{const d=mealDetails[slotKey(day,mt)];return d&&(d.ingredients?.length>0||d.recipe?.trim());};
  return(<>
    <MealDetailModal detailSlot={detailSlot} setDetailSlot={setDetailSlot} mealPlan={mealPlan} mealDetails={mealDetails} shopList={shopList} saveDetails={saveDetails} saveShop={saveShop} onClearMeal={clearCell} S={S}/>
    {(pendS.length>0||pendR.length>0)&&<div style={{...S.alert(GOLD),marginBottom:14}}><span style={{color:GOLD,fontWeight:"bold"}}>★ {pendS.length+pendR.length} pending request{pendS.length+pendR.length!==1?"s":""} from the kids — </span><span style={{color:S.T.sub,fontSize:13}}>scroll down to review</span></div>}
    <div style={S.card}>
      <div style={{...S.row,flexWrap:"wrap",gap:8,marginBottom:10}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button style={{...S.btnGhost,padding:"7px 14px",fontSize:15,lineHeight:1}} onClick={()=>setWk(weekKeyOffset(wk,-1))}>‹</button>
          <div style={{textAlign:"center",minWidth:130}}>
            <div style={{fontSize:15,color:isPast?S.T.sub:S.T.accent,fontWeight:"bold"}}>{weekTitle}</div>
            <div style={{fontSize:11,color:S.T.sub,fontFamily:"monospace"}}>{weekLabel(wk)}</div>
          </div>
          <button style={{...S.btnGhost,padding:"7px 14px",fontSize:15,lineHeight:1}} onClick={()=>setWk(weekKeyOffset(wk,1))}>›</button>
          {!isCur&&<button style={{...S.btnGhost,padding:"7px 12px",fontSize:12}} onClick={()=>setWk(curWk)}>Back to Today</button>}
        </div>
        <div style={{fontSize:11,color:S.T.sub}}>{isPast?"Browsing past menus — edits still save":"Click a meal name to add ingredients or a recipe"}</div>
      </div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:620}}>
        <thead><tr><th style={{width:90,padding:"8px 8px",textAlign:"left",color:S.T.sub,fontSize:11,fontFamily:"monospace",borderBottom:`1px solid ${S.T.border}`}}></th>{DAYS.map((d,di)=>{const isToday=isCur&&d===todayName();return(<th key={d} style={{padding:"6px 4px",textAlign:"center",borderBottom:`1px solid ${S.T.border}`,fontFamily:"Georgia,serif",fontWeight:"normal",minWidth:80,background:isToday?GOLD+"14":"transparent"}}><div style={{fontSize:9,color:isToday?GOLD:S.T.sub,fontFamily:"monospace",letterSpacing:"0.1em"}}>{d.slice(0,3).toUpperCase()}</div><div style={{fontSize:12,color:isToday?GOLD:S.T.text,fontWeight:isToday?"bold":"normal"}}>{dateOfWeekDay(wk,di).toLocaleDateString("en-US",{month:"numeric",day:"numeric"})}</div></th>);})}</tr></thead>
        <tbody>{MEAL_TYPES.map(mt=><tr key={mt}><td style={{padding:"6px 8px",fontSize:10,color:S.T.sub,fontFamily:"monospace",borderRight:`1px solid ${S.T.border}`,whiteSpace:"nowrap",minWidth:90}}>{mt==="Breakfast"?"🌅":mt==="Lunch"?"☀️":"🌙"} {mt}</td>{DAYS.map(day=>{const val=mealPlan[day]?.[mt]||"",isEdit=editCell?.day===day&&editCell?.mt===mt,hasDet=hasDetail(day,mt);return(<td key={day} style={{padding:3,borderBottom:`1px solid #1a1a0f`,verticalAlign:"top"}}>
          {isEdit
            ?<div><input autoFocus style={{...S.input,fontSize:12,padding:"5px 7px"}} value={cellVal} onChange={e=>setCellVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveCell();if(e.key==="Escape"){setEditCell(null);setCellVal("");}}}/><div style={{display:"flex",gap:4,marginTop:3}}><button style={{...S.btn(),padding:"3px 8px",fontSize:11}} onClick={saveCell}>OK</button><button style={{...S.btnGhost,padding:"3px 8px",fontSize:11}} onClick={()=>{setEditCell(null);setCellVal("");}}>X</button></div></div>
            :<div style={{minHeight:38,padding:"5px 6px",borderRadius:5}}>
              {val
                ?<div>
                  <div onClick={()=>setDetailSlot({day,mt,key:slotKey(day,mt)})} style={{fontSize:11,color:S.T.text,cursor:"pointer",marginBottom:2,textDecoration:"underline",textDecorationStyle:"dotted"}}>{val}</div>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    {hasDet&&<span style={{fontSize:9,color:"#4CAF50",fontFamily:"monospace"}}>📋</span>}
                    <span onClick={()=>{setEditCell({day,mt});setCellVal(val);}} style={{fontSize:9,color:S.T.sub,cursor:"pointer"}}>✏ edit</span>
                    <span onClick={()=>clearCell(day,mt)} style={{fontSize:9,color:"#f44336",cursor:"pointer"}}>✕ del</span>
                  </div>
                </div>
                :<div onClick={()=>{setEditCell({day,mt});setCellVal("");}} style={{cursor:"pointer",color:"#2a2a18",fontSize:10,textAlign:"center",paddingTop:6}}>+</div>
              }
            </div>
          }
        </td>);})}</tr>)}</tbody>
      </table></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
      <div style={S.card}>
        <div style={{...S.h2,...S.row,flexWrap:"wrap",gap:8}}>
          <span>Shopping List</span>
          <div style={{display:"flex",gap:6}}>
            {showAdd&&<div style={{display:"flex",gap:4,background:S.T.bg,borderRadius:8,padding:3}}>
              <button onClick={()=>setAddMode("single")} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontFamily:"Georgia,serif",background:addMode==="single"?GOLD:"transparent",color:addMode==="single"?"#0d0d08":S.T.sub}}>Single</button>
              <button onClick={()=>setAddMode("bulk")} style={{padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontFamily:"Georgia,serif",background:addMode==="bulk"?GOLD:"transparent",color:addMode==="bulk"?"#0d0d08":S.T.sub}}>Bulk</button>
            </div>}
            <button style={S.btn()} onClick={()=>{setShowAdd(!showAdd);setBulkRows([blankRow(),blankRow(),blankRow(),blankRow(),blankRow()])}}>{showAdd?"Cancel":"Add Item"}</button>
          </div>
        </div>
        {showAdd&&addMode==="single"&&<div style={{marginBottom:14,padding:12,background:S.T.bg,borderRadius:8}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:8}}>
            <div><div style={S.label}>Item</div><input style={S.input} placeholder="e.g. Milk" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})}/></div>
            <div><div style={S.label}>Qty</div><input style={S.input} value={newItem.qty} onChange={e=>setNewItem({...newItem,qty:e.target.value})}/></div>
            <div><div style={S.label}>Category</div><select style={S.select} value={newItem.category} onChange={e=>setNewItem({...newItem,category:e.target.value})}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><div style={S.label}>Store</div><select style={S.select} value={newItem.store} onChange={e=>setNewItem({...newItem,store:e.target.value})}><option value="">Any store</option>{stores.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div style={{display:"flex",gap:8}}><input style={{...S.input,flex:1}} placeholder="Notes" value={newItem.notes} onChange={e=>setNewItem({...newItem,notes:e.target.value})}/><button style={S.btn()} onClick={addItem}>Add</button></div>
        </div>}
        {showAdd&&addMode==="bulk"&&<div style={{marginBottom:14,padding:12,background:S.T.bg,borderRadius:8}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:420}}>
              <thead><tr style={{borderBottom:`1px solid ${S.T.border}`}}><th style={{...S.label,textAlign:"left",padding:"4px 6px",fontWeight:"normal"}}>Item *</th><th style={{...S.label,textAlign:"left",padding:"4px 6px",fontWeight:"normal",width:60}}>Qty</th><th style={{...S.label,textAlign:"left",padding:"4px 6px",fontWeight:"normal",width:120}}>Category</th><th style={{...S.label,textAlign:"left",padding:"4px 6px",fontWeight:"normal",width:120}}>Store</th><th style={{width:28}}></th></tr></thead>
              <tbody>
                {bulkRows.map((row,i)=><tr key={row.id}>
                  <td style={{padding:"4px 4px 4px 0"}}><input style={{...S.input,padding:"6px 8px"}} placeholder="Item name" value={row.name} onChange={e=>updateRow(i,"name",e.target.value)}/></td>
                  <td style={{padding:"4px 4px"}}><input style={{...S.input,padding:"6px 8px"}} value={row.qty} onChange={e=>updateRow(i,"qty",e.target.value)}/></td>
                  <td style={{padding:"4px 4px"}}><select style={{...S.select,padding:"6px 8px"}} value={row.category} onChange={e=>updateRow(i,"category",e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select></td>
                  <td style={{padding:"4px 4px"}}><select style={{...S.select,padding:"6px 8px"}} value={row.store} onChange={e=>updateRow(i,"store",e.target.value)}><option value="">Any</option>{stores.map(s=><option key={s}>{s}</option>)}</select></td>
                  <td style={{padding:"4px 0 4px 4px"}}><button onClick={()=>removeRow(i)} style={{...S.btnDanger,padding:"5px 7px"}}>×</button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div style={{display:"flex",gap:8,marginTop:10,justifyContent:"space-between",alignItems:"center"}}>
            <button style={{...S.btnGhost,fontSize:12,padding:"6px 12px"}} onClick={addRow}>+ Add Row</button>
            <div style={{display:"flex",gap:8}}>
              <div style={{fontSize:11,color:S.T.sub,alignSelf:"center"}}>{bulkRows.filter(r=>r.name.trim()).length} item{bulkRows.filter(r=>r.name.trim()).length!==1?"s":""} ready</div>
              <button style={{...S.btn("#4CAF50"),padding:"8px 18px"}} onClick={addBulk}>Add All to List</button>
            </div>
          </div>
        </div>}
        <div style={{marginBottom:8}}>
          <div style={{...S.label,marginBottom:4}}>Filter by Store</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
            {["All",...stores].map(s=><button key={s} onClick={()=>setFilterStore(s)} style={{padding:"2px 8px",borderRadius:8,fontSize:10,cursor:"pointer",fontFamily:"Georgia,serif",background:filterStore===s?"#2196F333":"transparent",border:`1px solid ${filterStore===s?"#2196F3":S.T.border}`,color:filterStore===s?"#2196F3":S.T.sub}}>{s}</button>)}
          </div>
          <div style={{...S.label,marginBottom:4}}>Filter by Category</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {["All",...cats].map(c=><button key={c} onClick={()=>setFilterCat(c)} style={{padding:"2px 8px",borderRadius:8,fontSize:10,cursor:"pointer",fontFamily:"Georgia,serif",background:filterCat===c?GOLD+"33":"transparent",border:`1px solid ${filterCat===c?GOLD:S.T.border}`,color:filterCat===c?GOLD:S.T.sub}}>{c}</button>)}
          </div>
        </div>
        {unchecked.length===0&&checked.length===0&&<div style={{color:S.T.sub,fontSize:13,padding:"10px 0",textAlign:"center"}}>List is empty.</div>}
        {Object.entries(groupedUnchecked).map(([storeName,catGroups])=><div key={storeName} style={{marginBottom:12}}>
          <div style={{fontSize:12,color:"#2196F3",fontWeight:"bold",fontFamily:"monospace",letterSpacing:"0.1em",padding:"6px 0 4px",borderBottom:`2px solid #2196F333`,marginBottom:6}}>🛒 {storeName}</div>
          {Object.entries(catGroups).map(([cat,items])=>items.length>0&&<div key={cat}><div style={{...S.label,marginTop:6,marginBottom:3,fontSize:10}}>{cat}</div>{items.map(item=><div key={item.id} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:`1px solid #1a1a0f`,alignItems:"center"}}><div onClick={()=>toggleItem(item.id)} style={{width:17,height:17,borderRadius:3,border:`2px solid ${S.T.border}`,cursor:"pointer",flexShrink:0}}/><div style={{flex:1}}><div style={{fontSize:13,color:S.T.text}}>{item.qty&&item.qty!=="1"?item.qty+"x ":""}{item.name}</div>{(item.addedBy&&item.addedBy!=="Parents"||item.notes)?<div style={{fontSize:10,color:S.T.sub}}>{item.addedBy&&item.addedBy!=="Parents"?item.addedBy:""}{item.notes?" — "+item.notes:""}</div>:null}</div><button style={S.btnDanger} onClick={()=>delItem(item.id)}>X</button></div>)}</div>)}
        </div>)}
        {checked.length>0&&<div style={{marginTop:8}}><div style={{...S.label,marginBottom:4}}>DONE</div>{checked.map(item=><div key={item.id} style={{display:"flex",gap:8,padding:"4px 0",alignItems:"center",opacity:0.45}}><div onClick={()=>toggleItem(item.id)} style={{width:17,height:17,borderRadius:3,border:"2px solid #4CAF50",background:"#4CAF50",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#0d0d08",fontSize:10,fontWeight:"bold"}}>✓</div><span style={{fontSize:12,color:S.T.sub,textDecoration:"line-through",flex:1}}>{item.name}</span><button style={S.btnDanger} onClick={()=>delItem(item.id)}>X</button></div>)}<button style={{...S.btnGhost,marginTop:6,fontSize:11}} onClick={()=>saveShop(shopList.filter(i=>!i.checked))}>Clear Done</button></div>}
      </div>
      <div>
        {pendS.length>0&&<div style={S.card}><div style={S.h2}>Meal Suggestions from Kids</div>{pendS.map(s=><div key={s.id} style={{padding:"8px 0",borderBottom:`1px solid ${S.T.border}`}}><div style={{...S.row,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:14,color:S.T.text,fontWeight:"bold"}}>{s.meal}</div><div style={{fontSize:11,color:S.T.sub,marginTop:1}}>{s.kidName} — {s.suggestDate?new Date(s.suggestDate+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):s.dayPreference} {s.mealType}{s.notes?" — "+s.notes:""}</div></div><div style={{display:"flex",gap:6}}><button style={{...S.btn("#4CAF50"),padding:"5px 10px",fontSize:12}} onClick={()=>approveSugg(s.id)}>Add</button><button style={S.btnDanger} onClick={()=>declineSugg(s.id)}>X</button></div></div></div>)}</div>}
        {pendR.length>0&&<div style={S.card}><div style={S.h2}>Shopping Requests from Kids</div>{pendR.map(r=><div key={r.id} style={{padding:"8px 0",borderBottom:`1px solid ${S.T.border}`}}><div style={{...S.row,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:14,color:S.T.text,fontWeight:"bold"}}>{r.qty&&r.qty!=="1"?r.qty+"x ":""}{r.item}</div><div style={{fontSize:11,color:S.T.sub,marginTop:1}}>{r.kidName}{r.notes?" — "+r.notes:""}</div></div><div style={{display:"flex",gap:6}}><button style={{...S.btn("#4CAF50"),padding:"5px 10px",fontSize:12}} onClick={()=>approveReq(r.id)}>Add</button><button style={S.btnDanger} onClick={()=>declineReq(r.id)}>X</button></div></div></div>)}</div>}
        {pendS.length===0&&pendR.length===0&&<div style={{...S.card,textAlign:"center",padding:28,color:S.T.sub}}><div style={{fontSize:22,marginBottom:6}}>All clear!</div><div style={{fontSize:13}}>No pending requests from the kids.</div></div>}
      </div>
    </div>
  </>);
}

// ── BRADYN LEDGER (Brad <-> Bradyn private tracking, not part of shared Expenses) ─
function BradynLedger({ledger,setLedger,currentUser,S}){
  const isParent=currentUser==="brad";
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",type:"recurring",defaultAmount:"",paymentsRemaining:"",dueDate:"",notes:""});
  const save=u=>{setLedger(u);store.save("fp2:bradynLedger",u);};
  const monthKey=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");};
  const addMonth=(dateStr)=>{
    if(!dateStr)return dateStr;
    const d=new Date(dateStr+"T12:00:00");
    const day=d.getDate();
    d.setMonth(d.getMonth()+1);
    // Handle month-end overflow (e.g. Jan 31 -> Feb 28) by clamping to last day of target month
    if(d.getDate()!==day)d.setDate(0);
    return d.toISOString().slice(0,10);
  };
  const addItem=()=>{
    if(!form.name||!form.defaultAmount)return;
    const item={
      id:Date.now(),
      name:form.name,
      type:form.type,
      defaultAmount:+form.defaultAmount,
      paymentsRemaining:form.type==="recurring"&&form.paymentsRemaining?+form.paymentsRemaining:null,
      dueDate:form.dueDate||"",
      notes:form.notes,
      history:[],
      currentMonthAmount:+form.defaultAmount,
      currentMonthKey:monthKey(),
      paid:false,
    };
    save([...ledger,item]);
    setForm({name:"",type:"recurring",defaultAmount:"",paymentsRemaining:"",dueDate:"",notes:""});
    setShowAdd(false);
  };
  const del=id=>save(ledger.filter(i=>i.id!==id));
  const updateAmount=(id,val)=>save(ledger.map(i=>i.id===id?{...i,currentMonthAmount:+val}:i));
  const updateDueDate=(id,val)=>save(ledger.map(i=>i.id===id?{...i,dueDate:val}:i));
  const markPaid=id=>{
    save(ledger.map(i=>{
      if(i.id!==id)return i;
      const entry={amount:i.currentMonthAmount,date:new Date().toLocaleDateString(),monthKey:i.currentMonthKey,dueDate:i.dueDate};
      const newRemaining=i.type==="recurring"&&i.paymentsRemaining!=null?Math.max(0,i.paymentsRemaining-1):i.paymentsRemaining;
      return{...i,paid:true,history:[entry,...(i.history||[])],paymentsRemaining:newRemaining};
    }));
  };
  const resetForNewMonth=id=>{
    save(ledger.map(i=>i.id===id?{...i,paid:false,currentMonthAmount:i.defaultAmount,currentMonthKey:monthKey(),dueDate:i.type==="recurring"?addMonth(i.dueDate):i.dueDate}:i));
  };
  // Auto-detect month rollover: if currentMonthKey differs from this month and item was paid, reset it
  useEffect(()=>{
    const mk=monthKey();
    const needsReset=ledger.filter(i=>i.type==="recurring"&&i.currentMonthKey!==mk&&i.paid);
    if(needsReset.length>0){
      save(ledger.map(i=>(i.type==="recurring"&&i.currentMonthKey!==mk&&i.paid)?{...i,paid:false,currentMonthAmount:i.defaultAmount,currentMonthKey:mk,dueDate:addMonth(i.dueDate)}:i));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const totalOwed=ledger.filter(i=>!i.paid).reduce((s,i)=>s+i.currentMonthAmount,0);
  const recurring=ledger.filter(i=>i.type==="recurring");
  const oneTime=ledger.filter(i=>i.type==="oneTime");
  return(<div>
    <div style={{...S.alert(totalOwed>0?"#FF9800":"#4CAF50"),marginBottom:14}}>
      <span style={{color:totalOwed>0?"#FF9800":"#4CAF50",fontWeight:"bold"}}>Bradyn currently owes Brad: {fmt(totalOwed)}</span>
    </div>
    {isParent&&<div style={{...S.row,marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:15,color:S.T.accent}}>Bradyn & Brad Ledger</div>
      <button style={S.btn()} onClick={()=>setShowAdd(!showAdd)}>{showAdd?"Cancel":"Add Item"}</button>
    </div>}
    {showAdd&&isParent&&<div style={S.card}>
      <div style={S.h2}>New Item</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:12}}>
        <div><div style={S.label}>Name</div><input style={S.input} placeholder="e.g. Car Insurance" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
        <div><div style={S.label}>Type</div><select style={S.select} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="recurring">Recurring Monthly</option><option value="oneTime">One-Time</option></select></div>
        <div><div style={S.label}>{form.type==="recurring"?"Default Monthly Amount":"Amount"}</div><input style={S.input} type="number" placeholder="0.00" value={form.defaultAmount} onChange={e=>setForm({...form,defaultAmount:e.target.value})}/></div>
        {form.type==="recurring"&&<div><div style={S.label}>Payments Remaining (optional)</div><input style={S.input} type="number" placeholder="e.g. 36" value={form.paymentsRemaining} onChange={e=>setForm({...form,paymentsRemaining:e.target.value})}/></div>}
        <div><div style={S.label}>Due Date</div><input style={S.input} type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></div>
        <div><div style={S.label}>Notes</div><input style={S.input} placeholder="Any notes..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
      </div>
      <button style={{...S.btn(),padding:"9px 22px"}} onClick={addItem}>Add Item</button>
    </div>}
    {ledger.length===0&&<div style={{...S.card,textAlign:"center",padding:40,color:S.T.sub}}>Nothing tracked yet.{isParent?" Click Add Item to start.":""}</div>}
    {recurring.length>0&&<div style={{marginBottom:14}}>
      <div style={{fontSize:13,color:S.T.sub,fontFamily:"monospace",letterSpacing:"0.1em",marginBottom:8,borderLeft:`3px solid ${S.T.accent}`,paddingLeft:10}}>RECURRING MONTHLY</div>
      {recurring.map(item=>{
        const today=new Date();
        const dl=item.dueDate?Math.ceil((new Date(item.dueDate+"T12:00:00")-today)/(864e5)):null;
        const isOver=dl!=null&&dl<0&&!item.paid;
        const isSoon=dl!=null&&dl>=0&&dl<=3&&!item.paid;
        return(
        <div key={item.id} style={{...S.card,borderLeft:`4px solid ${item.paid?"#4CAF50":isOver?"#f44336":isSoon?"#FF9800":"#FF9800"}`,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontSize:15,color:S.T.text,fontWeight:"bold"}}>{item.name}</span>
                {item.paid&&<span style={S.tag("#4CAF50")}>PAID THIS MONTH</span>}
                {isOver&&<span style={S.tag("#f44336")}>OVERDUE</span>}
                {isSoon&&<span style={S.tag("#FF9800")}>DUE SOON</span>}
                {item.paymentsRemaining!=null&&<span style={S.tag("#2196F3")}>{item.paymentsRemaining} left</span>}
              </div>
              {item.notes&&<div style={{fontSize:12,color:S.T.sub}}>{item.notes}</div>}
              <div style={{fontSize:11,color:S.T.sub,marginTop:2}}>Default: {fmt(item.defaultAmount)}/mo</div>
              {item.dueDate&&<div style={{fontSize:11,marginTop:2,color:isOver?"#f44336":isSoon?"#FF9800":S.T.sub}}>Due {new Date(item.dueDate+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}{!item.paid&&dl!=null?` — ${isOver?Math.abs(dl)+"d overdue":dl===0?"today":dl===1?"tomorrow":dl+" days"}`:""}</div>}
            </div>
            {isParent&&<button style={S.btnDanger} onClick={()=>del(item.id)}>X</button>}
          </div>
          <div style={{display:"flex",gap:8,marginTop:10,paddingTop:10,borderTop:`1px solid ${S.T.border}`,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:11,color:S.T.sub}}>This month:</span>
              <input style={{...S.input,width:90,padding:"5px 8px",fontSize:13}} type="number" value={item.currentMonthAmount} onChange={e=>updateAmount(item.id,e.target.value)} disabled={item.paid}/>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:11,color:S.T.sub}}>Due:</span>
              <input style={{...S.input,width:140,padding:"5px 8px",fontSize:13}} type="date" value={item.dueDate||""} onChange={e=>updateDueDate(item.id,e.target.value)}/>
            </div>
            {!item.paid
              ?<button style={{...S.btn("#4CAF50"),padding:"7px 16px",fontSize:12}} onClick={()=>markPaid(item.id)}>Mark Paid - {fmt(item.currentMonthAmount)}</button>
              :<button style={{...S.btnGhost,padding:"7px 12px",fontSize:11}} onClick={()=>resetForNewMonth(item.id)}>Undo / New Month</button>
            }
          </div>
          {item.history&&item.history.length>0&&<div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${S.T.border}`}}>
            <div style={{fontSize:10,color:S.T.sub,marginBottom:4}}>RECENT PAYMENTS</div>
            {item.history.slice(0,3).map((h,i)=><div key={i} style={{fontSize:11,color:S.T.sub,display:"flex",justifyContent:"space-between",padding:"2px 0"}}><span>{h.date}</span><span style={{color:"#4CAF50"}}>{fmt(h.amount)}</span></div>)}
          </div>}
        </div>
        );
      })}
    </div>}
    {oneTime.length>0&&<div>
      <div style={{fontSize:13,color:S.T.sub,fontFamily:"monospace",letterSpacing:"0.1em",marginBottom:8,borderLeft:`3px solid ${S.T.accent}`,paddingLeft:10}}>ONE-TIME ITEMS</div>
      {oneTime.map(item=>{
        const today=new Date();
        const dl=item.dueDate?Math.ceil((new Date(item.dueDate+"T12:00:00")-today)/(864e5)):null;
        const isOver=dl!=null&&dl<0&&!item.paid;
        const isSoon=dl!=null&&dl>=0&&dl<=3&&!item.paid;
        return(
        <div key={item.id} style={{...S.card,borderLeft:`4px solid ${item.paid?"#4CAF50":isOver?"#f44336":"#FF9800"}`,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                <span style={{fontSize:15,color:S.T.text,fontWeight:"bold"}}>{item.name}</span>
                {item.paid&&<span style={S.tag("#4CAF50")}>PAID</span>}
                {isOver&&<span style={S.tag("#f44336")}>OVERDUE</span>}
                {isSoon&&<span style={S.tag("#FF9800")}>DUE SOON</span>}
              </div>
              {item.notes&&<div style={{fontSize:12,color:S.T.sub}}>{item.notes}</div>}
              <div style={{fontSize:13,color:GOLD,fontFamily:"monospace",fontWeight:"bold",marginTop:2}}>{fmt(item.currentMonthAmount)}</div>
              {item.dueDate&&<div style={{fontSize:11,marginTop:2,color:isOver?"#f44336":isSoon?"#FF9800":S.T.sub}}>Due {new Date(item.dueDate+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}{!item.paid&&dl!=null?` — ${isOver?Math.abs(dl)+"d overdue":dl===0?"today":dl===1?"tomorrow":dl+" days"}`:""}</div>}
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {!item.paid&&<button style={{...S.btn("#4CAF50"),padding:"7px 16px",fontSize:12}} onClick={()=>markPaid(item.id)}>Mark Paid</button>}
              {isParent&&<button style={S.btnDanger} onClick={()=>del(item.id)}>X</button>}
            </div>
          </div>
        </div>
        );
      })}
    </div>}
  </div>);
}

export {
  ChoresTab, KidChoreView, MessageBoard, SettingsTab, AdminPanel, BillCard,
  SecHead, BillsTab, MealDetailModal, MealsTab, BradynLedger,
};
