// src/pages/Cats.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function Progress({ value = 0 }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded bg-slate-200">
      <div
        className="h-full bg-blue-600 transition-[width]"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function Cats() {
  const [syncing, setSyncing] = useState(false);
  const [jobId, setJobId] = useState("");
  const [progress, setProgress] = useState(0);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncErr, setSyncErr] = useState("");

  const [files, setFiles] = useState([]);
  const [gestor, setGestor] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadErr, setUploadErr] = useState("");
  const inputRef = useRef(null);

  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [errList, setErrList] = useState("");

  // Helpers
  const token = useMemo(() => localStorage.getItem("token"), []);
  const authHeader = useMemo(
    () => ({ Authorization: token ? `Bearer ${token}` : "" }),
    [token]
  );

  // ==== LISTAGEM ============================================================
  async function loadList() {
    try {
      setErrList("");
      setListLoading(true);
      const [{ data: c }, { data: l }] = await Promise.all([
        api.get("/api/cats/count", { headers: authHeader }),
        api.get(`/api/cats?q=${encodeURIComponent(q)}&limit=50&skip=0`, {
          headers: authHeader,
        }),
      ]);
      setTotal(c?.total ?? 0);
      setItems(l?.items ?? []);
    } catch (e) {
      setErrList("Falha ao carregar CATs.");
      setItems([]);
      setTotal(0);
    } finally {
      setListLoading(false);
    }
  }
  useEffect(() => { loadList(); /* on mount */ }, []); // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(() => loadList(), 350);
    return () => clearTimeout(t);
  }, [q]); // pequena debounce

  // ==== SYNC DISK (assíncrono + polling) ====================================
  async function startSync() {
    try {
      setSyncErr("");
      setSyncMsg("");
      setProgress(0);
      setSyncing(true);

      const { data } = await api.post(
        "/api/cats/sync-from-disk?async=1",
        {},
        { headers: authHeader }
      );
      if (!data?.jobId) throw new Error("Sem jobId");
      setJobId(data.jobId);
      pollStatus(data.jobId);
    } catch (e) {
      setSyncErr(e?.response?.data?.error || "Erro ao iniciar sincronização.");
      setSyncing(false);
    }
  }

  async function pollStatus(id) {
    let finished = false;
    const int = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/cats/sync-status?jobId=${id}`, {
          headers: authHeader,
        });
        setProgress(data?.progress ?? 0);
        if (data?.status === "completed") {
          finished = true;
          clearInterval(int);
          setSyncMsg(
            `Sincronização concluída. Processados: ${data?.result?.processed ?? 0}`
          );
          setSyncing(false);
          loadList();
        } else if (data?.status === "failed") {
          finished = true;
          clearInterval(int);
          setSyncErr(data?.error || "Falha na sincronização.");
          setSyncing(false);
        }
      } catch (e) {
        // se status 404 aqui, o job pode ter expirado/servidor reiniciou
        finished = true;
        clearInterval(int);
        setSyncErr("Status do job indisponível.");
        setSyncing(false);
      }
    }, 1200);

    // safety timeout (2min) para não ficar infinito
    setTimeout(() => {
      if (!finished) {
        clearInterval(int);
        setSyncErr("Tempo esgotado consultando o job.");
        setSyncing(false);
      }
    }, 2 * 60 * 1000);
  }

  // ==== UPLOAD ==============================================================
  async function doUpload() {
    if (!files?.length) {
      setUploadErr("Selecione ao menos um arquivo.");
      return;
    }
    try {
      setUploadErr("");
      setUploadMsg("");
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      fd.append("gestor", gestor || "desconhecido");

      const { data } = await api.post("/api/cats/upload", fd, {
        headers: { ...authHeader /* axios cuida do boundary */ },
      });
      setUploadMsg(
        `Upload finalizado. Processados: ${data?.processed ?? 0} (${data?.results?.length ?? 0} arquivo[s])`
      );
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      loadList();
    } catch (e) {
      setUploadErr(e?.response?.data?.error || "Erro no upload.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">CATs</h1>
        <Link
          to="/"
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          Voltar ao Dashboard
        </Link>
      </div>

      {/* Sync from disk */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
        <div className="text-sm text-gray-600">
          Sincronize os arquivos da sua empresa a partir do diretório raiz
          configurado no servidor (<code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5">CATS_ROOT/&lt;companyId&gt;/</code>).
        </div>

        {syncErr && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {syncErr}
          </div>
        )}
        {syncMsg && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {syncMsg}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={startSync}
            disabled={syncing}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            {syncing ? "Sincronizando..." : "Sincronizar do Disco"}
          </button>

          {syncing && (
            <div className="flex-1">
              <Progress value={progress} />
              <div className="mt-1 text-xs text-gray-500">
                Progresso: {progress}%
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Upload manual */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Upload manual</h2>
        {uploadErr && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {uploadErr}
          </div>
        )}
        {uploadMsg && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {uploadMsg}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-[1fr,2fr]">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Gestor (pasta lógica)"
            value={gestor}
            onChange={(e) => setGestor(e.target.value)}
          />
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <button
            onClick={doUpload}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Enviar arquivo(s)
          </button>
        </div>
        {!!files.length && (
          <div className="text-xs text-gray-500">
            Selecionados: {files.length} arquivo(s)
          </div>
        )}
      </section>

      {/* Lista de CATs */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            CATs da Empresa
          </h2>
          <div className="text-xs text-gray-500">Total: {total}</div>
        </div>

        <div className="relative">
          <input
            placeholder="Buscar por gestor / nome do arquivo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="rounded-lg border">
          <div className="grid grid-cols-12 gap-2 border-b bg-slate-50 p-2 text-xs font-semibold text-slate-700">
            <div className="col-span-4">Source</div>
            <div className="col-span-3">Gestor</div>
            <div className="col-span-3">Arquivo</div>
            <div className="col-span-2 text-right">Chunks</div>
          </div>
          {listLoading ? (
            <div className="p-3 text-sm text-gray-500">Carregando…</div>
          ) : items.length ? (
            <ul className="divide-y">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="grid grid-cols-12 gap-2 p-2 text-sm text-slate-700"
                >
                  <div className="col-span-4 truncate">{it.source}</div>
                  <div className="col-span-3 truncate">{it.gestor}</div>
                  <div className="col-span-3 truncate">{it.fileName}</div>
                  <div className="col-span-2 text-right">
                    {it.chunkCount ?? 0}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-sm text-gray-500">
              Nenhuma CAT encontrada.
            </div>
          )}
          {errList && (
            <div className="p-3 text-sm text-rose-600">{errList}</div>
          )}
        </div>
      </section>
    </div>
  );
}
