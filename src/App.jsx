import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AnalyzeEdital from "./pages/AnalyzeEdital";
import Reports from "./pages/Reports";
import ProtectedRoute from "./components/ProtectedRoute";
import Cats from './pages/CatsManager'
import PastaDetalhe from '../src/pages/PastaDetalhe'
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
         <Route
        path="/pastas/:folderId"
        element={
          <ProtectedRoute>
            <PastaDetalhe />
          </ProtectedRoute>
        }
      />
       <Route
        path="/cats"
        element={
          <ProtectedRoute>
            <Cats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analisar"
        element={
          <ProtectedRoute>
            <AnalyzeEdital />
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
