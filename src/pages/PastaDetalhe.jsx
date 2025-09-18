// src/pages/PastaDetalhe.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api'; 
import PdfModal from '../components/PdfModal'; // <<-- 1. Importe o novo componente

const FileIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>);

export default function PastaDetalhe() {
  const { folderId } = useParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // <<-- 2. Estado para controlar o modal -->>
  const [modalPdfUrl, setModalPdfUrl] = useState(null);

  useEffect(() => {
    // ... seu useEffect para buscar os arquivos continua igual ...
    const fetchFiles = async () => {
      if (!folderId) return;
      try {
        setError(null);
        setLoading(true);
        const response = await api.get(`/api/pastas/${folderId}`);
        setFiles(response.data.files || []);
      } catch (err) {
        console.error("Erro ao buscar arquivos da pasta:", err);
        setError(err.response?.data?.error || "Não foi possível carregar os arquivos.");
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [folderId]);

  // <<-- 3. Funções para abrir e fechar o modal -->>
  const handleOpenModal = (fileName) => {
    const url = `/api/pastas/${folderId}/${encodeURIComponent(fileName)}`;
    setModalPdfUrl(url);
  };

  const handleCloseModal = () => {
    setModalPdfUrl(null);
  };

  return (
    <> {/* Fragmento para permitir o modal fora do layout principal */}
      <div className="bg-slate-50 min-h-screen font-sans py-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Navegação e Título (sem alterações) */}
          <div className="mb-6 text-sm font-medium text-slate-500">
            <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-800">{folderId}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">
            Arquivos em: {folderId}
          </h1>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            {/* Estados de loading e erro (sem alterações) */}
            {loading && <p className="p-12 text-center text-slate-500">Carregando arquivos...</p>}
            {error && <div className="p-12 text-center text-red-600"><p className="font-semibold">Ocorreu um Erro</p><p className="text-sm mt-1">{error}</p></div>}

            {!loading && !error && (
              <ul className="divide-y divide-slate-200">
                {files.length > 0 ? (
                  files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between p-4 hover:bg-slate-50">
                      <div className="flex items-center gap-4 min-w-0">
                        <FileIcon className="h-6 w-6 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{file.name}</span>
                      </div>
                      
                      {/* <<-- 4. Troque <a> por <button> e chame a função do modal -->> */}
                      <button
                        onClick={() => handleOpenModal(file.name)}
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Abrir
                      </button>

                    </li>
                  ))
                ) : (
                  <li className="p-12 text-center text-slate-500">Nenhum arquivo encontrado nesta pasta.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {/* <<-- 5. Renderize o componente do modal aqui -->> */}
      <PdfModal pdfUrl={modalPdfUrl} onClose={handleCloseModal} />
    </>
  );
}