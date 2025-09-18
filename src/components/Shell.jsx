import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { clearToken } from "../lib/auth";

export default function Shell() {
  const navigate = useNavigate();
  function logout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Analisa Licitação</span>
            <nav className="hidden md:flex gap-3 text-sm">
              <NavLink to="/" end className={({isActive}) => linkCls(isActive)}>Dashboard</NavLink>
              <NavLink to="/analisar" className={({isActive}) => linkCls(isActive)}>Analisar</NavLink>
              <NavLink to="/relatorios" className={({isActive}) => linkCls(isActive)}>Relatórios</NavLink>
            </nav>
          </div>
          <button onClick={logout} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function linkCls(active) {
  return `rounded-md px-3 py-1.5 hover:bg-gray-100 ${active ? "bg-gray-100 font-medium" : ""}`;
}
