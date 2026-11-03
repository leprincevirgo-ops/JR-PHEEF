(function(){
"use strict";
const $=id=>document.getElementById(id);
const panel=$("jrNaturalInteraction"); if(!panel)return;
const status=$("jrNaturalStatus"), transcript=$("jrNaturalTranscript"), input=$("jrNaturalInput");
const mic=$("jrNaturalMic"), send=$("jrNaturalSend"), stop=$("jrNaturalStop"), speak=$("jrNaturalSpeak");
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let recognition=null, silenceTimer=null, busy=false, listening=false, speaking=false, pending="";
let history=[];
function setStatus(s){status.textContent=s;}
function addLine(who,text){const p=document.createElement("p");p.className="jr-line jr-"+who;p.textContent=(who==="user"?"You: ":"JR: ")+text;transcript.appendChild(p);transcript.scrollTop=transcript.scrollHeight;}
function clearTimer(){if(silenceTimer){clearTimeout(silenceTimer);silenceTimer=null;}}
function stopSpeech(){if(window.speechSynthesis){window.speechSynthesis.cancel();}speaking=false;}
function stopListening(){clearTimer();if(recognition){try{recognition.stop();}catch(e){}}listening=false;mic.textContent="🎙 START TALKING";}
function startListening(){
 if(!SpeechRecognition){setStatus("Voice recognition is not supported here. You can type to JR.");return;}
 stopSpeech(); if(recognition){try{recognition.abort();}catch(e){}}
 recognition=new SpeechRecognition(); recognition.lang=document.documentElement.lang||"en-KE"; recognition.continuous=true; recognition.interimResults=true;
 pending=""; listening=true; mic.textContent="Listening…";setStatus("Listening. Speak naturally; JR will wait about 3 seconds after you finish.");
 recognition.onresult=e=>{
  let interim="";
  for(let i=e.resultIndex;i<e.results.length;i++){const text=e.results[i][0].transcript||"";if(e.results[i].isFinal)pending+=text+" ";else interim+=text;}
  input.value=(pending+interim).trim();
  if(pending.trim()){clearTimer();silenceTimer=setTimeout(()=>{const text=pending.trim();pending="";if(text)sendMessage(text);},3000);}
 };
 recognition.onerror=e=>{if(e.error!=="no-speech"&&e.error!=="aborted")setStatus("Microphone issue: "+e.error+". You can type instead.");};
 recognition.onend=()=>{if(listening&&!busy){listening=false;mic.textContent="🎙 START TALKING";if(pending.trim()){const text=pending.trim();pending="";clearTimer();sendMessage(text);}else setStatus("Listening paused. Tap start talking to continue.");}};
 try{recognition.start();}catch(e){listening=false;setStatus("Could not start the microphone. Check browser permission.");}
}
async function sendMessage(value){
 const message=(value||"").trim();if(!message||busy)return;
 clearTimer();stopListening();stopSpeech();busy=true;send.disabled=true;input.value="";addLine("user",message);setStatus("JR is thinking…");
 try{
  const response=await fetch("/api/ai/chat",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({message,history,mode:"universe",answer_depth:"standard"})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.ok)throw new Error(data.error||"JR could not respond. Please try again.");
  const answer=String(data.answer||"").trim();if(!answer)throw new Error("JR returned an empty reply.");
  addLine("assistant",answer);history.push({role:"user",content:message},{role:"assistant",content:answer});history=history.slice(-12);
  setStatus("JR has replied. Continue whenever you're ready.");
  if(speak.checked&&window.speechSynthesis){const utterance=new SpeechSynthesisUtterance(answer);utterance.lang=document.documentElement.lang||"en-KE";utterance.onstart=()=>{speaking=true;setStatus("JR is speaking. Tap the microphone to interrupt.");};utterance.onend=()=>{speaking=false;setStatus("Ready for you.");};window.speechSynthesis.speak(utterance);}
 }catch(e){addLine("assistant",e.message);setStatus("Ready. You can try again.");}
 finally{busy=false;send.disabled=false;}
}
mic.addEventListener("click",()=>listening?stopListening():startListening());
send.addEventListener("click",()=>sendMessage(input.value));
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();sendMessage(input.value);}});
stop.addEventListener("click",()=>{stopListening();stopSpeech();setStatus("Stopped.");});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&listening)stopListening();});
})();
