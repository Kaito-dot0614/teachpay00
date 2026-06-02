import { useState, useEffect, useRef } from "react";

async function sGet(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch{return null;}}
async function sSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}

const USERS={
  かいと:  {id:"かいと",  name:"かいと",  role:"tutor",   pw:"kaito0614"},
  かなこ:  {id:"かなこ",  name:"かなこ",  role:"parent",  pw:"0708"},
  よしゆき:{id:"よしゆき",name:"よしゆき",role:"parent",  pw:"0526"},
};
const STUDENT_NAMES=["りな","れな","わたる"];
const SCOL={りな:"#B85450",れな:"#3D6E9E",わたる:"#5A7A3A"};
const WDAYS=["日","月","火","水","木","金","土"];
const MONTHS=Array.from({length:12},(_,i)=>`${i+1}月`);
const DEFAULT_RATE=1500;

// Googleカレンダーのイベントタイトルから生徒名を抽出
// 例: "りな 数学" → 1件、"りなれな 数学" → りな・れな各1件
function parseEvent(event){
  const title=event.title||"";
  const desc=event.description||"";
  const subjects=["数学","英語","国語","理科","社会","その他"].filter(s=>title.includes(s)||desc.includes(s));
  const start=event.start?new Date(event.start):null;
  const end=event.end?new Date(event.end):null;
  const date=start?start.toISOString().slice(0,10):null;
  const startTime=start?`${String(start.getHours()).padStart(2,"0")}:${String(start.getMinutes()).padStart(2,"0")}`:null;
  const endTime=end?`${String(end.getHours()).padStart(2,"0")}:${String(end.getMinutes()).padStart(2,"0")}`:null;
  const matched=STUDENT_NAMES.filter(name=>title.includes(name)||desc.includes(name));
  if(matched.length===0)return[];
  return matched.map(studentId=>({
    id:`${event.id}_${studentId}`,
    studentId,subjects,date,startTime,endTime,
    startISO:event.start,endISO:event.end,
    status:"scheduled",title
  }));
}

const toMin=t=>{if(!t)return 0;const[h,m]=t.split(":").map(Number);return h*60+m;};
const diffMin=(s,e,sDate,eDate)=>{
  // 日付情報がある場合は正確なms差分で計算
  if(sDate&&eDate){
    const ms=new Date(eDate)-new Date(sDate);
    if(ms>0)return Math.round(ms/60000);
  }
  // 時刻のみの場合（日跨ぎ考慮）
  let d=toMin(e)-toMin(s);
  if(d<0)d+=24*60;
  return d>0?d:0;
};
const fmtDur=m=>{const h=Math.floor(m/60),mm=m%60;return h>0?`${h}時間${mm>0?mm+"分":""}`:`${mm}分`;};
const fmtYen=n=>`¥${n.toLocaleString()}`;
const calcPay=(mins,rate)=>Math.round((mins/60)*rate);
const today=()=>new Date().toISOString().slice(0,10);
const fmtDate=d=>{const dt=new Date(d+"T00:00:00");return`${dt.getMonth()+1}/${dt.getDate()}(${WDAYS[dt.getDay()]})`;};

