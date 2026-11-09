"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const panel=$("authPanel"),conversation=$("conversation"),workspace=$("workspace"),hero=document.querySelector(".hero"),form=$("authForm");
 let mode="login",busy=false;
 const setMessage=(message)=>{$("authMessage").textContent=message||"";};
 function showAuth(next){
  mode=next;panel.hidden=false;conversation.hidden=true;setMessage("");
  $("authTitle").textContent=mode==="login"?"Welcome back":"Create your JR PHEEF identity";
  $("loginTab").classList.toggle("selected",mode==="login");
  $("signupTab").classList.toggle("selected",mode==="signup");
  $("loginTab").setAttribute("aria-pressed",String(mode==="login"));
  $("signupTab").setAttribute("aria-pressed",String(mode==="signup"));
  for(const [id,visible] of [["nameLabel",mode==="signup"],["fullName",mode==="signup"],["phoneLabel",mode==="signup"],["phone",mode==="signup"],["birthLabel",mode==="signup"],["birthYear",mode==="signup"]]){
   $(id).hidden=!visible;
  }
  $("fullName").required=mode==="signup";
  $("phone").required=mode==="signup";
  $("birthYear").required=mode==="signup";
  $("password").autocomplete=mode==="login"?"current-password":"new-password";
  $("authSubmit").textContent=mode==="login"?"Log in":"Create account";
  $("email").focus({preventScroll:true});
  panel.scrollIntoView({behavior:"smooth",block:"center"});
 }
 function setSignedIn(user){
  $("memberGreeting").hidden=!user;
  $("logoutButton").hidden=!user;
  $("openLogin").hidden=!!user;
  $("openSignup").hidden=!!user;
  $("memberGreeting").textContent=user?(user.fullName||user.email||"JR PHEEF member"):"";
 }
 async function api(path,body){
  const response=await fetch(path,{method:body?"POST":"GET",credentials:"same-origin",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined});
  let data={};try{data=await response.json();}catch{}
  if(!response.ok)throw new Error(data.error||"JR PHEEF could not complete that request.");
  return data;
 }
 $("openLogin").addEventListener("click",()=>showAuth("login"));
 $("openSignup").addEventListener("click",()=>showAuth("signup"));
 $("loginTab").addEventListener("click",()=>showAuth("login"));
 $("signupTab").addEventListener("click",()=>showAuth("signup"));
 $("closeAuth").addEventListener("click",()=>{panel.hidden=true;});
 $("startWithJr").addEventListener("click",()=>{
  conversation.hidden=false;panel.hidden=true;
  conversation.scrollIntoView({behavior:"smooth",block:"center"});
  $("prompt").focus({preventScroll:true});
 });
 form.addEventListener("submit",async event=>{
  event.preventDefault();if(busy)return;
  if(!form.reportValidity())return;
  busy=true;$("authSubmit").disabled=true;$("authSubmit").textContent=mode==="login"?"Signing in…":"Creating account…";setMessage("");
  const payload={email:$("email").value.trim(),password:$("password").value};
  if(mode==="signup"){
   payload.fullName=$("fullName").value.trim();
   payload.phone=$("phone").value.trim();
   payload.birthYear=$("birthYear").value;
  }
  try{
   const result=await api(mode==="login"?"/api/auth/login":"/api/auth/signup",payload);
   $("password").value="";
   if(mode==="login"&&result.ok){
    const session=await api("/api/auth/session");
    setSignedIn(session.user||{email:payload.email});
    panel.hidden=true;
    $("promptReply").textContent="Welcome to JR PHEEF. Your account is signed in.";
   }else if(result.emailVerificationRequired){
    setMessage(result.message+" Then return here and log in.");
   }else{
    const session=await api("/api/auth/session");
    setSignedIn(session.user||{email:payload.email,fullName:payload.fullName});
    panel.hidden=true;
   }
  }catch(error){setMessage(error.message||"Something went wrong. Please try again.");}
  finally{busy=false;$("authSubmit").disabled=false;$("authSubmit").textContent=mode==="login"?"Log in":"Create account";}
 });
 $("logoutButton").addEventListener("click",async()=>{
  $("logoutButton").disabled=true;
  try{await api("/api/auth/logout",{});}catch{}
  setSignedIn(null);$("logoutButton").disabled=false;
  $("promptReply").textContent="You have been logged out of JR PHEEF.";
 });
 $("promptForm").addEventListener("submit",event=>{
  event.preventDefault();const value=$("prompt").value.trim();
  if(!value){$("prompt").focus();return;}
  $("promptReply").textContent="JR's live conversation intelligence is the next service being connected. This message has not been sent to an AI service yet.";
 });
 api("/api/auth/session").then(session=>{if(session.authenticated)setSignedIn(session.user);}).catch(()=>{});\n document.querySelectorAll(".workspace-tab").forEach(button=>button.addEventListener("click",()=>showWorkspace(button.dataset.view)));

 const fragment=new URLSearchParams(window.location.hash.startsWith("#")?window.location.hash.slice(1):"");
 const confirmationToken=fragment.get("access_token"),confirmationRefresh=fragment.get("refresh_token");
 if(confirmationToken){
  window.history.replaceState({},document.title,window.location.pathname+window.location.search);
  api("/api/auth/session/establish",{access_token:confirmationToken,refresh_token:confirmationRefresh}).then(result=>{
   setSignedIn(result.user||null);showWorkspace("home");$("promptReply").textContent="Your email is verified. Welcome to JR PHEEF.";
  }).catch(error=>{showAuth("login");setMessage(error.message||"Email confirmation failed. Please request a new link.");});
 }
})();