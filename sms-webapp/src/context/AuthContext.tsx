import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, registerUser, getCurrentUser, ApiError } from '../services/api.js';

export interface AuthUser {
  id?: number;
  username: string;
  full_name?: string;
  role?: string;
}

export interface AuthContextType {
  token: string | null;
  username: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [token, setToken] = useState<string | null>(() => (typeof window !== 'undefined' ? localStorage.getItem('sms_token') : null));
  const [username, setUsername] = useState<string | null>(() => (typeof window !== 'undefined' ? localStorage.getItem('sms_username') : null));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(typeof window !== 'undefined' && localStorage.getItem('sms_token')));

  // Validate and sync token on initial mount
  useEffect(() => {
    const savedToken = localStorage.getItem('sms_token');

    if (!savedToken) {
      return;
    }

    getCurrentUser()
      .then((res) => {
        if (res?.user) {
          setUser(res.user);
          setUsername(res.user.username);
        }
      })
      .catch((err) => {
        console.warn('[AuthContext] Stored session invalid or expired:', err);
        localStorage.removeItem('sms_token');
        localStorage.removeItem('sms_username');
        setToken(null);
        setUsername(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (userParam: string, passParam: string): Promise<void> => {
    const res = await loginUser(userParam, passParam);
    if (!res?.token) {
      throw new ApiError('Authentication failed: Missing token in response', 401, 'AuthError');
    }

    localStorage.setItem('sms_token', res.token);
    localStorage.setItem('sms_username', res.user?.username || userParam);

    setToken(res.token);
    setUsername(res.user?.username || userParam);
    setUser(res.user || { username: userParam });
  };

  const register = async (userParam: string, passParam: string, fullNameParam?: string): Promise<void> => {
    const res = await registerUser(userParam, passParam, fullNameParam);
    if (!res?.token) {
      throw new ApiError('Registration failed: Missing token in response', 400, 'AuthError');
    }

    localStorage.setItem('sms_token', res.token);
    localStorage.setItem('sms_username', res.user?.username || userParam);

    setToken(res.token);
    setUsername(res.user?.username || userParam);
    setUser(res.user || { username: userParam });
  };

  const logout = (): void => {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_username');
    setToken(null);
    setUsername(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        user,
        isAuthenticated: Boolean(token),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
