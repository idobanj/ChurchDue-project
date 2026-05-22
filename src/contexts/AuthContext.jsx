/** @format */

import {createContext, useContext, useState, useEffect, useRef} from 'react';
import {supabase} from '../services/supabaseClient';

const AuthContext = createContext({});

const timeoutPromise = (ms) =>
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), ms),
    );

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const isMounted = useRef(true);

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

            const result = await Promise.race([
                supabase
                    .from('users')
                    .select('id, role, organization_id, full_name, email')
                    .eq('id', userId)
                    .maybeSingle(),
                timeoutPromise(5000),
            ]);

            const profile = result?.data;

            console.log('[REFRESH_USER_DEBUG] Database result error:', result.error);
            console.log('[REFRESH_USER_DEBUG] Row data returned:', result.data);

            if (profile) {
                const combinedUser = {
                    id: session.user.id,
                    email: session.user.email || profile.email || '',
                    full_name: profile.full_name || session.user.user_metadata?.full_name || '',
                    role: profile.role || session.user.user_metadata?.role || null,
                    organization_id: profile.organization_id || null,
                };

                if (isMounted.current) {
                    console.log('[REFRESH_USER_SUCCESS] Setting combined user:', combinedUser);
                    setUser(combinedUser);
                }
                return combinedUser;
            } else {
                const userMetadata = session.user.user_metadata || {};
                const fallbackUser = {
                    id: session.user.id,
                    email: session.user.email,
                    full_name: userMetadata.full_name || '',
                    role: userMetadata.role || null,
                    organization_id: userMetadata.organization_id || null, 
                };

                if (isMounted.current) {
                    console.log('[REFRESH_USER_FALLBACK] Using token metadata:', fallbackUser);
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
                const {data: {session}} = await supabase.auth.getSession();
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

        const {data: {subscription}} = supabase.auth.onAuthStateChange(async (event, session) => {
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
                    organization_id = orgData.id || orgData.organization_id || orgData.org_id;
                }

                if (organization_id !== null) {
                    // Step 3: Insert profile data record
                    await Promise.race([
                        supabase.from('users').insert({
                            id: data.user.id,
                            organization_id: organization_id,
                            full_name: fullName,
                            email: data.user.email,
                            role: 'admin',
                        }),
                        timeoutPromise(5000),
                    ]);

                    // ✨ Step 4: Sync structural details straight back into Auth metadata properties 
                    // This securely prevents metadata loop traps if the system relies on fallbacks
                    await supabase.auth.updateUser({
                        data: { organization_id: organization_id }
                    });

                    await refreshUser();
                }
            }

            return {data, error: null};
        } catch (error) {
            console.log('[SIGN_UP_EXCEPTION] Signup process error:', error);
            return {
                data: null,
                error: error instanceof Error ? error : {message: String(error)},
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
                await refreshUser(data.session);
            }

            return {data, error: null};
        } catch (error) {
            console.log('[SIGN_IN_EXCEPTION] Sign in process error:', error);
            return {
                data: null,
                error: error instanceof Error ? error : {message: String(error)},
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
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}