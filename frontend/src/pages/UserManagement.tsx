import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  KeyRound, 
  UserX, 
  UserCheck, 
  Loader2, 
  Building2, 
  Stethoscope, 
  X,
  CheckCircle2,
  AlertTriangle,
  Briefcase
} from 'lucide-react';

interface Unit {
  id: string;
  nombre: string;
  sigla: string;
}

interface UserItem {
  id: string;
  username: string;
  email: string;
  nombre: string;
  cargo: string;
  rol: 'ADMIN' | 'ADMISION_ARCHIVO' | 'PERSONAL_HOSPITALARIO' | 'DIRECCION';
  active: boolean;
  createdAt: string;
  unidad: {
    id: string;
    nombre: string;
    sigla: string;
  };
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal Crear Usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    cargo: '',
    unidadId: '',
    username: '',
    email: '',
    password: 'SnowPoint2026!',
    rol: 'PERSONAL_HOSPITALARIO' as 'ADMIN' | 'ADMISION_ARCHIVO' | 'PERSONAL_HOSPITALARIO' | 'DIRECCION',
  });

  // Modal Reset Password
  const [showResetModal, setShowResetModal] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState('SnowPoint2026!');
  const [resetLoading, setResetLoading] = useState(false);

  const fetchUsersAndUnits = async () => {
    setLoading(true);
    try {
      const [usersRes, unitsRes] = await Promise.all([
        api.get('/users?all=true'),
        api.get('/units')
      ]);
      setUsers(usersRes.data);
      setUnits(unitsRes.data);
      if (unitsRes.data.length > 0 && !formData.unidadId) {
        setFormData(prev => ({ ...prev, unidadId: unitsRes.data[0].id }));
      }
    } catch (err: any) {
      setError('Error al cargar la lista de consultores y áreas de SnowPoint Healthcare.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndUnits();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.cargo || !formData.username || !formData.email || !formData.unidadId) {
      alert('Por favor complete todos los campos requeridos.');
      return;
    }

    setModalLoading(true);
    setError('');
    try {
      await api.post('/users', formData);
      setSuccessMessage(`Consultor/Usuario "${formData.nombre}" registrado con éxito en SnowPoint Healthcare.`);
      setShowCreateModal(false);
      setFormData({
        nombre: '',
        cargo: '',
        unidadId: units.length > 0 ? units[0].id : '',
        username: '',
        email: '',
        password: 'SnowPoint2026!',
        rol: 'PERSONAL_HOSPITALARIO',
      });
      await fetchUsersAndUnits();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar el usuario.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    if (user.username === 'admin') {
      alert('No es posible desactivar la cuenta principal de Administrador.');
      return;
    }

    const actionText = user.active ? 'desactivar' : 'activar';
    if (!confirm(`¿Está seguro de ${actionText} el acceso para "${user.nombre}"?`)) {
      return;
    }

    try {
      await api.patch(`/users/${user.id}/toggle`);
      setSuccessMessage(`Estado de ${user.nombre} actualizado correctamente.`);
      await fetchUsersAndUnits();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cambiar estado.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetModal) return;

    setResetLoading(true);
    try {
      await api.post(`/users/${showResetModal.id}/reset-password`, { newPassword });
      setSuccessMessage(`Contraseña restablecida con éxito para ${showResetModal.nombre}.`);
      setShowResetModal(null);
      setNewPassword('SnowPoint2026!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al restablecer la contraseña.');
    } finally {
      setResetLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nombre.toLowerCase().includes(filter.toLowerCase()) ||
    u.username.toLowerCase().includes(filter.toLowerCase()) ||
    u.cargo.toLowerCase().includes(filter.toLowerCase()) ||
    u.unidad.nombre.toLowerCase().includes(filter.toLowerCase()) ||
    u.unidad.sigla.toLowerCase().includes(filter.toLowerCase())
  );

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return <span className="px-2.5 py-1 text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 rounded-full">ADMINISTRADOR GENERAL</span>;
      case 'DIRECTOR_EJECUTIVO':
      case 'DIRECCION':
        return <span className="px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-full">DIRECTOR GENERAL EJECUTIVO (CEO)</span>;
      case 'JEFE_UNIDAD':
        return <span className="px-2.5 py-1 text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300 rounded-full">JEFE DE UNIDAD OPERATIVA</span>;
      case 'CONSULTOR_SENIOR':
        return <span className="px-2.5 py-1 text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300 rounded-full">CONSULTOR SÉNIOR / AUDITOR</span>;
      case 'CONSULTOR_ASOCIADO':
      case 'PERSONAL_HOSPITALARIO':
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">CONSULTOR ASOCIADO / ANALISTA</span>;
      case 'RECEPCION_DOCUMENTAL':
      case 'ADMISION_ARCHIVO':
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded-full">GESTIÓN DOCUMENTAL & ARCHIVO</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#0f3d62]" />
            Gestión de Personal & Consultores en Salud
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            SnowPoint Healthcare - Cree consultores médicos, auditores en salud, asesores legales y personal para el flujo documental de proyectos.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0f3d62] hover:bg-[#0a2e52] text-white rounded-xl text-sm font-bold shadow-md transition-all self-start md:self-auto"
        >
          <UserPlus className="w-4.5 h-4.5 text-teal-300" />
          Crear Nuevo Consultor / Usuario
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-teal-700 hover:text-teal-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Cuentas</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-0.5">{users.length}</h3>
          </div>
          <div className="p-2.5 bg-sky-50 text-[#0f3d62] rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Consultores en Salud</p>
            <h3 className="text-2xl font-extrabold text-teal-700 mt-0.5">
              {users.filter(u => u.rol === 'PERSONAL_HOSPITALARIO').length}
            </h3>
          </div>
          <div className="p-2.5 bg-teal-50 text-teal-700 rounded-lg">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Dirección / Recepción</p>
            <h3 className="text-2xl font-extrabold text-blue-700 mt-0.5">
              {users.filter(u => u.rol === 'ADMISION_ARCHIVO' || u.rol === 'DIRECCION').length}
            </h3>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Administradores</p>
            <h3 className="text-2xl font-extrabold text-purple-700 mt-0.5">
              {users.filter(u => u.rol === 'ADMIN').length}
            </h3>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por consultor, usuario, cargo o departamento..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0f3d62]"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium self-end sm:self-center">
          Mostrando {filteredUsers.length} de {users.length} cuentas registradas en SnowPoint
        </span>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 text-[#0f3d62] animate-spin" />
          <span className="text-slate-500 font-medium text-sm">Cargando personal de SnowPoint Healthcare...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6">Consultor / Usuario</th>
                  <th className="py-4 px-6">Cargo y Especialidad</th>
                  <th className="py-4 px-6">Área / Departamento</th>
                  <th className="py-4 px-6">Rol en Sistema</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50/70 transition-colors ${!u.active ? 'bg-slate-50/40 opacity-70' : ''}`}>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-[#0f3d62]">
                          {u.nombre.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{u.nombre}</p>
                          <span className="text-xs font-mono text-slate-400">@{u.username}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-medium text-slate-800">{u.cargo}</p>
                      <span className="text-xs text-slate-400">{u.email}</span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#0f3d62]" />
                        {u.unidad.nombre}
                      </span>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 mt-1 inline-block">
                        {u.unidad.sigla}
                      </span>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      {getRoleBadge(u.rol)}
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-red-50 text-red-700 border border-red-200 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Inactivo
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setShowResetModal(u)}
                          title="Restablecer Contraseña"
                          className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          Clave
                        </button>

                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleToggleActive(u)}
                            title={u.active ? 'Desactivar Usuario' : 'Activar Usuario'}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                              u.active 
                                ? 'border-red-200 text-red-700 hover:bg-red-50' 
                                : 'border-teal-200 text-teal-700 hover:bg-teal-50'
                            }`}
                          >
                            {u.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            {u.active ? 'Suspender' : 'Activar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL CREAR NUEVO USUARIO --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-scale-up">
            <div className="bg-[#0f3d62] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-300" />
                Registrar Nuevo Consultor / Staff SnowPoint
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-white hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Dr. Roberto Morales o Lic. Claudia Beltrán"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f3d62] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cargo / Especialidad en Salud *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Auditor Médico Principal / Consultor de Calidad"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f3d62] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Área / Departamento *</label>
                  <select
                    value={formData.unidadId}
                    onChange={(e) => setFormData({ ...formData, unidadId: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f3d62] focus:outline-none"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.sigla})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre de Usuario (Login) *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. rmorales o cbeltran"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f3d62] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="ej. consultor@snowpoint.com.bo"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f3d62] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contraseña Inicial *</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-1 focus:ring-[#0f3d62] focus:outline-none bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Rol en el Sistema *</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as any })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f3d62] focus:outline-none"
                  >
                    <option value="DIRECTOR_EJECUTIVO">Director General Ejecutivo (CEO) - DIR-EXE-001</option>
                    <option value="JEFE_UNIDAD">Jefe de Unidad Operativa (DIG, CAL, EPI, ACA)</option>
                    <option value="CONSULTOR_SENIOR">Consultor Sénior / Auditor Médico</option>
                    <option value="CONSULTOR_ASOCIADO">Consultor Asociado / Analista / Bioestadístico</option>
                    <option value="RECEPCION_DOCUMENTAL">Gestión Documental & Archivo Central</option>
                    <option value="ADMIN">Administrador General de Sistemas</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg text-xs text-teal-900 leading-relaxed">
                Al guardar, este consultor podrá iniciar sesión inmediatamente en SnowPoint Healthcare para enviar, recibir, derivar y emitir dictámenes documentales.
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-[#0f3d62] hover:bg-[#0a2e52] text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar y Activar Consultor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL RESET PASSWORD --- */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-scale-up">
            <div className="bg-amber-700 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Restablecer Contraseña
              </h3>
              <button onClick={() => setShowResetModal(null)} className="text-white hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Está restableciendo la clave de acceso para: <strong>{showResetModal.nombre}</strong> (@{showResetModal.username}).
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nueva Contraseña</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-1 focus:ring-[#0f3d62] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow"
                >
                  {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
