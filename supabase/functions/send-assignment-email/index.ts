import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const payload = await req.json()
  
  // Verify that the inspector assignment changed
  const oldInspector = payload.old_record?.assigned_inspector_id
  const newInspector = payload.record?.assigned_inspector_id
  
  if (newInspector && newInspector !== oldInspector) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    // Fetch inspector's email profile
    const fetchInspector = await fetch(`${supabaseUrl}/rest/v1/inspectors?id=eq.${newInspector}&select=email,display_name`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })
    const [inspector] = await fetchInspector.json()

    if (inspector?.email) {
      // Send email notification via Resend
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Vidyut Portal <no-reply@vidyut.com>',
          to: inspector.email,
          subject: 'New Electricity Audit Inspection Assigned',
          html: `
            <h3>Hello ${inspector.display_name},</h3>
            <p>You have been assigned a new field audit inspection task.</p>
            <ul>
              <li><strong>Consumer ID:</strong> ${payload.record.consumer_id}</li>
              <li><strong>Risk Level:</strong> ${payload.record.risk_class}</li>
              <li><strong>Substation Zone:</strong> Sector 5 West</li>
            </ul>
            <p>Please log into your <a href="https://vidyut-portal.vercel.app">Vidyut Inspector Portal</a> to initiate the inspection.</p>
            <br/>
            <p>Best Regards,</p>
            <p>Vidyut Operations Team</p>
          `
        })
      })
      
      return new Response(JSON.stringify({ sent: true }), { headers: { 'Content-Type': 'application/json' } })
    }
  }

  return new Response(JSON.stringify({ sent: false }), { headers: { 'Content-Type': 'application/json' } })
})
