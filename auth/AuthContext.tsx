
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
        fullName: profile?.full_name,
        role: 'user', // Default role, specific space roles handled in data layer
        employeeId: sbUser.id,
        department: profile?.department,
        isAdmin: profile?.is_admin || false,
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
    const email = `${sanitizedUsername}@taskflow.local`;

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
    const email = `${sanitizedUsername}@taskflow.local`;

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

      // 2. If not, create it
      if (!spaceId) {
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
          // Fallback: don't block signup if workspace creation fails, but log it
        } else if (newSpace) {
          spaceId = newSpace.id;
        }
      }

      // 3. Add user to workspace members
      if (spaceId) {
        const { error: memberError } = await supabase
          .from('space_members')
          .insert({
            space_id: spaceId,
            user_id: signUpData.user.id,
            role: 'admin' // First user or creator gets admin, or default to admin for now as per "Space Ownership" model
          });

        if (memberError) {
          console.error("Error adding user to workspace:", memberError);
        }
      }
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
