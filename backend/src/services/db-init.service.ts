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

    // 2. Check and Seed Admin & Units
    const adminUser = await prisma.usuario.findFirst({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      console.log('Provisioning SnowPoint Healthcare initial units and admin...');
      
      const unitsData = [
        { id: 'dir-exec-01', nombre: 'Dirección Ejecutiva y General', sigla: 'DIR' },
        { id: 'cam-audit-02', nombre: 'Consultoría y Auditoría Médica', sigla: 'CAM' },
        { id: 'gcal-qual-03', nombre: 'Gestión de Calidad y Acreditaciones Hospitalarias', sigla: 'GCAL' },
        { id: 'aleg-legal-04', nombre: 'Asesoría Legal y Regulatoria Sanitaria', sigla: 'ALEG' },
        { id: 'oper-proj-05', nombre: 'Operaciones y Proyectos Hospitalarios', sigla: 'OPER' },
        { id: 'adm-fin-06', nombre: 'Administración y Finanzas', sigla: 'ADM' },
        { id: 'ti-tech-07', nombre: 'Sistemas y Tecnologías en Salud', sigla: 'TI' }
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
        update: { password: passwordHash, active: true },
        create: {
          id: 'admin-master-01',
          username: 'admin',
          email: 'admin@snowpoint.com.bo',
          password: passwordHash,
          nombre: 'Administrador de Sistemas',
          cargo: 'Administrador General de Plataforma',
          rol: 'ADMIN',
          unidadId: 'ti-tech-07',
          active: true
        }
      });
      console.log('Admin account created successfully: admin / SnowPoint2026!');
    }

    isInitialized = true;
  } catch (error) {
    console.error('Error in ensureDatabaseInitialized:', error);
  }
}
