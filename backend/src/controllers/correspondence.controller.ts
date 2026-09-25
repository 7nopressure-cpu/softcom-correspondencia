import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { TipoCorrespondencia, Prioridad, EstadoHojaRuta, EstadoDerivacion, AccionAuditoria } from '../types/enums';
import { verifyPdfSignature } from '../services/signature.service';
import path from 'path';

// 1. Registro de Correspondencia (Externa o Interna)
export const createCorrespondence = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;

  if (!user) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  const {
    tipo,
    referencia,
    prioridad,
    numeroReferencia,
    remitenteNombre,
    remitenteCargo,
    remitenteInstitucion,
    remitenteUsuarioId,
    destinatarioId, // Si se deriva inmediatamente al crear
    proveido
  } = req.body;

  if (!tipo || !referencia) {
    return res.status(400).json({ message: 'El tipo y la referencia son requeridos.' });
  }

  try {
    const files = req.files as Express.Multer.File[] || [];

    // Generación del número correlativo en transacción secuencial simple
    const result = await prisma.$transaction(async (tx: any) => {
      const year = new Date().getFullYear();
      const prefix = tipo === 'EXTERNA' ? 'EXT' : 'INT';
      
      // Contar registros para el año y tipo actuales
      const count = await tx.hojaRuta.count({
        where: {
          tipo: tipo as TipoCorrespondencia,
          numero: {
            startsWith: `HR-${prefix}-${year}-`
          }
        }
      });

      const correlativo = String(count + 1).padStart(5, '0');
      const numero = `HR-${prefix}-${year}-${correlativo}`;

      // Crear la Hoja de Ruta
      const hojaRuta = await tx.hojaRuta.create({
        data: {
          numero,
          tipo: tipo as TipoCorrespondencia,
          referencia,
          prioridad: (prioridad as Prioridad) || Prioridad.MEDIA,
          numeroReferencia: tipo === 'EXTERNA' ? numeroReferencia : null,
          remitenteNombre: tipo === 'EXTERNA' ? remitenteNombre : null,
          remitenteCargo: tipo === 'EXTERNA' ? remitenteCargo : null,
          remitenteInstitucion: tipo === 'EXTERNA' ? remitenteInstitucion : null,
          remitenteUsuarioId: tipo === 'INTERNA' ? (remitenteUsuarioId || user.id) : null,
          creadoPorId: user.id,
          estadoActual: EstadoHojaRuta.PENDIENTE
        }
      });

      // Procesar y validar firma de los archivos adjuntos
      const adjuntosData = [];
      for (const file of files) {
        // Ejecutar validador de firma digital
        const sigResult = await verifyPdfSignature(file.path);
        
        const adjunto = await tx.adjunto.create({
          data: {
            hojaRutaId: hojaRuta.id,
            nombreArchivo: file.originalname,
            pathArchivo: file.filename, // Almacenar el nombre de archivo guardado en uploads
            tipoMime: file.mimetype,
            firmado: sigResult.firmado,
            firmaMetadata: sigResult.detalles ? JSON.stringify(sigResult.detalles) : null,
            subidoPorId: user.id
          }
        });
        adjuntosData.push(adjunto);
      }

      // Crear derivación inicial
      // Si se especificó un destinatario, se deriva de inmediato
      const destId = destinatarioId && destinatarioId !== 'self' ? destinatarioId : user.id;
      const esAutoDerivacion = destId === user.id;

      const derivacion = await tx.derivacion.create({
        data: {
          hojaRutaId: hojaRuta.id,
          remitenteId: user.id,
          destinatarioId: destId,
          proveido: proveido || (esAutoDerivacion ? 'Registro inicial de correspondencia y auto-asignación.' : 'Derivación inicial por registro.'),
          estado: esAutoDerivacion ? EstadoDerivacion.LEIDO : EstadoDerivacion.PENDIENTE,
          fechaRecepcion: esAutoDerivacion ? new Date() : null,
          active: true
        }
      });

      // Registrar acción en el historial de auditoría
      await tx.historialAccion.create({
        data: {
          hojaRutaId: hojaRuta.id,
          usuarioId: user.id,
          accion: AccionAuditoria.REGISTRO,
          detalles: `Hoja de ruta creada con correlativo ${numero}. Asignada inicialmente a ${esAutoDerivacion ? 'sí mismo' : 'otro usuario'}.`
        }
      });

      return { hojaRuta, adjuntos: adjuntosData, derivacion };
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al registrar la correspondencia.' });
  }
};

// 2. Derivación de Correspondencia
export const deriveCorrespondence = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;
  const { id } = req.params; // ID de Hoja de Ruta
  const { destinatarioId, proveido } = req.body;

  if (!user) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  if (!destinatarioId || !proveido) {
    return res.status(400).json({ message: 'Destinatario y proveído son requeridos.' });
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // Buscar la derivación activa actual de esta Hoja de Ruta
      const activeDerivacion = await tx.derivacion.findFirst({
        where: {
          hojaRutaId: id,
          active: true
        }
      });

      if (activeDerivacion) {
        // Validar que el usuario que deriva sea el destinatario actual (el tenedor actual del documento)
        if (activeDerivacion.destinatarioId !== user.id) {
          throw new Error('Solo el tenedor actual de la correspondencia puede derivarla.');
        }

        // Marcar la derivación anterior como no activa y completada/leída
        await tx.derivacion.update({
          where: { id: activeDerivacion.id },
          data: {
            active: false,
            estado: EstadoDerivacion.ATENDIDO,
            fechaRecepcion: activeDerivacion.fechaRecepcion || new Date()
          }
        });
      }

      // Crear la nueva derivación
      const nuevaDerivacion = await tx.derivacion.create({
        data: {
          hojaRutaId: id,
          remitenteId: user.id,
          destinatarioId,
          proveido,
          estado: EstadoDerivacion.PENDIENTE,
          active: true
        },
        include: {
          destinatario: {
            select: { nombre: true, cargo: true }
          }
        }
      });

      // Actualizar el estado de la hoja de ruta
      await tx.hojaRuta.update({
        where: { id },
        data: { estadoActual: EstadoHojaRuta.EN_PROCESO }
      });

      // Registrar auditoría
      await tx.historialAccion.create({
        data: {
          hojaRutaId: id,
          usuarioId: user.id,
          accion: AccionAuditoria.DERIVACION,
          detalles: `Derivado a ${nuevaDerivacion.destinatario.nombre} (${nuevaDerivacion.destinatario.cargo}) con proveído: "${proveido}"`
        }
      });

      return nuevaDerivacion;
    });

    return res.json(result);
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ message: error.message || 'Error al derivar la correspondencia.' });
  }
};

