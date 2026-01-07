/* guard.js — DIGIY UNIVERSAL SUBSCRIPTION GUARD (SAFE + CACHE) */
(function(){
  "use strict";

  // ✅ SUPABASE
  const SUPABASE_URL = "https://wesqmwjjtsefyjnluosj.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlc3Ftd2pqdHNlZnlqbmx1b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg4ODIsImV4cCI6MjA4MDc1NDg4Mn0.dZfYOc2iL2_wRYL3zExZFsFSBK6AbMeOid2LrIjcTdA";

  // ✅ PAIEMENT
  const PAY_URL = "https://beauville.github.io/commencer-a-payer/";

  // ✅ base github pages auto
  const path = location.pathname || "/";
  const parts = path.split("/").filter(Boolean);
  const BASE = (parts.length >= 1) ? ("/" + parts[0]) : "";

  function normalizePhone(p){
    return String(p || "").replace(/[^\d+]/g, "");
  }

  function nowMs(){ return Date.now(); }

  // Cache court (anti-spam Supabase)
  function cacheKey(phone, module){ return `digiy_access:${phone}:${module}`; }
  function cacheGet(phone, module){
    try{
      const raw = sessionStorage.getItem(cacheKey(phone,module));
      if(!raw) return null;
      const obj = JSON.parse(raw);
      if(obj?.ok && obj?.exp && obj.exp > nowMs()) return true;
      return null;
    }catch(_){ return null; }
  }
  function cacheSet(phone, module, seconds){
    try{
      sessionStorage.setItem(cacheKey(phone,module), JSON.stringify({
        ok: true,
        exp: nowMs() + (seconds*1000)
      }));
    }catch(_){}
  }

  // Supabase client (suppose que supabase-js est déjà chargé dans index.html)
  if (!window.supabase?.createClient) {
    console.error("Supabase JS not loaded. Add <script src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'></script> before guard.js");
    return;
  }

  const supabase = window.__sb || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.__sb = supabase;

  async function getPhone(){
    // 1) Supabase Auth
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const p =
        session?.user?.phone ||
        session?.user?.user_metadata?.phone ||
        session?.user?.user_metadata?.phone_number ||
        session?.user?.identities?.[0]?.identity_data?.phone ||
        "";
      const phone = normalizePhone(p);
      if (phone) return phone;
    } catch(e) {
      console.warn("getSession error:", e);
    }

    // 2) sessionStorage
    const s = normalizePhone(sessionStorage.getItem("digiy_driver_phone"));
    if (s) return s;

    // 3) localStorage pin
    try{
      const a = JSON.parse(localStorage.getItem("digiy_driver_access_pin") || "null");
      const p = normalizePhone(a?.phone);
      if (p) return p;
    }catch(_){}

    return null;
  }

  async function isActive(phone, module){
    // Cache (60s)
    const cached = cacheGet(phone, module);
    if (cached) return true;

    // 1) RPC si dispo
    try {
      const { data, error } = await supabase.rpc("is_subscription_active", {
        p_phone: phone,
        p_module: module
      });
      if (!error && data !== undefined) {
        const ok = !!data;
        if (ok) cacheSet(phone, module, 60);
        return ok;
      }
    } catch(e) {
      console.warn("RPC is_subscription_active non dispo -> fallback query");
    }

    // 2) Query directe
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

    const ok = !!data?.id;
    if (ok) cacheSet(phone, module, 60);
    return ok;
  }

  window.DIGIY = {
    BASE,
    PAY_URL,
    getPhone,

    async guardOrPay(module, loginPath){
      const phone = await getPhone();

      // Pas de phone => login
      if(!phone){
        console.log("❌ Pas de phone → login");
        // si loginPath est relatif, on le garde; sinon URL absolue
        const target = loginPath
          ? (loginPath.startsWith("http") ? loginPath : (BASE + loginPath))
          : (BASE + "/authentification-chauffeur.html");
        location.replace(target + (target.includes("?") ? "&" : "?") + "redirect=" + encodeURIComponent(location.href));
        return false;
      }

      // Expose pour l'app
      window.DIGIY_ACCESS = { phone, module };

      console.log("✅ Phone:", phone);

      try{
        const ok = await isActive(phone, module);

        if(!ok){
          console.log("❌ Pas d'abonnement actif → paiement");
          location.replace(
            PAY_URL
            + "?phone=" + encodeURIComponent(phone)
            + "&module=" + encodeURIComponent(module)
            + "&from=" + encodeURIComponent(location.href)
          );
          return false;
        }

        console.log("✅ Abonnement actif:", module);
        document.documentElement.classList.add("access-ok");
        window.DIGIY_ACCESS.ok = true;
        return true;

      }catch(e){
        console.warn("⚠️ Guard check failed (fail-closed):", e);
        // FAIL CLOSED (pas d'accès si on ne peut pas vérifier)
        location.replace(PAY_URL + "?from=" + encodeURIComponent(location.href) + "&err=verify");
        return false;
      }
    }
  };
})();
5) Comment l’utiliser dans ton index (propre)
En haut de <body> :

html
Copier le code
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="guard.js"></script>
<script>
  (async () => {
    const ok = await window.DIGIY.guardOrPay("DIGIY_PAY", "/login.html");
    if(!ok) return;
    // ton app peut démarrer ici si tu veux
  })();
</script>
