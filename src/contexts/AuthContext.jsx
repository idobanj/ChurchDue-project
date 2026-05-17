import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthContext = createContext({})

// Helper function to create a promise that rejects after a timeout
const timeoutPromise = (ms) => new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Operation timed out')), ms)
)

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    // Function to create a promise that rejects after a timeout
    const timeoutPromise = (ms) => new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    )

    async function fetchUserProfile(userId) {
      try {
        console.log('[FETCH_PROFILE_START] Fetching profile for userId:', userId)
        // Use Promise.race to implement timeout
        const result = await Promise.race([
          supabase
            .from('users')
            .select('id, role, organization_id, full_name, email')
            .eq('id', userId)
            .limit(1),
          timeoutPromise(5000) // 5 second timeout
        ])

        const { data, error } = result

        if (error) {
          console.log('[FETCH_PROFILE_ERROR] Error for userId:', userId, 'error:', error)
          return null
        }

        if (!data || data.length === 0) {
          console.log('[FETCH_PROFILE_NO_DATA] No data found for userId:', userId)
          return null
        }

        // Take the first (and only) item
        const profile = data[0]
        console.log('[FETCH_PROFILE_SUCCESS] Found profile for userId:', userId, 'data:', profile)
        return profile
      } catch (err) {
        console.log('[FETCH_PROFILE_EXCEPTION] Exception for userId:', userId, 'error:', err)
        return null
      }
    }

    async function getUserOrganization(userId) {
      console.log('[GET_ORG_START] Getting organization for userId:', userId)
      try {
        console.log('[GET_ORG_USER_PROFILE] Checking users table for organization_id:', userId)
        const { data: profile, error } = await Promise.race([
          supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .limit(1),
          timeoutPromise(5000) // 5 second timeout
        ])

        if (error) {
          console.log('[GET_ORG_USER_PROFILE_ERROR] Error checking users table:', error)
        } else if (profile && profile.length > 0) {
          console.log('[GET_ORG_USER_PROFILE_FOUND] Found organization for user:', profile[0].organization_id)
          return profile[0].organization_id
        } else {
          console.log('[GET_ORG_USER_PROFILE_NONE] No organization found in users table for userId:', userId)
        }
      } catch (err) {
        console.log('[GET_ORG_USER_PROFILE_EXCEPTION] Exception checking users table:', err)
      }

      console.log('[GET_ORG_COMPLETE] Could not find organization ID for userId:', userId)
      return null
    }

    async function initializeUser(userId) {
      console.log('[INIT_USER_START] Initializing user for userId:', userId)

      // First try to get profile from database
      let profile = null
      try {
        profile = await fetchUserProfile(userId)
      } catch (err) {
        console.log('[INIT_USER_FETCH_EXCEPTION] Exception in fetchUserProfile:', err)
      }

      if (profile) {
        console.log('[INIT_USER_PROFILE_FOUND] Using profile from database:', profile)
        if (mounted) {
          console.log('[INIT_USER_SETTING_USER] Setting user from profile')
          setUser(profile)
        }
        console.log('[INIT_USER_END] Returning profile')
        return profile
      }

      // If no profile found, try to get organization ID from other sources
      console.log('[INIT_USER_NO_PROFILE] No profile found in database, trying to find organization...')
      let organization_id = null
      try {
        organization_id = await getUserOrganization(userId)
      } catch (err) {
        console.log('[INIT_USER_GET_ORG_EXCEPTION] Exception in getUserOrganization:', err)
      }

      if (organization_id) {
        // Create a user object with the organization ID we found
        const userData = {
          id: userId,
          email: '', // We'll try to get this from session later
          full_name: '',
          role: undefined,
          organization_id: organization_id
        }
        console.log('[INIT_USER_ORG_FOUND] Created user object with found organization_id:', userData)
        if (mounted) {
          console.log('[INIT_USER_SETTING_USER_ORG] Setting user from organization data')
          setUser(userData)
        }
        console.log('[INIT_USER_END] Returning user data from organization')
        return userData
      }

      // If we still don't have organization info, we'll have to rely on session metadata
      console.log('[INIT_USER_NO_ORG] Could not find organization ID from any source')
      console.log('[INIT_USER_END] Returning null')
      return null
    }

    async function initAuth() {
      try {
        console.log('[INIT_AUTH_START] Getting session')
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise(5000) // 5 second timeout
        ])
        console.log('[INIT_AUTH_SESSION] Session from getSession:', session)

        if (mounted && session?.user) {
          console.log('[INIT_AUTH_USER_FOUND] Session user id:', session.user.id)
          const userId = session.user.id
          console.log('[INIT_AUTH_CALLING_INIT] Calling initializeUser with userId:', userId)
          const userData = await initializeUser(userId)

          if (userData) {
            // Merge with session info to get email and other details
            const finalUser = {
              ...userData,
              email: session.user.email || userData.email || '',
              full_name: session.user.user_metadata?.full_name || userData.full_name || '',
              role: session.user.user_metadata?.role || userData.role || undefined
            }
            console.log('[INIT_AUTH_FINAL_USER] Final user object:', finalUser)
            if (mounted) {
              console.log('[INIT_AUTH_SETTING_USER] Setting user from final object')
              setUser(finalUser)
            }
          } else {
            // Fallback to basic user info from session
            const userMetadata = session.user.user_metadata || {}
            const fallbackUser = {
              id: session.user.id,
              email: session.user.email,
              full_name: userMetadata.full_name || '',
              role: userMetadata.role || undefined,
              organization_id: userMetadata.organization_id || undefined
            }
            console.log('[INIT_AUTH_FALLBACK_USER] Using fallback user from session metadata:', fallbackUser)
            if (mounted) {
              console.log('[INIT_AUTH_SETTING_USER_FALLBACK] Setting user from fallback')
              setUser(fallbackUser)
            }
          }
        } else if (mounted) {
          console.log('[INIT_AUTH_NO_USER] No session or user found')
          if (mounted) {
            console.log('[INIT_AUTH_SETTING_NULL] Setting user to null')
            setUser(null)
          }
        }
      } catch (err) {
        console.log('[INIT_AUTH_EXCEPTION] Exception in initAuth:', err)
      } finally {
        if (mounted) {
          console.log('[INIT_AUTH_FINALLY] Setting loading to false')
          setLoading(false)
        }
      }
    }

    console.log('[EFFECT_START] Running useEffect')
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH_STATE_CHANGE_START] Auth state change event:', event, 'session:', session)
      if (session?.user && mounted) {
        console.log('[AUTH_STATE_CHANGE_USER_FOUND] Session user id:', session.user.id)
        const userId = session.user.id
        console.log('[AUTH_STATE_CHANGE_CALLING_INIT] Calling initializeUser with userId:', userId)
        const userData = await initializeUser(userId)

        if (userData) {
          // Merge with session info to get email and other details
          const finalUser = {
            ...userData,
            email: session.user.email || userData.email || '',
            full_name: session.user.user_metadata?.full_name || userData.full_name || '',
            role: session.user.user_metadata?.role || userData.role || undefined
          }
          console.log('[AUTH_STATE_CHANGE_FINAL_USER] Final user object from auth state change:', finalUser)
          if (mounted) {
            console.log('[AUTH_STATE_CHANGE_SETTING_USER] Setting user from final object')
            setUser(finalUser)
          }
        } else {
          // Fallback to basic user info from session
          const userMetadata = session.user.user_metadata || {}
          const fallbackUser = {
            id: session.user.id,
            email: session.user.email,
            full_name: userMetadata.full_name || '',
            role: userMetadata.role || undefined,
            organization_id: userMetadata.organization_id || undefined
          }
          console.log('[AUTH_STATE_CHANGE_FALLBACK_USER] Using fallback user from session metadata:', fallbackUser)
          if (mounted) {
            console.log('[AUTH_STATE_CHANGE_SETTING_USER_FALLBACK] Setting user from fallback')
            setUser(fallbackUser)
          }
        }
      } else if (mounted) {
        console.log('[AUTH_STATE_CHANGE_NO_USER] No session or user, setting user to null')
        setUser(null)
      }
    })

    return () => {
      mounted = false
      console.log('[EFFECT_CLEANUP] Cleaning up effect')
      subscription.unsubscribe()
    }
  }, [])

  async function signUp(email, password, fullName, churchName) {
    try {
      console.log('[SIGN_UP_START] Signup process for:', email)
      const { data, error: authError } = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        }),
        timeoutPromise(10000) // 10 second timeout for sign up
      ])

      if (authError) {
        console.log('[SIGN_UP_ERROR] SignUp Error:', authError)
        throw authError
      }

      if (data.user) {
        console.log('[SIGN_UP_USER_CREATED] Auth user created, calling create_organization RPC...')
        const { data: orgData, error: orgError } = await Promise.race([
          supabase.rpc('create_organization', {
            p_name: churchName,
            p_admin_id: data.user.id,
            p_admin_name: fullName,
          }),
          timeoutPromise(10000) // 10 second timeout for RPC
        ])

        if (orgError) {
          console.log('[SIGN_UP_ORG_ERROR] RPC create_organization Error:', orgError)
          throw orgError
        }
        console.log('[SIGN_UP_ORG_RESULT] RPC create_organization returned:', orgData);

        // Extract organization ID from RPC response
        let organization_id = null;
        if (typeof orgData === 'number') {
          organization_id = orgData;
          console.log('[SIGN_UP_ORG_ID_NUMBER] Organization ID is a number:', organization_id);
        } else if (orgData && typeof orgData === 'object') {
          // Try to extract ID from common field names
          organization_id = orgData.id || orgData.organization_id || orgData.org_id;
          console.log('[SIGN_UP_ORG_ID_OBJECT] Organization ID extracted from object:', organization_id);
        } else {
          console.log('[SIGN_UP_ORG_ID_UNKNOWN] Organization data is neither number nor object:', orgData);
        }

        if (organization_id === null) {
          console.log('[SIGN_UP_ORG_ID_NULL] Could not extract organization ID from RPC response:', orgData);
          console.log('[SIGN_UP_SKIP_PROFILE] Skipping profile creation due to missing organization ID');
        } else {
          console.log('[SIGN_UP_CREATING_PROFILE] Creating user profile with organization_id:', organization_id);

          const { error: profileError } = await Promise.race([
            supabase
              .from('users')
              .insert({
                id: data.user.id,
                organization_id: organization_id,
                full_name: fullName,
                email: data.user.email,
                role: 'admin',
              }),
            timeoutPromise(5000) // 5 second timeout for profile creation
          ])

          if (profileError) {
            console.log('[SIGN_UP_PROFILE_ERROR] Error creating user profile:', profileError)
            // Continue anyway since auth user and organization were created successfully
          } else {
            console.log('[SIGN_UP_PROFILE_SUCCESS] User profile created successfully');
          }
        }
        console.log('[SIGN_UP_ORG_DONE] Organization processed:', orgData);
      }

      console.log('[SIGN_UP_END] Returning sign up result')
      return { data, error: null }
    } catch (error) {
      console.log('[SIGN_UP_EXCEPTION] Signup process error:', error)
      return { data: null, error: error instanceof Error ? error : { message: String(error) } }
    }
  }

  async function signIn(email, password) {
    try {
      console.log('[SIGN_IN_START] Sign in attempt for:', email)
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        timeoutPromise(10000) // 10 second timeout for sign in
      ])

      if (error) {
        console.log('[SIGN_IN_ERROR] Sign in error:', error)
        throw error
      }

      console.log('[SIGN_IN_SUCCESS] Sign in successful, data:', data)

      // Update user state with the session data
      if (mounted) {
        console.log('[SIGN_IN_USER_ID] Session user id:', data.user.id)
        const userId = data.user.id
        const userData = await initializeUser(userId)

        if (userData) {
          // Merge with session info to get email and other details
          const finalUser = {
            ...userData,
            email: data.user.email || userData.email || '',
            full_name: data.user.user_metadata?.full_name || userData.full_name || '',
            role: data.user.user_metadata?.role || data.user.role || undefined
          }
          console.log('[SIGN_IN_FINAL_USER] Final user object after sign in:', finalUser)
          setUser(finalUser)
        } else {
          // Fallback to basic user info from session
          const userMetadata = data.user.user_metadata || {}
          const fallbackUser = {
            id: data.user.id,
            email: data.user.email,
            full_name: userMetadata.full_name || '',
            role: userMetadata.role || undefined,
            organization_id: userMetadata.organization_id || undefined
          }
          console.log('[SIGN_IN_FALLBACK_USER] Using fallback user from metadata after sign in:', fallbackUser)
          setUser(fallbackUser)
        }
      }

      console.log('[SIGN_IN_END] Returning sign in result')
      return { data, error: null }
    } catch (error) {
      console.log('[SIGN_IN_EXCEPTION] Sign in process error:', error)
      return { data: null, error: error instanceof Error ? error : { message: String(error) } }
    }
  }

  async function signOut() {
    try {
      console.log('[SIGN_OUT_START] Sign out initiated')
      await supabase.auth.signOut()
    } catch (error) {
      console.log('[SIGN_OUT_ERROR] Error signing out:', error)
    }
    setUser(null)
    console.log('[SIGN_OUT_END] User state cleared after sign out')
  }

  async function resetPassword(email) {
    try {
      console.log('[RESET_PASSWORD_START] Requesting password reset for:', email)
      const { data, error } = await Promise.race([
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
        timeoutPromise(5000) // 5 second timeout
      ])

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.log('[RESET_PASSWORD_ERROR] Reset password error:', error)
      return { data: null, error }
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}