import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  FileText, 
  Send, 
  Archive, 
  CheckCircle, 
  Printer, 
  Download, 
  ShieldCheck, 
  Loader2, 
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  History,
  Info,
  Calendar,
  X,
  Briefcase,
  Award
} from 'lucide-react';

interface Derivacion {
  id: string;
  remitente: { nombre: string; cargo: string; unidad: { sigla: string } };
  destinatario: { nombre: string; cargo: string; unidad: { sigla: string } };
  proveido: string;
  fechaDerivacion: string;
  fechaRecepcion: string | null;
  estado: string;
}

interface Adjunto {
  id: string;
  nombreArchivo: string;
  pathArchivo: string;
  tipoMime: string;
  firmado: boolean;
  firmaMetadata: string | null;
  createdAt: string;
  subidoPor: { nombre: string; cargo: string };
}

interface Auditoria {
  id: string;
  usuario: { nombre: string; cargo: string; unidad: { sigla: string } };
  accion: string;
  detalles: string | null;
  createdAt: string;
}

interface CorrespondenceDetail {
  id: string;
  numero: string;
  tipo: 'INTERNA' | 'EXTERNA';
  numeroReferencia: string | null;
  remitenteNombre: string | null;
  remitenteCargo: string | null;
  remitenteInstitucion: string | null;
  remitenteUsuario: { nombre: string; cargo: string; unidad: { sigla: string } } | null;
  fechaRecepcion: string;
  referencia: string;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  estadoActual: string;
  creadoPor: { nombre: string; cargo: string; unidad: { nombre: string; sigla: string } };
  derivaciones: Derivacion[];
  adjuntos: Adjunto[];
  auditorias: Auditoria[];
  isCurrentHolder: boolean;
  hasAccepted: boolean;
  activeDerivacionId: string | null;
  activeDerivacionEstado: string | null;
}

interface UserOption {
  id: string;
  nombre: string;
  cargo: string;
  unidad: { sigla: string };
}

