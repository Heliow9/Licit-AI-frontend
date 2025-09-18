// src/hooks/useJobProgress.js
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';

export function useJobProgress(jobId) {
  const [status, setStatus] = useState(null); // { id, status, pct, phase, ... }
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;
    // 1) tenta SSE
    const url = `/api/edital/analisar/stream/${jobId}`;
    try {
      const es = new EventSource(url);
      esRef.current = es;
      es.onopen = () => setConnected(true);
      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;
        startPolling(); // fallback
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
      es.addEventListener('error', onMsg);
      return () => {
        es.close();
        esRef.current = null;
        stopPolling();
      };
    } catch {
      // 2) se não deu, polling
      startPolling();
      return () => stopPolling();
    }

    function startPolling() {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const j = await apiFetch(`/api/edital/analisar/status/${jobId}`);
          setStatus(j);
        } catch {}
      }, 1200);
    }
    function stopPolling() {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [jobId]);

  return { status, connected };
}
