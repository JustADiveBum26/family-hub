// ── Per-user dashboards ────────────────────────────────────────────────────────
import { useState } from "react";
import { store } from "./store";
import { DAYS, MEAL_TYPES, SHOP_CATS, SHOP_STORES, fmt, makeS, makeKidS } from "./constants";
import { ShoppingListView, UserHeader, ThemePicker, PersonalHomeScreen, BillsBanner, WeatherScroll } from "./shared";
import { ChoresTab, KidChoreView, MessageBoard, SettingsTab, BillsTab, MealDetailModal, MealsTab, BradynLedger, TodoTab, AllowanceCard, AllowanceOverview } from "./family";
import { FinanceHub } from "./finance";
import { CalendarTab, WeeklyCelebrations } from "./calendar";

function BradynDashboard({mealPlan,shopList,setShopList,shopRequests,setShopRequests,mealSuggestions,setMealSuggestions,mealDetails,setMealDetails,chores,setChores,messages,setMessages,appSettings,shopSettings,bradynLedger,setBradynLedger,events,setEvents,choreLog,setChoreLog,allowance,setAllowance,onLogout}){
  const [tab,setTab]=useState("home");
  const [showShopView,setShowShopView]=useState(false);
  const [showS,setShowS]=useState(false),[showAdd,setShowAdd]=useState(false);
  const [addMode,setAddMode]=useState("single");
  const blankRow=()=>({id:Date.now()+Math.random(),name:"",qty:"1",category:cats[0]||"Grocery",store:""});
  const [bulkRows,setBulkRows]=useState(null);
  const updateBulkRow=(i,field,val)=>setBulkRows(rows=>rows.map((r,ri)=>ri===i?{...r,[field]:val}:r));
  const addBulkRow=()=>setBulkRows(rows=>[...rows,blankRow()]);
  const removeBulkRow=i=>setBulkRows(rows=>rows.filter((_,ri)=>ri!==i));
  const addBulkItems=()=>{
    const valid=(bulkRows||[]).filter(r=>r.name.trim());
    if(!valid.length)return;
    saveShop([...shopList,...valid.map(r=>({...r,name:r.name.trim(),id:Date.now()+Math.random(),addedBy:"Bradyn",checked:false,notes:""}))]);
    setBulkRows(null);setShowAdd(false);
  };
  const openAdd=()=>{setShowAdd(!showAdd);setAddMode("single");setBulkRows([blankRow(),blankRow(),blankRow(),blankRow(),blankRow()]);setShowS(false);};
  const [sugg,setSugg]=useState({meal:"",suggestDate:"",mealType:"Dinner",notes:""});
  const [newItem,setNewItem]=useState({name:"",qty:"1",category:"Grocery",store:"",notes:""});
  const [detailSlot,setDetailSlot]=useState(null);
  const saveShop=u=>{setShopList(u);store.save("fp2:shopList",u);};
  const saveSugg=u=>{setMealSuggestions(u);store.save("fp2:mealSuggestions",u);};
  const saveDetails=u=>{setMealDetails(u);store.save("fp2:mealDetails",u);};
  const sendSugg=()=>{if(!sugg.meal)return;saveSugg([...mealSuggestions,{...sugg,id:Date.now(),kidName:"Bradyn",status:"pending",date:new Date().toLocaleDateString()}]);setSugg({meal:"",suggestDate:"",mealType:"Dinner",notes:""});setShowS(false);};
  const addShopItem=()=>{if(!newItem.name)return;saveShop([...shopList,{...newItem,id:Date.now(),addedBy:"Bradyn",checked:false}]);setNewItem({name:"",qty:"1",category:"Grocery",store:"",notes:""});setShowAdd(false);};
  const cats=shopSettings?.categories||SHOP_CATS;
  const stores=shopSettings?.stores||SHOP_STORES;
  const C={bg:"#090e1a",card:"#0f1628",border:"#1e2d4a",accent:"#00d4ff",text:"#c8d8f0",sub:"#4a6a8a"};
        const bS={page:{background:C.bg,minHeight:"100vh",fontFamily:"Georgia,serif",color:C.text,fontSize:17},card:{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:24,marginBottom:16},cardSm:{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:18,marginBottom:12},h2:{fontSize:18,color:C.accent,fontWeight:"normal",borderBottom:`1px solid ${C.border}`,paddingBottom:10,marginBottom:18},btn:(c=C.accent)=>({background:c,border:"none",borderRadius:6,padding:"13px 22px",color:c===C.accent?C.bg:"#fff",fontFamily:"Georgia,serif",fontSize:16,cursor:"pointer",fontWeight:"bold",whiteSpace:"nowrap"}),btnGhost:{background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 17px",color:C.sub,fontFamily:"Georgia,serif",fontSize:15,cursor:"pointer"},btnDanger:{background:"transparent",border:"1px solid #f4433644",borderRadius:6,padding:"7px 13px",color:"#f44336",fontFamily:"Georgia,serif",fontSize:15,cursor:"pointer"},label:{fontSize:12,color:C.sub,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6,fontFamily:"monospace"},input:{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 14px",color:C.text,fontFamily:"Georgia,serif",fontSize:16,width:"100%",boxSizing:"border-box",outline:"none"},select:{background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 14px",color:C.text,fontFamily:"Georgia,serif",fontSize:16,width:"100%",boxSizing:"border-box",outline:"none"},row:{display:"flex",justifyContent:"space-between",alignItems:"center"},tag:co=>({background:co+"22",color:co,border:`1px solid ${co}44`,borderRadius:4,padding:"4px 10px",fontSize:13,fontFamily:"monospace"}),alert:co=>({background:co+"18",border:`1px solid ${co}44`,borderRadius:8,padding:"15px 20px",marginBottom:15}),T:{accent:C.accent,text:C.text,sub:C.sub,border:C.border,bg:C.bg}};
  const TABS=[{id:"home",label:"Home",icon:"🏠"},{id:"cal",label:"Calendar",icon:"📅"},{id:"chores",label:"Tasks",icon:"✅"},{id:"ledger",label:"Ledger",icon:"💵"},{id:"allowance",label:"Piggy Bank",icon:"💰"},{id:"board",label:"Board",icon:"📢"}];
  return(<div style={bS.page}>
    <MealDetailModal detailSlot={detailSlot} setDetailSlot={setDetailSlot} mealPlan={mealPlan} mealDetails={mealDetails||{}} shopList={shopList} saveDetails={saveDetails} saveShop={saveShop} S={bS}/>
    {showShopView&&<ShoppingListView shopList={shopList} setShopList={setShopList} shopSettings={shopSettings} onClose={()=>setShowShopView(false)}/>}
    <div style={{background:"rgba(0,0,0,0.3)",borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:9,color:C.sub,fontFamily:"monospace",letterSpacing:"0.2em"}}>FAMILY HUB</div><div style={{fontSize:16,color:C.text}}>Bradyn's View</div></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>{TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{...bS.btnGhost,borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent",borderRadius:0,color:tab===t.id?C.accent:C.sub,padding:"6px 10px",fontSize:12}}>{t.icon} {t.label}</button>)}<button onClick={()=>setShowShopView(true)} style={{...bS.btnGhost,fontSize:12,padding:"6px 10px"}}>🛒</button><button onClick={onLogout} style={{...bS.btnGhost,fontSize:12}}>Sign Out ↩</button></div>
    </div>
    <div style={{maxWidth:900,margin:"0 auto",padding:16}}>
      <div style={{marginBottom:12}}><WeatherScroll/></div>
      {tab==="home"&&<>
      <WeeklyCelebrations events={events} S={bS} setEvents={setEvents} canEdit currentUser="bradyn"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
        <div>
          <div style={bS.card}><div style={bS.h2}>This Week's Meals</div>{DAYS.map(d=>{const m=mealPlan[d]||{},has=m.Breakfast||m.Lunch||m.Dinner;return(<div key={d} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:`1px solid ${C.bg}`,alignItems:"flex-start"}}><div style={{width:64,flexShrink:0}}><div style={{fontSize:10,color:C.accent,fontFamily:"monospace"}}>{d.slice(0,3).toUpperCase()}</div></div><div style={{flex:1}}>{MEAL_TYPES.map(mt=>m[mt]&&<div key={mt} style={{display:"flex",gap:6,marginBottom:2}}><span style={{fontSize:10,color:C.sub,minWidth:50,fontFamily:"monospace"}}>{mt}</span><span style={{fontSize:12,color:C.text}}>{m[mt]}</span></div>)}{!has&&<span style={{fontSize:11,color:C.border}}>Nothing planned</span>}</div></div>);})}</div>
          <div style={bS.card}><div style={bS.h2}>Shopping List</div>{shopList.filter(i=>!i.checked).slice(0,8).map(i=><div key={i.id} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.bg}`,alignItems:"center"}}><span style={{fontSize:13,color:C.text,flex:1}}>{i.qty&&i.qty!=="1"?`${i.qty}× `:""}{i.name}</span>{i.addedBy&&i.addedBy!=="Parents"&&<span style={{fontSize:10,color:C.sub}}>{i.addedBy}</span>}</div>)}{shopList.filter(i=>!i.checked).length===0&&<div style={{fontSize:13,color:C.sub}}>Nothing on the list.</div>}</div>
          {mealSuggestions.filter(s=>s.kidName==="Bradyn"&&s.status==="pending").length>0&&<div style={bS.card}>
            <div style={bS.h2}>My Suggestions</div>
            {mealSuggestions.filter(s=>s.kidName==="Bradyn"&&s.status==="pending").map(s=>{
              const dKey="sugg_"+s.id;
              const hasDetail=mealDetails&&mealDetails[dKey]&&(mealDetails[dKey].ingredients?.length>0||mealDetails[dKey].recipe?.trim());
              return(<div key={s.id} style={{padding:"8px 0",borderBottom:`1px solid ${C.bg}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                  <div>
                    <div style={{fontSize:13,color:C.text,fontWeight:"bold"}}>{s.meal} {hasDetail&&<span style={{fontSize:10,color:"#4CAF50"}}>📋</span>}</div>
                    <div style={{fontSize:11,color:C.sub}}>{s.suggestDate?new Date(s.suggestDate+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}):""} {s.mealType} — pending approval</div>
                  </div>
                  <button style={{...bS.btnGhost,padding:"5px 10px",fontSize:11}} onClick={()=>setDetailSlot({key:dKey,label:s.meal,sublabel:(s.suggestDate?new Date(s.suggestDate+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}):"")+" "+s.mealType})}>{hasDetail?"Edit":"Add"} Ingredients & Recipe</button>
                </div>
              </div>);
            })}
          </div>}
        </div>
        <div>
          <div style={bS.card}><div style={bS.h2}>Quick Actions</div><button style={{...bS.btn(),width:"100%",marginBottom:10,textAlign:"left"}} onClick={()=>{setShowS(!showS);setShowAdd(false);}}>Suggest a Meal</button><button style={{...bS.btnGhost,width:"100%",textAlign:"left"}} onClick={openAdd}>{showAdd?"Cancel Add":"Add to Shopping List"}</button></div>
          {showS&&<div style={bS.card}><div style={bS.h2}>Suggest a Meal</div><div style={{marginBottom:8}}><div style={bS.label}>Meal</div><input style={bS.input} placeholder="e.g. Lasagna, Tacos..." value={sugg.meal} onChange={e=>setSugg({...sugg,meal:e.target.value})}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}><div><div style={bS.label}>Date</div><input style={bS.input} type="date" value={sugg.suggestDate} onChange={e=>setSugg({...sugg,suggestDate:e.target.value})}/></div><div><div style={bS.label}>Meal</div><select style={bS.select} value={sugg.mealType} onChange={e=>setSugg({...sugg,mealType:e.target.value})}>{MEAL_TYPES.map(m=><option key={m}>{m}</option>)}</select></div></div><div style={{marginBottom:10}}><div style={bS.label}>Notes</div><input style={bS.input} placeholder="Why you want it..." value={sugg.notes} onChange={e=>setSugg({...sugg,notes:e.target.value})}/></div><div style={{fontSize:11,color:C.sub,marginBottom:10}}>Tip: after submitting, you can add ingredients and a recipe from "My Suggestions" below.</div><div style={{display:"flex",gap:8}}><button style={bS.btn()} onClick={sendSugg}>Submit</button><button style={bS.btnGhost} onClick={()=>setShowS(false)}>Cancel</button></div></div>}
          {showAdd&&<div style={bS.card}>
            <div style={{...bS.h2,...bS.row,flexWrap:"wrap",gap:8}}>
              <span>Add to Shopping List</span>
              <div style={{display:"flex",gap:4,background:"rgba(0,0,0,0.3)",borderRadius:8,padding:3}}>
                <button onClick={()=>setAddMode("single")} style={{padding:"3px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontFamily:"Georgia,serif",background:addMode==="single"?"#00d4ff":"transparent",color:addMode==="single"?"#090e1a":C.sub}}>Single</button>
                <button onClick={()=>setAddMode("bulk")} style={{padding:"3px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontFamily:"Georgia,serif",background:addMode==="bulk"?"#00d4ff":"transparent",color:addMode==="bulk"?"#090e1a":C.sub}}>Bulk</button>
              </div>
            </div>
            {addMode==="single"&&<><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:8}}><div><div style={bS.label}>Item</div><input style={bS.input} placeholder="e.g. Milk" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})}/></div><div><div style={bS.label}>Qty</div><input style={bS.input} value={newItem.qty} onChange={e=>setNewItem({...newItem,qty:e.target.value})}/></div><div><div style={bS.label}>Category</div><select style={bS.select} value={newItem.category} onChange={e=>setNewItem({...newItem,category:e.target.value})}>{cats.map(c=><option key={c}>{c}</option>)}</select></div><div><div style={bS.label}>Store</div><select style={bS.select} value={newItem.store} onChange={e=>setNewItem({...newItem,store:e.target.value})}><option value="">Any store</option>{stores.map(s=><option key={s}>{s}</option>)}</select></div></div><div style={{marginBottom:10}}><div style={bS.label}>Notes</div><input style={bS.input} placeholder="Optional notes..." value={newItem.notes} onChange={e=>setNewItem({...newItem,notes:e.target.value})}/></div><div style={{display:"flex",gap:8}}><button style={bS.btn()} onClick={addShopItem}>Add to List</button><button style={bS.btnGhost} onClick={()=>setShowAdd(false)}>Cancel</button></div></>}
            {addMode==="bulk"&&<><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{borderBottom:`1px solid ${C.border}`}}><th style={{...bS.label,textAlign:"left",padding:"4px 4px",fontWeight:"normal"}}>Item *</th><th style={{...bS.label,textAlign:"left",padding:"4px 4px",fontWeight:"normal",width:56}}>Qty</th><th style={{...bS.label,textAlign:"left",padding:"4px 4px",fontWeight:"normal",width:110}}>Category</th><th style={{...bS.label,textAlign:"left",padding:"4px 4px",fontWeight:"normal",width:110}}>Store</th><th style={{width:26}}></th></tr></thead><tbody>{(bulkRows||[]).map((row,i)=><tr key={row.id}><td style={{padding:"3px 3px 3px 0"}}><input style={{...bS.input,padding:"5px 7px"}} placeholder="Item name" value={row.name} onChange={e=>updateBulkRow(i,"name",e.target.value)}/></td><td style={{padding:"3px 3px"}}><input style={{...bS.input,padding:"5px 7px"}} value={row.qty} onChange={e=>updateBulkRow(i,"qty",e.target.value)}/></td><td style={{padding:"3px 3px"}}><select style={{...bS.select,padding:"5px 7px"}} value={row.category} onChange={e=>updateBulkRow(i,"category",e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select></td><td style={{padding:"3px 3px"}}><select style={{...bS.select,padding:"5px 7px"}} value={row.store} onChange={e=>updateBulkRow(i,"store",e.target.value)}><option value="">Any</option>{stores.map(s=><option key={s}>{s}</option>)}</select></td><td style={{padding:"3px 0 3px 3px"}}><button onClick={()=>removeBulkRow(i)} style={{...bS.btnDanger,padding:"4px 6px"}}>×</button></td></tr>)}</tbody></table></div><div style={{display:"flex",gap:8,marginTop:8,justifyContent:"space-between",alignItems:"center"}}><button style={{...bS.btnGhost,fontSize:11,padding:"5px 10px"}} onClick={addBulkRow}>+ Add Row</button><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:11,color:C.sub}}>{(bulkRows||[]).filter(r=>r.name.trim()).length} items ready</span><button style={{...bS.btn("#4CAF50"),padding:"7px 16px",fontSize:12}} onClick={addBulkItems}>Add All to List</button></div></div></>}
          </div>}
        </div>
      </div>
      </>}
      {tab==="cal"&&<CalendarTab events={events} setEvents={setEvents} currentUser="bradyn" canEdit={true} S={bS}/>}
      {tab==="chores"&&<KidChoreView chores={chores} setChores={setChores} choreLog={choreLog} setChoreLog={setChoreLog} userKey="bradyn" userName="Bradyn" userColor="#00d4ff" appSettings={appSettings} S={bS}/>}
      {tab==="ledger"&&<BradynLedger ledger={bradynLedger||[]} setLedger={setBradynLedger} currentUser="bradyn" S={bS}/>}
      {tab==="allowance"&&<AllowanceCard kidKey="bradyn" kidLabel="Bradyn" kidColor="#00d4ff" log={allowance} setLog={setAllowance} chores={chores} setChores={setChores} S={bS}/>}
      {tab==="board"&&<MessageBoard messages={messages} setMessages={setMessages} currentUser="bradyn" S={bS}/>}
    </div>
  </div>);
}

