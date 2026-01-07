import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { json, requireUserAndPhone, sbAdmin } from "../_shared/auth.ts";

serve(async (req) => {
  try {
    if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

    const auth = await requireUserAndPhone(req);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const body = await req.json().catch(() => ({}));
    const { amount, method, module = "PAY_PRO", service = "WITHDRAW", order_id = null, meta = {} } = body;

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return json(400, { ok: false, error: "invalid_amount" });
    if (!method) return json(400, { ok: false, error: "missing_method" });

    const { data, error } = await sbAdmin.rpc("wallet_withdraw", {
      p_from_phone: auth.phone,
      p_amount: amt,
      p_method: method,
      p_module: module,
      p_service: service,
      p_order_id: order_id,
      p_meta: meta,
    });

    if (error) return json(500, { ok: false, error: "wallet_withdraw_failed", details: error.message });

    return json(200, { ok: true, result: data });
  } catch (e) {
    return json(500, { ok: false, error: "server_crash", message: String(e) });
  }
});