function IcoHome(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11L12 3l9 8v10a1 1 0 01-1 1H5a1 1 0 01-1-1V11z"/><path d="M9 22V13h6v9"/></svg>);}
function IcoCal(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="8" cy="16" r=".8" fill="currentColor" stroke="none"/><circle cx="12" cy="16" r=".8" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r=".8" fill="currentColor" stroke="none"/></svg>);}
function IcoYen(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4l7 9 7-9M12 13v8M9 17h6M9 20h6"/></svg>);}
function IcoGear(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>);}
function IcoLeft(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>);}
function IcoRight(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>);}
function IcoLogout(){return(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>);}
function IcoPerson(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>);}
function IcoRefresh(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>);}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Noto+Sans+JP:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body,#root{height:100%;background:#EFEFED;}
body{font-family:'Noto Sans JP','DM Sans',sans-serif;color:#1A1A1A;font-size:14px;line-height:1.5;}
::-webkit-scrollbar{width:0;}
:root{--bg:#EFEFED;--white:#FFFFFF;--ink:#1A1A1A;--ink2:#6B6B6B;--ink3:#ABABAB;--line:#E4E4E2;--line2:#D0D0CE;--red:#B85450;--red-bg:#FBF0EF;--blue:#3D6E9E;--blue-bg:#EDF3FA;--green:#3D7A55;--green-bg:#EDF5F1;--amber:#9B7B2F;--amber-bg:#FBF6EC;}
.shell{max-width:430px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--bg);}
.hdr{position:sticky;top:0;z-index:50;background:rgba(239,239,237,.93);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);padding-top:env(safe-area-inset-top,0);}
.hdr-row{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;}
.brand{font-family:'DM Sans',sans-serif;font-size:16px;font-weight:600;color:var(--ink);letter-spacing:-.3px;}
.hdr-right{display:flex;align-items:center;gap:8px;}
.role-chip{font-size:11px;font-weight:500;color:var(--ink2);background:var(--white);border:1px solid var(--line2);border-radius:5px;padding:2px 8px;}
.signout{display:flex;align-items:center;gap:4px;padding:5px 9px;border-radius:6px;border:1px solid var(--line2);background:transparent;color:var(--ink2);font-size:11px;font-weight:500;cursor:pointer;font-family:inherit;}
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:rgba(255,255,255,.96);backdrop-filter:blur(16px);border-top:1px solid var(--line);display:flex;padding-bottom:env(safe-area-inset-bottom,10px);z-index:50;}
.nb{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 0 5px;border:none;background:transparent;color:var(--ink3);font-family:inherit;font-size:9px;font-weight:500;cursor:pointer;letter-spacing:.3px;transition:color .15s;}
.nb.on{color:var(--ink);}
.nb:not(.on) svg{opacity:.4;}
.page{flex:1;overflow-y:auto;padding:16px 14px 100px;}
.slbl{font-size:10px;font-weight:600;color:var(--ink3);letter-spacing:.7px;text-transform:uppercase;margin:18px 0 8px;padding-left:1px;}
.slbl:first-child{margin-top:2px;}
.wc{background:var(--white);border:1px solid var(--line);border-radius:14px;padding:14px;}
.wc+.wc{margin-top:8px;}
.hero{background:var(--ink);border-radius:14px;padding:18px 16px;margin-bottom:8px;}
.hero-lbl{font-size:10px;color:rgba(255,255,255,.45);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;}
.hero-amt{font-family:'DM Mono',monospace;font-size:36px;font-weight:500;color:#fff;letter-spacing:-1px;line-height:1;}
.hero-sub{font-size:11px;color:rgba(255,255,255,.35);margin-top:7px;font-family:'DM Mono',monospace;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;}
.sbox{background:var(--white);border:1px solid var(--line);border-radius:12px;padding:12px 12px 10px;}
.sbox-n{font-family:'DM Mono',monospace;font-size:24px;font-weight:500;color:var(--ink);line-height:1;}
.sbox-l{font-size:11px;color:var(--ink2);margin-top:4px;}
.sr{background:var(--white);border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:7px;}
.sr-top{display:flex;align-items:center;gap:10px;}
.sr-stripe{width:2px;align-self:stretch;border-radius:1px;flex-shrink:0;min-height:36px;}
.sr-body{flex:1;min-width:0;}
.sr-name{font-size:13px;font-weight:600;}
.sr-time{font-size:11px;color:var(--ink2);margin-top:2px;font-family:'DM Mono',monospace;}
.sr-end{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;}
.sr-pay{font-family:'DM Mono',monospace;font-size:13px;font-weight:500;color:var(--green);}
.pill{display:inline-flex;align-items:center;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;}
.p-sched{background:var(--amber-bg);color:var(--amber);}
.p-done{background:var(--green-bg);color:var(--green);}
.tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:7px;}
.tag{font-size:10px;padding:2px 7px;border-radius:4px;border:1px solid var(--line2);color:var(--ink2);}
.cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.cn-btn{width:30px;height:30px;border-radius:7px;border:1px solid var(--line2);background:var(--bg);color:var(--ink2);cursor:pointer;display:flex;align-items:center;justify-content:center;}
.cal-mo{font-size:15px;font-weight:600;}
.cal-g{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
.cal-wd{text-align:center;font-size:9px;font-weight:600;color:var(--ink3);padding:3px 0;letter-spacing:.4px;}
.cal-c{min-height:44px;border-radius:7px;padding:3px;transition:background .12s;}
.cal-c.empty{cursor:default;}
.cal-c:not(.empty):hover{background:var(--line);}
.cal-c.tod{background:var(--ink);}
.cal-c.tod .cal-dn{color:#fff;}
.cal-dn{font-size:10px;font-weight:600;text-align:center;color:var(--ink2);}
.cal-ev{font-size:8px;padding:1px 3px;border-radius:3px;margin-top:1px;font-weight:600;text-align:center;white-space:nowrap;overflow:hidden;}
.mo-nav{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:14px;}
.mo-lbl{font-size:15px;font-weight:600;}
.login-wrap{min-height:100vh;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:24px;}
.login-box{width:100%;max-width:340px;}
.login-top{text-align:center;padding-bottom:28px;}
.login-mark{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;background:var(--ink);border-radius:11px;margin-bottom:14px;}
.login-title{font-family:'DM Sans',sans-serif;font-size:22px;font-weight:600;color:var(--ink);}
.login-sub{font-size:12px;color:var(--ink3);margin-top:4px;}
.li{width:100%;background:var(--white);border:1px solid var(--line2);border-radius:10px;padding:12px 14px;font-size:14px;color:var(--ink);font-family:inherit;outline:none;margin-bottom:8px;transition:border-color .15s;}
.li:focus{border-color:var(--ink);}
.li::placeholder{color:var(--ink3);}
.lb{width:100%;background:var(--ink);border:none;border-radius:10px;padding:13px;color:#fff;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;margin-top:2px;}
.lb:active{opacity:.85;}
.lerr{background:var(--red-bg);border:1px solid #ECC9C8;color:var(--red);border-radius:8px;padding:9px 12px;font-size:12px;text-align:center;margin-bottom:10px;}
.pbtn{width:100%;background:var(--ink);color:#fff;border:none;border-radius:10px;padding:13px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;}
.pbtn:active{opacity:.8;}
.rbtn{display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;border:1px solid var(--line2);background:var(--white);color:var(--ink2);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;}
.divline{border:none;border-top:1px solid var(--line);margin:14px 0;}
.empty{text-align:center;padding:24px;color:var(--ink3);font-size:13px;}
.set-row{display:flex;align-items:center;justify-content:space-between;padding:13px 0;border-bottom:1px solid var(--line);}
.set-row:last-child{border-bottom:none;}
.hint{background:var(--amber-bg);border:1px solid #E8D9A8;border-radius:10px;padding:12px 14px;font-size:12px;color:var(--ink);line-height:1.7;margin-bottom:8px;}
.hint-ttl{font-weight:600;color:var(--amber);margin-bottom:4px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;}
.loading{display:flex;align-items:center;justify-content:center;padding:32px;color:var(--ink3);font-size:13px;gap:8px;}
@keyframes spin{to{transform:rotate(360deg);}}
.spin{animation:spin 1s linear infinite;display:inline-block;}
@keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.fade{animation:fadeUp .25s ease;}
`;

// Googleカレンダーから予定を取得
async function fetchCalendarEvents(){
  try{
    const res=await fetch('/api/calendar');
    if(!res.ok)throw new Error('fetch failed');
    const data=await res.json();
    return(data.events||[]).flatMap(parseEvent).filter(e=>e.studentId&&e.date&&e.startTime&&e.endTime);
  }catch(e){
    console.error(e);
    return[];
  }
}

export default function App(){
  const[user,setUser]=useState(null);
  const[sessions,setSessions]=useState([]);
  const[rate,setRate]=useState(null);
  const[loading,setLoading]=useState(true);

  const loadData=async()=>{
    setLoading(true);
    const[r,events]=await Promise.all([sGet("rv4"),fetchCalendarEvents()]);
    setRate(r??DEFAULT_RATE);
    setSessions(events);
    setLoading(false);
  };

  useEffect(()=>{loadData();},[]);
  const saveRate=async r=>{setRate(r);await sSet("rv4",r);};

  if(loading)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#EFEFED",color:"#ABABAB",fontSize:13}}>
      <span className="spin" style={{marginRight:8}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ABABAB" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
      </span>
      読込中
    </div>
  );

  return(
    <>
      <style>{CSS}</style>
      {!user
        ?<Login onLogin={setUser}/>
        :<TutorApp user={user} sessions={sessions} rate={rate} saveRate={saveRate} onReload={loadData} onLogout={()=>setUser(null)}/>
      }
    </>
  );
}

function Login({onLogin}){
  const[id,setId]=useState("");const[pw,setPw]=useState("");const[err,setErr]=useState("");
  const go=()=>{const u=USERS[id];if(u&&u.pw===pw)onLogin(u);else setErr("IDまたはパスワードが違います");};
  return(
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-top">
          <div className="login-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
              <path d="M9 7h6M9 11h4"/>
            </svg>
          </div>
          <div className="login-title">TeachPay</div>
          <div className="login-sub">授業予定・給料管理</div>
        </div>
        {err&&<div className="lerr">{err}</div>}
        <input className="li" placeholder="ユーザーID" value={id} onChange={e=>setId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/>
        <input className="li" type="password" placeholder="パスワード" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/>
        <button className="lb" onClick={go}>ログイン</button>
      </div>
    </div>
  );
}

function Hdr({user,onLogout,onReload}){
  const lbl=user.role==="tutor"?"講師":"保護者";
  return(
    <div className="hdr">
      <div className="hdr-row">
        <span className="brand">TeachPay</span>
        <div className="hdr-right">
          <button className="rbtn" onClick={onReload}><IcoRefresh/>更新</button>
          <span className="role-chip">{user.name}・{lbl}</span>
          <button className="signout" onClick={onLogout}><IcoLogout/>退出</button>
        </div>
      </div>
    </div>
  );
}

// ── TUTOR APP ──
function TutorApp({user,sessions,rate,saveRate,onReload,onLogout}){
  const[tab,setTab]=useState("home");
  const TABS=[
    {id:"home",Ico:IcoHome,lbl:"ホーム"},
    {id:"cal", Ico:IcoCal, lbl:"カレンダー"},
    {id:"sal", Ico:IcoYen, lbl:"給料"},
    {id:"set", Ico:IcoGear,lbl:"設定"},
  ];
  return(
    <div className="shell">
      <Hdr user={user} onLogout={onLogout} onReload={onReload}/>
      <div className="page fade" key={tab}>
        {tab==="home"&&<THome sessions={sessions} rate={rate}/>}
        {tab==="cal" &&<CalView sessions={sessions}/>}
        {tab==="sal" &&<SalView sessions={sessions} rate={rate}/>}
        {tab==="set" &&<SetView rate={rate} saveRate={saveRate}/>}
      </div>
      <div className="bnav">
        {TABS.map(t=>(
          <button key={t.id} className={`nb${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
            <t.Ico/><span>{t.lbl}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function THome({sessions,rate}){
  const td=today();const now=new Date();
  const upcoming=sessions.filter(s=>s.date>=td).sort((a,b)=>a.date.localeCompare(b.date));
  const mSess=sessions.filter(s=>{const d=new Date(s.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
  const mMins=mSess.reduce((a,s)=>a+diffMin(s.startTime,s.endTime,s.startISO,s.endISO),0);
  const soon=upcoming.filter(s=>(new Date(s.date)-new Date(td))/86400000<=2);
  return(
    <>
      <div className="hint">
        <div className="hint-ttl">予定の登録方法</div>
        Googleカレンダー「レッスン日程管理」に予定を追加してください。<br/>
        タイトル例：<strong>りな 数学</strong>　または　<strong>れな 英語 国語</strong>
      </div>
      <div className="hero">
        <div className="hero-lbl">今月の給料（見込み）</div>
        <div className="hero-amt">{fmtYen(calcPay(mMins,rate))}</div>
        <div className="hero-sub">{fmtDur(mMins)} × {fmtYen(rate)}/h</div>
      </div>
      <div className="g2">
        <div className="sbox"><div className="sbox-n">{mSess.length}</div><div className="sbox-l">今月の授業数</div></div>
        <div className="sbox"><div className="sbox-n">{upcoming.length}</div><div className="sbox-l">予定中の授業</div></div>
      </div>
      {soon.length>0&&(
        <>
          <div className="slbl">近日のリマインド</div>
          {soon.map(s=>{
            const diff=Math.round((new Date(s.date)-new Date(td))/86400000);
            return(
              <div key={s.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",background:"var(--amber-bg)",border:"1px solid #E8D9A8",borderRadius:10,marginBottom:6}}>
                <div style={{width:2,background:"var(--amber)",borderRadius:1,alignSelf:"stretch",flexShrink:0,minHeight:32}}/>
                <div>
                  <div style={{fontSize:10,fontWeight:600,color:"var(--amber)",marginBottom:2}}>{diff===0?"今日":diff===1?"明日":`${diff}日後`} — {fmtDate(s.date)}</div>
                  <div style={{fontSize:12,color:"var(--ink)"}}>{s.studentId}　{s.startTime}〜{s.endTime}</div>
                </div>
              </div>
            );
          })}
        </>
      )}
      <div className="slbl">直近の予定</div>
      {upcoming.slice(0,5).map(s=><SR key={s.id} s={s} rate={rate}/>)}
      {upcoming.length===0&&<div className="empty">Googleカレンダーに予定がありません</div>}
    </>
  );
}

function CalView({sessions}){
  const now=new Date();
  const[yr,setYr]=useState(now.getFullYear());
  const[mo,setMo]=useState(now.getMonth());
  const td=today();
  const days=[];const first=new Date(yr,mo,1).getDay();const total=new Date(yr,mo+1,0).getDate();
  for(let i=0;i<first;i++)days.push(null);
  for(let i=1;i<=total;i++)days.push(i);
  const getDay=d=>{
    const ds=`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return sessions.filter(s=>s.date===ds);
  };
  const mSess=sessions.filter(s=>s.date.startsWith(`${yr}-${String(mo+1).padStart(2,"0")}`)).sort((a,b)=>a.date.localeCompare(b.date));
  return(
    <>
      <div className="wc">
        <div className="cal-nav">
          <button className="cn-btn" onClick={()=>{if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1);}}><IcoLeft/></button>
          <span className="cal-mo">{yr}年 {MONTHS[mo]}</span>
          <button className="cn-btn" onClick={()=>{if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1);}}><IcoRight/></button>
        </div>
        <div className="cal-g">
          {WDAYS.map(w=><div key={w} className="cal-wd">{w}</div>)}
          {days.map((d,i)=>{
            if(!d)return <div key={`e${i}`} className="cal-c empty"/>;
            const ds=getDay(d);
            const dateStr=`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            return(
              <div key={d} className={`cal-c${dateStr===td?" tod":""}`}>
                <div className="cal-dn">{d}</div>
                {ds.slice(0,2).map(s=>(
                  <div key={s.id} className="cal-ev" style={{background:(SCOL[s.studentId]||"#888")+"22",color:SCOL[s.studentId]||"#888"}}>
                    {s.studentId||"?"}
                  </div>
                ))}
                {ds.length>2&&<div style={{fontSize:8,textAlign:"center",color:"var(--ink3)"}}>+{ds.length-2}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="slbl">今月の授業</div>
      {mSess.map(s=><SR key={s.id} s={s} rate={0}/>)}
      {mSess.length===0&&<div className="empty">この月の授業はありません</div>}
    </>
  );
}

function SalView({sessions,rate}){
  const now=new Date();
  const[yr,setYr]=useState(now.getFullYear());
  const[mo,setMo]=useState(now.getMonth());
  const mSess=sessions.filter(s=>s.date.startsWith(`${yr}-${String(mo+1).padStart(2,"0")}`));
  const mMins=mSess.reduce((a,s)=>a+diffMin(s.startTime,s.endTime,s.startISO,s.endISO),0);
  const mPay=calcPay(mMins,rate);
  const byS=STUDENT_NAMES.map(id=>{
    const ss=mSess.filter(s=>s.studentId===id);
    const mins=ss.reduce((a,s)=>a+diffMin(s.startTime,s.endTime,s.startISO,s.endISO),0);
    return{id,mins,p:calcPay(mins,rate)};
  });
  return(
    <>
      <div className="mo-nav">
        <button className="cn-btn" onClick={()=>{if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1);}}><IcoLeft/></button>
        <span className="mo-lbl">{yr}年 {MONTHS[mo]}</span>
        <button className="cn-btn" onClick={()=>{if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1);}}><IcoRight/></button>
      </div>
      <div className="hero">
        <div className="hero-lbl">今月の合計給料</div>
        <div className="hero-amt">{fmtYen(mPay)}</div>
        <div className="hero-sub">{fmtDur(mMins)} × {fmtYen(rate)}/h</div>
      </div>
      <div className="g2">
        {byS.filter(b=>b.mins>0).map(b=>(
          <div key={b.id} className="sbox" style={{borderTop:`2px solid ${SCOL[b.id]}`}}>
            <div className="sbox-n" style={{fontSize:18,color:SCOL[b.id]}}>{fmtYen(b.p)}</div>
            <div className="sbox-l">{b.id} · {fmtDur(b.mins)}</div>
          </div>
        ))}
      </div>
      <div className="slbl">明細</div>
      {mSess.length===0&&<div className="empty">この月の授業はありません</div>}
      {[...mSess].sort((a,b)=>a.date.localeCompare(b.date)).map(s=><SR key={s.id} s={s} rate={rate} showPay/>)}
      {mSess.length>0&&(
        <div className="wc" style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
          <span style={{fontWeight:600}}>合計</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontWeight:500,fontSize:16,color:"var(--green)"}}>{fmtYen(mPay)}</span>
        </div>
      )}
    </>
  );
}

function SetView({rate,saveRate}){
  const[val,setVal]=useState(rate);const[done,setDone]=useState(false);
  const save=()=>{saveRate(Number(val));setDone(true);setTimeout(()=>setDone(false),2000);};
  return(
    <div className="wc">
      <div className="set-row">
        <div><div style={{fontWeight:600,fontSize:14}}>時給</div><div style={{fontSize:12,color:"var(--ink2)",marginTop:2}}>給料計算の基準単価</div></div>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <input type="number" value={val} onChange={e=>setVal(e.target.value)} style={{width:88,background:"var(--bg)",border:"1px solid var(--line2)",borderRadius:8,padding:"6px 8px",fontFamily:"'DM Mono',monospace",fontSize:17,fontWeight:500,color:"var(--ink)",outline:"none",textAlign:"right"}}/>
          <span style={{fontSize:12,color:"var(--ink3)"}}>円/h</span>
        </div>
      </div>
      <button onClick={save} className="pbtn" style={{marginTop:14}}>{done?"保存しました":"保存する"}</button>
    </div>
  );
}

// ── PARENT APP ──
function ParentApp({user,sessions,rate,onReload,onLogout}){
  const[tab,setTab]=useState("りな");
  const TABS=[
    {id:"りな",  Ico:IcoPerson,lbl:"りな"},
    {id:"れな",  Ico:IcoPerson,lbl:"れな"},
    {id:"わたる",Ico:IcoPerson,lbl:"わたる"},
    {id:"salary",Ico:IcoYen,   lbl:"給料"},
  ];
  return(
    <div className="shell">
      <Hdr user={user} onLogout={onLogout} onReload={onReload}/>
      <div className="page fade" key={tab}>
        {tab==="りな"  &&<PStudent studentId="りな"   sessions={sessions} rate={rate}/>}
        {tab==="れな"  &&<PStudent studentId="れな"   sessions={sessions} rate={rate}/>}
        {tab==="わたる"&&<PStudent studentId="わたる" sessions={sessions} rate={rate}/>}
        {tab==="salary"&&<PSalary sessions={sessions} rate={rate}/>}
      </div>
      <div className="bnav">
        {TABS.map(t=>(
          <button key={t.id} className={`nb${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
            <t.Ico/><span>{t.lbl}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PStudent({studentId,sessions,rate}){
  const td=today();
  const mySess=sessions.filter(s=>s.studentId===studentId);
  const upcoming=mySess.filter(s=>s.date>=td).sort((a,b)=>a.date.localeCompare(b.date));
  return(
    <>
      <div className="slbl">予定の授業</div>
      {upcoming.map(s=><SR key={s.id} s={s} rate={rate}/>)}
      {upcoming.length===0&&<div className="empty">予定の授業はありません</div>}
    </>
  );
}

function PSalary({sessions,rate}){
  const now=new Date();
  const[yr,setYr]=useState(now.getFullYear());
  const[mo,setMo]=useState(now.getMonth());
  const mSess=sessions.filter(s=>s.date.startsWith(`${yr}-${String(mo+1).padStart(2,"0")}`));
  const mMins=mSess.reduce((a,s)=>a+diffMin(s.startTime,s.endTime,s.startISO,s.endISO),0);
  const total=sessions.reduce((a,s)=>a+diffMin(s.startTime,s.endTime,s.startISO,s.endISO),0);
  const byS=STUDENT_NAMES.map(id=>{
    const ss=mSess.filter(s=>s.studentId===id);
    const mins=ss.reduce((a,s)=>a+diffMin(s.startTime,s.endTime,s.startISO,s.endISO),0);
    return{id,mins,p:calcPay(mins,rate)};
  });
  return(
    <>
      <div className="mo-nav">
        <button className="cn-btn" onClick={()=>{if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1);}}><IcoLeft/></button>
        <span className="mo-lbl">{yr}年 {MONTHS[mo]}</span>
        <button className="cn-btn" onClick={()=>{if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1);}}><IcoRight/></button>
      </div>
      <div className="hero">
        <div className="hero-lbl">今月の授業料</div>
        <div className="hero-amt">{fmtYen(calcPay(mMins,rate))}</div>
        <div className="hero-sub">{fmtDur(mMins)} × {fmtYen(rate)}/h</div>
      </div>
      <div className="g2">
        {byS.filter(b=>b.mins>0).map(b=>(
          <div key={b.id} className="sbox" style={{borderTop:`2px solid ${SCOL[b.id]}`}}>
            <div className="sbox-n" style={{fontSize:18,color:SCOL[b.id]}}>{fmtYen(b.p)}</div>
            <div className="sbox-l">{b.id} · {fmtDur(b.mins)}</div>
          </div>
        ))}
      </div>
      <div className="wc" style={{marginTop:2}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:"var(--ink2)"}}>累計授業料</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontWeight:500,fontSize:16,color:"var(--green)"}}>{fmtYen(calcPay(total,rate))}</span>
        </div>
      </div>
      <div className="slbl">今月の明細</div>
      {mSess.length===0&&<div className="empty">この月の授業はありません</div>}
      {[...mSess].sort((a,b)=>a.date.localeCompare(b.date)).map(s=><SR key={s.id} s={s} rate={rate} showPay/>)}
    </>
  );
}

function SR({s,rate,showPay}){
  const col=SCOL[s.studentId]||"#888";
  const mins=diffMin(s.startTime,s.endTime,s.startISO,s.endISO);
  return(
    <div className="sr">
      <div className="sr-top">
        <div className="sr-stripe" style={{background:col}}/>
        <div className="sr-body">
          <div className="sr-name" style={{color:col}}>{s.studentId||s.title}</div>
          <div className="sr-time">{fmtDate(s.date)}　{s.startTime}–{s.endTime}　{fmtDur(mins)}</div>
        </div>
        <div className="sr-end">
          {showPay&&<span className="sr-pay">{fmtYen(calcPay(mins,rate))}</span>}
        </div>
      </div>
      {s.subjects?.length>0&&<div className="tags">{s.subjects.map(t=><span key={t} className="tag">{t}</span>)}</div>}
    </div>
  );
}
