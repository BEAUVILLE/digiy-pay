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
  
  // ✅ base github pages auto
  const path = location.pathname || "/";
  const parts = path.split("/").filter(Boolean);
  const BASE = (parts.length >= 1) ? ("/" + parts[0]) : "";
  
  // ============================================
  // RÉCUPÉRER LE PHONE (AUTH FIRST, PUIS FALLBACK)
  // ============================================
  async function getPhone(){
    // 1️⃣ Priorité : Session Supabase Auth
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.phone) {
        return session.user.phone;
      }
      if (session?.user?.user_metadata?.phone) {
        return session.user.user_metadata.phone;
      }
    } catch(e) {
      console.warn("getSession error:", e);
    }
    
    // 2️⃣ Fallback : sessionStorage (pour DRIVER)
    const s = sessionStorage.getItem("digiy_driver_phone");
    if (s) return s;
    
    // 3️⃣ Fallback : localStorage (pour DRIVER)
    try{
      const a = JSON.parse(localStorage.getItem("digiy_driver_access_pin") || "null");
      if (a?.phone) return a.phone;
    }catch(_){}
    
    return null;
  }
  
  // ============================================
  // VÉRIFIER ABONNEMENT (RPC OU QUERY DIRECTE)
  // ============================================
  async function isActive(phone, module){
    // Option 1 : Si tu as la RPC
    try {
      const { data, error } = await supabase.rpc("is_subscription_active", {
        p_phone: phone,
        p_module: module
      });
      if (!error && data !== undefined) {
        return !!data;
      }
    } catch(e) {
      console.warn("RPC is_subscription_active non disponible, fallback query directe");
    }
    
    // Option 2 : Query directe (fallback)
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("digiy_subscriptions")
        .select("id")
        .eq("phone", phone)
        .eq("module", module)
        .eq("status", "active")
        .gt("current_period_end", nowIso)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return !!data?.id;
    } catch(e) {
      console.error("isActive query error:", e);
      throw e;
    }
  }
  
  // ============================================
  // API PUBLIQUE
  // ============================================
  window.DIGIY = {
    BASE,
    PAY_URL,
    getPhone,
    
    async guardOrPay(module, loginPath){
      const phone = await getPhone();
      
      if(!phone){
        console.log("❌ Pas de phone → Redirection login");
        location.replace(BASE + (loginPath || "/authentification-chauffeur.html"));
        return false;
      }
      
      console.log("✅ Phone récupéré:", phone);
      
      try{
        const ok = await isActive(phone, module);
        
        if(!ok){
          console.log("❌ Pas d'abonnement actif → Redirection paiement");
          location.replace(
            PAY_URL
            + "?phone=" + encodeURIComponent(phone)
            + "&module=" + encodeURIComponent(module)
            + "&from=" + encodeURIComponent(location.href)
          );
          return false;
        }
        
        console.log("✅ Abonnement actif pour", module);
        return true;
        
      }catch(e){
        console.warn("guardOrPay error:", e);
        // Si Supabase bug => on ne bloque pas à tort
        return true;
      }
    }
  };
})();
