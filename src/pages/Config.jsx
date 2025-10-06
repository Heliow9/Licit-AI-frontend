// src/pages/Config.jsx
import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';

/* ============ helpers ============ */
function formatCnpj(cnpj) {
  const digits = String(cnpj || '').replace(/\D/g, '');
  if (digits.length !== 14) return '—';
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('');
}

/* ============ icons (inline) ============ */
const SaveIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V7l4-4h9l4 4v12a2 2 0 0 1-2 2Z" />
    <path d="M7 21V7h10v14M7 10h10M15 21v-6H9v6" />
  </svg>
);
const KeyIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className} fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M21 2l-8.5 8.5M16 7l5 5" />
  </svg>
);
const BuildingIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18M4 21V6a2 2 0 0 1 2-2h6l6 6v11" />
    <path d="M14 4v4h4" />
    <path d="M9 9h1M9 13h1M9 17h1M13 13h1M13 17h1" />
  </svg>
);
const UserPlusIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 19a6 6 0 0 0-12 0" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
);
const MailIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16v16H4z" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);
const PhoneIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.56 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.08a2 2 0 0 1 2.11-.45c.8.26 1.64.44 2.5.56A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MapPinIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const RefreshIcon = (p) => (
  <svg viewBox="0 0 24 24" className={p.className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

/* ============ main ============ */
export default function Config() {
  const { user } = useAuth();
  // 'perfil' | 'empresa' | 'usuarios' | 'exigencias'
  const [tab, setTab] = useState('perfil');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header bonito */}
        <div className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <div className="relative isolate">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50" />
            <div className="relative p-6 md:p-8 flex items-center gap-4">
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white grid place-items-center font-bold">
                {initials(user?.name || user?.email || 'U')}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Configurações</h1>
                <p className="text-sm text-slate-600 truncate">Gerencie seu perfil, empresa e usuários.</p>
              </div>
              <div className="ms-auto hidden md:flex gap-2">
                <Link to="/" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Voltar
                </Link>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-slate-200 bg-slate-50/50">
            <nav className="flex gap-2 p-2">
              <TabButton active={tab === 'perfil'} onClick={() => setTab('perfil')}>Perfil</TabButton>
              <TabButton active={tab === 'empresa'} onClick={() => setTab('empresa')}>Empresa</TabButton>
              <TabButton active={tab === 'usuarios'} onClick={() => setTab('usuarios')}>Usuários</TabButton>
              <TabButton active={tab === 'exigencias'} onClick={() => setTab('exigencias')}>Exigências</TabButton>
            </nav>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="grid gap-6">
          {tab === 'perfil' && <Perfil />}
          {tab === 'empresa' && <Empresa />}
          {tab === 'usuarios' && <Usuarios />}
          {tab === 'exigencias' && <Exigencias />}
        </div>
      </div>
    </div>
  );
}

