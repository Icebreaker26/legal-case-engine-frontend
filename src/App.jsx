import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
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
import RendimientoLayout from './modules/rendimiento/components/RendimientoLayout';
import DashboardRendimiento from './modules/rendimiento/pages/DashboardRendimiento';
import ManagerDashboard from './modules/rendimiento/pages/ManagerDashboard';
import GestorEquipos from './modules/rendimiento/pages/GestorEquipos';
import GestionUsuarios from './modules/admin/pages/GestionUsuarios';
import ModuleSelector from './pages/ModuleSelector';
import ComunicacionesLayout from './modules/comunicaciones/components/ComunicacionesLayout';
import ListaComunicaciones from './modules/comunicaciones/pages/ListaComunicaciones';
import DetalleComunicacion from './modules/comunicaciones/pages/DetalleComunicacion';
import NuevaComunicacion from './modules/comunicaciones/pages/NuevaComunicacion';
import DashboardComunicaciones from './modules/comunicaciones/pages/DashboardComunicaciones';
import GestionEntidadesGrupos from './modules/comunicaciones/pages/GestionEntidadesGrupos';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
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

            <Route path="/usuarios" element={
              <ProtectedRoute>
                <AdminRoute>
                  <GestionUsuarios />
                </AdminRoute>
              </ProtectedRoute>
            } />

            <Route path="/selector" element={
              <ProtectedRoute>
                <ModuleSelector />
              </ProtectedRoute>
            } />

            {/* Nuevo módulo de comunicaciones */}
            <Route path="/comunicaciones" element={
              <ProtectedRoute>
                <ComunicacionesLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ListaComunicaciones />} />
              <Route path="dashboard" element={<DashboardComunicaciones />} />
              <Route path="nueva" element={<NuevaComunicacion />} />
              <Route path="gestion" element={<GestionEntidadesGrupos />} />
              <Route path=":id" element={<DetalleComunicacion />} />
            </Route>

            {/* Nuevo módulo de rendimiento */}
            <Route path="/rendimiento" element={
              <ProtectedRoute>
                <RendimientoLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardRendimiento />} />
              <Route path="manager" element={<ManagerDashboard />} />
              <Route path="equipos" element={<GestorEquipos />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
