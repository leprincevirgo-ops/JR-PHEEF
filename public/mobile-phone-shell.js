/* JR PHEEF mobile phone shell — three-zone layout. */
(function(){
  "use strict";
  const mobile=()=>window.matchMedia("(max-width: 900px)").matches;
  const make=(tag,cls,label)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(label)n.textContent=label;return n;};
  function route(id){if(typeof window.jrWorkspaceNavigate==="function")window.jrWorkspaceNavigate(id);else if(typeof window.show==="function")window.show(id);}
  function mount(){
    const app=document.getElementById("app"),header=document.querySelector(".jp-global-header"),actions=document.querySelector(".jp-header-actions");
    if(!app||!header||!actions||document.getElementById("jpMobileDock"))return;
    const dock=make("nav","jp-mobile-dock");dock.id="jpMobileDock";dock.setAttribute("aria-label","JR PHEEF mobile navigation");
    const entries=[
      ["home","⌂","Home",()=>route("home")],
      ["worlds","✧","Worlds",()=>route("morehub")],
      ["jr","✦","JR",()=>route("assistant")],
      ["command","▦","Command Centre",()=>route("command")]
    ];
    entries.forEach(([key,icon,label,run])=>{
      const b=make("button","jp-mobile-dock-item");
      b.type="button";b.dataset.mobileDestination=key;b.setAttribute("aria-label",label);
      const glyph=make("span","jp-mobile-dock-icon",icon);glyph.setAttribute("aria-hidden","true");
      const text=make("span","jp-mobile-dock-label",label);b.append(glyph,text);b.addEventListener("click",run);dock.append(b);
    });
    app.append(dock);
    const setActive=id=>{
      const map={home:"home",explore:"worlds",worlds:"worlds",morehub:"worlds",discoverhub:"worlds",teacher:"worlds",find:"worlds",workhub:"worlds",create:"worlds",economy:"worlds",projects:"worlds",family:"worlds",dgbo:"worlds",ecosystem:"worlds",assistant:"jr",messages:"command",social:"command",connecthub:"command",jpconnect:"command",opportunities:"command",referrals:"command",jrsettings:"command",profile:"command",personalhub:"command",devices:"command",vault:"command",jpidentity:"command",membership:"command",points:"command",alerts:"command",voice:"command",command:"command"};
      const active=map[id]||"home";
      dock.querySelectorAll("[data-mobile-destination]").forEach(b=>{
        const on=b.dataset.mobileDestination===active;
        b.classList.toggle("is-active",on);
        if(on)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
      });
    };
    document.addEventListener("jr:workspacechange",e=>setActive(e.detail?.id||"home"));
    document.addEventListener("click",e=>{
      const launcher=document.getElementById("jr-accessibility-launcher");
      if(e.target.closest('[data-mobile-destination="accessibility"]')&&launcher){
        const access=dock.querySelector('[data-mobile-destination="accessibility"]');
        access?.classList.toggle("is-active",launcher.getAttribute("aria-expanded")==="true");
      }
    });
    setActive("home");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
  window.addEventListener("resize",()=>{const dock=document.getElementById("jpMobileDock");if(dock)dock.dataset.mobile=String(mobile());});
})();
