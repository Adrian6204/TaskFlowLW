
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

    // Safety timeout: Ensure loading is ALWAYS turned off after 10 seconds 
    // even if Supabase/Database is flagging/experiencing issues
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      console.warn('Auth loading timed out after 10 seconds. Forcing state.');
    }, 10000);

    // Realtime subscription for profile changes
    let profileSubscription: any = null;

    const setupRealtime = (userId: string) => {
      if (profileSubscription) profileSubscription.unsubscribe();
      profileSubscription = supabase
        .channel(`public:profiles:id=eq.${userId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        }, (payload) => {
          console.log('Realtime profile update received:', payload.new);
          setUser(prevUser => {
            if (!prevUser) return null;
            return {
              ...prevUser,
              username: payload.new.username,
              fullName: payload.new.full_name,
              avatarUrl: payload.new.avatar_url,
              phone: payload.new.phone,
              position: payload.new.position,
              department: payload.new.department,
              isAdmin: payload.new.is_admin,
              mustChangePassword: payload.new.must_change_password,
            };
          });
        })
        .subscribe();
    };

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        mapSupabaseUser(session.user);
        setupRealtime(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        mapSupabaseUser(session.user);
        setupRealtime(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
        if (profileSubscription) profileSubscription.unsubscribe();
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      if (profileSubscription) profileSubscription.unsubscribe();
    };
  }, []);

  const mapSupabaseUser = async (sbUser: any) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.id !== sbUser.id) {
        return;
      }

      setUser({
        username: profile?.username || sbUser.email?.split('@')[0],
        fullName: profile?.full_name || profile?.username || sbUser.email?.split('@')[0],
        role: profile?.is_admin ? 'super_admin' : 'user',
        employeeId: sbUser.id,
        department: profile?.department,
        isAdmin: profile?.is_admin || false,
        avatarUrl: profile?.avatar_url,
        position: profile?.position,
        phone: profile?.phone,
        email: profile?.email || sbUser.email,
        mustChangePassword: profile?.must_change_password ?? true,
      });
    } catch (error) {
      console.error("Error mapping user:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured) throw new Error("Supabase not configured");

    // Convert username to fake email for Supabase auth
    // If it's already an email (contains @), use it directly
    const sanitizedInput = username.trim().toLowerCase();
    const email = sanitizedInput.includes('@')
      ? sanitizedInput
      : `${sanitizedInput.replace(/\s+/g, '')}@lifewood.com`;

    console.log("Attempting login with:", { email, hasPassword: !!password });

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
    const sanitizedInput = username.trim().toLowerCase();
    const email = sanitizedInput.includes('@')
      ? sanitizedInput
      : `${sanitizedInput.replace(/\s+/g, '')}@lifewood.com`;

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
    if (user && isSupabaseConfigured) {
      // Optimistically update local state
      setUser({ ...user, ...updates });

      const dbPayload: any = {};
      if (updates.username !== undefined) dbPayload.username = updates.username;
      if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName;
      if (updates.avatarUrl !== undefined) dbPayload.avatar_url = updates.avatarUrl;
      if (updates.phone !== undefined) dbPayload.phone = updates.phone;
      if (updates.position !== undefined) dbPayload.position = updates.position;
      if (updates.department !== undefined) dbPayload.department = updates.department;

      if (Object.keys(dbPayload).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(dbPayload)
          .eq('id', user.employeeId);

        if (error) {
          console.error("Error updating profile in DB:", error);
          // Revert on error if needed, but for now we'll just log
          throw error;
        }
      }
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user || !isSupabaseConfigured) throw new Error("Supabase not configured or user not logged in");

    // 1. Verify the current password by trying to sign in again
    const sanitizedInput = user.username.trim().toLowerCase();
    const email = user.email || (sanitizedInput.includes('@') ? sanitizedInput : `${sanitizedInput.replace(/\s+/g, '')}@lifewood.com`);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error("Incorrect current password.");
    }

    // 2. Use markPasswordChanged to handle both the flag reset (RPC) and the Auth update.
    // This prevents double-calling supabase.auth.updateUser.
    const isAcceptable = await markPasswordChanged(newPassword);

    if (!isAcceptable) {
      throw new Error("New password cannot be the default password.");
    }
  };

  const markPasswordChanged = async (newPassword: string): Promise<boolean> => {
    if (!user || !isSupabaseConfigured) throw new Error("Supabase not configured or user not logged in");

    // Call server-side RPC — it checks if the password is the default (PHCBIT@12345)
    // and only clears the flag if it is NOT the default.
    const { data: isAcceptable, error } = await supabase.rpc('mark_password_changed', {
      new_password: newPassword,
    });

    if (error) throw error;

    if (isAcceptable) {
      // Refresh session first to ensure we have a valid token before updating
      await supabase.auth.refreshSession();

      // RPC approved — now actually change the Auth password
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        // If the session was completely ruined/missing somehow, we should throw a clearer error
        if (updateError.message.toLowerCase().includes('session') || updateError.name.includes('Session')) {
           throw new Error("Your session expired. Please log out and log back in, then try again.");
        }
        throw updateError;
      }

      // Sync local state
      setUser(prev => prev ? { ...prev, mustChangePassword: false } : null);
    }

    return isAcceptable as boolean;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, updatePassword, markPasswordChanged }}>
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
