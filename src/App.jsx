import { useState, useEffect, useRef, useCallback } from "react";

const store = {
  save: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
  load: (k,fb) => { try { const r=localStorage.getItem(k); return r?JSON.parse(r):fb; } catch { return fb; } },
};

const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DSHORT=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MEAL_TYPES=["Breakfast","Lunch","Dinner"];
const CATS=["Housing","Food","Transport","Subscriptions","Healthcare","Utilities","Entertainment","Personal","Savings","Income","Other"];
const ACCT_TYPES=["Checking","Savings","HYSA","Investment","Brokerage","TSP","Roth IRA","Traditional IRA","401k","Other"];
const DEBT_TYPES=["Credit Card","Student Loan","Auto","Mortgage","Personal Loan","Medical","Other"];
const BILL_CATS=["Utilities","Housing","Insurance","Subscriptions","Medical","Auto","Food","Other"];
const SHOP_CATS=["Grocery","Dairy","Produce","Meat","Snacks","Beverages","Household","Personal Care","Other"];
const CHORE_MASTER=["Make bed","Dishes / unload dishwasher","Take out trash","Vacuum","Sweep / mop","Clean bathroom","Laundry","Feed pets","Wipe counters","Take out recycling","Pick up living room","Homework done","Practice instrument","Walk dog","Set table","Clear table","Yard work","Clean room"];
const GOLD="#C9A84C",DARK="#0d0d08",MID="#141410",BORDER="#2a2a18";
const TIMEOUT_MS=5*60*1000;

const THEMES={
  dark:{bg:"#0d0d08",card:"#141410",border:"#2a2a18",text:"#e8e0c8",sub:"#888",accent:GOLD,name:"Dark Gold"},
  navy:{bg:"#060d1a",card:"#0c1628",border:"#1a2a40",text:"#c8d8f0",sub:"#4a6a8a",accent:"#4a9eff",name:"Navy Blue"},
  forest:{bg:"#060e06",card:"#0a160a",border:"#1a2e1a",text:"#c8e0c8",sub:"#5a7a5a",accent:"#4CAF50",name:"Forest"},
  slate:{bg:"#0a0a12",card:"#12121e",border:"#22223a",text:"#d0d0e8",sub:"#6868a0",accent:"#9C27B0",name:"Slate Purple"},
  ember:{bg:"#120806",card:"#1e0e0a",border:"#3a1a14",text:"#f0d8c8",sub:"#8a5a4a",accent:"#FF5722",name:"Ember"},
};

const USERS=[
  {key:"brad",label:"Brad",emoji:"👨",type:"password",color:"#2196F3"},
  {key:"maryBeth",label:"Mary Beth",emoji:"👩",type:"password",color:"#E91E63"},
  {key:"bradyn",label:"Bradyn",emoji:"🎧",type:"password",color:"#00d4ff"},
  {key:"parker",label:"Parker",emoji:"⚡",type:"pin",color:"#b44fef"},
  {key:"ryder",label:"Ryder",emoji:"🌟",type:"pin",color:"#ff6b35"},
];

const blankMealPlan=()=>Object.fromEntries(DAYS.map(d=>[d,{Breakfast:"",Lunch:"",Dinner:""}]));

const D={
  profile:{myName:"Brad",fianceName:"Mary Beth",myIncome:100000,fIncome:100000,creditScore:710,pslfMonths:24},
  accounts:[{id:1,name:"Checking",owner:"me",type:"Checking",balance:5000,institution:"Bank"},{id:2,name:"HYSA",owner:"me",type:"HYSA",balance:90000,institution:"Ally",apy:4.5},{id:3,name:"TSP",owner:"me",type:"TSP",balance:25000,institution:"TSP",monthlyContrib:500},{id:4,name:"Roth IRA",owner:"me",type:"Roth IRA",balance:8000,institution:"Fidelity",monthlyContrib:200},{id:5,name:"Checking",owner:"fiance",type:"Checking",balance:5000,institution:"Bank"},{id:6,name:"HYSA",owner:"fiance",type:"HYSA",balance:45000,institution:"Marcus",apy:4.5}],
  debts:[{id:1,name:"Card 1",type:"Credit Card",balance:15000,rate:22,minPayment:300,owner:"me"},{id:2,name:"Card 2",type:"Credit Card",balance:10000,rate:19,minPayment:200,owner:"me"},{id:3,name:"Card 3",type:"Credit Card",balance:5000,rate:24,minPayment:100,owner:"me"},{id:4,name:"Student Loans",type:"Student Loan",balance:120000,rate:0,minPayment:400,owner:"me",pslf:true},{id:5,name:"Car Lease",type:"Auto",balance:8000,rate:0,minPayment:300,owner:"me"}],
  expenses:[{id:1,category:"Housing",items:[{id:11,name:"Rent",amount:2000,due:1},{id:12,name:"Renters Insurance",amount:30,due:15}]},{id:2,category:"Food",items:[{id:21,name:"Groceries",amount:600,due:0},{id:22,name:"Dining Out",amount:300,due:0}]},{id:3,category:"Transport",items:[{id:31,name:"Car Lease",amount:300,due:5},{id:32,name:"Gas",amount:150,due:0}]},{id:4,category:"Subscriptions",items:[{id:41,name:"Netflix",amount:18,due:12},{id:42,name:"Spotify",amount:11,due:8},{id:43,name:"Gym",amount:50,due:1}]},{id:5,category:"Healthcare",items:[{id:51,name:"Health Insurance",amount:200,due:1}]},{id:6,category:"Utilities",items:[{id:61,name:"Electric",amount:100,due:20},{id:62,name:"Internet",amount:60,due:15}]}],
  goals:[{id:1,name:"House Down Payment",icon:"🏡",target:100000,saved:50000,date:"2025-12-01",color:GOLD},{id:2,name:"Emergency Fund",icon:"🛡",target:25000,saved:10000,date:"2025-06-01",color:"#2196F3"},{id:3,name:"Wedding",icon:"💍",target:10000,saved:2000,date:"2026-06-01",color:"#E91E63"},{id:4,name:"Vacation",icon:"✈️",target:5000,saved:500,date:"2025-09-01",color:"#4CAF50"},{id:5,name:"Retirement",icon:"🌅",target:50000,saved:33000,date:"2030-01-01",color:"#9C27B0"}],
  transactions:[],milestones:[{id:1,date:new Date().toISOString().slice(0,10),text:"Started Family Hub",type:"start"}],
  pslf:{totalPayments:120,qualifyingPayments:96,pslfMonths:24,certDue:"2025-09-01",employer:"Federal Agency",idrPlan:"SAVE",notes:""},
  bills:[],mealPlan:blankMealPlan(),shopList:[],mealSuggestions:[],shopRequests:[],
  auth:{brad:null,maryBeth:null,bradyn:null,parker:null,ryder:null},
  chores:[],messages:[],billHistory:[],
  appSettings:{showPoints:false,showAdultChores:{brad:false,maryBeth:false,bradyn:false},userThemes:{}},
};

const fmt=n=>"$"+Math.abs(Math.round(n)).toLocaleString();
const calcMortgage=(p,r,y=30)=>{const m=r/12/100;return p*(m*Math.pow(1+m,y*12))/(Math.pow(1+m,y*12)-1);};
const scoreToRate=s=>s>=760?6.75:s>=740?6.875:s>=720?7.0:s>=700?7.25:s>=680?7.5:7.875;
const calcPayoff=(bal,rate,pay)=>{if(pay<=0||bal<=0)return 0;const r=rate/100/12;if(r>0&&pay<=bal*r)return 999;if(r===0)return Math.ceil(bal/pay);return Math.ceil(-Math.log(1-(bal*r)/pay)/Math.log(1+r));};
const todayName=()=>{const d=new Date().getDay();return DAYS[d===0?6:d-1];};

function getTheme(k){return THEMES[k]||THEMES.dark;}
function makeS(theme){
  const T=getTheme(theme);
  return{
    page:{background:T.bg,minHeight:"100vh",fontFamily:"'Georgia',serif",color:T.text},
    card:{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:14},
    cardSm:{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:14,marginBottom:10},
    label:{fontSize:11,color:T.sub,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:5,fontFamily:"monospace"},
    input:{background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 12px",color:T.text,fontFamily:"Georgia,serif",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"},
    select:{background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,padding:"8px 12px",color:T.text,fontFamily:"Georgia,serif",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"},
    btn:(c=T.accent)=>({background:c,border:"none",borderRadius:6,padding:"9px 18px",color:c===T.accent&&T.accent===GOLD?"#0d0d08":"#fff",fontFamily:"Georgia,serif",fontSize:13,cursor:"pointer",fontWeight:"bold",whiteSpace:"nowrap"}),
    btnGhost:{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:"7px 14px",color:T.sub,fontFamily:"Georgia,serif",fontSize:12,cursor:"pointer"},
    btnDanger:{background:"transparent",border:"1px solid #f4433644",borderRadius:6,padding:"5px 10px",color:"#f44336",fontFamily:"Georgia,serif",fontSize:12,cursor:"pointer"},
    row:{display:"flex",justifyContent:"space-between",alignItems:"center"},
    grid2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},
    grid2mob:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14},
    grid3:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14},
    grid4:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14},
    h2:{fontSize:15,color:T.accent,fontWeight:"normal",borderBottom:`1px solid ${T.border}`,paddingBottom:8,marginBottom:16,letterSpacing:"0.05em"},
    tag:c=>({background:c+"22",color:c,border:`1px solid ${c}44`,borderRadius:4,padding:"2px 8px",fontSize:11,fontFamily:"monospace"}),
    alert:c=>({background:c+"18",border:`1px solid ${c}44`,borderRadius:8,padding:"12px 16px",marginBottom:12}),
    T,
  };
}
const S=makeS("dark");

function Ring({pct:p=0,size=80,stroke=8,color=GOLD,label,sub}){const r=(size-stroke)/2,circ=2*Math.PI*r,filled=circ*Math.min(p/100,1);return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{position:"relative",width:size,height:size}}><svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a0f" strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${filled} ${circ}`} style={{transition:"stroke-dasharray 0.6s"}}/></svg>{label&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:"bold",color}}>{label}</div>}</div>{sub&&<div style={{fontSize:10,color:"#888",textAlign:"center",maxWidth:80}}>{sub}</div>}</div>);}
function Bar({value,max,color=GOLD,height=6}){return <div style={{background:"#1a1a0f",borderRadius:4,height,overflow:"hidden"}}><div style={{width:`${Math.min(value/Math.max(max,1)*100,100)}%`,height:"100%",background:color,borderRadius:4,transition:"width 0.5s"}}/></div>;}

function PinPad({onSubmit,color="#ff6b35",error}){
  const [pin,setPin]=useState("");
  const add=d=>{if(pin.length<4){const np=pin+d;setPin(np);if(np.length===4)setTimeout(()=>onSubmit(np),150);}};
  return(<div style={{textAlign:"center"}}><div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:20}}>{[0,1,2,3].map(i=><div key={i} style={{width:18,height:18,borderRadius:"50%",background:pin.length>i?color:"transparent",border:`2px solid ${color}`,transition:"background 0.15s"}}/>)}</div>{error&&<div style={{color:"#f44336",fontSize:12,marginBottom:10}}>{error}</div>}<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:220,margin:"0 auto"}}>{[1,2,3,4,5,6,7,8,9,"",0,"X"].map((n,i)=><button key={i} onClick={()=>typeof n==="number"?add(String(n)):n==="X"?setPin(p=>p.slice(0,-1)):null} style={{padding:"15px",fontSize:22,fontFamily:"Georgia,serif",fontWeight:"bold",background:n===""?"transparent":`${color}22`,border:`2px solid ${n===""?"transparent":color}`,borderRadius:12,color:n===""?"transparent":"#fff",cursor:n===""?"default":"pointer"}}>{n}</button>)}</div></div>);
}

function LoginModal({user,auth,onSuccess,onClose}){
  const [pwd,setPwd]=useState(""),[confirm,setConfirm]=useState(""),[error,setError]=useState(""),[pinErr,setPinErr]=useState("");
  const u=USERS.find(x=>x.key===user);
  const isPin=u.type==="pin",isFirst=!auth[user],pinNotSet=isPin&&!auth[user];
  const submitPwd=()=>{if(isFirst){if(pwd.length<4){setError("At least 4 characters.");return;}if(pwd!==confirm){setError("Passwords don't match.");return;}onSuccess(pwd);}else{if(pwd!==auth[user]){setError("Wrong password. Try again.");setPwd("");return;}onSuccess(null);}};
  const submitPin=pin=>{if(pin!==auth[user]){setPinErr("Wrong code! Try again.");return;}onSuccess(null);};
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}><div style={{background:"#141410",border:`2px solid ${u.color}44`,borderRadius:16,padding:32,maxWidth:380,width:"100%"}} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:44,marginBottom:6}}>{u.emoji}</div><div style={{fontSize:22,color:"#e8e0c8",marginBottom:4}}>{isFirst&&!isPin?`Welcome, ${u.label}!`:`Hey ${u.label}!`}</div><div style={{fontSize:13,color:"#666"}}>{isFirst&&!isPin?"Create your password to get started":isPin?pinNotSet?"Your PIN has not been set — ask Brad!":"Enter your 4-digit code":"Enter your password"}</div></div>{isPin&&!pinNotSet&&<PinPad onSubmit={submitPin} color={u.color} error={pinErr}/>}{isPin&&pinNotSet&&<div style={{textAlign:"center",padding:"20px 0",color:"#666",fontSize:14}}>Ask Brad to set your code!</div>}{!isPin&&<div><div style={{marginBottom:12}}><div style={S.label}>{isFirst?"Create Password":"Password"}</div><input autoFocus style={S.input} type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&submitPwd()}/></div>{isFirst&&<div style={{marginBottom:12}}><div style={S.label}>Confirm Password</div><input style={S.input} type="password" value={confirm} onChange={e=>{setConfirm(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&submitPwd()}/></div>}{error&&<div style={{color:"#f44336",fontSize:12,marginBottom:10}}>{error}</div>}<button style={{...S.btn(u.color),width:"100%",padding:"11px",fontSize:15,marginTop:4}} onClick={submitPwd}>{isFirst?"Create Password and Sign In":"Sign In"}</button></div>}<button onClick={onClose} style={{...S.btnGhost,width:"100%",marginTop:12,textAlign:"center"}}>Cancel</button></div></div>);
}