// 3. Aceptar / Recibir Correspondencia
export const acceptCorrespondence = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;
  const { id } = req.params; // ID de Hoja de Ruta

  if (!user) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const activeDerivacion = await tx.derivacion.findFirst({
        where: {
          hojaRutaId: id,
          destinatarioId: user.id,
          active: true
        }
      });

      if (!activeDerivacion) {
        throw new Error('No tienes derivaciones pendientes activas para esta correspondencia.');
      }

      if (activeDerivacion.fechaRecepcion) {
        return activeDerivacion; // Ya estaba aceptada
      }

      const updated = await tx.derivacion.update({
        where: { id: activeDerivacion.id },
        data: {
          estado: EstadoDerivacion.LEIDO,
          fechaRecepcion: new Date()
        }
      });

      // Registrar auditoría
      await tx.historialAccion.create({
        data: {
          hojaRutaId: id,
          usuarioId: user.id,
          accion: AccionAuditoria.ACEPTACION,
          detalles: 'Correspondencia recibida físicamente / digitalmente en bandeja.'
        }
      });

      return updated;
    });

    return res.json(result);
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ message: error.message || 'Error al aceptar correspondencia.' });
  }
};

// 4. Archivar Correspondencia
export const archiveCorrespondence = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;
  const { id } = req.params; // ID de Hoja de Ruta
  const { proveido } = req.body;

  if (!user) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      const activeDerivacion = await tx.derivacion.findFirst({
        where: {
          hojaRutaId: id,
          destinatarioId: user.id,
          active: true
        }
      });

      if (!activeDerivacion) {
        throw new Error('No tienes la tenencia activa de esta correspondencia para archivarla.');
      }

      // Marcar derivación activa como archivada
      await tx.derivacion.update({
        where: { id: activeDerivacion.id },
        data: {
          estado: EstadoDerivacion.ARCHIVADO,
          fechaRecepcion: activeDerivacion.fechaRecepcion || new Date()
        }
      });

      // Actualizar estado general a ARCHIVADO
      await tx.hojaRuta.update({
        where: { id },
        data: { estadoActual: EstadoHojaRuta.ARCHIVADO }
      });

      // Auditoría
      await tx.historialAccion.create({
        data: {
          hojaRutaId: id,
          usuarioId: user.id,
          accion: AccionAuditoria.ARCHIVADO,
          detalles: `Correspondencia archivada. Detalle: ${proveido || 'Sin comentarios'}`
        }
      });
    });

    return res.json({ message: 'Correspondencia archivada correctamente.' });
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ message: error.message || 'Error al archivar correspondencia.' });
  }
};

