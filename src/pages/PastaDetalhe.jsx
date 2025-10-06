// src/pages/PastaDetalhe.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import PdfModal from '../components/PdfModal';
import { useAuth } from '../auth/AuthContext';

const FileIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
  </svg>
);

export default function PastaDetalhe() {
  const { folderId } = useParams();
  const { user } = useAuth();

  const isAdmin = (user?.role === 'admin' || user?.role === 'owner');

  // listagem
  const [files, setFiles]   = useState([]);
  const [loading, setL]     = useState(true);
  const [error, setErr]     = useState(null);

  // feedback
  const [msg, setMsg]       = useState('');

  // modal pdf
  const [modalOpen, setModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl]       = useState(null); // objectURL (blob)
  const [pdfName, setPdfName]     = useState('');

  // token/header
  const token = useMemo(() => localStorage.getItem('token'), []);
  const authHeader = useMemo(
    () => ({ Authorization: token ? `Bearer ${token}` : '' }),
    [token]
  );

  // carrega arquivos da pasta
  async function fetchFiles() {
    if (!folderId) return;
    try {
      setErr(null); setMsg(''); setL(true);
      const { data } = await api.get(`/api/pastas/${folderId}`, {
        headers: authHeader
      });
      setFiles(data?.files || []);
    } catch (e) {
      setErr(e?.response?.data?.error || 'Não foi possível carregar os arquivos.');
      setFiles([]);
    } finally { setL(false); }
  }

  useEffect(() => { fetchFiles(); /* eslint-disable-next-line */ }, [folderId]);

  // abre modal baixando o PDF como blob (com Authorization)
  async function handleOpenModal(fileName) {
    try {
      setErr(''); setMsg('');
      const url = `/api/pastas/${folderId}/${encodeURIComponent(fileName)}`;
      const { data } = await api.get(url, {
        headers: authHeader,
        responseType: 'blob'
      });
      const blob = new Blob([data], { type: data.type || 'application/pdf' });
      const objUrl = URL.createObjectURL(blob);
      setPdfUrl(objUrl);
      setPdfName(fileName);
      setModalOpen(true);
    } catch (e) {
      setErr('Falha ao abrir o arquivo.');
    }
  }
  function handleCloseModal() {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setPdfName('');
    setModalOpen(false);
  }

  // download programático (com Authorization)
  async function handleDownload(fileName) {
    try {
      setErr(''); setMsg('');
      const url = `/api/pastas/${folderId}/${encodeURIComponent(fileName)}`;
      const { data, headers } = await api.get(url, {
        headers: authHeader,
        responseType: 'blob'
      });
      const blob = new Blob([data], { type: headers['content-type'] || 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
      }, 0);
    } catch {
      setErr('Falha ao baixar o arquivo.');
    }
  }

  // EXCLUIR (apenas admin/owner)
  async function handleDelete(fileName) {
    if (!isAdmin) return;
    const ok = window.confirm(`Excluir definitivamente a CAT "${fileName}"?\nIsso removerá o arquivo e os registros de busca.`);
    if (!ok) return;
    try {
      setErr(''); setMsg('');
      await api.delete(`/api/pastas/${folderId}/${encodeURIComponent(fileName)}`, {
        headers: authHeader,
      });
      // remove da lista local
      setFiles((prev) => prev.filter((f) => f.name !== fileName));
      setMsg('CAT excluída com sucesso.');
    } catch (e) {
      const m = e?.response?.data?.error || 'Falha ao excluir CAT.';
      setErr(m);
    }
  }

  return (
    <>
      <div className="bg-slate-50 min-h-screen font-sans py-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* breadcrumb */}
          <div className="mb-6 text-sm font-medium text-slate-500">
            <Link to="/" className="hover:text-blue-600">Dashboard</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-800 break-all">{decodeURIComponent(folderId || '')}</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">
            Arquivos em: {decodeURIComponent(folderId || '')}
          </h1>

          {msg && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {msg}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            {loading && <p className="p-12 text-center text-slate-500">Carregando arquivos...</p>}

            {!loading && !error && (
              <ul className="divide-y divide-slate-200">
                {files.length > 0 ? files.map((file, i) => (
                  <li key={i} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    <div className="flex items-center gap-4 min-w-0">
                      <FileIcon className="h-6 w-6 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(file.name)}
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Visualizar
                      </button>
                      <button
                        onClick={() => handleDownload(file.name)}
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Baixar
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(file.name)}
                          className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                          title="Excluir CAT (admin/owner)"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </li>
                )) : (
                  <li className="p-12 text-center text-slate-500">Nenhum arquivo encontrado nesta pasta.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modal de PDF */}
      <PdfModal open={modalOpen} onClose={handleCloseModal} title={pdfName} pdfUrl={pdfUrl} />
    </>
  );
}