function WeatherWidget(){
  const [weather,setWeather]=useState(null),[loading,setLoading]=useState(true);
  useEffect(()=>{
    if(!navigator.geolocation){setLoading(false);return;}
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        const {latitude:lat,longitude:lon}=pos.coords;
        const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph`);
        const d=await r.json();
        const code=d.current.weathercode;
        const icon=code===0?"☀️":code<=2?"🌤":code<=3?"☁️":code<=48?"🌫":code<=57?"🌧":code<=67?"🌨":code<=77?"❄️":code<=82?"🌦":code<=86?"🌨":"⛈";
        const desc=code===0?"Clear":code<=2?"Partly Cloudy":code<=3?"Cloudy":code<=48?"Foggy":code<=67?"Rainy":code<=77?"Snowy":code<=82?"Showers":"Stormy";
        setWeather({temp:Math.round(d.current.temperature_2m),icon,desc,wind:Math.round(d.current.windspeed_10m)});
      }catch(e){}
      setLoading(false);
    },()=>setLoading(false),{timeout:5000});
  },[]);
  if(loading)return <div style={{fontSize:11,color:"#555"}}>Loading weather...</div>;
  if(!weather)return null;
  return(<div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 12px",background:"rgba(255,255,255,0.04)",borderRadius:20,border:`1px solid ${BORDER}`}}><span style={{fontSize:18}}>{weather.icon}</span><div><div style={{fontSize:13,fontWeight:"bold",color:"#e8e0c8"}}>{weather.temp}F</div><div style={{fontSize:10,color:"#666"}}>{weather.desc}</div></div></div>);
}

function BillsBanner({bills,S}){
  const today=new Date();
  const due=bills.filter(b=>{const d=new Date(b.dueDate+"T12:00:00");const dl=Math.ceil((d-today)/(864e5));return dl>=0&&dl<=7;});
  if(due.length===0)return null;
  return(<div style={{...S.alert("#FF9800"),display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:14}}>
    <span style={{color:"#FF9800",fontWeight:"bold",fontSize:13}}>Expenses this week:</span>
    {due.map(b=>{const dl=Math.ceil((new Date(b.dueDate+"T12:00:00")-today)/(864e5)),paid=b.bradPaid&&b.maryBethPaid;return <span key={b.id} style={{...S.tag(paid?"#4CAF50":"#FF9800")}}>{b.name} — {dl===0?"Today":dl===1?"Tomorrow":dl+"d"}{paid?" (paid)":""}</span>;})}
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
                <span style={{fontSize:13}}>{u?.emoji}</span>
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
function PersonalHomeScreen({currentUser,mealPlan,bills,chores,setChores,messages,appSettings,S}){
  const today=new Date(),tn=todayName();
  const tomorrowName=DAYS[(DAYS.indexOf(tn)+1)%7];
  const u=USERS.find(x=>x.key===currentUser);
  const dueSoon=(bills||[]).filter(b=>{const d=new Date(b.dueDate+"T12:00:00");const dl=Math.ceil((d-today)/(864e5));return dl>=0&&dl<=7;});
  const showFor=id=>{
    if(id==="brad"&&!appSettings.showAdultChores?.brad)return false;
    if(id==="maryBeth"&&!appSettings.showAdultChores?.maryBeth)return false;
    if(id==="bradyn"&&!appSettings.showAdultChores?.bradyn)return false;
    return true;
  };
  const myOneOff=showFor(currentUser)?(chores||[]).filter(c=>c.assignee===currentUser&&!c.done&&(!c.days||c.days.length===0)):[];
  const todayMeals=mealPlan[tn]||{},tomorrowMeals=mealPlan[tomorrowName]||{};
  return(<div style={{padding:"0 0 16px"}}>
    <PinnedAnnouncements messages={messages} S={S}/>
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:children?8:0,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{u.emoji}</span><div><div style={{fontSize:9,color:"#444",fontFamily:"monospace",letterSpacing:"0.2em"}}>FAMILY HUB</div><div style={{fontSize:15,color:"#e8e0c8"}}>{u.label}</div></div></div>
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
function PublicHomeScreen({mealPlan,shopList,bills,expenses,onLogin,appSettings,messages}){
  const today=new Date(),tn=todayName();
  const tonightDinner=mealPlan[tn]?.Dinner||"";
  const unchecked=shopList.filter(i=>!i.checked);
  const dueSoon=bills.filter(b=>{const d=new Date(b.dueDate+"T12:00:00");return Math.ceil((d-today)/(864e5))>=0&&Math.ceil((d-today)/(864e5))<=7;});
  return(<div style={{...S.page,minHeight:"100vh"}}>
    <div style={{background:"linear-gradient(180deg,#1a1a0f,#0d0d08)",borderBottom:`1px solid ${BORDER}`,padding:"16px 20px"}}>
      <div style={{maxWidth:1300,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div><div style={{fontSize:9,color:"#555",letterSpacing:"0.28em",fontFamily:"monospace"}}>THE</div><h1 style={{margin:"1px 0 0",fontSize:26,fontWeight:"normal",color:"#e8e0c8"}}>Family <span style={{color:GOLD}}>Hub</span></h1><div style={{fontSize:11,color:"#444",fontFamily:"monospace"}}>Brad & Mary Beth</div></div>
          <WeatherWidget/>
          <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#444",fontFamily:"monospace",letterSpacing:"0.12em"}}>TONIGHT</div><div style={{fontSize:16,color:tonightDinner?GOLD:"#333",marginTop:2,fontStyle:tonightDinner?"normal":"italic"}}>{tonightDinner||"Nothing planned"}</div><div style={{fontSize:11,color:"#555",marginTop:3}}>{today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div></div>
        </div>
      </div>
    </div>
    <div style={{maxWidth:1300,margin:"0 auto",padding:"16px 16px"}}>
      <PinnedAnnouncements messages={messages||[]} S={S}/>
      {dueSoon.length>0&&<BillsBanner bills={bills} S={S}/>}
      <div style={{overflowX:"auto",marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(90px,1fr))",gap:6,minWidth:560}}>
          {DAYS.map(d=>{const isToday=d===tn,m=mealPlan[d]||{};return(<div key={d} style={{background:isToday?`${GOLD}18`:"#1a1a0f",border:`1px solid ${isToday?GOLD:BORDER}`,borderRadius:10,padding:"8px 6px",textAlign:"center",minHeight:80}}><div style={{fontSize:9,fontFamily:"monospace",letterSpacing:"0.1em",color:isToday?GOLD:"#555",marginBottom:4}}>{d.slice(0,3).toUpperCase()}</div>{MEAL_TYPES.map(mt=>m[mt]?<div key={mt} style={{marginBottom:2}}><div style={{fontSize:8,color:"#555"}}>{mt==="Breakfast"?"🌅":mt==="Lunch"?"☀️":"🌙"}</div><div style={{fontSize:10,color:isToday?"#e8e0c8":"#888",lineHeight:"1.2"}}>{m[mt]}</div></div>:null)}{!m.Breakfast&&!m.Lunch&&!m.Dinner&&<div style={{fontSize:10,color:"#2a2a18",marginTop:8}}>—</div>}</div>);})}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12,marginBottom:14}}>
        <div style={S.card}><div style={S.h2}>Shopping List</div>{unchecked.length===0?<div style={{color:"#444",fontSize:13,textAlign:"center",padding:"10px 0"}}>Nothing on the list!</div>:unchecked.slice(0,8).map(item=><div key={item.id} style={{display:"flex",gap:10,padding:"5px 0",borderBottom:`1px solid #1a1a0f`,alignItems:"center"}}><div style={{width:7,height:7,borderRadius:"50%",background:GOLD,flexShrink:0}}/><span style={{fontSize:13,color:"#e8e0c8",flex:1}}>{item.qty&&item.qty!=="1"?`${item.qty}x `:""}{item.name}</span>{item.addedBy&&item.addedBy!=="Parents"&&<span style={{fontSize:10,color:"#555"}}>{item.addedBy}</span>}</div>)}{unchecked.length>8&&<div style={{fontSize:11,color:"#555",marginTop:4}}>+{unchecked.length-8} more</div>}</div>
        {dueSoon.length>0&&<div style={S.card}><div style={S.h2}>Due This Week</div>{dueSoon.map(b=>{const dl=Math.ceil((new Date(b.dueDate+"T12:00:00")-today)/(864e5)),paid=b.bradPaid&&b.maryBethPaid;return(<div key={b.id} style={{...S.row,padding:"6px 0",borderBottom:`1px solid #1a1a0f`}}><div><div style={{fontSize:13,color:"#e8e0c8"}}>{b.name}</div><div style={{fontSize:11,color:"#555"}}>{dl===0?"Today":dl===1?"Tomorrow":`${dl} days`}</div></div><div style={{textAlign:"right"}}><div style={{fontFamily:"monospace",color:GOLD,fontSize:12,fontWeight:"bold"}}>{fmt(b.amount/2)} ea</div><div style={{fontSize:10,color:paid?"#4CAF50":"#FF9800"}}>{paid?"Paid":"Pending"}</div></div></div>);})}
        </div>}
      </div>
      <div style={S.card}><div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:11,color:"#555",fontFamily:"monospace",letterSpacing:"0.2em"}}>SIGN IN AS</div></div><div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>{USERS.map(u=><button key={u.key} onClick={()=>onLogin(u.key)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"14px 20px",background:`${u.color}12`,border:`2px solid ${u.color}44`,borderRadius:14,cursor:"pointer",color:"#e8e0c8",fontFamily:"Georgia,serif",minWidth:90}}><span style={{fontSize:28}}>{u.emoji}</span><span style={{fontSize:13,color:u.color,fontWeight:"bold"}}>{u.label}</span></button>)}</div></div>
    </div>
  </div>);
}

// ── DAY PILLS (top-level — must not be inside ChoresTab) ─────────────────────
function DayPills({selected,onToggle,S}){
  return(<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>
    {DAYS.map((d,i)=><button key={d} onClick={()=>onToggle(d)} style={{padding:"3px 8px",borderRadius:8,fontSize:10,fontFamily:"Georgia,serif",cursor:"pointer",background:selected.includes(d)?S.T.accent+"33":"transparent",border:`1px solid ${selected.includes(d)?S.T.accent:S.T.border}`,color:selected.includes(d)?S.T.accent:S.T.sub}}>{DSHORT[i]}</button>)}
  </div>);
}

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
function SettingsTab({profile,setProfile,appSettings,setAppSettings,S,currentUser}){
  const [local,setLocal]=useState({...profile});
  const [saved,setSaved]=useState(false);
  const saveProfile=()=>{setProfile(local);store.save("fp2:profile",local);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const saveSettings=u=>{setAppSettings(u);store.save("fp2:appSettings",u);};
  const toggleAdultChore=key=>{const u={...appSettings,showAdultChores:{...appSettings.showAdultChores,[key]:!appSettings.showAdultChores?.[key]}};saveSettings(u);};
  const isParent=currentUser==="brad"||currentUser==="maryBeth";
  return(<div>
    <div style={S.card}>
      <div style={S.h2}>Profile & Names</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:14}}>
        <div><div style={S.label}>Your Name</div><input style={S.input} value={local.myName} onChange={e=>setLocal({...local,myName:e.target.value})}/></div>
        <div><div style={S.label}>Partner Name</div><input style={S.input} value={local.fianceName} onChange={e=>setLocal({...local,fianceName:e.target.value})}/></div>
        <div><div style={S.label}>Your Income</div><input style={S.input} type="number" value={local.myIncome} onChange={e=>setLocal({...local,myIncome:+e.target.value})}/></div>
        <div><div style={S.label}>Partner Income</div><input style={S.input} type="number" value={local.fIncome} onChange={e=>setLocal({...local,fIncome:+e.target.value})}/></div>
        <div><div style={S.label}>Credit Score</div><input style={S.input} type="number" value={local.creditScore} onChange={e=>setLocal({...local,creditScore:+e.target.value})}/></div>
        <div><div style={S.label}>Months to PSLF</div><input style={S.input} type="number" value={local.pslfMonths} onChange={e=>setLocal({...local,pslfMonths:+e.target.value})}/></div>
      </div>
      <button style={S.btn()} onClick={saveProfile}>{saved?"✓ Saved!":"Save Profile"}</button>
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
function BillCard({bill,today,togglePaid,del,profile,S}){
  const due=new Date(bill.dueDate+"T12:00:00"),dl=Math.ceil((due-today)/(864e5));
  const isOver=dl<0,isSoon=dl>=0&&dl<=3;
  const isShared=!bill.owner||bill.owner==="shared";
  const isBradOnly=bill.owner==="brad",isMBOnly=bill.owner==="maryBeth";
  const share=isShared?bill.amount/2:bill.amount;
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
    <div style={{display:"flex",gap:8,marginTop:10,paddingTop:10,borderTop:`1px solid ${S.T.border}`,flexWrap:"wrap"}}>
      {(isShared||isBradOnly)&&<button onClick={()=>togglePaid(bill.id,"brad")} style={{flex:1,minWidth:140,padding:"8px 12px",borderRadius:7,border:`2px solid ${bill.bradPaid?"#4CAF50":"#2196F3"}`,background:bill.bradPaid?"#4CAF5018":"transparent",color:bill.bradPaid?"#4CAF50":"#2196F3",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold",textAlign:"left"}}>{bill.bradPaid?profile.myName+" Paid - "+bill.bradPaidDate:"Mark "+profile.myName+" Paid - "+fmt(share)}</button>}
      {(isShared||isMBOnly)&&<button onClick={()=>togglePaid(bill.id,"maryBeth")} style={{flex:1,minWidth:140,padding:"8px 12px",borderRadius:7,border:`2px solid ${bill.maryBethPaid?"#4CAF50":"#E91E63"}`,background:bill.maryBethPaid?"#4CAF5018":"transparent",color:bill.maryBethPaid?"#4CAF50":"#E91E63",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold",textAlign:"left"}}>{bill.maryBethPaid?profile.fianceName+" Paid - "+bill.maryBethPaidDate:"Mark "+profile.fianceName+" Paid - "+fmt(share)}</button>}
      <button style={S.btnDanger} onClick={()=>del(bill.id)}>X</button>
    </div>
  </div>);
}

function SecHead({label,total,color,S}){
  return(<div style={{...S.row,margin:"14px 0 8px",flexWrap:"wrap",gap:6}}><div style={{fontSize:14,color,fontWeight:"bold",borderLeft:`3px solid ${color}`,paddingLeft:10}}>{label}</div><span style={{...S.tag(color)}}>{fmt(total)}/mo</span></div>);
}

// ── BILLS TAB ─────────────────────────────────────────────────────────────────
function BillsTab({bills,setBills,billHistory,setBillHistory,profile,S}){
  const blank={name:"",payee:"",category:"Utilities",amount:"",dueDate:"",notes:"",owner:"shared"};
  const [form,setForm]=useState(blank),[showForm,setShowForm]=useState(false),[showHistory,setShowHistory]=useState(false);
  const save=u=>{setBills(u);store.save("fp2:bills",u);};
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
  const today=new Date();
  const shared=[...bills].filter(b=>!b.owner||b.owner==="shared").sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  const bradOnly=[...bills].filter(b=>b.owner==="brad").sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  const mbOnly=[...bills].filter(b=>b.owner==="maryBeth").sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));
  const sharedTotal=shared.reduce((s,b)=>s+b.amount,0);
  const bradTotal=bradOnly.reduce((s,b)=>s+b.amount,0);
  const mbTotal=mbOnly.reduce((s,b)=>s+b.amount,0);
  const bradOwes=sharedTotal/2+bradTotal,mbOwes=sharedTotal/2+mbTotal;
  const bradPaidAmt=shared.filter(b=>b.bradPaid).reduce((s,b)=>s+b.amount/2,0)+bradOnly.filter(b=>b.bradPaid).reduce((s,b)=>s+b.amount,0);
  const mbPaidAmt=shared.filter(b=>b.maryBethPaid).reduce((s,b)=>s+b.amount/2,0)+mbOnly.filter(b=>b.maryBethPaid).reduce((s,b)=>s+b.amount,0);
  return(<>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:14}}>
      {[{l:"All Bills",v:fmt(sharedTotal+bradTotal+mbTotal),c:GOLD},{l:profile.myName+" Owes",v:fmt(bradOwes),c:"#2196F3"},{l:profile.fianceName+" Owes",v:fmt(mbOwes),c:"#E91E63"},{l:profile.myName+" Paid",v:fmt(bradPaidAmt),c:"#4CAF50"},{l:profile.fianceName+" Paid",v:fmt(mbPaidAmt),c:"#4CAF50"}].map((k,i)=><div key={i} style={{...S.card,marginBottom:0,borderTop:`3px solid ${k.c}`}}><div style={S.label}>{k.l}</div><div style={{fontSize:16,color:k.c,fontFamily:"monospace",fontWeight:"bold"}}>{k.v}</div></div>)}
    </div>
    <div style={{...S.row,marginBottom:14,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:15,color:S.T.accent}}>Expense Tracker</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button style={S.btnGhost} onClick={()=>setShowHistory(!showHistory)}>{showHistory?"Hide History":"Payment History"}</button><button style={S.btn()} onClick={()=>setShowForm(!showForm)}>{showForm?"Cancel":"Add Expense"}</button></div>
    </div>
    {showHistory&&<div style={S.card}><div style={S.h2}>Payment History</div>{billHistory.length===0?<div style={{color:S.T.sub,fontSize:13}}>No history yet.</div>:<div style={{maxHeight:300,overflowY:"auto"}}>{billHistory.map(h=><div key={h.id} style={{...S.row,padding:"5px 0",borderBottom:`1px solid ${S.T.border}`}}><div><div style={{fontSize:13,color:S.T.text}}>{h.billName}</div><div style={{fontSize:11,color:S.T.sub}}>{h.date} - {h.person==="brad"?profile.myName:profile.fianceName}</div></div><span style={{color:"#4CAF50",fontFamily:"monospace",fontWeight:"bold"}}>{fmt(h.amount)}</span></div>)}</div>}</div>}
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
    {bills.length===0&&<div style={{...S.card,textAlign:"center",padding:40,color:S.T.sub}}>No expenses yet. Click Add Expense to start.</div>}
    {shared.length>0&&<><SecHead label="Shared Expenses - 50/50" total={sharedTotal} color="#2196F3" S={S}/>{shared.map(b=><BillCard key={b.id} bill={b} today={today} togglePaid={togglePaid} del={del} profile={profile} S={S}/>)}</>}
    {bradOnly.length>0&&<><SecHead label={profile.myName+"'s Bills"} total={bradTotal} color="#2196F3" S={S}/>{bradOnly.map(b=><BillCard key={b.id} bill={b} today={today} togglePaid={togglePaid} del={del} profile={profile} S={S}/>)}</>}
    {mbOnly.length>0&&<><SecHead label={profile.fianceName+"'s Bills"} total={mbTotal} color="#E91E63" S={S}/>{mbOnly.map(b=><BillCard key={b.id} bill={b} today={today} togglePaid={togglePaid} del={del} profile={profile} S={S}/>)}</>}
  </>);
}

// ── MEALS TAB ─────────────────────────────────────────────────────────────────
// ── MEAL DETAIL MODAL (top-level component — must NOT be inside MealsTab) ─────
function MealDetailModal({detailSlot,setDetailSlot,mealPlan,mealDetails,shopList,saveDetails,saveShop,S}){
  const [newIng,setNewIng]=useState({name:"",qty:"1"});
  const [recipeText,setRecipeText]=useState("");
  // Sync recipeText when slot changes
  const slotKey=(day,mt)=>day+"__"+mt;
  const getDetail=(day,mt)=>mealDetails[slotKey(day,mt)]||{ingredients:[],recipe:""};
  const updateDetail=(day,mt,patch)=>{const k=slotKey(day,mt);saveDetails({...mealDetails,[k]:{...getDetail(day,mt),...patch}});};
  const addIngredient=(day,mt,ing)=>{const d=getDetail(day,mt);updateDetail(day,mt,{ingredients:[...d.ingredients,{id:Date.now(),...ing}]});};
  const delIngredient=(day,mt,id)=>{const d=getDetail(day,mt);updateDetail(day,mt,{ingredients:d.ingredients.filter(i=>i.id!==id)});};
  const addIngToShop=(ing)=>{
    if(!shopList.find(i=>i.name.toLowerCase()===ing.name.toLowerCase()&&!i.checked)){
      saveShop([...shopList,{id:Date.now(),name:ing.name,qty:ing.qty||"1",category:"Grocery",addedBy:"Meal Plan",checked:false,notes:""}]);
    }
  };
  const addAllIngsToShop=(day,mt)=>{const d=getDetail(day,mt);d.ingredients.forEach(ing=>addIngToShop(ing));};
  if(!detailSlot)return null;
  const {day,mt}=detailSlot;
  const mealName=mealPlan[day]?.[mt]||"";
  const detail=getDetail(day,mt);
  const shopNames=new Set(shopList.filter(i=>!i.checked).map(i=>i.name.toLowerCase()));
  const close=()=>{updateDetail(day,mt,{recipe:recipeText});setDetailSlot(null);setNewIng({name:"",qty:"1"});};
  // Keep recipeText in sync when detailSlot changes
  if(recipeText===""&&detail.recipe){
    // initialise on first open (can't use useEffect here, but reading on render is fine — it's just a string)
  }
  const currentRecipe=detail.recipe||"";
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={close}>
    <div style={{background:S.T.card,border:`1px solid ${S.T.border}`,borderRadius:14,padding:24,maxWidth:560,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{...S.row,marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontSize:10,color:S.T.sub,fontFamily:"monospace",letterSpacing:"0.15em"}}>{day.toUpperCase()} — {mt.toUpperCase()}</div>
          <div style={{fontSize:18,color:S.T.text,fontWeight:"bold"}}>{mealName||"No meal set"}</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button style={{...S.btn("#4CAF50"),padding:"6px 12px",fontSize:12}} onClick={()=>addAllIngsToShop(day,mt)} disabled={detail.ingredients.length===0}>Add All to List</button>
          <button style={{...S.btnGhost,padding:"6px 12px",fontSize:12}} onClick={close}>Close</button>
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <div style={S.h2}>Ingredients</div>
        {detail.ingredients.length===0&&<div style={{fontSize:13,color:S.T.sub,marginBottom:10}}>No ingredients yet. Add them below.</div>}
        {detail.ingredients.map(ing=>{
          const onList=shopNames.has(ing.name.toLowerCase());
          return(<div key={ing.id} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:`1px solid ${S.T.border}`,alignItems:"center"}}>
            <div style={{flex:1,fontSize:13,color:S.T.text}}>{ing.qty&&ing.qty!=="1"?ing.qty+" ":""}{ing.name}</div>
            <button onClick={()=>addIngToShop(ing)} style={{...S.btn(onList?"#4CAF50":S.T.accent),padding:"3px 10px",fontSize:11,opacity:onList?0.6:1}}>{onList?"On List":"+ List"}</button>
            <button onClick={()=>delIngredient(day,mt,ing.id)} style={S.btnDanger}>X</button>
          </div>);
        })}
        <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{flex:1}}><div style={S.label}>Ingredient</div><input style={S.input} placeholder="e.g. Chicken breast" value={newIng.name} onChange={e=>setNewIng({...newIng,name:e.target.value})} onKeyDown={e=>{if(e.key==="Enter"&&newIng.name.trim()){addIngredient(day,mt,{name:newIng.name.trim(),qty:newIng.qty});setNewIng({name:"",qty:"1"});}}}/></div>
          <div style={{width:80}}><div style={S.label}>Qty</div><input style={S.input} placeholder="1" value={newIng.qty} onChange={e=>setNewIng({...newIng,qty:e.target.value})}/></div>
          <button style={{...S.btn(),padding:"9px 14px"}} onClick={()=>{if(!newIng.name.trim())return;addIngredient(day,mt,{name:newIng.name.trim(),qty:newIng.qty});setNewIng({name:"",qty:"1"});}}>Add</button>
        </div>
      </div>
      <div>
        <div style={S.h2}>Recipe / Instructions</div>
        <textarea style={{...S.input,height:160,resize:"vertical",lineHeight:1.5}} placeholder="Type or paste your recipe steps here..." defaultValue={currentRecipe} onBlur={e=>updateDetail(day,mt,{recipe:e.target.value})}/>
        <div style={{fontSize:11,color:S.T.sub,marginTop:4}}>Changes save automatically when you click away from the text box.</div>
      </div>
    </div>
  </div>);
}

