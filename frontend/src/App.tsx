import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { EditorPage } from './pages/EditorPage';
import { LoginPage } from './pages/LoginPage';
import { NotesPage } from './pages/NotesPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/notes/:id" element={<EditorPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/notes" replace />} />
    </Routes>
  );
}
