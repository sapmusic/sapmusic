// This function requires the following environment variables to be set in your Supabase project:
// - SUPABASE_URL: Your project's URL.
// - SUPABASE_ANON_KEY: Your project's anonymous key.
// - SUPABASE_SERVICE_ROLE_KEY: Your project's service role key (set as a secret).

declare const Deno: any;

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // FIX: Add explicit checks for all required environment variables.
    // This provides a clear error message if the function is not configured correctly.
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing one or more required environment variables.');
        return new Response(
            JSON.stringify({ error: 'Server configuration error: Missing environment variables.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Create a Supabase client with the Auth context of the user invoking the function.
    const userSupabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    )

    // 2. Check if the user is authenticated and is an admin.
    // FIX: Safely destructure user data and handle potential errors.
    // A crash here would cause a generic network error on the client.
    const { data: userData, error: userError } = await userSupabaseClient.auth.getUser();

    if (userError) {
      console.error('Authentication error:', userError.message);
      return new Response(JSON.stringify({ error: 'Failed to authenticate user.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!userData.user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const user = userData.user;

    const { data: adminProfile, error: profileError } = await userSupabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Permission denied. Admin role required.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // 3. If the user is an admin, fetch all data using the service role key to bypass RLS.
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Fetch all profiles from the `users` table.
    const { data: profilesData, error: profilesDbError } = await supabaseAdmin.from('users').select('*');
    if (profilesDbError) throw profilesDbError;

    // Fetch all users from `auth.users` using pagination.
    let allAuthUsers: any[] = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
        // FIX: Safely destructure the response from listUsers to prevent a crash if `data` is null on error.
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

        if (error) {
            console.error(`Error fetching auth users on page ${page}:`, error.message);
            throw error; // Let the main catch block handle the response
        }

        const users = data?.users ?? [];
        
        if (users.length > 0) {
            allAuthUsers.push(...users);
        }

        if (users.length < perPage) {
            break; // This was the last page
        }
        
        page++;
    }

    // 4. Merge the two lists.
    const profilesMap = new Map(profilesData.map(p => [p.id, p]));

    const mergedUsers = allAuthUsers.map(authUser => {
        const profile = profilesMap.get(authUser.id);
        // FIX: Add explicit type check to ensure `profile` is an object before spreading.
        // The Deno/TypeScript environment may not infer this correctly from a truthiness check alone.
        if (profile && typeof profile === 'object') {
            // User has a profile; return the full profile object and mark it as such.
            return { ...profile, hasProfile: true };
        } else {
            // User exists in auth but not in profiles table. Create a partial object.
            return {
                id: authUser.id,
                name: authUser.user_metadata?.name || authUser.email,
                email: authUser.email,
                role: 'user',
                status: 'active',
                hasProfile: false,
            };
        }
    });

    // 5. Return the complete, merged list of users.
    return new Response(JSON.stringify({ users: mergedUsers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Function error:', err.message);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})