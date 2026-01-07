import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { json, requireUserAndPhone, sbAdmin } from "../_shared/auth.ts";

serve(async (req) => {
  try {
    if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

    const auth = await requireUserAndPhone(req);
    if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

    const body = await req.json().catch(() => ({}));
    const { to_phone, amount, module = null, service = null, order_id = null, meta = {} } = body;

    const amt = Number(amount);
    if (!to_phone) return json(400, { ok: false, error: "missing_to_phone" });
    if (!Number.isFinite(amt) || amt <= 0) return json(400, { ok: false, error: "invalid_amount" });

    const { data, error } = await sbAdmin.rpc("wallet_transfer", {
      p_from_phone: auth.phone,
      p_to_phone: to_phone,
      p_amount: amt,
      p_module: module,
      p_service: service,
      p_order_id: order_id,
      p_meta: meta,
    });

    if (error) return json(500, { ok: false, error: "wallet_transfer_failed", details: error.message });

    return json(200, { ok: true, result: data });
  } catch (e) {
    return json(500, { ok: false, error: "server_crash", message: String(e) });
  }
});