// ── MEALS TAB ─────────────────────────────────────────────────────────────────
function MealsTab({mealPlan,setMealPlan,shopList,setShopList,mealSuggestions,setMealSuggestions,shopRequests,setShopRequests,mealDetails,setMealDetails,profile,S}){
  const [editCell,setEditCell]=useState(null),[cellVal,setCellVal]=useState("");
  const [showAdd,setShowAdd]=useState(false),[newItem,setNewItem]=useState({name:"",qty:"1",category:"Grocery",notes:""});
  const [filterCat,setFilterCat]=useState("All");
  const [detailSlot,setDetailSlot]=useState(null);
  const saveMeals=u=>{setMealPlan(u);store.save("fp2:mealPlan",u);};
  const saveShop=u=>{setShopList(u);store.save("fp2:shopList",u);};
  const saveSugg=u=>{setMealSuggestions(u);store.save("fp2:mealSuggestions",u);};
  const saveReqs=u=>{setShopRequests(u);store.save("fp2:shopRequests",u);};
  const saveDetails=u=>{setMealDetails(u);store.save("fp2:mealDetails",u);};
  const saveCell=()=>{if(!editCell)return;saveMeals({...mealPlan,[editCell.day]:{...mealPlan[editCell.day],[editCell.mt]:cellVal}});setEditCell(null);setCellVal("");};
  const addItem=()=>{if(!newItem.name)return;saveShop([...shopList,{...newItem,id:Date.now(),addedBy:"Parents",checked:false}]);setNewItem({name:"",qty:"1",category:"Grocery",notes:""});setShowAdd(false);};
  const toggleItem=id=>saveShop(shopList.map(i=>i.id===id?{...i,checked:!i.checked}:i));
  const delItem=id=>saveShop(shopList.filter(i=>i.id!==id));
  const approveSugg=id=>{const s=mealSuggestions.find(x=>x.id===id);if(s){saveMeals({...mealPlan,[s.dayPreference]:{...mealPlan[s.dayPreference],[s.mealType]:s.meal}});saveSugg(mealSuggestions.map(x=>x.id===id?{...x,status:"approved"}:x));}};
  const declineSugg=id=>saveSugg(mealSuggestions.map(s=>s.id===id?{...s,status:"declined"}:s));
  const approveReq=id=>{const r=shopRequests.find(x=>x.id===id);if(r){saveShop([...shopList,{id:Date.now(),name:r.item,qty:r.qty||"1",category:"Grocery",addedBy:r.kidName,checked:false,notes:r.notes||""}]);saveReqs(shopRequests.map(x=>x.id===id?{...x,status:"added"}:x));}};
  const declineReq=id=>saveReqs(shopRequests.map(r=>r.id===id?{...r,status:"declined"}:r));
  const pendS=mealSuggestions.filter(s=>s.status==="pending"),pendR=shopRequests.filter(r=>r.status==="pending");
  const unchecked=shopList.filter(i=>!i.checked),checked=shopList.filter(i=>i.checked);
  const groupedUnchecked=filterCat==="All"?SHOP_CATS.reduce((acc,cat)=>{const items=unchecked.filter(i=>i.category===cat);if(items.length>0)acc[cat]=items;return acc;},{}):{[filterCat]:unchecked.filter(i=>i.category===filterCat)};
  const slotKey=(day,mt)=>day+"__"+mt;
  const hasDetail=(day,mt)=>{const d=mealDetails[slotKey(day,mt)];return d&&(d.ingredients?.length>0||d.recipe?.trim());};
  return(<>
    <MealDetailModal detailSlot={detailSlot} setDetailSlot={setDetailSlot} mealPlan={mealPlan} mealDetails={mealDetails} shopList={shopList} saveDetails={saveDetails} saveShop={saveShop} S={S}/>
    {(pendS.length>0||pendR.length>0)&&<div style={{...S.alert(GOLD),marginBottom:14}}><span style={{color:GOLD,fontWeight:"bold"}}>★ {pendS.length+pendR.length} pending request{pendS.length+pendR.length!==1?"s":""} from the kids — </span><span style={{color:S.T.sub,fontSize:13}}>scroll down to review</span></div>}
    <div style={S.card}><div style={S.h2}>This Week — click a meal name to add ingredients or a recipe</div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:620}}>
        <thead><tr><th style={{width:90,padding:"8px 8px",textAlign:"left",color:S.T.sub,fontSize:11,fontFamily:"monospace",borderBottom:`1px solid ${S.T.border}`}}></th>{DAYS.map(d=><th key={d} style={{padding:"6px 4px",textAlign:"center",borderBottom:`1px solid ${S.T.border}`,fontFamily:"Georgia,serif",fontWeight:"normal",minWidth:80}}><div style={{fontSize:9,color:GOLD,fontFamily:"monospace",letterSpacing:"0.1em"}}>{d.slice(0,3).toUpperCase()}</div></th>)}</tr></thead>
        <tbody>{MEAL_TYPES.map(mt=><tr key={mt}><td style={{padding:"6px 8px",fontSize:10,color:S.T.sub,fontFamily:"monospace",borderRight:`1px solid ${S.T.border}`,whiteSpace:"nowrap",minWidth:90}}>{mt==="Breakfast"?"🌅":mt==="Lunch"?"☀️":"🌙"} {mt}</td>{DAYS.map(day=>{const val=mealPlan[day]?.[mt]||"",isEdit=editCell?.day===day&&editCell?.mt===mt,hasDet=hasDetail(day,mt);return(<td key={day} style={{padding:3,borderBottom:`1px solid #1a1a0f`,verticalAlign:"top"}}>
          {isEdit
            ?<div><input autoFocus style={{...S.input,fontSize:12,padding:"5px 7px"}} value={cellVal} onChange={e=>setCellVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveCell();if(e.key==="Escape"){setEditCell(null);setCellVal("");}}}/><div style={{display:"flex",gap:4,marginTop:3}}><button style={{...S.btn(),padding:"3px 8px",fontSize:11}} onClick={saveCell}>OK</button><button style={{...S.btnGhost,padding:"3px 8px",fontSize:11}} onClick={()=>{setEditCell(null);setCellVal("");}}>X</button></div></div>
            :<div style={{minHeight:38,padding:"5px 6px",borderRadius:5}}>
              {val
                ?<div>
                  <div onClick={()=>setDetailSlot({day,mt})} style={{fontSize:11,color:S.T.text,cursor:"pointer",marginBottom:2,textDecoration:"underline",textDecorationStyle:"dotted"}}>{val}</div>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    {hasDet&&<span style={{fontSize:9,color:"#4CAF50",fontFamily:"monospace"}}>📋</span>}
                    <span onClick={()=>{setEditCell({day,mt});setCellVal(val);}} style={{fontSize:9,color:S.T.sub,cursor:"pointer"}}>✏ edit</span>
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
        <div style={{...S.h2,...S.row,flexWrap:"wrap",gap:8}}><span>Shopping List</span><button style={S.btn()} onClick={()=>setShowAdd(!showAdd)}>{showAdd?"Cancel":"Add Item"}</button></div>
        {showAdd&&<div style={{marginBottom:14,padding:12,background:S.T.bg,borderRadius:8}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:8}}>
            <div><div style={S.label}>Item</div><input style={S.input} placeholder="e.g. Milk" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})}/></div>
            <div><div style={S.label}>Qty</div><input style={S.input} value={newItem.qty} onChange={e=>setNewItem({...newItem,qty:e.target.value})}/></div>
            <div><div style={S.label}>Category</div><select style={S.select} value={newItem.category} onChange={e=>setNewItem({...newItem,category:e.target.value})}>{SHOP_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
          <div style={{display:"flex",gap:8}}><input style={{...S.input,flex:1}} placeholder="Notes" value={newItem.notes} onChange={e=>setNewItem({...newItem,notes:e.target.value})}/><button style={S.btn()} onClick={addItem}>Add</button></div>
        </div>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
          {["All",...SHOP_CATS].map(c=><button key={c} onClick={()=>setFilterCat(c)} style={{padding:"2px 8px",borderRadius:8,fontSize:10,cursor:"pointer",fontFamily:"Georgia,serif",background:filterCat===c?GOLD+"33":"transparent",border:`1px solid ${filterCat===c?GOLD:S.T.border}`,color:filterCat===c?GOLD:S.T.sub}}>{c}</button>)}
        </div>
        {unchecked.length===0&&checked.length===0&&<div style={{color:S.T.sub,fontSize:13,padding:"10px 0",textAlign:"center"}}>List is empty.</div>}
        {Object.entries(groupedUnchecked).map(([cat,items])=>items.length>0&&<div key={cat}>{cat&&<div style={{...S.label,marginTop:8,marginBottom:4}}>{cat}</div>}{items.map(item=><div key={item.id} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:`1px solid #1a1a0f`,alignItems:"center"}}><div onClick={()=>toggleItem(item.id)} style={{width:17,height:17,borderRadius:3,border:`2px solid ${S.T.border}`,cursor:"pointer",flexShrink:0}}/><div style={{flex:1}}><div style={{fontSize:13,color:S.T.text}}>{item.qty&&item.qty!=="1"?item.qty+"x ":""}{item.name}</div>{(item.addedBy&&item.addedBy!=="Parents"||item.notes)?<div style={{fontSize:10,color:S.T.sub}}>{item.addedBy&&item.addedBy!=="Parents"?item.addedBy:""}{item.notes?" — "+item.notes:""}</div>:null}</div><button style={S.btnDanger} onClick={()=>delItem(item.id)}>X</button></div>)}</div>)}
        {checked.length>0&&<div style={{marginTop:8}}><div style={{...S.label,marginBottom:4}}>DONE</div>{checked.map(item=><div key={item.id} style={{display:"flex",gap:8,padding:"4px 0",alignItems:"center",opacity:0.45}}><div onClick={()=>toggleItem(item.id)} style={{width:17,height:17,borderRadius:3,border:"2px solid #4CAF50",background:"#4CAF50",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#0d0d08",fontSize:10,fontWeight:"bold"}}>✓</div><span style={{fontSize:12,color:S.T.sub,textDecoration:"line-through",flex:1}}>{item.name}</span><button style={S.btnDanger} onClick={()=>delItem(item.id)}>X</button></div>)}<button style={{...S.btnGhost,marginTop:6,fontSize:11}} onClick={()=>saveShop(shopList.filter(i=>!i.checked))}>Clear Done</button></div>}
      </div>
      <div>
        {pendS.length>0&&<div style={S.card}><div style={S.h2}>Meal Suggestions from Kids</div>{pendS.map(s=><div key={s.id} style={{padding:"8px 0",borderBottom:`1px solid ${S.T.border}`}}><div style={{...S.row,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:14,color:S.T.text,fontWeight:"bold"}}>{s.meal}</div><div style={{fontSize:11,color:S.T.sub,marginTop:1}}>{s.kidName} — {s.dayPreference} {s.mealType}{s.notes?" — "+s.notes:""}</div></div><div style={{display:"flex",gap:6}}><button style={{...S.btn("#4CAF50"),padding:"5px 10px",fontSize:12}} onClick={()=>approveSugg(s.id)}>Add</button><button style={S.btnDanger} onClick={()=>declineSugg(s.id)}>X</button></div></div></div>)}</div>}
        {pendR.length>0&&<div style={S.card}><div style={S.h2}>Shopping Requests from Kids</div>{pendR.map(r=><div key={r.id} style={{padding:"8px 0",borderBottom:`1px solid ${S.T.border}`}}><div style={{...S.row,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:14,color:S.T.text,fontWeight:"bold"}}>{r.qty&&r.qty!=="1"?r.qty+"x ":""}{r.item}</div><div style={{fontSize:11,color:S.T.sub,marginTop:1}}>{r.kidName}{r.notes?" — "+r.notes:""}</div></div><div style={{display:"flex",gap:6}}><button style={{...S.btn("#4CAF50"),padding:"5px 10px",fontSize:12}} onClick={()=>approveReq(r.id)}>Add</button><button style={S.btnDanger} onClick={()=>declineReq(r.id)}>X</button></div></div></div>)}</div>}
        {pendS.length===0&&pendR.length===0&&<div style={{...S.card,textAlign:"center",padding:28,color:S.T.sub}}><div style={{fontSize:22,marginBottom:6}}>All clear!</div><div style={{fontSize:13}}>No pending requests from the kids.</div></div>}
      </div>
    </div>
  </>);
}

// ── ACCOUNT ROW (top-level — must not be inside AccountsTab) ─────────────────
function AcctRow({a,editing,setEditing,update,save,accounts,S}){
  return(<div style={{...S.card,marginBottom:8}}>{editing===a.id?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,alignItems:"flex-end"}}><div><div style={S.label}>Name</div><input style={S.input} value={a.name} onChange={e=>update(a.id,"name",e.target.value)}/></div><div><div style={S.label}>Balance</div><input style={S.input} type="number" value={a.balance} onChange={e=>update(a.id,"balance",e.target.value)}/></div><div><div style={S.label}>APY %</div><input style={S.input} type="number" value={a.apy||0} onChange={e=>update(a.id,"apy",e.target.value)}/></div><div><div style={S.label}>Contrib/mo</div><input style={S.input} type="number" value={a.monthlyContrib||0} onChange={e=>update(a.id,"monthlyContrib",e.target.value)}/></div><div><div style={S.label}>Institution</div><input style={S.input} value={a.institution} onChange={e=>update(a.id,"institution",e.target.value)}/></div><button style={{...S.btn(),marginTop:20}} onClick={()=>setEditing(null)}>Done</button></div>:<div style={{...S.row,flexWrap:"wrap",gap:8}}><div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{...S.tag(a.type==="TSP"||a.type==="Roth IRA"||a.type==="401k"?"#9C27B0":a.type==="HYSA"||a.type==="Savings"?"#4CAF50":GOLD)}}>{a.type}</div><div><div style={{fontSize:14,color:S.T.text}}>{a.name}<span style={{fontSize:11,color:S.T.sub}}> · {a.institution}</span></div>{a.apy>0&&<div style={{fontSize:11,color:"#4CAF50"}}>{a.apy}% APY</div>}{a.monthlyContrib>0&&<div style={{fontSize:11,color:"#9C27B0"}}>{fmt(a.monthlyContrib)}/mo</div>}</div></div><div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{fontSize:20,color:GOLD,fontFamily:"monospace",fontWeight:"bold"}}>{fmt(a.balance)}</div><button style={S.btnGhost} onClick={()=>setEditing(a.id)}>Edit</button><button style={S.btnDanger} onClick={()=>save(accounts.filter(x=>x.id!==a.id))}>X</button></div></div>}</div>);
}

function AccountsTab({accounts,setAccounts,profile,S}){
  const blank={name:"",owner:"me",type:"Checking",balance:"",institution:"",apy:"",monthlyContrib:""};
  const [form,setForm]=useState(blank),[editing,setEditing]=useState(null);
  const save=u=>{setAccounts(u);store.save("fp2:accounts",u);};
  const add=()=>{if(!form.name||!form.balance)return;save([...accounts,{...form,id:Date.now(),balance:+form.balance,apy:+form.apy||0,monthlyContrib:+form.monthlyContrib||0}]);setForm(blank);};
  const update=(id,f,v)=>save(accounts.map(a=>a.id===id?{...a,[f]:f==="name"||f==="institution"||f==="owner"||f==="type"?v:+v}:a));
  const myA=accounts.filter(a=>a.owner==="me"),fA=accounts.filter(a=>a.owner==="fiance");
  const rowProps={editing,setEditing,update,save,accounts,S};
  return(<><div style={S.grid2}><div><div style={{...S.h2,...S.row}}><span>{profile.myName}'s Accounts</span><span style={{color:GOLD,fontFamily:"monospace"}}>{fmt(myA.reduce((s,a)=>s+a.balance,0))}</span></div>{myA.map(a=><AcctRow key={a.id} a={a} {...rowProps}/>)}</div><div><div style={{...S.h2,...S.row}}><span>{profile.fianceName}'s Accounts</span><span style={{color:GOLD,fontFamily:"monospace"}}>{fmt(fA.reduce((s,a)=>s+a.balance,0))}</span></div>{fA.map(a=><AcctRow key={a.id} a={a} {...rowProps}/>)}</div></div><div style={S.card}><div style={S.h2}>Add Account</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,alignItems:"flex-end"}}><div><div style={S.label}>Name</div><input style={S.input} placeholder="Main Checking" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div><div style={S.label}>Type</div><select style={S.select} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{ACCT_TYPES.map(t=><option key={t}>{t}</option>)}</select></div><div><div style={S.label}>Owner</div><select style={S.select} value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})}><option value="me">{profile.myName}</option><option value="fiance">{profile.fianceName}</option></select></div><div><div style={S.label}>Balance</div><input style={S.input} type="number" placeholder="0" value={form.balance} onChange={e=>setForm({...form,balance:e.target.value})}/></div><div><div style={S.label}>APY %</div><input style={S.input} type="number" placeholder="0" value={form.apy} onChange={e=>setForm({...form,apy:e.target.value})}/></div><div><div style={S.label}>Institution</div><input style={S.input} placeholder="Ally" value={form.institution} onChange={e=>setForm({...form,institution:e.target.value})}/></div><button style={S.btn()} onClick={add}>Add</button></div></div></>);
}

