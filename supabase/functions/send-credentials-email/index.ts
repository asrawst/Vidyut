import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { inspectorEmail, inspectorName, redirectTo } = await req.json()

    if (!inspectorEmail || !inspectorName) {
      return new Response(
        JSON.stringify({ error: 'inspectorEmail and inspectorName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use the service role key — has admin privileges, safe only in Edge Functions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // inviteUserByEmail creates the auth account if it doesn't exist
    // and sends an invite email with a magic link to set password
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      inspectorEmail,
      {
        redirectTo: redirectTo || 'https://vidyut-dexter.vercel.app/inspector-portal',
        data: { display_name: inspectorName, role: 'inspector' }
      }
    )

    if (error) {
      console.error('Admin invite error:', error.message)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, userId: data.user?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
