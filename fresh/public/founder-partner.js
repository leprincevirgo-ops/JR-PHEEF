(function(){
"use strict";
const $=id=>document.getElementById(id);
const panel=$("founderCommand"),mount=$("founderPartnerMount");
if(!panel||!mount)return;
let mounted=false,conversationId=null,history=[],recognition=null,busy=false,lastAnswer="";
const api=async(url,method="GET",body)=>{
 const response=await fetch(url,{method,credentials:"same-origin",cache:"no-store",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||data.ok===false)throw new Error(data.error||"JR is temporarily unavailable.");
 return data;
};
const workspace=async(action,extra={})=>{
 const result=await api("/api/workspace","POST",Object.assign({action},extra));
 return result.data;
};
const make=(tag,cls,text)=>{
 const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;
};
let ui={};
function status(message){if(ui.status)ui.status.textContent=message;}
function stopVoice(message){
 const current=recognition;recognition=null;
 if(current){current.onend=null;try{current.abort();}catch{try{current.stop();}catch{}}}
 if(ui.mic){ui.mic.disabled=false;ui.mic.textContent="🎙 Speak";}
 if(window.speechSynthesis)window.speechSynthesis.cancel();
 if(ui.mic){ui.mic.disabled=false;ui.mic.textContent="🎙 Speak";}
 status(message||"Voice stopped. You can continue by typing.");
}
function addMessage(role,content){
 const item=make("article","founder-partner-message "+(role==="user"?"is-founder":"is-jr"));
 item.append(make("strong","founder-partner-speaker",role==="user"?"FOUNDER":"JR"));
 item.append(make("p","founder-partner-copy",content));
 ui.transcript.append(item);ui.transcript.scrollTop=ui.transcript.scrollHeight;
}
function renderHistory(messages){
 ui.transcript.replaceChildren();
 (messages||[]).slice(-80).forEach(item=>addMessage(item.role,item.content));
}
function listen(){
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognition){status("Voice input is not supported in this browser. You can type instead.");return;}
 stopVoice("Preparing microphone…");
 const r=new Recognition();recognition=r;r.lang=navigator.language||"en-KE";r.continuous=false;r.interimResults=true;r.maxAlternatives=1;
 const segments=[];
 ui.mic.disabled=true;ui.mic.textContent="Listening…";status("Listening. Tap Stop voice whenever you want.");
 r.onresult=event=>{
  for(let i=event.resultIndex;i<event.results.length;i++)segments[i]=event.results[i][0].transcript;
  ui.input.value=segments.join(" ").trim();
 };
 r.onerror=event=>{if(recognition===r){recognition=null;ui.mic.disabled=false;ui.mic.textContent="🎙 Speak";status(event.error==="not-allowed"?"Microphone permission was not granted. You can type instead.":"Voice input stopped. You can continue by typing.");}};
 r.onend=()=>{if(recognition===r){recognition=null;ui.mic.disabled=false;ui.mic.textContent="🎙 Speak";status("Speech captured. Review your words, then send.");}};
 try{r.start();}catch{recognition=null;ui.mic.disabled=false;ui.mic.textContent="🎙 Speak";status("The microphone could not start. Check browser permission or type instead.");}
}
function speakLatest(){
 if(!lastAnswer)return status("JR has not replied yet.");
 if(!window.speechSynthesis||typeof SpeechSynthesisUtterance==="undefined")return status("Speech playback is not supported in this browser.");
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(lastAnswer);utterance.lang=navigator.language||"en-KE";
 utterance.onstart=()=>status("JR is speaking. Tap Stop voice to interrupt.");
 utterance.onend=()=>status("Finished speaking. Continue whenever you are ready.");
 utterance.onerror=()=>status("Speech playback stopped.");
 window.speechSynthesis.speak(utterance);
}
async function send(){
 const message=ui.input.value.trim();if(!message||busy||!conversationId)return;
 stopVoice("Microphone is off. JR is preparing your reply.");
 busy=true;ui.send.disabled=true;ui.input.value="";
 const previous=history.slice(-10);
 addMessage("user",message);
 try{
  await workspace("save_ai_message",{conversationId,role:"user",content:message});
  history.push({role:"user",content:message});
  const result=await api("/api/founder/partner-chat","POST",{message,history:previous,use_web:!!ui.web.checked});
  lastAnswer=String(result.answer||"").trim();
  if(!lastAnswer)throw new Error("JR returned an empty reply.");
  await workspace("save_ai_message",{conversationId,role:"assistant",content:lastAnswer});
  history.push({role:"assistant",content:lastAnswer});history=history.slice(-20);
  addMessage("assistant",lastAnswer);status("Reply saved to your private Founder–JR conversation.");
  if(ui.autoSpeak.checked)speakLatest();
 }catch(error){addMessage("assistant",error.message||"JR could not respond just now.");status("Your conversation remains saved. You can retry.");}
 finally{busy=false;ui.send.disabled=false;ui.input.focus();}
}
function buildUI(){
 const section=make("section","founder-partner-card");section.id="founderJrPartnership";
 const head=make("div","founder-partner-head");
 const copy=make("div","");
 copy.append(make("span","eyebrow","PRIVATE FOUNDER WORKSPACE"));
 copy.append(make("h3","","Founder–JR Intelligence Partnership"));
 copy.append(make("p","view-copy","One continuous conversation for describing, learning, planning and building the ecosystem. Your approved decisions and project context guide the work."));
 const privateTag=make("span","founder-partner-private","🔒 PRIVATE");
 head.append(copy,privateTag);
 const guide=make("p","founder-partner-guide","Balanced communication · Text and voice · Beginner-friendly explanations · Clear proposed / approved / implemented / tested status");
 const transcript=make("div","founder-partner-transcript");transcript.id="founderPartnerTranscript";transcript.setAttribute("role","log");transcript.setAttribute("aria-live","polite");
 const compose=make("div","founder-partner-compose");
 const input=make("textarea","");input.id="founderPartnerInput";input.rows=3;input.maxLength=5000;input.placeholder="Talk naturally to JR about the ecosystem, an idea, a question or something to build…";input.setAttribute("aria-label","Message JR as founder");
 const controls=make("div","founder-partner-controls");
 const sendButton=make("button","hub-submit","Send");sendButton.type="button";
 const mic=make("button","hub-small-button","🎙 Speak");mic.type="button";
 const speak=make("button","hub-small-button","Speak latest reply");speak.type="button";
 const stop=make("button","hub-small-button","Stop voice");stop.type="button";
 controls.append(sendButton,mic,speak,stop);compose.append(input,controls);
 const options=make("div","founder-partner-options");
 const webLabel=make("label","");const web=document.createElement("input");web.type="checkbox";webLabel.append(web,document.createTextNode(" Allow web research for this message"));
 const autoLabel=make("label","");const auto=document.createElement("input");auto.type="checkbox";autoLabel.append(auto,document.createTextNode(" Read JR replies aloud"));
 options.append(webLabel,autoLabel);
 const note=make("p","founder-partner-note","Your conversation is saved in your private JR account. JR uses approved project context, explains unfamiliar abbreviations in full first, and asks before consequential actions.");
 const state=make("p","founder-partner-status","Checking founder access…");state.id="founderPartnerStatus";state.setAttribute("role","status");state.setAttribute("aria-live","polite");
 section.append(head,guide,transcript,compose,options,note,state);mount.replaceChildren(section);
 ui={section,transcript,input,send:sendButton,mic,speak,stop,web,autoSpeak:auto,status:state};
 sendButton.addEventListener("click",send);input.addEventListener("keydown",event=>{if(event.key==="Enter"&&(event.ctrlKey||event.metaKey)){event.preventDefault();send();}});
 mic.addEventListener("click",()=>recognition?stopVoice("Listening stopped."):listen());
 speak.addEventListener("click",speakLatest);stop.addEventListener("click",()=>stopVoice("Voice input and playback stopped."));
}
async function load(){
 if(mounted||panel.hidden)return;
 status("Verifying private founder access…");
 try{
  const owner=await api("/api/founder/overview");
  if(!owner.founder||owner.founder.role!=="founder"||owner.founder.jpNumber!=="JP-01")return;
  mounted=true;buildUI();status("Founder access verified. Loading your saved conversation…");
  const conversations=await workspace("list_ai_conversations");
  let conversation=(Array.isArray(conversations)?conversations:[]).find(item=>item.title==="Founder–JR Partnership");
  if(!conversation)conversation=await workspace("create_ai_conversation",{title:"Founder–JR Partnership"});
  conversationId=conversation.id;
  const messages=await workspace("list_ai_messages",{conversationId});
  history=(Array.isArray(messages)?messages:[]).filter(item=>["user","assistant"].includes(item.role)&&item.content).map(item=>({role:item.role,content:item.content}));
  renderHistory(history);
  if(history.length){lastAnswer=[...history].reverse().find(item=>item.role==="assistant")?.content||"";}
  else addMessage("assistant","I’m ready. Describe what you want to understand or build. We will keep one shared project conversation and clearly separate ideas from approved and tested work.");
  status("Private Founder–JR conversation ready. Type or use Speak.");
 }catch(error){mounted=false;mount.replaceChildren();const message=make("p","founder-partner-status",error.message||"Founder workspace is unavailable.");mount.append(message);}
}
const observer=new MutationObserver(()=>{if(!panel.hidden)load();else stopVoice("Founder workspace closed. Voice stopped.");});
observer.observe(panel,{attributes:true,attributeFilter:["hidden"]});
if(!panel.hidden)load();
window.addEventListener("pagehide",()=>stopVoice("Page closed. Voice stopped."));
document.addEventListener("visibilitychange",()=>{if(document.hidden&&recognition)stopVoice("Page hidden. Voice stopped.");});
})();