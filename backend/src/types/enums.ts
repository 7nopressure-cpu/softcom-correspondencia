export enum Rol {
  ADMIN = 'ADMIN',
  ADMISION_ARCHIVO = 'ADMISION_ARCHIVO',
  PERSONAL_HOSPITALARIO = 'PERSONAL_HOSPITALARIO',
  DIRECCION = 'DIRECCION',
}

export enum TipoCorrespondencia {
  INTERNA = 'INTERNA', // Trámites entre servicios, interconsultas, pedidos de farmacia, informes médicos
  EXTERNA = 'EXTERNA', // Proveedores, seguros de salud, cartas institucionales, pacientes
}

export enum Prioridad {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA', // Urgencias médicas / requerimientos prioritarios
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