function DebtsTab({debts,setDebts,profile,S}){
  const blank={name:"",type:"Credit Card",balance:"",rate:"",minPayment:"",owner:"me"};
  const [form,setForm]=useState(blank),[editing,setEditing]=useState(null);
  const save=u=>{setDebts(u);store.save("fp2:debts",u);};
  const add=()=>{if(!form.name||!form.balance)return;save([...debts,{...form,id:Date.now(),balance:+form.balance,rate:+form.rate||0,minPayment:+form.minPayment||0}]);setForm(blank);};
  const update=(id,f,v)=>save(debts.map(d=>d.id===id?{...d,[f]:f==="name"||f==="type"||f==="owner"?v:+v}:d));
  const total=debts.reduce((s,d)=>s+d.balance,0),totalMin=debts.reduce((s,d)=>s+d.minPayment,0);
  return(<><div style={S.grid3}>{[{l:"Total Debt",v:fmt(total),c:"#f44336"},{l:"Min Payments",v:fmt(totalMin)+"/mo",c:"#FF9800"},{l:"Avg APR",v:(debts.filter(d=>d.rate>0).reduce((s,d)=>s+d.rate,0)/Math.max(debts.filter(d=>d.rate>0).length,1)).toFixed(1)+"%",c:"#FF9800"}].map((k,i)=><div key={i} style={{...S.card,borderTop:`3px solid ${k.c}`,marginBottom:0}}><div style={S.label}>{k.l}</div><div style={{fontSize:20,color:k.c,fontFamily:"monospace",fontWeight:"bold"}}>{k.v}</div></div>)}</div>
    <div style={{marginTop:14}}>{debts.map(d=>{const tc=d.type==="Credit Card"?"#f44336":d.type==="Student Loan"?"#2196F3":d.type==="Auto"?"#FF9800":"#888";return <div key={d.id} style={{...S.card,marginBottom:8,borderLeft:`3px solid ${tc}`}}>{editing===d.id?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,alignItems:"flex-end"}}><div><div style={S.label}>Name</div><input style={S.input} value={d.name} onChange={e=>update(d.id,"name",e.target.value)}/></div><div><div style={S.label}>Balance</div><input style={S.input} type="number" value={d.balance} onChange={e=>update(d.id,"balance",e.target.value)}/></div><div><div style={S.label}>APR %</div><input style={S.input} type="number" value={d.rate} onChange={e=>update(d.id,"rate",e.target.value)}/></div><div><div style={S.label}>Min Payment</div><input style={S.input} type="number" value={d.minPayment} onChange={e=>update(d.id,"minPayment",e.target.value)}/></div><div><div style={S.label}>Type</div><select style={S.select} value={d.type} onChange={e=>update(d.id,"type",e.target.value)}>{DEBT_TYPES.map(t=><option key={t}>{t}</option>)}</select></div><button style={{...S.btn(),marginTop:20}} onClick={()=>setEditing(null)}>✓</button></div>:<div style={{...S.row,flexWrap:"wrap",gap:8}}><div><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}><span style={{fontSize:14,color:S.T.text}}>{d.name}</span><span style={S.tag(tc)}>{d.type}</span>{d.pslf&&<span style={S.tag("#4CAF50")}>PSLF</span>}</div><div style={{display:"flex",gap:12,fontSize:12,color:S.T.sub}}>{d.rate>0&&<span>{d.rate}% APR</span>}<span>Min: {fmt(d.minPayment)}/mo</span>{d.pslf&&<span style={{color:"#4CAF50"}}>DO NOT pay extra</span>}</div></div><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:20,color:tc,fontFamily:"monospace",fontWeight:"bold"}}>{fmt(d.balance)}</span><button style={S.btnGhost} onClick={()=>setEditing(d.id)}>Edit</button><button style={S.btnDanger} onClick={()=>save(debts.filter(x=>x.id!==d.id))}>✕</button></div></div>}</div>;})}
    </div><div style={S.card}><div style={S.h2}>Add Debt</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,alignItems:"flex-end"}}><div><div style={S.label}>Name</div><input style={S.input} placeholder="Chase Sapphire" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div><div style={S.label}>Type</div><select style={S.select} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{DEBT_TYPES.map(t=><option key={t}>{t}</option>)}</select></div><div><div style={S.label}>Balance</div><input style={S.input} type="number" placeholder="0" value={form.balance} onChange={e=>setForm({...form,balance:e.target.value})}/></div><div><div style={S.label}>APR %</div><input style={S.input} type="number" placeholder="0" value={form.rate} onChange={e=>setForm({...form,rate:e.target.value})}/></div><div><div style={S.label}>Min Payment</div><input style={S.input} type="number" placeholder="0" value={form.minPayment} onChange={e=>setForm({...form,minPayment:e.target.value})}/></div><button style={S.btn()} onClick={add}>Add</button></div></div></>);
}

function BudgetTab({expenses,setExpenses,transactions,takeHome,slPayment,S}){
  const [editCat,setEditCat]=useState(null),[newCat,setNewCat]=useState(""),[newItem,setNewItem]=useState({catId:null,name:"",amount:"",due:""});
  const save=u=>{setExpenses(u);store.save("fp2:expenses",u);};
  const total=expenses.reduce((s,c)=>s+c.items.reduce((ss,i)=>ss+i.amount,0),0);
  const now=new Date(),mo=now.getMonth(),yr=now.getFullYear();
  const mTxns=transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===mo&&d.getFullYear()===yr&&t.amount<0;});
  const actuals={};CATS.forEach(c=>{actuals[c]=mTxns.filter(t=>t.category===c).reduce((s,t)=>s+Math.abs(t.amount),0);});
  const addCat=()=>{if(!newCat)return;save([...expenses,{id:Date.now(),category:newCat,items:[]}]);setNewCat("");};
  const delCat=id=>save(expenses.filter(c=>c.id!==id));
  const addItem=()=>{if(!newItem.catId||!newItem.name||!newItem.amount)return;save(expenses.map(c=>c.id===newItem.catId?{...c,items:[...c.items,{id:Date.now(),name:newItem.name,amount:+newItem.amount,due:+newItem.due||0}]}:c));setNewItem({catId:newItem.catId,name:"",amount:"",due:""});};
  const delItem=(cId,iId)=>save(expenses.map(c=>c.id===cId?{...c,items:c.items.filter(i=>i.id!==iId)}:c));
  const updateItem=(cId,iId,f,v)=>save(expenses.map(c=>c.id===cId?{...c,items:c.items.map(i=>i.id===iId?{...i,[f]:f==="name"?v:+v}:i)}:c));
  return(<><div style={S.grid3}>{[{l:"Total Budgeted",v:fmt(total),c:GOLD},{l:"Take-Home",v:fmt(takeHome),c:"#4CAF50"},{l:"Surplus",v:fmt(takeHome-total-slPayment),c:(takeHome-total-slPayment)>0?"#4CAF50":"#f44336"}].map((k,i)=><div key={i} style={{...S.card,borderTop:`3px solid ${k.c}`,marginBottom:0}}><div style={S.label}>{k.l}</div><div style={{fontSize:20,color:k.c,fontFamily:"monospace",fontWeight:"bold"}}>{k.v}</div></div>)}</div>
    <div style={{marginTop:14}}>{expenses.map(cat=>{const ct=cat.items.reduce((s,i)=>s+i.amount,0),act=actuals[cat.category]||0,over=act>ct&&ct>0;return <div key={cat.id} style={S.card}><div style={{...S.row,marginBottom:10,flexWrap:"wrap",gap:8}}><div style={{display:"flex",gap:8,alignItems:"center"}}><button style={{...S.btnGhost,padding:"3px 8px",fontSize:12}} onClick={()=>setEditCat(editCat===cat.id?null:cat.id)}>{editCat===cat.id?"▲":"▼"}</button><span style={{fontSize:14,color:S.T.text}}>{cat.category}</span>{act>0&&<span style={S.tag(over?"#f44336":"#4CAF50")}>{over?"Over":"Actual"}: {fmt(act)}</span>}</div><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{color:over?"#f44336":GOLD,fontFamily:"monospace",fontWeight:"bold"}}>{fmt(ct)}/mo</span><button style={S.btnDanger} onClick={()=>delCat(cat.id)}>✕</button></div></div>{ct>0&&<Bar value={act} max={ct} color={over?"#f44336":"#4CAF50"}/>}{editCat===cat.id&&<div style={{marginTop:12}}>{cat.items.map(item=><div key={item.id} style={{...S.row,padding:"6px 0",borderBottom:`1px solid #1a1a0f`,flexWrap:"wrap",gap:8}}><div style={{display:"flex",gap:8,alignItems:"center",flex:1}}><input style={{...S.input,maxWidth:180}} value={item.name} onChange={e=>updateItem(cat.id,item.id,"name",e.target.value)}/><input style={{...S.input,maxWidth:90}} type="number" value={item.amount} onChange={e=>updateItem(cat.id,item.id,"amount",e.target.value)}/></div><button style={S.btnDanger} onClick={()=>delItem(cat.id,item.id)}>✕</button></div>)}<div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap",alignItems:"flex-end"}}><input style={{...S.input,maxWidth:180}} placeholder="Item name" value={newItem.catId===cat.id?newItem.name:""} onChange={e=>setNewItem({...newItem,catId:cat.id,name:e.target.value})}/><input style={{...S.input,maxWidth:90}} type="number" placeholder="Amount" value={newItem.catId===cat.id?newItem.amount:""} onChange={e=>setNewItem({...newItem,catId:cat.id,amount:e.target.value})}/><button style={S.btn()} onClick={addItem}>+ Add</button></div></div>}</div>;})}
    </div><div style={S.card}><div style={S.h2}>Add Category</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><input style={{...S.input,maxWidth:220}} placeholder="Category name" value={newCat} onChange={e=>setNewCat(e.target.value)}/><button style={S.btn()} onClick={addCat}>Add</button></div></div></>);
}

function GoalsTab({goals,setGoals,S}){
  const blank={name:"",icon:"🎯",target:"",saved:"",date:"",color:GOLD};
  const [form,setForm]=useState(blank),[editing,setEditing]=useState(null);
  const save=u=>{setGoals(u);store.save("fp2:goals",u);};
  const add=()=>{if(!form.name||!form.target)return;save([...goals,{...form,id:Date.now(),target:+form.target,saved:+form.saved||0}]);setForm(blank);};
  const update=(id,f,v)=>save(goals.map(g=>g.id===id?{...g,[f]:f==="name"||f==="icon"||f==="color"||f==="date"?v:+v}:g));
  const COLORS=[GOLD,"#4CAF50","#2196F3","#E91E63","#9C27B0","#FF9800","#f44336","#00BCD4"];
  const ICONS=["🏡","🛡","💍","✈️","🌅","🚗","🎓","💰","🏖","🎯"];
  return(<><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14,marginBottom:14}}>{goals.map(g=>{const p=Math.min(g.saved/g.target*100,100),rem=g.target-g.saved,due=new Date(g.date),mo=Math.max(1,Math.round((due-new Date())/(864e5*30)));return(<div key={g.id} style={{...S.card,borderTop:`3px solid ${g.color}`,marginBottom:0}}>{editing===g.id?<div><div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>{ICONS.map(ic=><button key={ic} style={{background:g.icon===ic?g.color+"33":"transparent",border:`1px solid ${g.icon===ic?g.color:S.T.border}`,borderRadius:4,padding:"3px 7px",cursor:"pointer",fontSize:15}} onClick={()=>update(g.id,"icon",ic)}>{ic}</button>)}</div><input style={{...S.input,marginBottom:8}} value={g.name} onChange={e=>update(g.id,"name",e.target.value)}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}><div><div style={S.label}>Target</div><input style={S.input} type="number" value={g.target} onChange={e=>update(g.id,"target",e.target.value)}/></div><div><div style={S.label}>Saved</div><input style={S.input} type="number" value={g.saved} onChange={e=>update(g.id,"saved",e.target.value)}/></div><div><div style={S.label}>Date</div><input style={S.input} type="date" value={g.date} onChange={e=>update(g.id,"date",e.target.value)}/></div><div><div style={S.label}>Color</div><div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>{COLORS.map(c=><button key={c} style={{width:20,height:20,borderRadius:"50%",background:c,border:g.color===c?"2px solid #fff":"2px solid transparent",cursor:"pointer"}} onClick={()=>update(g.id,"color",c)}/>)}</div></div></div><button style={{...S.btn(),width:"100%"}} onClick={()=>setEditing(null)}>Done</button></div>:<><div style={{...S.row,marginBottom:8}}><div style={{fontSize:26}}>{g.icon}</div><div style={{display:"flex",gap:6}}><button style={S.btnGhost} onClick={()=>setEditing(g.id)}>Edit</button><button style={S.btnDanger} onClick={()=>save(goals.filter(x=>x.id!==g.id))}>X</button></div></div><div style={{fontSize:15,color:S.T.text,marginBottom:4}}>{g.name}</div><div style={{...S.row,marginBottom:6}}><span style={{color:g.color,fontFamily:"monospace",fontSize:18,fontWeight:"bold"}}>{fmt(g.saved)}</span><span style={{color:S.T.sub,fontFamily:"monospace"}}>{fmt(g.target)}</span></div><Bar value={g.saved} max={g.target} color={g.color} height={8}/><div style={{...S.row,marginTop:8,fontSize:12,color:S.T.sub}}><span>{p.toFixed(0)}% done</span><span>{fmt(rem)} to go</span></div>{g.date&&<div style={{fontSize:11,color:S.T.sub,marginTop:4}}>Target: {g.date} ({mo} mo)</div>}</> }</div>);})}</div>
    <div style={S.card}><div style={S.h2}>Add Goal</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,alignItems:"flex-end"}}><div><div style={S.label}>Goal Name</div><input style={S.input} placeholder="e.g. Honeymoon Fund" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div><div style={S.label}>Target</div><input style={S.input} type="number" placeholder="10000" value={form.target} onChange={e=>setForm({...form,target:e.target.value})}/></div><div><div style={S.label}>Saved</div><input style={S.input} type="number" placeholder="0" value={form.saved} onChange={e=>setForm({...form,saved:e.target.value})}/></div><div><div style={S.label}>Target Date</div><input style={S.input} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><button style={S.btn()} onClick={add}>Add</button></div></div></>);
}

