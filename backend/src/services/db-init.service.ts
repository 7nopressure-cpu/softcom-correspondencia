import prisma from '../config/db';
import bcrypt from 'bcryptjs';

let isInitialized = false;

export async function ensureDatabaseInitialized() {
  if (isInitialized) return;

  try {
    // 1. Create tables if not exist (PostgreSQL DDL)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Unidad" (
        "id" TEXT PRIMARY KEY,
        "nombre" TEXT UNIQUE NOT NULL,
        "sigla" TEXT UNIQUE NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Usuario" (
        "id" TEXT PRIMARY KEY,
        "username" TEXT UNIQUE NOT NULL,
        "email" TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        "nombre" TEXT NOT NULL,
        "cargo" TEXT NOT NULL,
        "rol" TEXT NOT NULL DEFAULT 'ADMIN',
        "unidadId" TEXT NOT NULL REFERENCES "Unidad"("id"),
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HojaRuta" (
        "id" TEXT PRIMARY KEY,
        "numero" TEXT UNIQUE NOT NULL,
        "tipo" TEXT NOT NULL,
        "numeroReferencia" TEXT,
        "remitenteNombre" TEXT,
        "remitenteCargo" TEXT,
        "remitenteInstitucion" TEXT,
        "remitenteUsuarioId" TEXT REFERENCES "Usuario"("id"),
        "fechaRecepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "referencia" TEXT NOT NULL,
        "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
        "estadoActual" TEXT NOT NULL DEFAULT 'PENDIENTE',
        "creadoPorId" TEXT NOT NULL REFERENCES "Usuario"("id"),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Derivacion" (
        "id" TEXT PRIMARY KEY,
        "hojaRutaId" TEXT NOT NULL REFERENCES "HojaRuta"("id") ON DELETE CASCADE,
        "remitenteId" TEXT NOT NULL REFERENCES "Usuario"("id"),
        "destinatarioId" TEXT NOT NULL REFERENCES "Usuario"("id"),
        "proveido" TEXT NOT NULL,
        "fechaDerivacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "fechaRecepcion" TIMESTAMP(3),
        "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Adjunto" (
        "id" TEXT PRIMARY KEY,
        "hojaRutaId" TEXT NOT NULL REFERENCES "HojaRuta"("id") ON DELETE CASCADE,
        "nombreArchivo" TEXT NOT NULL,
        "pathArchivo" TEXT NOT NULL,
        "tipoMime" TEXT NOT NULL,
        "firmado" BOOLEAN NOT NULL DEFAULT false,
        "firmaMetadata" TEXT,
        "subidoPorId" TEXT NOT NULL REFERENCES "Usuario"("id"),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HistorialAccion" (
        "id" TEXT PRIMARY KEY,
        "hojaRutaId" TEXT NOT NULL REFERENCES "HojaRuta"("id") ON DELETE CASCADE,
        "usuarioId" TEXT NOT NULL REFERENCES "Usuario"("id"),
        "accion" TEXT NOT NULL,
        "detalles" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Sincronizar Unidades Oficiales del MOF (MAN-002 Rev 2.0)
    const unitsData = [
      {
        id: 'unit-dir-exe-001',
        nombre: 'Dirección General Ejecutiva (Chief Executive Officer - CEO)',
        sigla: 'DIR-EXE-001'
      },
      {
        id: 'unit-jef-dig-002',
        nombre: 'Unidad de Transformación Digital, Ingeniería de Datos y Software (Unidad 1)',
        sigla: 'JEF-DIG-002'
      },
      {
        id: 'unit-jef-cal-003',
        nombre: 'Unidad de Planificación en Salud, Asesoría Normativa, Calidad y Seguridad del Paciente (Unidad 2)',
        sigla: 'JEF-CAL-003'
      },
      {
        id: 'unit-jef-epi-004',
        nombre: 'Unidad de Gestión del Conocimiento y Epidemiología Avanzada (Unidad 3)',
        sigla: 'JEF-EPI-004'
      },
      {
        id: 'unit-jef-aca-005',
        nombre: 'Unidad Académica, Posgrado y Educación Médica Continua (Unidad 4)',
        sigla: 'JEF-ACA-005'
      },
      {
        id: 'unit-adm-ti-006',
        nombre: 'Gestión Documental, Recepción y Soporte de Plataforma TI',
        sigla: 'ADM-TI-006'
      }
    ];

    for (const u of unitsData) {
      await prisma.unidad.upsert({
        where: { sigla: u.sigla },
        update: { nombre: u.nombre },
        create: { id: u.id, nombre: u.nombre, sigla: u.sigla }
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('SnowPoint2026!', salt);

    await prisma.usuario.upsert({
      where: { username: 'admin' },
      update: {
        nombre: 'Dr. Germán Jr Navía Gutiérrez',
        cargo: 'Director General Ejecutivo (CEO) & Administrador',
        rol: 'ADMIN',
        active: true
      },
      create: {
        id: 'admin-master-01',
        username: 'admin',
        email: 'admin@snowpoint.com.bo',
        password: passwordHash,
        nombre: 'Dr. Germán Jr Navía Gutiérrez',
        cargo: 'Director General Ejecutivo (CEO) & Administrador',
        rol: 'ADMIN',
        unidadId: 'unit-dir-exe-001',
        active: true
      }
    });

    isInitialized = true;
  } catch (error) {
    console.error('Error in ensureDatabaseInitialized:', error);
  }
}
