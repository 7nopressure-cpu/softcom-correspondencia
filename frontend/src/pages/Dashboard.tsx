import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Archive, 
  Layers, 
  ArrowUpRight, 
  Inbox, 
  Loader2,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface StatsSummary {
  total: number;
  internas: number;
  externas: number;
  pendientes: number;
  enProceso: number;
  archivadas: number;
  atendidas: number;
  activasUnidad: number;
}

interface MonthlyFlow {
  mes: string;
  registradas: number;
  derivadas: number;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/reports/stats');
        setStats(response.data.summary);
        setMonthlyData(response.data.flujoMensual);
      } catch (err: any) {
        setError('Error al obtener estadísticas del servidor de SnowPoint Healthcare.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 text-[#0f3d62] animate-spin" />
        <span className="text-slate-500 font-medium">Cargando indicadores de consultoría en salud...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error || 'No se pudieron cargar las estadísticas corporativas.'}
      </div>
    );
  }

  const statCards = [
    { title: 'Total Trámites y Proyectos', value: stats.total, sub: `${stats.internas} Internos / ${stats.externas} Clientes Externos`, color: 'border-[#0f3d62] text-[#0f3d62] bg-sky-50/50', icon: FileText },
    { title: 'Por Aceptar / Recepcionar', value: stats.pendientes, sub: 'Buzón de entrada de consultoría', color: 'border-amber-500 text-amber-600 bg-amber-50/40', icon: Inbox },
    { title: 'En Evaluación / Auditoría', value: stats.enProceso, sub: 'En proceso de dictamen y consultoría', color: 'border-sky-600 text-sky-700 bg-sky-50/40', icon: Clock },
    { title: 'Archivados / Custodia', value: stats.archivadas, sub: 'Custodia documental y legal', color: 'border-slate-500 text-slate-600 bg-slate-50', icon: Archive },
    { title: 'Concluidos / Entregados', value: stats.atendidas, sub: 'Dictámenes e informes finalizados', color: 'border-teal-600 text-teal-700 bg-teal-50/40', icon: CheckCircle },
    { title: 'Activos en mi Área', value: stats.activasUnidad, sub: 'Asignados a mi departamento', color: 'border-indigo-600 text-indigo-700 bg-indigo-50/40', icon: Layers },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-[#0f3d62]" />
          Panel de Control Corporativo - SnowPoint Healthcare
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Consultora en Salud - Seguimiento y trazabilidad de proyectos de consultoría, auditorías médicas y correspondencia.
        </p>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`p-6 bg-white border-l-4 rounded-xl shadow-sm flex items-center justify-between border-slate-200 ${card.color}`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.title}</p>
                <h3 className="text-3xl font-extrabold mt-1 text-slate-900">{card.value}</h3>
                <p className="text-xs mt-1 text-slate-600 font-medium">{card.sub}</p>
              </div>
              <div className="p-3 bg-white rounded-full shadow-sm text-slate-600 border border-slate-100">
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main flow chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">Flujo Documental de Consultoría y Dictámenes</h3>
            <span className="text-xs text-slate-400 font-medium">Requerimientos vs Asignaciones a Consultores</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                <XAxis dataKey="mes" tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#718096' }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar name="Requerimientos Ingresados" dataKey="registradas" fill="#0f3d62" radius={[4, 4, 0, 0]} />
                <Bar name="Derivados a Consultores" dataKey="derivadas" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Notice */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Operaciones Rápidas</h3>
            <p className="text-xs text-slate-400">Gestión de proyectos y trámites de salud</p>
          </div>
          
          <div className="space-y-3 flex-1 flex flex-col justify-center">
            <Link
              to="/registrar"
              className="flex items-center justify-between p-4 bg-[#0f3d62] hover:bg-[#0a2e52] text-white rounded-xl transition-all shadow-sm group"
            >
              <div>
                <span className="font-bold text-sm block">Nuevo Expediente / CITE</span>
                <span className="text-[10px] text-sky-200">Requerimiento de cliente o consultoría interna</span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-teal-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>

            <Link
              to="/bandejas"
              className="flex items-center justify-between p-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl transition-all group"
            >
              <div>
                <span className="font-bold text-sm block">Revisar Buzones</span>
                <span className="text-[10px] text-slate-500">Expedientes asignados a su área</span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-[#0f3d62] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>

          <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-100 text-xs text-teal-900 flex flex-col gap-1.5">
            <span className="font-bold text-[11px] uppercase tracking-wider text-teal-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Confidencialidad en Salud
            </span>
            <p className="leading-relaxed text-teal-800/90 text-[11px]">
              Toda la información y documentación técnica se encuentra resguardada bajo estrictos acuerdos de confidencialidad y ética en consultoría sanitaria de SnowPoint Healthcare.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
