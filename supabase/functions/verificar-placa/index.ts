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

    const { placa } = await req.json();

    if (!placa || typeof placa !== "string") {
      return new Response(
        JSON.stringify({ error: "Campo 'placa' é obrigatório (string)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if plate exists and is active
    const { data: veiculo, error: veiculoError } = await supabase
      .from("veiculos")
      .select("*")
      .eq("placa", placa.toUpperCase().trim())
      .maybeSingle();

    if (veiculoError) {
      throw new Error(`Database error: ${veiculoError.message}`);
    }

    const autorizado = !!(veiculo && veiculo.status === true);

    // Log access
    const { error: logError } = await supabase.from("logs_acesso").insert({
      placa: placa.toUpperCase().trim(),
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
        placa: placa.toUpperCase().trim(),
        proprietario: veiculo?.proprietario || null,
        modelo: veiculo?.modelo || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in verificar-placa:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
