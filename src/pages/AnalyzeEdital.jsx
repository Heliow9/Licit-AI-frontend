import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";

import { apiFetch } from "../lib/api";
import ReportsList from "../components/ReportsList";

/* ========================= Base da API ========================= */
const API_BASE = import.meta.env.VITE_API_BASE || "https://licit-ai-api.onrender.com";

/* ========================= Utils de Markdown ========================= */
marked.setOptions({ breaks: true, gfm: true });

function stripInlineSizes(html) {
  return html
    .replace(/\swidth="[^"]*"/gi, "")
    .replace(/\sheight="[^"]*"/gi, "")
    .replace(/\sstyle="[^"]*(?:width|height)\s*:[^"]*"/gi, (match) => {
      return match
        .replace(/width\s*:[^;"]*;?/gi, "")
        .replace(/height\s*:[^;"]*;?/gi, "")
        .replace(/\sstyle="\s*"/, "");
    });
}
function mdToHtml(md) {
  if (!md) return "";
  const raw = marked.parse(md);
  const clean = DOMPurify.sanitize(raw, { ADD_ATTR: ["target", "rel"] });
  const normalized = stripInlineSizes(clean)
    .replace(/<hr\s*\/?>/gi, "")
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br/><br/>");
  return normalized.replaceAll(
    "<a ",
    '<a target="_blank" rel="noopener noreferrer" '
  );
}

function formatDate(iso) {
  if (!iso) return "Data indisponível";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "Data inválida";
  }
}
function cleanErrorMessage(msg) {
  if (!msg) return "Erro desconhecido";
  return msg.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/* ========================= Auth helpers ========================= */
const getToken = () => localStorage.getItem("token") || "";          // ✅
function getAuthHeaders() {
  const token = getToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}
function buildUrl(u) {
  return /^https?:\/\//i.test(u) ? u : `${API_BASE}${u}`;
}

/* ========================= Helpers PDF (fetch -> blob) ========================= */
async function blobUrlFromPdf(url) {
  const res = await fetch(buildUrl(url), {
    method: "GET",
    headers: getAuthHeaders(),
    Accept: "application/pdf",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao abrir PDF (${res.status}) ${text?.slice(0, 120)}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
async function openPdfInNewTab(url) {
  const blobUrl = await blobUrlFromPdf(url);
  window.open(blobUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
async function downloadPdf(url, filename = "Relatorio_de_Viabilidade.pdf") {
  const blobUrl = await blobUrlFromPdf(url);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

/* ========================= Hook: progresso via SSE + polling ========================= */
/** Tenta se inscrever no SSE; se falhar, faz polling em /status/:id */
function useJobProgress(jobId) {
  const [status, setStatus] = useState(null); // { id, status, pct, phase, startedAt, finishedAt }
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;

    // ✅ passa o token na query (EventSource não envia Authorization)
    const token = getToken();                                                   // ✅
    const q = token ? `?token=${encodeURIComponent(token)}` : "";               // ✅
    const streamUrl = `${API_BASE}/api/edital/analisar/stream/${jobId}${q}`;    // ✅

    let usingPolling = false;

    try {
      // Sem withCredentials: o auth vai na query
      const es = new EventSource(streamUrl);                                    // ✅
      esRef.current = es;

      es.onopen = () => setConnected(true);
      es.onerror = () => {
        setConnected(false);
        try { es.close(); } catch { }
        esRef.current = null;
        startPolling();
      };

      const onMsg = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          setStatus(data);
        } catch { }
      };

      es.addEventListener("snapshot", onMsg);
      es.addEventListener("update", onMsg);
      es.addEventListener("done", onMsg);
      es.addEventListener("error", onMsg);

      const cleanup = () => {
        try { es.close(); } catch { }
        esRef.current = null;
        stopPolling();
      };
      return cleanup;
    } catch {
      startPolling();
      return () => stopPolling();
    }

    function startPolling() {
      if (usingPolling) return;
      usingPolling = true;
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const j = await apiFetch(`/api/edital/analisar/status/${jobId}`);
          setStatus(j);
        } catch {
          /* silencioso */
        }
      }, 1200);
    }
    function stopPolling() {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [jobId]);

  return { status, connected };
}

/* ========================= Componente principal ========================= */
export default function AnalyzeEdital() {
  const [mode, setMode] = useState("basic");
  const [report, setReport] = useState("");
  const [outputs, setOutputs] = useState([]); // { url, filename }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editalFiles, setEditalFiles] = useState([]);
  const [anexosFiles, setAnexosFiles] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);

  // controle do job em background
  const [jobId, setJobId] = useState(() => localStorage.getItem("currentJobId") || "");
  const { status: jobStatus } = useJobProgress(jobId);

  const editalInputRef = useRef(null);
  const anexosInputRef = useRef(null);

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClickEdital = () => editalInputRef.current?.click();
  const handleClickAnexos = () => anexosInputRef.current?.click();

  const handleChangeEdital = (e) => {
    const all = Array.from(e.target.files || []).filter((f) => /pdf$/i.test(f.name));
    setEditalFiles(mode === "basic" ? all.slice(0, 1) : all);
  };
  const handleChangeAnexos = (e) => {
    setAnexosFiles(Array.from(e.target.files || []));
  };
  const handleDropEdital = (e) => {
    prevent(e);
    const dropped = Array.from(e.dataTransfer.files || []).filter((f) => /pdf$/i.test(f.name));
    setEditalFiles(mode === "basic" ? dropped.slice(0, 1) : dropped);
  };
  const handleDropAnexos = (e) => {
    prevent(e);
    setAnexosFiles(Array.from(e.dataTransfer.files || []));
  };

  // retoma job salvo (se recarregar página)
  useEffect(() => {
    const saved = localStorage.getItem("currentJobId");
    if (saved && !jobId) setJobId(saved);
    // eslint-disable-next-line
  }, []);

  // responde à evolução do job
  useEffect(() => {
    (async () => {
      if (!jobStatus) return;

      if (jobStatus.status === "done") {
        try {
          const res = await apiFetch(`/api/edital/analisar/result/${jobStatus.id}`);
          setReport(res.report || "");
          setOutputs(res.pdf ? [res.pdf] : []);
          setError("");
        } catch (e) {
          setError("Falha ao obter resultado final.");
        } finally {
          localStorage.removeItem("currentJobId");
          setJobId("");
          setLoading(false);
        }
      }
     else if (jobStatus.status === "error") {
      setError(jobStatus.error ? `Falha: ${jobStatus.error}` :
        jobStatus.phase ? `Falha na análise: ${jobStatus.phase}` :
          "Falha na análise.");
      localStorage.removeItem("currentJobId");
      setJobId("");
      setLoading(false);
    } else {
      // running
      setLoading(true);
    }
  })();
}, [jobStatus]);

async function handleSubmit(e) {
  e.preventDefault();
  setReport("");
  setError("");

  try {
    if (!editalFiles.length) throw new Error("Selecione pelo menos 1 PDF do edital.");

    const form = new FormData();
    for (const f of editalFiles) form.append("editalPdf", f);
    if (mode === "super") for (const f of anexosFiles) form.append("arquivos[]", f);

    // ✅ use fetch direto para garantir Authorization com FormData
    const res = await fetch(buildUrl("/api/edital/analisar/start"), {
      method: "POST",
      headers: getAuthHeaders(),               // não setar Content-Type com FormData!
      body: form,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${t}`);
    }
    const j = await res.json();

    if (!j?.jobId) throw new Error("Falha ao iniciar job de análise.");
    setJobId(j.jobId);
    localStorage.setItem("currentJobId", j.jobId);
    setLoading(true);
    setOutputs([]);
  } catch (err) {
    const msg =
      err?.message === "UNAUTHORIZED"
        ? "Sessão expirada. Faça login novamente."
        : cleanErrorMessage(err?.message) || "Erro ao iniciar análise.";
    setError(msg);
    setLoading(false);
  }
}

// 👉 Gera PDF a partir do relatório atual (quando quiser)
async function handleGeneratePdf() {
  if (!report) {
    setError("Não há relatório para gerar PDF. Faça uma análise primeiro.");
    return;
  }
  setError("");
  setPdfLoading(true);
  try {
    // pode ficar com apiFetch se ele já injeta Authorization
    const j = await apiFetch("/api/edital/gerar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportMd: report }),
    });
    if (!j?.url) throw new Error("A API não retornou a URL do PDF.");

    setOutputs((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      if (!next.find((x) => x.url === j.url)) {
        next.unshift({
          url: j.url,
          filename: j.filename || "Relatorio_de_Viabilidade.pdf",
        });
      }
      return next;
    });

    await downloadPdf(j.url, j.filename || "Relatorio_de_Viabilidade.pdf");
  } catch (err) {
    setError(cleanErrorMessage(err?.message) || "Falha ao gerar o PDF.");
  } finally {
    setPdfLoading(false);
  }
}

const progressPct = Math.round(Math.max(0, Math.min(100, jobStatus?.pct || 0)));
const progressPhase = jobStatus?.phase || (jobId ? "Iniciando..." : "");

return (
  <div className="space-y-8 max-w-4xl mx-auto py-10 px-4 wrap-anywhere">
    {/* Voltar */}
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

    {/* Título */}
    <div className="space-y-2 text-center">
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Analisar Edital</h1>
      <p className="text-slate-500">Faça o upload dos documentos para uma análise inteligente e detalhada.</p>
    </div>

    {/* Indicador de Progresso (persistente) */}
    {jobId && (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Processando análise</span>
          <span className="text-xs text-slate-500">{progressPhase}</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div className="h-2 bg-blue-600 transition-all" style={{ width: `${Math.max(5, progressPct)}%` }} />
        </div>
        <div className="mt-2 text-right text-xs text-slate-500">{progressPct}%</div>
      </div>
    )}

    {/* Toggle */}
    <div className="flex justify-center">
      <div className="relative flex w-full sm:w-fit p-1 bg-slate-200 rounded-full">
        <span
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${mode === "super" ? "translate-x-full" : "translate-x-0"
            }`}
        />
        <button
          type="button"
          onClick={() => setMode("basic")}
          disabled={!!jobId}
          className={`relative z-10 w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${mode === "basic" ? "text-blue-600" : "text-slate-600"
            } ${jobId ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          Análise Rápida
        </button>
        <button
          type="button"
          onClick={() => setMode("super")}
          disabled={!!jobId}
          className={`relative z-10 w-1/2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${mode === "super" ? "text-blue-600" : "text-slate-600"
            } ${jobId ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          Super Análise
        </button>
      </div>
    </div>

    {/* Formulário */}
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Upload edital */}
      <div>
        <label htmlFor="edital" className="text-sm font-medium text-slate-700">
          PDF(s) do Edital
        </label>
        <div
          className={`mt-2 flex justify-center rounded-lg border-2 border-dashed border-slate-300 px-6 py-10 transition cursor-pointer ${jobId ? "opacity-60 cursor-not-allowed" : "hover:border-blue-500"
            }`}
          role="button"
          tabIndex={0}
          onClick={!jobId ? handleClickEdital : undefined}
          onKeyDown={(e) => (!jobId && (e.key === "Enter" || e.key === " ") ? handleClickEdital() : null)}
          onDragOver={!jobId ? prevent : undefined}
          onDrop={!jobId ? handleDropEdital : undefined}
        >
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-semibold text-blue-600">Clique para carregar</span> ou arraste e solte
            </p>
            <p className="text-xs text-slate-500">{mode === "basic" ? "Apenas 1 PDF." : "Apenas arquivos PDF."}</p>
            {editalFiles.length > 0 && (
              <p className="mt-2 text-xs text-emerald-600">{editalFiles.length} arquivo(s) selecionado(s)</p>
            )}
            <input
              id="edital"
              name="edital"
              ref={editalInputRef}
              type="file"
              accept="application/pdf"
              multiple={mode !== "basic"}
              required
              disabled={!!jobId}
              className="sr-only"
              onChange={handleChangeEdital}
            />
          </div>
        </div>
      </div>

      {/* Upload anexos (Super) */}
      {mode === "super" && (
        <div>
          <label htmlFor="anexos" className="text-sm font-medium text-slate-700">
            Anexos e Outros Arquivos (opcional)
          </label>
          <div
            className={`mt-2 flex justify-center rounded-lg border-2 border-dashed border-slate-300 px-6 py-10 transition cursor-pointer ${jobId ? "opacity-60 cursor-not-allowed" : "hover:border-blue-500"
              }`}
            role="button"
            tabIndex={0}
            onClick={!jobId ? handleClickAnexos : undefined}
            onKeyDown={(e) => (!jobId && (e.key === "Enter" || e.key === " ") ? handleClickAnexos() : null)}
            onDragOver={!jobId ? prevent : undefined}
            onDrop={!jobId ? handleDropAnexos : undefined}
          >
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" />
              </svg>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-semibold text-blue-600">Clique para carregar</span> ou arraste e solte
              </p>
              {anexosFiles.length > 0 && (
                <p className="mt-2 text-xs text-emerald-600">{anexosFiles.length} arquivo(s) selecionado(s)</p>
              )}
              <input
                id="anexos"
                name="anexos"
                ref={anexosInputRef}
                type="file"
                multiple
                disabled={!!jobId}
                className="sr-only"
                onChange={handleChangeAnexos}
              />
            </div>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Botões principais */}
      <div className="pt-2 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={loading || !!jobId}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading || jobId ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.414l2.26-2.26A4 4 0 1011 5z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span>
            {loading || jobId ? (mode === "super" ? "Processando..." : "Analisando...") : "Analisar Agora"}
          </span>
        </button>

        <button
          type="button"
          onClick={handleGeneratePdf}
          disabled={pdfLoading || !report || !!jobId}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          title={!report ? "Gere um relatório primeiro" : "Gerar PDF a partir do relatório atual"}
        >
          {pdfLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 7h-4V3H9v4H5l7 7 7-7z" />
              <path d="M5 18h14v2H5z" />
            </svg>
          )}
          <span>{pdfLoading ? "Gerando PDF..." : "Gerar PDF"}</span>
        </button>
      </div>
    </form>

    {/* Relatório da Análise */}
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Relatório da Análise</h2>
        <button
          type="button"
          onClick={handleGeneratePdf}
          disabled={pdfLoading || !report || !!jobId}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          title={!report ? "Gere um relatório primeiro" : "Gerar PDF"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 7h-4V3H9v4H5l7 7 7-7z" />
            <path d="M5 18h14v2H5z" />
          </svg>
          Gerar PDF
        </button>
      </div>

      {!report ? (
        <div className="p-4 rounded-lg bg-slate-50 min-h-[100px] grid place-items-center">
          <p className="text-sm text-slate-500">
            {loading || jobId ? "Processando e gerando o relatório..." : "O resultado da análise aparecerá aqui."}
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-slate-50">
          <div className="relative max-h-[70vh] overflow-auto">
            <article
              className={[
                "prose prose-sm max-w-full",
                "break-words hyphens-auto whitespace-normal leading-relaxed",
                "[&_p]:my-2 [&_ul]:my-2 [&_li]:my-1",
                "[&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:mt-2 [&_h3]:mb-1",
              ].join(" ")}
              dangerouslySetInnerHTML={{ __html: mdToHtml(report) }}
            />
          </div>
        </div>
      )}
    </section>

    {/* Saídas PDF */}
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-4">Relatórios Gerados (PDF)</h2>
      {outputs.length === 0 ? (
        <div className="p-4 rounded-lg bg-slate-50 min-h-[60px] flex items-center justify-center">
          <p className="text-sm text-slate-500">
            {loading || pdfLoading || jobId ? "Gerando arquivos..." : "Nenhum PDF foi gerado para esta análise."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200">
          {outputs.map((o, idx) => (
            <li
              key={idx}
              className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between wrap-anywhere"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-700">
                  {o.filename || "Relatório de Viabilidade"}
                </p>
                <p className="text-xs text-slate-500">{formatDate(new Date())}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => openPdfInNewTab(o.url)}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Abrir
                </button>
                <button
                  type="button"
                  onClick={() => downloadPdf(o.url, o.filename || undefined)}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Baixar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>

    {/* Histórico / Relatórios anteriores */}
    <div className="wrap-anywhere">
      <ReportsList pageSize={10} refresh={pdfLoading} />
    </div>
  </div>
);
}
