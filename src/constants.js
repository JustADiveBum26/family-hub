// ── Shared constants, defaults, and style helpers ─────────────────────────────
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
  shopSettings:{
    categories:["Grocery","Dairy","Produce","Meat","Snacks","Beverages","Household","Personal Care","Other"],
    stores:["Walmart","Kroger","Target","Costco","Aldi","Other"],
  },
  payAccounts:{
    brad:["Chase Checking","Ally HYSA","Cash"],
    maryBeth:["Checking","Savings","Cash"],
  },
};

const fmt=n=>"$"+Math.abs(Math.round(n)).toLocaleString();
const calcMortgage=(p,r,y=30)=>{const m=r/12/100;return p*(m*Math.pow(1+m,y*12))/(Math.pow(1+m,y*12)-1);};
const scoreToRate=s=>s>=760?6.75:s>=740?6.875:s>=720?7.0:s>=700?7.25:s>=680?7.5:7.875;
const calcPayoff=(bal,rate,pay)=>{if(pay<=0||bal<=0)return 0;const r=rate/100/12;if(r>0&&pay<=bal*r)return 999;if(r===0)return Math.ceil(bal/pay);return Math.ceil(-Math.log(1-(bal*r)/pay)/Math.log(1+r));};
const todayName=()=>{const d=new Date().getDay();return DAYS[d===0?6:d-1];};
// A bill is fully paid when everyone responsible has marked it: both people for
// shared bills, just the owner for owner-only bills. Fully paid bills live in
// History and are hidden from every other view.
const billPaid=b=>(!b.owner||b.owner==="shared")?!!(b.bradPaid&&b.maryBethPaid):b.owner==="brad"?!!b.bradPaid:!!b.maryBethPaid;

function getTheme(k){return THEMES[k]||THEMES.dark;}
function makeS(theme,scale=1.15){
  const T=getTheme(theme);
  const fs=n=>Math.round(n*scale);
  const sp=n=>Math.round(n*scale);
  return{
    page:{background:T.bg,minHeight:"100vh",fontFamily:"'Georgia',serif",color:T.text,fontSize:fs(14)},
    card:{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:sp(22),marginBottom:sp(16)},
    cardSm:{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:sp(16),marginBottom:sp(12)},
    label:{fontSize:fs(11),color:T.sub,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:sp(6),fontFamily:"monospace"},
    input:{background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,padding:`${sp(9)}px ${sp(13)}px`,color:T.text,fontFamily:"Georgia,serif",fontSize:fs(14),width:"100%",boxSizing:"border-box",outline:"none"},
    select:{background:T.bg,border:`1px solid ${T.border}`,borderRadius:6,padding:`${sp(9)}px ${sp(13)}px`,color:T.text,fontFamily:"Georgia,serif",fontSize:fs(14),width:"100%",boxSizing:"border-box",outline:"none"},
    btn:(c=T.accent)=>({background:c,border:"none",borderRadius:6,padding:`${sp(10)}px ${sp(20)}px`,color:c===T.accent&&T.accent===GOLD?"#0d0d08":"#fff",fontFamily:"Georgia,serif",fontSize:fs(14),cursor:"pointer",fontWeight:"bold",whiteSpace:"nowrap"}),
    btnGhost:{background:"transparent",border:`1px solid ${T.border}`,borderRadius:6,padding:`${sp(8)}px ${sp(15)}px`,color:T.sub,fontFamily:"Georgia,serif",fontSize:fs(13),cursor:"pointer"},
    btnDanger:{background:"transparent",border:"1px solid #f4433644",borderRadius:6,padding:`${sp(6)}px ${sp(11)}px`,color:"#f44336",fontFamily:"Georgia,serif",fontSize:fs(13),cursor:"pointer"},
    row:{display:"flex",justifyContent:"space-between",alignItems:"center"},
    grid2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp(16)},
    grid2mob:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:sp(16)},
    grid3:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:sp(16)},
    grid4:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:sp(16)},
    h2:{fontSize:fs(16),color:T.accent,fontWeight:"normal",borderBottom:`1px solid ${T.border}`,paddingBottom:sp(9),marginBottom:sp(18),letterSpacing:"0.05em"},
    tag:c=>({background:c+"22",color:c,border:`1px solid ${c}44`,borderRadius:4,padding:`${sp(3)}px ${sp(9)}px`,fontSize:fs(12),fontFamily:"monospace"}),
    alert:c=>({background:c+"18",border:`1px solid ${c}44`,borderRadius:8,padding:`${sp(14)}px ${sp(18)}px`,marginBottom:sp(14)}),
    T,
  };
}
const S=makeS("dark");

export {
  DAYS, DSHORT, MEAL_TYPES, CATS, ACCT_TYPES, DEBT_TYPES, BILL_CATS, SHOP_CATS,
  CHORE_MASTER, GOLD, DARK, MID, BORDER, TIMEOUT_MS, THEMES, USERS,
  blankMealPlan, D, fmt, calcMortgage, scoreToRate, calcPayoff, todayName, billPaid,
  getTheme, makeS, S,
};
