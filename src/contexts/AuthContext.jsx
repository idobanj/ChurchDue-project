/** @format */

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(true);

    // Add this function inside your AuthProvider component
    const resetPassword = async (email) => {
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`, // Change this to your actual route
        });
    };

    // Fetch user profile from the database
    const fetchProfile = async (sessionUser) => {
        try {
            const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', sessionUser.id)
                .maybeSingle();
        
            if (profile) {
                const fullUser = { ...sessionUser, ...profile };
                setUser(fullUser);
                return fullUser;
            } else {
                // Handle unverified users gracefully
                const pendingUser = { ...sessionUser, is_pending: true };
                setUser(pendingUser);
                return pendingUser;
            }
        } catch (err) {
            console.error("Error in fetchProfile:", err);
            return null;
        }
    };

    useEffect(() => {
        let active = true;

        const initializeAuth = async () => {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (active) {
                    if (session?.user) {
                        await fetchProfile(session.user);
                    } else {
                        setUser(null);
                    }
                }
            } catch (err) {
                console.error("Error in initializeAuth:", err);
            } finally {
                if (active) {
                    setLoading(false);
                    setInitializing(false);
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!active) return;
            
            if (session?.user) {
                if (event === 'SIGNED_IN') {
                    setLoading(true);
                    await fetchProfile(session.user);
                    setLoading(false);
                } else {
                    await fetchProfile(session.user);
                }
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    const signUp = async (email, password, metadata = {}) => {
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: metadata.fullName,
                    role: metadata.role || 'student',
                    organization_id: metadata.organization_id || null,
                }
            }
        });
    };

    const signIn = async (email, password) => {
        setLoading(true);
        try {
            const result = await supabase.auth.signInWithPassword({ email, password });
            if (result.data?.user) {
                await fetchProfile(result.data.user);
            }
            return result;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resetPassword }}>
            {!initializing && children}
        </AuthContext.Provider>
    );
}