import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../../services/apiService';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import PermissionModal from '../../../components/PermissionModal';
import PasswordDisplayModal from '../../../components/PasswordDisplayModal';
import Typewriter from '../../rendimiento/components/Typewriter';

const PERMISSION_PRESETS = {
  juridico: [
      { modulo: 'tutelas', accion: 'READ' }, 
      { modulo: 'tutelas', accion: 'WRITE' },
      { modulo: 'notificaciones', accion: 'READ_NOT' },
      { modulo: 'notificaciones', accion: 'WRITE_NOT' },
      { modulo: 'perfil', accion: 'READ' }
  ],
  profesional_rendimiento: [
      { modulo: 'rendimiento', accion: 'READ' },
      { modulo: 'rendimiento', accion: 'WRITE' },
      { modulo: 'notificaciones', accion: 'READ_NOT' },
      { modulo: 'notificaciones', accion: 'WRITE_NOT' },
      { modulo: 'perfil', accion: 'READ' }
  ],
  manager_rendimiento: [
      { modulo: 'rendimiento', accion: 'READ' },
      { modulo: 'rendimiento', accion: 'WRITE' },
      { modulo: 'rendimiento', accion: 'DELETE' },
      { modulo: 'rendimiento', accion: 'MANAGE_TEAMS' },
      { modulo: 'rendimiento', accion: 'READ_ALL' },
      { modulo: 'notificaciones', accion: 'READ_NOT' },
      { modulo: 'notificaciones', accion: 'WRITE_NOT' },
      { modulo: 'perfil', accion: 'READ' }
  ],
  comunicaciones_operativo: [
      { modulo: 'comunicaciones', accion: 'READ_COM' },
      { modulo: 'comunicaciones', accion: 'WRITE_COM' },
      { modulo: 'notificaciones', accion: 'READ_NOT' },
      { modulo: 'notificaciones', accion: 'WRITE_NOT' },
      { modulo: 'perfil', accion: 'READ' }
  ],
  comunicaciones_admin: [
      { modulo: 'comunicaciones', accion: 'READ_COM' },
      { modulo: 'comunicaciones', accion: 'WRITE_COM' },
      { modulo: 'comunicaciones', accion: 'DELETE_COM' },
      { modulo: 'comunicaciones', accion: 'MANAGE_COM' },
      { modulo: 'notificaciones', accion: 'READ_NOT' },
      { modulo: 'notificaciones', accion: 'WRITE_NOT' },
      { modulo: 'perfil', accion: 'READ' }
  ],
  pagos_operativo: [
      { modulo: 'pagos', accion: 'READ_PAGO' },
      { modulo: 'pagos', accion: 'WRITE_PAGO' },
      { modulo: 'notificaciones', accion: 'READ_NOT' },
      { modulo: 'notificaciones', accion: 'WRITE_NOT' },
      { modulo: 'perfil', accion: 'READ' }
  ],
  pagos_admin: [
      { modulo: 'pagos', accion: 'READ_PAGO' },
      { modulo: 'pagos', accion: 'WRITE_PAGO' },
      { modulo: 'pagos', accion: 'DELETE_PAGO' },
      { modulo: 'notificaciones', accion: 'READ_NOT' },
      { modulo: 'notificaciones', accion: 'WRITE_NOT' },
      { modulo: 'perfil', accion: 'READ' }
  ],
  notificaciones_user: [
      { modulo: 'notificaciones', accion: 'READ_NOT' },
      { modulo: 'notificaciones', accion: 'WRITE_NOT' },
      { modulo: 'perfil', accion: 'READ' }
  ],
  conformidades_operativo: [
      { modulo: 'conformidades', accion: 'READ' },
      { modulo: 'conformidades', accion: 'WRITE' }
  ],
  conformidades_admin: [
      { modulo: 'conformidades', accion: 'READ' },
      { modulo: 'conformidades', accion: 'WRITE' },
      { modulo: 'conformidades', accion: 'DELETE' }
  ],
  admin_total: [
      { modulo: 'tutelas', accion: 'READ' }, 
      { modulo: 'tutelas', accion: 'WRITE' }, 
      { modulo: 'tutelas', accion: 'DELETE' }, 
      { modulo: 'admin', accion: 'READ' }, 
      { modulo: 'admin', accion: 'WRITE' },
      { modulo: 'rendimiento', accion: 'READ' },
      { modulo: 'rendimiento', accion: 'WRITE' },
      { modulo: 'rendimiento', accion: 'MANAGE_TEAMS' },
      { modulo: 'rendimiento', accion: 'READ_ALL' },
      { modulo: 'comunicaciones', accion: 'READ_COM' },
      { modulo: 'comunicaciones', accion: 'WRITE_COM' },
      { modulo: 'comunicaciones', accion: 'DELETE_COM' },
      { modulo: 'comunicaciones', accion: 'MANAGE_COM' },
      { modulo: 'pagos', accion: 'READ_PAGO' },
      { modulo: 'pagos', accion: 'WRITE_PAGO' },
      { modulo: 'pagos', accion: 'DELETE_PAGO' },
      { modulo: 'conformidades', accion: 'READ' },
      { modulo: 'conformidades', accion: 'WRITE' },
      { modulo: 'conformidades', accion: 'DELETE' }
  ]
};

