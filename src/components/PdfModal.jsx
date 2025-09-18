// src/components/PdfModal.jsx

import React, { useEffect } from 'react';

// Ícone para o botão de fechar
const CloseIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default function PdfModal({ pdfUrl, onClose }) {
  // Efeito para fechar o modal com a tecla "Escape"
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    // Limpa o event listener quando o componente é desmontado
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Se não houver URL, não renderiza nada
  if (!pdfUrl) {
    return null;
  }

  return (
    // Overlay: fundo semi-transparente que cobre a tela toda
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Fecha o modal ao clicar no fundo
    >
      {/* Container do Modal: impede que o clique feche o modal */}
      <div 
        className="bg-white rounded-xl shadow-2xl w-full h-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Impede o fechamento ao clicar dentro do modal
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 truncate">Visualizador de Documento</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            aria-label="Fechar modal"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Corpo do Modal com o Iframe para o PDF */}
        <div className="flex-grow p-2 bg-slate-200">
          <iframe
            src={pdfUrl}
            title="Visualizador de PDF"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}