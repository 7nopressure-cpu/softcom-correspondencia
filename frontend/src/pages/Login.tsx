import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lock, User, KeyRound, Server, Stethoscope, ShieldCheck, Briefcase } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authType, setAuthType] = useState<'local' | 'ldap'>('local');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = authType === 'local' ? '/auth/login' : '/auth/ldap';
      const response = await api.post(endpoint, { username, password });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor de SnowPoint Healthcare.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminQuickLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { 
        username: 'admin',
        password: 'SnowPoint2026!'
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al autenticar con la cuenta de Administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 sm:p-6 relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: "url('/image_e13e0a4c.jpg')" }}></div>
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 via-teal-400 to-blue-600"></div>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 grid grid-cols-1 md:grid-cols-12 z-10">
        
        {/* Left Col: Hero Branding with image_e13e0a4c.jpg */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#0a2e52] to-[#0f3d62] text-white p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: "url('/image_e13e0a4c.jpg')" }}></div>

          <div className="relative z-10 space-y-4">
            <div className="bg-white p-3 rounded-2xl inline-block shadow-lg border border-slate-100">
              <img 
                src="/MKT-3.jpg" 
                alt="SnowPoint Healthcare Logo" 
                className="h-12 w-auto object-contain"
                onError={(e: any) => { e.currentTarget.src = '/snowpoint-logo.jpg'; }}
              />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-teal-300">Consultora en Salud</span>
              <h2 className="text-2xl font-extrabold text-white mt-1 leading-tight">
                SNOWPOINT HEALTHCARE
              </h2>
              <p className="text-xs text-sky-200 mt-2 leading-relaxed">
                Plataforma corporativa de correspondencia, gestión de proyectos y auditoría médica para instituciones de salud.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-6 space-y-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0" />
              <span>Auditoría Médica y Firma Digital (.bo)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Briefcase className="w-4 h-4 text-sky-300 shrink-0" />
              <span>Gestión de Proyectos y Calidad Hospitalaria</span>
            </div>
          </div>
        </div>

        {/* Right Col: Login Form */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Iniciar Sesión</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ingrese sus credenciales de consultor o administrador</p>
              </div>

              {/* Tab Selector */}
              <div className="flex border border-slate-200 p-1 bg-slate-50 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setAuthType('local')}
                  className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                    authType === 'local' ? 'bg-[#0f3d62] text-white shadow' : 'text-slate-500'
                  }`}
                >
                  Local
                </button>
                <button
                  type="button"
                  onClick={() => setAuthType('ldap')}
                  className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                    authType === 'ldap' ? 'bg-[#0f3d62] text-white shadow' : 'text-slate-500'
                  }`}
                >
                  LDAP
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Usuario / Consultor</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="ej. admin o su usuario asignado"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f3d62] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contraseña</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f3d62] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#0f3d62] hover:bg-[#0a2e52] text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {authType === 'ldap' ? <Server className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
                {loading ? 'Iniciando sesión...' : 'Ingresar a SnowPoint SoftCom'}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-bold">Acceso Directo</span>
              </div>
            </div>

            <button
              onClick={handleAdminQuickLogin}
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow"
            >
              <Stethoscope className="w-4 h-4 text-teal-200" />
              Acceso Rápido Administrador (admin)
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-400 mt-6 leading-relaxed">
            SnowPoint Healthcare - Consultora en Salud.<br/>
            Sistemas & Tecnologías de la Información en Salud.
          </p>
        </div>

      </div>
    </div>
  );
};