export default function GestionUsuarios() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordModal, setPasswordModal] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterApproval, setFilterApproval] = useState('Todos');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUserPermissions = async (userId) => {
    try {
      const { data } = await apiService.get(`/permisos/usuario/${userId}`);
      setUserPermissions(prev => ({ ...prev, [userId]: data }));
    } catch (error) { console.error(`Error al cargar permisos del usuario ${userId}`); }
  };

  const asignarPermiso = async (userId, modulo, accion) => {
    try {
      const response = await apiService.post('/permisos/asignar', { 
          usuario_uuid: userId, modulo, accion 
      }, {
          validateStatus: (status) => status >= 200 && status < 300 || status === 409
      });

      if (response.status === 409) toast.success('El permiso ya estaba asignado');
      else toast.success('Permiso asignado');
      fetchUserPermissions(userId);
    } catch (error) { toast.error('Error al asignar'); }
  };

  const revocarPermiso = async (userId, modulo, accion) => {
    try {
      await apiService.delete('/permisos/revocar', { data: { usuario_uuid: userId, modulo, accion } });
      toast.success('Permiso revocado');
      fetchUserPermissions(userId);
    } catch (error) { toast.error('Error al revocar'); }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await apiService.get('/admin/usuarios');
      setUsers(data);
      data.forEach(u => fetchUserPermissions(u.id));
    } catch (error) { toast.error('Error al cargar usuarios'); }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'Todos' || (filterStatus === 'Activos' ? u.activo : !u.activo);
      const matchesApproval = filterApproval === 'Todos' || (filterApproval === 'Aprobados' ? u.is_approved : !u.is_approved);
      return matchesSearch && matchesStatus && matchesApproval;
    });
  }, [users, searchTerm, filterStatus, filterApproval]);

  const toggleStatus = async (id, currentStatus, isApproved) => {
    try {
      await apiService.patch(`/admin/usuarios/${id}`, { activo: !currentStatus, is_approved: isApproved });
      fetchUsers();
      toast.success('Estado actualizado');
    } catch (error) { toast.error('Error al actualizar'); }
  };

  const toggleApproval = async (id, currentApproval) => {
    try {
      await apiService.patch(`/admin/usuarios/${id}`, { is_approved: !currentApproval });
      fetchUsers();
      toast.success('Estado de aprobación actualizado');
    } catch (error) { toast.error('Error al actualizar aprobación'); }
  };

  const handleResetPassword = async (id, nombre) => {
    const userDefinedPassword = prompt(`Introduce la nueva contraseña para ${nombre} (dejar vacío para generar automáticamente):`);
    
    try {
      const { data } = await apiService.post(`/admin/usuarios/${id}/reset-password`, { 
          newPassword: userDefinedPassword || null 
      });
      
      setPasswordModal({ password: data.newPassword, nombre });
      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      toast.error('Error al resetear contraseña');
    }
  };

  return (
    <div className="bg-[#050A05] border-2 border-[#1A441A] p-6 text-[#33FF33] font-mono min-h-screen">
      <div className="flex justify-between items-center mb-6 border-b border-[#1A441A] pb-2">
        <h2 className="text-xl font-bold uppercase tracking-widest text-[#33FF33]">[ GESTI0N DE USUARI0S ]</h2>
        <Link to="/selector" className="text-[#1A441A] hover:text-[#33FF33] uppercase text-xs italic">{'<'} CAMBIAR MÓDULO</Link>
      </div>
      
      <div className="bg-[#0A140A] p-4 border border-[#1A441A] mb-6 flex flex-wrap gap-4 items-center">
        <Search className="text-[#1A441A]" size={16} />
        <input 
            type="text" placeholder="grep user..."
            className="bg-transparent border-none outline-none text-[#33FF33] placeholder-[#1A441A] w-full md:w-auto flex-1"
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="bg-[#050A05] border border-[#1A441A] text-[#33FF33] p-2 text-sm outline-none" onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="Todos">Status: ALL</option><option value="Activos">Active</option><option value="Inactivos">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px] border border-[#1A441A]">
            <thead className="bg-[#0A140A] text-[#1A441A]">
            <tr className="border-b border-[#1A441A] uppercase text-sm">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Aprobado</th>
                <th className="px-4 py-3">Permisos</th>
                <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-[#1A441A]">
            {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-[#0A140A]">
                <td className="px-4 py-3">
                    <span className="font-medium text-white">{u.nombre}</span><br />
                    <span className="text-xs text-[#1A441A]">{u.email}</span>
                </td>
                <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(u.id, u.activo, u.is_approved)} className={`px-2 py-1 rounded text-xs font-bold ${u.activo ? 'text-[#33FF33]' : 'text-red-500'}`}>
                    {u.activo ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                </td>
                <td className="px-4 py-3">
                    <button onClick={() => toggleApproval(u.id, u.is_approved)} className="flex items-center gap-1">
                    {u.is_approved ? <CheckCircle className="text-[#33FF33]" size={16} /> : <XCircle className="text-yellow-600" size={16} />}
                    <span className="text-xs">{u.is_approved ? 'APPROVED' : 'PENDING'}</span>
                    </button>
                </td>
                <td className="px-4 py-3">
                    <button onClick={() => setSelectedUser(u)} className="bg-[#1A441A] hover:bg-[#33FF33] hover:text-[#050A05] text-[#33FF33] px-3 py-1 text-[10px] font-bold uppercase">Gestionar</button>
                </td>
                <td className="px-4 py-3 text-center">
                    <button onClick={() => handleResetPassword(u.id, u.nombre)} className="text-[#33FF33] hover:underline font-mono text-xs">
                    [RESET_PASS]
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
      
      {passwordModal && (
          <PasswordDisplayModal 
              password={passwordModal.password}
              nombre={passwordModal.nombre}
              onClose={() => setPasswordModal(null)}
          />
      )}
      
      {selectedUser && (
        <PermissionModal 
          user={selectedUser} 
          permissions={userPermissions} 
          onClose={() => setSelectedUser(null)}
          onAsignar={asignarPermiso}
          onRevocar={revocarPermiso}
          presets={PERMISSION_PRESETS}
        />
      )}
    </div>
  );
}