function StatementsTab({transactions,setTransactions,handleUpload,uploadLoading,reviewTxns,setReviewTxns,confirmTxns,fileRef,S}){
  const [sel,setSel]=useState([]),[catE,setCatE]=useState({});
  useEffect(()=>{if(reviewTxns)setSel(reviewTxns.map(t=>t.id));},[reviewTxns]);
  const toggle=id=>setSel(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const confirm=()=>{confirmTxns(reviewTxns.map(t=>({...t,category:catE[t.id]||t.category})).filter(t=>sel.includes(t.id)));setSel([]);setCatE({});};
  const spend=transactions.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
  const income=transactions.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
  const byCat={};transactions.filter(t=>t.amount<0).forEach(t=>{byCat[t.category]=(byCat[t.category]||0)+Math.abs(t.amount);});
  return(<><div style={S.card}><div style={S.h2}>Upload Statement</div><div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}><p style={{color:S.T.sub,fontSize:13,margin:0,flex:1}}>Upload a bank or credit card statement (PDF or CSV). AI reads it, categorizes transactions, and shows a review screen before saving.</p><div><input ref={fileRef} type="file" accept=".pdf,.csv,.txt" onChange={handleUpload} style={{display:"none"}}/><button style={{...S.btn(),padding:"12px 24px"}} onClick={()=>fileRef.current?.click()} disabled={uploadLoading}>{uploadLoading?"Processing...":"Choose File"}</button></div></div></div>
    {reviewTxns&&<div style={S.card}><div style={{...S.h2,...S.row,flexWrap:"wrap",gap:8}}><span>Review ({reviewTxns.length} found)</span><div style={{display:"flex",gap:8}}><button style={S.btnGhost} onClick={()=>{setReviewTxns(null);setSel([]);setCatE({});}}>Cancel</button><button style={S.btn()} onClick={confirm}>Confirm {sel.length}</button></div></div><div style={{maxHeight:360,overflowY:"auto"}}>{reviewTxns.map(t=><div key={t.id} style={{...S.row,padding:"7px 0",borderBottom:`1px solid #1a1a0f`,gap:8,opacity:sel.includes(t.id)?1:0.4,flexWrap:"wrap"}}><input type="checkbox" checked={sel.includes(t.id)} onChange={()=>toggle(t.id)} style={{accentColor:GOLD}}/><div style={{flex:1}}><div style={{fontSize:13,color:S.T.text}}>{t.description}</div><div style={{fontSize:11,color:S.T.sub}}>{t.date}</div></div><select style={{...S.select,maxWidth:130,fontSize:11,padding:"4px 8px"}} value={catE[t.id]||t.category} onChange={e=>setCatE({...catE,[t.id]:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select><span style={{color:t.amount<0?"#f44336":"#4CAF50",fontFamily:"monospace",fontWeight:"bold",minWidth:70,textAlign:"right"}}>{t.amount<0?"−":"+"}{fmt(Math.abs(t.amount))}</span></div>)}</div></div>}
    {transactions.length>0&&<><div style={S.grid3}>{[{l:"Imported",v:`${transactions.length} txns`,c:GOLD},{l:"Spending",v:fmt(spend),c:"#f44336"},{l:"Income",v:fmt(income),c:"#4CAF50"}].map((k,i)=><div key={i} style={{...S.card,marginBottom:0,borderTop:`3px solid ${k.c}`}}><div style={S.label}>{k.l}</div><div style={{fontSize:18,fontFamily:"monospace",color:k.c,fontWeight:"bold"}}>{k.v}</div></div>)}</div><div style={{...S.card,marginTop:14}}><div style={S.h2}>Spending by Category</div>{Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=><div key={cat} style={{marginBottom:10}}><div style={{...S.row,marginBottom:4}}><span style={{fontSize:13,color:S.T.sub}}>{cat}</span><span style={{fontFamily:"monospace",color:GOLD}}>{fmt(amt)}</span></div><Bar value={amt} max={Math.max(...Object.values(byCat))} color={GOLD}/></div>)}</div><div style={S.card}><div style={S.h2}>Transaction History</div><div style={{maxHeight:320,overflowY:"auto"}}>{[...transactions].reverse().map(t=><div key={t.id} style={{...S.row,padding:"6px 0",borderBottom:`1px solid #1a1a0f`,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:13,color:S.T.text}}>{t.description}</div><div style={{fontSize:11,color:S.T.sub}}>{t.date} · <span style={S.tag("#888")}>{t.category}</span></div></div><span style={{color:t.amount<0?"#f44336":"#4CAF50",fontFamily:"monospace"}}>{t.amount<0?"−":"+"}{fmt(Math.abs(t.amount))}</span></div>)}</div></div></>}
  </>);
}

function ScenariosTab({scenario,setScenario,debts,profile,combinedLiquid,totalCC,mortgageRate,homePrice,slPayment,S}){
  const sDown=homePrice*(scenario.downPct/100),sLoan=homePrice-sDown,sMort=calcMortgage(sLoan,mortgageRate);
  const sPMI=scenario.downPct<20?(sLoan*0.008)/12:0,sTotal=sMort+sPMI+slPayment+300;
  const sInc=(profile.myIncome+profile.fIncome+scenario.incomeBoost)/12;
  const sDTI=(sTotal/(sInc*0.65))*100,sCush=combinedLiquid+scenario.extraSavings-totalCC-sDown-homePrice*0.03;
  const cc=debts.filter(d=>d.type==="Credit Card");
  return(<><div style={{...S.alert("#2196F3"),marginBottom:14}}><span style={{color:"#2196F3",fontWeight:"bold"}}>Scenario Lab — </span><span style={{color:S.T.sub,fontSize:13}}>Adjust sliders to model scenarios. Nothing here changes your real data.</span></div>
    <div style={S.grid2}><div style={S.card}><div style={S.h2}>Adjust the Levers</div>{[{label:"Extra CC Payment/Month",key:"extraPayment",min:0,max:3000,step:50,fmt:fmt,color:GOLD},{label:"Annual Income Boost",key:"incomeBoost",min:0,max:60000,step:1000,fmt:fmt,color:"#4CAF50"},{label:"Down Payment %",key:"downPct",min:5,max:30,step:1,fmt:v=>v+"%",color:scenario.downPct>=20?"#4CAF50":"#FF9800"},{label:"Extra Savings Added",key:"extraSavings",min:0,max:60000,step:1000,fmt:fmt,color:"#9C27B0"}].map(sl=><div key={sl.key} style={{marginBottom:18}}><div style={{...S.row,marginBottom:6}}><div style={S.label}>{sl.label}</div><div style={{color:sl.color,fontFamily:"monospace",fontWeight:"bold"}}>{sl.fmt(scenario[sl.key])}</div></div><input type="range" min={sl.min} max={sl.max} step={sl.step} value={scenario[sl.key]} onChange={e=>setScenario({...scenario,[sl.key]:+e.target.value})} style={{width:"100%",accentColor:sl.color}}/></div>)}</div>
    <div><div style={S.card}><div style={S.h2}>Scenario Results</div>{[{l:"Down Payment",v:fmt(sDown),c:GOLD},{l:"PMI",v:sPMI>0?fmt(sPMI)+"/mo":"$0 — None ✓",c:sPMI>0?"#FF9800":"#4CAF50"},{l:"Monthly Mortgage",v:fmt(sMort),c:S.T.text},{l:"Post-Close Cushion",v:fmt(sCush),c:sCush>15000?"#4CAF50":sCush>5000?"#FF9800":"#f44336"},{l:"DTI",v:sDTI.toFixed(1)+"%",c:sDTI<36?"#4CAF50":sDTI<43?"#FF9800":"#f44336"}].map((r,i)=><div key={i} style={{...S.row,padding:"7px 0",borderBottom:`1px solid #1a1a0f`}}><span style={{fontSize:13,color:S.T.sub}}>{r.l}</span><span style={{color:r.c,fontFamily:"monospace",fontWeight:"bold"}}>{r.v}</span></div>)}</div>
    <div style={S.card}><div style={S.h2}>CC Payoff with Extra Payments</div>{cc.map(d=>{const base=calcPayoff(d.balance,d.rate,d.minPayment),extra=calcPayoff(d.balance,d.rate,d.minPayment+scenario.extraPayment/Math.max(cc.length,1)),saved=base-extra;return <div key={d.id} style={{marginBottom:10}}><div style={{...S.row,marginBottom:4,fontSize:13}}><span style={{color:S.T.sub}}>{d.name}</span><span style={{color:saved>0?"#4CAF50":GOLD,fontFamily:"monospace"}}>{base>=999?"∞":base}mo → {extra>=999?"∞":extra}mo{saved>0&&<span style={{color:"#4CAF50"}}> (−{saved}mo)</span>}</span></div><Bar value={Math.max(0,saved)} max={Math.max(base,1)} color="#4CAF50"/></div>;})}
    </div></div></div></>);
}

function PslfTab({pslf,setPslf,debts,S}){
  const upd=(f,v)=>{const n={...pslf,[f]:v};setPslf(n);store.save("fp2:pslf",n);};
  const sl=debts.find(d=>d.pslf),rem=120-pslf.qualifyingPayments;
  const checklist=[{id:"idr",label:"Enrolled in IDR plan",detail:"SAVE, PAYE, IBR, or ICR"},{id:"emp",label:"Full-time qualifying employer",detail:"Federal, state, local, tribal, or eligible nonprofit"},{id:"ecf",label:"Employment Certification submitted this year",detail:"Submit annually at StudentAid.gov"},{id:"pay",label:"Making on-time qualifying payments",detail:"Every payment must be on-time"},{id:"cnt",label:"Verified payment count at StudentAid.gov",detail:"Log in and confirm"},{id:"loans",label:"Only DIRECT loans",detail:"Not FFEL or Perkins"},{id:"stay",label:"Not leaving federal employment within 24 months",detail:"Leaving resets PSLF"},{id:"nox",label:"NOT making extra student loan payments",detail:"Extra payments waste money on PSLF track"}];
  const [checks,setChecks]=useState(pslf.checks||{});
  const toggleCheck=id=>{const n={...checks,[id]:!checks[id]};setChecks(n);upd("checks",n);};
  const allGood=checklist.every(c=>checks[c.id]);
  return(<><div style={{...S.alert(allGood?"#4CAF50":"#FF9800"),marginBottom:14}}><span style={{color:allGood?"#4CAF50":"#FF9800",fontWeight:"bold"}}>{allGood?"✓ PSLF ON TRACK":"REVIEW CHECKLIST"} — </span><span style={{color:S.T.sub,fontSize:13}}>{pslf.qualifyingPayments} payments · {rem} remaining · {pslf.pslfMonths||24} months to forgiveness of {sl?fmt(sl.balance):"$120,000+"}</span></div>
    <div style={S.grid2}><div style={S.card}><div style={S.h2}>PSLF Status</div>{[{l:"Qualifying Payments",k:"qualifyingPayments",t:"number"},{l:"Total Required",k:"totalPayments",t:"number"},{l:"Months to Forgiveness",k:"pslfMonths",t:"number"},{l:"Employer",k:"employer",t:"text"},{l:"IDR Plan",k:"idrPlan",t:"text"},{l:"Next Cert. Due",k:"certDue",t:"date"}].map(f=><div key={f.k} style={{marginBottom:10}}><div style={S.label}>{f.l}</div><input style={S.input} type={f.t} value={pslf[f.k]||""} onChange={e=>upd(f.k,f.t==="number"?+e.target.value:e.target.value)}/></div>)}<Bar value={pslf.qualifyingPayments} max={pslf.totalPayments} color="#2196F3" height={10}/><div style={{fontSize:11,color:S.T.sub,marginTop:4}}>{((pslf.qualifyingPayments/pslf.totalPayments)*100).toFixed(0)}% complete</div></div>
    <div style={S.card}><div style={S.h2}>Protection Checklist</div>{checklist.map(item=><div key={item.id} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`1px solid ${S.T.border}`,cursor:"pointer"}} onClick={()=>toggleCheck(item.id)}><div style={{width:18,height:18,borderRadius:4,border:`2px solid ${checks[item.id]?"#4CAF50":S.T.border}`,background:checks[item.id]?"#4CAF50":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}>{checks[item.id]&&<span style={{color:"#0d0d08",fontSize:12,fontWeight:"bold"}}>✓</span>}</div><div><div style={{fontSize:13,color:checks[item.id]?"#4CAF50":S.T.text}}>{item.label}</div><div style={{fontSize:11,color:S.T.sub}}>{item.detail}</div></div></div>)}</div></div>
    <div style={S.card}><div style={S.h2}>Notes</div><textarea style={{...S.input,height:80,resize:"vertical"}} placeholder="Track anything important about your PSLF status..." value={pslf.notes||""} onChange={e=>upd("notes",e.target.value)}/></div></>);
}

function DashboardTab({profile,accounts,debts,goals,expenses,transactions,totalAssets,totalDebtAmt,netWorth,combinedLiquid,totalCC,cushion,dti,mortgageRate,monthlyMortgage,loanAmt,surplus,takeHome,totalExpenses,slPayment,downNeeded,closing,homePrice,setTab,bills,mealPlan,mealSuggestions,shopRequests,S}){
  const ccProg=Math.max(0,(30000-totalCC)/30000*100),pslfProg=Math.max(0,(36-profile.pslfMonths)/36*100);
  const savProg=Math.min(combinedLiquid/(downNeeded+closing+totalCC)*100,100),scoreProg=(profile.creditScore-580)/(850-580)*100;
  const recentTxns=transactions.slice(-5).reverse(),today=new Date(),todayName=DAYS[today.getDay()===0?6:today.getDay()-1];
  const pendKid=(mealSuggestions||[]).filter(s=>s.status==="pending").length+(shopRequests||[]).filter(r=>r.status==="pending").length;
  const upBills=(bills||[]).filter(b=>(!b.bradPaid||!b.maryBethPaid)&&Math.ceil((new Date(b.dueDate+"T12:00:00")-today)/(864e5))>=0&&Math.ceil((new Date(b.dueDate+"T12:00:00")-today)/(864e5))<=7).sort((a,c)=>new Date(a.dueDate)-new Date(c.dueDate));
  return(<>
    {dti>40&&<div style={S.alert("#FF9800")}><span style={{color:"#FF9800",fontWeight:"bold"}}>DTI WARNING </span><span style={{color:S.T.sub,fontSize:13}}>DTI is {dti.toFixed(1)}% — close to the 43% limit.</span></div>}
    {profile.pslfMonths<=24&&<div style={S.alert(GOLD)}><span style={{color:GOLD,fontWeight:"bold"}}>PSLF: {profile.pslfMonths} months left — </span><span style={{color:S.T.sub,fontSize:13}}>Don't change IDR plan or leave federal employment.</span></div>}
    {cushion<10000&&<div style={S.alert("#f44336")}><span style={{color:"#f44336",fontWeight:"bold"}}>CUSHION ALERT — </span><span style={{color:S.T.sub,fontSize:13}}>After closing ~{fmt(cushion)} left.</span></div>}
    <div style={S.card}><div style={{display:"flex",justifyContent:"space-around",alignItems:"center",flexWrap:"wrap",gap:16,padding:"6px 0"}}>
      <Ring pct={savProg} color={GOLD} label={`${savProg.toFixed(0)}%`} sub="Savings vs Need"/>
      <Ring pct={ccProg} color="#4CAF50" label={`${ccProg.toFixed(0)}%`} sub="CC Debt Cleared"/>
      <Ring pct={pslfProg} color="#2196F3" label={`${pslfProg.toFixed(0)}%`} sub="PSLF Progress"/>
      <Ring pct={Math.min(dti/43*100,100)} color={dti<36?"#4CAF50":dti<43?"#FF9800":"#f44336"} label={`${dti.toFixed(1)}%`} sub="DTI Ratio"/>
      <Ring pct={scoreProg} color="#9C27B0" label={profile.creditScore} sub="Credit Score"/>
      <Ring pct={Math.min(netWorth/200000*100,100)} color={netWorth>0?GOLD:"#f44336"} label={fmt(netWorth)} sub="Net Worth"/>
    </div></div>
    <div style={S.grid4}>{[{label:"Combined Liquid",val:fmt(combinedLiquid),sub:"Savings available",color:GOLD},{label:"Total CC Debt",val:fmt(totalCC),sub:`${debts.filter(d=>d.type==="Credit Card").length} cards`,color:totalCC>0?"#f44336":"#4CAF50"},{label:"Post-Close Cushion",val:fmt(cushion),sub:"After down+closing+CC",color:cushion>15000?"#4CAF50":cushion>5000?"#FF9800":"#f44336"},{label:"Monthly Surplus",val:fmt(surplus),sub:"After expenses+loans",color:surplus>0?"#4CAF50":"#f44336"}].map((k,i)=><div key={i} style={{...S.card,borderLeft:`3px solid ${k.color}`,marginBottom:0}}><div style={S.label}>{k.label}</div><div style={{fontSize:20,color:k.color,fontWeight:"bold",fontFamily:"monospace"}}>{k.val}</div><div style={{fontSize:11,color:S.T.sub,marginTop:4}}>{k.sub}</div></div>)}</div>
    <div style={S.grid3}>
      <div style={S.card}><div style={S.h2}>Tonight & This Week</div><div style={{fontSize:18,color:GOLD,marginBottom:8}}>{mealPlan[todayName]?.Dinner||"Not planned"}</div>{DAYS.map(d=>{const dinner=mealPlan[d]?.Dinner||"",isToday=d===todayName;return <div key={d} style={{display:"flex",gap:8,padding:"3px 0",borderBottom:`1px solid ${S.T.border}`}}><span style={{fontSize:10,color:isToday?GOLD:S.T.sub,fontFamily:"monospace",minWidth:28}}>{d.slice(0,3)}</span><span style={{fontSize:12,color:dinner?isToday?S.T.text:S.T.sub:"#333"}}>{dinner||"—"}</span></div>;})}<button style={{...S.btnGhost,marginTop:8,fontSize:12}} onClick={()=>setTab("meals")}>Plan Meals →</button></div>
      <div style={S.card}><div style={S.h2}>Expenses Due Soon</div>{upBills.length===0?<div style={{color:S.T.sub,fontSize:13,padding:"8px 0"}}>No expenses due in 7 days</div>:upBills.slice(0,4).map(b=>{const dl=Math.ceil((new Date(b.dueDate+"T12:00:00")-today)/(864e5)),paid=b.bradPaid&&b.maryBethPaid;return(<div key={b.id} style={{...S.row,padding:"6px 0",borderBottom:`1px solid ${S.T.border}`}}><div><div style={{fontSize:13,color:S.T.text}}>{b.name}</div><div style={{fontSize:11,color:S.T.sub}}>{dl===0?"Today":dl===1?"Tomorrow":`${dl} days`}</div></div><div style={{textAlign:"right"}}><div style={{fontFamily:"monospace",color:GOLD,fontWeight:"bold"}}>{fmt(b.amount/2)} ea</div><div style={{fontSize:10,color:paid?"#4CAF50":"#FF9800"}}>{paid?"✓ Paid":"Pending"}</div></div></div>);})} <button style={{...S.btnGhost,marginTop:8,fontSize:12}} onClick={()=>setTab("bills")}>Manage Expenses →</button></div>
      <div style={S.card}><div style={S.h2}>Kids Requests</div>{pendKid===0?<div style={{color:S.T.sub,fontSize:13,padding:"8px 0"}}>No pending requests.</div>:<div style={{...S.alert(GOLD),margin:"0 0 8px"}}><span style={{color:GOLD,fontWeight:"bold"}}>{pendKid} pending</span><span style={{color:S.T.sub,fontSize:12}}> — needs review</span></div>}{(mealSuggestions||[]).filter(s=>s.status==="pending").slice(0,2).map(s=><div key={s.id} style={{padding:"4px 0",borderBottom:`1px solid ${S.T.border}`}}><div style={{fontSize:12,color:S.T.text}}>🍴 {s.meal} <span style={{color:S.T.sub}}>— {s.kidName}</span></div></div>)}{(shopRequests||[]).filter(r=>r.status==="pending").slice(0,2).map(r=><div key={r.id} style={{padding:"4px 0",borderBottom:`1px solid ${S.T.border}`}}><div style={{fontSize:12,color:S.T.text}}>🛒 {r.item} <span style={{color:S.T.sub}}>— {r.kidName}</span></div></div>)}<button style={{...S.btnGhost,marginTop:8,fontSize:12}} onClick={()=>setTab("meals")}>Review →</button></div>
    </div>
    <div style={S.grid2}>
      <div style={S.card}><div style={S.h2}>Monthly Cash Flow</div>{[{label:"Take-Home (~65%)",val:takeHome,color:"#4CAF50",sign:"+"},{label:"Living Expenses",val:totalExpenses,color:"#f44336",sign:"−"},{label:"Student Loan (IDR/PSLF)",val:slPayment,color:"#f44336",sign:"−"},{label:"Future Mortgage",val:monthlyMortgage,color:"#888",sign:"~"}].map((r,i)=><div key={i} style={{...S.row,padding:"6px 0",borderBottom:`1px solid ${S.T.border}`}}><span style={{fontSize:13,color:S.T.sub}}>{r.sign} {r.label}</span><span style={{color:r.color,fontFamily:"monospace",fontWeight:"bold"}}>{fmt(r.val)}</span></div>)}<div style={{...S.row,marginTop:10,paddingTop:10,borderTop:`1px solid ${S.T.border}`}}><span style={{color:GOLD,fontWeight:"bold"}}>Monthly Surplus</span><span style={{color:GOLD,fontFamily:"monospace",fontSize:18,fontWeight:"bold"}}>{fmt(surplus)}</span></div></div>
      <div style={S.card}><div style={S.h2}>Goals Snapshot</div>{goals.map(g=>{const p=Math.min(g.saved/g.target*100,100);return <div key={g.id} style={{marginBottom:10}}><div style={{...S.row,marginBottom:4}}><span style={{fontSize:13,color:S.T.text}}>{g.icon} {g.name}</span><span style={{fontSize:12,color:g.color,fontFamily:"monospace"}}>{fmt(g.saved)} / {fmt(g.target)}</span></div><Bar value={g.saved} max={g.target} color={g.color}/></div>;})}<button style={{...S.btnGhost,marginTop:6,fontSize:12}} onClick={()=>setTab("goals")}>Manage Goals →</button></div>
    </div>
    {recentTxns.length>0&&<div style={S.card}><div style={S.h2}>Recent Transactions</div>{recentTxns.map(t=><div key={t.id} style={{...S.row,padding:"6px 0",borderBottom:`1px solid ${S.T.border}`,flexWrap:"wrap",gap:8}}><div><div style={{fontSize:13,color:S.T.text}}>{t.description}</div><div style={{fontSize:11,color:S.T.sub}}>{t.date} · <span style={S.tag("#888")}>{t.category}</span></div></div><span style={{color:t.amount<0?"#f44336":"#4CAF50",fontFamily:"monospace",fontWeight:"bold"}}>{t.amount<0?"−":"+"}{fmt(Math.abs(t.amount))}</span></div>)}</div>}
  </>);
}

// ── KID DASHBOARDS ────────────────────────────────────────────────────────────
function KidChoreView({chores,userKey,userName,userColor,appSettings,S}){
  const myChores=chores.filter(c=>c.assignee===userKey);
  const todo=myChores.filter(c=>!c.done),done=myChores.filter(c=>c.done);
  const showPoints=appSettings.showPoints;
  const pts=done.reduce((s,c)=>s+(c.points||0),0);
  if(myChores.length===0)return null;
  return(<div style={{...S.card,borderTop:`3px solid ${userColor}`}}>
    <div style={{...S.h2,...S.row}}>
      <span>My Chores</span>
      {showPoints&&<span style={{...S.tag(userColor),fontSize:11}}>{pts} pts earned</span>}
    </div>
    {todo.map(c=><div key={c.id} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`1px solid ${S.T.border}`,alignItems:"center"}}>
      <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${S.T.border}`,flexShrink:0}}/>
      <div style={{flex:1}}><div style={{fontSize:13,color:S.T.text}}>{c.task}</div>{c.due&&<div style={{fontSize:11,color:S.T.sub}}>Due: {c.due}</div>}{showPoints&&<div style={{fontSize:11,color:S.T.accent}}>{c.points} pts</div>}</div>
    </div>)}
    {done.length>0&&<div style={{marginTop:8,opacity:0.5}}><div style={{...S.label,marginBottom:4}}>DONE</div>{done.map(c=><div key={c.id} style={{display:"flex",gap:8,padding:"5px 0",alignItems:"center"}}><div style={{width:18,height:18,borderRadius:4,background:"#4CAF50",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#0d0d08",fontSize:11,fontWeight:"bold"}}>✓</div><span style={{fontSize:12,color:S.T.sub,textDecoration:"line-through"}}>{c.task}</span></div>)}</div>}
  </div>);
}

function BradynDashboard({mealPlan,shopList,shopRequests,setShopRequests,mealSuggestions,setMealSuggestions,chores,setChores,messages,setMessages,appSettings,onLogout}){
  const [tab,setTab]=useState("home");
  const [showS,setShowS]=useState(false),[showR,setShowR]=useState(false);
  const [sugg,setSugg]=useState({meal:"",dayPreference:"Friday",mealType:"Dinner",notes:""});
  const [item,setItem]=useState({name:"",qty:"",notes:""});
  const saveReqs=u=>{setShopRequests(u);store.save("fp2:shopRequests",u);};
  const saveSugg=u=>{setMealSuggestions(u);store.save("fp2:mealSuggestions",u);};
  const sendSugg=()=>{if(!sugg.meal)return;saveSugg([...mealSuggestions,{...sugg,id:Date.now(),kidName:"Bradyn",status:"pending",date:new Date().toLocaleDateString()}]);setSugg({meal:"",dayPreference:"Friday",mealType:"Dinner",notes:""});setShowS(false);};
  const sendItem=()=>{if(!item.name)return;saveReqs([...shopRequests,{...item,id:Date.now(),kidName:"Bradyn",item:item.name,status:"pending",date:new Date().toLocaleDateString()}]);setItem({name:"",qty:"",notes:""});setShowR(false);};
  const C={bg:"#090e1a",card:"#0f1628",border:"#1e2d4a",accent:"#00d4ff",text:"#c8d8f0",sub:"#4a6a8a"};
  const bS={page:{background:C.bg,minHeight:"100vh",fontFamily:"Georgia,serif",color:C.text},card:{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:12},inp:{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"9px 12px",color:C.text,fontFamily:"Georgia,serif",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"},sel:{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"9px 12px",color:C.text,fontFamily:"Georgia,serif",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"},h2:{fontSize:14,color:C.accent,fontWeight:"normal",borderBottom:`1px solid ${C.border}`,paddingBottom:8,marginBottom:12},btn:{background:C.accent,border:"none",borderRadius:6,padding:"10px 18px",color:C.bg,fontFamily:"Georgia,serif",fontSize:13,cursor:"pointer",fontWeight:"bold"},btnG:{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 14px",color:C.sub,fontFamily:"Georgia,serif",fontSize:12,cursor:"pointer"},lbl:{fontSize:10,color:C.sub,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:5,fontFamily:"monospace"},T:{accent:C.accent,text:C.text,sub:C.sub,border:C.border,bg:C.bg}};
  const TABS=[{id:"home",label:"Home",icon:"🏠"},{id:"chores",label:"Tasks",icon:"✅"},{id:"board",label:"Board",icon:"📢"}];
  return(<div style={bS.page}>
    <div style={{background:"rgba(0,0,0,0.3)",borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:9,color:C.sub,fontFamily:"monospace",letterSpacing:"0.2em"}}>FAMILY HUB</div><div style={{fontSize:16,color:C.text}}>Bradyn's View</div></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>{TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{...bS.btnG,borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent",borderRadius:0,color:tab===t.id?C.accent:C.sub,padding:"6px 10px",fontSize:12}}>{t.icon} {t.label}</button>)}<button onClick={onLogout} style={{...bS.btnG,fontSize:12}}>Sign Out ↩</button></div>
    </div>
    <div style={{maxWidth:900,margin:"0 auto",padding:16}}>
      {tab==="home"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
        <div>
          <div style={bS.card}><div style={bS.h2}>This Week's Meals</div>{DAYS.map(d=>{const m=mealPlan[d]||{},has=m.Breakfast||m.Lunch||m.Dinner;return(<div key={d} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:`1px solid ${C.bg}`,alignItems:"flex-start"}}><div style={{width:64,flexShrink:0}}><div style={{fontSize:10,color:C.accent,fontFamily:"monospace"}}>{d.slice(0,3).toUpperCase()}</div></div><div style={{flex:1}}>{MEAL_TYPES.map(mt=>m[mt]&&<div key={mt} style={{display:"flex",gap:6,marginBottom:2}}><span style={{fontSize:10,color:C.sub,minWidth:50,fontFamily:"monospace"}}>{mt}</span><span style={{fontSize:12,color:C.text}}>{m[mt]}</span></div>)}{!has&&<span style={{fontSize:11,color:C.border}}>Nothing planned</span>}</div></div>);})}</div>
          <div style={bS.card}><div style={bS.h2}>Shopping List</div>{shopList.filter(i=>!i.checked).slice(0,8).map(i=><div key={i.id} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.bg}`,alignItems:"center"}}><span style={{fontSize:13,color:C.text,flex:1}}>{i.qty&&i.qty!=="1"?`${i.qty}× `:""}{i.name}</span></div>)}{shopList.filter(i=>!i.checked).length===0&&<div style={{fontSize:13,color:C.sub}}>Nothing on the list.</div>}</div>
        </div>
        <div>
          <div style={bS.card}><div style={bS.h2}>Quick Actions</div><button style={{...bS.btn,width:"100%",marginBottom:10,textAlign:"left"}} onClick={()=>{setShowS(!showS);setShowR(false);}}>Suggest a Meal</button><button style={{...bS.btnG,width:"100%",textAlign:"left"}} onClick={()=>{setShowR(!showR);setShowS(false);}}>Request Shopping Item</button></div>
          {showS&&<div style={bS.card}><div style={bS.h2}>Suggest a Meal</div><div style={{marginBottom:8}}><div style={bS.lbl}>Meal</div><input style={bS.inp} placeholder="e.g. Lasagna, Tacos..." value={sugg.meal} onChange={e=>setSugg({...sugg,meal:e.target.value})}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}><div><div style={bS.lbl}>Day</div><select style={bS.sel} value={sugg.dayPreference} onChange={e=>setSugg({...sugg,dayPreference:e.target.value})}>{DAYS.map(d=><option key={d}>{d}</option>)}</select></div><div><div style={bS.lbl}>Meal</div><select style={bS.sel} value={sugg.mealType} onChange={e=>setSugg({...sugg,mealType:e.target.value})}>{MEAL_TYPES.map(m=><option key={m}>{m}</option>)}</select></div></div><div style={{marginBottom:10}}><div style={bS.lbl}>Notes</div><input style={bS.inp} placeholder="Why you want it..." value={sugg.notes} onChange={e=>setSugg({...sugg,notes:e.target.value})}/></div><div style={{display:"flex",gap:8}}><button style={bS.btn} onClick={sendSugg}>Submit</button><button style={bS.btnG} onClick={()=>setShowS(false)}>Cancel</button></div></div>}
          {showR&&<div style={bS.card}><div style={bS.h2}>Request Shopping Item</div><div style={{marginBottom:8}}><div style={bS.lbl}>Item</div><input style={bS.inp} placeholder="What do you need?" value={item.name} onChange={e=>setItem({...item,name:e.target.value})}/></div><div style={{marginBottom:8}}><div style={bS.lbl}>How much?</div><input style={bS.inp} placeholder="e.g. 2 boxes..." value={item.qty} onChange={e=>setItem({...item,qty:e.target.value})}/></div><div style={{marginBottom:10}}><div style={bS.lbl}>Reason</div><input style={bS.inp} placeholder="Why?" value={item.notes} onChange={e=>setItem({...item,notes:e.target.value})}/></div><div style={{display:"flex",gap:8}}><button style={bS.btn} onClick={sendItem}>Submit</button><button style={bS.btnG} onClick={()=>setShowR(false)}>Cancel</button></div></div>}
        </div>
      </div>}
      {tab==="chores"&&<KidChoreView chores={chores} setChores={setChores} userKey="bradyn" userName="Bradyn" userColor="#00d4ff" appSettings={appSettings} S={bS}/>}
      {tab==="board"&&<MessageBoard messages={messages} setMessages={setMessages} currentUser="bradyn" S={bS}/>}
    </div>
  </div>);
}

