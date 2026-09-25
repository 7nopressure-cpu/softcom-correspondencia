import { PrismaClient } from '@prisma/client';
import { Rol } from '../types/enums';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando inicialización limpia para SNOWPOINT HEALTHCARE - CONSULTORA EN SALUD...');

  // 1. Limpiar base de datos
  await prisma.historialAccion.deleteMany();
  await prisma.derivacion.deleteMany();
  await prisma.adjunto.deleteMany();
  await prisma.hojaRuta.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.unidad.deleteMany();

  // 2. Crear Departamentos y Áreas de Consultoría en Salud
  const dir = await prisma.unidad.create({
    data: { nombre: 'Dirección Ejecutiva y General', sigla: 'DIR' },
  });

  const cam = await prisma.unidad.create({
    data: { nombre: 'Consultoría y Auditoría Médica', sigla: 'CAM' },
  });

  const gcal = await prisma.unidad.create({
    data: { nombre: 'Gestión de Calidad y Acreditaciones Hospitalarias', sigla: 'GCAL' },
  });

  const aleg = await prisma.unidad.create({
    data: { nombre: 'Asesoría Legal y Regulatoria Sanitaria', sigla: 'ALEG' },
  });

  const oper = await prisma.unidad.create({
    data: { nombre: 'Operaciones y Proyectos Hospitalarios', sigla: 'OPER' },
  });

  const adm = await prisma.unidad.create({
    data: { nombre: 'Administración y Finanzas', sigla: 'ADM' },
  });

  const ti = await prisma.unidad.create({
    data: { nombre: 'Sistemas y Tecnologías en Salud', sigla: 'TI' },
  });

  console.log('Departamentos y Servicios de SnowPoint Healthcare creados exitosamente.');

  // 3. Crear ÚNICA Cuenta de Administrador Inicial
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('SnowPoint2026!', salt);

  await prisma.usuario.create({
    data: {
      username: 'admin',
      email: 'admin@snowpoint.com.bo',
      password: passwordHash,
      nombre: 'Administrador de Sistemas',
      cargo: 'Administrador General de Plataforma',
      rol: Rol.ADMIN,
      unidadId: ti.id,
      active: true,
    },
  });

  console.log('================================================================');
  console.log('  CUENTA PRINCIPAL DE ADMINISTRADOR SNOWPOINT CREADA:');
  console.log(`  Usuario:    admin`);
  console.log(`  Contraseña: SnowPoint2026!`);
  console.log(`  Unidad:     Sistemas y Tecnologías en Salud (TI)`);
  console.log(`  Rol:        ADMINISTRADOR GENERAL`);
  console.log('================================================================');
  console.log('El Administrador puede dar de alta a los consultores, auditores');
  console.log('médicos y especialistas desde el módulo "Gestión de Usuarios".');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
