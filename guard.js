/* guard.js — DIGIY PAY GUARD
   SAFE URL + SESSION 8H + PUBLIC BYPASS
   Doctrine : le public paie direct, le pro passe par accès protégé.
*/
(function () {
  "use strict";

  // ============================================================
  // CONFIG
  // ============================================================
  const SUPABASE_URL =
    window.DIGIY_SUPABASE_URL ||
    "https://wesqmwjjtsefyjnluosj.supabase.co";

  const SUPABASE_ANON_KEY =
    window.DIGIY_SUPABASE_ANON_KEY ||
    window.DIGIY_SUPABASE_ANON ||
    "sb_publishable_tGHItRgeWDmGjnd0CK1DVQ_BIep4Ug3";

  const PAY_URL =
    window.DIGIY_PAY_URL ||
    "https://commencer-a-payer.digiylyfe.com/";

  const DEFAULT_MODULE = String(window.DIGIY_MODULE || "PAY")
    .trim()
    .toUpperCase();

  const SESSION_KEY = "DIGIY_PAY_PRO_SESSION";
  const MAX_SESSION_MS = 8 * 60 * 60 * 1000;
  const ACCESS_CACHE_SECONDS = 60;

  const PUBLIC_PAGES = [
    "index.html",
    "",
    "payer.html",
    "wait.html"
  ];

  const SENSITIVE_KEYS = [
    "phone",
    "tel",
    "owner_phone",
    "owner_id",
    "slug",
    "pay_slug",
    "subscription_slug",
    "business_phone",
    "wave_phone",
    "wallet_phone",
    "pay_phone",
    "access_note",
    "keybox_code",
    "keybox_location",
    "return",
    "from",
    "redirect",
    "redirect_url",
    "url",
    "v"
  ];

  // ============================================================
  // BASE GitHub Pages
  // ============================================================
  const path = location.pathname || "/";
  const parts = path.split("/").filter(Boolean);
  const BASE = parts.length >= 1 ? "/" + parts[0] : "";

  cleanVisibleUrl();

  // ============================================================
  // HELPERS
  // ============================================================
  function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function normalizeSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function normalizeModule(value) {
    const raw = String(value || DEFAULT_MODULE || "PAY")
      .trim()
      .toUpperCase();

    const alias = {
      CAISSE: "POS",
      CAISSE_BOUTIQUE: "POS",
      POS_PRO: "POS",
      MON_COMMERCE: "POS",
      PAY_PRO: "PAY"
    };

    return alias[raw] || raw || "PAY";
  }

  function currentFileName() {
    const file = String(location.pathname || "")
      .split("/")
      .pop()
      .trim()
      .toLowerCase();

    return file || "";
  }

  function isPublicPage() {
    const file = currentFileName();
    return PUBLIC_PAGES.includes(file);
  }

  function safeJsonParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function nowMs() {
    return Date.now();
  }

  function say(msg) {
    const el = document.getElementById("guard_status");
    if (el) el.textContent = msg;
    console.log("🔐 DIGIY PAY GUARD:", msg);
  }

  // ============================================================
  // URL CLEANING
  // ============================================================
  function cleanVisibleUrl() {
    try {
      const url = new URL(location.href);
      let changed = false;

      SENSITIVE_KEYS.forEach(function (key) {
        if (url.searchParams.has(key)) {
          url.searchParams.delete(key);
          changed = true;
        }
      });

      if (changed) {
        history.replaceState(
          {},
          document.title,
          url.pathname + url.search + url.hash
        );
      }
    } catch (_) {}
  }

  function cleanInternalHref(raw, fallback) {
    const safeFallback = fallback || "./pin.html";

    try {
      const u = new URL(raw || safeFallback, location.href);

      SENSITIVE_KEYS.forEach(function (key) {
        u.searchParams.delete(key);
      });

      if (u.origin !== location.origin) return safeFallback;

      const file = u.pathname.split("/").pop() || "index.html";
      return "./" + file + (u.search || "") + (u.hash || "");
    } catch (_) {
      return safeFallback;
    }
  }

  function safeLocalPath(pathname) {
    return cleanInternalHref(pathname || "./pin.html", "./pin.html");
  }

  function buildCleanPayUrl(module, err) {
    const url = new URL(PAY_URL, location.href);

    url.searchParams.set(
      "module",
      normalizeModule(module || DEFAULT_MODULE || "PAY")
    );

    if (err) {
      url.searchParams.set("err", String(err));
    }

    SENSITIVE_KEYS.forEach(function (key) {
      if (key !== "module") url.searchParams.delete(key);
    });

    return url.toString();
  }

  function cleanAllInternalLinks() {
    try {
      document.querySelectorAll("a[href]").forEach(function (link) {
        const href = link.getAttribute("href") || "";

        if (
          !href ||
          href.startsWith("#") ||
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          href.startsWith("https://wa.me/")
        ) {
          return;
        }

        const u = new URL(href, location.href);
        if (u.origin !== location.origin) return;

        SENSITIVE_KEYS.forEach(function (key) {
          u.searchParams.delete(key);
        });

        const file = u.pathname.split("/").pop() || "index.html";
        link.setAttribute("href", "./" + file + (u.search || "") + (u.hash || ""));
      });
    } catch (_) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cleanAllInternalLinks);
  } else {
    cleanAllInternalLinks();
  }

  // ============================================================
  // SESSION 8H
  // ============================================================
  function readSession() {
    try {
      const raw =
        sessionStorage.getItem(SESSION_KEY) ||
        localStorage.getItem(SESSION_KEY);

      const data = safeJsonParse(raw);
      if (!data || typeof data !== "object") return null;

      if (data.ts && nowMs() - Number(data.ts) > MAX_SESSION_MS) {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      const phone = normalizePhone(data.phone || "");
      const slug = normalizeSlug(data.slug || "");
      const module = normalizeModule(data.module || DEFAULT_MODULE || "PAY");

      if (!phone && !slug) return null;

      return {
        phone,
        slug,
        module,
        access_ok: data.access_ok === true,
        ts: data.ts || 0
      };
    } catch (_) {
      return null;
    }
  }

  function saveSession(phone, slug, module) {
    const p = normalizePhone(phone || "");
    const s = normalizeSlug(slug || "");
    const m = normalizeModule(module || DEFAULT_MODULE || "PAY");

    try {
      const payload = JSON.stringify({
        phone: p,
        slug: s,
        module: m,
        access_ok: true,
        ts: nowMs()
      });

      sessionStorage.setItem(SESSION_KEY, payload);
      localStorage.setItem(SESSION_KEY, payload);

      if (p) {
        sessionStorage.setItem("digiy_pay_phone", p);
        localStorage.setItem("digiy_pay_phone", p);
      }

      if (s) {
        sessionStorage.setItem("digiy_pay_slug", s);
        localStorage.setItem("digiy_pay_slug", s);
      }
    } catch (_) {}
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch (_) {}
  }

  // ============================================================
  // CACHE ACCESS 60s
  // ============================================================
  function cacheKey(phone, module) {
    return "digiy_pay_access:" + phone + ":" + normalizeModule(module);
  }

  function cacheGet(phone, module) {
    try {
      const raw = sessionStorage.getItem(cacheKey(phone, module));
      if (!raw) return null;

      const obj = safeJsonParse(raw);
      if (obj && obj.ok && obj.exp && obj.exp > nowMs()) return true;

      return null;
    } catch (_) {
      return null;
    }
  }

  function cacheSet(phone, module, seconds) {
    try {
      sessionStorage.setItem(
        cacheKey(phone, module),
        JSON.stringify({
          ok: true,
          exp: nowMs() + Number(seconds || ACCESS_CACHE_SECONDS) * 1000
        })
      );
    } catch (_) {}
  }

  // ============================================================
  // SUPABASE CLIENT
  // ============================================================
  if (!window.supabase || !window.supabase.createClient) {
    console.warn(
      "DIGIY PAY GUARD : Supabase JS non chargé. Le guard restera en veille."
    );

    window.DIGIY = Object.assign(window.DIGIY || {}, {
      BASE,
      PAY_URL,
      readSession,
      clearSession,
      cleanVisibleUrl,
      isPublicPage,
      guardOrPay: async function () {
        return isPublicPage();
      }
    });

    return;
  }

  const supabase =
    window.__DIGIY_PAY_GUARD_SB ||
    window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storageKey: "digiy-pay-guard-auth-token",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        }
      }
    });

  window.__DIGIY_PAY_GUARD_SB = supabase;

  // ============================================================
  // PHONE HELPERS
  // PAY only — no bleed from DRIVER / LOC / MARKET
  // ============================================================
  function readJsonStorage(key, store) {
    try {
      const raw = store.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function pickPhoneFromKnownStores() {
    const session = readSession();
    if (session && session.phone) return session.phone;

    const directKeys = [
      "digiy_pay_phone",
      "DIGIY_PAY_PHONE"
    ];

    for (const key of directKeys) {
      const v1 = normalizePhone(sessionStorage.getItem(key));
      if (v1) return v1;

      const v2 = normalizePhone(localStorage.getItem(key));
      if (v2) return v2;
    }

    const jsonKeys = [
      SESSION_KEY,
      "digiy_pay_access_pin",
      "DIGIY_PAY_PIN_SESSION",
      "DIGIY_SESSION_PAY"
    ];

    for (const key of jsonKeys) {
      const sObj = readJsonStorage(key, sessionStorage);
      const sPhone = normalizePhone(sObj && sObj.phone);
      if (sPhone) return sPhone;

      const lObj = readJsonStorage(key, localStorage);
      const lPhone = normalizePhone(lObj && lObj.phone);
      if (lPhone) return lPhone;
    }

    return null;
  }

  // ============================================================
  // PHONE FROM AUTH + SESSION
  // ============================================================
  async function getPhone() {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data && data.session ? data.session : null;

      const p =
        session?.user?.phone ||
        session?.user?.user_metadata?.phone ||
        session?.user?.user_metadata?.phone_number ||
        session?.user?.identities?.[0]?.identity_data?.phone ||
        "";

      const authPhone = normalizePhone(p);
      if (authPhone) return authPhone;
    } catch (e) {
      console.warn("DIGIY PAY GUARD getSession warning:", e);
    }

    const storedPhone = pickPhoneFromKnownStores();
    if (storedPhone) return storedPhone;

    return null;
  }

  // ============================================================
  // CHECK ACCESS
  // ============================================================
  async function isActive(phone, module) {
    const cleanPhone = normalizePhone(phone);
    const cleanModule = normalizeModule(module);

    if (!cleanPhone) return false;

    const cached = cacheGet(cleanPhone, cleanModule);
    if (cached) {
      console.log("✅ DIGIY PAY cache access:", cleanModule);
      return true;
    }

    const { data, error } = await supabase.rpc("digiy_has_access", {
      p_phone: cleanPhone,
      p_module: cleanModule
    });

    if (error) {
      console.error("DIGIY PAY GUARD RPC digiy_has_access error:", error);
      throw error;
    }

    const ok =
      data === true ||
      data === 1 ||
      data === "true" ||
      data?.ok === true;

    if (ok) {
      cacheSet(cleanPhone, cleanModule, ACCESS_CACHE_SECONDS);
    }

    return !!ok;
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  async function guardOrPay(module, loginPath, options) {
    const opts = options || {};
    const cleanModule = normalizeModule(module || DEFAULT_MODULE || "PAY");

    /*
      PAY public ne doit jamais être bloqué par le guard.
      index.html, payer.html, wait.html restent accessibles.
    */
    if (opts.allowPublicBypass !== false && isPublicPage()) {
      document.documentElement.classList.add("pay-public-page");
      return true;
    }

    if (!cleanModule) {
      console.error("DIGIY PAY GUARD: module manquant");
      return false;
    }

    say("Vérification…");

    const stored = readSession();

    if (
      stored &&
      stored.access_ok &&
      stored.module === cleanModule &&
      stored.phone
    ) {
      say("✅ Session active");
      document.documentElement.classList.add("access-ok");
      window.DIGIY_ACCESS = {
        module: cleanModule,
        ok: true
      };
      return true;
    }

    const phone = await getPhone();

    if (!phone) {
      say("Code PAY requis");

      const target = loginPath
        ? safeLocalPath(loginPath)
        : "./pin.html";

      setTimeout(function () {
        location.replace(target);
      }, 500);

      return false;
    }

    say("Vérification abonnement…");

    window.DIGIY_ACCESS = {
      module: cleanModule,
      ok: false
    };

    try {
      const ok = await isActive(phone, cleanModule);

      if (!ok) {
        say("Abonnement requis");

        setTimeout(function () {
          location.replace(buildCleanPayUrl(cleanModule));
        }, 700);

        return false;
      }

      say("✅ Accès autorisé");
      document.documentElement.classList.add("access-ok");

      saveSession(phone, stored?.slug || "", cleanModule);

      window.DIGIY_ACCESS = {
        module: cleanModule,
        ok: true
      };

      setTimeout(function () {
        const el = document.getElementById("guard_status");
        if (el) el.style.display = "none";
      }, 1500);

      return true;
    } catch (e) {
      console.error("DIGIY PAY GUARD error:", e);
      say("Erreur vérification");

      setTimeout(function () {
        location.replace(buildCleanPayUrl(cleanModule, "verify"));
      }, 700);

      return false;
    }
  }

  window.DIGIY = Object.assign(window.DIGIY || {}, {
    BASE,
    PAY_URL,

    normalizePhone,
    normalizeSlug,
    normalizeModule,

    cleanVisibleUrl,
    cleanInternalHref,
    safeLocalPath,
    cleanAllInternalLinks,

    isPublicPage,
    getPhone,
    readSession,
    saveSession,
    clearSession,

    isActive,
    guardOrPay
  });

  console.info("[DIGIY_PAY_GUARD] chargé — URL propre, public libre, pro protégé.");
})();
