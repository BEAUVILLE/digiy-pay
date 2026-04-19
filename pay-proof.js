window.DIGIY_PAY_PROOF_READY = true;

(() => {
  "use strict";

  const WAIT_URL = "./wait.html";
  const PUBLIC_CTX_KEY = "DIGIY_PAY_PUBLIC_CTX";
  const LAST_PROOF_KEY = "DIGIY_PAY_LAST_PROOF";
  const LAST_PROOF_BY_REF_PREFIX = "DIGIY_PAY_PROOF_REF_";
  const DEFAULT_MODULE = "PAY";

  const q = new URLSearchParams(location.search);

  const els = {
    payAmount: document.getElementById("payAmount"),
    payPhone: document.getElementById("payPhone"),
    paySlug: document.getElementById("paySlug"),
    proofFile: document.getElementById("proofFile"),
    btnSendProof: document.getElementById("btnSendProof"),
    payMsg: document.getElementById("payMsg"),
    btnBack: document.getElementById("btnBack")
  };

  const SUPABASE_URL =
    window.DIGIY_SUPABASE_URL ||
    "https://wesqmwjjtsefyjnluosj.supabase.co";

  const SUPABASE_ANON_KEY =
    window.DIGIY_SUPABASE_ANON_KEY ||
    window.DIGIY_SUPABASE_ANON ||
    "";

  const sb =
    window.supabase?.createClient && SUPABASE_URL && SUPABASE_ANON_KEY
      ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            storage: {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {}
            }
          }
        })
      : null;

  function normDigits(v) {
    return String(v || "").replace(/\D/g, "");
  }

  function normPhone(v) {
    const raw = normDigits(v);
    if (!raw) return "";
    if (raw.startsWith("221") && raw.length >= 12) return raw;
    if (raw.length === 9) return "221" + raw;
    return raw;
  }

  function normCode(v) {
    return String(v || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[^A-Z0-9_-]/g, "");
  }

  function normSlug(v) {
    return String(v || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function normModule(v) {
    const raw = String(v || "").trim().toUpperCase();
    const alias = {
      CAISSE: "POS",
      CAISSE_BOUTIQUE: "POS",
      POS: "POS",
      POS_PRO: "POS",
      MON_COMMERCE: "POS",
      DRIVER: "DRIVER",
      LOC: "LOC",
      JOB: "JOBS",
      JOBS: "JOBS",
      DIGIY_JOBS: "JOBS",
      RESA: "RESA",
      RESA_TABLE: "RESA",
      RESTO_RESA: "RESA",
      PAY: "PAY",
      MARKET: "MARKET",
      BUILD: "BUILD",
      MULTI_SERVICE: "BUILD",
      EXPLORE: "EXPLORE"
    };
    return alias[raw] || raw || DEFAULT_MODULE;
  }

  function safeUrl(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    try {
      const u = new URL(value, location.href);
      if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
      return "";
    } catch {
      return "";
    }
  }

  function readPublicCtx() {
    try {
      const raw = sessionStorage.getItem(PUBLIC_CTX_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function setMsg(text, kind = "muted") {
    if (!els.payMsg) return;
    els.payMsg.className = "msg " + kind;
    els.payMsg.textContent = text || "";
  }

  function getFileMeta(file) {
    if (!file) return null;
    return {
      name: file.name || "",
      size: Number(file.size || 0),
      type: file.type || "",
      last_modified: file.lastModified || null
    };
  }

  function makeRef(code, phone) {
    const cleanCode = normCode(code) || "X";
    const last6 = (normPhone(phone) || "").slice(-6) || "000000";
    const stamp = Date.now().toString(36).toUpperCase();
    return `PAY-${cleanCode}-${last6}-${stamp}`;
  }

  function getState() {
    const ctx = readPublicCtx() || {};

    const module = normModule(q.get("base_module") || q.get("module") || ctx.module || DEFAULT_MODULE);
    const code = normCode(q.get("code") || ctx.code || "");
    const publicLabel = String(q.get("public_label") || ctx.business_name || "").trim();

    const amount = String(els.payAmount?.value || q.get("amount") || "").replace(/[^\d]/g, "");
    const phone = normPhone(els.payPhone?.value || q.get("phone") || ctx.phone || "");
    const slug = normSlug(els.paySlug?.value || q.get("slug") || ctx.slug || "");
    const returnUrl = safeUrl(q.get("return"));

    return {
      module,
      code,
      publicLabel,
      amount_xof: Number(amount || 0),
      phone,
      slug,
      plan: String(q.get("plan") || "payment").trim() || "payment",
      returnUrl
    };
  }

  function hydrateFromCtx() {
    const st = getState();

    if (els.payPhone && !els.payPhone.value && st.phone) {
      els.payPhone.value = st.phone;
    }
    if (els.paySlug && !els.paySlug.value && st.slug) {
      els.paySlug.value = st.slug;
    }

    if (els.btnBack) {
      els.btnBack.href = st.returnUrl || ("./index.html" + (st.code ? ("?pro=" + encodeURIComponent(st.code)) : ""));
    }
  }

  function validate(st) {
    if (!st.code) return "Code DIGIY manquant.";
    if (!st.phone || st.phone.length < 12) return "Numéro Wave manquant ou invalide.";
    if (!st.amount_xof || st.amount_xof <= 0) return "Montant payé manquant ou invalide.";
    if (!els.proofFile?.files?.[0]) return "Ajoute la capture Wave avant d’envoyer la preuve.";
    return "";
  }

  async function uploadProofIfConfigured(ref, file) {
    const bucket =
      String(window.DIGIY_PAY_PROOF_BUCKET || "").trim() ||
      String(window.DIGIY_PROOF_BUCKET || "").trim();

    if (!bucket || !sb || !file) {
      return { ok: false, skipped: true, proof_path: "", proof_url: "" };
    }

    const safeName = String(file.name || "proof")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "");

    const ext = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
    const path = `pay-proofs/${ref}.${ext}`;

    const { error } = await sb.storage.from(bucket).upload(path, file, {
      upsert: true,
      cacheControl: "3600",
      contentType: file.type || "image/jpeg"
    });

    if (error) {
      return {
        ok: false,
        skipped: false,
        error: error.message || "storage_upload_failed",
        proof_path: "",
        proof_url: ""
      };
    }

    const pub = sb.storage.from(bucket).getPublicUrl(path);
    return {
      ok: true,
      skipped: false,
      proof_path: path,
      proof_url: pub?.data?.publicUrl || ""
    };
  }

  async function persistIfConfigured(payload) {
    const rpcName = String(window.DIGIY_PAY_PROOF_RPC || "").trim();
    const tableName = String(window.DIGIY_PAY_PROOF_TABLE || "").trim();

    if (!sb) {
      return { ok: false, skipped: true, mode: "no_supabase" };
    }

    if (rpcName) {
      const { data, error } = await sb.rpc(rpcName, { p_payload: payload });
      if (error) return { ok: false, skipped: false, mode: "rpc", error: error.message || "rpc_failed" };
      return { ok: true, skipped: false, mode: "rpc", data };
    }

    if (tableName) {
      const { data, error } = await sb.from(tableName).insert(payload).select().limit(1);
      if (error) return { ok: false, skipped: false, mode: "table", error: error.message || "insert_failed" };
      return { ok: true, skipped: false, mode: "table", data };
    }

    return { ok: false, skipped: true, mode: "no_backend_config" };
  }

  function saveLocal(payload) {
    try {
      localStorage.setItem(LAST_PROOF_KEY, JSON.stringify(payload));
      if (payload.ref) {
        localStorage.setItem(LAST_PROOF_BY_REF_PREFIX + payload.ref, JSON.stringify(payload));
      }
      sessionStorage.setItem(LAST_PROOF_KEY, JSON.stringify(payload));
    } catch {}
  }

  function buildWaitUrl(payload) {
    const u = new URL(WAIT_URL, location.href);
    if (payload.ref) u.searchParams.set("ref", payload.ref);
    if (payload.code) u.searchParams.set("code", payload.code);
    if (payload.module) u.searchParams.set("module", payload.module);
    u.searchParams.set("status", payload.status || "pending_proof");
    return u.toString();
  }

  async function handleSend() {
    const st = getState();
    const problem = validate(st);

    if (problem) {
      setMsg(problem, "bad");
      return;
    }

    const file = els.proofFile.files[0];
    const ref = makeRef(st.code, st.phone);

    els.btnSendProof.disabled = true;
    setMsg("Préparation de la preuve…", "muted");

    const basePayload = {
      ref,
      source_module: DEFAULT_MODULE,
      source_id: ref,
      module: st.module || DEFAULT_MODULE,
      code: st.code,
      public_label: st.publicLabel || "",
      direction: "in",
      scope: "pro",
      kind: "sale",
      channel: "wave",
      amount_xof: st.amount_xof,
      phone: st.phone,
      slug: st.slug,
      plan: st.plan || "payment",
      origin: "public_pay",
      label: "Paiement public DIGIY",
      note_text: `Preuve publique DIGIY PAY ${st.code || ""}`.trim(),
      status: "pending_proof",
      created_at: new Date().toISOString(),
      proof_file: getFileMeta(file)
    };

    try {
      const upload = await uploadProofIfConfigured(ref, file);
      if (upload.ok) {
        basePayload.proof_path = upload.proof_path;
        basePayload.proof_url = upload.proof_url;
      } else if (!upload.skipped) {
        basePayload.proof_upload_error = upload.error || "upload_failed";
      }

      setMsg("Enregistrement de la preuve…", "muted");

      const persist = await persistIfConfigured(basePayload);

      basePayload.persist_mode = persist.mode || "";
      basePayload.persisted = !!persist.ok;
      if (persist.error) {
        basePayload.persist_error = persist.error;
      }

      saveLocal(basePayload);

      if (persist.ok) {
        setMsg("Preuve envoyée. Redirection…", "ok");
      } else if (persist.skipped) {
        setMsg("Preuve préparée localement. Redirection…", "ok");
      } else {
        setMsg("Preuve préparée, mais écriture backend refusée. Redirection…", "bad");
      }

      setTimeout(() => {
        location.href = buildWaitUrl(basePayload);
      }, 600);
    } catch (e) {
      console.error("pay-proof send error", e);
      setMsg("Impossible d’envoyer la preuve pour le moment.", "bad");
    } finally {
      els.btnSendProof.disabled = false;
    }
  }

  hydrateFromCtx();

  if (els.btnSendProof) {
    els.btnSendProof.addEventListener("click", handleSend);
  }

  if (!sb) {
    setMsg("Supabase indisponible. La preuve sera préparée localement si tu continues.", "bad");
  }
})();
