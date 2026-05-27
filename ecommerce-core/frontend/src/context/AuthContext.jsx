import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    // Check if token exists in localStorage (persistent session)
    const storedToken = localStorage.getItem('profarnova_token');
    const storedUser = localStorage.getItem('profarnova_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Optionally fetch fresh user info to verify token validity
      fetchFreshUserInfo(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchFreshUserInfo = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const freshUser = await response.json();
        setUser(freshUser);
        localStorage.setItem('profarnova_user', JSON.stringify(freshUser));
      } else {
        // Token might have expired or account is suspended
        logout();
      }
    } catch (err) {
      console.error('Error validating token:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fallo al iniciar sesión.');
      }

      setToken(data.token);
      setUser(data.user);

      // Persist to local storage if requested
      if (rememberMe) {
        localStorage.setItem('profarnova_token', data.token);
        localStorage.setItem('profarnova_user', JSON.stringify(data.user));
      } else {
        // Temporary session
        sessionStorage.setItem('profarnova_token', data.token);
        sessionStorage.setItem('profarnova_user', JSON.stringify(data.user));
      }

      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el registro.');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('profarnova_token');
    localStorage.removeItem('profarnova_user');
    sessionStorage.removeItem('profarnova_token');
    sessionStorage.removeItem('profarnova_user');
  };

  const recoverPassword = async (email) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/recover-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al enviar correo.');
      return data.message;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    recoverPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
