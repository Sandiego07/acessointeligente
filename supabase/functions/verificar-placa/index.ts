import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // JWT Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Missing or invalid Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Invalid token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const placa = body.placa?.toString().toUpperCase().trim() || null;
    const tag = body.tag?.toString().toUpperCase().trim() || null;

    if (!placa && !tag) {
      return new Response(
        JSON.stringify({ error: "Informe 'placa' ou 'tag' para verificar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let veiculo = null;

    // Try tag first, then plate
    if (tag) {
      const { data, error } = await supabase
        .from("veiculos")
        .select("*")
        .eq("tag", tag)
        .maybeSingle();
      if (error) throw new Error(`Database error: ${error.message}`);
      veiculo = data;
    }

    if (!veiculo && placa) {
      const { data, error } = await supabase
        .from("veiculos")
        .select("*")
        .eq("codigo", placa)
        .maybeSingle();
      if (error) throw new Error(`Database error: ${error.message}`);
      veiculo = data;
    }

    const autorizado = !!(veiculo && veiculo.status === true);

    // Log access
    const { error: logError } = await supabase.from("logs_acesso").insert({
      placa: veiculo?.placa || placa || tag || "DESCONHECIDO",
      status_acesso: autorizado ? "Autorizado" : "Negado",
      proprietario: veiculo?.proprietario || null,
      modelo: veiculo?.modelo || null,
    });

    if (logError) {
      console.error("Error inserting log:", logError);
    }

    return new Response(
      JSON.stringify({
        autorizado,
        placa: veiculo?.placa || placa || null,
        tag: veiculo?.tag || tag || null,
        proprietario: veiculo?.proprietario || null,
        modelo: veiculo?.modelo || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in verificar-placa:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
