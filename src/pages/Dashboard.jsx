// src/pages/Dashboard.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api'; // <<-- verifique se o caminho do cliente API está correto
import { useAuth } from '../auth/AuthContext';

// --- DADOS MOCK (Apenas para o que ainda não vem da API) ---
const MOCK_KPIS = { totalPastas: 12, totalCats: 148, editaisMes: 22, editaisDia: 3, editaisSemana: 15 };
const MOCK_RECENT_REPORTS = [
  { orgao: "Ministério da Educação", objetoResumo: "Aquisição de computadores", analyzedAt: new Date(Date.now() - 3600000).toISOString(), filename: "relatorio_mec.pdf", url: "#" },
  { orgao: "Secretaria de Saúde de SP", objetoResumo: "Construção de novo hospital", analyzedAt: new Date(Date.now() - 86400000).toISOString(), filename: "analise_saude_sp.pdf", url: "#" },
  { orgao: "Prefeitura de Belo Horizonte", objetoResumo: "Reforma da praça central", analyzedAt: new Date(Date.now() - 172800000).toISOString(), filename: "edital_pbh.pdf", url: "#" },
];
function getKpis() { return MOCK_KPIS; }
function getRecentReports() { return MOCK_RECENT_REPORTS; }

// --- ÍCONES (SVG) ---
const FolderIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>);
const FileTextIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>);
const CalendarIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>);
const ClockIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
const SearchIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>);
const ChevronRightIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"></path></svg>);
const PlusIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>);
const DownloadIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>);
const LogOutIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>);
const SettingsIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.08a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.08a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.03 3.4l.06.06c.48.48 1.17.62 1.82.33A1.65 1.65 0 0 0 10.41 2.3V2a2 2 0 1 1 4 0v.08c0 .66.39 1.25 1 1.51.65.28 1.34.14 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.48.48-.62 1.17-.33 1.82.26.61.85 1 1.51 1H21a2 2 0 1 1 0 4h-.08c-.66 0-1.25.39-1.51 1Z" />
  </svg>
);

// --- COMPONENTES DE UI REFINADOS ---
function Card({ children, className = '' }) {
  return <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${className}`}>{children}</div>;
}

function StatCard({ title, value, trend, icon, compact }) {
  const iconSize = compact ? 'h-8 w-8' : 'h-10 w-10';
  const titleSize = compact ? 'text-xs' : 'text-sm';
  const valueSize = compact ? 'text-2xl' : 'text-3xl';

  return (
    <Card className="p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className={`${titleSize} font-medium text-slate-500`}>{title}</span>
        <div className={`flex items-center justify-center rounded-lg bg-slate-100 ${iconSize}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className={`${valueSize} font-bold text-slate-800 tracking-tight`}>{value}</p>
        {trend && (
          <p className={`text-xs ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span className="font-semibold">{trend.value}</span>
            <span className="text-slate-500"> {trend.label}</span>
          </p>
        )}
      </div>
    </Card>
  );
}

function Button({ as: Comp = "button", variant = 'secondary', size = 'md', className = '', children, ...props }) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500";
  const sizeStyles = { sm: 'px-3 py-1.5 text-xs rounded-md', md: 'px-4 py-2 text-sm rounded-lg' };
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm disabled:opacity-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 disabled:opacity-50'
  };
  const combinedClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;
  return <Comp className={combinedClasses} {...props}>{children}</Comp>;
}

function FolderGrid({ pastas, compact }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200'
  };
  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
      {pastas.map(p => (
        <Link key={p.id} to={`/pastas/${p.id}`} className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all hover:shadow-lg hover:-translate-y-1 ${colorClasses[p.cor] || colorClasses.blue}`}>
          <div>
            <FolderIcon className={`h-8 w-8 mb-3 opacity-80`} />
            <h3 className="font-bold text-slate-800">{p.nome}</h3>
            {!compact && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{p.descricao}</p>}
          </div>
          <div className="mt-4 text-xs font-semibold">{p.totalCats} CATs</div>
        </Link>
      ))}
    </div>
  );
}

