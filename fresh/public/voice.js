"use strict";
(()=>{
 if(document.getElementById("jrGlobalVoice"))return;
 const dock=document.createElement("section");dock.id="jrGlobalVoice";dock.className="jr-global-voice";dock.setAttribute("aria-label","JR PHEEF voice controls");
 dock.innerHTML='<button type="button" id="jrGlobalSpeak" aria-label="Read JR response aloud">🔊 Speak</button><button type="button" id="jrGlobalMic" aria-label="Speak to the active JR PHEEF field">🎙 Mic</button><select id="jrGlobalVoiceLanguage" aria-label="Speech recognition language"><option value="">Device language</option><option value="en-KE">English (Kenya)</option><option value="sw-KE">Kiswahili</option><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="fr-FR">French</option><option value="ar-SA">Arabic</option><option value="so-SO">Somali</option></select><button type="button" id="jrGlobalStop" class="jr-voice-stop" aria-label="Stop voice input and output">■ Stop</button><span id="jrGlobalVoiceStatus" class="jr-global-voice-status" role="status" aria-live="polite">Voice ready</span>';
 document.body.append(dock);
 const $=id=>document.getElementById(id),status=$("jrGlobalVoiceStatus"),synth=window.speechSynthesis;let recognition=null,stopping=false;
 const setStatus=s=>{status.textContent=s;const f=$("jrVoiceFeedback");if(f)f.textContent=s;};
 const stop=()=>{stopping=true;synth?.cancel();const r=recognition;recognition=null;if(r){try{r.abort();}catch{try{r.stop();}catch{}}}setStatus("Voice stopped.");};
 const speak=()=>{if(!synth||typeof SpeechSynthesisUtterance==="undefined"){setStatus("Speaker is not supported in this browser.");return;}
  const visible=id=>{const el=$(id);return el&&!el.closest("[hidden]")&&el.textContent.trim()?el:null;};
  const target=visible("workspacePromptReply")||visible("promptReply");
  const fallback=[...document.querySelectorAll('.jr-message,.assistant-message,[data-role="assistant"]')].filter(el=>!el.closest("[hidden]")).map(el=>el.innerText?.trim()).filter(Boolean).pop();
  const u=new SpeechSynthesisUtterance((target?.innerText||fallback||"JR PHEEF. Your connected world starts here.").trim()),select=$("jrSpeakerVoice"),rate=$("jrSpeakerRate"),voices=synth.getVoices();
  if(select?.value)u.voice=voices[Number(select.value)]||null;u.rate=Number(rate?.value||1);u.onstart=()=>setStatus("JR is speaking…");u.onend=()=>setStatus("Finished speaking.");u.onerror=()=>setStatus("Speaker playback was interrupted.");synth.cancel();synth.speak(u);
 };
 const listen=()=>{const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Recognition){setStatus("Microphone speech recognition is not supported here. You can type instead.");return;}
  stop();stopping=false;const r=new Recognition();recognition=r;r.lang=$("jrGlobalVoiceLanguage")?.value||navigator.language||document.documentElement.lang||"en";r.interimResults=true;r.maxAlternatives=1;r.continuous=false;r.onstart=()=>setStatus("Listening in "+r.lang+"… tap Stop to finish.");
  r.onresult=e=>{let words="";for(let i=e.resultIndex;i<e.results.length;i++)words+=e.results[i][0].transcript;const active=document.activeElement;
   const target=active?.matches?.("input:not([type=button]):not([type=submit]),textarea")?active:$("workspacePrompt")&&!$("view-jr")?.hidden?$("workspacePrompt"):$("prompt")&&!$("conversation")?.hidden?$("prompt"):document.querySelector('textarea:not([disabled]),input:not([disabled]):not([type=hidden]):not([type=button]):not([type=submit])');
   if(target){target.value=words;target.dispatchEvent(new Event("input",{bubbles:true}));target.focus();setStatus("Words captured. Review before sending.");}else setStatus("Speech captured, but no text field is open.");
  };
  r.onerror=e=>{if(recognition===r){recognition=null;setStatus("Microphone: "+(e.error||"unavailable"));}};
  r.onend=()=>{if(recognition===r){recognition=null;if(!stopping&&status.textContent.startsWith("Listening"))setStatus("Listening stopped.");}};
  try{r.start();}catch{recognition=null;setStatus("Could not start microphone. Check browser permission.");}
 };
 $("jrGlobalSpeak").addEventListener("click",speak);$("jrGlobalMic").addEventListener("click",listen);$("jrGlobalStop").addEventListener("click",stop);
 const voiceSelect=$("jrSpeakerVoice"),rate=$("jrSpeakerRate"),fill=()=>{if(!voiceSelect||!synth)return;const old=voiceSelect.value;voiceSelect.replaceChildren(new Option("System default",""));synth.getVoices().forEach((v,i)=>voiceSelect.add(new Option(v.name+" · "+v.lang,String(i))));if(old)voiceSelect.value=old;};
 if(synth){fill();synth.addEventListener?.("voiceschanged",fill);}
 $("jrSpeakTest")?.addEventListener("click",()=>{if(!synth)return setStatus("Speaker not supported.");const u=new SpeechSynthesisUtterance("Hello. This is the JR PHEEF speaker test.");if(voiceSelect?.value)u.voice=synth.getVoices()[Number(voiceSelect.value)]||null;u.rate=Number(rate?.value||1);synth.cancel();synth.speak(u);setStatus("Testing speaker…");u.onend=()=>setStatus("Speaker test complete.");});
 $("jrStopSpeech")?.addEventListener("click",stop);$("jrVoiceInput")?.addEventListener("click",listen);window.addEventListener("pagehide",stop);
})();