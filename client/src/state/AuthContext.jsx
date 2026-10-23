import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [authStatus, setAuthStatus] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'

  // Load available demo personas
  const loadPersonas = useCallback(async () => {
    try {
      const data = await api.get('/auth/personas');
      setPersonas(data || []);
      return data;
    } catch (err) {
      console.error('Failed to load demo personas:', err);
      return [];
    }
  }, []);

  // Validate active token or init session
  const checkAuth = useCallback(async () => {
    setAuthStatus('loading');
    const existingToken = sessionStorage.getItem('wardline_token');
    const loadedPersonas = await loadPersonas();

    if (existingToken) {
      try {
        const currentUser = await api.get('/auth/me');
        setUser(currentUser);
        setAuthStatus('authenticated');
        return;
      } catch {
        sessionStorage.removeItem('wardline_token');
      }
    }

    // In demo mode: auto-select first Nurse persona for immediate seamless evaluation
    if (loadedPersonas && loadedPersonas.length > 0) {
      const defaultPersona = loadedPersonas.find((p) => p.role === 'NURSE') || loadedPersonas[0];
      try {
        const loginRes = await api.post('/auth/demo-login', {
          userId: defaultPersona.id || defaultPersona._id,
        });
        sessionStorage.setItem('wardline_token', loginRes.token);
        setUser(loginRes.user);
        setAuthStatus('authenticated');
        return;
      } catch (e) {
        console.error('Auto demo login failed:', e);
      }
    }

    setAuthStatus('unauthenticated');
  }, [loadPersonas]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Demo user login / role switcher
  const loginAsDemoUser = async (userId) => {
    try {
      const data = await api.post('/auth/demo-login', { userId });
      sessionStorage.setItem('wardline_token', data.token);
      setUser(data.user);
      setAuthStatus('authenticated');
      return data.user;
    } catch (err) {
      console.error('Demo login error:', err);
      throw err;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('wardline_token');
    setUser(null);
    setAuthStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        personas,
        authStatus,
        isAuthenticated: authStatus === 'authenticated',
        loading: authStatus === 'loading',
        loginAsDemoUser,
        logout,
        reloadPersonas: loadPersonas,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
