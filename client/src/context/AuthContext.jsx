import React, { createContext, useReducer, useEffect, useState } from 'react';

export const AuthContext = createContext();

const initialState = {
  token: localStorage.getItem('aagah_token') || null,
  user: JSON.parse(localStorage.getItem('aagah_user') || 'null'),
  loading: true
};

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch (e) {
    return true;
  }
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        token: null,
        user: null,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [language, setLanguageState] = useState(localStorage.getItem('aagah_lang') || 'en');

  useEffect(() => {
    // Validate token on load
    if (state.token) {
      if (isTokenExpired(state.token)) {
        localStorage.removeItem('aagah_token');
        localStorage.removeItem('aagah_user');
        dispatch({ type: 'LOGOUT' });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.token]);

  // Listen to global 401 events from the api client
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('aagah_token');
      localStorage.removeItem('aagah_user');
      dispatch({ type: 'LOGOUT' });
    };

    window.addEventListener('aagah_auth_401', handleUnauthorized);
    return () => {
      window.removeEventListener('aagah_auth_401', handleUnauthorized);
    };
  }, []);

  const login = (token, user) => {
    localStorage.setItem('aagah_token', token);
    localStorage.setItem('aagah_user', JSON.stringify(user));
    dispatch({ type: 'LOGIN', payload: { token, user } });
  };

  const logout = () => {
    localStorage.removeItem('aagah_token');
    localStorage.removeItem('aagah_user');
    dispatch({ type: 'LOGOUT' });
  };

  const changeLanguage = (langCode) => {
    localStorage.setItem('aagah_lang', langCode);
    setLanguageState(langCode);
  };

  return (
    <AuthContext.Provider value={{ ...state, language, changeLanguage, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