/* ============ UI blocks ============ */
function TabButton({ active, children, ...props }) {
  return (
    <button
      {...props}
      className={`relative rounded-lg px-3 py-1.5 text-sm font-semibold transition
      ${active ? 'text-white bg-blue-600 shadow-sm' : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50'}`}
    >
      {children}
      {active && <span className="absolute -bottom-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-blue-600" />}
    </button>
  );
}
function SectionCard({ title, description, icon, children, actions }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-200 p-5">
        {icon}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {actions && <div className="ms-auto">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-sm font-medium text-slate-700">{label}</div>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </label>
  );
}
function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400
      focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${props.className || ''}`}
    />
  );
}
function Select(props) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900
      focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${props.className || ''}`}
    />
  );
}
function Textarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400
      focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${props.className || ''}`}
    />
  );
}
function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center rounded-full border px-1 py-1 transition
        ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}
      aria-pressed={checked}
    >
      <span className={`h-5 w-5 rounded-full bg-white shadow-sm transform transition ${checked ? 'translate-x-5' : ''}`} />
      <span className={`ms-2 text-sm ${checked ? 'text-white' : 'text-slate-700'}`}>{label}</span>
    </button>
  );
}
function Badge({ children, tone = 'slate' }) {
  const map = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}
function Button({ children, variant = 'primary', loading = false, ...props }) {
  const base = 'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-60',
    secondary: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-blue-500 disabled:opacity-60',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-blue-500 disabled:opacity-60',
  };
  return (
    <button {...props} className={`${base} ${variants[variant]} ${props.className || ''}`} disabled={props.disabled || loading}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
function Spinner({ className = '' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
    </svg>
  );
}
function Alert({ kind = 'info', children }) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
  }[kind];
  return <div className={`rounded-xl border px-3 py-2 text-sm ${styles}`}>{children}</div>;
}
function Skeleton({ lines = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-200/70" />
      ))}
    </div>
  );
}

/* ============ PERFIL ============ */
function Perfil() {
  const [form, setForm] = useState({ name: '', locale: 'pt-BR', theme: 'light', notifications: true, email: '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setL] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setL(true); setErr(''); setMsg('');
        const token = localStorage.getItem('token');
        const resp = await api.get('/api/me/settings', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        const u = resp?.data?.user || {};
        setForm({
          name: u.name || '',
          email: u.email || '',
          locale: u?.settings?.locale || 'pt-BR',
          theme: u?.settings?.theme || 'light',
          notifications: u?.settings?.notifications !== false,
        });
      } catch (e) {
        setErr('Falha ao carregar perfil.');
      } finally {
        setL(false);
      }
    })();
  }, []);

  async function save() {
    try {
      setErr(''); setMsg(''); setSaving(true);
      const token = localStorage.getItem('token');
      const body = {
        name: form.name,
        settings: {
          locale: form.locale,
          theme: form.theme,
          notifications: !!form.notifications,
        }
      };
      await api.patch('/api/me/settings', body, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      setMsg('Perfil atualizado com sucesso.');
    } catch (e) {
      setErr('Não foi possível salvar seu perfil.');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!pwd.currentPassword || !pwd.newPassword) return setErr('Preencha as senhas.');
    try {
      setErr(''); setMsg(''); setChangingPwd(true);
      const token = localStorage.getItem('token');
      await api.patch('/api/me/password', pwd, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      setMsg('Senha alterada.');
      setPwd({ currentPassword: '', newPassword: '' });
    } catch (e) {
      const status = e?.response?.status;
      setErr(status === 401 ? 'Senha atual incorreta.' : 'Erro ao alterar senha.');
    } finally {
      setChangingPwd(false);
    }
  }

  return (
    <>
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <Alert kind="error">{err}</Alert>}

      <SectionCard
        title="Seu perfil"
        description="Informações básicas da sua conta."
        icon={<div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-700 grid place-items-center"><MailIcon className="h-5 w-5" /></div>}
        actions={<Badge tone="blue">IDIOMA: {form.locale}</Badge>}
      >
        {loading ? <Skeleton lines={6} /> : (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome completo">
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Seu nome" />
            </Field>
            <Field label="E-mail" hint="Seu e-mail de login (não editável).">
              <Input value={form.email} readOnly />
            </Field>
            <Field label="Idioma">
              <Select value={form.locale} onChange={e => setForm(f => ({ ...f, locale: e.target.value }))}>
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
              </Select>
            </Field>
            <Field label="Tema">
              <Select value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="system">Sistema</option>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Switch checked={form.notifications} onChange={(v) => setForm(f => ({ ...f, notifications: v }))} label="Ativar notificações" />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={save} loading={saving}><SaveIcon className="h-4 w-4" /> Salvar alterações</Button>
              <Button variant="secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Voltar ao topo</Button>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Segurança"
        description="Atualize sua senha periodicamente."
        icon={<div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-700 grid place-items-center"><KeyIcon className="h-5 w-5" /></div>}
      >
        {loading ? <Skeleton lines={4} /> : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Senha atual">
                <Input type="password" value={pwd.currentPassword} onChange={e => setPwd(p => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" />
              </Field>
              <Field label="Nova senha">
                <Input type="password" value={pwd.newPassword} onChange={e => setPwd(p => ({ ...p, newPassword: e.target.value }))} placeholder="••••••••" />
              </Field>
            </div>
            <div className="mt-3">
              <Button variant="secondary" onClick={changePassword} loading={changingPwd}><KeyIcon className="h-4 w-4" /> Alterar senha</Button>
            </div>
          </>
        )}
      </SectionCard>
    </>
  );
}

/* ============ EMPRESA ============ */
function Empresa() {
  const [form, setForm] = useState({ name: '', cnpj: '', contact: { email: '', phone: '' }, address: { street: '', city: '', state: '', zip: '' } });
  const [loading, setL] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setL(true); setErr(''); setMsg('');
        const token = localStorage.getItem('token');
        const resp = await api.get('/api/company/my', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
        const c = resp?.data?.company || {};
        setForm({
          name: c.name || '',
          cnpj: c.cnpj || '',
          contact: { email: c?.contact?.email || '', phone: c?.contact?.phone || '' },
          address: { street: c?.address?.street || '', city: c?.address?.city || '', state: c?.address?.state || '', zip: c?.address?.zip || '' },
        });
      } catch (e) {
        setErr('Falha ao carregar dados da empresa.');
      } finally {
        setL(false);
      }
    })();
  }, []);

  async function save() {
    try {
      setErr(''); setMsg(''); setSaving(true);
      const token = localStorage.getItem('token');
      const body = { name: form.name, contact: form.contact, address: form.address };
      await api.patch('/api/company/my', body, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      setMsg('Empresa atualizada.');
    } catch (e) {
      const status = e?.response?.status;
      setErr(status === 403 ? 'Sem permissão para alterar.' : 'Erro ao salvar empresa.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <Alert kind="error">{err}</Alert>}

      <SectionCard
        title="Dados da empresa"
        description="Nome, CNPJ e informações de contato."
        icon={<div className="h-10 w-10 rounded-xl bg-indigo-600/10 text-indigo-700 grid place-items-center"><BuildingIcon className="h-5 w-5" /></div>}
        actions={<Badge tone="green">Plano: Free</Badge>}
      >
        {loading ? <Skeleton lines={6} /> : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome da empresa">
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </Field>
              <Field label="CNPJ" hint="Somente leitura">
                <Input value={formatCnpj(form.cnpj)} readOnly />
              </Field>
              <Field label="E-mail (contato)">
                <div className="relative">
                  <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="pl-9" value={form.contact.email} onChange={e => setForm(f => ({ ...f, contact: { ...f.contact, email: e.target.value } }))} placeholder="contato@empresa.com.br" />
                </div>
              </Field>
              <Field label="Telefone">
                <div className="relative">
                  <PhoneIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="pl-9" value={form.contact.phone} onChange={e => setForm(f => ({ ...f, contact: { ...f.contact, phone: e.target.value } }))} placeholder="(00) 00000-0000" />
                </div>
              </Field>
              <Field label="Endereço">
                <div className="relative">
                  <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input className="pl-9" placeholder="Rua" value={form.address.street} onChange={e => setForm(f => ({ ...f, address: { ...f.address, street: e.target.value } }))} />
                </div>
              </Field>
              <Field label="Cidade">
                <Input value={form.address.city} onChange={e => setForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} />
              </Field>
              <Field label="Estado">
                <Input value={form.address.state} onChange={e => setForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} />
              </Field>
              <Field label="CEP">
                <Input value={form.address.zip} onChange={e => setForm(f => ({ ...f, address: { ...f.address, zip: e.target.value } }))} />
              </Field>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={save} loading={saving}><SaveIcon className="h-4 w-4" /> Salvar</Button>
            </div>
          </>
        )}
      </SectionCard>
    </>
  );
}

/* ============ USUÁRIOS ============ */
function Usuarios() {
  const [items, setItems] = useState([]);
  const [loading, setL] = useState(true);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [inviting, setInviting] = useState(false);

  const [invite, setInvite] = useState({ email: '', name: '', role: 'user', tempPassword: '' });

  async function load() {
    try {
      setErr(''); setMsg(''); setL(true);
      const token = localStorage.getItem('token');
      const resp = await api.get('/api/company/users', { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      setItems(resp?.data?.users || []);
    } catch (e) {
      const status = e?.response?.status;
      setErr(status === 403 ? 'Somente owner/admin podem gerenciar usuários.' : 'Erro ao carregar usuários.');
    } finally {
      setL(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function sendInvite() {
    try {
      setErr(''); setMsg(''); setInviting(true);
      const token = localStorage.getItem('token');
      await api.post('/api/company/users/invite', invite, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      setMsg('Convite enviado / usuário criado.');
      setInvite({ email: '', name: '', role: 'user', tempPassword: '' });
      load();
    } catch (e) {
      const status = e?.response?.status;
      const error = e?.response?.data?.error;
      setErr(error || (status === 409 ? 'E-mail já cadastrado.' : status === 403 ? 'Sem permissão.' : 'Erro ao convidar usuário.'));
    } finally {
      setInviting(false);
    }
  }

  return (
    <>
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <Alert kind="error">{err}</Alert>}

      <SectionCard
        title="Convidar usuário"
        description="Crie um acesso para sua equipe."
        icon={<div className="h-10 w-10 rounded-xl bg-emerald-600/10 text-emerald-700 grid place-items-center"><UserPlusIcon className="h-5 w-5" /></div>}
        actions={<Button variant="secondary" onClick={load}><RefreshIcon className="h-4 w-4" /> Atualizar</Button>}
      >
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="E-mail" value={invite.email} onChange={e => setInvite(i => ({ ...i, email: e.target.value }))} />
          <Input placeholder="Nome" value={invite.name} onChange={e => setInvite(i => ({ ...i, name: e.target.value }))} />
          <Select value={invite.role} onChange={e => setInvite(i => ({ ...i, role: e.target.value }))}>
            <option value="user">Usuário</option>
            <option value="admin">Admin</option>
          </Select>
          <Input placeholder="Senha temporária (opcional)" value={invite.tempPassword} onChange={e => setInvite(i => ({ ...i, tempPassword: e.target.value }))} />
        </div>
        <div className="mt-3">
          <Button variant="secondary" onClick={sendInvite} loading={inviting}><UserPlusIcon className="h-4 w-4" /> Convidar</Button>
        </div>
      </SectionCard>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900">Usuários da empresa</div>
          <div className="text-xs text-slate-500">{items.length} usuário(s)</div>
        </div>
        {loading ? <div className="p-4"><Skeleton lines={5} /></div> : (
          <ul className="divide-y divide-slate-100">
            {items.map(u => (
              <li key={u.id} className="flex items-center justify-between p-4 hover:bg-slate-50/70">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 grid place-items-center text-slate-600 font-semibold">{initials(u.name || u.email)}</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-800">{u.name || u.email}</div>
                    <div className="truncate text-xs text-slate-500">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge>{u.role}</Badge>
                  <Badge tone={u.status === 'active' ? 'green' : 'slate'}>{u.status}</Badge>
                </div>
              </li>
            ))}
            {items.length === 0 && (
              <li className="p-6 text-sm text-slate-500">Nenhum usuário encontrado.</li>
            )}
          </ul>
        )}
      </div>
    </>
  );
}

/* ------------------ EXIGÊNCIAS (checklist) ------------------ */
function Exigencias() {
  const [data, setData] = useState(null);     // checklist
  const [loading, setL] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setL(true); setErr(''); setMsg('');
        const token = localStorage.getItem('token');
        const resp = await api.get('/api/company/my/checklist', {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        setData(resp?.data?.checklist || null);
      } catch (e) {
        setErr('Falha ao carregar checklist.');
      } finally {
        setL(false);
      }
    })();
  }, []);

  async function save() {
    try {
      setErr(''); setMsg('');
      const token = localStorage.getItem('token');
      await api.patch('/api/company/my/checklist', { checklist: data }, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      setMsg('Exigências salvas.');
    } catch (e) {
      const status = e?.response?.status;
      setErr(status === 403 ? 'Somente owner/admin podem alterar.' : 'Erro ao salvar checklist.');
    }
  }

  const Section = ({ title, children }) => (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      <div className="grid gap-2 md:grid-cols-2">{children}</div>
    </div>
  );

  // deep clone com fallback
  const deepClone = (obj) => (typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)));

  const Check = ({ path, label }) => {
    const val = path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), data) ?? false;
    return (
      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={!!val}
          onChange={(e) => {
            const parts = path.split('.');
            setData(prev => {
              const copy = deepClone(prev);
              let p = copy;
              for (let i = 0; i < parts.length - 1; i++) p = p[parts[i]];
              p[parts.at(-1)] = e.target.checked;
              return copy;
            });
          }}
        />
        {label}
      </label>
    );
  };

  if (loading) return <Skeleton lines={6} />;
  if (!data)   return <Alert kind="error">Checklist indisponível.</Alert>;

  return (
    <div className="space-y-6">
      {msg && <Alert kind="success">{msg}</Alert>}
      {err && <Alert kind="error">{err}</Alert>}

      <Section title="Habilitação Jurídica">
        <Check path="habilitacaoJuridica.contratoSocial" label="Contrato/Estatuto social" />
        <Check path="habilitacaoJuridica.cnpjAtivo" label="CNPJ ativo" />
        <Check path="habilitacaoJuridica.procuracao" label="Procuração/poderes do representante" />
      </Section>

      <Section title="Regularidade Fiscal e Trabalhista">
        <Check path="regularidadeFiscalTrabalhista.receitaPgfn" label="Certidão conjunta Receita/PGFN" />
        <Check path="regularidadeFiscalTrabalhista.cndPrevidenciaria" label="CND Previdenciária (INSS)" />
        <Check path="regularidadeFiscalTrabalhista.crfFgts" label="CRF do FGTS" />
        <Check path="regularidadeFiscalTrabalhista.icms" label="Regularidade ICMS (estadual)" />
        <Check path="regularidadeFiscalTrabalhista.iss" label="Regularidade ISS (municipal)" />
        <Check path="regularidadeFiscalTrabalhista.cndt" label="CNDT – Débitos Trabalhistas" />
      </Section>

      <Section title="Qualificação Econômico-Financeira">
        <Check path="econFinanceira.balancoPatrimonial" label="Balanço patrimonial e DRE" />
        <Check path="econFinanceira.certidaoFalencia" label="Certidão de falência/recuperação" />
        <Check path="econFinanceira.capitalMinimoOuPL" label="Capital mínimo / Patrimônio líquido" />
      </Section>

      <Section title="Qualificação Técnica">
        <Check path="qualificacaoTecnica.atestadosCapacidade" label="Atestados de capacidade técnica" />
        <Check path="qualificacaoTecnica.artRrtCat" label="ART/RRT/CAT vinculadas" />
        <Check path="qualificacaoTecnica.registroConselho" label="Registro no conselho profissional" />
        <Check path="qualificacaoTecnica.responsavelTecnico" label="Responsável técnico/vínculo" />
      </Section>

      <Section title="Declarações">
        <Check path="declaracoes.propostaIndependente" label="Elaboração independente da proposta" />
        <Check path="declaracoes.inexistenciaFatoImped" label="Inexistência de fato impeditivo" />
        <Check path="declaracoes.menorAprendizRegras" label="Não emprega menor em condições vedadas" />
        <Check path="declaracoes.enquadramentoMeEpp" label="Enquadramento ME/EPP (se aplicável)" />
        <Check path="declaracoes.cumprimentoEditalAnticorrupcao" label="Cumprimento do edital/anticorrupção" />
        <Check path="declaracoes.credenciamentoPreposto" label="Credenciamento de preposto" />
      </Section>

      <Section title="Adicionais (conforme objeto)">
        <Check path="adicionais.vistoriaTecnica" label="Vistoria técnica" />
        <Check path="adicionais.certificacoesRegulatorios" label="Certificações/Regulatórios (INMETRO, ANVISA…)" />
        <Check path="adicionais.planoTrabalhoMetodologia" label="Plano de trabalho / metodologia" />
        <Check path="adicionais.garantiaProposta" label="Garantia de proposta" />
        <Check path="adicionais.garantiaContratual" label="Garantia contratual" />
        <Check path="adicionais.seguros" label="Seguros (RC, obras, etc.)" />
      </Section>

      <div className="rounded-lg border border-slate-200 p-4">
        <div className="mb-2 text-sm font-semibold text-slate-800">Observações</div>
        <Textarea
          value={data.observacoes || ''}
          onChange={(e) => setData(prev => ({ ...prev, observacoes: e.target.value }))}
          placeholder="Notas gerais sobre exigências da empresa…"
          className="min-h-[100px]"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={save}><SaveIcon className="h-4 w-4" /> Salvar</Button>
      </div>
    </div>
  );
}
