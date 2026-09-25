export enum Rol {
  ADMIN = 'ADMIN',                               // Administrador General de Sistemas
  DIRECTOR_EJECUTIVO = 'DIRECTOR_EJECUTIVO',     // Director General Ejecutivo (CEO) - DIR-EXE-001
  JEFE_UNIDAD = 'JEFE_UNIDAD',                   // Jefe de Unidad Operativa (DIG, CAL, EPI, ACA)
  CONSULTOR_SENIOR = 'CONSULTOR_SENIOR',         // Consultor Sénior / Auditor Médico
  CONSULTOR_ASOCIADO = 'CONSULTOR_ASOCIADO',     // Consultor Asociado / Analista / Bioestadístico
  RECEPCION_DOCUMENTAL = 'RECEPCION_DOCUMENTAL', // Gestión Documental, Recepción y Archivo
}

export enum TipoCorrespondencia {
  INTERNA = 'INTERNA', // Dictámenes, auditorías médicas, informes técnicos, derivaciones entre unidades
  EXTERNA = 'EXTERNA', // Hospitales clientes, directorios, clínicas, ASUSS, SEDES, Ministerio
}

export enum Prioridad {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA', // Auditorías urgentes / Requerimientos normativos críticos
}

export enum EstadoHojaRuta {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  ARCHIVADO = 'ARCHIVADO',
  ATENDIDO = 'ATENDIDO',
}

export enum EstadoDerivacion {
  PENDIENTE = 'PENDIENTE',
  LEIDO = 'LEIDO',
  ARCHIVADO = 'ARCHIVADO',
  ATENDIDO = 'ATENDIDO',
}

export enum AccionAuditoria {
  REGISTRO = 'REGISTRO',
  DERIVACION = 'DERIVACION',
  ACEPTACION = 'ACEPTACION',
  ARCHIVADO = 'ARCHIVADO',
  ATENDIDO = 'ATENDIDO',
  VALIDACION_FIRMA = 'VALIDACION_FIRMA',
}
