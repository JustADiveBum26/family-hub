// ── Main App: state, Firestore load, auth/session, routing ───────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { store } from "./store";
import { D, DAYS, S, GOLD, TIMEOUT_MS, scoreToRate, calcMortgage, weekKeyOf, weekKeyOffset, normalizeWeek } from "./constants";
import { LoginModal, PublicHomeScreen, SaveStatusBadge, VersionBadge } from "./shared";
import { BradDashboard, MaryBethDashboard, BradynDashboard, ParkerTab, RyderTab } from "./dashboards";
import { TVDisplay } from "./tv";

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
  const [mealPlans,setMealPlans]=useState({});
  const [tvMode,setTvMode]=useState(typeof window!=="undefined"&&window.location.hash==="#tv");
  const [shopList,setShopList]=useState(D.shopList);
  const [mealSuggestions,setMealSuggestions]=useState(D.mealSuggestions);
  const [shopRequests,setShopRequests]=useState(D.shopRequests);
  const [auth,setAuth]=useState(D.auth);
  const [chores,setChores]=useState(D.chores);
  const [messages,setMessages]=useState(D.messages);
  const [mealDetails,setMealDetails]=useState({});
  const [appSettings,setAppSettings]=useState(D.appSettings);
  const [shopSettings,setShopSettings]=useState(D.shopSettings);
  const [payAccounts,setPayAccounts]=useState(D.payAccounts);
  const [currentUser,setCurrentUser]=useState(null);
  const [bradynLedger,setBradynLedger]=useState([]);
  const [choreLog,setChoreLog]=useState(D.choreLog||[]);
  const [allowance,setAllowance]=useState(D.allowance||{});
  const [events,setEvents]=useState([]);
  const [mealFavs,setMealFavs]=useState([]);
  const [shopStaples,setShopStaples]=useState([]);
  const [todos,setTodos]=useState(D.todos);
  const [sharedTodos,setSharedTodos]=useState([]);
  const [loginTarget,setLoginTarget]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [scenario,setScenario]=useState({extraPayment:500,incomeBoost:0,downPct:20,extraSavings:0});
  const lastActivity=useRef(Date.now());
  const timerRef=useRef(null);

  const loadAll=useCallback(async()=>{
    const [p,a,d,e,g,t,ps,bl,sl,ms,sr,au,ch,mg,bh,as,md,ss,pa,bn,evts,mps,mf,td,stp,cl,al,sTd]=await Promise.all([
      store.load("fp2:profile",D.profile),store.load("fp2:accounts",D.accounts),
      store.load("fp2:debts",D.debts),store.load("fp2:expenses",D.expenses),
      store.load("fp2:goals",D.goals),store.load("fp2:transactions",D.transactions),
      store.load("fp2:pslf",D.pslf),store.load("fp2:bills",D.bills),
      store.load("fp2:shopList",D.shopList),
      store.load("fp2:mealSuggestions",D.mealSuggestions),store.load("fp2:shopRequests",D.shopRequests),
      store.load("fp2:auth",D.auth),store.load("fp2:chores",D.chores),
      store.load("fp2:messages",D.messages),store.load("fp2:billHistory",D.billHistory),
      store.load("fp2:appSettings",D.appSettings),store.load("fp2:mealDetails",{}),
      store.load("fp2:shopSettings",D.shopSettings),store.load("fp2:payAccounts",D.payAccounts),
      store.load("fp2:bradynLedger",[]),
      store.load("fp2:events",[]),
      store.load("fp2:mealPlans",null),
      store.load("fp2:mealFavs",[]),
      store.load("fp2:todos",D.todos),
      store.load("fp2:shopStaples",[]),
      store.load("fp2:choreLog",D.choreLog||[]),
      store.load("fp2:allowance",D.allowance||{}),
      store.load("fp2:sharedTodos",[]),
    ]);
    setProfile(p);setAccounts(a);setDebts(d);setExpenses(e);setGoals(g);setTransactions(t);setPslf(ps);
    setBills(bl);setBillHistory(bh||[]);
    // Meal plans are keyed by week (Monday's date).
    setMealPlans(mps&&Object.keys(mps).length>0?mps:{});
    setShopList(sl);setMealSuggestions(ms);setShopRequests(sr);
    setAuth(au||D.auth);setChores(ch||[]);setMessages(mg||[]);
    setMealDetails(md||{});
    setAppSettings({...D.appSettings,...(as||{})});
    setShopSettings({...D.shopSettings,...(ss||{})});
    setPayAccounts({...D.payAccounts,...(pa||{})});
    setBradynLedger(bn||[]);
    setEvents(evts||[]);
    setMealFavs(mf||[]);
    setShopStaples(stp||[]);
    setTodos({...D.todos,...(td||{})});
    setChoreLog(cl||[]);
    setAllowance(al||{});
    setSharedTodos(sTd||[]);
    setLoaded(true);
  },[]);
  useEffect(()=>{loadAll();},[loadAll]);

  const resetActivity=useCallback(()=>{lastActivity.current=Date.now();},[]);
  useEffect(()=>{
    if(!currentUser)return;
    const events=["mousemove","keydown","click","touchstart","scroll"];
    events.forEach(ev=>window.addEventListener(ev,resetActivity));
    timerRef.current=setInterval(()=>{if(Date.now()-lastActivity.current>=TIMEOUT_MS)setCurrentUser(null);},15000);
    return()=>{events.forEach(ev=>window.removeEventListener(ev,resetActivity));clearInterval(timerRef.current);};
  },[currentUser,resetActivity]);

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

  const handleLogin=userKey=>setLoginTarget(userKey);
  const handleLoginSuccess=(userKey,newPwd)=>{if(newPwd){const upd={...auth,[userKey]:newPwd};setAuth(upd);store.save("fp2:auth",upd);}setCurrentUser(userKey);setLoginTarget(null);lastActivity.current=Date.now();};
  const handleLogout=()=>setCurrentUser(null);

  if(!loaded)return <div style={{...S.page,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:GOLD}}>Loading Family Hub...</div>;

  // Derived views of the week-keyed meal plans: this week for every existing
  // screen, next week so Sunday's "tomorrow" crosses the week boundary.
  const curWk=weekKeyOf();
  const mealPlan=normalizeWeek(mealPlans[curWk]);
  const nextWeekPlan=normalizeWeek(mealPlans[weekKeyOffset(curWk,1)]);

  const sharedProps={mealPlan,nextWeekPlan,mealPlans,setMealPlans,mealFavs,setMealFavs,shopStaples,setShopStaples,shopList,setShopList,mealSuggestions,setMealSuggestions,shopRequests,setShopRequests,bills,setBills,billHistory,setBillHistory,profile,setProfile,chores,setChores,messages,setMessages,appSettings,setAppSettings,mealDetails,setMealDetails,shopSettings,setShopSettings,payAccounts,setPayAccounts,bradynLedger,setBradynLedger,events,setEvents,todos,setTodos,sharedTodos,setSharedTodos,choreLog,setChoreLog,allowance,setAllowance};
  const enterTv=()=>{setTvMode(true);try{window.history.replaceState(null,"","#tv");}catch(e){}};
  const exitTv=()=>{setTvMode(false);try{window.history.replaceState(null,"",window.location.pathname);}catch(e){}};

  return(<div style={S.page}>
    <SaveStatusBadge/>
    <VersionBadge/>
    {loginTarget&&<LoginModal user={loginTarget} auth={auth} onSuccess={pwd=>handleLoginSuccess(loginTarget,pwd)} onClose={()=>setLoginTarget(null)}/>}
    {!currentUser&&tvMode&&<TVDisplay mealPlan={mealPlan} nextWeekPlan={nextWeekPlan} events={events} shopList={shopList} bills={bills} messages={messages} chores={chores} sharedTodos={appSettings.sharedTodoEnabled?sharedTodos:null} appSettings={appSettings} onExit={exitTv} onLogin={k=>{exitTv();setLoginTarget(k);}} onRefresh={loadAll}/>}
    {!currentUser&&!tvMode&&<PublicHomeScreen mealPlan={mealPlan} shopList={shopList} setShopList={setShopList} bills={bills} expenses={expenses} onLogin={handleLogin} appSettings={appSettings} messages={messages} shopSettings={shopSettings} events={events} onTv={enterTv}/>}
    {currentUser==="brad"&&<BradDashboard {...sharedProps} accounts={accounts} setAccounts={setAccounts} debts={debts} setDebts={setDebts} expenses={expenses} setExpenses={setExpenses} goals={goals} setGoals={setGoals} transactions={transactions} setTransactions={setTransactions} pslf={pslf} setPslf={setPslf} scenario={scenario} setScenario={setScenario} auth={auth} setAuth={setAuth} totalAssets={totalAssets} totalDebtAmt={totalDebtAmt} netWorth={netWorth} totalCC={totalCC} combinedLiquid={combinedLiquid} cushion={cushion} dti={dti} mortgageRate={mortgageRate} monthlyMortgage={monthlyMortgage} loanAmt={loanAmt} surplus={surplus} takeHome={takeHome} totalExpenses={totalExpenses} slPayment={slPayment} downNeeded={downNeeded} closing={closing} homePrice={homePrice} onLogout={handleLogout}/>}
    {currentUser==="maryBeth"&&<MaryBethDashboard {...sharedProps} expenses={expenses} debts={debts} onLogout={handleLogout}/>}
    {currentUser==="bradyn"&&<BradynDashboard {...sharedProps} onLogout={handleLogout}/>}
    {currentUser==="parker"&&<ParkerTab {...sharedProps} onLogout={handleLogout}/>}
    {currentUser==="ryder"&&<RyderTab {...sharedProps} onLogout={handleLogout}/>}
  </div>);
}
