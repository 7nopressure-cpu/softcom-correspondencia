import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Save, 
  ArrowLeft, 
  FileUp, 
  FileText, 
  Trash2, 
  Loader2,
  Users,
  AlertTriangle,
  Briefcase
} from 'lucide-react';

interface UserOption {
  id: string;
  nombre: string;
  cargo: string;
  unidad: {
    id: string;
    nombre: string;
    sigla: string;
  };
}

export const CreateCorrespondence: React.FC = () => {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<'INTERNA' | 'EXTERNA'>('INTERNA');
  const [referencia, setReferencia] = useState('');
  const [prioridad, setPrioridad] = useState<'BAJA' | 'MEDIA' | 'ALTA'>('MEDIA');
  
  // Datos correspondencia externa
  const [remitenteNombre, setRemitenteNombre] = useState('');
  const [remitenteCargo, setRemitenteCargo] = useState('');
  const [remitenteInstitucion, setRemitenteInstitucion] = useState('');
  const [numeroReferencia, setNumeroReferencia] = useState('');

  // Datos correspondencia interna
  const [remitenteUsuarioId, setRemitenteUsuarioId] = useState('');

  // Destinatario y derivación inicial
  const [destinatarioId, setDestinatarioId] = useState('');
  const [proveido, setProveido] = useState('');

  // Adjuntos
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Listas de datos remotos
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await api.get('/users');
        setUsers(usersRes.data);
        
        if (usersRes.data.length > 0) {
          setDestinatarioId(usersRes.data[0].id);
        }

        const currentUserString = localStorage.getItem('user');
        if (currentUserString) {
          const currentUser = JSON.parse(currentUserString);
          setRemitenteUsuarioId(currentUser.id);
        }
      } catch (err: any) {
        setError('Error al obtener la lista de médicos y personal para derivación.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'png', 'jpg'].includes(ext || '');
      });

      if (validFiles.length !== filesArray.length) {
        alert('Algunos archivos no son permitidos. Solo se aceptan PDFs, documentos de Office e imágenes.');
      }

      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referencia.trim()) {
      setError('El asunto / motivo del trámite es obligatorio.');
      return;
    }

    if (tipo === 'EXTERNA' && (!remitenteNombre || !remitenteInstitucion)) {
      setError('El nombre del remitente y la institución/seguro son requeridos para correspondencia externa.');
      return;
    }

    setSubmitLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('tipo', tipo);
    formData.append('referencia', referencia);
    formData.append('prioridad', prioridad);
    formData.append('destinatarioId', destinatarioId);
    formData.append('proveido', proveido || 'Registro de trámite hospitalario');

    if (tipo === 'EXTERNA') {
      formData.append('remitenteNombre', remitenteNombre);
      formData.append('remitenteCargo', remitenteCargo);
      formData.append('remitenteInstitucion', remitenteInstitucion);
      formData.append('numeroReferencia', numeroReferencia);
    } else {
      formData.append('remitenteUsuarioId', remitenteUsuarioId);
    }

    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      await api.post('/correspondence', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/bandejas');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la correspondencia hospitalaria.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#0f3d62]" />
            Registrar Trámite / Proyecto de Consultoría
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            SnowPoint Healthcare - Generación de Hoja de Ruta para proyectos de consultoría, auditorías o correspondencia de clientes.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-lg flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 text-[#0f4c81] animate-spin" />
          <span className="text-slate-500 text-sm font-medium">Cargando servicios y médicos del hospital...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-sky-500 to-[#0f4c81]"></div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Toggle Tipo */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Documento</label>
              <div className="flex border border-slate-200 p-1.5 bg-slate-50 rounded-xl max-w-md">
                <button
                  type="button"
                  onClick={() => setTipo('INTERNA')}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                    tipo === 'INTERNA' 
                      ? 'bg-[#0f4c81] text-white shadow' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Interno (Interconsulta / Requerimiento)
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('EXTERNA')}
                  className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                    tipo === 'EXTERNA' 
                      ? 'bg-[#0f4c81] text-white shadow' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Externo (Seguros / Proveedores)
                </button>
              </div>
            </div>

            {/* SECCIÓN ORIGEN */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0f4c81] border-b border-slate-100 pb-2 uppercase tracking-wide">
                Origen del Documento
              </h3>

              {tipo === 'EXTERNA' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nombre del Remitente *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Dr. Carlos Gutiérrez"
                      value={remitenteNombre}
                      onChange={(e) => setRemitenteNombre(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Entidad / Seguro / Empresa *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Seguro de Salud Alianza / Droguería INTI"
                      value={remitenteInstitucion}
                      onChange={(e) => setRemitenteInstitucion(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cargo / Especialidad</label>
                    <input
                      type="text"
                      placeholder="ej. Auditor Médico / Gerente de Ventas"
                      value={remitenteCargo}
                      onChange={(e) => setRemitenteCargo(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nº CITE / Carta de Referencia</label>
                    <input
                      type="text"
                      placeholder="ej. ALIANZA-AUD-2026/089"
                      value={numeroReferencia}
                      onChange={(e) => setNumeroReferencia(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Personal / Médico Remitente *</label>
                    <select
                      value={remitenteUsuarioId}
                      onChange={(e) => setRemitenteUsuarioId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.cargo} - [{u.unidad.sigla}])
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN DETALLES */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0f4c81] border-b border-slate-100 pb-2 uppercase tracking-wide">
                Motivo y Prioridad del Trámite
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Asunto / Resumen Clínico o Administrativo *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describa el motivo de la correspondencia, interconsulta o solicitud..."
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Prioridad Clínica *</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                  >
                    <option value="BAJA">Baja (Trámite Ordinario)</option>
                    <option value="MEDIA">Media (Trámite Habitual)</option>
                    <option value="ALTA">Alta (Urgencia Médica / Quirófano)</option>
                  </select>
                  <div className="mt-4 p-3 bg-teal-50 text-[11px] text-teal-900 border border-teal-100 rounded-lg leading-relaxed">
                    Las solicitudes con prioridad alta se alertan inmediatamente en el buzón del especialista de turno.
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN DERIVACIÓN */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0f4c81] border-b border-slate-100 pb-2 uppercase tracking-wide">
                Destinatario y Asignación de Servicio
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Derivar Inmediatamente a *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Users className="w-4 h-4" />
                    </span>
                    <select
                      value={destinatarioId}
                      onChange={(e) => setDestinatarioId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                    >
                      <option value="self">Guardar en mi bandeja de Pendientes</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.cargo} - [{u.unidad.sigla}])
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Instrucción / Proveído Médico</label>
                  <input
                    type="text"
                    placeholder="ej. Para su valoración especializada e informe firmado digitalmente."
                    value={proveido}
                    onChange={(e) => setProveido(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#0f4c81] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN ADJUNTOS */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#0f4c81] border-b border-slate-100 pb-2 uppercase tracking-wide">
                Documentos Clínicos / Adjuntos Digitales
              </h3>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50/50 transition-colors relative">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="block font-bold text-sm text-slate-700">Arrastre informes médicos o haga clic para seleccionar</span>
                <span className="block text-[11px] text-slate-400 mt-1">
                  Formatos permitidos: PDF, Word, Excel e Imágenes (Máx. 10MB por archivo).
                </span>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Archivos Seleccionados:</span>
                  <div className="divide-y divide-slate-200">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between py-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
                          <FileText className="w-4 h-4 text-[#0f4c81] shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-xs text-slate-400">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-5 py-2 bg-[#0f4c81] hover:bg-[#0a2e52] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              {submitLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando trámite médico...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Registrar Expediente
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
