import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import RegistrationPending from './pages/RegistrationPending';
import ChangePassword from './pages/ChangePassword';
import PerfilLayout from './modules/perfil/components/PerfilLayout';
import MiPerfil from './modules/perfil/pages/MiPerfil';
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
import PagosLayout from './modules/pagos/components/PagosLayout';
import ListaPagos from './modules/pagos/pages/ListaPagos';
import NuevaSolicitudPago from './modules/pagos/pages/NuevaSolicitudPago';
import DashboardPagos from './modules/pagos/pages/DashboardPagos';
import DetallePago from './modules/pagos/pages/DetallePago';
import GestionEstadosYGrupos from './modules/pagos/pages/GestionEstadosYGrupos';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeProvider>
          <Toaster position="top-right" />
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
            <Route path="/registration-pending" element={
              <PublicOnlyRoute>
                <RegistrationPending />
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

            <Route path="/change-password" element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            } />

            <Route path="/perfil" element={
              <ProtectedRoute>
                <PerfilLayout />
              </ProtectedRoute>
            }>
              <Route index element={<MiPerfil />} />
            </Route>

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

            {/* Nuevo módulo de pagos */}
            <Route path="/pagos" element={
              <ProtectedRoute>
                <PagosLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ListaPagos />} />
              <Route path="nueva" element={<NuevaSolicitudPago />} />
              <Route path="dashboard" element={<DashboardPagos />} />
              <Route path="gestion" element={<GestionEstadosYGrupos />} />
              <Route path=":id" element={<DetallePago />} />
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

            {/* Nuevo módulo de conformidades */}
            <Route path="/conformidades" element={
              <ProtectedRoute>
                <ConformidadesLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ListaConformidades />} />
              <Route path="nueva" element={<NuevaSolicitudConformidad />} />
              <Route path="dashboard" element={<DashboardConformidades />} />
              <Route path="gestion" element={<GestionEstadosYGruposConformidades />} />
              <Route path=":id" element={<DetalleConformidad />} />
            </Route>
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

// ... imports ...

import ConformidadesLayout from './modules/conformidades/components/ConformidadesLayout';
import ListaConformidades from './modules/conformidades/pages/ListaConformidades';
import DashboardConformidades from './modules/conformidades/pages/DashboardConformidades';
import DetalleConformidad from './modules/conformidades/pages/DetalleConformidad';
import NuevaSolicitudConformidad from './modules/conformidades/pages/NuevaSolicitudConformidad';
import GestionEstadosYGruposConformidades from './modules/conformidades/pages/GestionEstadosYGruposConformidades';

export default App;
