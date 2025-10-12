// src/hooks/useJobProgress.js
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api2';

/**
 * Hook de progresso de job com SSE + fallback polling.
 *
 * @param {string} jobId
 * @param {object} opts
 * @param {number} [opts.pollInterval=1200] - intervalo do polling (ms)
 * @param {function} [opts.onNotFound] - chamado quando API retorna 404 (job sumiu / reinício)
 * @param {boolean} [opts.trySSE=true] - tenta SSE antes do polling
 * @param {() => string} [opts.getToken] - opcional: função que retorna o JWT para mandar no query do SSE (?access_token=)
 * @returns {{ status: any, connected: boolean, transport: 'sse' | 'poll' | null, error: string | null }}
 */
export function useJobProgress(jobId, opts = {}) {
  const {
    pollInterval = 1200,
    onNotFound,
    trySSE = true,
    getToken,
  } = opts;

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  const [status, setStatus] = useState(null);      // { id, status, pct, phase, ... }
  const [connected, setConnected] = useState(false);
  const [transport, setTransport] = useState(null); // 'sse' | 'poll' | null
  const [error, setError] = useState(null);

  const esRef = useRef(null);
  const pollRef = useRef(null);
  const visibleRef = useRef(typeof document !== 'undefined' ? !document.hidden : true);

  // limpa tudo ao desmontar / trocar jobId
  useEffect(() => {
    return () => {
      try { esRef.current?.close?.(); } catch {}
      esRef.current = null;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, []);

  // pausa/resume quando a aba fica oculta/visível
  useEffect(() => {
    const onVis = () => {
      visibleRef.current = !document.hidden;
      if (!visibleRef.current) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } else {
        // retoma polling se já estávamos no modo polling
        if (transport === 'poll' && jobId) {
          startPolling();
          // e faz um ping imediato
          void fetchStatusOnce();
        }
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
      return () => document.removeEventListener('visibilitychange', onVis);
    }
  }, [transport, jobId]);

  // principal
  useEffect(() => {
    // reset de estado sempre que jobId muda
    setStatus(null);
    setConnected(false);
    setTransport(null);
    setError(null);

    // encerra recursos anteriores
    try { esRef.current?.close?.(); } catch {}
    esRef.current = null;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;

    if (!jobId) return;

    // 1) tenta SSE (se o backend aceitar token por query OU se usa cookie-based auth)
    if (trySSE) {
      const token = typeof getToken === 'function' ? (getToken() || '') : '';
      const qs = token ? `?access_token=${encodeURIComponent(token)}` : '';
      const streamUrl = `${API_BASE}/api/edital/analisar/stream/${encodeURIComponent(jobId)}${qs}`;

      try {
        const es = new EventSource(streamUrl /* , { withCredentials: true } */);
        esRef.current = es;

        es.onopen = () => {
          setConnected(true);
          setTransport('sse');
          setError(null);
        };
        const onMsg = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            setStatus(data);
          } catch {}
        };
        es.addEventListener('snapshot', onMsg);
        es.addEventListener('update', onMsg);
        es.addEventListener('done', onMsg);
        es.addEventListener('error', async () => {
          // Muitas APIs protegem /stream com Authorization header -> EventSource NÃO envia => 401
          // Nesse caso, caímos para polling automaticamente.
          setConnected(false);
          setTransport(null);
          try { es.close(); } catch {}
          esRef.current = null;
          startPolling();
          // faz um ping imediato para atualizar UI
          await fetchStatusOnce();
        });

        // cleanup deste attempt
        return () => {
          try { es.close(); } catch {}
          esRef.current = null;
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        };
      } catch {
        // navegador bloqueou / erro de CORS etc. -> polling
        startPolling();
        void fetchStatusOnce();
        return () => {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        };
      }
    } else {
      // 2) direto polling
      startPolling();
      void fetchStatusOnce();
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
      };
    }

    // ===== helpers dentro do effect =====
    async function fetchStatusOnce() {
      try {
        const j = await apiFetch(`/api/edital/analisar/status/${encodeURIComponent(jobId)}`);
        setStatus(j);
        setError(null);
      } catch (e) {
        const msg = String(e?.message || '');
        // 404 -> job sumiu (reinício, id inválido, expurgo)
        if (msg.includes('404')) {
          setError('Job não encontrado.');
          if (typeof onNotFound === 'function') onNotFound(jobId);
        } else {
          setError(msg || 'Falha ao obter status.');
        }
      }
    }

    function startPolling() {
      if (!visibleRef.current) return; // se aba invisível, espera voltar
      if (pollRef.current) clearInterval(pollRef.current);
      setTransport('poll');
      pollRef.current = setInterval(async () => {
        try {
          const j = await apiFetch(`/api/edital/analisar/status/${encodeURIComponent(jobId)}`);
          setStatus(j);
          setError(null);
        } catch (e) {
          const msg = String(e?.message || '');
          if (msg.includes('404')) {
            setError('Job não encontrado.');
            if (typeof onNotFound === 'function') onNotFound(jobId);
            clearInterval(pollRef.current);
            pollRef.current = null;
          } else {
            setError(msg || 'Falha ao obter status.');
          }
        }
      }, Math.max(700, Number(pollInterval) || 1200));
    }
  }, [jobId, trySSE, pollInterval, API_BASE, onNotFound, getToken]);

  return { status, connected, transport, error };
}
