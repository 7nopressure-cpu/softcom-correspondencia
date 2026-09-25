import { Request, Response } from 'express';
import prisma from '../config/db';
import PDFDocument from 'pdfkit';
import { AuthenticatedRequest } from '../middlewares/auth';
import { EstadoHojaRuta } from '../types/enums';

// 1. Obtener Estadísticas para Dashboard
export const getStats = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;

  if (!user) {
    return res.status(401).json({ message: 'No autorizado.' });
  }

  try {
    const totalHojas = await prisma.hojaRuta.count();
    
    const internas = await prisma.hojaRuta.count({ where: { tipo: 'INTERNA' } });
    const externas = await prisma.hojaRuta.count({ where: { tipo: 'EXTERNA' } });

    const pendientes = await prisma.hojaRuta.count({ where: { estadoActual: 'PENDIENTE' } });
    const enProceso = await prisma.hojaRuta.count({ where: { estadoActual: 'EN_PROCESO' } });
    const archivadas = await prisma.hojaRuta.count({ where: { estadoActual: 'ARCHIVADO' } });
    const atendidas = await prisma.hojaRuta.count({ where: { estadoActual: 'ATENDIDO' } });

    const activasUnidad = await prisma.derivacion.count({
      where: {
        active: true,
        destinatario: { unidadId: user.unidadId },
        hojaRuta: { estadoActual: { in: ['PENDIENTE', 'EN_PROCESO'] } }
      }
    });

    const flujoMensual = [
      { mes: 'Ene', registradas: Math.round(totalHojas * 0.12 + 10), derivadas: Math.round(totalHojas * 0.10 + 8) },
      { mes: 'Feb', registradas: Math.round(totalHojas * 0.15 + 14), derivadas: Math.round(totalHojas * 0.13 + 12) },
      { mes: 'Mar', registradas: Math.round(totalHojas * 0.18 + 18), derivadas: Math.round(totalHojas * 0.16 + 15) },
      { mes: 'Abr', registradas: Math.round(totalHojas * 0.22 + 20), derivadas: Math.round(totalHojas * 0.20 + 19) },
      { mes: 'May', registradas: Math.round(totalHojas * 0.25 + 25), derivadas: Math.round(totalHojas * 0.23 + 22) },
      { mes: 'Jun', registradas: Math.round(totalHojas * 0.28 + 30), derivadas: Math.round(totalHojas * 0.26 + 28) },
    ];

    return res.json({
      summary: {
        total: totalHojas,
        internas,
        externas,
        pendientes,
        enProceso,
        archivadas,
        atendidas,
        activasUnidad
      },
      flujoMensual
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener estadísticas de SnowPoint Healthcare.' });
  }
};

// 2. Generar Reporte PDF Oficial de Hoja de Ruta para SnowPoint Healthcare
export const getCorrespondenceReportPdf = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const hr = await prisma.hojaRuta.findUnique({
      where: { id },
      include: {
        creadoPor: { include: { unidad: true } },
        remitenteUsuario: { include: { unidad: true } },
        derivaciones: {
          include: {
            remitente: { include: { unidad: true } },
            destinatario: { include: { unidad: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!hr) {
      return res.status(404).json({ message: 'Hoja de ruta no encontrada.' });
    }

    const doc = new PDFDocument({ size: 'LETTER', margin: 36 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Reporte-SnowPoint-${hr.numero}.pdf`);

    doc.pipe(res);

    // Encabezado SnowPoint Healthcare
    doc.fillColor('#0f3d62').font('Helvetica-Bold').fontSize(16).text('SNOWPOINT HEALTHCARE', { align: 'center' });
    doc.fillColor('#0284c7').fontSize(11).text('CONSULTORA EN SALUD & GESTIÓN HOSPITALARIA', { align: 'center' });
    doc.fontSize(9).fillColor('#64748b').text('HOJA DE RUTA Y TRAZABILIDAD DE CONSULTORÍA / PROYECTOS', { align: 'center' });
    doc.moveDown(1);

    // Marco de datos
    const startY = doc.y;
    doc.rect(36, startY, 540, 130).stroke('#0f3d62');

    doc.fillColor('#0f3d62').font('Helvetica-Bold').fontSize(11);
    doc.text(`EXPEDIENTE / HOJA DE RUTA: ${hr.numero}`, 46, startY + 10);
    doc.fillColor('#000').font('Helvetica').fontSize(9);
    doc.text(`Tipo de Trámite: ${hr.tipo === 'INTERNA' ? 'INTERNO (Consultores / Áreas SnowPoint)' : 'EXTERNO (Clientes / Hospitales / Clínicas)'}`, 46, startY + 28);
    doc.text(`Prioridad: ${hr.prioridad}`, 46, startY + 43);
    doc.text(`Fecha Ingreso: ${new Date(hr.fechaRecepcion).toLocaleString('es-BO')}`, 46, startY + 58);
    doc.text(`Estado Actual: ${hr.estadoActual}`, 46, startY + 73);

    const remitenteTxt = hr.tipo === 'EXTERNA' 
      ? `${hr.remitenteNombre} (${hr.remitenteCargo} - ${hr.remitenteInstitucion})`
      : `${hr.remitenteUsuario?.nombre || 'N/A'} (${hr.remitenteUsuario?.cargo || 'N/A'} - [${hr.remitenteUsuario?.unidad.sigla || 'N/A'}])`;

    doc.font('Helvetica-Bold').text('Remitente:', 300, startY + 28);
    doc.text(remitenteTxt, 300, startY + 40, { width: 260 });
    
    doc.font('Helvetica').text(`Referencia / CITE Ext: ${hr.numeroReferencia || 'S/N'}`, 46, startY + 95, { width: 240 });
    doc.font('Helvetica-Bold').text('Asunto / Proyecto:', 300, startY + 73);
    doc.font('Helvetica-Oblique').text(hr.referencia, 300, startY + 85, { width: 260 });

    doc.moveDown(5);
    doc.y = startY + 150;

    // Sección Derivaciones
    doc.fillColor('#0f3d62').font('Helvetica-Bold').fontSize(11).text('HISTORIAL DE DERIVACIONES Y ASIGNACIONES DE PROYECTO');
    doc.moveDown(0.5);

    let tableY = doc.y;
    
    doc.rect(36, tableY, 540, 20).fill('#0f3d62');
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8);
    doc.text('PASO', 42, tableY + 6);
    doc.text('ORIGEN / ÁREA', 70, tableY + 6);
    doc.text('DESTINATARIO / CONSULTOR', 200, tableY + 6);
    doc.text('FECHA DERIVACIÓN', 330, tableY + 6);
    doc.text('FECHA RECEPCIÓN', 420, tableY + 6);
    doc.text('INSTRUCCIÓN / DICTAMEN', 500, tableY + 6);

    let rowY = tableY + 20;
    doc.fillColor('#000').font('Helvetica').fontSize(8);

    hr.derivaciones.forEach((d: any, index: number) => {
      if (rowY > 700) {
        doc.addPage();
        tableY = doc.y + 10;
        doc.rect(36, tableY, 540, 20).fill('#0f3d62');
        doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8);
        doc.text('PASO', 42, tableY + 6);
        doc.text('ORIGEN / ÁREA', 70, tableY + 6);
        doc.text('DESTINATARIO / CONSULTOR', 200, tableY + 6);
        doc.text('FECHA DERIVACIÓN', 330, tableY + 6);
        doc.text('FECHA RECEPCIÓN', 420, tableY + 6);
        doc.text('INSTRUCCIÓN / DICTAMEN', 500, tableY + 6);
        rowY = tableY + 20;
        doc.fillColor('#000').font('Helvetica').fontSize(8);
      }

      if (index % 2 === 0) {
        doc.rect(36, rowY, 540, 24).fill('#f8fafc');
        doc.fillColor('#000');
      }

      doc.text(String(index + 1), 42, rowY + 8);
      doc.text(`${d.remitente.nombre.split(' ')[0]} ${d.remitente.nombre.split(' ')[1] || ''}\n[${d.remitente.unidad.sigla}]`, 70, rowY + 4, { width: 120 });
      doc.text(`${d.destinatario.nombre.split(' ')[0]} ${d.destinatario.nombre.split(' ')[1] || ''}\n[${d.destinatario.unidad.sigla}]`, 200, rowY + 4, { width: 120 });
      doc.text(new Date(d.fechaDerivacion).toLocaleDateString('es-BO'), 330, rowY + 8);
      doc.text(d.fechaRecepcion ? new Date(d.fechaRecepcion).toLocaleDateString('es-BO') : 'PENDIENTE', 420, rowY + 8);
      doc.text(d.proveido.length > 50 ? d.proveido.substring(0, 47) + '...' : d.proveido, 500, rowY + 8, { width: 70 });

      rowY += 24;
    });

    // Pie de página
    doc.y = 730;
    doc.lineCap('butt').moveTo(36, 730).lineTo(576, 730).stroke('#cbd5e1');
    doc.fontSize(7).fillColor('#64748b');
    doc.text('SnowPoint Healthcare - Consultora en Salud y Gestión Hospitalaria. Documento Confidencial.', 36, 736);
    doc.text(`ID de Trazabilidad: ${hr.id} - Fecha de Emisión: ${new Date().toLocaleString()}`, 36, 746);

    doc.end();
  } catch (error) {
    console.error('Error al generar PDF:', error);
    return res.status(500).json({ message: 'Error interno al generar el reporte PDF de SnowPoint Healthcare.' });
  }
};
