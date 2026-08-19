import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate a strong random password: Vidyut + 4 digits + special char
function generatePassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000)
  const specials = ['@', '#', '!', '$', '&']
  const special = specials[Math.floor(Math.random() * specials.length)]
  const upper = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  return `Vidyut${digits}${special}${upper}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { inspectorEmail, inspectorName } = await req.json()

    if (!inspectorEmail || !inspectorName) {
      return new Response(
        JSON.stringify({ error: 'inspectorEmail and inspectorName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const password = generatePassword()
    const portalUrl = 'https://vidyut-dexter.vercel.app/'

    // Step 1: Check if user already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u: any) => u.email === inspectorEmail)

    let userId: string

    if (existingUser) {
      // Update password for existing auth user
      const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password, email_confirm: true }
      )
      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Failed to update credentials: ${updateError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userId = existingUser.id
    } else {
      // Create new auth user with generated password
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: inspectorEmail,
        password,
        email_confirm: true,  // Skip email confirmation — credentials sent directly
        user_metadata: { display_name: inspectorName, role: 'inspector' }
      })
      if (createError) {
        return new Response(
          JSON.stringify({ error: `Failed to create account: ${createError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userId = created.user.id
    }

    // Step 2: Send credentials email via Resend
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY secret not set in edge function. Please add it via Supabase dashboard.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Vidyut Inspector Portal Access</title></head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#141414;border-radius:12px;overflow:hidden;border:1px solid rgba(200,162,97,0.2);">
          <div style="background:linear-gradient(135deg,#1a1208,#2a1f0e);padding:32px;text-align:center;border-bottom:1px solid rgba(200,162,97,0.2);">
            <h1 style="color:#c8a261;margin:0;font-size:1.6rem;letter-spacing:2px;">⚡ VIDYUT</h1>
            <p style="color:rgba(255,255,255,0.5);margin:6px 0 0;font-size:0.85rem;letter-spacing:1px;">ELECTRICITY THEFT DETECTION SYSTEM</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#ffffff;font-size:1.2rem;margin:0 0 8px;">Hello, Inspector ${inspectorName}</h2>
            <p style="color:rgba(255,255,255,0.6);font-size:0.9rem;line-height:1.6;margin:0 0 24px;">
              Your Field Inspector Portal account has been created. Use the credentials below to log in.
            </p>
            <div style="background:#0a0a0a;border:1px solid rgba(200,162,97,0.3);border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 12px;"><span style="color:rgba(255,255,255,0.4);font-size:0.8rem;display:block;margin-bottom:4px;">LOGIN EMAIL</span><strong style="color:#ffffff;font-size:1rem;">${inspectorEmail}</strong></p>
              <p style="margin:0;"><span style="color:rgba(255,255,255,0.4);font-size:0.8rem;display:block;margin-bottom:4px;">TEMPORARY PASSWORD</span><strong style="color:#c8a261;font-size:1.1rem;letter-spacing:2px;">${password}</strong></p>
            </div>
            <a href="${portalUrl}" style="display:block;text-align:center;background:#c8a261;color:#000;padding:14px 24px;border-radius:8px;font-weight:700;text-decoration:none;font-size:0.95rem;margin-bottom:24px;">
              Login to Inspector Portal →
            </a>
            <p style="color:rgba(255,255,255,0.35);font-size:0.78rem;line-height:1.5;margin:0;text-align:center;">
              Please change your password after your first login.<br/>Do not share these credentials with anyone.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // NOTE: Resend free plan only allows sending to your own verified email.
    // ADMIN_EMAIL env var is your verified Resend email (as.singhaditya08@gmail.com).
    // Once you verify a domain on resend.com/domains, remove ADMIN_EMAIL and use `to: inspectorEmail` directly.
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'as.singhaditya08@gmail.com'
    const sendTo = ADMIN_EMAIL  // Change to `inspectorEmail` after domain verification

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Vidyut Portal <onboarding@resend.dev>',
        to: sendTo,
        subject: `Inspector Credentials Generated — ${inspectorName} (${inspectorEmail})`,
        html: emailHtml
      })
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error('Resend error:', resendData)
      return new Response(
        JSON.stringify({ error: `Email delivery failed: ${resendData.message || JSON.stringify(resendData)}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, userId, emailId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: `Internal error: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
