(function(){
"use strict";
const $=id=>document.getElementById(id);
const escape=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function supported(){
 const n=navigator;
 return [
  ["Bluetooth",!!(n.bluetooth&&n.bluetooth.requestDevice),"Pair supported nearby Bluetooth devices after your confirmation."],
  ["USB",!!(n.usb&&n.usb.requestDevice),"Connect compatible USB devices after your confirmation."],
  ["Serial",!!(n.serial&&n.serial.requestPort),"Connect supported serial hardware after your confirmation."],
  ["Camera",!!((navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)),"Use camera features after a permission request."],
  ["Microphone",!!((navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)),"Use voice input and audio features after a permission request."],
  ["Notifications",!!("Notification" in window),"Receive JR PHEEF notifications when enabled."],
  ["Share",!!(navigator.share),"Share supported JR PHEEF content through your device."],
  ["Installable web app",!!(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches),"JR PHEEF is currently running as a browser page."]
 ];
}
function render(){
 const p=$("devices");if(!p)return;
 const rows=supported();
 p.innerHTML='<section class="jr-device-hero"><div class="jp-kicker">JR PHEEF · DEVICE BRIDGE</div><h1>Connect your world.</h1><p>Bring compatible devices and services into your JR PHEEF experience. You choose what to connect, what permissions to grant and when to revoke them.</p><div class="jr-device-actions"><a class="jr-device-link" href="/jr-pheef-capabilities.json" target="_blank" rel="noopener">View machine-readable capability manifest ↗</a><a class="jr-device-link" href="https://github.com/leprincevirgo-ops/JR-PHEEF/tree/main/docs" target="_blank" rel="noopener">Developer integration guide ↗</a></div></section>'+
 '<section class="jr-device-panel"><div class="jp-section-head"><div><div class="jp-kicker">THIS DEVICE</div><h2>Available browser capabilities</h2><p>Support varies by browser, operating system, device and secure-context requirements.</p></div><button class="dark" id="jrDeviceRefresh" type="button">Refresh</button></div><div class="jr-device-grid">'+rows.map(([name,ok,desc])=>'<article class="jr-device-card"><div class="jr-device-state '+(ok?'available':'unavailable')+'">'+(ok?'AVAILABLE':'NOT AVAILABLE HERE')+'</div><h3>'+escape(name)+'</h3><p>'+escape(desc)+'</p></article>').join("")+'</div></section>'+
 '<section class="jr-device-panel"><div class="jp-kicker">OPTIONAL DEVICE PERMISSIONS</div><h2>Connect a compatible device</h2><p class="jr-device-note">These controls ask the browser for permission only after you tap them. JR PHEEF does not scan nearby devices in the background.</p><div class="jr-device-actions"><button class="primary" id="jrPairBluetooth" type="button">Pair Bluetooth device</button><button class="dark" id="jrConnectUsb" type="button">Connect USB device</button><button class="dark" id="jrConnectSerial" type="button">Connect serial device</button><button class="dark" id="jrEnableNotifications" type="button">Enable notifications</button></div><p id="jrDeviceStatus" class="jr-device-note" role="status" aria-live="polite"></p></section>'+
 '<section class="jr-device-panel"><div class="jp-kicker">TWO-WAY INTEROPERABILITY</div><h2>Technology ↔ JR PHEEF</h2><div class="jr-device-grid"><article class="jr-device-card"><h3>Devices & services → JR</h3><p>Authorised devices, apps and organisations will be able to send structured requests, events and data into JR PHEEF through scoped integrations.</p><span class="jr-device-state planned">API GATEWAY · IN DEVELOPMENT</span></article><article class="jr-device-card"><h3>JR PHEEF → devices & services</h3><p>JR will be able to request permitted device actions, coordinate compatible services and return results, with explicit consent and approval for sensitive actions.</p><span class="jr-device-state planned">DEVICE ACTIONS · NOT CONNECTED</span></article><article class="jr-device-card"><h3>Developers & manufacturers</h3><p>Future partner onboarding will include developer identity, OAuth authorisation, scoped API access, signed webhooks, sandbox testing and revocation.</p><span class="jr-device-state planned">DEVELOPER PLATFORM · NOT OPEN</span></article></div></section>'+
 '<section class="jr-device-panel"><div class="jp-kicker">SECURITY PROMISE</div><ul class="jr-device-list"><li>No background device discovery or microphone/camera activation.</li><li>Each integration must request only the permissions it needs.</li><li>Users can review, disconnect and revoke connected services.</li><li>Payments, purchases, messages, locks, vehicles and other consequential actions require explicit authorisation.</li><li>Device and provider data must remain isolated by account and purpose, with audit records.</li></ul></section>';
 if($("jrDeviceRefresh"))$("jrDeviceRefresh").addEventListener("click",render);
 const status=$("jrDeviceStatus");
 async function request(label,fn){try{if(!fn){status.textContent=label+" is not supported by this browser or device.";return;}const result=await fn();status.textContent=label+" permission flow completed. This browser has not created a JR PHEEF cloud integration; the selected device may appear in browser permissions.";if(result&&result.name)status.textContent+=" Selected: "+result.name;}catch(e){status.textContent=label+" was not connected: "+(e.message||"permission was not granted.");}}
 $("jrPairBluetooth")&&$("jrPairBluetooth").addEventListener("click",()=>request("Bluetooth",(navigator.bluetooth&&navigator.bluetooth.requestDevice)?()=>navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:[]}):null));
 $("jrConnectUsb")&&$("jrConnectUsb").addEventListener("click",()=>request("USB",(navigator.usb&&navigator.usb.requestDevice)?()=>navigator.usb.requestDevice({filters:[]}):null));
 $("jrConnectSerial")&&$("jrConnectSerial").addEventListener("click",()=>request("Serial",(navigator.serial&&navigator.serial.requestPort)?()=>navigator.serial.requestPort():null));
 $("jrEnableNotifications")&&$("jrEnableNotifications").addEventListener("click",()=>request("Notifications",("Notification" in window)?()=>Notification.requestPermission():null));
}
document.addEventListener("jr:workspacechange",e=>{if((e.detail&&e.detail.id)==="devices")render();});
document.addEventListener("DOMContentLoaded",()=>{if(!$("devices"))return;});
})();