import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const sbAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function bearer(req: Request) {
  const h = req.headers.get("Authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

export async function requireUserAndPhone(req: Request) {
  const jwt = bearer(req);
  if (!jwt) return { ok: false as const, status: 401, error: "missing_authorization" };

  const { data: userData, error: userErr } = await sbAdmin.auth.getUser(jwt);
  if (userErr || !userData?.user) return { ok: false as const, status: 403, error: "invalid_token" };

  const userId = userData.user.id;

  const { data: profile, error: pErr } = await sbAdmin
    .from("digiy_profiles")
    .select("phone_number")
    .eq("user_id", userId)
    .single();

  if (pErr || !profile?.phone_number) return { ok: false as const, status: 403, error: "profile_not_linked" };

  return { ok: true as const, userId, phone: profile.phone_number };
}
