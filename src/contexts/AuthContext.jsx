/** @format */

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({});

const timeoutPromise = (ms) =>
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), ms),
    );

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const isMounted = useRef(true);

    const refreshUser = async (currentSession = null) => {
        try {
            let session = currentSession;
            if (!session) {
                const { data } = await supabase.auth.getSession();
                session = data.session;
            }

            if (!session?.user) {
                if (isMounted.current) setUser(null);
                return null;
            }

            const userId = session.user.id;
            console.log('[REFRESH_USER] Fetching application profile for database ID:', userId);

            // Fetch custom application roles and organization identifiers from public.users
            const result = await Promise.race([
                supabase
                    .from('users')
                    .select('id, role, organization_id, full_name, email')
                    .eq('id', userId)
                    .maybeSingle(),
                timeoutPromise(5000),
            ]);

            const profile = result?.data;

            if (isMounted.current) {
                if (profile) {
                    // Combine Supabase Auth credentials with internal app permissions metadata
                    setUser({
                        ...session.user,
                        ...profile,
                    });
                } else {
                    // Fallback to basic auth object and extract role and organization_id from metadata if profile synchronization is still running
                    const metadataRole = session.user.user_metadata?.role || session.user.app_metadata?.role;
                    const metadataOrganizationId = session.user.user_metadata?.organization_id || session.user.app_metadata?.organization_id || null;

                    setUser({
                        ...session.user,
                        role: metadataRole || 'student', // Default to student if no role found, or handle explicitly
                        organization_id: metadataOrganizationId,
                    });
                }
            }
            return session.user;
        } catch (error) {
            console.error('[REFRESH_USER_ERROR] Failed fetching user profile metrics:', error);
            if (isMounted.current) {
                setUser(null);
            }
            return null;
        }
    };

    useEffect(() => {
        isMounted.current = true;

        // Handle bfcache (back/forward button) session validation
        const handlePageShow = (event) => {
            if (event.persisted) {
                console.log('[AUTH_CACHE] Page restored from bfcache, refreshing user session...');
                setLoading(true);
                refreshUser().finally(() => {
                    if (isMounted.current) setLoading(false);
                });
            }
        };
        window.addEventListener('pageshow', handlePageShow);

        // Run profile synchronization initialization check on mount
        refreshUser().finally(() => {
            if (isMounted.current) setLoading(false);
        });

        // Listen for authentication changes (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AUTH_STATE_CHANGE] Operational event flag caught:', event);
            if (session) {
                await refreshUser(session);
            } else {
                if (isMounted.current) setUser(null);
            }
            if (isMounted.current) setLoading(false);
        });

        return () => {
            isMounted.current = false;
            subscription?.unsubscribe();
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, []);

    async function signUp(email, password, metadata = {}) {
        try {
            const { data, error } = await Promise.race([
                supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        // This metadata block feeds straight into your PostgreSQL trigger function!
                        data: {
                            fullName: metadata.fullName,
                            role: metadata.role || 'student',
                            organization_id: metadata.organization_id || null,
                            dateOfBirth: metadata.dateOfBirth || null,
                        }
                    }
                }),
                timeoutPromise(5000),
            ]);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('[SIGN_UP_EXCEPTION] Error during account registration execution:', error);
            return {
                data: null,
                error: error instanceof Error ? error : { message: String(error) },
            };
        }
    }

    async function signIn(email, password) {
        try {
            const { data, error } = await Promise.race([
                supabase.auth.signInWithPassword({
                    email,
                    password,
                }),
                timeoutPromise(5000),
            ]);

            if (error) throw error;

            if (data.session) {
                await refreshUser(data.session);
            }

            return { data, error: null };
        } catch (error) {
            console.error('[SIGN_IN_EXCEPTION] Sign in process error:', error);
            return {
                data: null,
                error: error instanceof Error ? error : { message: String(error) },
            };
        }
    }

    async function signOut() {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('[SIGN_OUT_ERROR] Error signing out out of session framework:', error);
        }
        setUser(null);
    }

    async function resetPassword(email) {
        try {
            const { data, error } = await Promise.race([
                supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                }),
                timeoutPromise(5000),
            ]);
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('[RESET_PASSWORD_EXCEPTION] Password update request pipeline failure:', error);
            return { data: null, error };
        }
    }

    const value = {
        user,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}