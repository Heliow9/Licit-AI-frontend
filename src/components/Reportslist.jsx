import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

/* ========= helpers de PDF com AUTH ========= */
function getAuthHeaders() {
  const tk = localStorage.getItem("token") || "";
  const h = {};
  if (tk) h["Authorization"] = `Bearer ${tk}`;
  return h;
}
function buildUrl(u) {
  return /^https?:\/\//i.test(u) ? u : `${API_BASE}${u}`;
}
async function blobUrlFromPdf(url) {
  const res = await fetch(buildUrl(url), {
    headers: getAuthHeaders(),
    credentials: "include",
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
async function downloadPdf(url, filename = "Relatorio.pdf") {
  const blobUrl = await blobUrlFromPdf(url);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

/* ========= componente ========= */
export default function ReportsList({ pageSize = 10, initialQuery = "", refresh }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // monta querystring com page, pageSize e q (se houver)
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        if (q) params.set("q", q);

        // rota do histórico
        const data = await apiFetch(`/api/edital/analisar/history?${params.toString()}`);

        if (cancel) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(Number.isFinite(data.total) ? data.total : 0);
      } catch (e) {
        if (!cancel) setErr(e?.message || "Erro ao carregar relatórios.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [page, pageSize, q, refresh]);

  function onSearchSubmit(e) {
    e.preventDefault();
    const nv = e.target.q.value.trim();
    setPage(1);
    setQ(nv);
  }

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Relatórios (histórico)</h2>
        <form onSubmit={onSearchSubmit} className="flex w-full max-w-lg gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por órgão ou objeto…"
            className="w-full rounded-lg border px-3 py-2"
          />
          <button className="rounded-lg border px-3 py-2 hover:bg-gray-50">Buscar</button>
        </form>
      </div>

      {err && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum relatório encontrado.</p>
      ) : (
        <>
          <ul className="divide-y">
            {items.map((it, idx) => {
              const url = it.pdfUrl || it.url;
              const titulo = it.title || it.filename || "Relatório";
              const key = it.id || it._id || `${titulo}-${idx}`;
              const disabled = !url;

              return (
                <li
                  key={key}
                  className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{titulo}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(it.createdAt)} • {it.filename || "arquivo.pdf"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => openPdfInNewTab(url)}
                      className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                      title={disabled ? "Sem URL de PDF" : "Abrir em nova aba"}
                    >
                      Abrir
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => downloadPdf(url, it.filename || "Relatorio.pdf")}
                      className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                      title={disabled ? "Sem URL de PDF" : "Baixar PDF"}
                    >
                      Baixar PDF
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* paginação */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Página {page} de {totalPages} — {total} resultado{total === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function formatDate(iso) {
  if (!iso) return "Data indisponível";
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "Data inválida";
  }
}