export const DetailCorrespondence: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CorrespondenceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modales
  const [showDeriveModal, setShowDeriveModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState<Adjunto | null>(null);

  // Formulario derivación
  const [users, setUsers] = useState<UserOption[]>([]);
  const [destinatarioId, setDestinatarioId] = useState('');
  const [proveido, setProveido] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Formulario Archivo / Cierre
  const [comentarioCierre, setComentarioCierre] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/correspondence/${id}`);
      setData(response.data);
    } catch (err: any) {
      setError('Error al consultar los detalles de la correspondencia hospitalaria.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
      if (res.data.length > 0) {
        setDestinatarioId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchUsers();
  }, [id]);

  const handleAccept = async () => {
    if (!data) return;
    setLoading(true);
    try {
      await api.post(`/correspondence/${data.id}/accept`);
      await fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al recepcionar el trámite.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinatarioId || !proveido.trim()) {
      alert('Destinatario e instrucción proveído son requeridos.');
      return;
    }
    setModalLoading(true);
    try {
      await api.post(`/correspondence/${id}/derive`, { destinatarioId, proveido });
      setShowDeriveModal(false);
      setProveido('');
      await fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al derivar.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleArchiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post(`/correspondence/${id}/archive`, { proveido: comentarioCierre });
      setShowArchiveModal(false);
      setComentarioCierre('');
      await fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al archivar.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await api.post(`/correspondence/${id}/close`, { proveido: comentarioCierre });
      setShowCloseModal(false);
      setComentarioCierre('');
      await fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al concluir el trámite.');
    } finally {
      setModalLoading(false);
    }
  };

  const handlePrintPdf = () => {
    if (!data) return;
    window.open(`/api/reports/correspondence/${data.id}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200 rounded-xl shadow-sm">
        <Loader2 className="w-8 h-8 text-[#0f4c81] animate-spin" />
        <span className="text-slate-500 font-medium">Buscando expediente en el archivo hospitalario...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center font-medium">
        {error || 'No se encontró la correspondencia solicitada.'}
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ALTA': return 'bg-red-50 text-red-700 border-red-200';
      case 'MEDIA': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'BAJA': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bandejas')}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-[#0f3d62]" />
              Expediente / Hoja de Ruta: {data.numero}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              SnowPoint Healthcare - Expediente de Trazabilidad y Consultoría en Salud.
            </p>
          </div>
        </div>

        {/* Print button */}
        <button
          onClick={handlePrintPdf}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-100 bg-white text-slate-700 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4 text-[#0f4c81]" />
          Imprimir Hoja de Ruta (PDF)
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: General Info & Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metadata Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <span className="font-bold text-[#0f4c81] text-sm">Resumen del Trámite Hospitalario</span>
              <span className={`px-2.5 py-0.5 text-xs font-bold border rounded-full ${getPriorityColor(data.prioridad)}`}>
                {data.prioridad === 'ALTA' ? 'URGENCIA MÉDICA' : `Prioridad ${data.prioridad}`}
              </span>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Asunto */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Motivo / Asunto Clínico</span>
                <p className="text-slate-800 font-semibold text-base mt-1 leading-relaxed">{data.referencia}</p>
              </div>

              {/* Remitente Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {data.tipo === 'EXTERNA' ? 'Origen Externo' : 'Médico / Servicio de Origen'}
                  </span>
                  <div className="mt-1">
                    {data.tipo === 'EXTERNA' ? (
                      <>
                        <p className="font-bold text-slate-800">{data.remitenteNombre}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {data.remitenteCargo} - <span className="font-semibold text-slate-700">{data.remitenteInstitucion}</span>
                        </p>
                        {data.numeroReferencia && (
                          <span className="inline-block mt-1 text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            Ref Ext: {data.numeroReferencia}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-slate-800">{data.remitenteUsuario?.nombre}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {data.remitenteUsuario?.cargo} - <span className="font-semibold text-slate-700">[{data.remitenteUsuario?.unidad.sigla}]</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Registro y Recepción</span>
                  <div className="mt-1 text-slate-700 text-sm space-y-1">
                    <p className="flex items-center gap-1.5 font-medium text-xs">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(data.fechaRecepcion).toLocaleString('es-BO')}
                    </p>
                    <p className="text-xs text-slate-400">
                      Registrado por: <span className="font-medium text-slate-600">{data.creadoPor.nombre} ({data.creadoPor.unidad.sigla})</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Estado General: <span className="font-bold uppercase text-[#0f4c81]">{data.estadoActual.replace('_', ' ')}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons if user is holder */}
              {data.isCurrentHolder && (
                <div className="bg-sky-50/60 border border-sky-100 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                  <div>
                    <h4 className="font-bold text-[#0f4c81] text-sm">Este trámite se encuentra asignado a su persona</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {data.hasAccepted 
                        ? 'Puede emitir su criterio médico, derivar a otra especialidad o concluir el requerimiento.' 
                        : 'Debe recepcionar el trámite en su bandeja para habilitar acciones.'
                      }
                    </p>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    {!data.hasAccepted ? (
                      <button
                        onClick={handleAccept}
                        className="w-full md:w-auto px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
                      >
                        Recepcionar Trámite
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowDeriveModal(true)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0f4c81] hover:bg-[#0a2e52] text-white rounded-lg text-sm font-bold shadow-sm transition-all"
                        >
                          <Send className="w-4 h-4" />
                          Derivar
                        </button>
                        <button
                          onClick={() => setShowArchiveModal(true)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 bg-white text-slate-700 rounded-lg text-sm font-semibold transition-all"
                        >
                          <Archive className="w-4 h-4" />
                          Archivar
                        </button>
                        <button
                          onClick={() => setShowCloseModal(true)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Concluir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Derivations Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="w-5 h-5 text-[#0f4c81]" />
              Historial de Derivaciones e Interconsultas
            </h3>
            
            <div className="relative border-l-2 border-sky-100 ml-4 pl-6 space-y-6 pt-2">
              {data.derivaciones.map((d, index) => {
                const isFirst = index === 0;
                return (
                  <div key={d.id} className="relative group">
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[#0f4c81] bg-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0f4c81]"></div>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all rounded-xl p-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="font-bold text-[#0f4c81]">
                          Paso {index + 1}: {isFirst ? 'Registro / Ingreso' : 'Derivación Interdepartamental'}
                        </span>
                        <span className="text-slate-400 font-medium">
                          {new Date(data.derivaciones[index].fechaDerivacion).toLocaleString('es-BO')}
                        </span>
                      </div>

                      <div className="text-sm font-medium text-slate-800 flex items-center gap-2 flex-wrap">
                        <span>{d.remitente.nombre} [{d.remitente.unidad.sigla}]</span>
                        <span className="text-slate-400 font-bold">&rarr;</span>
                        <span>{d.destinatario.nombre} [{d.destinatario.unidad.sigla}]</span>
                      </div>

                      <div className="bg-white border border-slate-200/60 p-3 rounded-lg text-slate-600 text-xs italic leading-relaxed">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 inline mr-1" />
                        "{d.proveido}"
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 font-semibold">
                        <span>Estado: <span className="uppercase text-teal-700">{d.estado}</span></span>
                        {d.fechaRecepcion && (
                          <span>Recepción: {new Date(d.fechaRecepcion).toLocaleString('es-BO')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Attachments & Audit logs */}
        <div className="space-y-6">
          
          {/* Attachments Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">
              Documentos Clínicos Adjuntos
            </h3>

            {data.adjuntos.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay archivos adjuntos en este expediente.</p>
            ) : (
              <div className="space-y-3">
                {data.adjuntos.map((file) => (
                  <div key={file.id} className="p-3 border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col gap-2 bg-slate-50/50">
                    <div className="flex items-start gap-2 justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 truncate" title={file.nombreArchivo}>
                          {file.nombreArchivo}
                        </span>
                      </div>
                      <a
                        href={`/uploads/${file.pathArchivo}`}
                        download={file.nombreArchivo}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      {file.firmado ? (
                        <button
                          onClick={() => setShowSignatureModal(file)}
                          className="flex items-center gap-1 text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200 hover:bg-teal-100 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                          FIRMA DIGITAL MÉDICA
                        </button>
                      ) : (
                        <span className="text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          SIN FIRMAR
                        </span>
                      )}
                      <span className="text-slate-400">{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Traceability Log */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
              <Info className="w-4.5 h-4.5 text-slate-400" />
              Trazabilidad y Auditoría
            </h3>

            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
              {data.auditorias.map((a) => (
                <div key={a.id} className="text-xs leading-relaxed space-y-0.5 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span className="text-[#0f4c81] uppercase">{a.accion}</span>
                    <span className="text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-500 font-medium">{a.detalles}</p>
                  <p className="text-[10px] text-slate-400">
                    Por: {a.usuario.nombre} [{a.usuario.cargo} - {a.usuario.unidad.sigla}]
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* --- MODALES --- */}

      {/* Modal Derivación */}
      {showDeriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-[#0f4c81] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Send className="w-4 h-4" />
                Derivar Trámite / Interconsulta
              </h3>
              <button onClick={() => setShowDeriveModal(false)} className="text-white hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDeriveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Especialista / Destinatario *</label>
                <select
                  value={destinatarioId}
                  onChange={(e) => setDestinatarioId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.cargo} - [{u.unidad.sigla}])
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Instrucción / Nota Médica *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="ej. Para su valoración especializada e informe médico firmado digitalmente."
                  value={proveido}
                  onChange={(e) => setProveido(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeriveModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-[#0f4c81] hover:bg-[#0a2e52] text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar Derivación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Archivar */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-slate-700 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Custodia y Archivo
              </h3>
              <button onClick={() => setShowArchiveModal(false)} className="text-white hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleArchiveSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg leading-relaxed flex gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>
                  Esta acción transferirá el expediente al Archivo Central del Hospital Agramont, retirándolo de sus pendientes activos.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nota de Archivo / Ubicación</label>
                <textarea
                  rows={2}
                  placeholder="ej. Archivado en Archivo Clínico Central - Gaveta B-12."
                  value={comentarioCierre}
                  onChange={(e) => setComentarioCierre(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Archivar Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Concluir */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-teal-700 text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Concluir Trámite / Caso
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="text-white hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCloseSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 text-xs rounded-lg leading-relaxed flex gap-2">
                <CheckCircle className="w-5 h-5 shrink-0 text-teal-600" />
                <span>
                  Marcará este requerimiento como resuelto y atendido satisfactoriamente en el Hospital Agramont.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nota de Conclusión / Resolución</label>
                <textarea
                  rows={2}
                  placeholder="ej. Requerimiento atendido con despacho de farmacia y reporte médico adjunto."
                  value={comentarioCierre}
                  onChange={(e) => setComentarioCierre(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Concluir Proceso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Validación de Firma Digital Médica */}
      {showSignatureModal && (() => {
        const metadata = showSignatureModal.firmaMetadata 
          ? JSON.parse(showSignatureModal.firmaMetadata) 
          : null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scale-up">
              <div className="bg-teal-800 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-teal-300" />
                  Validación de Firma Digital en Salud (.bo)
                </div>
                <button onClick={() => setShowSignatureModal(null)} className="text-white hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-col items-center text-center p-4 bg-teal-50 rounded-xl border border-teal-100">
                  <ShieldCheck className="w-12 h-12 text-teal-600 mb-2" />
                  <span className="font-extrabold text-sm text-teal-900 uppercase tracking-wide">
                    Firma Médica Válida e Íntegra
                  </span>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    El documento clínico / administrativo no ha sufrido modificaciones desde su firma digital.
                  </p>
                </div>

                {metadata && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Profesional Firmante:</span>
                      <p className="font-bold text-slate-800 text-sm">{metadata.firmante}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Matrícula / Registro:</span>
                      <p className="font-bold text-teal-800 text-sm flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-teal-600" />
                        {metadata.matriculaMedica || 'Personal Hospitalario'}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Cédula de Identidad:</span>
                      <p className="font-semibold text-slate-700">{metadata.ci}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha / Hora de Firma:</span>
                      <p className="font-semibold text-slate-700">{new Date(metadata.fechaFirma).toLocaleString()}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 md:col-span-2">
                      <span className="block font-bold text-slate-400 uppercase tracking-wider mb-1">Entidad Certificadora:</span>
                      <p className="font-semibold text-slate-700">{metadata.entidadCertificadora}</p>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-4 leading-relaxed">
                  Hospital Agramont - Validación procesada bajo estándares de seguridad médica e interoperabilidad digital.
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowSignatureModal(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Cerrar Verificación
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
