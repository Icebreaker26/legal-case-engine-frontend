import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

const AuthContext = createContext({
    user: null,
    permissions: [],
    loading: false,
    login: () => {},
    logout: () => {},
    hasPermission: () => false
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      loadPermissions();
    } else {
      setLoading(false);
    }
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/permisos/mis-permisos');
      setPermissions(res.data); // [{modulo, accion}, ...]
    } catch (err) {
      console.error("Error al cargar permisos", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    await loadPermissions();
  };

  const logout = async () => {
    try {
      await apiService.post('/auth/logout');
    } catch (err) {
      console.error("Error al cerrar sesión en el servidor", err);
    }
    localStorage.removeItem('user');
    setUser(null);
    setPermissions([]);
  };

  // Función auxiliar para verificar permisos
  const hasPermission = (modulo, accion) => {
    if (user?.is_admin) return true;
    return permissions.some(p => p.modulo === modulo && p.accion === accion);
  };

  return (
    <AuthContext.Provider value={{ user, permissions, login, logout, loading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
