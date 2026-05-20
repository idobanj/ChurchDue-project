/** @format */

import {createContext, useContext, useState, useEffect, useRef} from 'react';
import {supabase} from '../services/supabaseClient';

const AuthContext = createContext({});

// Helper function to create a promise that rejects after a timeout
const timeoutPromise = (ms) =>
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), ms),
    );

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Default to true while checking initial session

    // Use a ref so ALL functions inside this component can check if it's safe to update state
    const isMounted = useRef(true);

    // Reusable core function to pull profile records and combine them with Auth session info
    const refreshUser = async (currentSession = null) => {
        try {
            let session = currentSession;
            if (!session) {
                const {data} = await supabase.auth.getSession();
                session = data.session;
            }

            if (!session?.user) {
                if (isMounted.current) setUser(null);
                return null;
            }

            const userId = session.user.id;
            console.log('[REFRESH_USER] Getting profile for:', userId);

            // Fetch the profile record directly from public.users
            // NOTE: We select 'organisation_id' from your DB column and map it
            const result = await Promise.race([
                supabase
                    .from('users')
                    .select('id, role, organisation_id, full_name, email')
                    .eq('id', userId)
                    .maybeSingle(),
                timeoutPromise(5000),
            ]);

            const profile = result?.data;

            console.log(
                '[REFRESH_USER_DEBUG] Database result error:',
                result.error,
            );
            console.log('[REFRESH_USER_DEBUG] Row data returned:', result.data);

            if (profile) {
                const combinedUser = {
                    id: session.user.id,
                    email: session.user.email || profile.email || '',
                    full_name:
                        profile.full_name ||
                        session.user.user_metadata?.full_name ||
                        '',
                    role: profile.role || session.user.user_metadata?.role,
                    // Map your database column (organisation_id) safely to frontend (organization_id)
                    organization_id:
                        profile.organisation_id ||
                        session.user.user_metadata?.organization_id ||
                        session.user.user_metadata?.organisation_id,
                };

                if (isMounted.current) {
                    console.log(
                        '[REFRESH_USER_SUCCESS] Setting combined user:',
                        combinedUser,
                    );
                    setUser(combinedUser);
                }
                return combinedUser;
            } else {
                // Fallback structure if user row doesn't exist in DB yet (e.g., immediate signup race condition)
                const userMetadata = session.user.user_metadata || {};
                const fallbackUser = {
                    id: session.user.id,
                    email: session.user.email,
                    full_name: userMetadata.full_name || '',
                    role: userMetadata.role,
                    organization_id:
                        userMetadata.organization_id ||
                        userMetadata.organisation_id,
                };
                if (isMounted.current) {
                    console.log(
                        '[REFRESH_USER_FALLBACK] Using token metadata:',
                        fallbackUser,
                    );
                    setUser(fallbackUser);
                }
                return fallbackUser;
            }
        } catch (err) {
            console.error('[REFRESH_USER_EXCEPTION]', err);
            return null;
        }
    };

    useEffect(() => {
        isMounted.current = true;

        async function initAuth() {
            setLoading(true);
            try {
                const {
                    data: {session},
                } = await supabase.auth.getSession();
                if (session) {
                    await refreshUser(session);
                }
            } catch (err) {
                console.log('[INIT_AUTH_EXCEPTION]', err);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        }

        initAuth();

        const {
            data: {subscription},
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AUTH_STATE_CHANGE] Event:', event);
            if (session) {
                await refreshUser(session);
            } else {
                if (isMounted.current) setUser(null);
            }
            if (isMounted.current) setLoading(false);
        });

        return () => {
            isMounted.current = false;
            subscription.unsubscribe();
        };
    }, []);

    async function signUp(email, password, fullName, churchName) {
        try {
            console.log('[SIGN_UP_START] Signup process for:', email);

            // Step 1: Sign up user. Pass organization metadata ahead to mitigate auth state listeners race conditions
            const {data, error: authError} = await Promise.race([
                supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: 'admin',
                        },
                    },
                }),
                timeoutPromise(10000),
            ]);

            if (authError) throw authError;

            if (data.user) {
                // Step 2: Trigger the Database RPC to handle organization infrastructure setup
                const {data: orgData, error: orgError} = await Promise.race([
                    supabase.rpc('create_organization', {
                        p_name: churchName,
                        p_admin_id: data.user.id,
                        p_admin_name: fullName,
                    }),
                    timeoutPromise(10000),
                ]);

                if (orgError) throw orgError;

                let organization_id = null;
                if (typeof orgData === 'number') {
                    organization_id = orgData;
                } else if (orgData && typeof orgData === 'object') {
                    organization_id =
                        orgData.id ||
                        orgData.organization_id ||
                        orgData.org_id ||
                        orgData.organisation_id;
                }

                if (organization_id !== null) {
                    // Step 3: Populate user profiles table using your schema column 'organisation_id'
                    await Promise.race([
                        supabase.from('users').insert({
                            id: data.user.id,
                            organisation_id: organization_id,
                            full_name: fullName,
                            email: data.user.email,
                            role: 'admin',
                        }),
                        timeoutPromise(5000),
                    ]);

                    // Force an immediate update of current state so organization_id populates instantly!
                    await refreshUser();
                }
            }

            return {data, error: null};
        } catch (error) {
            console.log('[SIGN_UP_EXCEPTION] Signup process error:', error);
            return {
                data: null,
                error:
                    error instanceof Error ? error : {message: String(error)},
            };
        }
    }

    async function signIn(email, password) {
        try {
            console.log('[SIGN_IN_START] Sign in attempt for:', email);
            const {data, error} = await Promise.race([
                supabase.auth.signInWithPassword({email, password}),
                timeoutPromise(10000),
            ]);

            if (error) throw error;

            if (data.session) {
                // Instantly re-pull full table records before resolving to make sure organization_id is available
                await refreshUser(data.session);
            }

            return {data, error: null};
        } catch (error) {
            console.log('[SIGN_IN_EXCEPTION] Sign in process error:', error);
            return {
                data: null,
                error:
                    error instanceof Error ? error : {message: String(error)},
            };
        }
    }

    async function signOut() {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.log('[SIGN_OUT_ERROR] Error signing out:', error);
        }
        setUser(null);
    }

    async function resetPassword(email) {
        try {
            const {data, error} = await Promise.race([
                supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                }),
                timeoutPromise(5000),
            ]);
            if (error) throw error;
            return {data, error: null};
        } catch (error) {
            return {data: null, error};
        }
    }

    const value = {
        user,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshUser, // Exposed in context in case pages want to force update
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
