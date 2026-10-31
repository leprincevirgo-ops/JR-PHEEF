"use strict";
const fs=require("node:fs"),vm=require("node:vm");
const js=fs.readFileSync("public/jr-everywhere.js","utf8"),css=fs.readFileSync("public/jr-everywhere.css","utf8");
new vm.Script(js,{filename:"public/jr-everywhere.js"});
for(const x of ["Talk to JR","/api/ai/chat","getUserMedia","MediaRecorder","BarcodeDetector","jrCameraCapture","localStorage"])if(!js.includes(x))throw new Error("Missing JR Everywhere capability: "+x);
for(const x of ["#jrEverywhereLauncher","jr-camera-stage","@media(max-width:620px)","safe-area-inset-bottom"])if(!css.includes(x))throw new Error("Missing JR Everywhere style: "+x);
console.log("PASS: persistent JR collaborator, camera capture/record/QR flows and responsive styles.");