function ParkerTab({mealPlan,shopRequests,setShopRequests,mealSuggestions,setMealSuggestions,chores,setChores,messages,setMessages,appSettings,events,setEvents,choreLog,setChoreLog,allowance,setAllowance,onLogout}){
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
  const pInp={background:"rgba(255,255,255,0.08)",border:"1px solid rgba(180,79,239,0.4)",borderRadius:8,padding:"11px 14px",color:"#e8e0ff",fontFamily:"Georgia,serif",fontSize:16,width:"100%",boxSizing:"border-box",outline:"none",marginBottom:10};
  const pBtn={background:"linear-gradient(135deg,#b44fef,#7b2fc0)",border:"none",borderRadius:10,padding:"14px 20px",color:"#fff",fontSize:16,cursor:"pointer",fontWeight:"bold",fontFamily:"Georgia,serif",width:"100%",marginBottom:10};
  const pBtnG={background:"transparent",border:"1px solid rgba(180,79,239,0.3)",borderRadius:8,padding:"10px 16px",color:"#7a6aaa",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:15};
  const pS=makeKidS({pageBg:"linear-gradient(135deg,#1a0a2e,#0d1a2e)",accentRgb:"180,79,239",accent:"#b44fef",text:"#e8e0ff",sub:"#7a6aaa",bg:"#1a0a2e"});
  const TABS=[{id:"home",label:"Home"},{id:"cal",label:"Calendar"},{id:"chores",label:"Tasks"},{id:"allowance",label:"Piggy Bank"},{id:"board",label:"Board"}];
  return(<div style={pS.page}>
    <div style={{background:"rgba(0,0,0,0.3)",borderBottom:"1px solid rgba(180,79,239,0.2)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:15,color:"#b44fef",fontWeight:"bold"}}>Parker's Hub</div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>{TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{...pBtnG,color:tab===t.id?"#b44fef":"#7a6aaa",borderColor:tab===t.id?"rgba(180,79,239,0.6)":"rgba(180,79,239,0.2)"}}>{t.label}</button>)}<button onClick={onLogout} style={pBtnG}>Sign Out ↩</button></div>
    </div>
    <div style={{maxWidth:800,margin:"0 auto",padding:16}}>
      <div style={{marginBottom:12}}><WeatherScroll/></div>
      {tab==="home"&&<div>
        <WeeklyCelebrations events={events} S={pS} setEvents={setEvents} currentUser="parker"/>
        <div style={pS.card}>
          <div style={pS.h2}>🍽 This Week's Meals</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {DAYS.map(d=>{
              const isToday=d===todayName;
              const m=mealPlan[d]||{};
              const hasMeal=m.Breakfast||m.Lunch||m.Dinner;
              return(<div key={d} style={{borderRadius:12,padding:"14px 18px",background:isToday?"rgba(180,79,239,0.18)":"rgba(255,255,255,0.04)",border:`2px solid ${isToday?"rgba(180,79,239,0.7)":"rgba(180,79,239,0.12)"}`,display:"flex",gap:16,alignItems:"flex-start"}}>
                <div style={{minWidth:44,textAlign:"center"}}>
                  <div style={{fontSize:11,color:isToday?"#b44fef":"#5a4a7a",fontFamily:"monospace",letterSpacing:"0.15em",fontWeight:"bold"}}>{d.slice(0,3).toUpperCase()}</div>
                  {isToday&&<div style={{fontSize:10,color:"#b44fef",marginTop:2}}>TODAY</div>}
                </div>
                <div style={{flex:1}}>
                  {hasMeal
                    ?MEAL_TYPES.map(mt=>m[mt]&&<div key={mt} style={{display:"flex",gap:10,marginBottom:4,alignItems:"center"}}>
                        <span style={{fontSize:18}}>{mt==="Breakfast"?"🌅":mt==="Lunch"?"☀️":"🌙"}</span>
                        <span style={{fontSize:17,color:"#e8e0ff",fontWeight:isToday?"bold":"normal"}}>{m[mt]}</span>
                      </div>)
                    :<div style={{fontSize:15,color:"#3a2a5a",fontStyle:"italic"}}>Nothing planned yet</div>
                  }
                </div>
              </div>);
            })}
          </div>
        </div>
        {!showS&&!showR&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button style={pBtn} onClick={()=>setShowS(true)}>🍕 Suggest a Meal!</button>
          <button style={{...pBtn,background:"linear-gradient(135deg,#3ef0d4,#0ab8a0)",color:"#0d1a2e"}} onClick={()=>setShowR(true)}>🛒 Request Something!</button>
        </div>}
        {showS&&<div style={pS.card}><div style={pS.h2}>What should we eat?</div><input style={pInp} placeholder="e.g. Tacos, Pizza..." value={sugg.meal} onChange={e=>setSugg({...sugg,meal:e.target.value})}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}><select style={{...pInp,marginBottom:0}} value={sugg.dayPreference} onChange={e=>setSugg({...sugg,dayPreference:e.target.value})}>{DAYS.map(d=><option key={d}>{d}</option>)}</select><select style={{...pInp,marginBottom:0}} value={sugg.mealType} onChange={e=>setSugg({...sugg,mealType:e.target.value})}>{MEAL_TYPES.map(m=><option key={m}>{m}</option>)}</select></div><input style={pInp} placeholder="Why? 😄" value={sugg.notes} onChange={e=>setSugg({...sugg,notes:e.target.value})}/><div style={{display:"flex",gap:8}}><button style={{...pBtn,marginBottom:0,flex:1}} onClick={sendSugg}>Send it! 🚀</button><button style={{...pBtnG,flex:1}} onClick={()=>setShowS(false)}>Cancel</button></div></div>}
        {showR&&<div style={pS.card}><div style={pS.h2}>What do we need?</div><input style={pInp} placeholder="What do you want?" value={item.name} onChange={e=>setItem({...item,name:e.target.value})}/><input style={pInp} placeholder="How many?" value={item.qty} onChange={e=>setItem({...item,qty:e.target.value})}/><div style={{display:"flex",gap:8}}><button style={{...pBtn,marginBottom:0,flex:1,background:"linear-gradient(135deg,#3ef0d4,#0ab8a0)",color:"#0d1a2e"}} onClick={sendItem}>Add it! ✅</button><button style={{...pBtnG,flex:1}} onClick={()=>setShowR(false)}>Cancel</button></div></div>}
      </div>}
      {tab==="cal"&&<CalendarTab events={events} setEvents={setEvents} currentUser="parker" canEdit={false} S={pS}/>}
      {tab==="chores"&&<KidChoreView chores={chores} setChores={setChores} choreLog={choreLog} setChoreLog={setChoreLog} userKey="parker" userName="Parker" userColor="#b44fef" appSettings={appSettings} S={pS}/>}
      {tab==="allowance"&&<AllowanceCard kidKey="parker" kidLabel="Parker" kidColor="#b44fef" log={allowance} setLog={setAllowance} chores={chores} setChores={setChores} S={pS}/>}
      {tab==="board"&&<MessageBoard messages={messages} setMessages={setMessages} currentUser="parker" S={pS}/>}
    </div>
  </div>);
}

