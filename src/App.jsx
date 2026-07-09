// ── Main App: state, Firestore load, auth/session, routing ───────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { store } from "./store";
import { D, DAYS, CATS, S, GOLD, TIMEOUT_MS, scoreToRate, calcMortgage, weekKeyOf, weekKeyOffset, normalizeWeek } from "./constants";
import { LoginModal, PublicHomeScreen, configureWeather } from "./shared";
import { configureSms, blankSmsSettings } from "./sms";
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
  const [events,setEvents]=useState([]);
  const [mealFavs,setMealFavs]=useState([]);
  const [smsSettings,setSmsSettings]=useState(blankSmsSettings);
  const [loginTarget,setLoginTarget]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [scenario,setScenario]=useState({extraPayment:500,incomeBoost:0,downPct:20,extraSavings:0});
  const [reviewTxns,setReviewTxns]=useState(null);
  const [uploadLoading,setUploadLoading]=useState(false);
  const fileRef=useRef();
  const lastActivity=useRef(Date.now());
  const timerRef=useRef(null);

  const loadAll=useCallback(async()=>{
    const [p,a,d,e,g,t,ps,bl,mp,sl,ms,sr,au,ch,mg,bh,as,md,ss,pa,bn,evts,mps,mf,smss,wloc]=await Promise.all([
      store.load("fp2:profile",D.profile),store.load("fp2:accounts",D.accounts),
      store.load("fp2:debts",D.debts),store.load("fp2:expenses",D.expenses),
      store.load("fp2:goals",D.goals),store.load("fp2:transactions",D.transactions),
      store.load("fp2:pslf",D.pslf),store.load("fp2:bills",D.bills),
      store.load("fp2:mealPlan",D.mealPlan),store.load("fp2:shopList",D.shopList),
      store.load("fp2:mealSuggestions",D.mealSuggestions),store.load("fp2:shopRequests",D.shopRequests),
      store.load("fp2:auth",D.auth),store.load("fp2:chores",D.chores),
      store.load("fp2:messages",D.messages),store.load("fp2:billHistory",D.billHistory),
      store.load("fp2:appSettings",D.appSettings),store.load("fp2:mealDetails",{}),
      store.load("fp2:shopSettings",D.shopSettings),store.load("fp2:payAccounts",D.payAccounts),
      store.load("fp2:bradynLedger",[]),
      store.load("fp2:events",[]),
      store.load("fp2:mealPlans",null),
      store.load("fp2:mealFavs",[]),
      store.load("fp2:smsSettings",null),
      store.load("fp2:weatherLoc",null),
    ]);
    setProfile(p);setAccounts(a);setDebts(d);setExpenses(e);setGoals(g);setTransactions(t);setPslf(ps);
    setBills(bl);setBillHistory(bh||[]);
    // Meal plans are keyed by week (Monday's date). First run after upgrading
    // migrates the old single-week plan into the current week.
    if(mps&&Object.keys(mps).length>0){
      setMealPlans(mps);
    }else{
      const seeded={[weekKeyOf()]:normalizeWeek(mp)};
      setMealPlans(seeded);
      store.save("fp2:mealPlans",seeded);
    }
    setShopList(sl);setMealSuggestions(ms);setShopRequests(sr);
    setAuth(au||D.auth);setChores(ch||[]);setMessages(mg||[]);
    setMealDetails(md||{});
    setAppSettings({...D.appSettings,...(as||{})});
    setShopSettings({...D.shopSettings,...(ss||{})});
    setPayAccounts({...D.payAccounts,...(pa||{})});
    setBradynLedger(bn||[]);
    setEvents(evts||[]);
    setMealFavs(mf||[]);
    const smsCfg={...blankSmsSettings,...(smss||{})};
    setSmsSettings(smsCfg);configureSms(smsCfg);
    if(wloc)configureWeather(wloc);
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

  // Derived views of the week-keyed meal plans: this week for every existing
  // screen, next week so Sunday's "tomorrow" crosses the week boundary.
  const curWk=weekKeyOf();
  const mealPlan=normalizeWeek(mealPlans[curWk]);
  const nextWeekPlan=normalizeWeek(mealPlans[weekKeyOffset(curWk,1)]);

  const sharedProps={mealPlan,nextWeekPlan,mealPlans,setMealPlans,mealFavs,setMealFavs,smsSettings,setSmsSettings,shopList,setShopList,mealSuggestions,setMealSuggestions,shopRequests,setShopRequests,bills,setBills,billHistory,setBillHistory,profile,setProfile,chores,setChores,messages,setMessages,appSettings,setAppSettings,mealDetails,setMealDetails,shopSettings,setShopSettings,payAccounts,setPayAccounts,bradynLedger,setBradynLedger,events,setEvents};
  const enterTv=()=>{setTvMode(true);try{window.history.replaceState(null,"","#tv");}catch(e){}};
  const exitTv=()=>{setTvMode(false);try{window.history.replaceState(null,"",window.location.pathname);}catch(e){}};

  return(<div style={S.page}>
    {loginTarget&&<LoginModal user={loginTarget} auth={auth} onSuccess={pwd=>handleLoginSuccess(loginTarget,pwd)} onClose={()=>setLoginTarget(null)}/>}
    {!currentUser&&tvMode&&<TVDisplay mealPlan={mealPlan} nextWeekPlan={nextWeekPlan} events={events} shopList={shopList} bills={bills} messages={messages} chores={chores} appSettings={appSettings} onExit={exitTv} onLogin={k=>{exitTv();setLoginTarget(k);}} onRefresh={loadAll}/>}
    {!currentUser&&!tvMode&&<PublicHomeScreen mealPlan={mealPlan} shopList={shopList} setShopList={setShopList} bills={bills} expenses={expenses} onLogin={handleLogin} appSettings={appSettings} messages={messages} shopSettings={shopSettings} events={events} onTv={enterTv}/>}
    {currentUser==="brad"&&<BradDashboard {...sharedProps} accounts={accounts} setAccounts={setAccounts} debts={debts} setDebts={setDebts} expenses={expenses} setExpenses={setExpenses} goals={goals} setGoals={setGoals} transactions={transactions} setTransactions={setTransactions} pslf={pslf} setPslf={setPslf} scenario={scenario} setScenario={setScenario} reviewTxns={reviewTxns} setReviewTxns={setReviewTxns} uploadLoading={uploadLoading} handleUpload={handleUpload} confirmTxns={confirmTxns} fileRef={fileRef} saveAll={saveAll} auth={auth} setAuth={setAuth} totalAssets={totalAssets} totalDebtAmt={totalDebtAmt} netWorth={netWorth} totalCC={totalCC} combinedLiquid={combinedLiquid} cushion={cushion} dti={dti} mortgageRate={mortgageRate} monthlyMortgage={monthlyMortgage} loanAmt={loanAmt} surplus={surplus} takeHome={takeHome} totalExpenses={totalExpenses} slPayment={slPayment} downNeeded={downNeeded} closing={closing} homePrice={homePrice} onLogout={handleLogout}/>}
    {currentUser==="maryBeth"&&<MaryBethDashboard {...sharedProps} expenses={expenses} debts={debts} onLogout={handleLogout} setChores={setChores}/>}
    {currentUser==="bradyn"&&<BradynDashboard mealPlan={mealPlan} shopList={shopList} setShopList={setShopList} shopRequests={shopRequests} setShopRequests={setShopRequests} mealSuggestions={mealSuggestions} setMealSuggestions={setMealSuggestions} mealDetails={mealDetails} setMealDetails={setMealDetails} chores={chores} setChores={setChores} messages={messages} setMessages={setMessages} appSettings={appSettings} shopSettings={shopSettings} bradynLedger={bradynLedger} setBradynLedger={setBradynLedger} events={events} setEvents={setEvents} onLogout={handleLogout}/>}
    {currentUser==="parker"&&<ParkerTab mealPlan={mealPlan} shopRequests={shopRequests} setShopRequests={setShopRequests} mealSuggestions={mealSuggestions} setMealSuggestions={setMealSuggestions} chores={chores} setChores={setChores} messages={messages} setMessages={setMessages} appSettings={appSettings} events={events} setEvents={setEvents} onLogout={handleLogout}/>}
    {currentUser==="ryder"&&<RyderTab mealPlan={mealPlan} shopRequests={shopRequests} setShopRequests={setShopRequests} mealSuggestions={mealSuggestions} setMealSuggestions={setMealSuggestions} chores={chores} setChores={setChores} messages={messages} setMessages={setMessages} appSettings={appSettings} events={events} setEvents={setEvents} onLogout={handleLogout}/>}
  </div>);
}
