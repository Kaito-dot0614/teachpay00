const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CALENDAR_ID = 'primary';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

function loadGoogleApi() {
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

async function addToGoogleCalendar(session) {
  const dt = new Date(session.date + 'T' + session.startTime);
  const dtEnd = new Date(session.date + 'T' + session.endTime);
  const studentName = USERS[session.studentId]?.name || '';

  return new Promise((resolve, reject) => {
    google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: async (tokenResponse) => {
        if (tokenResponse.error) { reject(tokenResponse); return; }
        const event = {
          summary: `授業 - ${studentName}`,
          description: session.subjects?.join('・') || '',
          start: { dateTime: dt.toISOString(), timeZone: 'Asia/Tokyo' },
          end: { dateTime: dtEnd.toISOString(), timeZone: 'Asia/Tokyo' },
        };
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
          }
        );
        if (res.ok) resolve(await res.json());
        else rej
import { useState, useEffect, useRef } from "react";

async function sGet(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch{return null;}}
async function sSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}

const USERS={
  かいと:  {id:"かいと",  name:"かいと",  role:"tutor",   pw:"kaito0614"},
  かなこ:  {id:"かなこ",  name:"かなこ",  role:"parent",  pw:"iikana3"},
  よしゆき:{id:"よしゆき",name:"よしゆき",role:"parent",  pw:"iiyoshi3"},
  りな:    {id:"りな",    name:"りな",    role:"student", pw:"1125"},
  れな:    {id:"れな",    name:"れな",    role:"student", pw:"0529"},
  わたる:  {id:"わたる",  name:"わたる",  role:"student", pw:"0805"},
};
const SUBJECTS=["数学","英語","国語","理科","社会","その他"];
const SCOL={りな:"#B85450",れな:"#3D6E9E",わたる:"#5A7A3A"};
const WDAYS=["日","月","火","水","木","金","土"];
const MONTHS=Array.from({length:12},(_,i)=>`${i+1}月`);
const DEFAULT_RATE=2000;
const DEFAULT_SESSIONS=[
  {id:"s1",studentId:"りな",date:"2026-05-08",startTime:"15:00",endTime:"16:30",subjects:["数学"],status:"completed",actualStart:"15:00",actualEnd:"16:35"},
  {id:"s2",studentId:"れな",date:"2026-05-09",startTime:"14:00",endTime:"15:00",subjects:["英語"],status:"completed",actualStart:"14:05",actualEnd:"15:10"},
  {id:"s3",studentId:"りな",date:"2026-05-13",startTime:"15:00",endTime:"16:30",subjects:["数学","理科"],status:"scheduled",actualStart:null,actualEnd:null},
  {id:"s4",studentId:"れな",date:"2026-05-14",startTime:"14:00",endTime:"15:00",subjects:["国語"],status:"scheduled",actualStart:null,actualEnd:null},
  {id:"s5",studentId:"わたる",date:"2026-05-20",startTime:"15:00",endTime:"17:00",subjects:["数学"],status:"scheduled",actualStart:null,actualEnd:null},
];

const toMin=t=>{if(!t)return 0;const[h,m]=t.split(":").map(Number);return h*60+m;};
const fromMin=m=>`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
const diffMin=(s,e)=>{const d=toMin(e)-toMin(s);return d>0?d:0;};
const fmtDur=m=>{const h=Math.floor(m/60),mm=m%60;return h>0?`${h}時間${mm>0?mm+"分":""}`:`${mm}分`;};
const fmtYen=n=>`¥${n.toLocaleString()}`;
const calcPay=(mins,rate)=>Math.round((mins/60)*rate);
const today=()=>new Date().toISOString().slice(0,10);
const fmtDate=d=>{const dt=new Date(d+"T00:00:00");return`${dt.getMonth()+1}/${dt.getDate()}(${WDAYS[dt.getDay()]})`;};
const nowHHMM=()=>{const n=new Date();return`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;};

function IcoHome(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11L12 3l9 8v10a1 1 0 01-1 1H5a1 1 0 01-1-1V11z"/><path d="M9 22V13h6v9"/></svg>);}
function IcoCal(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="8" cy="16" r=".8" fill="currentColor" stroke="none"/><circle cx="12" cy="16" r=".8" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r=".8" fill="currentColor" stroke="none"/></svg>);}
function IcoClock(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>);}
function IcoYen(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4l7 9 7-9M12 13v8M9 17h6M9 20h6"/></svg>);}
function IcoGear(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>);}
function IcoPlus(){return(<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>);}
function IcoPlay(){return(<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4.5l13 7.5-13 7.5V4.5z"/></svg>);}
function IcoStop(){return(<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="1.5"/></svg>);}
function IcoCheck(){return(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l6 6L20 6"/></svg>);}
function IcoEdit(){return(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);}
function IcoTrash(){return(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>);}
function IcoLeft(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>);}
function IcoRight(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>);}
function IcoLogout(){return(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>);}
function IcoUp(){return(<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>);}
function IcoDown(){return(<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>);}
function IcoPerson(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>);}

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
.acts{display:flex;gap:6px;margin-top:9px;padding-top:9px;border-top:1px solid var(--line);}
.ab{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:6px 4px;border-radius:7px;font-size:11px;font-weight:500;border:1px solid var(--line);background:var(--bg);color:var(--ink2);cursor:pointer;font-family:inherit;}
.ab-start{background:var(--green-bg);color:var(--green);border-color:#BDE0CE;}
.ab-stop{background:var(--red-bg);color:var(--red);border-color:#ECC9C8;}
.ab-edit{background:var(--blue-bg);color:var(--blue);border-color:#C0D8EF;}
.ab-del{background:var(--red-bg);color:var(--red);border-color:#ECC9C8;}
.ab-done{background:var(--green-bg);color:var(--green);border-color:#BDE0CE;}
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
.cev-r{background:var(--red-bg);color:var(--red);}
.cev-b{background:var(--blue-bg);color:var(--blue);}
.timer{background:var(--red-bg);border:1px solid #ECC9C8;border-radius:14px;padding:16px;text-align:center;margin-bottom:10px;}
.timer-label{font-size:11px;color:var(--red);margin-bottom:6px;}
.timer-dig{font-family:'DM Mono',monospace;font-size:44px;font-weight:500;color:var(--red);letter-spacing:1px;line-height:1;}
.rem{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--amber-bg);border:1px solid #E8D9A8;border-radius:10px;margin-bottom:6px;}
.rem-bar{width:2px;background:var(--amber);border-radius:1px;align-self:stretch;flex-shrink:0;min-height:32px;}
.rem-when{font-size:10px;font-weight:600;color:var(--amber);margin-bottom:2px;}
.rem-txt{font-size:12px;color:var(--ink);}
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
.demo-area{margin-top:24px;padding-top:20px;border-top:1px solid var(--line);}
.demo-lbl{font-size:10px;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:.6px;text-align:center;margin-bottom:10px;}
.demo-list{display:flex;flex-direction:column;gap:6px;}
.demo-row{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--white);border:1px solid var(--line);border-radius:10px;cursor:pointer;}
.demo-row:active{background:var(--bg);}
.demo-left{display:flex;align-items:center;gap:10px;}
.demo-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.demo-nm{font-size:13px;font-weight:500;color:var(--ink);}
.demo-id{font-size:11px;color:var(--ink3);font-family:'DM Mono',monospace;margin-top:1px;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);backdrop-filter:blur(4px);z-index:100;display:flex;align-items:flex-end;max-width:430px;left:50%;transform:translateX(-50%);}
.modal{width:100%;background:var(--white);border-top-left-radius:20px;border-top-right-radius:20px;padding:0 16px 36px;border-top:1px solid var(--line);animation:slideUp .25s ease;max-height:88vh;overflow-y:auto;}
.modal-handle{width:32px;height:3px;background:var(--line2);border-radius:2px;margin:12px auto 16px;}
.modal-ttl{font-size:17px;font-weight:600;margin-bottom:16px;}
.fld{margin-bottom:12px;}
.fld label{display:block;font-size:10px;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;}
.fld input,.fld select{width:100%;background:var(--bg);border:1px solid var(--line2);border-radius:9px;padding:10px 12px;font-size:14px;color:var(--ink);font-family:inherit;outline:none;transition:border-color .15s;-webkit-appearance:none;}
.fld input:focus,.fld select:focus{border-color:var(--ink);}
.seg{display:flex;gap:3px;background:var(--bg);border:1px solid var(--line);border-radius:9px;padding:3px;}
.sg{flex:1;padding:7px;text-align:center;font-size:13px;font-weight:500;border-radius:6px;border:none;background:transparent;color:var(--ink2);cursor:pointer;font-family:inherit;transition:all .15s;}
.sg.on{background:var(--white);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.1);}
.sbj-g{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;}
.sjb{padding:8px 4px;border-radius:7px;font-size:12px;font-weight:500;font-family:inherit;border:1px solid var(--line2);background:var(--bg);color:var(--ink2);cursor:pointer;text-align:center;transition:all .15s;}
.sjb.on{background:var(--ink);color:#fff;border-color:var(--ink);}
.tp-row{display:flex;align-items:center;justify-content:center;gap:12px;padding:6px 0;}
.tp-part{display:flex;flex-direction:column;align-items:center;gap:3px;}
.tp-num{font-family:'DM Mono',monospace;font-size:30px;font-weight:500;color:var(--ink);width:62px;text-align:center;padding:5px;background:var(--bg);border:1px solid var(--line2);border-radius:9px;}
.tp-lbl{font-size:9px;color:var(--ink3);font-weight:600;letter-spacing:.3px;}
.tp-col{font-size:26px;font-weight:400;color:var(--ink3);padding-bottom:16px;}
.tp-arr{width:26px;height:26px;border-radius:6px;background:var(--bg);border:1px solid var(--line2);color:var(--ink2);cursor:pointer;display:flex;align-items:center;justify-content:center;}
.dur{text-align:center;font-family:'DM Mono',monospace;font-size:12px;color:var(--ink2);padding:7px;border:1px solid var(--line);border-radius:8px;background:var(--bg);margin:4px 0 2px;}
.macts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;}
.mc{padding:12px;border-radius:9px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;border:none;}
.mc:active{opacity:.8;}
.mc-cancel{background:var(--bg);color:var(--ink2);border:1px solid var(--line2);}
.mc-save{background:var(--ink);color:#fff;}
.pbtn{width:100%;background:var(--ink);color:#fff;border:none;border-radius:10px;padding:13px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;}
.pbtn:active{opacity:.8;}
.divline{border:none;border-top:1px solid var(--line);margin:14px 0;}
.empty{text-align:center;padding:24px;color:var(--ink3);font-size:13px;}
.set-row{display:flex;align-items:center;justify-content:space-between;padding:13px 0;border-bottom:1px solid var(--line);}
.set-row:last-child{border-bottom:none;}
@keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.fade{animation:fadeUp .25s ease;}
`;

export default function App(){
  const[user,setUser]=useState(null);
  const[sessions,setSessions]=useState(null);
  const[rate,setRate]=useState(null);
  const[ready,setReady]=useState(false);
  useEffect(()=>{(async()=>{
    const s=await sGet("sv4");const r=await sGet("rv4");
    setSessions(s||DEFAULT_SESSIONS);setRate(r??DEFAULT_RATE);setReady(true);
  })();},[]);
  const saveSess=async n=>{setSessions(n);await sSet("sv4",n);};
  const saveRate=async r=>{setRate(r);await sSet("rv4",r);};
  if(!ready)return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#EFEFED",color:"#ABABAB",fontSize:13}}>読込中</div>;
  return(
    <>
      <style>{CSS}</style>
      {!user
        ?<Login onLogin={setUser}/>
        :user.role==="tutor"
          ?<TutorApp user={user} sessions={sessions} saveSess={saveSess} rate={rate} saveRate={saveRate} onLogout={()=>setUser(null)}/>
          :user.role==="student"
            ?<StudentApp user={user} sessions={sessions} saveSess={saveSess} onLogout={()=>setUser(null)}/>
            :<ParentApp user={user} sessions={sessions} saveSess={saveSess} rate={rate} onLogout={()=>setUser(null)}/>
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

function Hdr({user,onLogout}){
  const lbl=user.role==="tutor"?"講師":user.role==="student"?"生徒":"保護者";
  return(
    <div className="hdr">
      <div className="hdr-row">
        <span className="brand">TeachPay</span>
        <div className="hdr-right">
          <span className="role-chip">{user.name}・{lbl}</span>
          <button className="signout" onClick={onLogout}><IcoLogout/>退出</button>
        </div>
      </div>
    </div>
  );
}

function TutorApp({user,sessions,saveSess,rate,saveRate,onLogout}){
  const[tab,setTab]=useState("home");
  const TABS=[
    {id:"home",Ico:IcoHome,lbl:"ホーム"},
    {id:"cal", Ico:IcoCal, lbl:"カレンダー"},
    {id:"rec", Ico:IcoClock,lbl:"記録"},
    {id:"sal", Ico:IcoYen, lbl:"給料"},
    {id:"set", Ico:IcoGear,lbl:"設定"},
  ];
  return(
    <div className="shell">
      <Hdr user={user} onLogout={onLogout}/>
      <div className="page fade" key={tab}>
        {tab==="home"&&<THome sessions={sessions} rate={rate}/>}
        {tab==="cal" &&<TCal sessions={sessions} saveSess={saveSess} rate={rate}/>}
        {tab==="rec" &&<TRec sessions={sessions} saveSess={saveSess} rate={rate}/>}
        {tab==="sal" &&<TSal sessions={sessions} rate={rate}/>}
        {tab==="set" &&<TSet rate={rate} saveRate={saveRate}/>}
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
  const upcoming=sessions.filter(s=>s.status==="scheduled"&&s.date>=td).sort((a,b)=>a.date.localeCompare(b.date));
  const comp=sessions.filter(s=>s.status==="completed");
  const mSess=comp.filter(s=>{const d=new Date(s.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
  const mMins=mSess.reduce((a,s)=>a+diffMin(s.actualStart||s.startTime,s.actualEnd||s.endTime),0);
  const soon=upcoming.filter(s=>(new Date(s.date)-new Date(td))/86400000<=2);
  return(
    <>
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
              <div key={s.id} className="rem">
                <div className="rem-bar"/>
                <div>
                  <div className="rem-when">{diff===0?"今日":diff===1?"明日":`${diff}日後`} — {fmtDate(s.date)}</div>
                  <div className="rem-txt">{USERS[s.studentId]?.name}　{s.startTime}〜{s.endTime}</div>
                </div>
              </div>
            );
          })}
        </>
      )}
      <div className="slbl">直近の予定</div>
      {upcoming.slice(0,4).map(s=><SR key={s.id} s={s} rate={rate}/>)}
      {upcoming.length===0&&<div className="empty">予定の授業はありません</div>}
    </>
  );
}

function TCal({sessions,saveSess,rate}){
  const now=new Date();
  const[yr,setYr]=useState(now.getFullYear());const[mo,setMo]=useState(now.getMonth());
  const[modal,setModal]=useState(false);const[edit,setEdit]=useState(null);
  const td=today();
  const days=[];const first=new Date(yr,mo,1).getDay();const total=new Date(yr,mo+1,0).getDate();
  for(let i=0;i<first;i++)days.push(null);
  for(let i=1;i<=total;i++)days.push(i);
  const getDay=d=>{
    const ds=`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return sessions.filter(s=>s.date===ds);
  };
  const handleSave=async data=>{
    if(edit){
      saveSess(sessions.map(s=>s.id===edit.id?{...s,...data}:s));
    } else {
      const newSession={id:`s${Date.now()}`,status:"scheduled",actualStart:null,actualEnd:null,...data};
      saveSess([...sessions,newSession]);
      try{
        await loadGoogleApi();
        await addToGoogleCalendar(newSession);
        alert('Googleカレンダーに追加しました！');
      } catch(e){
        console.error(e);
      }
    }
    setModal(false);setEdit(null);
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
                {ds.slice(0,1).map(s=><div key={s.id} className={`cal-ev ${s.studentId==="imouto"?"cev-r":"cev-b"}`}>{USERS[s.studentId]?.name}</div>)}
                {ds.length>1&&<div style={{fontSize:8,textAlign:"center",color:"var(--ink3)"}}>+{ds.length-1}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="slbl">今月の授業</div>
      {mSess.map(s=>(
        <SR key={s.id} s={s} rate={rate} actions={[
          {label:"編集",cls:"ab-edit",Ico:IcoEdit,fn:()=>{setEdit(s);setModal(true);}},
          {label:"削除",cls:"ab-del",Ico:IcoTrash,fn:()=>saveSess(sessions.filter(x=>x.id!==s.id))},
        ]}/>
      ))}
      {mSess.length===0&&<div className="empty">この月の授業はありません</div>}
      <hr className="divline"/>
      <button className="pbtn" onClick={()=>{setEdit(null);setModal(true);}}><IcoPlus/>授業を追加</button>
      {modal&&<SModal initial={edit} onSave={handleSave} onClose={()=>{setModal(false);setEdit(null);}} tutorMode/>}
    </>
  );
}

function TRec({sessions,saveSess,rate}){
  const[tsid,setTsid]=useState(null);const[startAt,setStartAt]=useState(null);const[el,setEl]=useState(0);
  const ref=useRef(null);
  useEffect(()=>{
    if(tsid){ref.current=setInterval(()=>setEl(Math.floor((Date.now()-startAt)/1000)),500);}
    else clearInterval(ref.current);
    return()=>clearInterval(ref.current);
  },[tsid]);
  const startT=s=>{const aS=nowHHMM();saveSess(sessions.map(x=>x.id===s.id?{...x,actualStart:aS}:x));setTsid(s.id);setStartAt(Date.now());setEl(0);};
  const stopT=()=>{const aE=nowHHMM();saveSess(sessions.map(x=>x.id===tsid?{...x,status:"completed",actualEnd:aE}:x));setTsid(null);setStartAt(null);setEl(0);};
  const fEl=()=>{const h=Math.floor(el/3600),m=Math.floor((el%3600)/60),s=el%60;return`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;};
  const sched=sessions.filter(s=>s.status==="scheduled").sort((a,b)=>a.date.localeCompare(b.date));
  const comp=sessions.filter(s=>s.status==="completed").sort((a,b)=>b.date.localeCompare(a.date));
  return(
    <>
      {tsid&&(
        <div className="timer">
          <div className="timer-label">{USERS[sessions.find(s=>s.id===tsid)?.studentId]?.name}　授業中</div>
          <div className="timer-dig">{fEl()}</div>
          <button className="ab ab-stop" style={{width:"100%",marginTop:10,padding:"8px 0",borderRadius:8}} onClick={stopT}>
            <IcoStop/>終了・記録する
          </button>
        </div>
      )}
      <div className="slbl">予定の授業</div>
      {sched.map(s=>(
        <SR key={s.id} s={s} rate={rate} actions={[
          ...(!tsid?[{label:"開始",cls:"ab-start",Ico:IcoPlay,fn:()=>startT(s)}]:[]),
          {label:"完了",cls:"ab-done",Ico:IcoCheck,fn:()=>saveSess(sessions.map(x=>x.id===s.id?{...x,status:"completed",actualStart:x.actualStart||x.startTime,actualEnd:x.actualEnd||x.endTime}:x))},
        ]}/>
      ))}
      {sched.length===0&&<div className="empty">予定の授業はありません</div>}
      <div className="slbl">完了済み</div>
      {comp.slice(0,8).map(s=><SR key={s.id} s={s} rate={rate} showPay/>)}
      {comp.length===0&&<div className="empty">まだ完了した授業はありません</div>}
    </>
  );
}

function TSal({sessions,rate}){
  const now=new Date();const[yr,setYr]=useState(now.getFullYear());const[mo,setMo]=useState(now.getMonth());
  const mSess=sessions.filter(s=>s.status==="completed"&&s.date.startsWith(`${yr}-${String(mo+1).padStart(2,"0")}`));
  const mMins=mSess.reduce((a,s)=>a+diffMin(s.actualStart||s.startTime,s.actualEnd||s.endTime),0);
  const mPay=calcPay(mMins,rate);
  const byS=["りな","れな","わたる"].map(id=>{
    const ss=mSess.filter(s=>s.studentId===id);
    const mins=ss.reduce((a,s)=>a+diffMin(s.actualStart||s.startTime,s.actualEnd||s.endTime),0);
    return{id,mins,p:calcPay(mins,rate),name:USERS[id]?.name||id};
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
        {byS.map(b=>(
          <div key={b.id} className="sbox" style={{borderTop:`2px solid ${SCOL[b.id]}`}}>
            <div className="sbox-n" style={{fontSize:18,color:SCOL[b.id]}}>{fmtYen(b.p)}</div>
            <div className="sbox-l">{b.name} · {fmtDur(b.mins)}</div>
          </div>
        ))}
      </div>
      <div className="slbl">明細</div>
      {mSess.length===0&&<div className="empty">この月の完了授業はありません</div>}
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

function TSet({rate,saveRate}){
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

function StudentApp({user,sessions,saveSess,onLogout}){
  const[tab,setTab]=useState("home");
  const[modal,setModal]=useState(false);
  const td=today();
  const upcoming=sessions.filter(s=>s.studentId===user.id&&s.status==="scheduled"&&s.date>=td).sort((a,b)=>a.date.localeCompare(b.date));
  const cancel=id=>saveSess(sessions.filter(s=>!(s.id===id&&s.status==="scheduled")));
  const TABS=[
    {id:"home",Ico:IcoHome,lbl:"ホーム"},
    {id:"cal", Ico:IcoCal, lbl:"カレンダー"},
  ];
  return(
    <div className="shell">
      <Hdr user={user} onLogout={onLogout}/>
      <div className="page fade" key={tab}>
        {tab==="home"&&(
          <>
            <div className="wc" style={{marginBottom:8}}>
              <div style={{fontSize:15,fontWeight:600,marginBottom:2}}>{user.name}</div>
              <div style={{fontSize:12,color:"var(--ink2)"}}>授業の予約ができます</div>
            </div>
            <button className="pbtn" onClick={()=>setModal(true)}><IcoPlus/>授業を予約する</button>
            <div className="slbl">予定の授業</div>
            {upcoming.map(s=>(
              <SR key={s.id} s={s} rate={0} actions={[
                {label:"キャンセル",cls:"ab-del",Ico:IcoTrash,fn:()=>cancel(s.id)},
              ]}/>
            ))}
            {upcoming.length===0&&<div className="empty">予定の授業はありません</div>}
          </>
        )}
        {tab==="cal"&&<MiniCal sessions={sessions.filter(s=>s.studentId===user.id)}/>}
      </div>
      <div className="bnav">
        {TABS.map(t=>(
          <button key={t.id} className={`nb${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
            <t.Ico/><span>{t.lbl}</span>
          </button>
        ))}
      </div>
      {modal&&(
        <SModal
          initial={{studentId:user.id}}
          fixedStudent={user.id}
          onSave={data=>{saveSess([...sessions,{id:`s${Date.now()}`,status:"scheduled",actualStart:null,actualEnd:null,...data}]);setModal(false);}}
          onClose={()=>setModal(false)}
        />
      )}
    </div>
  );
}

function ParentApp({user,sessions,saveSess,rate,onLogout}){
  const[tab,setTab]=useState("りな");
  const TABS=[
    {id:"りな",  Ico:IcoPerson,lbl:"りな"},
    {id:"れな",  Ico:IcoPerson,lbl:"れな"},
    {id:"わたる",Ico:IcoPerson,lbl:"わたる"},
    {id:"salary",Ico:IcoYen,   lbl:"給料"},
  ];
  return(
    <div className="shell">
      <Hdr user={user} onLogout={onLogout}/>
      <div className="page fade" key={tab}>
        {tab==="りな"  &&<PStudent studentId="りな"   sessions={sessions} saveSess={saveSess} rate={rate}/>}
        {tab==="れな"  &&<PStudent studentId="れな"   sessions={sessions} saveSess={saveSess} rate={rate}/>}
        {tab==="わたる"&&<PStudent studentId="わたる" sessions={sessions} saveSess={saveSess} rate={rate}/>}
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

function PStudent({studentId,sessions,saveSess,rate}){
  const[subtab,setSubtab]=useState("list");
  const[modal,setModal]=useState(false);
  const td=today();
  const upcoming=sessions.filter(s=>s.studentId===studentId&&s.status==="scheduled"&&s.date>=td).sort((a,b)=>a.date.localeCompare(b.date));
  const cancel=id=>saveSess(sessions.filter(s=>!(s.id===id&&s.status==="scheduled")));
  const STABS=[
    {id:"list",Ico:IcoHome,   lbl:"予定"},
    {id:"cal", Ico:IcoCal,lbl:"カレンダー"},
  ];
  return(
    <>
      <div style={{display:"flex",gap:4,background:"var(--white)",border:"1px solid var(--line)",borderRadius:10,padding:3,marginBottom:12}}>
        {STABS.map(t=>(
          <button key={t.id} onClick={()=>setSubtab(t.id)}
            style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"7px 4px",borderRadius:7,border:"none",background:subtab===t.id?"var(--bg)":"transparent",color:subtab===t.id?"var(--ink)":"var(--ink3)",fontFamily:"inherit",fontSize:12,fontWeight:600,cursor:"pointer",boxShadow:subtab===t.id?"0 1px 3px rgba(0,0,0,.08)":"none"}}>
            <t.Ico/>{t.lbl}
          </button>
        ))}
      </div>
      {subtab==="list"&&(
        <>
          <button className="pbtn" style={{marginBottom:4}} onClick={()=>setModal(true)}><IcoPlus/>授業を予約する</button>
          <div className="slbl">予定の授業</div>
          {upcoming.map(s=>(
            <SR key={s.id} s={s} rate={rate} actions={[{label:"キャンセル",cls:"ab-del",Ico:IcoTrash,fn:()=>cancel(s.id)}]}/>
          ))}
          {upcoming.length===0&&<div className="empty">予定の授業はありません</div>}
        </>
      )}
      {subtab==="cal"&&<MiniCal sessions={sessions.filter(s=>s.studentId===studentId)}/>}
      {modal&&(
        <SModal
          initial={{studentId}}
          fixedStudent={studentId}
          onSave={data=>{saveSess([...sessions,{id:`s${Date.now()}`,status:"scheduled",actualStart:null,actualEnd:null,...data}]);setModal(false);}}
          onClose={()=>setModal(false)}
        />
      )}
    </>
  );
}

function PSalary({sessions,rate}){
  const now=new Date();const[yr,setYr]=useState(now.getFullYear());const[mo,setMo]=useState(now.getMonth());
  const mSess=sessions.filter(s=>s.status==="completed"&&s.date.startsWith(`${yr}-${String(mo+1).padStart(2,"0")}`));
  const mMins=mSess.reduce((a,s)=>a+diffMin(s.actualStart||s.startTime,s.actualEnd||s.endTime),0);
  const total=sessions.filter(s=>s.status==="completed").reduce((a,s)=>a+diffMin(s.actualStart||s.startTime,s.actualEnd||s.endTime),0);
  const byS=["りな","れな","わたる"].map(id=>{
    const ss=mSess.filter(s=>s.studentId===id);
    const mins=ss.reduce((a,s)=>a+diffMin(s.actualStart||s.startTime,s.actualEnd||s.endTime),0);
    return{id,mins,p:calcPay(mins,rate),name:USERS[id]?.name||id};
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
        {byS.map(b=>(
          <div key={b.id} className="sbox" style={{borderTop:`2px solid ${SCOL[b.id]}`}}>
            <div className="sbox-n" style={{fontSize:18,color:SCOL[b.id]}}>{fmtYen(b.p)}</div>
            <div className="sbox-l">{b.name} · {fmtDur(b.mins)}</div>
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

function MiniCal({sessions}){
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
                {ds.slice(0,1).map(s=><div key={s.id} className={`cal-ev ${SCOL[s.studentId]?"cev-r":"cev-b"}`} style={{background:SCOL[s.studentId]+"22",color:SCOL[s.studentId]||"var(--blue)"}}>{s.startTime}</div>)}
                {ds.length>1&&<div style={{fontSize:8,textAlign:"center",color:"var(--ink3)"}}>+{ds.length-1}</div>}
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

function SR({s,rate,showPay,actions}){
  const col=SCOL[s.studentId]||"#888";
  const mins=diffMin(s.actualStart||s.startTime,s.actualEnd||s.endTime);
  return(
    <div className="sr">
      <div className="sr-top">
        <div className="sr-stripe" style={{background:col}}/>
        <div className="sr-body">
          <div className="sr-name" style={{color:col}}>{USERS[s.studentId]?.name}</div>
          <div className="sr-time">{fmtDate(s.date)}　{s.actualStart||s.startTime}–{s.actualEnd||s.endTime}　{fmtDur(mins)}</div>
        </div>
        <div className="sr-end">
          {showPay&&<span className="sr-pay">{fmtYen(calcPay(mins,rate))}</span>}
          <span className={`pill ${s.status==="completed"?"p-done":"p-sched"}`}>{s.status==="completed"?"完了":"予定"}</span>
        </div>
      </div>
      {s.subjects?.length>0&&<div className="tags">{s.subjects.map(t=><span key={t} className="tag">{t}</span>)}</div>}
      {actions?.length>0&&(
        <div className="acts">
          {actions.map(a=>(
            <button key={a.label} className={`ab ${a.cls}`} onClick={a.fn}>
              <a.Ico/>{a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SModal({initial,fixedStudent,tutorMode,onSave,onClose}){
  const[sid,setSid]=useState(fixedStudent||initial?.studentId||"りな");
  const[date,setDate]=useState(initial?.date||today());
  const[sH,setSH]=useState(parseInt((initial?.startTime||"15:00").split(":")[0]));
  const[sM,setSM]=useState(parseInt((initial?.startTime||"15:00").split(":")[1]));
  const[eH,setEH]=useState(parseInt((initial?.endTime||"16:00").split(":")[0]));
  const[eM,setEM]=useState(parseInt((initial?.endTime||"16:00").split(":")[1]));
  const[aS,setAS]=useState(initial?.actualStart||"");
  const[aE,setAE]=useState(initial?.actualEnd||"");
  const[subjs,setSubjs]=useState(initial?.subjects||[]);
  const tog=s=>setSubjs(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);
  const adj=(set,v,mn,mx)=>set(p=>{let n=p+v;if(n<mn)n=mx;if(n>mx)n=mn;return n;});
  const save=()=>onSave({
    studentId:sid,date,
    startTime:fromMin(sH*60+sM),
    endTime:fromMin(eH*60+eM),
    subjects:subjs,
    ...(tutorMode&&aS?{actualStart:aS}:{}),
    ...(tutorMode&&aE?{actualEnd:aE}:{}),
  });
  const dur=diffMin(fromMin(sH*60+sM),fromMin(eH*60+eM));
  const students=Object.values(USERS).filter(u=>u.role==="student");
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div className="modal-ttl">{initial?.id?"授業を編集":"授業を予約"}</div>
        {!fixedStudent&&(
          <div className="fld">
            <label>生徒</label>
            <div className="seg">
              {students.map(s=><button key={s.id} className={`sg${sid===s.id?" on":""}`} onClick={()=>setSid(s.id)}>{s.name}</button>)}
            </div>
          </div>
        )}
        <div className="fld"><label>授業日</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="fld">
          <label>開始時刻</label>
          <div className="tp-row">
            <div className="tp-part">
              <button className="tp-arr" onClick={()=>adj(setSH,1,0,23)}><IcoUp/></button>
              <div className="tp-num">{String(sH).padStart(2,"0")}</div>
              <button className="tp-arr" onClick={()=>adj(setSH,-1,0,23)}><IcoDown/></button>
              <div className="tp-lbl">時</div>
            </div>
            <div className="tp-col">:</div>
            <div className="tp-part">
              <button className="tp-arr" onClick={()=>adj(setSM,1,0,59)}><IcoUp/></button>
              <div className="tp-num">{String(sM).padStart(2,"0")}</div>
              <button className="tp-arr" onClick={()=>adj(setSM,-1,0,59)}><IcoDown/></button>
              <div className="tp-lbl">分</div>
            </div>
          </div>
        </div>
        <div className="fld">
          <label>終了時刻</label>
          <div className="tp-row">
            <div className="tp-part">
              <button className="tp-arr" onClick={()=>adj(setEH,1,0,23)}><IcoUp/></button>
              <div className="tp-num">{String(eH).padStart(2,"0")}</div>
              <button className="tp-arr" onClick={()=>adj(setEH,-1,0,23)}><IcoDown/></button>
              <div className="tp-lbl">時</div>
            </div>
            <div className="tp-col">:</div>
            <div className="tp-part">
              <button className="tp-arr" onClick={()=>adj(setEM,1,0,59)}><IcoUp/></button>
              <div className="tp-num">{String(eM).padStart(2,"0")}</div>
              <button className="tp-arr" onClick={()=>adj(setEM,-1,0,59)}><IcoDown/></button>
              <div className="tp-lbl">分</div>
            </div>
          </div>
        </div>
        {tutorMode&&initial?.id&&(
          <>
            <div className="fld"><label>実績 開始</label><input type="time" value={aS} onChange={e=>setAS(e.target.value)}/></div>
            <div className="fld"><label>実績 終了</label><input type="time" value={aE} onChange={e=>setAE(e.target.value)}/></div>
          </>
        )}
        <div className="fld">
          <label>科目（任意・複数可）</label>
          <div className="sbj-g">
            {SUBJECTS.map(s=><button key={s} className={`sjb${subjs.includes(s)?" on":""}`} onClick={()=>tog(s)}>{s}</button>)}
          </div>
        </div>
        {dur>0&&<div className="dur">授業時間　{fmtDur(dur)}</div>}
        <div className="macts">
          <button className="mc mc-cancel" onClick={onClose}>キャンセル</button>
          <button className="mc mc-save" onClick={save}>保存する</button>
        </div>
      </div>
    </div>
  );
}
