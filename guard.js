/* guard.js — DIGIY UNIVERSAL SUBSCRIPTION GUARD (SAFE + CACHE) */
(function(){
  "use strict";

  // =============================
  // SUPABASE
  // =============================
  const SUPABASE_URL = "https://wesqmwjjtsefyjnluosj.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlc3Ftd2pqdHNlZnlqbmx1b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg4ODIsImV4cCI6MjA4MDc1NDg4Mn0.dZfYOc2iL2_wRYL3zExZFsFSBK6AbMeOid2LrIjcTdA";

  // =============================
  // PAIEMENT
  // =============================
  const PAY_URL = "https://beauville.github.io/commencer-a-payer/";

  // =============================
  // BASE GitHub Pages
  // =============================
  const path = location.pathname || "/";
  const parts = path.split("/").filter(Boolean);
  const BASE = (parts.length >= 1) ? ("/" + parts[0]) : "";

  function normalizePhone(p){
    return String(p || "").replace(/[^\d+]/g, "");
  }

  function nowMs(){ return Date.now(); }

  // =============================
  // CACHE (60s)
  // =============================
  function cacheKey(phone, module){ return `digiy_access:${phone}:${module}`; }

  function cacheGet(phone, module){
    try{
      const raw = sessionStorage.getItem(cacheKey(phone,module));
      if(!raw) return null;
      const obj = JSON.parse(raw);
      if(obj?.ok && obj?.exp && obj.exp > nowMs()) return true;
      return null;
    }catch(_){
      return null;
    }
  }

  function cacheSet(phone, module, seconds){
    try{
      sessionStorage.setItem(cacheKey(phone,module), JSON.stringify({
        ok: true,
        exp: nowMs() + (seconds * 1000)
      }));
    }catch(_){}
  }

  // =============================
  // STATUS UI
  // =============================
  function say(msg){
    const el = document.getElementById("guard_status");
    if(el) el.textContent = msg;
    console.log("🔐 GUARD:", msg);
  }

  // =============================
  // SUPABASE CLIENT
  // =============================
  if (!window.supabase || !window.supabase.createClient) {
    console.error("❌ Supabase JS non chargé. Ajouter <script src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'></script>");
    return;
  }

  const supabase = window.__sb || window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
  window.__sb = supabase;

  // =============================
  // PHONE (3 sources)
  // =============================
  async function getPhone(){
    // 1️⃣ Supabase Auth
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
    } catch(e){
      console.warn("⚠️ getSession error:", e);
    }

    // 2️⃣ sessionStorage
    const s = normalizePhone(sessionStorage.getItem("digiy_driver_phone"));
    if (s) return s;

    // 3️⃣ localStorage
    try{
      const a = JSON.parse(localStorage.getItem("digiy_driver_access_pin") || "null");
      const p = normalizePhone(a?.phone);
      if (p) return p;
    }catch(_){}

    return null;
  }

  // =============================
  // CHECK SUBSCRIPTION
  // =============================
  async function isActive(phone, module){
    // Cache check
    const cached = cacheGet(phone, module);
    if (cached) {
      console.log("✅ Cache hit:", module);
      return true;
    }

    // Query DB
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("digiy_subscriptions")
      .select("id, plan, current_period_end")
      .eq("phone", phone)
      .eq("module", module)
      .eq("status", "active")
      .gt("current_period_end", nowIso)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("❌ DB error:", error);
      throw error;
    }

    const ok = !!data?.id;
    
    if (ok) {
      console.log("✅ Abonnement trouvé:", {
        module,
        plan: data.plan,
        expire: new Date(data.current_period_end).toLocaleDateString('fr-FR')
      });
      cacheSet(phone, module, 60);
    } else {
      console.log("❌ Pas d'abonnement actif pour:", module);
    }

    return ok;
  }

  // =============================
  // API PUBLIQUE
  // =============================
  window.DIGIY = {
    BASE,
    PAY_URL,
    getPhone, // ✅ Exposé pour usage dans index.html

    async guardOrPay(module, loginPath){
      say("Vérification...");

      const phone = await getPhone();

      // ❌ Pas de phone → Login
      if(!phone){
        say("❌ Connexion requise");
        console.log("❌ Pas de phone → Redirection login");

        const target = loginPath
          ? (loginPath.startsWith("http") ? loginPath : (BASE + loginPath))
          : (BASE + "/login.html");

        setTimeout(() => {
          location.replace(
            target +
            (target.includes("?") ? "&" : "?") +
            "redirect=" + encodeURIComponent(location.href)
          );
        }, 1000);

        return false;
      }

      console.log("✅ Phone:", phone);
      say("Vérification abonnement...");

      // Expose phone pour l'app
      window.DIGIY_ACCESS = { phone, module };

      try{
        const ok = await isActive(phone, module);

        // ❌ Pas d'abonnement → Paiement
        if(!ok){
          say("❌ Abonnement requis");

          setTimeout(() => {
            location.replace(
              PAY_URL +
              "?phone=" + encodeURIComponent(phone) +
              "&module=" + encodeURIComponent(module) +
              "&from=" + encodeURIComponent(location.href)
            );
          }, 1500);

          return false;
        }

        // ✅ Tout OK
        say("✅ Accès autorisé");
        console.log("✅ Accès OK pour:", module);

        document.documentElement.classList.add("access-ok");
        window.DIGIY_ACCESS.ok = true;

        // Masquer le status après 2s
        setTimeout(() => {
          const el = document.getElementById("guard_status");
          if(el) el.style.display = "none";
        }, 2000);

        return true;

      }catch(e){
        // ❌ Erreur système → Fail closed
        console.error("❌ Guard error:", e);
        say("❌ Erreur vérification");

        setTimeout(() => {
          location.replace(
            PAY_URL +
            "?err=verify&from=" + encodeURIComponent(location.href)
          );
        }, 1500);

        return false;
      }
    }
  };
})();
