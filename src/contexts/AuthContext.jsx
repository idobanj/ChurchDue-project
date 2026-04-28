import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    async function fetchUserProfile(userId) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, role, organization_id, full_name, email')
          .eq('id', userId)
          .single()

        if (error || !data) {
          return null
        }
        return data
      } catch {
        return null
      }
    }

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (mounted && session?.user) {
          const profile = await fetchUserProfile(session.user.id)
          if (mounted) {
            setUser(profile || { id: session.user.id, email: session.user.email })
          }
        }
      } catch (err) {
        console.warn('Supabase connection warning:', err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && mounted) {
        const profile = await fetchUserProfile(session.user.id)
        if (mounted) {
          setUser(profile || { id: session.user.id, email: session.user.email })
        }
      } else if (mounted) {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signUp(email, password, fullName, churchName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        const { error: orgError } = await supabase.rpc('create_organization', {
          p_name: churchName,
          p_admin_id: data.user.id,
          p_admin_name: fullName,
        })

        if (orgError) throw orgError
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
    setUser(null)
  }

  async function resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

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
