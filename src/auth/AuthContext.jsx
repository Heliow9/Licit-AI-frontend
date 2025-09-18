import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, setToken, clearToken, getToken } from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [loading, setL]   = useState(true);

  useEffect(() => {
    // tentativa simples de “restaurar” sessão (se tiver token)
    (async () => {
      const tk = getToken();
      if (!tk) { setL(false); return; }
      try {
        // se tiver endpoint /me, use-o; se não, apenas sinalize logado
        // const me = await apiFetch('/api/auth/me');
        setUser({ placeholder: true }); 
      } catch {
        clearToken();
      } finally { setL(false); }
    })();
  }, []);

  async function login(email, password) {
    const r = await apiFetch('/api/auth/login', {
      auth: false,
      method: 'POST',
      body: { email, password }
    });
    if (!r?.token) throw new Error('Falha no login');
    setToken(r.token);
    setUser(r.user || { email });
    return r;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  const value = { user, loading, login, logout, isAuth: !!user };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
