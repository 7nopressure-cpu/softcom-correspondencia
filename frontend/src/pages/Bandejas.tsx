import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Inbox, 
  Clock, 
  Send, 
  Archive, 
  AlertCircle, 
  CheckSquare, 
  FileText, 
  ExternalLink,
  Loader2,
  Calendar,
  Briefcase
} from 'lucide-react';

interface CorrespondenceRow {
  derivacionId: string;
  hojaRutaId: string;
  numero: string;
  tipo: 'INTERNA' | 'EXTERNA';
  referencia: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  estadoActual: string;
  fechaRecepcionHojaRuta: string;
  remitenteOriginal: string;
  remitenteDerivacion: string | null;
  destinatarioDerivacion: string | null;
  proveido: string;
  fechaDerivacion: string;
  fechaAceptacionDerivacion: string | null;
  estadoDerivacion: string;
}

export const Bandejas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recibidos' | 'pendientes' | 'derivados' | 'archivados'>('recibidos');
  const [items, setItems] = useState<CorrespondenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const tabs = [
    { id: 'recibidos', name: 'Recibidos (Por Aceptar)', icon: Inbox },
    { id: 'pendientes', name: 'En Proceso / Trámite', icon: Clock },
    { id: 'derivados', name: 'Derivados (Enviados)', icon: Send },
    { id: 'archivados', name: 'Archivados / Concluidos', icon: Archive },
  ] as const;

  const fetchBandeja = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/correspondence/bandeja/${activeTab}`);
      setItems(response.data);
    } catch (err: any) {
      setError('Error al conectar con el servidor para obtener la correspondencia hospitalaria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBandeja();
  }, [activeTab]);

  const handleAccept = async (hojaRutaId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActionLoading(hojaRutaId);
    try {
      await api.post(`/correspondence/${hojaRutaId}/accept`);
      await fetchBandeja();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al recepcionar el documento.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredItems = items.filter(item => 
    item.numero.toLowerCase().includes(filter.toLowerCase()) ||
    item.referencia.toLowerCase().includes(filter.toLowerCase()) ||
    item.remitenteOriginal.toLowerCase().includes(filter.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ALTA': return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIA': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'BAJA': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#0f3d62]" />
            Buzones de Correspondencia y Expedientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            SnowPoint Healthcare - Gestión y flujo de proyectos de consultoría, auditorías médicas y requerimientos de clientes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1 bg-white p-2 rounded-t-xl shadow-sm border border-slate-200 border-b-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-lg text-sm font-semibold transition-all ${
                isActive 
                  ? 'bg-[#0f4c81] text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 border border-slate-200 shadow-sm rounded-b-xl border-t-0">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por código, asunto, médico/remitente..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium sm:ml-auto">
          Mostrando {filteredItems.length} de {items.length} expedientes
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 text-[#0f4c81] animate-spin" />
          <span className="text-slate-500 text-sm font-medium">Buscando documentos en el archivo hospitalario...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center font-medium">
          {error}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-700 text-lg">Bandeja al día</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm">
            No tienes documentos o requerimientos pendientes en esta bandeja.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6">Hoja de Ruta</th>
                  <th className="py-4 px-6">Remitente / Origen</th>
                  <th className="py-4 px-6">Asunto / Referencia</th>
                  <th className="py-4 px-6">Prioridad</th>
                  <th className="py-4 px-6">
                    {activeTab === 'derivados' ? 'Destinatario' : 'Derivado Por'}
                  </th>
                  <th className="py-4 px-6">Fecha Registro</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredItems.map((item) => (
                  <tr key={item.derivacionId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#0f4c81] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        {item.numero}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5 block">
                        {item.tipo === 'INTERNA' ? 'INTERNO / SERVICIO' : 'EXTERNO'}
                      </span>
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-medium text-slate-800 line-clamp-2 leading-relaxed">
                        {item.remitenteOriginal}
                      </div>
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      <div className="text-slate-700 font-medium line-clamp-2 leading-relaxed">
                        {item.referencia}
                      </div>
                      {item.proveido && (
                        <div className="text-xs text-slate-500 bg-sky-50/50 border border-sky-100 rounded px-2 py-1 mt-1 line-clamp-1 italic">
                          Nota: "{item.proveido}"
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 text-xs font-bold border rounded-full ${getPriorityColor(item.prioridad)}`}>
                        {item.prioridad === 'ALTA' ? 'URGENCIA' : item.prioridad}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                        {item.estadoActual.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-600">
                      {activeTab === 'derivados' ? (
                        <div>
                          <p className="font-medium text-slate-800 text-xs">{item.destinatarioDerivacion}</p>
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            Estado: {item.estadoDerivacion}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-slate-800 text-xs">{item.remitenteDerivacion || 'Ingreso Admisión'}</p>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap text-slate-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.fechaDerivacion).toLocaleDateString('es-BO')}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(item.fechaDerivacion).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {activeTab === 'recibidos' && (
                          <button
                            onClick={(e) => handleAccept(item.hojaRutaId, e)}
                            disabled={actionLoading !== null}
                            className="flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            {actionLoading === item.hojaRutaId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckSquare className="w-3.5 h-3.5" />
                            )}
                            Recepcionar
                          </button>
                        )}
                        <Link
                          to={`/correspondencia/${item.hojaRutaId}`}
                          className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Expediente
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
