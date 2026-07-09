// ── EMAIL-TO-SMS — texts via carrier email gateways (AT&T: number@txt.att.net) ─
// How delivery works: queueSms() writes a document to the Firestore `mail`
// collection in the exact shape the official Firebase "Trigger Email" extension
// expects. Once that free extension is installed on the family-hub project
// (with any SMTP account, e.g. a Gmail app password), every queued document is
// emailed automatically — and an email to a carrier gateway address arrives on
// the phone as a normal text message. Until the extension is installed, the
// composer's "Open in Mail app" fallback works with zero setup.
import { db } from "./store";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const CARRIERS=[
  {key:"att",label:"AT&T",domain:"txt.att.net"},
  {key:"verizon",label:"Verizon",domain:"vtext.com"},
  {key:"tmobile",label:"T-Mobile",domain:"tmomail.net"},
  {key:"cricket",label:"Cricket",domain:"sms.cricketwireless.net"},
  {key:"boost",label:"Boost",domain:"sms.myboostmobile.com"},
  {key:"uscellular",label:"US Cellular",domain:"email.uscc.net"},
  {key:"metro",label:"Metro",domain:"mymetropcs.com"},
];

const blankSmsSettings={
  enabled:false,
  numbers:{}, // { brad:{phone:"555-123-4567",carrier:"att"}, ... }
  notify:{kidRequests:true,boardPosts:true,billPaid:true},
};

// Module-level config so deep components (kid dashboards, board, bills) can
// send without threading settings through every prop chain. App keeps it in
// sync whenever smsSettings loads or changes.
let cfg=blankSmsSettings;
const configureSms=s=>{cfg={...blankSmsSettings,...(s||{}),numbers:{...(s?.numbers||{})},notify:{...blankSmsSettings.notify,...(s?.notify||{})}};};
const smsEnabled=()=>!!cfg.enabled;

// "(555) 123-4567" or "1-555-123-4567" → "5551234567@txt.att.net"
const gatewayFor=userKey=>{
  const n=cfg.numbers[userKey];
  if(!n||!n.phone)return null;
  let digits=String(n.phone).replace(/\D/g,"");
  if(digits.length===11&&digits.startsWith("1"))digits=digits.slice(1);
  if(digits.length!==10)return null;
  const c=CARRIERS.find(x=>x.key===(n.carrier||"att"))||CARRIERS[0];
  return `${digits}@${c.domain}`;
};
const textableUsers=userKeys=>userKeys.filter(k=>gatewayFor(k));

// Queue a text for the Trigger Email extension to deliver. SMS gateways cut
// long messages off, so keep it under ~300 characters.
async function queueSms(userKeys,text){
  const to=[...new Set(userKeys.map(gatewayFor).filter(Boolean))];
  if(to.length===0)return{ok:false,sent:0,reason:"no numbers set"};
  try{
    await addDoc(collection(db,"mail"),{
      to,
      message:{subject:"",text:String(text).slice(0,300)},
      createdAt:serverTimestamp(),
    });
    return{ok:true,sent:to.length};
  }catch(e){
    console.error("SMS queue error:",e);
    return{ok:false,sent:0,reason:e.message};
  }
}

// Fire-and-forget notification to both parents, gated by the master switch and
// the per-event toggle in Settings. kind: "kidRequests" | "boardPosts" | "billPaid".
function notifyParents(kind,text){
  if(!cfg.enabled||!cfg.notify[kind])return;
  queueSms(["brad","maryBeth"],text);
}

// Zero-setup fallback: opens the mail app addressed to the gateway(s).
const mailtoLink=(userKeys,text)=>{
  const to=[...new Set(userKeys.map(gatewayFor).filter(Boolean))].join(",");
  return to?`mailto:${to}?body=${encodeURIComponent(String(text).slice(0,300))}`:null;
};

export { CARRIERS, blankSmsSettings, configureSms, smsEnabled, gatewayFor, textableUsers, queueSms, notifyParents, mailtoLink };
