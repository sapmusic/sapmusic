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
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 1. Create a Supabase client with the user's auth token to get their ID.
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user } } = await userSupabaseClient.auth.getUser();
    if (!user) {
        return new Response(JSON.stringify({ error: 'Authentication failed' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Create an admin client to fetch the user's profile, bypassing RLS.
    // FIX: Moved secret fetching and admin client initialization inside the request handler.
    // This prevents a function startup crash if secrets are missing, allowing a proper error response to be sent.
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
        throw new Error('Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY secret in Edge Function settings.');
    }
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        serviceRoleKey
    );
    
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
        // If the error is that the row doesn't exist, it's a new user. Return null.
        // PGRST116 is the code for "No rows found".
        if (profileError.code === 'PGRST116') {
             return new Response(JSON.stringify({ user: null }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        // For other errors, throw them.
        throw profileError;
    }

    // 3. Return the user profile.
    return new Response(JSON.stringify({ user: userProfile }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Function error:', err.message);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})