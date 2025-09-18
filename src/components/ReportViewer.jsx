import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ReportViewer({ report }) {
  if (!report) return null;

  return (
    <div className="prose max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {report}
      </ReactMarkdown>
    </div>
  );
}
    