// Deploys via the Supabase Dashboard (Edge Functions -> deploy from the
// browser editor), same as spotify-callback/send-push -- see supabase/README.md.
//
// Called by the client (useAuth.js's deleteAccount) when a user permanently
// deletes their account. Deleting the auth.users row is only possible via
// the Admin API, which needs the service role key -- never exposed to the
// client -- so this function verifies the caller's own JWT, then deletes
// *that same user* (never an id passed in the request body, so there's no
// way to delete anyone but yourself).
//
// profiles.id references auth.users(id) on delete cascade, and every
// per-user table (crew_members, dm_participants, dm_messages, camp_pins,
// blocked_users, user_reports, push_subscriptions, spotify_connections,
// spotify_taste, packing_state, notifications, schedule_picks) references
// profiles(id) on delete cascade too -- so this one call is enough to wipe
// everything. One side effect worth knowing: crews.created_by also
// cascades, so a crew you created is disbanded entirely (kicking every
// other member) if you delete your account while leading it -- the client
// warns about this before calling here.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected; no extra
// secrets needed.

import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userData.user.id);
    if (deleteError) {
      console.log("account deletion failed", deleteError);
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.log("top-level error", String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
