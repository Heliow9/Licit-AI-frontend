import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, setToken, clearToken, getToken } from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setL] = useState(true);

  // helper: tenta obter o "me" em /api/me/settings e cai para /api/auth/me
  async function fetchMe() {
    // 1ª tentativa: /api/me/settings (novo)
    try {
      const r = await apiFetch('/api/me/settings', { auth: true, method: 'GET' });
      if (r?.user) return r.user;
    } catch (e) {
      // segue para o fallback
    }
    // 2ª tentativa: /api/auth/me (antigo)
    const r2 = await apiFetch('/api/auth/me', { auth: true, method: 'GET' });
    return r2?.user || null;
  }

  useEffect(() => {
    (async () => {
      const tk = getToken();
      if (!tk) { setL(false); return; }
      try {
        // garante que o token já está aplicado no client (se sua lib usa isso)
        setToken(tk);
        const me = await fetchMe();
        if (me) setUser(me);
        else {
          clearToken();
          setUser(null);
        }
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setL(false);
      }
    })();
  }, []);

  async function login(email, password) {
    try {
      const r = await apiFetch('/api/auth/login', {
        auth: false,
        method: 'POST',
        body: { email, password },
      });
      if (!r?.token) {
        const err = new Error('LOGIN_FAILED');
        err.status = 500;
        throw err;
      }

      // persiste token (tua lib já deve injetar em headers após setToken)
      setToken(r.token);

      // busca o "me" para garantir role/companyId atualizados
      const me = await fetchMe();
      const resolvedUser = me || r.user || { email };
      setUser(resolvedUser);

      return { token: r.token, user: resolvedUser };
    } catch (e) {
      // normaliza erro para a UI
      const status = e?.status || e?.response?.status;
      const msg = e?.error || e?.message || 'LOGIN_FAILED';
      const err = new Error(msg);
      err.status = status;
      throw err;
    }
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
