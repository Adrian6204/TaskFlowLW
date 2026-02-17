
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
    // Sanitize: lowercase and remove spaces
    const sanitizedUsername = username.toLowerCase().replace(/\s+/g, '');
    const email = `${sanitizedUsername}@lifewood.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signup = async (username: string, password: string, fullName: string, department: string): Promise<void> => {
    if (!isSupabaseConfigured) throw new Error("Supabase not configured");

    // Convert username to fake email for Supabase auth
    // Sanitize: lowercase and remove spaces
    const sanitizedUsername = username.toLowerCase().replace(/\s+/g, '');
    const email = `${sanitizedUsername}@lifewood.com`;

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
      // 1. Check if workspace exists
      const { data: workspaces, error: fetchError } = await supabase
        .from('spaces')
        .select('id')
        .eq('name', department)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching workspace:", fetchError);
      }

      let spaceId = workspaces?.id;
      let isNewSpace = false;

      // 2. If not, create it
      if (!spaceId) {
        isNewSpace = true;
        // Generate a random 6-char join code
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { data: newSpace, error: spaceError } = await supabase
          .from('spaces')
          .insert({
            name: department,
            owner_id: signUpData.user.id,
            join_code: joinCode,
            description: `${department} Workspace`
          })
          .select('id')
          .maybeSingle();

        if (spaceError) {
          console.error("Error creating workspace:", spaceError);
        } else if (newSpace) {
          spaceId = newSpace.id;
        }
      }

      // 3. Add user to workspace members
      if (spaceId) {
        // Role Logic: Admin if they created the space, Member otherwise
        const role = isNewSpace ? 'admin' : 'member';

        const { error: memberError } = await supabase
          .from('space_members')
          .insert({
            space_id: spaceId,
            user_id: signUpData.user.id,
            role: role
          });

        if (memberError) {
          console.error("Error adding user to workspace:", memberError);
        }
      }

      // 4. System Admin Check
      // REMOVED hardcoded 'adrian' check.
      // System Admin rights should be assigned manually in the database or via an Admin Console.
      // For now, no automatic System Admin assignment on signup to keep it secure.
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

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
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
