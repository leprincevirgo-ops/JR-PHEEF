/* JP identity workspace. Cosmic signature calculation is local-only. */
(function(){
  "use strict";
  const $ = id => document.getElementById(id);
  function lifePath(iso){
    const digits=iso.replace(/-/g,"").split("").reduce((a,d)=>a+Number(d),0);
    let n=digits;
    while(n>9 && n!==11 && n!==22 && n!==33) n=String(n).split("").reduce((a,d)=>a+Number(d),0);
    return n;
  }
  function birthdayNumber(iso){return Number(iso.slice(8,10));}
  function zodiac(iso){
    const m=Number(iso.slice(5,7)),d=Number(iso.slice(8,10));
    if((m===3&&d>=21)||(m===4&&d<=19))return "Aries";
    if((m===4&&d>=20)||(m===5&&d<=20))return "Taurus";
    if((m===5&&d>=21)||(m===6&&d<=20))return "Gemini";
    if((m===6&&d>=21)||(m===7&&d<=22))return "Cancer";
    if((m===7&&d>=23)||(m===8&&d<=22))return "Leo";
    if((m===8&&d>=23)||(m===9&&d<=22))return "Virgo (calendar-based; boundary dates can vary by year, time and location)";
    if((m===9&&d>=23)||(m===10&&d<=22))return "Libra";
    if((m===10&&d>=23)||(m===11&&d<=21))return "Scorpio";
    if((m===11&&d>=22)||(m===12&&d<=21))return "Sagittarius";
    if((m===12&&d>=22)||(m===1&&d<=19))return "Capricorn";
    if((m===1&&d>=20)||(m===2&&d<=18))return "Aquarius";
    return "Pisces";
  }
  window.loadJpIdentity = function(){
    const out=$("jpIdentityNumber"),status=$("jpIdentityStatus");
    if(!out||!status)return;
    fetch("/api/me",{credentials:"same-origin"}).then(r=>r.json()).then(d=>{
      if(!d.logged_in||!d.member){out.textContent="Sign in to view your JP number";status.textContent="Your JP number is private to your account.";return;}
      out.textContent=d.member.jp_number||"Not assigned";
      status.textContent=d.member.jp_number?"Registered account identifier. Keep it; do not share authentication codes.":"The account has no JP number returned by the current service. Registry repair is required before one can be assigned safely.";
    }).catch(()=>{out.textContent="Could not load JP number";status.textContent="Please retry after signing in.";});
  };
  const calc=$("jpCalculateSignature"),date=$("jpBirthDate"),result=$("jpCosmicResult");
  if(calc&&date&&result)calc.addEventListener("click",()=>{
    const v=date.value;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(v)){result.textContent="Choose a valid birth date first.";return;}
    const parsed=new Date(v+"T00:00:00Z");
    if(Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==v||v>new Date().toISOString().slice(0,10)){result.textContent="Enter a valid date that is not in the future.";return;}
    const birthday=birthdayNumber(v),lp=lifePath(v),month=v.slice(5,7);
    const dateText=parsed.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});
    result.replaceChildren();
    const lines=[
      ["Birth date",dateText],
      ["Birthday number",String(birthday)],
      ["Life Path number",String(lp)],
      ["Birth month",month],
      ["Calendar-based zodiac",zodiac(v)],
      ["Symbolic signature","JP-"+String(birthday).padStart(2,"0")+"-"+String(lp)]
    ];
    lines.forEach(([k,val])=>{const p=document.createElement("p");const b=document.createElement("strong");b.textContent=k+": ";p.append(b,document.createTextNode(val));result.append(p);});
    const note=document.createElement("p");note.className="muted";note.textContent="Numerology and zodiac labels are symbolic traditions, not scientifically validated predictors of luck or destiny. This preview is calculated in your browser and is not saved or used for authentication.";result.append(note);
  });
  document.querySelectorAll("[data-jp-window]").forEach(btn=>btn.addEventListener("click",()=>{
    const page=btn.getAttribute("data-jp-window");
    if(typeof window.show==="function")window.show(page);
    if(page==="family"&&typeof window.loadFamily==="function")window.loadFamily();
  }));
})();