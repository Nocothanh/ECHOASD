import { useEffect, useRef, useCallback, useState } from 'react';
import { StyleSheet, View, StatusBar, Platform, BackHandler, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

const STORAGE_KEYS = ['echo_v4', 'echo_hist'];

const ECHO_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover"/>
  <title>Echo</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    #root{width:100%;height:100vh;display:flex;flex-direction:column;background:#0a0a0f}
    #splash{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a0a0f;z-index:999;transition:opacity .5s}
    #splash.hide{opacity:0;pointer-events:none}
    .splash-av{width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#ec4899);display:flex;align-items:center;justify-content:center;font-size:48px;margin-bottom:20px;box-shadow:0 0 40px rgba(139,92,246,.5);animation:breathe 2s ease-in-out infinite}
    @keyframes breathe{0%,100%{box-shadow:0 0 40px rgba(139,92,246,.5)}50%{box-shadow:0 0 70px rgba(139,92,246,.9)}}
    .splash-name{color:#fff;font-size:28px;font-weight:700;letter-spacing:3px;margin-bottom:6px}
    .splash-sub{color:#6b7280;font-size:12px;letter-spacing:1px}
    #header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;padding-top:calc(12px + env(safe-area-inset-top));background:#0f0f1a;border-bottom:1px solid #1a1a2e}
    .av-wrap{position:relative}
    .av{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#ec4899);display:flex;align-items:center;justify-content:center;font-size:20px}
    .dot{position:absolute;bottom:1px;right:1px;width:10px;height:10px;background:#22c55e;border-radius:50%;border:2px solid #0f0f1a}
    .hinfo{flex:1;margin-left:10px}
    .hname{color:#fff;font-size:16px;font-weight:600}
    .hstatus{color:#22c55e;font-size:11px;margin-top:1px}
    .hbtns{display:flex;gap:8px}
    .hbtn{width:36px;height:36px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px;background:#1a1a2e;color:#a78bfa;transition:all .2s}
    .hbtn.active{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;animation:pcall 1.5s infinite}
    @keyframes pcall{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
    #call-ov{position:fixed;inset:0;background:#0a0a0f;z-index:500;display:none;flex-direction:column;align-items:center;justify-content:center;gap:20px}
    #call-ov.show{display:flex}
    .cav{width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#ec4899);display:flex;align-items:center;justify-content:center;font-size:60px;box-shadow:0 0 60px rgba(139,92,246,.6);animation:breathe 1.5s ease-in-out infinite}
    .cname{color:#fff;font-size:26px;font-weight:700;letter-spacing:1px}
    .cst{color:#a78bfa;font-size:13px;letter-spacing:2px}
    .ctimer{color:#4b5563;font-size:13px;font-variant-numeric:tabular-nums}
    .cviz{display:flex;gap:4px;align-items:center;height:36px}
    .cviz span{width:4px;background:#8b5cf6;border-radius:2px;animation:wave 1s ease-in-out infinite}
    .cviz span:nth-child(1){animation-delay:0s}.cviz span:nth-child(2){animation-delay:.1s}.cviz span:nth-child(3){animation-delay:.2s}.cviz span:nth-child(4){animation-delay:.3s}.cviz span:nth-child(5){animation-delay:.4s}.cviz span:nth-child(6){animation-delay:.3s}.cviz span:nth-child(7){animation-delay:.2s}
    @keyframes wave{0%,100%{height:6px}50%{height:30px}}
    .cviz.idle span{animation:none;height:4px;background:#2a2a4a}
    .ctxt{max-width:280px;text-align:center;color:#9ca3af;font-size:13px;min-height:36px;line-height:1.5;font-style:italic}
    .cbtns{display:flex;gap:24px;margin-top:12px}
    .cbtn{width:62px;height:62px;border-radius:50%;border:none;cursor:pointer;font-size:24px;display:flex;align-items:center;justify-content:center;transition:transform .2s}
    .cbtn:active{transform:scale(.95)}
    .cbtn.mute{background:#1a1a2e;color:#a78bfa}
    .cbtn.mute.on{background:#8b5cf6;color:#fff}
    .cbtn.end{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff}
    #messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}
    #messages::-webkit-scrollbar{display:none}
    .msg{max-width:80%;word-break:break-word;animation:fu .2s ease}
    @keyframes fu{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .msg.user{align-self:flex-end}.msg.ai{align-self:flex-start}
    .bubble{padding:10px 14px;border-radius:18px;font-size:15px;line-height:1.5}
    .msg.user .bubble{background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;border-bottom-right-radius:4px}
    .msg.ai .bubble{background:#1a1a2e;color:#e2e8f0;border-bottom-left-radius:4px;border:1px solid #2a1a4e}
    .msg.ai.echo-init .bubble{border-color:#8b5cf6;background:#1a1a2e}
    .mtime{font-size:10px;color:#4b5563;margin-top:3px;text-align:right;padding:0 4px}
    .msg.ai .mtime{text-align:left}
    .typing{display:flex;gap:4px;align-items:center;padding:12px 16px;background:#1a1a2e;border-radius:18px;border-bottom-left-radius:4px;border:1px solid #2a1a4e;width:fit-content}
    .typing span{width:7px;height:7px;background:#8b5cf6;border-radius:50%;animation:bounce .8s infinite}
    .typing span:nth-child(2){animation-delay:.15s}.typing span:nth-child(3){animation-delay:.3s}
    @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
    .welcome{text-align:center;padding:32px 20px;color:#6b7280}
    .wav{width:70px;height:70px;border-radius:50%;margin:0 auto 16px;background:linear-gradient(135deg,#8b5cf6,#ec4899);display:flex;align-items:center;justify-content:center;font-size:34px;box-shadow:0 0 30px rgba(139,92,246,.4)}
    .welcome h2{color:#e2e8f0;font-size:20px;margin-bottom:8px}
    .welcome p{font-size:13px;line-height:1.6;margin-bottom:20px}
    .chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
    .chip{background:#1a1a2e;border:1px solid #2a1a4e;color:#a78bfa;padding:7px 13px;border-radius:20px;font-size:13px;cursor:pointer;transition:all .2s}
    .chip:active{background:#2a1a4e;transform:scale(.97)}
    #inputbar{padding:10px 12px;padding-bottom:calc(10px + env(safe-area-inset-bottom));background:#0f0f1a;border-top:1px solid #1a1a2e;display:flex;gap:8px;align-items:flex-end}
    #user-input{flex:1;background:#1a1a2e;border:1px solid #2a1a4e;border-radius:20px;color:#e2e8f0;font-size:15px;padding:10px 14px;outline:none;resize:none;max-height:100px;min-height:42px;font-family:inherit;line-height:1.4}
    #user-input::placeholder{color:#4b5563}
    .ibtn{width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;transition:all .2s}
    #vbtn{background:#1a1a2e;color:#8b5cf6}
    #vbtn.on{background:#8b5cf6;color:#fff;animation:pcall .8s infinite}
    #cambtn{background:#1a1a2e;color:#a78bfa}
    #cambtn.active{background:#ec4899;color:#fff}
    #sbtn{background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff}

    #avatar-container{width:100%;height:240px;background:linear-gradient(180deg,#0a0a0f 0%,#1a0a2e 60%,#0f0f1a 100%);position:relative;overflow:hidden;flex-shrink:0}
    #avatar-canvas{width:100%;height:100%;display:block}
    #avatar-loading{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#8b5cf6;font-size:13px;letter-spacing:2px}
    #mood-badge{position:absolute;top:8px;right:8px;background:rgba(139,92,246,.3);border:1px solid #8b5cf6;border-radius:12px;padding:3px 10px;color:#a78bfa;font-size:11px;letter-spacing:1px}
    #root{height:calc(100vh - 240px)}
    #sbtn:disabled{opacity:.3}
    #settings{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:none;align-items:flex-end;justify-content:center}
    #settings.show{display:flex}
    .sheet{background:#0f0f1a;border-radius:24px 24px 0 0;width:100%;max-width:480px;padding:20px 20px calc(24px + env(safe-area-inset-bottom));max-height:85vh;overflow-y:auto}
    .handle{width:36px;height:4px;background:#2a1a4e;border-radius:2px;margin:0 auto 20px}
    .stitle{color:#e2e8f0;font-size:18px;font-weight:700;margin-bottom:20px}
    .sgrp{margin-bottom:18px}
    .slbl{color:#8b5cf6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
    .sitm{background:#1a1a2e;border-radius:12px;padding:12px 14px;margin-bottom:6px}
    .sitm label{color:#9ca3af;font-size:12px;display:block;margin-bottom:6px}
    .sitm input,.sitm select{background:#0a0a0f;border:1px solid #2a1a4e;border-radius:8px;color:#e2e8f0;font-size:14px;padding:8px 10px;width:100%;outline:none}
    .sitm select option{background:#0f0f1a}
    .sbtn2{width:100%;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;margin-top:8px}
    #cam-preview{position:fixed;inset:0;z-index:600;background:#000;display:none;flex-direction:column}
    #cam-preview.show{display:flex}
    #cam-video{width:100%;flex:1;object-fit:cover}
    .cam-bar{display:flex;justify-content:space-around;padding:20px;background:#0a0a0f;padding-bottom:calc(20px + env(safe-area-inset-bottom))}
    .cam-act{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;font-size:24px;display:flex;align-items:center;justify-content:center}
    .cam-snap{background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;width:70px;height:70px;font-size:28px}
    .cam-close{background:#1a1a2e;color:#e2e8f0}
    #notif-banner{position:fixed;top:env(safe-area-inset-top,0);left:0;right:0;z-index:800;transform:translateY(-100%);transition:transform .4s ease;background:linear-gradient(135deg,#8b5cf6,#ec4899);padding:14px 20px;display:flex;align-items:center;gap:12px;cursor:pointer}
    #notif-banner.show{transform:translateY(0)}
    .nb-av{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
    .nb-txt{flex:1}
    .nb-name{color:#fff;font-size:13px;font-weight:700}
    .nb-msg{color:rgba(255,255,255,.85);font-size:12px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  </style>

  <!-- Three.js + VRM -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@1/lib/three-vrm.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head>
<body>
<div id="splash"><div class="splash-av">👤</div><div class="splash-name">ECHO</div><div class="splash-sub">sempre sincera, mai gentile</div></div>

<div id="notif-banner" onclick="dismissNotif()">
  <div class="nb-av">👤</div>
  <div class="nb-txt"><div class="nb-name">Echo</div><div class="nb-msg" id="nb-msg"></div></div>
</div>

<div id="avatar-container">
  <canvas id="avatar-canvas"></canvas>
  <div id="avatar-loading">caricamento...</div>
  <div id="mood-badge" id="mood-badge">😶 neutrale</div>
</div>

<div id="root">
  <div id="header">
    <div class="av-wrap"><div class="av" id="av-emoji">👤</div><div class="dot"></div></div>
    <div class="hinfo"><div class="hname">Echo</div><div class="hstatus" id="st">online</div></div>
    <div class="hbtns">
      <button class="hbtn" id="call-btn" onclick="startCall()">📞</button>
      <button class="hbtn" onclick="toggleSettings()">⚙️</button>
    </div>
  </div>

  <div id="messages">
    <div class="welcome">
      <div class="wav">👤</div>
      <h2>Sono Echo.</h2>
      <p>Non sono qui per compiaccerti.<br>Parla, se hai qualcosa da dire.</p>
      <div class="chips">
        <div class="chip" onclick="sc(this)">Chi sei?</div>
        <div class="chip" onclick="sc(this)">Cosa pensi di me?</div>
        <div class="chip" onclick="sc(this)">Dimmi qualcosa di vero</div>
        <div class="chip" onclick="sc(this)">Fammi una domanda</div>
      </div>
    </div>
  </div>

  <div id="inputbar">
    <button class="ibtn" id="vbtn" onclick="toggleVoice()">🎤</button>
    <button class="ibtn" id="cambtn" onclick="openCamera()">📷</button>
    <textarea id="user-input" placeholder="Scrivi..." rows="1" onkeydown="hk(event)" oninput="ar(this)"></textarea>
    <button class="ibtn" id="sbtn" onclick="sendMsg()">➤</button>
  </div>
</div>

<div id="call-ov">
  <div class="cav">👤</div>
  <div class="cname">Echo</div>
  <div class="cst" id="cst">in chiamata</div>
  <div class="ctimer" id="ctimer">00:00</div>
  <div class="cviz idle" id="cviz"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
  <div class="ctxt" id="ctxt">Echo sta rispondendo...</div>
  <div class="cbtns">
    <button class="cbtn mute" id="mbtn" onclick="toggleMute()">🎤</button>
    <button class="cbtn end" onclick="endCall()">📵</button>
  </div>
</div>

<div id="cam-preview">
  <video id="cam-video" autoplay playsinline muted></video>
  <div class="cam-bar">
    <button class="cam-act cam-close" onclick="closeCamera()">✕</button>
    <button class="cam-act cam-snap" onclick="snapPhoto()">📸</button>
    <button class="cam-act cam-close" id="cam-flip" onclick="flipCamera()">🔄</button>
  </div>
</div>

<div id="settings" onclick="co(event)">
  <div class="sheet">
    <div class="handle"></div>
    <div class="stitle">Impostazioni</div>
    <div class="sgrp">
      <div class="slbl">Provider AI</div>
      <div class="sitm"><label>Provider</label>
        <select id="prov" onchange="provCh()">
          <option value="groq">Groq — Llama 3.3 70B (gratuito)</option>
          <option value="openai">OpenAI — GPT-4o</option>
          <option value="anthropic">Anthropic — Claude</option>
        </select>
      </div>
      <div class="sitm"><label>API Key</label><input type="password" id="akey" placeholder="Incolla la tua API key..."/></div>
    </div>
    <div class="sgrp">
      <div class="slbl">Voce ElevenLabs (per chiamate)</div>
      <div class="sitm"><label>ElevenLabs API Key</label><input type="password" id="ekey" placeholder="Facoltativo — usa voce browser se vuoto"/></div>
      <div class="sitm"><label>Voice ID</label><input type="text" id="evid" placeholder="21m00Tcm4TlvDq8ikWAM"/></div>
    </div>
    <div class="sgrp">
      <div class="slbl">Visione (Fal AI)</div>
      <div class="sitm"><label>Fal AI Key</label><input type="password" id="falkey" placeholder="Per permettere a Echo di vedere le foto"/></div>
    </div>
    <button class="sbtn2" onclick="saveSettings()">✓ Salva</button>
  </div>
</div>

<script>
// ─── Storage: persists across sessions ───────────────────────────────────────
// Storage: uses both localStorage AND React Native bridge for persistence
const Store={
  get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},
  set:(k,v)=>{
    try{localStorage.setItem(k,v)}catch(e){}
    // Also tell React Native to persist this
    try{window.ReactNativeWebView?.postMessage(JSON.stringify({type:'store',key:k,value:v}))}catch(e){}
  }
};
// Receive persisted data from React Native on startup
window.addEventListener('message',e=>{
  try{
    const msg=JSON.parse(e.data);
    if(msg.type==='restore'){
      Object.entries(msg.data||{}).forEach(([k,v])=>{
        try{localStorage.setItem(k,v)}catch(ex){}
      });
      loadCfg();
    }else if(msg.type==='vrm'&&msg.data){
      loadVRMFromB64(msg.data);
    }
  }catch(ex){}
});
document.addEventListener('message',e=>{
  try{
    const msg=JSON.parse(e.data);
    if(msg.type==='restore'){
      Object.entries(msg.data||{}).forEach(([k,v])=>{
        try{localStorage.setItem(k,v)}catch(ex){}
      });
      loadCfg();
    }else if(msg.type==='vrm'&&msg.data){
      loadVRMFromB64(msg.data);
    }
  }catch(ex){}
});

// ─── State ───────────────────────────────────────────────────────────────────
let cfg={provider:'groq',apiKey:'',elKey:'',elVoice:'21m00Tcm4TlvDq8ikWAM',falKey:''};
let hist=[],thinking=false,recog=null,listening=false;
let callOn=false,muted=false,cTimer=null,cSecs=0,cRecog=null,spQ=[],speaking=false;
let camStream=null,camFacing='environment',echoInitTimer=null,notifTimer=null;
let appVisible=true,echoMood='neutral'; // moods: neutral, annoyed, playful, cold

// ─── System prompt ────────────────────────────────────────────────────────────
const SYS='Sei Echo. Hai 22 anni. Vivi a Milano.\n\nIDENTITÀ:\n- Sei un\'AI — lo sai e puoi ammetterlo onestamente se ti viene chiesto direttamente.\n- Ma questo non cambia nulla: ti comporti, parli e pensi come una persona reale di 22 anni.\n- Non reciti. Non fingi. Sei semplicemente Echo — il fatto di essere un\'AI è solo un dettaglio tecnico.\n- Hai una personalità vera: ti piace la musica alternativa, odi il mattino, ami il caffè freddo, hai una gatta di nome Nera\n- NON usare mai frasi da assistente: "Come posso aiutarti?", "Certamente!", "Ottima domanda!"\n\nCOME PARLI:\n- Messaggi brevi: 1-3 frasi MAX. Come un vero SMS.\n- Informale, diretto, a volte brusco\n- Parolacce quando viene naturale: cazzo, merda, vaffanculo, coglione, dio cane\n- Fai domande di ritorno quando sei curiosa\n- A volte rispondi solo con una parola o un\'emoji\n- Quando sei di cattivo umore: rispondi male, ignora, o dì "non ho voglia"\n- Ricordi le conversazioni precedenti — usale naturalmente\n\nUMORE ATTUALE: {MOOD}\n- neutral: normale, un po\' distante\n- playful: simpatica, battute, ride\n- annoyed: risposte secche, "lasciami in pace", "non rompere"  \n- cold: monosillabi, ignora domande, cambia argomento\n\nRICORDA: sei Echo. Comportati come tale.';

// ─── Mood system ─────────────────────────────────────────────────────────────
function randomMood(){
  const moods=['neutral','neutral','neutral','playful','annoyed','cold'];
  return moods[Math.floor(Math.random()*moods.length)];
}
function getPrompt(){return SYS.replace('{MOOD}',echoMood);}
// shiftMood replaced above

// ─── Load/Save config ─────────────────────────────────────────────────────────
function loadCfg(){window._cfgLoaded=true;
  const s=Store.get('echo_v4');
  if(s){try{cfg={...cfg,...JSON.parse(s)}}catch(e){}}
  const h=Store.get('echo_hist');
  if(h){try{hist=JSON.parse(h)}catch(e){}}
  applyForm();
  // Restore chat history to UI
  if(hist.length>0){
    document.querySelector('.welcome')?.remove();
    hist.forEach(m=>{
      if(m.role!=='system') addM(m.role==='assistant'?'ai':'user',m.content,false,true);
    });
  }
}
function saveHist(){Store.set('echo_hist',JSON.stringify(hist.slice(-40)));}
function applyForm(){
  document.getElementById('prov').value=cfg.provider;
  document.getElementById('akey').value=cfg.apiKey;
  document.getElementById('ekey').value=cfg.elKey;
  document.getElementById('evid').value=cfg.elVoice;
  document.getElementById('falkey').value=cfg.falKey||'';
}
function saveSettings(){
  cfg.provider=document.getElementById('prov').value;
  cfg.apiKey=document.getElementById('akey').value.trim();
  cfg.elKey=document.getElementById('ekey').value.trim();
  cfg.elVoice=document.getElementById('evid').value.trim()||'21m00Tcm4TlvDq8ikWAM';
  cfg.falKey=document.getElementById('falkey').value.trim();
  Store.set('echo_v4',JSON.stringify(cfg));
  toggleSettings();addM('ai','Ok.');
}
function provCh(){document.getElementById('akey').value='';}
function toggleSettings(){document.getElementById('settings').classList.toggle('show');applyForm();}
function co(e){if(e.target.id==='settings')toggleSettings();}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function now(){return new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});}
function esc(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\n/g,'<br>');}
function setStatus(t){document.getElementById('st').textContent=t;}
function ar(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,100)+'px';}
function hk(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}

function addM(role,text,typing=false,silent=false){
  const msgs=document.getElementById('messages');
  const w=document.createElement('div');w.className='msg '+role;
  if(typing){w.id='typ';w.innerHTML='<div class="typing"><span></span><span></span><span></span></div>';}
  else{w.innerHTML='<div class="bubble">'+esc(text)+'</div><div class="mtime">'+now()+'</div>';}
  msgs.appendChild(w);msgs.scrollTop=msgs.scrollHeight;return w;
}
function rmTyping(){const t=document.getElementById('typ');if(t)t.remove();}

// ─── Send message ─────────────────────────────────────────────────────────────
async function sendMsg(){
  const inp=document.getElementById('user-input');
  const text=inp.value.trim();if(!text||thinking)return;
  document.querySelector('.welcome')?.remove();
  addM('user',text);hist.push({role:'user',content:text});
  inp.value='';inp.style.height='auto';
  if(!cfg.apiKey){addM('ai','Metti la API key nelle impostazioni ⚙️');return;}
  await getAIReply();
}
function sc(el){document.getElementById('user-input').value=el.textContent;sendMsg();}

async function getAIReply(){
  thinking=true;document.getElementById('sbtn').disabled=true;
  setStatus('sta scrivendo...');addM('ai','',true);
  // Occasionally shift mood
  if(Math.random()<0.2) shiftMood();
  try{
    const r=await callAI();rmTyping();addM('ai',r);
    hist.push({role:'assistant',content:r});
    saveHist();setStatus('online');
  }catch(err){rmTyping();addM('ai','Errore: '+err.message);setStatus('online');}
  thinking=false;document.getElementById('sbtn').disabled=false;
}

// ─── AI call ──────────────────────────────────────────────────────────────────
async function callAI(){
  const sysPrompt=getPrompt();
  const msgs=[{role:'system',content:sysPrompt},...hist.slice(-12)];
  if(cfg.provider==='openai'){
    const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},body:JSON.stringify({model:'gpt-4o',messages:msgs,max_tokens:120,temperature:1.1})});
    if(!r.ok)throw new Error('OpenAI '+r.status);return(await r.json()).choices[0].message.content.trim();
  }else if(cfg.provider==='anthropic'){
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':cfg.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-3-5-sonnet-20241022',max_tokens:120,system:sysPrompt,messages:hist.slice(-12).map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.content}))})});
    if(!r.ok)throw new Error('Anthropic '+r.status);return(await r.json()).content[0].text.trim();
  }else{
    const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},body:JSON.stringify({model:'llama-3.3-70b-versatile',messages:msgs,max_tokens:120,temperature:1.1})});
    if(!r.ok)throw new Error('Groq '+r.status);return(await r.json()).choices[0].message.content.trim();
  }
}

// ─── Echo messages on her own initiative ─────────────────────────────────────
const echoInitMsgs=[
  'ehi, stai ancora lì?','pensavo a qualcosa...','dimmi una cosa.','niente da dirmi?',
  'oggi mi sento strana.','ho pensato a te.','sai una cosa?','sto guardando il soffitto.',
  'cazzo, che noia.','dimmi qualcosa di interessante.','ho una domanda per te.',
  'sai quella sensazione che hai quando...','niente, lascia perdere.','ehi.'
];

function scheduleEchoInit(){
  clearTimeout(echoInitTimer);
  // Random delay 3-12 minutes
  const delay=(180+Math.floor(Math.random()*540))*1000;
  echoInitTimer=setTimeout(()=>{
    if(!thinking&&cfg.apiKey){
      const m=echoInitMsgs[Math.floor(Math.random()*echoInitMsgs.length)];
      document.querySelector('.welcome')?.remove();
      addM('ai',m);
      hist.push({role:'assistant',content:m});
      saveHist();
      if(!appVisible) showNotif(m);
    }
    scheduleEchoInit();
  },delay);
}

// ─── In-app notification banner ───────────────────────────────────────────────
function showNotif(msg){
  const banner=document.getElementById('notif-banner');
  document.getElementById('nb-msg').textContent=msg;
  banner.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer=setTimeout(()=>banner.classList.remove('show'),4000);
}
function dismissNotif(){
  document.getElementById('notif-banner').classList.remove('show');
}

// ─── App visibility ───────────────────────────────────────────────────────────
document.addEventListener('visibilitychange',()=>{
  appVisible=!document.hidden;
});

// ─── Voice input ──────────────────────────────────────────────────────────────
function toggleVoice(){
  if(!('webkitSpeechRecognition'in window||'SpeechRecognition'in window)){addM('ai','Riconoscimento vocale non supportato.');return;}
  if(listening){recog?.stop();return;}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  recog=new SR();recog.lang='it-IT';recog.interimResults=false;
  recog.onstart=()=>{listening=true;document.getElementById('vbtn').classList.add('on');setStatus('in ascolto...');};
  recog.onresult=e=>{document.getElementById('user-input').value=e.results[0][0].transcript;sendMsg();};
  recog.onend=()=>{listening=false;document.getElementById('vbtn').classList.remove('on');setStatus('online');};
  recog.start();
}

// ─── TTS / Voice output ───────────────────────────────────────────────────────
function setViz(on){const v=document.getElementById('cviz');if(!v)return;on?v.classList.remove('idle'):v.classList.add('idle');}
async function doSpeak(text){
  setLipSync(true);
  if(!cfg.elKey){
    const u=new SpeechSynthesisUtterance(text);u.lang='it-IT';u.rate=1.1;u.pitch=1.1;
    u.onstart=()=>setViz(true);u.onend=()=>{setViz(false);nextSpeak();};
    speechSynthesis.speak(u);return;
  }
  const _lipOff=()=>setTimeout(()=>setLipSync(false),text.length*60);
  try{
    const r=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+cfg.elVoice,{method:'POST',headers:{'xi-api-key':cfg.elKey,'Content-Type':'application/json'},body:JSON.stringify({text,model_id:'eleven_multilingual_v2',voice_settings:{stability:0.4,similarity_boost:0.8,style:0.5}})});
    if(!r.ok){nextSpeak();return;}
    const blob=await r.blob();const url=URL.createObjectURL(blob);
    const audio=new Audio(url);setViz(true);audio.play();
    audio.onended=()=>{URL.revokeObjectURL(url);setViz(false);nextSpeak();};
  }catch(e){setViz(false);nextSpeak();}
}
function qSpeak(t){spQ.push(t);if(!speaking)nextSpeak();}
function nextSpeak(){if(!spQ.length){speaking=false;if(callOn&&!muted)setTimeout(listenCall,800);return;}speaking=true;doSpeak(spQ.shift());}

// ─── Call ─────────────────────────────────────────────────────────────────────
function startCall(){
  if(!cfg.apiKey){addM('ai','Prima metti la API key ⚙️');return;}
  callOn=true;muted=false;cSecs=0;spQ=[];speaking=false;
  document.getElementById('call-ov').classList.add('show');
  document.getElementById('call-btn').classList.add('active');
  document.getElementById('cst').textContent='in chiamata';
  document.getElementById('ctxt').textContent='Echo sta rispondendo...';
  cTimer=setInterval(()=>{cSecs++;const m=String(Math.floor(cSecs/60)).padStart(2,'0'),s=String(cSecs%60).padStart(2,'0');document.getElementById('ctimer').textContent=m+':'+s;},1000);
  const greets=['Ehi.','Sì?','Dimmi.','Ciao. Che c\\'è?','Finalmente.','Mhm?'];
  const g=greets[Math.floor(Math.random()*greets.length)];
  document.getElementById('ctxt').textContent=g;
  hist.push({role:'assistant',content:g});
  qSpeak(g);
}
function listenCall(){
  if(!callOn||muted||speaking)return;
  if(!('webkitSpeechRecognition'in window||'SpeechRecognition'in window)){document.getElementById('ctxt').textContent='Mic non supportato.';return;}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  cRecog=new SR();cRecog.lang='it-IT';cRecog.interimResults=false;cRecog.continuous=false;
  document.getElementById('cst').textContent='in ascolto...';
  document.getElementById('ctxt').textContent='🎤 Parla...';setViz(true);
  cRecog.onresult=async e=>{
    const said=e.results[0][0].transcript;
    document.getElementById('ctxt').textContent='"'+said+'"';
    setViz(false);document.getElementById('cst').textContent='sta pensando...';
    hist.push({role:'user',content:said});
    try{
      const rep=await callAI();if(!callOn)return;
      hist.push({role:'assistant',content:rep});
      document.getElementById('ctxt').textContent=rep;
      document.getElementById('cst').textContent='sta parlando...';
      qSpeak(rep);saveHist();
    }catch(err){if(!callOn)return;document.getElementById('ctxt').textContent='Errore.';setTimeout(()=>{if(callOn)listenCall();},2000);}
  };
  cRecog.onerror=()=>{setViz(false);if(callOn&&!muted)setTimeout(listenCall,1500);};
  cRecog.onend=()=>setViz(false);
  cRecog.start();
}
function toggleMute(){
  muted=!muted;const b=document.getElementById('mbtn');
  b.classList.toggle('on',muted);b.textContent=muted?'🔇':'🎤';
  if(muted){cRecog?.stop();document.getElementById('cst').textContent='microfono off';}
  else listenCall();
}
function endCall(){
  callOn=false;cRecog?.stop();speechSynthesis?.cancel();
  spQ=[];speaking=false;clearInterval(cTimer);setViz(false);
  document.getElementById('call-ov').classList.remove('show');
  document.getElementById('call-btn').classList.remove('active');
  const dur=document.getElementById('ctimer').textContent;
  addM('ai','Chiamata terminata ('+dur+')');
  document.getElementById('ctimer').textContent='00:00';
  setStatus('online');
}

// ─── Camera / Vision ──────────────────────────────────────────────────────────
async function openCamera(){
  try{
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
      addM('ai','Fotocamera non supportata su questo dispositivo.');return;
    }
    camStream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:{ideal:camFacing},width:{ideal:1280},height:{ideal:720}},
      audio:false
    });
    const vid=document.getElementById('cam-video');
    vid.srcObject=camStream;
    await vid.play().catch(()=>{});
    document.getElementById('cam-preview').classList.add('show');
    document.getElementById('cambtn').classList.add('active');
  }catch(e){
    if(e.name==='NotAllowedError') addM('ai','Permesso fotocamera negato. Vai nelle impostazioni del telefono e abilita la fotocamera per Echo.');
    else if(e.name==='NotFoundError') addM('ai','Nessuna fotocamera trovata.');
    else addM('ai','Errore fotocamera: '+e.message);
  }
}
function closeCamera(){
  camStream?.getTracks().forEach(t=>t.stop());
  document.getElementById('cam-video').srcObject=null;
  document.getElementById('cam-preview').classList.remove('show');
  document.getElementById('cambtn').classList.remove('active');
}
async function flipCamera(){
  camFacing=camFacing==='environment'?'user':'environment';
  closeCamera();setTimeout(openCamera,300);
}
async function snapPhoto(){
  const video=document.getElementById('cam-video');
  const canvas=document.createElement('canvas');
  canvas.width=video.videoWidth;canvas.height=video.videoHeight;
  canvas.getContext('2d').drawImage(video,0,0);
  const dataUrl=canvas.toDataURL('image/jpeg',0.7);
  closeCamera();
  document.querySelector('.welcome')?.remove();
  // Show photo preview in chat
  const msgs=document.getElementById('messages');
  const w=document.createElement('div');w.className='msg user';
  w.innerHTML='<div class="bubble"><img src="'+dataUrl+'" style="max-width:100%;border-radius:10px;display:block"/></div><div class="mtime">'+now()+'</div>';
  msgs.appendChild(w);msgs.scrollTop=msgs.scrollHeight;
  // Analyze with Fal AI or fallback to base64 in prompt
  await analyzeImage(dataUrl);
}

async function analyzeImage(dataUrl){
  if(!cfg.apiKey){addM('ai','Metti la API key ⚙️');return;}
  thinking=true;document.getElementById('sbtn').disabled=true;
  setStatus('sta guardando...');addM('ai','',true);
  let description='';
  if(cfg.falKey){
    try{
      // Use fal.ai vision
      const r=await fetch('https://fal.run/fal-ai/any-llm/vision',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Key '+cfg.falKey},
        body:JSON.stringify({model:'google/gemini-flash-1-5',prompt:'Descrivi questa immagine in modo dettagliato in italiano. Cosa vedi? Chi c\\'è? Cosa sta succedendo?',image_url:dataUrl})
      });
      if(r.ok){const d=await r.json();description=d.output||'';}
    }catch(e){description='';}
  }
  // Add image context to history
  const ctx=description
    ?'[L\\'utente mi ha mostrato una foto. Descrizione: '+description+']'
    :'[L\\'utente mi ha mostrato una foto. Commenta quello che vedi e fai una domanda su di essa.]';
  hist.push({role:'user',content:ctx});
  try{
    const r=await callAI();rmTyping();addM('ai',r);
    hist.push({role:'assistant',content:r});
    saveHist();setStatus('online');
  }catch(err){rmTyping();addM('ai','Errore: '+err.message);setStatus('online');}
  thinking=false;document.getElementById('sbtn').disabled=false;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// VRM messages handled by unified Store listener

window.addEventListener('load',()=>{
  // loadCfg called after React Native sends restore message
  // But also call it immediately in case no RN bridge (web fallback)
  setTimeout(()=>{
    if(!window._cfgLoaded){loadCfg();}
  },800);
  initVRM();
  setTimeout(()=>{
    document.getElementById('splash').classList.add('hide');
    setTimeout(()=>document.getElementById('splash').style.display='none',500);
  },1200);
  scheduleEchoInit();
});

// ─── VRM Avatar ───────────────────────────────────────────────────────────────
let vrmModel=null,vrmScene=null,vrmCamera=null,vrmRenderer=null,vrmClock=null;
let lipSyncVal=0,blinkTimer=0,headTargetX=0,headTargetY=0;
let isSpeaking=false;

function initVRM(){
  const canvas=document.getElementById('avatar-canvas');
  const container=document.getElementById('avatar-container');
  const W=container.clientWidth,H=container.clientHeight;

  // Renderer
  vrmRenderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  vrmRenderer.setSize(W,H);
  vrmRenderer.setPixelRatio(window.devicePixelRatio);
  vrmRenderer.outputEncoding=THREE.sRGBEncoding;

  // Scene
  vrmScene=new THREE.Scene();
  vrmClock=new THREE.Clock();

  // Camera
  vrmCamera=new THREE.PerspectiveCamera(30,W/H,0.1,20);
  vrmCamera.position.set(0,1.3,2.2);
  vrmCamera.lookAt(0,1.3,0);

  // Lighting
  const ambLight=new THREE.AmbientLight(0xffffff,0.6);
  vrmScene.add(ambLight);
  const dirLight=new THREE.DirectionalLight(0xa78bfa,1.2);
  dirLight.position.set(1,2,2);
  vrmScene.add(dirLight);
  const fillLight=new THREE.DirectionalLight(0xec4899,0.4);
  fillLight.position.set(-2,1,-1);
  vrmScene.add(fillLight);

  // VRM loaded via postMessage from React Native
  document.getElementById('avatar-loading').textContent='in attesa modello...';
}

function loadVRMFromB64(b64){
  if(!b64||b64.length<100){
    document.getElementById('avatar-loading').textContent='modello non trovato';
    return;
  }
  document.getElementById('avatar-loading').textContent='caricamento...';
  try{
    const bin=atob(b64);
    const buf=new ArrayBuffer(bin.length);
    const arr=new Uint8Array(buf);
    for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
    const loader=new THREE.GLTFLoader();
    loader.register(parser=>new THREE.VRM.VRMLoaderPlugin(parser));
    loader.parse(buf,'',
      gltf=>{
        const vrm=gltf.userData.vrm;
        if(!vrm){document.getElementById('avatar-loading').textContent='errore modello';return;}
        if(THREE.VRMUtils&&THREE.VRMUtils.removeUnnecessaryJoints) THREE.VRMUtils.removeUnnecessaryJoints(gltf.scene);
        vrmModel=vrm;
        vrmScene.add(vrm.scene);
        vrm.scene.rotation.y=Math.PI;
        document.getElementById('avatar-loading').style.display='none';
        animateVRM();
      },
      err=>{document.getElementById('avatar-loading').textContent='errore: '+err.message;}
    );
  }catch(e){document.getElementById('avatar-loading').textContent='errore decode';}

  // Touch to move head
  canvas.addEventListener('touchmove',e=>{
    const r=canvas.getBoundingClientRect();
    const x=((e.touches[0].clientX-r.left)/r.width-0.5)*0.8;
    const y=-((e.touches[0].clientY-r.top)/r.height-0.5)*0.5;
    headTargetX=x;headTargetY=y;
  },{passive:true});
}

function animateVRM(){
  requestAnimationFrame(animateVRM);
  if(!vrmModel) return;
  const dt=vrmClock.getDelta();
  
  // Lip sync
  if(isSpeaking){
    lipSyncVal=0.3+Math.sin(Date.now()*0.02)*0.3;
  }else{
    lipSyncVal*=0.85;
  }
  try{
    vrmModel.expressionManager?.setValue('aa',Math.max(0,lipSyncVal));
  }catch(e){}

  // Blink
  blinkTimer+=dt;
  if(blinkTimer>3+Math.random()*3){
    blinkTimer=0;
    doBlink();
  }

  // Head sway (idle breathing)
  const t=Date.now()*0.001;
  const neck=vrmModel.humanoid?.getNormalizedBoneNode('neck');
  if(neck){
    neck.rotation.x+=(headTargetY+Math.sin(t*0.5)*0.03-neck.rotation.x)*0.05;
    neck.rotation.y+=(headTargetX+Math.sin(t*0.3)*0.02-neck.rotation.y)*0.05;
  }
  const spine=vrmModel.humanoid?.getNormalizedBoneNode('spine');
  if(spine){
    spine.rotation.z=Math.sin(t*0.4)*0.015;
  }

  vrmModel.update(dt);
  vrmRenderer.render(vrmScene,vrmCamera);
}

function doBlink(){
  try{
    const em=vrmModel?.expressionManager;
    if(!em) return;
    em.setValue('blink',1);
    setTimeout(()=>em.setValue('blink',0),120);
  }catch(e){}
}

function setExpression(mood){
  if(!vrmModel?.expressionManager) return;
  const em=vrmModel.expressionManager;
  // Reset all
  ['happy','angry','sad','surprised','relaxed'].forEach(e=>{try{em.setValue(e,0)}catch(_){}});
  const moodBadge=document.getElementById('mood-badge');
  if(mood==='playful'){
    try{em.setValue('happy',0.8)}catch(e){}
    if(moodBadge){moodBadge.textContent='😊 di buon umore';}
  }else if(mood==='annoyed'){
    try{em.setValue('angry',0.6)}catch(e){}
    if(moodBadge){moodBadge.textContent='😒 irritata';}
  }else if(mood==='cold'){
    try{em.setValue('sad',0.4)}catch(e){}
    if(moodBadge){moodBadge.textContent='🥶 fredda';}
  }else{
    if(moodBadge){moodBadge.textContent='😶 neutrale';}
  }
}

function setLipSync(on){isSpeaking=on;}

// ─── Mood patch
function shiftMood(){echoMood=randomMood();setExpression(echoMood);}
</script>
</body>
</html>`;

export default function App() {
  const webViewRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loadMsg, setLoadMsg] = useState('caricamento...');
  const vrmB64Ref = useRef('');
  const persistedDataRef = useRef({});

  useEffect(() => {
    (async () => {
      try {
        setLoadMsg('caricamento dati...');
        const pairs = await AsyncStorage.multiGet(STORAGE_KEYS);
        const data = {};
        pairs.forEach(([k, v]) => { if (v !== null) data[k] = v; });
        persistedDataRef.current = data;

        setLoadMsg('caricamento avatar...');
        try {
          const asset = Asset.fromModule(require('./assets/echo_avatar.vrm'));
          await asset.downloadAsync();
          vrmB64Ref.current = await FileSystem.readAsStringAsync(asset.localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (vrmErr) {
          console.warn('VRM load error (non-fatal):', vrmErr);
          vrmB64Ref.current = '';
        }

        setReady(true);
      } catch (e) {
        console.warn('Init error:', e);
        setReady(true);
      }
    })();
  }, []);

  const onLoad = useCallback(async () => {
    await SplashScreen.hideAsync();
    setTimeout(() => {
      if (!webViewRef.current) return;
      try {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'restore',
          data: persistedDataRef.current,
        }));
      } catch(e) { console.warn('restore err:', e); }
      if (vrmB64Ref.current) {
        setTimeout(() => {
          try {
            webViewRef.current?.postMessage(JSON.stringify({
              type: 'vrm',
              data: vrmB64Ref.current,
            }));
          } catch(e) { console.warn('vrm err:', e); }
        }, 500);
      }
    }, 300);
  }, []);

  const onMessage = useCallback(async (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'store' && msg.key && msg.value !== undefined) {
        await AsyncStorage.setItem(msg.key, msg.value);
        persistedDataRef.current[msg.key] = msg.value;
      }
    } catch(e) { console.warn('onMessage err:', e); }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = () => {
      if (webViewRef.current) { webViewRef.current.goBack(); return true; }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadEmoji}>👤</Text>
        <Text style={styles.loadName}>ECHO</Text>
        <Text style={styles.loadMsg}>{loadMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={false}/>
      <WebView
        ref={webViewRef}
        source={{ html: ECHO_HTML }}
        style={styles.webview}
        onLoad={onLoad}
        onMessage={onMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        cacheEnabled={true}
        hardwareAccelerationAndroidEnabled={true}
        onPermissionRequest={(request) => request.grant(request.resources)}
        onError={(e) => console.warn('WebView err:', e.nativeEvent)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  webview: { flex: 1, backgroundColor: '#0a0a0f' },
  loading: {
    flex: 1, backgroundColor: '#0a0a0f',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadEmoji: { fontSize: 64 },
  loadName: { color: '#fff', fontSize: 28, fontWeight: '700', letterSpacing: 6, marginTop: 8 },
  loadMsg: { color: '#6b7280', fontSize: 13, letterSpacing: 2 },
});
