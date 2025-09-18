// src/pages/Login.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Logo from "../assets/logo.png";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [touch, setTouch]       = useState({ email: false, password: false });

  const emailRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const redirectTo = useMemo(() => {
    const p = new URLSearchParams(location.search);
    return p.get("redirectTo") || "/";
  }, [location.search]);

  // autofocus no e-mail
  useEffect(() => { emailRef.current?.focus(); }, []);

  // se já estiver logado, redireciona
  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  const emailError    = touch.email && !emailRe.test(email) ? "Informe um e-mail válido." : "";
  const passwordError = touch.password && password.length < 6 ? "A senha deve ter ao menos 6 caracteres." : "";
  const formValid     = emailRe.test(email) && password.length >= 6;

  async function handleSubmit(e) {
    e.preventDefault();
    setTouch({ email: true, password: true });
    setErr("");
    if (!formValid) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (e) {
      const msg =
        e?.message === "UNAUTHORIZED"
          ? "E-mail ou senha inválidos."
          : "Não foi possível entrar. Tente novamente.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="mx-auto max-w-6xl px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src={Logo} alt="Logo" className="h-9 w-auto rounded-lg" />
          <span className="text-lg font-semibold tracking-tight text-slate-800">Licit-AI</span>
        </Link>
      </header>

      <main className="mx-auto grid min-h-[70vh] max-w-6xl place-items-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Entrar</h1>
            <p className="mt-1 text-sm text-slate-600">Acesse sua conta para continuar</p>
          </div>

          {err && (
            <div
              className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              role="alert"
              aria-live="assertive"
            >
              {err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* E-mail */}
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                E-mail
              </label>
              <input
                id="email"
                ref={emailRef}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouch((t) => ({ ...t, email: true }))}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-err" : undefined}
                className={`mt-1 block w-full rounded-xl border px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2
                  ${emailError
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-400/30"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/30"}`}
                placeholder="voce@empresa.com"
                required
              />
              {emailError && (
                <p id="email-err" className="mt-1 text-xs text-rose-600">
                  {emailError}
                </p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Senha
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouch((t) => ({ ...t, password: true }))}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "pwd-err" : undefined}
                  className={`block w-full rounded-xl border px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2
                    ${passwordError
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-400/30"
                      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/30"}`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-pressed={showPwd}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                  title={showPwd ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {passwordError && (
                <p id="pwd-err" className="mt-1 text-xs text-rose-600">
                  {passwordError}
                </p>
              )}
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => alert("Fluxo de recuperação virá em breve.")}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              disabled={loading || !formValid}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading && <Spinner className="h-4 w-4" />}
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <Link to="/" className="hover:underline">
              Voltar ao início
            </Link>
            <span>v1.0</span>
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Licit-AI
      </footer>
    </div>
  );
}

/* ======= Ícones inline (sem libs) ======= */
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.77 19.77 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a19.77 19.77 0 0 1-3.52 4.21M1 1l22 22" />
    </svg>
  );
}
function Spinner({ className = "" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
    </svg>
  );
}
