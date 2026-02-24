import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const res = await fetch("https://api.opendota.com/api/constants/heroes");
    if (!res.ok) throw new Error(`OpenDota API error: ${res.status}`);
    const heroesObj = await res.json();

    const rows = Object.values(heroesObj).map((h: any) => {
      const shortName = (h.name || "").replace("npc_dota_hero_", "");
      return {
        id: h.id,
        name: shortName,
        localized_name: h.localized_name || shortName,
        icon_url: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/${shortName}.png`,
        image_url: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${shortName}.png`,
        updated_at: new Date().toISOString(),
      };
    });

    const { error } = await supabaseAdmin.from("heroes").upsert(rows, { onConflict: "id" });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-heroes error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