function ParkerTab({mealPlan,shopRequests,setShopRequests,mealSuggestions,setMealSuggestions,chores,setChores,messages,setMessages,appSettings,onLogout}){
  const [tab,setTab]=useState("home");
  const [showS,setShowS]=useState(false),[showR,setShowR]=useState(false);
  const [sugg,setSugg]=useState({meal:"",dayPreference:"Friday",mealType:"Dinner",notes:""});
  const [item,setItem]=useState({name:"",qty:"",notes:""});
  const saveReqs=u=>{setShopRequests(u);store.save("fp2:shopRequests",u);};
  const saveSugg=u=>{setMealSuggestions(u);store.save("fp2:mealSuggestions",u);};
  const sendSugg=()=>{if(!sugg.meal)return;saveSugg([...mealSuggestions,{...sugg,id:Date.now(),kidName:"Parker",status:"pending",date:new Date().toLocaleDateString()}]);setSugg({meal:"",dayPreference:"Friday",mealType:"Dinner",notes:""});setShowS(false);};
  const sendItem=()=>{if(!item.name)return;saveReqs([...shopRequests,{...item,id:Date.now(),kidName:"Parker",item:item.name,status:"pending",date:new Date().toLocaleDateString()}]);setItem({name:"",qty:"",notes:""});setShowR(false);};
  const todayName=DAYS[new Date().getDay()===0?6:new Date().getDay()-1];
  const pc="rgba(180,79,239,0.12)",pb="1px solid rgba(180,79,239,0.25)";
  const pInp={background:"rgba(255,255,255,0.08)",border:"1px solid rgba(180,79,239,0.4)",borderRadius:8,padding:"10px 12px",color:"#e8e0ff",fontFamily:"Georgia,serif",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none",marginBottom:8};
  const pBtn={background:"linear-gradient(135deg,#b44fef,#7b2fc0)",border:"none",borderRadius:10,padding:"12px 18px",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:"bold",fontFamily:"Georgia,serif",width:"100%",marginBottom:8};
  const pBtnG={background:"transparent",border:"1px solid rgba(180,79,239,0.3)",borderRadius:8,padding:"8px 14px",color:"#7a6aaa",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12};
  const pS={page:{background:"linear-gradient(135deg,#1a0a2e 0%,#0d1a2e 100%)",minHeight:"100vh",fontFamily:"Georgia,serif",color:"#e8e0ff"},card:{background:pc,border:pb,borderRadius:14,padding:16,marginBottom:12},h2:{fontSize:13,color:"#b44fef",fontWeight:"bold",marginBottom:10},T:{accent:"#b44fef",text:"#e8e0ff",sub:"#7a6aaa",border:"rgba(180,79,239,0.25)",bg:"#1a0a2e"}};
  const TABS=[{id:"home",label:"Home"},{id:"chores",label:"Tasks"},{id:"board",label:"Board"}];
  return(<div style={pS.page}>
    <div style={{background:"rgba(0,0,0,0.3)",borderBottom:"1px solid rgba(180,79,239,0.2)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:15,color:"#b44fef",fontWeight:"bold"}}>Parker's Hub</div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>{TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{...pBtnG,color:tab===t.id?"#b44fef":"#7a6aaa",borderColor:tab===t.id?"rgba(180,79,239,0.6)":"rgba(180,79,239,0.2)"}}>{t.label}</button>)}<button onClick={onLogout} style={pBtnG}>Sign Out ↩</button></div>
    </div>
    <div style={{maxWidth:800,margin:"0 auto",padding:16}}>
      {tab==="home"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
        <div>
          <div style={pS.card}><div style={pS.h2}>This Week's Meals</div><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>{DAYS.map(d=>{const isToday=d===todayName;return(<div key={d} style={{textAlign:"center",padding:"6px 2px",borderRadius:7,background:isToday?"rgba(180,79,239,0.2)":"rgba(255,255,255,0.03)",border:`1px solid ${isToday?"rgba(180,79,239,0.5)":"rgba(255,255,255,0.05)"}`}}><div style={{fontSize:8,color:isToday?"#b44fef":"#7a6aaa",fontFamily:"monospace",marginBottom:2}}>{d.slice(0,2).toUpperCase()}</div>{MEAL_TYPES.map(mt=>mealPlan[d]?.[mt]&&<div key={mt} style={{fontSize:9,color:"#e8e0ff",lineHeight:"1.2"}}>{mealPlan[d][mt]}</div>)}{!mealPlan[d]?.Breakfast&&!mealPlan[d]?.Lunch&&!mealPlan[d]?.Dinner&&<div style={{fontSize:9,color:"#3a2a5a"}}>?</div>}</div>);})}</div></div>
        </div>
        <div>
          {!showS&&!showR&&<><button style={pBtn} onClick={()=>setShowS(true)}>Suggest a Meal!</button><button style={{...pBtn,background:"linear-gradient(135deg,#3ef0d4,#0ab8a0)",color:"#0d1a2e"}} onClick={()=>setShowR(true)}>Request Something!</button></>}
          {showS&&<div style={pS.card}><div style={pS.h2}>What should we eat?</div><input style={pInp} placeholder="e.g. Tacos, Pizza..." value={sugg.meal} onChange={e=>setSugg({...sugg,meal:e.target.value})}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}><select style={{...pInp,marginBottom:0}} value={sugg.dayPreference} onChange={e=>setSugg({...sugg,dayPreference:e.target.value})}>{DAYS.map(d=><option key={d}>{d}</option>)}</select><select style={{...pInp,marginBottom:0}} value={sugg.mealType} onChange={e=>setSugg({...sugg,mealType:e.target.value})}>{MEAL_TYPES.map(m=><option key={m}>{m}</option>)}</select></div><input style={pInp} placeholder="Why? 😄" value={sugg.notes} onChange={e=>setSugg({...sugg,notes:e.target.value})}/><div style={{display:"flex",gap:6}}><button style={{...pBtn,marginBottom:0,flex:1}} onClick={sendSugg}>Send it!</button><button style={{...pBtnG,flex:1}} onClick={()=>setShowS(false)}>Cancel</button></div></div>}
          {showR&&<div style={pS.card}><div style={pS.h2}>What do we need?</div><input style={pInp} placeholder="What do you want?" value={item.name} onChange={e=>setItem({...item,name:e.target.value})}/><input style={pInp} placeholder="How many?" value={item.qty} onChange={e=>setItem({...item,qty:e.target.value})}/><div style={{display:"flex",gap:6}}><button style={{...pBtn,marginBottom:0,flex:1,background:"linear-gradient(135deg,#3ef0d4,#0ab8a0)",color:"#0d1a2e"}} onClick={sendItem}>Add it!</button><button style={{...pBtnG,flex:1}} onClick={()=>setShowR(false)}>Cancel</button></div></div>}
        </div>
      </div>}
      {tab==="chores"&&<KidChoreView chores={chores} setChores={setChores} userKey="parker" userName="Parker" userColor="#b44fef" appSettings={appSettings} S={pS}/>}
      {tab==="board"&&<MessageBoard messages={messages} setMessages={setMessages} currentUser="parker" S={pS}/>}
    </div>
  </div>);
}

function RyderTab({mealPlan,shopRequests,setShopRequests,mealSuggestions,setMealSuggestions,chores,setChores,messages,setMessages,appSettings,onLogout}){
  const [screen,setScreen]=useState("home"),[tab,setTab]=useState("home");
  const [mealIn,setMealIn]=useState(""),[shopIn,setShopIn]=useState(""),[flash,setFlash]=useState(null);
  const saveReqs=u=>{setShopRequests(u);store.save("fp2:shopRequests",u);};
  const saveSugg=u=>{setMealSuggestions(u);store.save("fp2:mealSuggestions",u);};
  const sendMeal=()=>{if(!mealIn)return;saveSugg([...mealSuggestions,{id:Date.now(),kidName:"Ryder",meal:mealIn,dayPreference:"Any day",mealType:"Dinner",notes:"",status:"pending",date:new Date().toLocaleDateString()}]);setMealIn("");setScreen("home");setFlash("meal");setTimeout(()=>setFlash(null),2800);};
  const sendShop=()=>{if(!shopIn)return;saveReqs([...shopRequests,{id:Date.now(),kidName:"Ryder",item:shopIn,qty:"",notes:"",status:"pending",date:new Date().toLocaleDateString()}]);setShopIn("");setScreen("home");setFlash("shop");setTimeout(()=>setFlash(null),2800);};
  const todayName=DAYS[new Date().getDay()===0?6:new Date().getDay()-1];
  const tonightDinner=mealPlan[todayName]?.Dinner||"";
  const rS={page:{background:"linear-gradient(180deg,#0d1f0d 0%,#1a0d0d 100%)",minHeight:"100vh",fontFamily:"Georgia,serif",color:"#fff9f0"},card:{background:"rgba(255,107,53,0.08)",border:"1px solid rgba(255,107,53,0.2)",borderRadius:14,padding:16,marginBottom:12},h2:{fontSize:13,color:"#ff6b35",fontWeight:"bold",marginBottom:10},T:{accent:"#ff6b35",text:"#fff9f0",sub:"#887766",border:"rgba(255,107,53,0.2)",bg:"#0d1f0d"}};
  const bigBtn=(label,bg,col,onClick)=><button onClick={onClick} style={{padding:"20px 14px",fontSize:18,fontWeight:"bold",fontFamily:"Georgia,serif",background:bg,border:"none",borderRadius:18,color:col,cursor:"pointer",width:"100%",marginBottom:12}}>{label}</button>;
  const TABS=[{id:"home",label:"Home"},{id:"chores",label:"Tasks"},{id:"board",label:"Board"}];
  return(<div style={rS.page}>
    <div style={{background:"rgba(0,0,0,0.3)",borderBottom:"1px solid rgba(255,107,53,0.2)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:15,color:"#ff6b35",fontWeight:"bold"}}>Ryder's Hub</div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>{TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",border:`1px solid ${tab===t.id?"rgba(255,107,53,0.6)":"rgba(255,107,53,0.2)"}`,borderRadius:6,padding:"5px 10px",color:tab===t.id?"#ff6b35":"#887766",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12}}>{t.label}</button>)}<button onClick={onLogout} style={{background:"transparent",border:"1px solid rgba(255,107,53,0.2)",borderRadius:6,padding:"5px 10px",color:"#887766",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12}}>Sign Out ↩</button></div>
    </div>
    <div style={{maxWidth:480,margin:"0 auto",padding:16}}>
      {tab==="home"&&<>
        {flash&&<div style={{textAlign:"center",padding:"14px 0",marginBottom:10}}><div style={{fontSize:48,marginBottom:4}}>{flash==="meal"?"🎉":"✅"}</div><div style={{fontSize:18,color:flash==="meal"?"#ff6b35":"#4cdf7a",fontWeight:"bold"}}>{flash==="meal"?"Sent to Mom & Dad!":"Added to the list!"}</div></div>}
        <div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:44,marginBottom:2}}>🌟</div><div style={{fontSize:30,fontWeight:"bold",color:"#ff6b35"}}>Hey Ryder!</div></div>
        <div style={{...rS.card,textAlign:"center",marginBottom:14}}><div style={{fontSize:10,color:"#ff6b35",fontFamily:"monospace",letterSpacing:"0.2em",marginBottom:4}}>TONIGHT</div><div style={{fontSize:24,color:tonightDinner?"#fff9f0":"#665544",fontWeight:"bold"}}>{tonightDinner||"Not planned yet!"}</div></div>
        {screen==="home"&&<>{bigBtn("I want this for dinner!","linear-gradient(135deg,#ff6b35,#cc4411)","#fff",()=>setScreen("meal"))}{bigBtn("Can we get something?","linear-gradient(135deg,#4cdf7a,#22aa55)","#0d1f0d",()=>setScreen("shop"))}</>}
        {screen==="meal"&&<div style={rS.card}><div style={{fontSize:18,fontWeight:"bold",color:"#fff9f0",textAlign:"center",marginBottom:10}}>What do you want?</div><input autoFocus style={{background:"rgba(255,255,255,0.1)",border:"2px solid rgba(255,107,53,0.5)",borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:16,fontFamily:"Georgia,serif",width:"100%",boxSizing:"border-box",outline:"none",textAlign:"center",marginBottom:10}} placeholder="Type it here!" value={mealIn} onChange={e=>setMealIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMeal();}}/>{bigBtn("Send it!","linear-gradient(135deg,#ff6b35,#cc4411)","#fff",sendMeal)}<button onClick={()=>setScreen("home")} style={{width:"100%",padding:"8px",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#887766",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Go back</button></div>}
        {screen==="shop"&&<div style={rS.card}><div style={{fontSize:18,fontWeight:"bold",color:"#fff9f0",textAlign:"center",marginBottom:10}}>What do we need?</div><input autoFocus style={{background:"rgba(255,255,255,0.1)",border:"2px solid rgba(76,223,122,0.5)",borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:16,fontFamily:"Georgia,serif",width:"100%",boxSizing:"border-box",outline:"none",textAlign:"center",marginBottom:10}} placeholder="Type what you want!" value={shopIn} onChange={e=>setShopIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendShop();}}/>{bigBtn("Add it!","linear-gradient(135deg,#4cdf7a,#22aa55)","#0d1f0d",sendShop)}<button onClick={()=>setScreen("home")} style={{width:"100%",padding:"8px",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#887766",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif"}}>Go back</button></div>}
      </>}
      {tab==="chores"&&<KidChoreView chores={chores} setChores={setChores} userKey="ryder" userName="Ryder" userColor="#ff6b35" appSettings={appSettings} S={rS}/>}
      {tab==="board"&&<MessageBoard messages={messages} setMessages={setMessages} currentUser="ryder" S={rS}/>}
    </div>
  </div>);
}

// ── BRAD DASHBOARD ────────────────────────────────────────────────────────────
function BradDashboard(props){
  const {onLogout,auth,setAuth,netWorth,accounts,setAccounts,debts,setDebts,expenses,setExpenses,goals,setGoals,transactions,setTransactions,pslf,setPslf,scenario,setScenario,reviewTxns,setReviewTxns,uploadLoading,handleUpload,confirmTxns,fileRef,saveAll,profile,setProfile,mealPlan,setMealPlan,shopList,setShopList,mealSuggestions,setMealSuggestions,shopRequests,setShopRequests,bills,setBills,billHistory,setBillHistory,totalAssets,totalDebtAmt,totalCC,combinedLiquid,cushion,dti,mortgageRate,monthlyMortgage,loanAmt,surplus,takeHome,totalExpenses,slPayment,downNeeded,closing,homePrice,chores,setChores,messages,setMessages,appSettings,setAppSettings,mealDetails,setMealDetails}=props;
  const [tab,setTab]=useState("home");
  const [userTheme,setUserTheme]=useState(appSettings?.userThemes?.brad||"dark");
  const S=makeS(userTheme);
  const saveTheme=key=>{setUserTheme(key);const updated={...appSettings,userThemes:{...appSettings.userThemes,brad:key}};setAppSettings(updated);store.save("fp2:appSettings",updated);};
  const pendingCount=(mealSuggestions||[]).filter(s=>s.status==="pending").length+(shopRequests||[]).filter(r=>r.status==="pending").length;
  const msgPending=(messages||[]).filter(m=>!m.approved).length;
  const GROUPS=[
    {g:"Home",tabs:[{id:"home",label:"Home",icon:"🏠"}]},
    {g:"Family",tabs:[{id:"meals",label:"Meals & Food",icon:"🍽"},{id:"chores",label:"Tasks",icon:"✅"},{id:"board",label:"Board",icon:"📢"},{id:"bills",label:"Expenses",icon:"🧾"}]},
    {g:"Finance",tabs:[{id:"dashboard",label:"Dashboard",icon:"◈"},{id:"accounts",label:"Accounts",icon:"🏦"},{id:"debts",label:"Debts",icon:"💳"},{id:"budget",label:"Budget",icon:"📊"},{id:"goals",label:"Goals",icon:"🎯"},{id:"statements",label:"Statements",icon:"📄"},{id:"scenarios",label:"Scenarios",icon:"⚗"},{id:"pslf",label:"PSLF",icon:"🎓"}]},
    {g:"Settings",tabs:[{id:"settings",label:"Settings",icon:"⚙️"},{id:"admin",label:"Admin",icon:"🔐"}]},
  ];
  return(<div style={S.page}>
    <UserHeader user="brad" onLogout={onLogout} S={S} extra={<div style={{fontSize:13,color:S.T.accent,fontFamily:"monospace"}}>{fmt(netWorth)} net worth</div>}>
      <div style={{display:"flex",gap:0,overflowX:"auto",alignItems:"center",marginBottom:4}}>
        {GROUPS.map((group,gi)=><div key={group.g} style={{display:"flex",alignItems:"center"}}>
          {gi>0&&<div style={{width:1,height:18,background:S.T.border,margin:"0 6px",flexShrink:0}}/>}
          <span style={{fontSize:9,color:S.T.sub,fontFamily:"monospace",letterSpacing:"0.15em",padding:"0 4px",flexShrink:0}}>{group.g}</span>
          {group.tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 10px",cursor:"pointer",fontSize:11,background:"none",border:"none",borderBottom:tab===t.id?`2px solid ${S.T.accent}`:"2px solid transparent",color:tab===t.id?S.T.accent:S.T.sub,fontFamily:"Georgia,serif",whiteSpace:"nowrap",position:"relative"}}>
            {t.icon} {t.label}
            {t.id==="meals"&&pendingCount>0&&<span style={{position:"absolute",top:2,right:0,background:"#f44336",color:"#fff",borderRadius:"50%",width:13,height:13,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace"}}>{pendingCount}</span>}
            {t.id==="board"&&msgPending>0&&<span style={{position:"absolute",top:2,right:0,background:"#f44336",color:"#fff",borderRadius:"50%",width:13,height:13,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace"}}>{msgPending}</span>}
          </button>)}
        </div>)}
      </div>
      <ThemePicker currentTheme={userTheme} onSelect={saveTheme} S={S}/>
    </UserHeader>
    <div style={{maxWidth:1400,margin:"0 auto",padding:"16px 16px"}}>
      {tab!=="home"&&bills&&<BillsBanner bills={bills} S={S}/> }
      {tab==="home"&&<PersonalHomeScreen currentUser="brad" mealPlan={mealPlan} bills={bills||[]} chores={chores||[]} setChores={setChores} messages={messages||[]} appSettings={appSettings} S={S}/> }
      {tab==="meals"&&<MealsTab mealPlan={mealPlan} setMealPlan={setMealPlan} shopList={shopList} setShopList={setShopList} mealSuggestions={mealSuggestions} setMealSuggestions={setMealSuggestions} shopRequests={shopRequests} setShopRequests={setShopRequests} mealDetails={mealDetails} setMealDetails={setMealDetails} profile={profile} S={S}/>}
      {tab==="chores"&&<ChoresTab chores={chores} setChores={setChores} appSettings={appSettings} S={S} currentUser="brad"/>}
      {tab==="board"&&<MessageBoard messages={messages} setMessages={setMessages} currentUser="brad" S={S}/>}
      {tab==="bills"&&<BillsTab bills={bills} setBills={setBills} billHistory={billHistory} setBillHistory={setBillHistory} profile={profile} S={S}/>}
      {tab==="dashboard"&&<DashboardTab profile={profile} accounts={accounts} debts={debts} goals={goals} expenses={expenses} transactions={transactions} totalAssets={totalAssets} totalDebtAmt={totalDebtAmt} netWorth={netWorth} combinedLiquid={combinedLiquid} totalCC={totalCC} cushion={cushion} dti={dti} mortgageRate={mortgageRate} monthlyMortgage={monthlyMortgage} loanAmt={loanAmt} surplus={surplus} takeHome={takeHome} totalExpenses={totalExpenses} slPayment={slPayment} downNeeded={downNeeded} closing={closing} homePrice={homePrice} setTab={setTab} bills={bills} mealPlan={mealPlan} mealSuggestions={mealSuggestions} shopRequests={shopRequests} S={S}/>}
      {tab==="accounts"&&<AccountsTab accounts={accounts} setAccounts={setAccounts} profile={profile} S={S}/>}
      {tab==="debts"&&<DebtsTab debts={debts} setDebts={setDebts} profile={profile} S={S}/>}
      {tab==="budget"&&<BudgetTab expenses={expenses} setExpenses={setExpenses} transactions={transactions} takeHome={takeHome} slPayment={slPayment} S={S}/>}
      {tab==="goals"&&<GoalsTab goals={goals} setGoals={setGoals} S={S}/>}
      {tab==="statements"&&<StatementsTab transactions={transactions} setTransactions={setTransactions} handleUpload={handleUpload} uploadLoading={uploadLoading} reviewTxns={reviewTxns} setReviewTxns={setReviewTxns} confirmTxns={confirmTxns} fileRef={fileRef} S={S}/>}
      {tab==="scenarios"&&<ScenariosTab scenario={scenario} setScenario={setScenario} debts={debts} profile={profile} combinedLiquid={combinedLiquid} totalCC={totalCC} surplus={surplus} mortgageRate={mortgageRate} loanAmt={loanAmt} homePrice={homePrice} slPayment={slPayment} S={S}/>}
      {tab==="pslf"&&<PslfTab pslf={pslf} setPslf={setPslf} debts={debts} S={S}/>}
      {tab==="settings"&&<SettingsTab profile={profile} setProfile={setProfile} appSettings={appSettings} setAppSettings={setAppSettings} S={S} currentUser="brad"/>}
      {tab==="admin"&&<AdminPanel auth={auth} setAuth={setAuth} S={S}/>}
    </div>
  </div>);
}

// ── MARY BETH DASHBOARD ───────────────────────────────────────────────────────
function MaryBethDashboard({bills,setBills,billHistory,setBillHistory,mealPlan,setMealPlan,shopList,setShopList,mealSuggestions,setMealSuggestions,shopRequests,setShopRequests,profile,setProfile,expenses,debts,chores,setChores,messages,setMessages,appSettings,setAppSettings,mealDetails,setMealDetails,onLogout}){
  const [tab,setTab]=useState("home");
  const [userTheme,setUserTheme]=useState(appSettings?.userThemes?.maryBeth||"dark");
  const S=makeS(userTheme);
  const saveTheme=key=>{setUserTheme(key);const updated={...appSettings,userThemes:{...appSettings.userThemes,maryBeth:key}};setAppSettings(updated);store.save("fp2:appSettings",updated);};
  const pending=(mealSuggestions||[]).filter(s=>s.status==="pending").length+(shopRequests||[]).filter(r=>r.status==="pending").length;
  const msgPending=(messages||[]).filter(m=>!m.approved).length;
  const TABS=[{id:"home",label:"Home",icon:"🏠"},{id:"meals",label:"Meals & Food",icon:"🍽"},{id:"chores",label:"Tasks",icon:"✅"},{id:"board",label:"Board",icon:"📢"},{id:"bills",label:"Expenses",icon:"🧾"},{id:"settings",label:"Settings",icon:"⚙️"}];
  return(<div style={S.page}>
    <UserHeader user="maryBeth" onLogout={onLogout} S={S}>
      <div style={{display:"flex",gap:0,overflowX:"auto",marginBottom:4}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 11px",cursor:"pointer",fontSize:11,background:"none",border:"none",borderBottom:tab===t.id?`2px solid ${S.T.accent}`:"2px solid transparent",color:tab===t.id?S.T.accent:S.T.sub,fontFamily:"Georgia,serif",whiteSpace:"nowrap",position:"relative"}}>
          {t.icon} {t.label}
          {t.id==="meals"&&pending>0&&<span style={{position:"absolute",top:2,right:0,background:"#f44336",color:"#fff",borderRadius:"50%",width:13,height:13,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace"}}>{pending}</span>}
          {t.id==="board"&&msgPending>0&&<span style={{position:"absolute",top:2,right:0,background:"#f44336",color:"#fff",borderRadius:"50%",width:13,height:13,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace"}}>{msgPending}</span>}
        </button>)}
      </div>
      <ThemePicker currentTheme={userTheme} onSelect={saveTheme} S={S}/>
    </UserHeader>
    <div style={{maxWidth:1300,margin:"0 auto",padding:"16px 16px"}}>
      {tab!=="home"&&bills&&<BillsBanner bills={bills} S={S}/> }
      {tab==="home"&&<PersonalHomeScreen currentUser="maryBeth" mealPlan={mealPlan} bills={bills||[]} chores={chores||[]} setChores={setChores} messages={messages||[]} appSettings={appSettings} S={S}/> }
      {tab==="meals"&&<MealsTab mealPlan={mealPlan} setMealPlan={setMealPlan} shopList={shopList} setShopList={setShopList} mealSuggestions={mealSuggestions} setMealSuggestions={setMealSuggestions} shopRequests={shopRequests} setShopRequests={setShopRequests} mealDetails={mealDetails} setMealDetails={setMealDetails} profile={profile} S={S}/>}
      {tab==="chores"&&<ChoresTab chores={chores} setChores={setChores} appSettings={appSettings} S={S} currentUser="maryBeth"/>}
      {tab==="board"&&<MessageBoard messages={messages} setMessages={setMessages} currentUser="maryBeth" S={S}/>}
      {tab==="bills"&&<BillsTab bills={bills} setBills={setBills} billHistory={billHistory} setBillHistory={setBillHistory} profile={profile} S={S}/>}
      {tab==="settings"&&<SettingsTab profile={profile} setProfile={setProfile} appSettings={appSettings} setAppSettings={setAppSettings} S={S} currentUser="maryBeth"/>}
    </div>
  </div>);
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const [profile,setProfile]=useState(D.profile);
  const [accounts,setAccounts]=useState(D.accounts);
  const [debts,setDebts]=useState(D.debts);
  const [expenses,setExpenses]=useState(D.expenses);
  const [goals,setGoals]=useState(D.goals);
  const [transactions,setTransactions]=useState(D.transactions);
  const [pslf,setPslf]=useState(D.pslf);
  const [bills,setBills]=useState(D.bills);
  const [billHistory,setBillHistory]=useState(D.billHistory);
  const [mealPlan,setMealPlan]=useState(D.mealPlan);
  const [shopList,setShopList]=useState(D.shopList);
  const [mealSuggestions,setMealSuggestions]=useState(D.mealSuggestions);
  const [shopRequests,setShopRequests]=useState(D.shopRequests);
  const [auth,setAuth]=useState(D.auth);
  const [chores,setChores]=useState(D.chores);
  const [messages,setMessages]=useState(D.messages);
  const [mealDetails,setMealDetails]=useState({});
  const [appSettings,setAppSettings]=useState(D.appSettings);
  const [currentUser,setCurrentUser]=useState(null);
  const [loginTarget,setLoginTarget]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [scenario,setScenario]=useState({extraPayment:500,incomeBoost:0,downPct:20,extraSavings:0});
  const [reviewTxns,setReviewTxns]=useState(null);
  const [uploadLoading,setUploadLoading]=useState(false);
  const fileRef=useRef();
  const lastActivity=useRef(Date.now());
  const timerRef=useRef(null);

  useEffect(()=>{
    {
      const [p,a,d,e,g,t,ps,bl,mp,sl,ms,sr,au,ch,mg,bh,as,md]=[
        store.load("fp2:profile",D.profile),store.load("fp2:accounts",D.accounts),
        store.load("fp2:debts",D.debts),store.load("fp2:expenses",D.expenses),
        store.load("fp2:goals",D.goals),store.load("fp2:transactions",D.transactions),
        store.load("fp2:pslf",D.pslf),store.load("fp2:bills",D.bills),
        store.load("fp2:mealPlan",D.mealPlan),store.load("fp2:shopList",D.shopList),
        store.load("fp2:mealSuggestions",D.mealSuggestions),store.load("fp2:shopRequests",D.shopRequests),
        store.load("fp2:auth",D.auth),store.load("fp2:chores",D.chores),
        store.load("fp2:messages",D.messages),store.load("fp2:billHistory",D.billHistory),
        store.load("fp2:appSettings",D.appSettings),store.load("fp2:mealDetails",{}),
      ];
      setProfile(p);setAccounts(a);setDebts(d);setExpenses(e);setGoals(g);setTransactions(t);setPslf(ps);
      setBills(bl);setBillHistory(bh||[]);
      const safeMp=Object.fromEntries(DAYS.map(dy=>[dy,{Breakfast:mp[dy]?.Breakfast||"",Lunch:mp[dy]?.Lunch||"",Dinner:mp[dy]?.Dinner||""}]));
      setMealPlan(safeMp);setShopList(sl);setMealSuggestions(ms);setShopRequests(sr);
      setAuth(au||D.auth);setChores(ch||[]);setMessages(mg||[]);
      setMealDetails(md||{});
      setAppSettings({...D.appSettings,...(as||{})});
      setLoaded(true);
  },[]);

  const resetActivity=useCallback(()=>{lastActivity.current=Date.now();},[]);
  useEffect(()=>{
    if(!currentUser)return;
    const events=["mousemove","keydown","click","touchstart","scroll"];
    events.forEach(ev=>window.addEventListener(ev,resetActivity));
    timerRef.current=setInterval(()=>{if(Date.now()-lastActivity.current>=TIMEOUT_MS)setCurrentUser(null);},15000);
    return()=>{events.forEach(ev=>window.removeEventListener(ev,resetActivity));clearInterval(timerRef.current);};
  },[currentUser,resetActivity]);

  const saveAll=useCallback((updates={})=>{
    const s={profile,accounts,debts,expenses,goals,transactions,pslf,...updates};
    Object.entries({"fp2:profile":s.profile,"fp2:accounts":s.accounts,"fp2:debts":s.debts,"fp2:expenses":s.expenses,"fp2:goals":s.goals,"fp2:transactions":s.transactions,"fp2:pslf":s.pslf}).forEach(([k,v])=>store.save(k,v));
  },[profile,accounts,debts,expenses,goals,transactions,pslf]);

  const totalAssets=accounts.reduce((s,a)=>s+a.balance,0);
  const totalCC=debts.filter(d=>d.type==="Credit Card").reduce((s,d)=>s+d.balance,0);
  const totalDebtAmt=debts.reduce((s,d)=>s+d.balance,0);
  const netWorth=totalAssets-totalDebtAmt;
  const grossMonthly=(profile.myIncome+profile.fIncome)/12;
  const takeHome=grossMonthly*0.65;
  const totalExpenses=expenses.reduce((s,c)=>s+c.items.reduce((ss,i)=>ss+i.amount,0),0);
  const slPayment=debts.find(d=>d.pslf)?.minPayment||400;
  const surplus=takeHome-totalExpenses-slPayment;
  const homePrice=500000,downNeeded=homePrice*0.20,closing=homePrice*0.03;
  const mySavings=accounts.filter(a=>a.owner==="me"&&(a.type==="Savings"||a.type==="HYSA"||a.type==="Checking")).reduce((s,a)=>s+a.balance,0);
  const fSavings=accounts.filter(a=>a.owner==="fiance").reduce((s,a)=>s+a.balance,0);
  const combinedLiquid=mySavings+fSavings;
  const cushion=combinedLiquid-totalCC-downNeeded-closing;
  const mortgageRate=scoreToRate(profile.creditScore);
  const loanAmt=homePrice-downNeeded;
  const monthlyMortgage=calcMortgage(loanAmt,mortgageRate);
  const dti=((monthlyMortgage+slPayment+300)/grossMonthly)*100;

  const handleUpload=async e=>{
    const file=e.target.files?.[0];if(!file)return;setUploadLoading(true);
    try{
      let content="";
      if(file.name.endsWith(".csv")||file.name.endsWith(".txt")){content=await file.text();}
      else{const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:[{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:"Extract all transactions. Return ONLY JSON array: [{date,description,amount,type}]. No markdown."}]}]})});const data=await resp.json();content=data.content?.[0]?.text||"[]";}
      const pr=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:`Categorize transactions. Return ONLY JSON array: [{id,date,description,amount,category}]. Categories: ${CATS.join(",")}. No markdown.`,messages:[{role:"user",content:`Categorize: ${content}`}]})});
      const pd=await pr.json();let text=pd.content?.[0]?.text||"[]";text=text.replace(/```json|```/g,"").trim();
      setReviewTxns(JSON.parse(text).map((t,i)=>({...t,id:Date.now()+i,account:file.name})));
    }catch(err){alert("Could not parse statement. Try CSV format.");}
    setUploadLoading(false);if(fileRef.current)fileRef.current.value="";
  };
  const confirmTxns=sel=>{const upd=[...transactions,...sel.map(t=>({...t,confirmed:true}))].slice(-500);setTransactions(upd);store.save("fp2:transactions",upd);setReviewTxns(null);};

  const handleLogin=userKey=>setLoginTarget(userKey);
  const handleLoginSuccess=(userKey,newPwd)=>{if(newPwd){const upd={...auth,[userKey]:newPwd};setAuth(upd);store.save("fp2:auth",upd);}setCurrentUser(userKey);setLoginTarget(null);lastActivity.current=Date.now();};
  const handleLogout=()=>setCurrentUser(null);

  if(!loaded)return <div style={{...S.page,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:GOLD}}>Loading Family Hub...</div>;

  const sharedProps={mealPlan,setMealPlan,shopList,setShopList,mealSuggestions,setMealSuggestions,shopRequests,setShopRequests,bills,setBills,billHistory,setBillHistory,profile,setProfile,chores,setChores,messages,setMessages,appSettings,setAppSettings,mealDetails,setMealDetails};

  return(<div style={S.page}>
    {loginTarget&&<LoginModal user={loginTarget} auth={auth} onSuccess={pwd=>handleLoginSuccess(loginTarget,pwd)} onClose={()=>setLoginTarget(null)}/>}
    {!currentUser&&<PublicHomeScreen mealPlan={mealPlan} shopList={shopList} bills={bills} expenses={expenses} onLogin={handleLogin} appSettings={appSettings} messages={messages}/>}
    {currentUser==="brad"&&<BradDashboard {...sharedProps} accounts={accounts} setAccounts={setAccounts} debts={debts} setDebts={setDebts} expenses={expenses} setExpenses={setExpenses} goals={goals} setGoals={setGoals} transactions={transactions} setTransactions={setTransactions} pslf={pslf} setPslf={setPslf} scenario={scenario} setScenario={setScenario} reviewTxns={reviewTxns} setReviewTxns={setReviewTxns} uploadLoading={uploadLoading} handleUpload={handleUpload} confirmTxns={confirmTxns} fileRef={fileRef} saveAll={saveAll} auth={auth} setAuth={setAuth} totalAssets={totalAssets} totalDebtAmt={totalDebtAmt} netWorth={netWorth} totalCC={totalCC} combinedLiquid={combinedLiquid} cushion={cushion} dti={dti} mortgageRate={mortgageRate} monthlyMortgage={monthlyMortgage} loanAmt={loanAmt} surplus={surplus} takeHome={takeHome} totalExpenses={totalExpenses} slPayment={slPayment} downNeeded={downNeeded} closing={closing} homePrice={homePrice} onLogout={handleLogout}/>}
    {currentUser==="maryBeth"&&<MaryBethDashboard {...sharedProps} expenses={expenses} debts={debts} onLogout={handleLogout} setChores={setChores}/>}
    {currentUser==="bradyn"&&<BradynDashboard mealPlan={mealPlan} shopList={shopList} shopRequests={shopRequests} setShopRequests={setShopRequests} mealSuggestions={mealSuggestions} setMealSuggestions={setMealSuggestions} chores={chores} setChores={setChores} messages={messages} setMessages={setMessages} appSettings={appSettings} onLogout={handleLogout}/>}
    {currentUser==="parker"&&<ParkerTab mealPlan={mealPlan} shopRequests={shopRequests} setShopRequests={setShopRequests} mealSuggestions={mealSuggestions} setMealSuggestions={setMealSuggestions} chores={chores} setChores={setChores} messages={messages} setMessages={setMessages} appSettings={appSettings} onLogout={handleLogout}/>}
    {currentUser==="ryder"&&<RyderTab mealPlan={mealPlan} shopRequests={shopRequests} setShopRequests={setShopRequests} mealSuggestions={mealSuggestions} setMealSuggestions={setMealSuggestions} chores={chores} setChores={setChores} messages={messages} setMessages={setMessages} appSettings={appSettings} onLogout={handleLogout}/>}
  </div>);
}
