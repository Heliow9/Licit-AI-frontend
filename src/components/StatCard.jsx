export default function StatCard({ title, value, trend = null, icon = null }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        {icon}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      {trend && (
        <div className="mt-1 text-xs text-gray-500">
          <span className={trend.positive ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
            {trend.value}
          </span>{" "}
          {trend.label}
        </div>
      )}
    </div>
  )
}