// 5. Atender / Cerrar Correspondencia
export const closeCorrespondence = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;
  const { id } = req.params; // ID de Hoja de Ruta
  const { proveido } = req.body;

  if (!user) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      const activeDerivacion = await tx.derivacion.findFirst({
        where: {
          hojaRutaId: id,
          destinatarioId: user.id,
          active: true
        }
      });

      if (!activeDerivacion) {
        throw new Error('No tienes la tenencia activa de esta correspondencia para marcarla como atendida.');
      }

      // Marcar derivación como atendida
      await tx.derivacion.update({
        where: { id: activeDerivacion.id },
        data: {
          estado: EstadoDerivacion.ATENDIDO,
          fechaRecepcion: activeDerivacion.fechaRecepcion || new Date()
        }
      });

      // Actualizar estado general a ATENDIDO
      await tx.hojaRuta.update({
        where: { id },
        data: { estadoActual: EstadoHojaRuta.ATENDIDO }
      });

      // Auditoría
      await tx.historialAccion.create({
        data: {
          hojaRutaId: id,
          usuarioId: user.id,
          accion: AccionAuditoria.ATENDIDO,
          detalles: `Correspondencia marcada como ATENDIDA/RESUELTA. Detalle: ${proveido || 'Sin comentarios'}`
        }
      });
    });

    return res.json({ message: 'Correspondencia marcada como atendida/resuelta.' });
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ message: error.message || 'Error al atender correspondencia.' });
  }
};

