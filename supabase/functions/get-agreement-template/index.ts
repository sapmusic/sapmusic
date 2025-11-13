// This function requires the following environment variables to be set in your Supabase project:
// - SUPABASE_SERVICE_ROLE_KEY: Your project's service role key (set as a secret).

declare const Deno: any;

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header is required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // First, verify the user is authenticated.
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userSupabaseClient.auth.getUser();
    if (!user) {
        return new Response(JSON.stringify({ error: 'Authentication failed' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Now, create an admin client to fetch settings, bypassing RLS.
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
        throw new Error('Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY secret.');
    }
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        serviceRoleKey
    );
    
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'publishing_agreement_text')
      .single();

    if (settingsError) {
        // If the row doesn't exist, it's not a server error, just no template.
        if (settingsError.code === 'PGRST116') {
             return new Response(JSON.stringify({ template: null }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        throw settingsError;
    }

    return new Response(JSON.stringify({ template: settingsData?.value || null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Function error:', err.message);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});