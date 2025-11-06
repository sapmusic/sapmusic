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
    // 1. Create a Supabase client with the Auth context of the user invoking the function.
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 2. Check if the user is authenticated and is an admin.
    const { data: { user } } = await userSupabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: adminProfile, error: profileError } = await userSupabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Permission denied. Admin role required.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // 3. If the user is an admin, fetch all users from auth using pagination.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    let allUsers = [];
    let page = 1;
    const perPage = 1000; // Supabase Auth admin API max limit per page

    while (true) {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
            page: page,
            perPage: perPage,
        });

        if (error) {
            console.error('Error listing users:', error.message);
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (users && users.length > 0) {
            allUsers = allUsers.concat(users);
        }
        
        // If we received fewer users than the page limit, we've reached the end.
        if (!users || users.length < perPage) {
            break;
        }
        
        page++;
    }


    // 4. Return the complete list of users.
    return new Response(JSON.stringify({ users: allUsers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Function error:', err.message);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})