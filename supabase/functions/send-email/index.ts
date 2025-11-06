// FIX: Add a type declaration for the Deno global object to satisfy the TypeScript linter,
// which doesn't have Deno's native types available.
declare const Deno: any;

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend'

// FIX: Added CORS headers to allow requests from the browser client.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};


// Initialize Resend with the API key from environment variables
// Make sure to set RESEND_API_KEY in your Supabase project's secrets
const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)

// Define email templates based on status
const templates = {
  active: {
    subject: "Your Song Registration has been Approved!",
    body: (name: string, songTitle: string) => `Hi ${name},\n\nGreat news! Your song "${songTitle}" has been reviewed and approved. It is now active in our system.\n\nYou can view your agreement in your dashboard.\n\nBest regards,\nThe Sap Music Group Team`
  },
  rejected: {
    subject: "Update on Your Song Registration",
    body: (name: string, songTitle: string) => `Hi ${name},\n\nWe have reviewed your registration for "${songTitle}". Unfortunately, we are unable to approve it at this time. Please check your dashboard for more details or contact support if you have any questions.\n\nBest regards,\nThe Sap Music Group Team`
  },
  expired: {
    subject: "Your Song Agreement has Expired",
    body: (name: string, songTitle: string) => `Hi ${name},\n\nThis is a notification that your publishing agreement for the song "${songTitle}" has expired. Please log in to your dashboard to review the details and take any necessary action.\n\nBest regards,\nThe Sap Music Group Team`
  },
  pending_admin_notification: {
    subject: "A Song is Awaiting Your Approval",
    body: (adminName: string, songTitle: string) => `Hi ${adminName},\n\nThe song ${songTitle} has been submitted for approval and is awaiting your review in the dashboard.\n\nBest regards,\nThe Sap Music Group System`
  },
  // Default/fallback template
  default: {
    subject: "Update on your song registration",
    body: (name: string, songTitle: string) => `Hi ${name},\n\nThere has been an update regarding your song "${songTitle}". Please log in to your dashboard for more details.\n\nBest regards,\nThe Sap Music Group Team`
  }
}

serve(async (req: Request) => {
  // FIX: Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, songTitle, newStatus } = await req.json()

    // Validate payload
    if (!userEmail || !userName || !songTitle || !newStatus) {
      return new Response(JSON.stringify({ error: 'Missing required fields in request body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Select the appropriate template
    const template = templates[newStatus as keyof typeof templates] || templates.default;

    const { data, error } = await resend.emails.send({
      from: 'Sap Music Group <onboarding@resend.dev>', // FIX: Use a valid Resend test domain. Replace with your verified domain in production.
      to: [userEmail],
      subject: template.subject,
      text: template.body(userName, songTitle),
    });

    if (error) {
      console.error('Resend API error:', error);
      return new Response(JSON.stringify({ error }), { // FIX: Send the error object for better debugging.
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Function error:', err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})