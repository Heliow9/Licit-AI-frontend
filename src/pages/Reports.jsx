import ReportsList from "../components/ReportsList";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
      <ReportsList pageSize={10} />
    </div>
  );
}
