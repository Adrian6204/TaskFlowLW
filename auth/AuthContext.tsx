
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Role, AuthContextType } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        mapSupabaseUser(session.user);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        mapSupabaseUser(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUser = async (sbUser: any) => {
    try {
      // Fetch public profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      // Verify session is still active and matches the user we are mapping
      // This prevents race conditions where a logout happens while profile is fetching
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.id !== sbUser.id) {
        return;
      }

      setUser({
        username: profile?.username || sbUser.email?.split('@')[0],
        fullName: profile?.full_name || profile?.username || sbUser.email?.split('@')[0],
        role: profile?.is_admin ? 'super_admin' : 'user', // Default 'user', but 'super_admin' if system admin
        employeeId: sbUser.id,
        department: profile?.department,
        isAdmin: profile?.is_admin || false,
        avatarUrl: profile?.avatar_url,
        position: profile?.position, // Map position from DB
        phone: profile?.phone,
        email: profile?.email || sbUser.email,
      });
    } catch (error) {
      console.error("Error mapping user", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured) throw new Error("Supabase not configured");

    // Convert username to fake email for Supabase auth
    // If it's already an email (contains @), use it directly
    const email = username.includes('@')
      ? username.trim()
      : `${username.toLowerCase().replace(/\s+/g, '')}@lifewood.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signup = async (username: string, password: string, fullName: string, department: string): Promise<void> => {
    if (!isSupabaseConfigured) throw new Error("Supabase not configured");

    // Convert username to fake email for Supabase auth
    // If it's already an email (contains @), use it directly
    const email = username.includes('@')
      ? username.trim()
      : `${username.toLowerCase().replace(/\s+/g, '')}@lifewood.com`;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: fullName,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
          department: department,
        },
        emailRedirectTo: undefined
      }
    });

    if (signUpError) throw signUpError;

    if (signUpData.user) {
      // Workspace assignment is now manual. 
      // User will start with no workspace and must create or join one.
    }
  };

  const logout = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
      if (updates.username && isSupabaseConfigured) {
        await supabase.from('profiles').update({ username: updates.username }).eq('id', user.employeeId);
      }
      if (updates.fullName && isSupabaseConfigured) {
        await supabase.from('profiles').update({ full_name: updates.fullName }).eq('id', user.employeeId);
      }
      if (updates.avatarUrl && isSupabaseConfigured) {
        await supabase.from('profiles').update({ avatar_url: updates.avatarUrl }).eq('id', user.employeeId);
      }
      if (updates.phone && isSupabaseConfigured) {
        await supabase.from('profiles').update({ phone: updates.phone }).eq('id', user.employeeId);
      }
      if (updates.position && isSupabaseConfigured) {
        await supabase.from('profiles').update({ position: updates.position }).eq('id', user.employeeId);
      }
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user || !isSupabaseConfigured) throw new Error("Supabase not configured or user not logged in");

    // First verify the current password by trying to sign in again
    const email = user.email || (user.username.includes('@') ? user.username : `${user.username.toLowerCase().replace(/\s+/g, '')}@lifewood.com`);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error("Incorrect current password.");
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) throw updateError;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
