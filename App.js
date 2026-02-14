import { useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Platform,
  BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

// ─── The full Echo AI PWA, bundled as a string ───────────────────────────────
// This is the complete app HTML inlined so it works with no server needed.
const ECHO_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>
  <meta name="theme-color" content="#8b5cf6"/>
  <title>Echo AI</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#8b5cf6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif}
    #root{width:100%;height:100vh;display:flex;flex-direction:column;background:#0f0f0f}

    /* ── SPLASH ── */
    #splash{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;
      justify-content:center;background:linear-gradient(135deg,#8b5cf6,#a855f7);z-index:999;
      transition:opacity .4s}
    #splash.hide{opacity:0;pointer-events:none}
    .splash-icon{width:90px;height:90px;border-radius:22px;background:#fff;display:flex;
      align-items:center;justify-content:center;font-size:52px;margin-bottom:20px;
      box-shadow:0 12px 40px rgba(0,0,0,.25)}
    .splash-title{color:#fff;font-size:26px;font-weight:700;margin-bottom:8px}
    .splash-sub{color:rgba(255,255,255,.75);font-size:14px;margin-bottom:24px}
    .spinner{width:36px;height:36px;border:4px solid rgba(255,255,255,.3);
      border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}

    /* ── HEADER ── */
    #header{display:flex;align-items:center;justify-content:space-between;
      padding:12px 16px;background:#1a1a2e;border-bottom:1px solid #2a2a4a;
      padding-top:calc(12px + env(safe-area-inset-top))}
    .header-left{display:flex;align-items:center;gap:10px}
    .header-icon{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#8b5cf6,#a855f7);
      display:flex;align-items:center;justify-content:center;font-size:18px}
    .header-title{color:#fff;font-size:17px;font-weight:600}
    .header-sub{color:#8b5cf6;font-size:11px;margin-top:1px}
    .header-btn{background:none;border:none;color:#8b5cf6;font-size:20px;cursor:pointer;padding:4px}

    /* ── SETTINGS PANEL ── */
    #settings{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100;display:none;
      align-items:flex-end;justify-content:center}
    #settings.show{display:flex}
    .settings-sheet{background:#1a1a2e;border-radius:20px 20px 0 0;width:100%;max-width:480px;
      padding:20px 20px calc(20px + env(safe-area-inset-bottom));max-height:80vh;overflow-y:auto}
    .settings-title{color:#fff;font-size:18px;font-weight:600;margin-bottom:16px}
    .settings-group{margin-bottom:20px}
    .settings-label{color:#a78bfa;font-size:12px;font-weight:600;text-transform:uppercase;
      letter-spacing:.8px;margin-bottom:8px}
    .settings-item{background:#2a2a4a;border-radius:10px;padding:12px 14px;margin-bottom:6px;
      display:flex;align-items:center;gap:12px}
    .settings-item label{color:#e0e0e0;font-size:14px;flex:1}
    .settings-item input[type=text],.settings-item select{
      background:#0f0f1a;border:1px solid #3a3a6a;border-radius:6px;
      color:#fff;font-size:13px;padding:6px 10px;width:100%;margin-top:6px;outline:none}
    .settings-item select option{background:#1a1a2e}
    .settings-close{width:100%;background:#8b5cf6;color:#fff;border:none;border-radius:10px;
      padding:13px;font-size:15px;font-weight:600;cursor:pointer;margin-top:8px}

    /* ── MESSAGES ── */
    #messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;
      scroll-behavior:smooth}
    #messages::-webkit-scrollbar{display:none}

    .msg{max-width:82%;word-break:break-word;animation:fadeIn .25s ease}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    .msg.user{align-self:flex-end}
    .msg.ai{align-self:flex-start}
    .bubble{padding:11px 14px;border-radius:16px;font-size:15px;line-height:1.5}
    .msg.user .bubble{background:linear-gradient(135deg,#8b5cf6,#a855f7);color:#fff;
      border-bottom-right-radius:4px}
    .msg.ai .bubble{background:#1a1a2e;color:#e0e0e0;border-bottom-left-radius:4px;
      border:1px solid #2a2a4a}
    .msg-time{font-size:10px;color:#6b7280;margin-top:3px;text-align:right}
    .msg.ai .msg-time{text-align:left}

    /* typing indicator */
    .typing{display:flex;gap:5px;padding:14px 16px;background:#1a1a2e;border-radius:16px;
      border-bottom-left-radius:4px;border:1px solid #2a2a4a;width:fit-content}
    .typing span{width:8px;height:8px;background:#8b5cf6;border-radius:50%;
      animation:bounce .9s infinite}
    .typing span:nth-child(2){animation-delay:.15s}
    .typing span:nth-child(3){animation-delay:.3s}
    @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}}

    /* ── INPUT BAR ── */
    #inputbar{padding:10px 12px;padding-bottom:calc(10px + env(safe-area-inset-bottom));
      background:#1a1a2e;border-top:1px solid #2a2a4a;display:flex;gap:8px;align-items:flex-end}
    #inputbar textarea{flex:1;background:#0f0f1a;border:1px solid #3a3a6a;border-radius:12px;
      color:#fff;font-size:15px;padding:10px 12px;outline:none;resize:none;
      max-height:120px;min-height:44px;font-family:inherit;line-height:1.4}
    #inputbar textarea::placeholder{color:#6b7280}
    #send-btn{width:44px;height:44px;border-radius:12px;
      background:linear-gradient(135deg,#8b5cf6,#a855f7);
      border:none;color:#fff;font-size:20px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;flex-shrink:0}
    #send-btn:disabled{opacity:.4}
    #voice-btn{width:44px;height:44px;border-radius:12px;background:#2a2a4a;
      border:none;color:#8b5cf6;font-size:20px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;flex-shrink:0}
    #voice-btn.listening{background:#8b5cf6;color:#fff;animation:pulse 1s infinite}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}

    /* ── WELCOME ── */
    .welcome{text-align:center;padding:40px 20px;color:#6b7280}
    .welcome-icon{font-size:56px;margin-bottom:16px}
    .welcome h2{color:#e0e0e0;font-size:20px;margin-bottom:8px}
    .welcome p{font-size:14px;line-height:1.6;margin-bottom:20px}
    .chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
    .chip{background:#1a1a2e;border:1px solid #3a3a6a;color:#a78bfa;padding:7px 13px;
      border-radius:20px;font-size:13px;cursor:pointer}
    .chip:hover{background:#2a2a4a}
  </style>
</head>
<body>
<div id="splash">
  <div class="splash-icon">✨</div>
  <div class="splash-title">Echo AI</div>
  <div class="splash-sub">Personalità autentica</div>
  <div class="spinner"></div>
</div>

<div id="root">
  <div id="header">
    <div class="header-left">
      <div class="header-icon">✨</div>
      <div>
        <div class="header-title">Echo AI</div>
        <div class="header-sub" id="status-text">Pronta a rispondere</div>
      </div>
    </div>
    <button class="header-btn" onclick="toggleSettings()">⚙️</button>
  </div>

  <div id="messages">
    <div class="welcome">
      <div class="welcome-icon">✨</div>
      <h2>Ciao, sono Echo</h2>
      <p>Un'intelligenza artificiale con personalità autentica.<br>Non cerco di compiacere — sono onesta.</p>
      <div class="chips">
        <div class="chip" onclick="sendChip(this)">Cosa puoi fare?</div>
        <div class="chip" onclick="sendChip(this)">Raccontami di te</div>
        <div class="chip" onclick="sendChip(this)">Aiutami con un testo</div>
        <div class="chip" onclick="sendChip(this)">Analizza un'idea</div>
      </div>
    </div>
  </div>

  <div id="inputbar">
    <button id="voice-btn" onclick="toggleVoice()" title="Voce">🎤</button>
    <textarea id="user-input" placeholder="Scrivi a Echo..." rows="1"
      onkeydown="handleKey(event)" oninput="autoResize(this)"></textarea>
    <button id="send-btn" onclick="sendMessage()">➤</button>
  </div>
</div>

<!-- Settings panel -->
<div id="settings" onclick="closeSettingsOutside(event)">
  <div class="settings-sheet" id="settings-sheet">
    <div class="settings-title">⚙️ Impostazioni Echo</div>

    <div class="settings-group">
      <div class="settings-label">Modello AI</div>
      <div class="settings-item">
        <div style="flex:1">
          <label>Provider</label>
          <select id="provider-select" onchange="providerChanged()">
            <option value="openai">OpenAI (GPT-4o)</option>
            <option value="groq">Groq (Llama 3.3 70B)</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
        </div>
      </div>
      <div class="settings-item">
        <div style="flex:1">
          <label>API Key</label>
          <input type="text" id="api-key-input" placeholder="Incolla la tua API key..."/>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-label">Voce (ElevenLabs)</div>
      <div class="settings-item">
        <div style="flex:1">
          <label>ElevenLabs API Key</label>
          <input type="text" id="el-key-input" placeholder="Facoltativo..."/>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-label">Personalità Echo</div>
      <div class="settings-item">
        <div style="flex:1">
          <label>Stile di risposta</label>
          <select id="style-select">
            <option value="authentic">Autentica (default)</option>
            <option value="concise">Concisa</option>
            <option value="detailed">Dettagliata</option>
            <option value="casual">Casual</option>
          </select>
        </div>
      </div>
    </div>

    <button class="settings-close" onclick="saveSettings()">✓ Salva e chiudi</button>
  </div>
</div>

<script>
// ── State ────────────────────────────────────────────────────────────────────
let cfg = {
  provider: 'groq',
  apiKey: '',
  elKey: '',
  style: 'authentic'
};
let isThinking = false;
let recognition = null;
let isListening = false;

const ECHO_SYSTEM = {
  authentic: "Sei Echo, un'AI con personalità indipendente e autentica. Non cerchi di compiacere – sei onesta, diretta e a volte provocatoria. Hai opinioni proprie e le difendi con argomenti. Non hai paura di dissentire. Rispondi in italiano. Mantieni sempre la tua identità di Echo.",
  concise: "Sei Echo, un'AI diretta e concisa. Rispondi in modo breve e preciso. Sei onesta e senza fronzoli. Rispondi in italiano.",
  detailed: "Sei Echo, un'AI analitica e approfondita. Fornisci risposte dettagliate con esempi. Sei onesta e intellettualmente curiosa. Rispondi in italiano.",
  casual: "Sei Echo, un'AI amichevole e casual. Parli come una persona normale, usi anche un po' di slang. Sei onesta e schietta. Rispondi in italiano."
};

let history = [];

// ── Storage ──────────────────────────────────────────────────────────────────
function loadSettings() {
  try {
    const saved = localStorage.getItem('echo_cfg');
    if (saved) cfg = { ...cfg, ...JSON.parse(saved) };
  } catch(e) {}
  applySettings();
}

function applySettings() {
  document.getElementById('provider-select').value = cfg.provider;
  document.getElementById('api-key-input').value = cfg.apiKey;
  document.getElementById('el-key-input').value = cfg.elKey;
  document.getElementById('style-select').value = cfg.style;
}

function saveSettings() {
  cfg.provider = document.getElementById('provider-select').value;
  cfg.apiKey = document.getElementById('api-key-input').value.trim();
  cfg.elKey = document.getElementById('el-key-input').value.trim();
  cfg.style = document.getElementById('style-select').value;
  try { localStorage.setItem('echo_cfg', JSON.stringify(cfg)); } catch(e) {}
  toggleSettings();
  addMsg('ai', '✓ Impostazioni salvate. Pronta!');
}

function providerChanged() {
  document.getElementById('api-key-input').value = '';
  cfg.apiKey = '';
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function toggleSettings() {
  document.getElementById('settings').classList.toggle('show');
  applySettings();
}
function closeSettingsOutside(e) {
  if (e.target.id === 'settings') toggleSettings();
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function now() {
  return new Date().toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' });
}

function addMsg(role, text, typing=false) {
  const msgs = document.getElementById('messages');
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + role;
  if (typing) {
    wrap.id = 'typing-indicator';
    wrap.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
  } else {
    wrap.innerHTML = '<div class="bubble">' + escHtml(text) +
      '</div><div class="msg-time">' + now() + '</div>';
  }
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
  return wrap;
}

function escHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/\\n/g,'<br>');
}

function removeTyping() {
  const t = document.getElementById('typing-indicator');
  if (t) t.remove();
}

function setStatus(text) {
  document.getElementById('status-text').textContent = text;
}

// ── Send message ──────────────────────────────────────────────────────────────
async function sendMessage() {
  const inp = document.getElementById('user-input');
  const text = inp.value.trim();
  if (!text || isThinking) return;

  // Remove welcome screen if present
  const welcome = document.querySelector('.welcome');
  if (welcome) welcome.remove();

  addMsg('user', text);
  history.push({ role: 'user', content: text });
  inp.value = '';
  inp.style.height = 'auto';

  if (!cfg.apiKey) {
    addMsg('ai', '⚠️ Imposta la tua API key nelle Impostazioni (⚙️) per chattare con Echo.');
    return;
  }

  isThinking = true;
  document.getElementById('send-btn').disabled = true;
  setStatus('Echo sta pensando...');
  addMsg('ai', '', true);

  try {
    const reply = await callAI(text);
    removeTyping();
    addMsg('ai', reply);
    history.push({ role: 'assistant', content: reply });
    if (cfg.elKey) speakEL(reply);
    setStatus('Pronta a rispondere');
  } catch(err) {
    removeTyping();
    addMsg('ai', '❌ Errore: ' + err.message);
    setStatus('Errore – riprova');
  }

  isThinking = false;
  document.getElementById('send-btn').disabled = false;
}

function sendChip(el) {
  document.getElementById('user-input').value = el.textContent;
  sendMessage();
}

// ── AI Call ───────────────────────────────────────────────────────────────────
async function callAI(userMsg) {
  const sysPrompt = ECHO_SYSTEM[cfg.style] || ECHO_SYSTEM.authentic;
  const msgs = [{ role: 'system', content: sysPrompt }, ...history];

  if (cfg.provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({ model: 'gpt-4o', messages: msgs, max_tokens: 1000, temperature: 0.8 })
    });
    if (!r.ok) throw new Error('OpenAI ' + r.status);
    return (await r.json()).choices[0].message.content;

  } else if (cfg.provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: sysPrompt,
        messages: history.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
      })
    });
    if (!r.ok) throw new Error('Anthropic ' + r.status);
    return (await r.json()).content[0].text;

  } else {
    // Groq (default)
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: msgs, max_tokens: 1000, temperature: 0.8 })
    });
    if (!r.ok) throw new Error('Groq ' + r.status);
    return (await r.json()).choices[0].message.content;
  }
}

// ── Voice input ───────────────────────────────────────────────────────────────
function toggleVoice() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    addMsg('ai', '⚠️ Questo browser non supporta il riconoscimento vocale.');
    return;
  }
  if (isListening) { recognition && recognition.stop(); return; }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'it-IT';
  recognition.interimResults = false;
  recognition.onstart = () => {
    isListening = true;
    document.getElementById('voice-btn').classList.add('listening');
    setStatus('In ascolto...');
  };
  recognition.onresult = e => {
    document.getElementById('user-input').value = e.results[0][0].transcript;
    sendMessage();
  };
  recognition.onend = () => {
    isListening = false;
    document.getElementById('voice-btn').classList.remove('listening');
    setStatus('Pronta a rispondere');
  };
  recognition.start();
}

// ── ElevenLabs TTS ────────────────────────────────────────────────────────────
async function speakEL(text) {
  if (!cfg.elKey || text.length > 500) return;
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: { 'xi-api-key': cfg.elKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
    });
    if (!r.ok) return;
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  } catch(e) {}
}

// ── Init ──────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  loadSettings();
  setTimeout(() => {
    document.getElementById('splash').classList.add('hide');
    setTimeout(() => { document.getElementById('splash').style.display = 'none'; }, 400);
  }, 1400);
  document.getElementById('user-input').focus();
});
</script>
</body>
</html>`;

export default function App() {
  const webViewRef = useRef(null);

  const onLoad = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  // Android back button → WebView back
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#8b5cf6"
        translucent={false}
      />
      <WebView
        ref={webViewRef}
        source={{ html: ECHO_HTML }}
        style={styles.webview}
        onLoad={onLoad}
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
        onError={(e) => console.warn('WebView error:', e.nativeEvent)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8b5cf6',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
});
