/* guard.js — DIGIY UNIVERSAL SUBSCRIPTION GUARD */
(function(){
  "use strict";

  // ✅ SUPABASE
  const SUPABASE_URL = "https://wesqmwjjtsefyjnluosj.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlc3Ftd2pqdHNlZnlqbmx1b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg4ODIsImV4cCI6MjA4MDc1NDg4Mn0.dZfYOc2iL2_wRYL3zExZFsFSBK6AbMeOid2LrIjcTdA";
  const supabase = window.__sb || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.__sb = supabase;

  // ✅ PAIEMENT (universel)
  const PAY_URL = "https://beauville.github.io/commencer-a-payer/";

  // ✅ base github pages auto: /digiy-pro-driver, /digiy-loc-pro, etc.
  const path = location.pathname || "/";
  const parts = path.split("/").filter(Boolean);
  const BASE = (parts.length >= 1) ? ("/" + parts[0]) : "";

  function getPhone(){
    const s = sessionStorage.getItem("digiy_driver_phone");
    if (s) return s;
    try{
      const a = JSON.parse(localStorage.getItem("digiy_driver_access_pin") || "null");
      return a?.phone || null;
    }catch(_){}
    return null;
  }

  async function isActive(phone, module){
    const { data, error } = await supabase.rpc("is_subscription_active", {
      p_phone: phone,
      p_module: module
    });
    if (error) throw error;
    return !!data;
  }

  // ✅ API simple à appeler dans tes pages
  window.DIGIY = {
    BASE,
    PAY_URL,
    getPhone,
    async guardOrPay(module, loginPath){
      const phone = getPhone();

      if(!phone){
        location.replace(BASE + (loginPath || "/authentification-chauffeur.html"));
        return false;
      }

      try{
        const ok = await isActive(phone, module);

        if(!ok){
          location.replace(
            PAY_URL
            + "?phone=" + encodeURIComponent(phone)
            + "&module=" + encodeURIComponent(module)
            + "&from=" + encodeURIComponent(location.href)
          );
          return false;
        }
        return true;
      }catch(e){
        console.warn("guardOrPay error:", e);
        // Si Supabase bug => on ne bloque pas à tort
        return true;
      }
    }
  };
})();
