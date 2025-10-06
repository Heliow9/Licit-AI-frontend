// src/components/PdfModal.jsx
import React, { useEffect } from 'react';

export default function PdfModal({ open, onClose, pdfUrl, title }) {
  useEffect(() => {
    function onEsc(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* dialog */}
      <div className="absolute inset-0 p-4 md:p-8 flex items-center justify-center">
        <div className="relative w-full max-w-5xl h-[85vh] rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 truncate">
                {title || 'Pré-visualização do PDF'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Fechar
            </button>
          </div>

          {/* body */}
          <div className="h-[calc(85vh-52px)]">
            {pdfUrl ? (
              <iframe
                title="PDF"
                src={pdfUrl}
                className="w-full h-full"
                frameBorder="0"
              />
            ) : (
              <div className="h-full w-full grid place-items-center text-slate-500">
                Carregando pré-visualização…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