function RyderTab({mealPlan,shopRequests,setShopRequests,mealSuggestions,setMealSuggestions,chores,setChores,messages,setMessages,appSettings,events,setEvents,choreLog,setChoreLog,allowance,setAllowance,onLogout}){
  const [screen,setScreen]=useState("home"),[tab,setTab]=useState("home");
  const [mealIn,setMealIn]=useState(""),[shopIn,setShopIn]=useState(""),[flash,setFlash]=useState(null);
  const saveReqs=u=>{setShopRequests(u);store.save("fp2:shopRequests",u);};
  const saveSugg=u=>{setMealSuggestions(u);store.save("fp2:mealSuggestions",u);};
  const sendMeal=()=>{if(!mealIn)return;saveSugg([...mealSuggestions,{id:Date.now(),kidName:"Ryder",meal:mealIn,dayPreference:"Any day",mealType:"Dinner",notes:"",status:"pending",date:new Date().toLocaleDateString()}]);setMealIn("");setScreen("home");setFlash("meal");setTimeout(()=>setFlash(null),2800);};
  const sendShop=()=>{if(!shopIn)return;saveReqs([...shopRequests,{id:Date.now(),kidName:"Ryder",item:shopIn,qty:"",notes:"",status:"pending",date:new Date().toLocaleDateString()}]);setShopIn("");setScreen("home");setFlash("shop");setTimeout(()=>setFlash(null),2800);};
  const todayName=DAYS[new Date().getDay()===0?6:new Date().getDay()-1];
  const tonightDinner=mealPlan[todayName]?.Dinner||"";
  const rS=makeKidS({pageBg:"linear-gradient(180deg,#0d1f0d,#1a0d0d)",accentRgb:"255,107,53",accent:"#ff6b35",text:"#fff9f0",sub:"#887766",bg:"#0d1f0d"});
  const bigBtn=(label,bg,col,onClick)=><button onClick={onClick} style={{padding:"20px 14px",fontSize:18,fontWeight:"bold",fontFamily:"Georgia,serif",background:bg,border:"none",borderRadius:18,color:col,cursor:"pointer",width:"100%",marginBottom:12}}>{label}</button>;
  const TABS=[{id:"home",label:"Home"},{id:"cal",label:"Calendar"},{id:"chores",label:"Tasks"},{id:"allowance",label:"Piggy Bank"},{id:"board",label:"Board"}];
  return(<div style={rS.page}>
    <div style={{background:"rgba(0,0,0,0.3)",borderBottom:"1px solid rgba(255,107,53,0.2)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:15,color:"#ff6b35",fontWeight:"bold"}}>Ryder's Hub</div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>{TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",border:`1px solid ${tab===t.id?"rgba(255,107,53,0.6)":"rgba(255,107,53,0.2)"}`,borderRadius:6,padding:"8px 14px",color:tab===t.id?"#ff6b35":"#887766",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:15}}>{t.label}</button>)}<button onClick={onLogout} style={{background:"transparent",border:"1px solid rgba(255,107,53,0.2)",borderRadius:6,padding:"8px 14px",color:"#887766",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:15}}>Sign Out ↩</button></div>
    </div>
    <div style={{maxWidth:800,margin:"0 auto",padding:16}}>
      <div style={{marginBottom:12}}><WeatherScroll/></div>
      {tab==="home"&&<>
        {flash&&<div style={{textAlign:"center",padding:"14px 0",marginBottom:10}}><div style={{fontSize:48,marginBottom:4}}>{flash==="meal"?"🎉":"✅"}</div><div style={{fontSize:18,color:flash==="meal"?"#ff6b35":"#4cdf7a",fontWeight:"bold"}}>{flash==="meal"?"Sent to Mom & Dad!":"Added to the list!"}</div></div>}
        <div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:44,marginBottom:2}}>🌟</div><div style={{fontSize:30,fontWeight:"bold",color:"#ff6b35"}}>Hey Ryder!</div></div>
        <WeeklyCelebrations events={events} S={rS} setEvents={setEvents} currentUser="ryder"/>
        <div style={rS.card}>
          <div style={rS.h2}>🍽 This Week's Meals</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {DAYS.map(d=>{
              const isToday=d===todayName;
              const m=mealPlan[d]||{};
              const hasMeal=m.Breakfast||m.Lunch||m.Dinner;
              return(<div key={d} style={{borderRadius:12,padding:"14px 18px",background:isToday?"rgba(255,107,53,0.18)":"rgba(255,255,255,0.04)",border:`2px solid ${isToday?"rgba(255,107,53,0.7)":"rgba(255,107,53,0.12)"}`,display:"flex",gap:16,alignItems:"flex-start"}}>
                <div style={{minWidth:44,textAlign:"center"}}>
                  <div style={{fontSize:11,color:isToday?"#ff6b35":"#665544",fontFamily:"monospace",letterSpacing:"0.15em",fontWeight:"bold"}}>{d.slice(0,3).toUpperCase()}</div>
                  {isToday&&<div style={{fontSize:10,color:"#ff6b35",marginTop:2}}>TODAY</div>}
                </div>
                <div style={{flex:1}}>
                  {hasMeal
                    ?MEAL_TYPES.map(mt=>m[mt]&&<div key={mt} style={{display:"flex",gap:10,marginBottom:4,alignItems:"center"}}>
                        <span style={{fontSize:18}}>{mt==="Breakfast"?"🌅":mt==="Lunch"?"☀️":"🌙"}</span>
                        <span style={{fontSize:17,color:"#fff9f0",fontWeight:isToday?"bold":"normal"}}>{m[mt]}</span>
                      </div>)
                    :<div style={{fontSize:15,color:"#443322",fontStyle:"italic"}}>Nothing planned yet</div>
                  }
                </div>
              </div>);
            })}
          </div>
        </div>
        {screen==="home"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>{bigBtn("🍕 I want this for dinner!","linear-gradient(135deg,#ff6b35,#cc4411)","#fff",()=>setScreen("meal"))}{bigBtn("🛒 Can we get something?","linear-gradient(135deg,#4cdf7a,#22aa55)","#0d1f0d",()=>setScreen("shop"))}</div>}
        {screen==="meal"&&<div style={rS.card}><div style={{fontSize:18,fontWeight:"bold",color:"#fff9f0",textAlign:"center",marginBottom:10}}>What do you want?</div><input autoFocus style={{background:"rgba(255,255,255,0.1)",border:"2px solid rgba(255,107,53,0.5)",borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:16,fontFamily:"Georgia,serif",width:"100%",boxSizing:"border-box",outline:"none",textAlign:"center",marginBottom:10}} placeholder="Type it here!" value={mealIn} onChange={e=>setMealIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMeal();}}/>{bigBtn("Send it! 🚀","linear-gradient(135deg,#ff6b35,#cc4411)","#fff",sendMeal)}<button onClick={()=>setScreen("home")} style={{width:"100%",padding:"8px",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#887766",fontSize:14,cursor:"pointer",fontFamily:"Georgia,serif"}}>Go back</button></div>}
        {screen==="shop"&&<div style={rS.card}><div style={{fontSize:18,fontWeight:"bold",color:"#fff9f0",textAlign:"center",marginBottom:10}}>What do we need?</div><input autoFocus style={{background:"rgba(255,255,255,0.1)",border:"2px solid rgba(76,223,122,0.5)",borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:16,fontFamily:"Georgia,serif",width:"100%",boxSizing:"border-box",outline:"none",textAlign:"center",marginBottom:10}} placeholder="Type what you want!" value={shopIn} onChange={e=>setShopIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendShop();}}/>{bigBtn("Add it! ✅","linear-gradient(135deg,#4cdf7a,#22aa55)","#0d1f0d",sendShop)}<button onClick={()=>setScreen("home")} style={{width:"100%",padding:"8px",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#887766",fontSize:14,cursor:"pointer",fontFamily:"Georgia,serif"}}>Go back</button></div>}
      </>}
      {tab==="cal"&&<CalendarTab events={events} setEvents={setEvents} currentUser="ryder" canEdit={false} S={rS}/>}
      {tab==="chores"&&<KidChoreView chores={chores} setChores={setChores} choreLog={choreLog} setChoreLog={setChoreLog} userKey="ryder" userName="Ryder" userColor="#ff6b35" appSettings={appSettings} S={rS}/>}
      {tab==="allowance"&&<AllowanceCard kidKey="ryder" kidLabel="Ryder" kidColor="#ff6b35" log={allowance} setLog={setAllowance} chores={chores} setChores={setChores} S={rS}/>}
      {tab==="board"&&<MessageBoard messages={messages} setMessages={setMessages} currentUser="ryder" S={rS}/>}
    </div>
  </div>);
}

// ── DASHBOARD SHELL — shared by Brad and Mary Beth's dashboards, which used
// to duplicate this theme/tab-bar/header/layout wiring almost byte-for-byte.
// Owns theme state, the shopping-list quick-view modal, the grouped tab bar
// with badge dots, and the global BillsBanner. `children` and `extraHeader`
// are render-props (S => JSX) since the per-user tab content and header
// extras need the computed style object too.
function DashboardShell({userKey,groups,badges,extraHeader,maxWidth=1300,appSettings,setAppSettings,shopList,setShopList,shopSettings,bills,onLogout,tab,setTab,children}){
  const [showShopView,setShowShopView]=useState(false);
  const [userTheme,setUserTheme]=useState(appSettings?.userThemes?.[userKey]||"dark");
  const S=makeS(userTheme);
  const saveTheme=key=>{setUserTheme(key);const updated={...appSettings,userThemes:{...appSettings.userThemes,[userKey]:key}};setAppSettings(updated);store.save("fp2:appSettings",updated);};
  return(<div style={S.page}>
    {showShopView&&<ShoppingListView shopList={shopList} setShopList={setShopList} shopSettings={shopSettings} onClose={()=>setShowShopView(false)}/>}
    <UserHeader user={userKey} onLogout={onLogout} S={S} extra={<div style={{display:"flex",gap:8,alignItems:"center"}}><button onClick={()=>setShowShopView(true)} style={{...S.btnGhost,fontSize:12,padding:"5px 12px"}}>🛒</button>{extraHeader&&extraHeader(S)}</div>}>
      <div style={{display:"flex",gap:0,overflowX:"auto",alignItems:"center",marginBottom:4}}>
        {groups.map((group,gi)=><div key={group.g} style={{display:"flex",alignItems:"center"}}>
          {gi>0&&<div style={{width:1,height:18,background:S.T.border,margin:"0 6px",flexShrink:0}}/>}
          <span style={{fontSize:9,color:S.T.sub,fontFamily:"monospace",letterSpacing:"0.15em",padding:"0 4px",flexShrink:0}}>{group.g}</span>
          {group.tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 12px",cursor:"pointer",fontSize:12,background:"none",border:"none",borderBottom:tab===t.id?`2px solid ${S.T.accent}`:"2px solid transparent",color:tab===t.id?S.T.accent:S.T.sub,fontFamily:"Georgia,serif",whiteSpace:"nowrap",position:"relative",WebkitTapHighlightColor:"transparent"}}>
            {t.icon} {t.label}
            {badges?.[t.id]>0&&<span style={{position:"absolute",top:2,right:0,background:"#f44336",color:"#fff",borderRadius:"50%",width:13,height:13,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace"}}>{badges[t.id]}</span>}
          </button>)}
        </div>)}
      </div>
      <ThemePicker currentTheme={userTheme} onSelect={saveTheme} S={S}/>
    </UserHeader>
    <div style={{maxWidth,margin:"0 auto",padding:"16px 16px"}}>
      {tab!=="home"&&bills&&<BillsBanner bills={bills} S={S}/>}
      {children(S)}
    </div>
  </div>);
}

// ── BRAD DASHBOARD ────────────────────────────────────────────────────────────
function BradDashboard(props){
  const {onLogout,auth,setAuth,netWorth,accounts,setAccounts,debts,setDebts,expenses,setExpenses,goals,setGoals,transactions,setTransactions,pslf,setPslf,scenario,setScenario,reviewTxns,setReviewTxns,uploadLoading,handleUpload,confirmTxns,fileRef,profile,setProfile,mealPlan,nextWeekPlan,mealPlans,setMealPlans,mealFavs,setMealFavs,shopList,setShopList,mealSuggestions,setMealSuggestions,shopRequests,setShopRequests,bills,setBills,billHistory,setBillHistory,totalAssets,totalDebtAmt,totalCC,combinedLiquid,cushion,dti,mortgageRate,monthlyMortgage,loanAmt,surplus,takeHome,totalExpenses,slPayment,downNeeded,closing,homePrice,chores,setChores,messages,setMessages,appSettings,setAppSettings,mealDetails,setMealDetails,shopSettings,setShopSettings,payAccounts,setPayAccounts,bradynLedger,setBradynLedger,events,setEvents,todos,setTodos,shopStaples,setShopStaples,choreLog,setChoreLog,allowance,setAllowance}=props;
  const [tab,setTab]=useState("home");
  const saveTodos=u=>{const updated={...todos,brad:u};setTodos(updated);store.save("fp2:todos",updated);};
  const todoOn=appSettings?.todoEnabled?.brad!==false;
  // Finance is its own siloed area, opt-in via Settings — defaults to visible
  // so it doesn't vanish out from under someone already using it.
  const financeOn=appSettings?.financeEnabled!==false;
  const pendingCount=(mealSuggestions||[]).filter(s=>s.status==="pending").length+(shopRequests||[]).filter(r=>r.status==="pending").length;
  const msgPending=(messages||[]).filter(m=>!m.approved).length;
  const GROUPS=[
    {g:"Home",tabs:[{id:"home",label:"Home",icon:"🏠"}]},
    {g:"Family",tabs:[{id:"cal",label:"Calendar",icon:"📅"},{id:"meals",label:"Meals & Food",icon:"🍽"},{id:"chores",label:"Tasks",icon:"✅"},...(todoOn?[{id:"todo",label:"My To-Do",icon:"📝"}]:[]),{id:"board",label:"Board",icon:"📢"},{id:"bills",label:"Bills",icon:"🧾"},{id:"bradynledger",label:"Bradyn & Me",icon:"💵"},{id:"allowance",label:"Allowance",icon:"💰"}]},
    ...(financeOn?[{g:"Finance",tabs:[{id:"finance",label:"Finance",icon:"◈"}]}]:[]),
    {g:"Settings",tabs:[{id:"settings",label:"Settings",icon:"⚙️"}]},
  ];
  return(
    <DashboardShell userKey="brad" groups={GROUPS} badges={{meals:pendingCount,board:msgPending}} maxWidth={1400} appSettings={appSettings} setAppSettings={setAppSettings} shopList={shopList} setShopList={setShopList} shopSettings={shopSettings} bills={bills} onLogout={onLogout} tab={tab} setTab={setTab}
      extraHeader={S=><div style={{fontSize:13,color:S.T.accent,fontFamily:"monospace"}}>{fmt(netWorth)} net worth</div>}>
      {S=>(<>
        {tab==="home"&&<PersonalHomeScreen currentUser="brad" mealPlan={mealPlan} nextWeekPlan={nextWeekPlan} bills={bills||[]} chores={chores||[]} setChores={setChores} choreLog={choreLog} setChoreLog={setChoreLog} messages={messages||[]} appSettings={appSettings} events={events} setEvents={setEvents} S={S}/>}
        {tab==="cal"&&<CalendarTab events={events} setEvents={setEvents} currentUser="brad" canEdit={true} S={S}/>}
        {tab==="meals"&&<MealsTab mealPlans={mealPlans} setMealPlans={setMealPlans} shopList={shopList} setShopList={setShopList} mealSuggestions={mealSuggestions} setMealSuggestions={setMealSuggestions} shopRequests={shopRequests} setShopRequests={setShopRequests} mealDetails={mealDetails} setMealDetails={setMealDetails} mealFavs={mealFavs} setMealFavs={setMealFavs} shopStaples={shopStaples} setShopStaples={setShopStaples} shopSettings={shopSettings} profile={profile} expenses={expenses} S={S}/>}
        {tab==="chores"&&<ChoresTab chores={chores} setChores={setChores} choreLog={choreLog} setChoreLog={setChoreLog} appSettings={appSettings} S={S} currentUser="brad"/>}
        {tab==="todo"&&todoOn&&<TodoTab items={todos?.brad} onSave={saveTodos} S={S}/>}
        {tab==="board"&&<MessageBoard messages={messages} setMessages={setMessages} currentUser="brad" S={S}/>}
        {tab==="bills"&&<BillsTab bills={bills} setBills={setBills} billHistory={billHistory} setBillHistory={setBillHistory} profile={profile} payAccounts={payAccounts} S={S}/>}
        {tab==="bradynledger"&&<BradynLedger ledger={bradynLedger||[]} setLedger={setBradynLedger} currentUser="brad" S={S}/>}
        {tab==="allowance"&&<AllowanceOverview log={allowance} setLog={setAllowance} chores={chores} setChores={setChores} S={S}/>}
        {tab==="finance"&&financeOn&&<FinanceHub profile={profile} pslf={pslf} setPslf={setPslf} accounts={accounts} setAccounts={setAccounts} debts={debts} setDebts={setDebts} expenses={expenses} setExpenses={setExpenses} transactions={transactions} setTransactions={setTransactions} goals={goals} setGoals={setGoals} reviewTxns={reviewTxns} setReviewTxns={setReviewTxns} uploadLoading={uploadLoading} handleUpload={handleUpload} confirmTxns={confirmTxns} fileRef={fileRef} netWorth={netWorth} combinedLiquid={combinedLiquid} totalCC={totalCC} cushion={cushion} dti={dti} mortgageRate={mortgageRate} monthlyMortgage={monthlyMortgage} surplus={surplus} takeHome={takeHome} totalExpenses={totalExpenses} slPayment={slPayment} downNeeded={downNeeded} closing={closing} homePrice={homePrice} scenario={scenario} setScenario={setScenario} S={S}/>}
        {tab==="settings"&&<SettingsTab profile={profile} setProfile={setProfile} appSettings={appSettings} setAppSettings={setAppSettings} shopSettings={shopSettings} setShopSettings={setShopSettings} payAccounts={payAccounts} setPayAccounts={setPayAccounts} auth={auth} setAuth={setAuth} S={S} currentUser="brad"/>}
      </>)}
    </DashboardShell>
  );
}

// ── MARY BETH DASHBOARD ───────────────────────────────────────────────────────
function MaryBethDashboard({bills,setBills,billHistory,setBillHistory,mealPlan,nextWeekPlan,mealPlans,setMealPlans,mealFavs,setMealFavs,shopStaples,setShopStaples,shopList,setShopList,mealSuggestions,setMealSuggestions,shopRequests,setShopRequests,profile,setProfile,expenses,debts,chores,setChores,messages,setMessages,appSettings,setAppSettings,mealDetails,setMealDetails,shopSettings,setShopSettings,payAccounts,setPayAccounts,events,setEvents,todos,setTodos,choreLog,setChoreLog,allowance,setAllowance,onLogout}){
  const [tab,setTab]=useState("home");
  const saveTodos=u=>{const updated={...todos,maryBeth:u};setTodos(updated);store.save("fp2:todos",updated);};
  const todoOn=appSettings?.todoEnabled?.maryBeth!==false;
  const pending=(mealSuggestions||[]).filter(s=>s.status==="pending").length+(shopRequests||[]).filter(r=>r.status==="pending").length;
  const msgPending=(messages||[]).filter(m=>!m.approved).length;
  const GROUPS=[
    {g:"Home",tabs:[{id:"home",label:"Home",icon:"🏠"}]},
    {g:"Family",tabs:[{id:"cal",label:"Calendar",icon:"📅"},{id:"meals",label:"Meals & Food",icon:"🍽"},{id:"chores",label:"Tasks",icon:"✅"},...(todoOn?[{id:"todo",label:"My To-Do",icon:"📝"}]:[]),{id:"board",label:"Board",icon:"📢"},{id:"bills",label:"Bills",icon:"🧾"},{id:"allowance",label:"Allowance",icon:"💰"}]},
    {g:"Settings",tabs:[{id:"settings",label:"Settings",icon:"⚙️"}]},
  ];
  return(
    <DashboardShell userKey="maryBeth" groups={GROUPS} badges={{meals:pending,board:msgPending}} maxWidth={1300} appSettings={appSettings} setAppSettings={setAppSettings} shopList={shopList} setShopList={setShopList} shopSettings={shopSettings} bills={bills} onLogout={onLogout} tab={tab} setTab={setTab}>
      {S=>(<>
        {tab==="home"&&<PersonalHomeScreen currentUser="maryBeth" mealPlan={mealPlan} nextWeekPlan={nextWeekPlan} bills={bills||[]} chores={chores||[]} setChores={setChores} choreLog={choreLog} setChoreLog={setChoreLog} messages={messages||[]} appSettings={appSettings} events={events} setEvents={setEvents} S={S}/>}
        {tab==="cal"&&<CalendarTab events={events} setEvents={setEvents} currentUser="maryBeth" canEdit={true} S={S}/>}
        {tab==="meals"&&<MealsTab mealPlans={mealPlans} setMealPlans={setMealPlans} shopList={shopList} setShopList={setShopList} mealSuggestions={mealSuggestions} setMealSuggestions={setMealSuggestions} shopRequests={shopRequests} setShopRequests={setShopRequests} mealDetails={mealDetails} setMealDetails={setMealDetails} mealFavs={mealFavs} setMealFavs={setMealFavs} shopStaples={shopStaples} setShopStaples={setShopStaples} shopSettings={shopSettings} profile={profile} expenses={expenses} S={S}/>}
        {tab==="chores"&&<ChoresTab chores={chores} setChores={setChores} choreLog={choreLog} setChoreLog={setChoreLog} appSettings={appSettings} S={S} currentUser="maryBeth"/>}
        {tab==="todo"&&todoOn&&<TodoTab items={todos?.maryBeth} onSave={saveTodos} S={S}/>}
        {tab==="board"&&<MessageBoard messages={messages} setMessages={setMessages} currentUser="maryBeth" S={S}/>}
        {tab==="bills"&&<BillsTab bills={bills} setBills={setBills} billHistory={billHistory} setBillHistory={setBillHistory} profile={profile} payAccounts={payAccounts} S={S}/>}
        {tab==="allowance"&&<AllowanceOverview log={allowance} setLog={setAllowance} chores={chores} setChores={setChores} S={S}/>}
        {tab==="settings"&&<SettingsTab profile={profile} setProfile={setProfile} appSettings={appSettings} setAppSettings={setAppSettings} shopSettings={shopSettings} setShopSettings={setShopSettings} payAccounts={payAccounts} setPayAccounts={setPayAccounts} S={S} currentUser="maryBeth"/>}
      </>)}
    </DashboardShell>
  );
}

export { BradynDashboard, ParkerTab, RyderTab, BradDashboard, MaryBethDashboard };
