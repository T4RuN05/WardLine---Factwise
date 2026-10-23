import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const AppDataContext = createContext(null);

const initialState = {
  overview: null,
  loading: true,
  refreshing: false,
  error: null,
  lastUpdated: null,
};

function appDataReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: state.overview === null,
        refreshing: state.overview !== null,
        error: null,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        overview: action.payload,
        loading: false,
        refreshing: false,
        error: null,
        lastUpdated: new Date(),
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        refreshing: false,
        error: action.payload,
      };
    default:
      return state;
  }
}

export function AppDataProvider({ children }) {
  const { authStatus } = useAuth();
  const [state, dispatch] = useReducer(appDataReducer, initialState);

  const refreshOverview = useCallback(async () => {
    if (authStatus !== 'authenticated') return;
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await api.get('/dashboard/overview');
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message });
    }
  }, [authStatus]);

  // Initial fetch and focus refetch
  useEffect(() => {
    if (authStatus === 'authenticated') {
      refreshOverview();

      const handleFocus = () => {
        refreshOverview();
      };

      window.addEventListener('focus', handleFocus);

      // Periodic polling every 20 seconds (Section 6.9 & 7.7)
      const intervalId = setInterval(refreshOverview, 20000);

      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(intervalId);
      };
    }
  }, [authStatus, refreshOverview]);

  return (
    <AppDataContext.Provider
      value={{
        ...state,
        refreshOverview,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
