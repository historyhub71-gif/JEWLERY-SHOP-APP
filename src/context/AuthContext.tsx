import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

type Profile = {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    status: 'pending' | 'approved' | 'rejected';
    role: 'super_admin' | 'admin' | 'customer';
    approved_at: string | null;
    approved_by: string | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
};

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

export const AuthProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Profile loading error:', error);
            setProfile(null);
            return;
        }

        setProfile(data as Profile);
    };

    const refreshProfile = async () => {
        if (!user) {
            setProfile(null);
            return;
        }

        await loadProfile(user.id);
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!mounted) return;

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await loadProfile(session.user.id);
                }
            } catch (error) {
                console.error(
                    'Auth initialization error:',
                    error
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!mounted) return;

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await loadProfile(session.user.id);
                } else {
                    setProfile(null);
                }

                setLoading(false);
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error;
        }

        setSession(null);
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                profile,
                loading,
                refreshProfile,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used inside AuthProvider'
        );
    }

    return context;
};