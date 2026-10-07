/* =========================================================
   CANONICAL PLAN CONTRACT
   Keep public pricing, billing UI and storage UI aligned.
========================================================= */
window.PROFESSIONAL_STUDIO_PLANS = Object.freeze({
    starter: Object.freeze({ id: "starter", name: "Starter", price: 499, storageMB: 500, themes: 0, seo: "None" }),
    professional: Object.freeze({ id: "professional", name: "Professional", price: 1499, storageMB: 2048, themes: 2, seo: "Basic" }),
    enterprise: Object.freeze({ id: "enterprise", name: "Enterprise", price: 2999, storageMB: 10240, themes: 5, seo: "Premium" })
});

/* Professional Studio - shared frontend quality layer. Backend-independent. */
(function(){
  "use strict";
  function toast(message,type){
    var el=document.querySelector(".ps-toast");
    if(!el){el=document.createElement("div");el.className="ps-toast";el.setAttribute("role","status");el.setAttribute("aria-live","polite");document.body.appendChild(el)}
    el.textContent=message;el.className="ps-toast show "+(type||"info");
    clearTimeout(window.__psToastTimer);window.__psToastTimer=setTimeout(function(){el.classList.remove("show")},3200);
  }
  window.PS={toast:toast};
  function setup(){
    document.documentElement.classList.add("ps-ready");
    var bar=document.createElement("div");bar.className="ps-page-progress";document.body.appendChild(bar);
    var top=document.createElement("button");top.className="ps-backtop";top.type="button";top.textContent="↑";top.setAttribute("aria-label","Back to top");document.body.appendChild(top);
    window.addEventListener("scroll",function(){bar.style.width=Math.min(100,(window.scrollY/(document.documentElement.scrollHeight-window.innerHeight||1))*100)+"%";top.classList.toggle("show",window.scrollY>500)},{passive:true});
    top.addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"})});
    document.querySelectorAll("img").forEach(function(img){if(!img.loading)img.loading="lazy";if(!img.decoding)img.decoding="async"});
    document.querySelectorAll('a[target="_blank"]').forEach(function(a){var r=(a.getAttribute("rel")||"").split(/\s+/).filter(Boolean);["noopener","noreferrer"].forEach(function(x){if(r.indexOf(x)<0)r.push(x)});a.setAttribute("rel",r.join(" "))});
    document.querySelectorAll("form").forEach(function(form){
      var dirty=false;
      form.addEventListener("input",function(){dirty=true});form.addEventListener("change",function(){dirty=true});
      form.addEventListener("submit",function(){dirty=false;var btn=form.querySelector('button[type="submit"],input[type="submit"]');if(btn&&!btn.dataset.psBusy){btn.dataset.psBusy="1";btn.disabled=true;var old=btn.innerHTML;btn.innerHTML='<span style="display:inline-flex;gap:8px;align-items:center">Saving…</span>';setTimeout(function(){if(document.body.contains(btn)){btn.disabled=false;btn.innerHTML=old;delete btn.dataset.psBusy}},6000)}});
      form.addEventListener("ps:saved",function(){dirty=false});
      window.addEventListener("beforeunload",function(e){if(dirty){e.preventDefault();e.returnValue=""}});
    });
    document.querySelectorAll("[data-copy]").forEach(function(btn){btn.addEventListener("click",function(){var text=btn.getAttribute("data-copy");navigator.clipboard&&navigator.clipboard.writeText(text).then(function(){toast("Copied to clipboard","success")}).catch(function(){toast("Could not copy","error")})})});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();
