import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Always prefer the production Vercel URL so redirect works regardless of origin
    const portalUrl = 'https://vidyut-dexter.vercel.app/inspector-portal'

    // Try invite first (works for new users)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      inspectorEmail,
      { redirectTo: portalUrl, data: { display_name: inspectorName, role: 'inspector' } }
    )

    if (!inviteError) {
      // Invite sent successfully
      return new Response(
        JSON.stringify({ success: true, method: 'invite', userId: inviteData.user?.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If user already exists in auth, generate a password reset link instead
    if (inviteError.message?.toLowerCase().includes('already') || inviteError.message?.toLowerCase().includes('registered')) {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: inspectorEmail,
        options: { redirectTo: portalUrl }
      })

      if (linkError) {
        console.error('Generate link error:', linkError.message)
        return new Response(
          JSON.stringify({ error: linkError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Send the reset link via Resend
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
      if (RESEND_API_KEY && linkData?.properties?.action_link) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: 'Vidyut Portal <no-reply@vidyut.com>',
            to: inspectorEmail,
            subject: 'Your Vidyut Inspector Portal Access',
            html: `
              <h2>Hello ${inspectorName},</h2>
              <p>Your login credentials for the Vidyut Inspector Portal have been updated.</p>
              <p><a href="${linkData.properties.action_link}" style="background:#c8a261;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Set Your Password & Login</a></p>
              <p>This link expires in 24 hours.</p>
              <br/><p>— Vidyut Operations Team</p>
            `
          })
        })
      }

      return new Response(
        JSON.stringify({ success: true, method: 'recovery' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Any other invite error
    console.error('Invite error:', inviteError.message)
    return new Response(
      JSON.stringify({ error: inviteError.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: `Internal error: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
