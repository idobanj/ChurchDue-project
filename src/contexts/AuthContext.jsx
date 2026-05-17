import { createContext, useContext, useState, useEffect, useRef } from 'react'
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
  
  // Use a ref so ALL functions inside this component can check if it's safe to update state
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    async function fetchUserProfile(userId) {
      try {
        console.log('[FETCH_PROFILE_START] Fetching profile for userId:', userId)
        const result = await Promise.race([
          supabase
            .from('users')
            .select('id, role, organization_id, full_name, email')
            .eq('id', userId)
            .limit(1),
          timeoutPromise(5000)
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
        const { data: profile, error } = await Promise.race([
          supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .limit(1),
          timeoutPromise(5000)
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

      let profile = null
      try {
        profile = await fetchUserProfile(userId)
      } catch (err) {
        console.log('[INIT_USER_FETCH_EXCEPTION] Exception in fetchUserProfile:', err)
      }

      if (profile) {
        console.log('[INIT_USER_PROFILE_FOUND] Using profile from database:', profile)
        if (isMounted.current) {
          console.log('[INIT_USER_SETTING_USER] Setting user from profile')
          setUser(profile)
        }
        return profile
      }

      console.log('[INIT_USER_NO_PROFILE] No profile found in database, trying to find organization...')
      let organization_id = null
      try {
        organization_id = await getUserOrganization(userId)
      } catch (err) {
        console.log('[INIT_USER_GET_ORG_EXCEPTION] Exception in getUserOrganization:', err)
      }

      if (organization_id) {
        const userData = {
          id: userId,
          email: '', 
          full_name: '',
          role: undefined,
          organization_id: organization_id
        }
        console.log('[INIT_USER_ORG_FOUND] Created user object with found organization_id:', userData)
        if (isMounted.current) {
          console.log('[INIT_USER_SETTING_USER_ORG] Setting user from organization data')
          setUser(userData)
        }
        return userData
      }

      console.log('[INIT_USER_NO_ORG] Could not find organization ID from any source')
      return null
    }

    async function initAuth() {
      try {
        console.log('[INIT_AUTH_START] Getting session')
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise(5000)
        ])
        console.log('[INIT_AUTH_SESSION] Session from getSession:', session)

        if (isMounted.current && session?.user) {
          const userId = session.user.id
          const userData = await initializeUser(userId)

          if (userData) {
            const finalUser = {
              ...userData,
              email: session.user.email || userData.email || '',
              full_name: session.user.user_metadata?.full_name || userData.full_name || '',
              role: session.user.user_metadata?.role || userData.role || undefined
            }
            if (isMounted.current) {
              setUser(finalUser)
            }
          } else {
            const userMetadata = session.user.user_metadata || {}
            const fallbackUser = {
              id: session.user.id,
              email: session.user.email,
              full_name: userMetadata.full_name || '',
              role: userMetadata.role || undefined,
              organization_id: userMetadata.organization_id || undefined
            }
            if (isMounted.current) {
              setUser(fallbackUser)
            }
          }
        } else if (isMounted.current) {
          setUser(null)
        }
      } catch (err) {
        console.log('[INIT_AUTH_EXCEPTION] Exception in initAuth:', err)
      } finally {
        if (isMounted.current) {
          setLoading(false)
        }
      }
    }

    console.log('[EFFECT_START] Running useEffect')
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH_STATE_CHANGE_START] Auth state change event:', event, 'session:', session)
      if (session?.user && isMounted.current) {
        const userId = session.user.id
        const userData = await initializeUser(userId)

        if (userData) {
          const finalUser = {
            ...userData,
            email: session.user.email || userData.email || '',
            full_name: session.user.user_metadata?.full_name || userData.full_name || '',
            role: session.user.user_metadata?.role || userData.role || undefined
          }
          if (isMounted.current) {
            setUser(finalUser)
          }
        } else {
          const userMetadata = session.user.user_metadata || {}
          const fallbackUser = {
            id: session.user.id,
            email: session.user.email,
            full_name: userMetadata.full_name || '',
            role: userMetadata.role || undefined,
            organization_id: userMetadata.organization_id || undefined
          }
          if (isMounted.current) {
            setUser(fallbackUser)
          }
        }
      } else if (isMounted.current) {
        setUser(null)
      }
    })

    return () => {
      isMounted.current = false
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
          options: { data: { full_name: fullName } },
        }),
        timeoutPromise(10000)
      ])

      if (authError) throw authError

      if (data.user) {
        const { data: orgData, error: orgError } = await Promise.race([
          supabase.rpc('create_organization', {
            p_name: churchName,
            p_admin_id: data.user.id,
            p_admin_name: fullName,
          }),
          timeoutPromise(10000)
        ])

        if (orgError) throw orgError

        let organization_id = null;
        if (typeof orgData === 'number') {
          organization_id = orgData;
        } else if (orgData && typeof orgData === 'object') {
          organization_id = orgData.id || orgData.organization_id || orgData.org_id;
        }

        if (organization_id !== null) {
          await Promise.race([
            supabase
              .from('users')
              .insert({
                id: data.user.id,
                organization_id: organization_id,
                full_name: fullName,
                email: data.user.email,
                role: 'admin',
              }),
            timeoutPromise(5000)
          ])
        }
      }

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
        supabase.auth.signInWithPassword({ email, password }),
        timeoutPromise(10000)
      ])

      if (error) throw error

      // FIXED HERE: Replaced 'mounted' with 'isMounted.current' which works flawlessly across context methods
      if (isMounted.current) {
        const userId = data.user.id
        
        // This triggers initializeUser safely
        const userData = await Promise.race([
          supabase
            .from('users')
            .select('id, role, organization_id, full_name, email')
            .eq('id', userId)
            .limit(1),
          timeoutPromise(5000)
        ])

        const profile = userData.data?.[0]

        if (profile) {
          const finalUser = {
            ...profile,
            email: data.user.email || profile.email || '',
            full_name: data.user.user_metadata?.full_name || profile.full_name || '',
            role: data.user.user_metadata?.role || profile.role || undefined
          }
          setUser(finalUser)
        } else {
          const userMetadata = data.user.user_metadata || {}
          const fallbackUser = {
            id: data.user.id,
            email: data.user.email,
            full_name: userMetadata.full_name || '',
            role: userMetadata.role || undefined,
            organization_id: userMetadata.organization_id || undefined
          }
          setUser(fallbackUser)
        }
      }

      return { data, error: null }
    } catch (error) {
      console.log('[SIGN_IN_EXCEPTION] Sign in process error:', error)
      return { data: null, error: error instanceof Error ? error : { message: String(error) } }
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.log('[SIGN_OUT_ERROR] Error signing out:', error)
    }
    setUser(null)
  }

  async function resetPassword(email) {
    try {
      const { data, error } = await Promise.race([
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
        timeoutPromise(5000)
      ])
      if (error) throw error
      return { data, error: null }
    } catch (error) {
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