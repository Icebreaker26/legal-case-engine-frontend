import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Procesar from './pages/Procesar';
import Entrenar from './pages/Entrenar';
import AdminDashboard from './pages/AdminDashboard';
import Informes from './pages/Informes';
import Notificaciones from './pages/Notificaciones';
import Login from './pages/Login';
import Register from './pages/Register';
import Papelera from './pages/Papelera';
import Memoria from './pages/Memoria';
import Calendario from './pages/Calendario';
import DetalleTutela from './pages/DetalleTutela';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          } />
          <Route path="/register" element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="procesar" element={<Procesar />} />
            <Route path="entrenar" element={<Entrenar />} />
            <Route path="memoria" element={<Memoria />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="papelera" element={<Papelera />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="informes" element={<Informes />} />
            <Route path="notificaciones" element={<Notificaciones />} />
            <Route path="tutela/:id" element={<DetalleTutela />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
