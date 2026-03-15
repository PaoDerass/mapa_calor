import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState({
    username: localStorage.getItem('username'),
    role: localStorage.getItem('role'),
    permissions: JSON.parse(localStorage.getItem('permissions')) || []
  });

  const login = (data) => {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user_id', data.user_id);
    localStorage.setItem('username', data.username);
    if (data.role) {
      localStorage.setItem('role', data.role);
    }
    if (data.permissions) {
      localStorage.setItem('permissions', JSON.stringify(data.permissions));
    }
    setToken(data.access_token);
    setUser({
      username: data.username,
      role: data.role,
      permissions: data.permissions || []
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
    setToken(null);
    setUser({ username: null, role: null, permissions: [] });
  };

  useEffect(() => {
    // Session timeout logic (1 hour inactivity)
    if (!token) return;
    
    let timeoutId;
    const INACTIVITY_TIME = 3600000; // 1 hr

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Sesión cerrada por inactividad");
        logout();
      }, INACTIVITY_TIME);
    };

    const activityEvents = [
      'mousedown', 'mousemove', 'keydown',
      'scroll', 'touchstart', 'click'
    ];

    activityEvents.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
