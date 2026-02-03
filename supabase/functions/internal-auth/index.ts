import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action, username, password, token } = await req.json();

    if (action === "login") {
      // Validate input
      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: "Usuário e senha são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate password length (max 8 digits)
      if (password.length > 8) {
        return new Response(
          JSON.stringify({ error: "Senha deve ter no máximo 8 caracteres" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find user by username
      const { data: user, error: userError } = await supabase
        .from("internal_users")
        .select(`
          id,
          username,
          password_hash,
          full_name,
          is_active,
          role_id,
          internal_roles (
            id,
            name,
            is_master
          )
        `)
        .eq("username", username.toLowerCase().trim())
        .single();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "Usuário ou senha inválidos" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!user.is_active) {
        return new Response(
          JSON.stringify({ error: "Usuário desativado. Contate o administrador." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify password using database function
      const { data: passwordValid, error: verifyError } = await supabase
        .rpc("verify_password", {
          password: password,
          password_hash: user.password_hash
        });

      if (verifyError || !passwordValid) {
        return new Response(
          JSON.stringify({ error: "Usuário ou senha inválidos" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user permissions
      const { data: permissions, error: permError } = await supabase
        .from("internal_permissions")
        .select("permission_key, allowed")
        .eq("role_id", user.role_id);

      if (permError) {
        console.error("Error fetching permissions:", permError);
      }

      // Generate session token
      const sessionToken = crypto.randomUUID() + "-" + crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour session

      // Create session
      const { error: sessionError } = await supabase
        .from("internal_sessions")
        .insert({
          user_id: user.id,
          token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      if (sessionError) {
        console.error("Error creating session:", sessionError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar sessão" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update last login
      await supabase
        .from("internal_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", user.id);

      // Format permissions as object
      const permissionsMap: Record<string, boolean> = {};
      permissions?.forEach(p => {
        permissionsMap[p.permission_key] = p.allowed;
      });

      return new Response(
        JSON.stringify({
          success: true,
          token: sessionToken,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            role: user.internal_roles,
            isMaster: user.internal_roles?.is_master || false
          },
          permissions: permissionsMap,
          expiresAt: expiresAt.toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "validate") {
      if (!token) {
        return new Response(
          JSON.stringify({ valid: false, error: "Token não fornecido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find session
      const { data: session, error: sessionError } = await supabase
        .from("internal_sessions")
        .select(`
          id,
          expires_at,
          user_id,
          internal_users (
            id,
            username,
            full_name,
            is_active,
            role_id,
            internal_roles (
              id,
              name,
              is_master
            )
          )
        `)
        .eq("token", token)
        .single();

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({ valid: false, error: "Sessão inválida" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check expiration
      if (new Date(session.expires_at) < new Date()) {
        // Delete expired session
        await supabase.from("internal_sessions").delete().eq("id", session.id);
        return new Response(
          JSON.stringify({ valid: false, error: "Sessão expirada" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const user = session.internal_users as any;
      
      if (!user?.is_active) {
        return new Response(
          JSON.stringify({ valid: false, error: "Usuário desativado" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get permissions
      const { data: permissions } = await supabase
        .from("internal_permissions")
        .select("permission_key, allowed")
        .eq("role_id", user.role_id);

      const permissionsMap: Record<string, boolean> = {};
      permissions?.forEach(p => {
        permissionsMap[p.permission_key] = p.allowed;
      });

      return new Response(
        JSON.stringify({
          valid: true,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.full_name,
            role: user.internal_roles,
            isMaster: user.internal_roles?.is_master || false
          },
          permissions: permissionsMap,
          expiresAt: session.expires_at
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "logout") {
      if (token) {
        await supabase.from("internal_sessions").delete().eq("token", token);
      }
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Internal auth error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
