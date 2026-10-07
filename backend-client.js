/* Professional Studio backend bridge.
 * localStorage remains a compatibility/cache layer for the existing UI;
 * authenticated state is persisted server-side in Supabase through /api/sync-state.
 */
(function () {
  'use strict';
  const STATE_ENDPOINT = '/api/state';
  const SYNC_ENDPOINT = '/api/sync-state';
  const EXCLUDED = new Set([
    'professionalStudio.paymentAccount','professionalStudio.paymentUPI',
    'professionalStudio.subscription','professionalStudio.subscriptionPlan',
    'professionalStudio.subscriptionRenewal','professionalStudio.subscriptionStatus',
    'professionalStudio.billingHistory'
  ]);
  const PREFIXES = ['professionalStudio', 'professionalStudioGallery'];
  let syncing = false, timer = null;

  function allowedKey(key) {
    return typeof key === 'string' && PREFIXES.some(p => key.startsWith(p)) || key === 'bookings';
  }
  function collect() {
    const state = {};
    for (let i=0;i<localStorage.length;i++) {
      const key=localStorage.key(i);
      if (!allowedKey(key) || EXCLUDED.has(key) || /token|password/i.test(key)) continue;
      try { state[key]=JSON.parse(localStorage.getItem(key)); } catch (_) { state[key]=localStorage.getItem(key); }
    }
    return state;
  }
  async function load() {
    try {
      const r=await fetch(STATE_ENDPOINT,{credentials:'same-origin',cache:'no-store'});
      if(!r.ok) return false;
      const json=await r.json(); const state=json.state||{};
      Object.keys(state).forEach(k=>{if(!EXCLUDED.has(k)){try{localStorage.setItem(k,JSON.stringify(state[k]));}catch(_){}}});
      window.dispatchEvent(new CustomEvent('professionalstudio:state-loaded',{detail:state}));
      return true;
    } catch (_) { return false; }
  }
  async function sync() {
    if (syncing) return false; syncing=true;
    try { const r=await fetch(SYNC_ENDPOINT,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:collect()})}); return r.ok; }
    catch (_) { return false; } finally { syncing=false; }
  }
  const nativeSet=Storage.prototype.setItem, nativeRemove=Storage.prototype.removeItem, nativeClear=Storage.prototype.clear;
  Storage.prototype.setItem=function(k,v){const r=nativeSet.call(this,k,v);if(this===localStorage&&allowedKey(k)&&!EXCLUDED.has(k)){clearTimeout(timer);timer=setTimeout(sync,900);}return r;};
  Storage.prototype.removeItem=function(k){const r=nativeRemove.call(this,k);if(this===localStorage&&allowedKey(k)&&!EXCLUDED.has(k)){clearTimeout(timer);timer=setTimeout(sync,900);}return r;};
  Storage.prototype.clear=function(){const r=nativeClear.call(this);if(this===localStorage){clearTimeout(timer);timer=setTimeout(sync,900);}return r;};
  window.ProfessionalStudioBackend={load,sync,collect};
  document.addEventListener('DOMContentLoaded',()=>{load();setTimeout(sync,1800);setInterval(()=>{if(document.visibilityState==='visible')sync();},30000);});
})();
