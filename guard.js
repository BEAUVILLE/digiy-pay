/* guard.js — DIGIY UNIVERSAL SUBSCRIPTION GUARD (SAFE + CACHE) */
(function(){
  "use strict";

  // =============================
  // SUPABASE
  // =============================
  const SUPABASE_URL =
    window.DIGIY_SUPABASE_URL ||
    "https://wesqmwjjtsefyjnluosj.supabase.co";

  const SUPABASE_ANON_KEY =
    window.DIGIY_SUPABASE_ANON_KEY ||
    window.DIGIY_SUPABASE_ANON ||
    "sb_publishable_tGHItRgeWDmGjnd0CK1DVQ_BIep4Ug3";

  // =============================
  // PAIEMENT
  // =============================
  const PAY_URL =
    window.DIGIY_PAY_URL ||
    "https://commencer-a-payer.digiylyfe.com/";

  // =============================
  // BASE GitHub Pages
  // =============================
  const path = location.pathname || "/";
  const parts = path.split("/").filter(Boolean);
  const BASE = (parts.length >= 1) ? ("/" + parts[0]) : "";

  function normalizePhone(value){
    return String(value || "").replace(/\D/g, "");
  }

  function nowMs(){
    return Date.now();
  }

  // =============================
  // CACHE (60s)
  // =============================
  function cacheKey(phone, module){
    return `digiy_access:${phone}:${module}`;
  }

  function cacheGet(phone, module){
    try{
      const raw = sessionStorage.getItem(cacheKey(phone, module));
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
      sessionStorage.setItem(
        cacheKey(phone, module),
        JSON.stringify({
          ok: true,
          exp: nowMs() + (seconds * 1000)
        })
      );
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
  // PHONE HELPERS
  // =============================
  function readJsonStorage(key, store){
    try{
      const raw = store.getItem(key);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(_){
      return null;
    }
  }

  function pickPhoneFromKnownStores(){
    const directKeys = [
      "digiy_phone",
      "digiy_driver_phone",
      "digiy_market_phone",
      "digiy_build_phone",
      "digiy_loc_phone",
      "digiy_resa_phone",
      "digiy_pos_phone",
      "digiy_commerce_phone",
      "digiy_pay_phone"
    ];

    for(const key of directKeys){
      const v1 = normalizePhone(sessionStorage.getItem(key));
      if(v1) return v1;

      const v2 = normalizePhone(localStorage.getItem(key));
      if(v2) return v2;
    }

    const jsonKeys = [
      "digiy_driver_access_pin",
      "digiy_market_access_pin",
      "digiy_build_access_pin",
      "digiy_loc_access_pin",
      "digiy_resa_access_pin",
      "digiy_pos_access_pin",
      "digiy_commerce_access_pin",
      "digiy_pay_access_pin",
      "digiy_access_pin"
    ];

    for(const key of jsonKeys){
      const sObj = readJsonStorage(key, sessionStorage);
      const sPhone = normalizePhone(sObj?.phone);
      if(sPhone) return sPhone;

      const lObj = readJsonStorage(key, localStorage);
      const lPhone = normalizePhone(lObj?.phone);
      if(lPhone) return lPhone;
    }

    return null;
  }

  // =============================
  // PHONE (Auth + session/local)
  // =============================
  async function getPhone(){
    // 1) Supabase Auth
    try{
      const { data } = await supabase.auth.getSession();
      const session = data?.session || null;

      const p =
        session?.user?.phone ||
        session?.user?.user_metadata?.phone ||
        session?.user?.user_metadata?.phone_number ||
        session?.user?.identities?.[0]?.identity_data?.phone ||
        "";

      const authPhone = normalizePhone(p);
      if(authPhone) return authPhone;
    }catch(e){
      console.warn("⚠️ getSession error:", e);
    }

    // 2) session/local storage connus
    const storedPhone = pickPhoneFromKnownStores();
    if(storedPhone) return storedPhone;

    return null;
  }

  // =============================
  // CHECK SUBSCRIPTION
  // rail propre : RPC digiy_has_access
  // =============================
  async function isActive(phone, module){
    const cached = cacheGet(phone, module);
    if (cached) {
      console.log("✅ Cache hit:", module);
      return true;
    }

    const { data, error } = await supabase.rpc("digiy_has_access", {
      p_phone: phone,
      p_module: module
    });

    if (error) {
      console.error("❌ RPC digiy_has_access error:", error);
      throw error;
    }

    const ok =
      data === true ||
      data === 1 ||
      data === "true" ||
      data?.ok === true;

    if (ok) {
      console.log("✅ Abonnement actif:", { phone, module });
      cacheSet(phone, module, 60);
    } else {
      console.log("❌ Pas d'abonnement actif:", { phone, module });
    }

    return !!ok;
  }

  // =============================
  // API PUBLIQUE
  // =============================
  window.DIGIY = {
    BASE,
    PAY_URL,
    getPhone,

    async guardOrPay(module, loginPath){
      module = String(module || "").trim();
      if(!module){
        console.error("❌ guardOrPay: module manquant");
        return false;
      }

      say("Vérification...");

      const phone = await getPhone();

      // Pas de phone -> login
      if(!phone){
        say("❌ Connexion requise");
        console.log("❌ Pas de phone -> redirection login");

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

      window.DIGIY_ACCESS = { phone, module, ok: false };

      try{
        const ok = await isActive(phone, module);

        // Pas d'abonnement -> paiement
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

        // Accès OK
        say("✅ Accès autorisé");
        console.log("✅ Accès OK pour:", module);

        document.documentElement.classList.add("access-ok");
        window.DIGIY_ACCESS.ok = true;

        setTimeout(() => {
          const el = document.getElementById("guard_status");
          if(el) el.style.display = "none";
        }, 2000);

        return true;

      }catch(e){
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
