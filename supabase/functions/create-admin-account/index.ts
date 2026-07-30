import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const allowedOrigin = Deno.env.get('FRONTEND_ORIGIN') || '*'

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const adminSupabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

serve(async (req) => {
  const executionId = crypto.randomUUID()
  let organizationId: string | null = null
  let authUserId: string | null = null

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, 405)
  }

  if (!adminSupabase) {
    console.error(`[${executionId}] Missing Supabase service configuration`)
    return json({ success: false, error: 'Server configuration error' }, 500)
  }

  try {
    let body: {
      churchName?: unknown
      fullName?: unknown
      email?: unknown
      password?: unknown
      emailRedirectTo?: unknown
    }

    try {
      body = await req.json()
    } catch {
      return json({ success: false, error: 'Invalid JSON in request body' }, 400)
    }

    const churchName = normalizeString(body.churchName)
    const fullName = normalizeString(body.fullName)
    const email = normalizeString(body.email).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''
    const emailRedirectTo = normalizeString(body.emailRedirectTo)

    if (!churchName || !fullName || !email || !password) {
      return json({ success: false, error: 'All fields are required' }, 400)
    }

    if (churchName.length < 2 || churchName.length > 120) {
      return json({ success: false, error: 'Church name must be between 2 and 120 characters' }, 400)
    }

    if (!/^[\p{L}\p{N}\s.'&()/-]+$/u.test(churchName)) {
      return json({ success: false, error: 'Church name contains unsupported characters' }, 400)
    }

    if (fullName.length < 2 || fullName.length > 120) {
      return json({ success: false, error: 'Full name must be between 2 and 120 characters' }, 400)
    }

    if (!isValidEmail(email)) {
      return json({ success: false, error: 'Please enter a valid email address' }, 400)
    }

    if (password.length < 6) {
      return json({ success: false, error: 'Password must be at least 6 characters' }, 400)
    }

    const slug = createSlug(churchName)
    if (!slug) {
      return json({ success: false, error: 'Church name must contain letters or numbers' }, 400)
    }

    const { data: existingOrganization, error: existingOrganizationError } =
      await adminSupabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

    if (existingOrganizationError) {
      console.error(`[${executionId}] Organization slug lookup failed`, existingOrganizationError)
      return json({ success: false, error: 'Unable to validate organization name' }, 500)
    }

    if (existingOrganization) {
      return json({ success: false, error: 'An organization with this name already exists' }, 409)
    }

    const { data: organization, error: organizationError } = await adminSupabase
      .from('organizations')
      .insert({ name: churchName, slug, paystack_connected: false })
      .select('id, name, slug')
      .single()

    if (organizationError || !organization) {
      console.error(`[${executionId}] Organization creation failed`, organizationError)
      return json({ success: false, error: 'Unable to create organization' }, 500)
    }

    organizationId = organization.id

    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          full_name: fullName,
          role: 'admin',
          organization_id: organization.id,
        },
        app_metadata: {
          role: 'admin',
          organization_id: organization.id,
        },
      })

    if (authError || !authData.user) {
      console.error(`[${executionId}] Auth user creation failed`, authError)
      await adminSupabase.from('organizations').delete().eq('id', organization.id)
      return json({ success: false, error: authError?.message || 'Unable to create admin account' }, 400)
    }

    authUserId = authData.user.id

    const { error: profileError } = await adminSupabase
      .from('users')
      .insert({
        id: authData.user.id,
        organization_id: organization.id,
        role: 'admin',
        full_name: fullName,
        email,
      })

    if (profileError?.code === '23505') {
      const { error: profileUpdateError } = await adminSupabase
        .from('users')
        .update({
          organization_id: organization.id,
          role: 'admin',
          full_name: fullName,
          email,
        })
        .eq('id', authData.user.id)

      if (profileUpdateError) {
        console.error(`[${executionId}] Trigger-created admin profile update failed`, profileUpdateError)

        const { error: deleteProfileError } = await adminSupabase
          .from('users')
          .delete()
          .eq('id', authData.user.id)
        const { error: deleteUserError } =
          await adminSupabase.auth.admin.deleteUser(authData.user.id)
        const { error: deleteOrganizationError } = await adminSupabase
          .from('organizations')
          .delete()
          .eq('id', organization.id)

        if (deleteProfileError || deleteUserError || deleteOrganizationError) {
          console.error(`[${executionId}] Rollback after profile update failure was incomplete`, {
            deleteProfileError,
            deleteUserError,
            deleteOrganizationError,
          })
        }

        return json({ success: false, error: 'Unable to create admin profile' }, 500)
      }
    } else if (profileError) {
      console.error(`[${executionId}] Admin profile creation failed`, profileError)

      await adminSupabase.from('users').delete().eq('id', authData.user.id)
      const { error: deleteUserError } =
        await adminSupabase.auth.admin.deleteUser(authData.user.id)
      const { error: deleteOrganizationError } = await adminSupabase
        .from('organizations')
        .delete()
        .eq('id', organization.id)

      if (deleteUserError || deleteOrganizationError) {
        console.error(`[${executionId}] Rollback after profile failure was incomplete`, {
          deleteUserError,
          deleteOrganizationError,
        })
      }

      return json({ success: false, error: 'Unable to create admin profile' }, 500)
    }

    const { error: resendError } = await adminSupabase.auth.resend({
      type: 'signup',
      email,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    })

    if (resendError) {
      console.error(`[${executionId}] Confirmation email failed`, resendError)

      const { error: deleteProfileError } = await adminSupabase
        .from('users')
        .delete()
        .eq('id', authData.user.id)
      const { error: deleteUserError } =
        await adminSupabase.auth.admin.deleteUser(authData.user.id)
      const { error: deleteOrganizationError } = await adminSupabase
        .from('organizations')
        .delete()
        .eq('id', organization.id)

      if (deleteProfileError || deleteUserError || deleteOrganizationError) {
        console.error(`[${executionId}] Rollback after confirmation email failure was incomplete`, {
          deleteProfileError,
          deleteUserError,
          deleteOrganizationError,
        })
      }

      return json({ success: false, error: 'Unable to send confirmation email' }, 500)
    }

    return json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        organization,
        emailRedirectTo,
      },
    })
  } catch (error) {
    console.error(`[${executionId}] Unexpected admin signup error`, error)

    if (authUserId) {
      const { error: cleanupAuthError } =
        await adminSupabase.auth.admin.deleteUser(authUserId)
      if (cleanupAuthError) {
        console.error(`[${executionId}] Auth cleanup failed`, cleanupAuthError)
      }
    }

    if (organizationId) {
      const { error: cleanupOrganizationError } = await adminSupabase
        .from('organizations')
        .delete()
        .eq('id', organizationId)
      if (cleanupOrganizationError) {
        console.error(`[${executionId}] Organization cleanup failed`, cleanupOrganizationError)
      }
    }

    return json({ success: false, error: 'An error occurred during account setup.' }, 500)
  }
})
