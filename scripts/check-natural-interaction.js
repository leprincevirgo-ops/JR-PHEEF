"use strict";
const fs=require("node:fs"),vm=require("node:vm");
const js=fs.readFileSync("public/natural-interaction.js","utf8");
const html=fs.readFileSync("public/index.html","utf8");
new vm.Script(js,{filename:"public/natural-interaction.js"});
for(const token of ['setTimeout(()=>{const text=latestTranscript.trim()', '},3000)', 'credentials:"same-origin"', '"/api/ai/chat"', 'window.speechSynthesis.cancel()', 'new SpeechSynthesisUtterance(answer)', 'window.SpeechRecognition||window.webkitSpeechRecognition']) {
 if(!js.includes(token))throw new Error("Missing natural interaction behaviour: "+token);
}
for(const token of ['id="jrNaturalInteraction"', 'id="jrNaturalMic"', 'id="jrNaturalSend"', 'id="jrNaturalSpeak"', '/natural-interaction.js']) {
 if(!html.includes(token))throw new Error("Missing natural interaction UI integration: "+token);
}
console.log("PASS: JR natural interaction syntax, adaptive three-second silence timer, authenticated chat, speech output and interruption controls.");
