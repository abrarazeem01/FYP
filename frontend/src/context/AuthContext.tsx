import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isBooting: boolean;
  setBooting: (b: boolean) => void;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  switchRoleForDemo: (role: UserRole) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
}

export const EXECUTIVE_ACCOUNTS: Record<UserRole, UserProfile> = {
  super_admin: {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'zainab@nexus.io',
    full_name: 'Zainab',
    phone: '+92-300-1110001',
    role: 'super_admin',
    hierarchy_level: 1,
    is_2fa_enabled: true,
  },
  lead_analyst: {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'abrar@nexus.io',
    full_name: 'Abrar',
    phone: '+92-300-2220002',
    role: 'lead_analyst',
    hierarchy_level: 2,
    is_2fa_enabled: true,
  },
  field_investigator: {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'sulaman@nexus.io',
    full_name: 'Sulaman',
    phone: '+92-300-3330003',
    role: 'field_investigator',
    hierarchy_level: 3,
    is_2fa_enabled: false,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('nexus_token');
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('nexus_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('nexus_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nexus_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('nexus_token', token);
    } else {
      localStorage.removeItem('nexus_token');
    }
  }, [token]);

  // Sync with real Supabase session if present
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              const u: UserProfile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: profile.full_name || 'Officer',
                role: profile.role || 'field_investigator',
                hierarchy_level: profile.hierarchy_level || 3,
                is_2fa_enabled: profile.is_2fa_enabled || false,
              };
              setUser(u);
              setToken(session.access_token);
            }
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) return;
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: profile.full_name || 'Officer',
              role: profile.role || 'field_investigator',
              hierarchy_level: profile.hierarchy_level || 3,
              is_2fa_enabled: profile.is_2fa_enabled || false,
            });
            setToken(session.access_token);
          }
        });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [isBooting, setIsBooting] = useState(false);

  const login = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem('nexus_token', newToken);
    localStorage.setItem('nexus_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsBooting(true);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsBooting(false);
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  const switchRoleForDemo = (role: UserRole) => {
    const target = EXECUTIVE_ACCOUNTS[role];
    if (target) {
      login(`nexus-jwt-${target.id}-${role}`, target);
    }
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isBooting,
        setBooting: setIsBooting,
        login,
        logout,
        switchRoleForDemo,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