// 6. Obtener Bandejas de Usuario
export const getBandejas = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;
  const { bandeja } = req.params; // 'recibidos', 'derivados', 'pendientes', 'archivados'

  if (!user) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  try {
    let derivaciones = [];

    if (bandeja === 'recibidos') {
      // Recibidos: Derivaciones activas para mí donde no las he aceptado (fechaRecepcion IS NULL)
      derivaciones = await prisma.derivacion.findMany({
        where: {
          destinatarioId: user.id,
          active: true,
          fechaRecepcion: null,
          estado: EstadoDerivacion.PENDIENTE
        },
        include: {
          hojaRuta: {
            include: {
              creadoPor: { select: { nombre: true, cargo: true } },
              remitenteUsuario: { select: { nombre: true, cargo: true } }
            }
          },
          remitente: { select: { nombre: true, cargo: true, unidad: { select: { sigla: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (bandeja === 'pendientes') {
      // Pendientes (En Proceso): Derivaciones activas para mí donde ya las acepté (fechaRecepcion IS NOT NULL)
      // y la correspondencia NO está archivada ni resuelta globalmente
      derivaciones = await prisma.derivacion.findMany({
        where: {
          destinatarioId: user.id,
          active: true,
          fechaRecepcion: { not: null },
          estado: { in: [EstadoDerivacion.PENDIENTE, EstadoDerivacion.LEIDO] },
          hojaRuta: {
            estadoActual: { in: [EstadoHojaRuta.PENDIENTE, EstadoHojaRuta.EN_PROCESO] }
          }
        },
        include: {
          hojaRuta: {
            include: {
              creadoPor: { select: { nombre: true, cargo: true } },
              remitenteUsuario: { select: { nombre: true, cargo: true } }
            }
          },
          remitente: { select: { nombre: true, cargo: true, unidad: { select: { sigla: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (bandeja === 'derivados') {
      // Derivados: Derivaciones que yo envié a otros (excluyendo auto-derivación)
      derivaciones = await prisma.derivacion.findMany({
        where: {
          remitenteId: user.id,
          destinatarioId: { not: user.id }
        },
        include: {
          hojaRuta: {
            include: {
              creadoPor: { select: { nombre: true, cargo: true } },
              remitenteUsuario: { select: { nombre: true, cargo: true } }
            }
          },
          destinatario: { select: { nombre: true, cargo: true, unidad: { select: { sigla: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (bandeja === 'archivados') {
      // Archivados: Correspondencias que yo archivé o que están en estado ARCHIVADO/ATENDIDO y yo fui el último tenedor
      derivaciones = await prisma.derivacion.findMany({
        where: {
          destinatarioId: user.id,
          active: true,
          OR: [
            { estado: EstadoDerivacion.ARCHIVADO },
            { estado: EstadoDerivacion.ATENDIDO },
            { hojaRuta: { estadoActual: { in: [EstadoHojaRuta.ARCHIVADO, EstadoHojaRuta.ATENDIDO] } } }
          ]
        },
        include: {
          hojaRuta: {
            include: {
              creadoPor: { select: { nombre: true, cargo: true } },
              remitenteUsuario: { select: { nombre: true, cargo: true } }
            }
          },
          remitente: { select: { nombre: true, cargo: true, unidad: { select: { sigla: true } } } }
        },
        orderBy: { updatedAt: 'desc' }
      });
    } else {
      return res.status(400).json({ message: 'Bandeja no soportada.' });
    }

    // Aplanar respuesta para facilitar renderizado en frontend
    const responseData = derivaciones.map((d: any) => {
      const hr = d.hojaRuta;
      return {
        derivacionId: d.id,
        hojaRutaId: hr.id,
        numero: hr.numero,
        tipo: hr.tipo,
        referencia: hr.referencia,
        prioridad: hr.prioridad,
        estadoActual: hr.estadoActual,
        fechaRecepcionHojaRuta: hr.fechaRecepcion,
        // Remitente inicial del documento
        remitenteOriginal: hr.tipo === 'EXTERNA' 
          ? `${hr.remitenteNombre} (${hr.remitenteCargo} - ${hr.remitenteInstitucion})`
          : `${hr.remitenteUsuario?.nombre || 'Desconocido'} (${hr.remitenteUsuario?.cargo || 'Funcionario'})`,
        // Derivador
        remitenteDerivacion: 'remitente' in d && d.remitente ? `${d.remitente.nombre} (${d.remitente.cargo} - ${d.remitente.unidad.sigla})` : null,
        destinatarioDerivacion: 'destinatario' in d && d.destinatario ? `${d.destinatario.nombre} (${d.destinatario.cargo} - ${d.destinatario.unidad.sigla})` : null,
        proveido: d.proveido,
        fechaDerivacion: d.fechaDerivacion,
        fechaAceptacionDerivacion: d.fechaRecepcion,
        estadoDerivacion: d.estado
      };
    });

    return res.json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al consultar bandejas.' });
  }
};

// 7. Detalle de Hoja de Ruta (con Historial y Auditoría)
export const getCorrespondenceDetail = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;
  const { id } = req.params; // ID de Hoja de Ruta

  if (!user) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  try {
    const correspondence = await prisma.hojaRuta.findUnique({
      where: { id },
      include: {
        creadoPor: { select: { nombre: true, cargo: true, unidad: { select: { nombre: true, sigla: true } } } },
        remitenteUsuario: { select: { nombre: true, cargo: true, unidad: { select: { nombre: true, sigla: true } } } },
        derivaciones: {
          include: {
            remitente: { select: { nombre: true, cargo: true, unidad: { select: { sigla: true } } } },
            destinatario: { select: { nombre: true, cargo: true, unidad: { select: { sigla: true } } } }
          },
          orderBy: { createdAt: 'asc' }
        },
        adjuntos: {
          select: {
            id: true,
            nombreArchivo: true,
            tipoMime: true,
            firmado: true,
            firmaMetadata: true,
            createdAt: true,
            subidoPor: { select: { nombre: true, cargo: true } }
          }
        },
        auditorias: {
          include: {
            usuario: { select: { nombre: true, cargo: true, unidad: { select: { sigla: true } } } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!correspondence) {
      return res.status(404).json({ message: 'Correspondencia no encontrada.' });
    }

    // Verificar si el usuario actual es el destinatario de la derivación activa
    // para mostrar botones de acción (Derivar, Archivar, Atender, Recibir)
    const activeDerivacion = await prisma.derivacion.findFirst({
      where: {
        hojaRutaId: id,
        active: true
      }
    });

    const isCurrentHolder = activeDerivacion?.destinatarioId === user.id;
    const hasAccepted = activeDerivacion?.fechaRecepcion !== null;

    return res.json({
      ...correspondence,
      isCurrentHolder,
      hasAccepted,
      activeDerivacionId: activeDerivacion?.id || null,
      activeDerivacionEstado: activeDerivacion?.estado || null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al consultar detalle.' });
  }
};
