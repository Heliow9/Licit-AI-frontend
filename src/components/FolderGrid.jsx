export default function FolderGrid({ pastas, onOpen }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {pastas.map((p) => (
        <button
          key={p.id}
          onClick={() => onOpen?.(p)}
          className="group text-left rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition"
        >
          <div className="flex items-center gap-3">
            <FolderIcon />
            <div>
              <div className="font-medium group-hover:text-blue-600">{p.nome}</div>
              <div className="text-xs text-gray-500">{p.count} CATs</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

function FolderIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" className="text-amber-500">
      <path fill="currentColor" d="M10 4l2 2h6a2 2 0 012 2v1H4V6a2 2 0 012-2h4z"/>
      <path fill="currentColor" d="M4 10h18v6a2 2 0 01-2 2H6a2 2 0 01-2-2V10z" opacity=".6"/>
    </svg>
  )
}
