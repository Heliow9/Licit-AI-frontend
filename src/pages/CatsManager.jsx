// src/pages/CatsManager.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { Link } from "react-router-dom";

function ResultDisplay({ result }) {
  if (!result) return null;
  const hasError = !!result.error;
  const borderColor = hasError ? "border-red-300" : "border-emerald-300";
  const bgColor = hasError ? "bg-red-50" : "bg-emerald-50";
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold mb-2 text-slate-600">Resultado da Operação</h3>
      <pre className={`mt-2 p-4 rounded-lg border ${borderColor} ${bgColor} overflow-auto text-xs text-slate-800`}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

const LS_SYNC_KEY = "cats:syncJob"; // { jobId: string }

export default function CatsManager() {
  const [gestor, setGestor] = useState("");
  const [files, setFiles] = useState([]);
  const [force, setForce] = useState(false);

  // Estados de upload (mantidos como antes)
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Estados de sincronização com job
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncProgress, setSyncProgress] = useState(null); // 0..100 opcional
  const [syncStatus, setSyncStatus] = useState(null); // running | completed | failed | null

  const pollTimer = useRef(null);

  const hasRunningJob = useMemo(() => syncStatus === "running" || syncLoading, [syncStatus, syncLoading]);

  // --- Helpers de LocalStorage
  function saveSyncJob(jobId) {
    localStorage.setItem(LS_SYNC_KEY, JSON.stringify({ jobId }));
  }
  function readSyncJob() {
    try {
      const raw = localStorage.getItem(LS_SYNC_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj?.jobId) return obj.jobId;
    } catch {}
    return null;
  }
  function clearSyncJob() {
    localStorage.removeItem(LS_SYNC_KEY);
  }

  // --- Polling controlado por visibilidade da aba
  async function fetchStatus(jobId) {
    try {
      const data = await apiFetch(`/api/cats/sync-status?jobId=${encodeURIComponent(jobId)}`);
      // Espera: { status: "running"|"completed"|"failed", progress?, result?, error? }
      setSyncStatus(data.status || null);
      if (typeof data.progress === "number") setSyncProgress(data.progress);
      if (data.status === "completed") {
        setSyncResult(data.result ?? { ok: true, message: "Sincronização concluída." });
        clearSyncJob();
        stopPolling();
      } else if (data.status === "failed") {
        setSyncResult({ error: data.error || "Falha na sincronização." });
        clearSyncJob();
        stopPolling();
      }
    } catch (e) {
      // Em caso de erro transitório, mantemos o polling por alguns ciclos.
      setSyncResult((prev) => prev ?? { warning: "Erro ao consultar status, tentando novamente...", detail: e.message });
    }
  }

  function startPolling(jobId, intervalMs = 2000) {
    stopPolling();
    pollTimer.current = setInterval(() => {
      // Pausa quando a aba não está visível para reduzir carga
      if (document.hidden) return;
      fetchStatus(jobId);
    }, intervalMs);
  }

  function stopPolling() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }

  useEffect(() => {
    // Ao montar, se houver job pendente, retoma o acompanhamento
    const existing = readSyncJob();
    if (existing) {
      setSyncLoading(true);
      setSyncStatus("running");
      setSyncProgress(null);
      setSyncResult(null);
      fetchStatus(existing);
      startPolling(existing);
    }
    // Limpeza ao desmontar
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Se a guia voltar a ficar visível, dispara um status imediato
    function onVisibility() {
      const jobId = readSyncJob();
      if (!document.hidden && jobId && syncStatus === "running") {
        fetchStatus(jobId);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncStatus]);

  // --- Ação: iniciar sincronização assíncrona
  const handleSync = async () => {
    // Se já há job rodando, não deixa reiniciar
    const existing = readSyncJob();
    if (existing) return;

    setSyncLoading(true);
    setSyncResult(null);
    setSyncProgress(null);
    setSyncStatus("running");

    try {
      // Importante: backend deve aceitar async=1 e retornar { jobId }
      const data = await apiFetch(`/api/cats/sync-from-disk?force=${force ? "1" : "0"}&async=1`, {
        method: "POST",
      });

      const jobId = data?.jobId;
      if (!jobId) {
        // fallback: se o backend ainda não está async, trata como síncrono antigo
        setSyncLoading(false);
        setSyncStatus(null);
        setSyncResult(data);
        return;
      }

      saveSyncJob(jobId);
      startPolling(jobId);
    } catch (e) {
      setSyncResult({ error: e.message, status: e.status });
      setSyncLoading(false);
      setSyncStatus(null);
    }
  };

  // --- Upload (igual ao seu, sem job persistente)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files?.length) return;
    setUploadLoading(true);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append("gestor", gestor || "desconhecido");
      [...files].forEach((f) => fd.append("files", f));
      const data = await apiFetch("/api/cats/upload", {
        method: "POST",
        body: fd,
      });
      setUploadResult(data);
      e.target.reset();
      setFiles([]);
    } catch (e) {
      setUploadResult({ error: e.message, status: e.status });
    } finally {
      setUploadLoading(false);
    }
  };

  // Texto dinâmico do botão
  const syncBtnLabel = hasRunningJob
    ? (typeof syncProgress === "number" ? `Sincronizando... ${syncProgress}%` : "Sincronizando...")
    : "Sincronizar Agora";

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para o Dashboard
        </Link>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Gerenciador de CATs</h1>
        <p className="text-slate-500">Ferramentas para sincronização e upload de Certidões de Acervo Técnico.</p>
      </div>

      {/* Sincronização */}
      <section className="border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5V4H4zm0 9h5v5H4v-5zm9-9h5v5h-5V4zm0 9h5v5h-5v-5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Sincronizar CATs do Servidor</h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Esta ação varre o diretório <code>CATS_ROOT</code> no servidor e ingere/atualiza os documentos no banco de dados.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2 pl-14">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={force}
              onChange={() => setForce((v) => !v)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              disabled={hasRunningJob}
            />
            Reprocessar arquivos existentes (force)
          </label>

          <button
            onClick={handleSync}
            disabled={hasRunningJob}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {hasRunningJob ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
              </svg>
            )}
            <span>{syncBtnLabel}</span>
          </button>
        </div>

        {/* Barra de progresso opcional */}
        {hasRunningJob && (
          <div className="pl-14 mt-3">
            <div className="w-full h-2 bg-slate-200 rounded">
              <div
                className="h-2 bg-blue-600 rounded transition-all"
                style={{ width: typeof syncProgress === "number" ? `${Math.min(100, Math.max(0, syncProgress))}%` : "35%" }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {typeof syncProgress === "number" ? `Progresso: ${syncProgress}%` : "Processando..."}
            </p>
          </div>
        )}

        <ResultDisplay result={syncResult} />
      </section>

      {/* Upload (sem mudanças funcionais) */}
      <section className="border border-slate-200 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-600 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Upload de Novas CATs</h2>
            <p className="text-sm text-slate-500 mt-1">Envie um ou mais arquivos de CAT para serem processados e salvos no sistema.</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="grid gap-6 mt-4 pl-14">
          <div>
            <label htmlFor="gestor" className="text-sm font-medium text-slate-700">Nome do Gestor (pasta lógica)</label>
            <input
              id="gestor"
              className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              placeholder="Ex: Alberto Cardoso"
              value={gestor}
              onChange={(e) => setGestor(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Arquivos (PDF, PNG, JPG, TIFF)</label>
            <label
              htmlFor="files-upload"
              className="mt-1 flex justify-center cursor-pointer rounded-lg border-2 border-dashed border-slate-300 px-6 py-10 hover:border-blue-500 transition"
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" />
                </svg>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-semibold text-blue-600">Clique para carregar</span> ou arraste e solte
                </p>
                {files?.length > 0 ? (
                  <p className="text-xs text-emerald-600 font-medium mt-1">{files.length} arquivo(s) selecionado(s)</p>
                ) : (
                  <p className="text-xs text-slate-500">Múltiplos arquivos são permitidos</p>
                )}
                <input
                  id="files-upload"
                  type="file"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                  className="sr-only"
                  accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff"
                />
              </div>
            </label>
          </div>

          <div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={uploadLoading || !files || files.length === 0}
            >
              {uploadLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 9.414V13h-1.5a.5.5 0 010-1H13V9.5a.5.5 0 01.146-.354l.004-.004L14.293 8.5l-2.647-2.646a.5.5 0 010-.708l.004-.004a.5.5 0 01.35-.146h.004a.5.5 0 01.354.146L11 9.293V13H5.5z" />
                </svg>
              )}
              <span>{uploadLoading ? "Enviando..." : "Enviar CATs"}</span>
            </button>
          </div>
        </form>
        <ResultDisplay result={uploadResult} />
      </section>
    </div>
  );
}
