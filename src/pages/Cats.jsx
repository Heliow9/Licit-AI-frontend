import { Link } from "react-router-dom"

export default function Cats() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">CATs</h1>

      <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
        <p className="text-sm text-gray-600">
          Aqui você pode (futuramente) visualizar/sincronizar as CATs do diretório
          <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5">data/cats_poc</code>,
          ou fazer upload manual.
        </p>

        <div className="flex gap-2">
          <a
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            href="http://localhost:3001/api/cats/sync-from-disk"
            target="_blank" rel="noreferrer"
          >
            Sincronizar do Disco
          </a>
          <Link to="/" className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
    