function CompactToggle({ checked, onChange }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      <span>Modo Compacto</span>
    </label>
  );
}

function Pagination({ page, totalPages, onPageChange, compact }) {
  if (totalPages <= 1) return null;
  const size = compact ? 'sm' : 'md';
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button size={size} onClick={() => onPageChange(page - 1)} disabled={page === 1}>Anterior</Button>
      <span className="text-sm text-slate-600">
        Página <strong className="text-slate-800">{page}</strong> de <strong className="text-slate-800">{totalPages}</strong>
      </span>
      <Button size={size} onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>Próximo</Button>
    </div>
  );
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); } catch { return "—"; }
}
function formatCnpj(cnpj) {
  const digits = String(cnpj || '').replace(/\D/g, '');
  if (digits.length !== 14) return '—';
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// --- PÁGINA PRINCIPAL DO DASHBOARD ---
export default function Dashboard() {
  const { user, logout } = useAuth(); // usuário real do contexto
  const kpis = useMemo(() => getKpis(), []);
  const recent = useMemo(() => getRecentReports(), []);

  // Estados para dados reais, loading e erro
  const [pastas, setPastas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Total real de CATs (do backend)
  const [catsTotal, setCatsTotal] = useState(null);
  const [catsTotalLoading, setCatsTotalLoading] = useState(true);
  const [catsTotalError, setCatsTotalError] = useState(null);

  // Empresa vinculada
  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyError, setCompanyError] = useState(null);

  // Buscar pastas
useEffect(() => {
  const fetchPastas = async () => {
    try {
      setError(null);
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/api/pastas', {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      setPastas(response.data || []);
    } catch (err) {
      console.error("Erro ao buscar pastas:", err);
      setError("Não foi possível carregar as pastas. Verifique a conexão com a API.");
    } finally {
      setLoading(false);
    }
  };
  fetchPastas();
}, []);


  // Buscar total de CATs
  useEffect(() => {
    const fetchCatsCount = async () => {
      try {
        setCatsTotalError(null);
        setCatsTotalLoading(true);
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/cats/count", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        setCatsTotal(typeof data?.total === "number" ? data.total : 0);
      } catch (err) {
        console.error("Erro ao obter total de CATs:", err);
        setCatsTotalError("Falha ao carregar total de CATs.");
        setCatsTotal(0);
      } finally {
        setCatsTotalLoading(false);
      }
    };
    fetchCatsCount();
  }, []);

  // Buscar empresa vinculada
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setCompanyError(null);
        setCompanyLoading(true);
        const token = localStorage.getItem("token");
        const { data } = await api.get("/api/company/my", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        setCompany(data?.company || null);
      } catch (err) {
        console.error("Erro ao obter empresa:", err);
        setCompanyError("Falha ao carregar empresa.");
        setCompany(null);
      } finally {
        setCompanyLoading(false);
      }
    };
    fetchCompany();
  }, []);

  const [compact, setCompact] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("nome-asc");
  const [page, setPage] = useState(1);
  const pageSize = compact ? 10 : 8;

  const filtered = useMemo(() => {
    let arr = pastas;
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter(p => p.nome.toLowerCase().includes(s) || (p.descricao?.toLowerCase() || "").includes(s));
    }
    switch (sort) {
      case "nome-desc": return [...arr].sort((a, b) => b.nome.localeCompare(a.nome));
      case "total-desc": return [...arr].sort((a, b) => (b.totalCats || 0) - (a.totalCats || 0));
      default: return [...arr].sort((a, b) => a.nome.localeCompare(b.nome));
    }
  }, [pastas, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  function changePage(next) {
    const p = Math.min(Math.max(1, next), totalPages);
    setPage(p);
    document.getElementById("sec-pastas")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const h1Class = compact ? "text-2xl" : "text-3xl";
  const h2Class = compact ? "text-lg" : "text-xl";
  const smallText = compact ? "text-xs" : "text-sm";
  const mainPadding = compact ? 'py-6' : 'py-8';
  const sectionGap = compact ? 'space-y-6' : 'space-y-8';
  const wrap = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

  return (
    <div className={`bg-slate-50 min-h-screen font-sans ${mainPadding}`}>
      <div className={sectionGap}>
        {/* Cabeçalho com usuário + empresa */}
        <header className={`${wrap} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
          <div>
            <h1 className={`${h1Class} font-bold tracking-tight text-slate-900`}>Dashboard</h1>
            <p className={`${smallText} text-slate-500 mt-1`}>Visão geral do pipeline de CATs e das análises de editais.</p>
          </div>
          <div className="flex flex-wrap items-center justify-start md:justify-end gap-x-4 gap-y-3">
            <div className="flex items-center gap-2">
              <CompactToggle checked={compact} onChange={setCompact} />
              <Button as={Link} to="/cats" variant="secondary" size={compact ? 'sm' : 'md'}>Gerenciar CATs</Button>
              <Button as={Link} to="/config" variant="secondary" size={compact ? 'sm' : 'md'}>
                <SettingsIcon className="h-4 w-4" />
                <span>Configurações</span>
              </Button>
              <Button as={Link} to="/analisar" variant="primary" size={compact ? 'sm' : 'md'}>
                <PlusIcon className="h-4 w-4" />
                <span>Analisar Edital</span>
              </Button>
            </div>
            <div className="hidden md:block h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-sm text-slate-800 leading-tight">{user?.name || 'Usuário'}</p>
                <p className="text-[11px] leading-snug text-slate-500 max-w-[260px] truncate">
                  {companyLoading
                    ? 'Carregando empresa...'
                    : company
                      ? `${company.name} · CNPJ ${formatCnpj(company.cnpj)}`
                      : (companyError || 'Sem empresa vinculada')}
                </p>
              </div>
              <Button onClick={logout} variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Sair">
                <LogOutIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className={wrap}>
          <div className={sectionGap}>
            {/* KPIs */}
            <section className={`grid gap-4 sm:grid-cols-2 ${compact ? 'lg:grid-cols-4' : 'lg:grid-cols-4'}`}>
              <StatCard title="Pastas (Gestores)" value={loading ? '...' : pastas.length} icon={<FolderIcon className="h-5 w-5 text-blue-600" />} compact={compact} />
              <StatCard
                title="CATs analisadas (total)"
                value={
                  catsTotalLoading
                    ? '...'
                    : (catsTotalError ? '—' : catsTotal)
                }
                trend={{ value: "+5%", label: "vs. mês anterior", positive: true }}
                icon={<FileTextIcon className="h-5 w-5 text-amber-600" />}
                compact={compact}
              />
              <StatCard title="Editais analisados (mês)" value={kpis.editaisMes} icon={<CalendarIcon className="h-5 w-5 text-emerald-600" />} compact={compact} />
              <StatCard title="Hoje / Semana" value={`${kpis.editaisDia} / ${kpis.editaisSemana}`} icon={<ClockIcon className="h-5 w-5 text-rose-600" />} compact={compact} />
            </section>

            {/* Ações rápidas + Atividade recente */}
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <div className={`p-4 border-b ${compact ? 'pb-3' : 'pb-4'}`}>
                    <h2 className={`${h2Class} font-bold text-slate-800`}>Ações Rápidas</h2>
                  </div>
                  <div className={`p-4 grid gap-3 ${compact ? 'p-3' : 'p-4'}`}>
                    <QuickAction to="/analisar" title="Nova análise rápida" subtitle="Envie apenas o PDF do edital" compact={compact} />
                    <QuickAction to="/analisar?mode=super" title="Super Análise" subtitle="Edital + anexos e outros arquivos" compact={compact} />
                    <QuickAction to="/relatorios" title="Ver relatórios" subtitle="Últimas análises em PDF" compact={compact} />
                  </div>
                </Card>
              </div>
              <div className="lg:col-span-3">
                <Card>
                  <div className={`p-4 border-b ${compact ? 'pb-3' : 'pb-4'}`}>
                    <h2 className={`${h2Class} font-bold text-slate-800`}>Atividade Recente</h2>
                  </div>
                  {recent.length === 0 ? (
                    <p className={`text-center text-slate-500 ${compact ? 'py-10 text-xs' : 'py-12 text-sm'}`}>Sem relatórios recentes.</p>
                  ) : (
                    <ul className="divide-y divide-slate-200">
                      {recent.slice(0, compact ? 4 : 5).map((r, i) => (
                        <li key={i} className={`flex flex-col md:flex-row md:items-center justify-between gap-2 transition-colors hover:bg-slate-50 ${compact ? 'p-3' : 'p-4'}`}>
                          <div className="min-w-0 flex-1">
                            <p className={`font-semibold text-slate-800 truncate ${compact ? 'text-sm' : ''}`}>{r.orgao}</p>
                            <p className={`${smallText} text-slate-500 truncate`}>{r.objetoResumo}</p>
                            <p className={`${smallText} text-slate-400 mt-1`}>{formatDate(r.analyzedAt)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 self-start md:self-center">
                            <Button size="sm" variant="ghost" as="a" href={r.url} download={r.filename}>
                              <DownloadIcon className="h-4 w-4" />
                              <span>Baixar</span>
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </section>

            {/* Pastas de CATs */}
            <section id="sec-pastas">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h2 className={`${h2Class} font-bold text-slate-900`}>Pastas de CATs</h2>
                  {!loading && !error && (
                    <p className={`${smallText} text-slate-500 mt-1`}>
                      Exibindo {current.length} de {filtered.length} pasta(s) encontradas.
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Buscar por nome ou descrição..." className={`w-full sm:w-64 rounded-lg border border-slate-300 bg-white pl-9 pr-3 transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${compact ? 'py-1.5 text-sm' : 'py-2 text-sm'}`} />
                  </div>
                  <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className={`rounded-lg border border-slate-300 bg-white transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2 text-sm'}`}>
                    <option value="nome-asc">Ordenar: Nome (A–Z)</option>
                    <option value="nome-desc">Ordenar: Nome (Z–A)</option>
                    <option value="total-desc">Ordenar: Mais CATs</option>
                  </select>
                </div>
              </div>

              {/* Renderização condicional */}
              {loading && (
                <div className="text-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16">
                  <p className="text-slate-600 font-medium">Carregando pastas do servidor...</p>
                  <p className="text-sm text-slate-400 mt-1">Por favor, aguarde.</p>
                </div>
              )}

              {error && (
                <div className="text-center rounded-xl border-2 border-dashed border-red-200 bg-red-50 py-16">
                  <p className="font-bold text-red-700">Ocorreu um Erro</p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              )}

              {!loading && !error && (
                <>
                  {current.length === 0 ? (
                    <div className={`text-center rounded-xl border-2 border-dashed border-slate-200 bg-white ${compact ? 'py-12' : 'py-16'}`}>
                      <p className="text-slate-600 font-medium">Nenhum resultado encontrado</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {q ? "Tente ajustar sua busca." : "Nenhuma pasta foi encontrada no servidor."}
                      </p>
                    </div>
                  ) : (
                    <FolderGrid pastas={current} compact={compact} />
                  )}
                  <Pagination page={page} totalPages={totalPages} onPageChange={changePage} compact={compact} />
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

// Componente auxiliar para ações rápidas
function QuickAction({ as: Comp = Link, to, title, subtitle, compact, ...props }) {
  return (
    <Comp to={to} {...props} className={`group flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition-all hover:bg-slate-50 hover:border-slate-300`}>
      <div>
        <p className={`font-semibold text-slate-800 ${compact ? 'text-sm' : ''}`}>{title}</p>
        <p className={`${compact ? 'text-xs' : 'text-sm'} text-slate-500`}>{subtitle}</p>
      </div>
      <ChevronRightIcon className={`h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1`} />
    </Comp>
  );
}
