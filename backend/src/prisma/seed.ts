import { PrismaClient } from '@prisma/client';
import { Rol } from '../types/enums';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando sincronización para SNOWPOINT HEALTHCARE...');

  const existingAdmin = await prisma.usuario.findFirst({
    where: { username: 'admin' }
  });

  if (existingAdmin) {
    console.log('El usuario administrador ya existe. Saltando seed.');
    return;
  }

  // 1. Crear Departamentos y Áreas de Consultoría en Salud
  const unitsData = [
    { nombre: 'Dirección Ejecutiva y General', sigla: 'DIR' },
    { nombre: 'Consultoría y Auditoría Médica', sigla: 'CAM' },
    { nombre: 'Gestión de Calidad y Acreditaciones Hospitalarias', sigla: 'GCAL' },
    { nombre: 'Asesoría Legal y Regulatoria Sanitaria', sigla: 'ALEG' },
    { nombre: 'Operaciones y Proyectos Hospitalarios', sigla: 'OPER' },
    { nombre: 'Administración y Finanzas', sigla: 'ADM' },
    { nombre: 'Sistemas y Tecnologías en Salud', sigla: 'TI' }
  ];

  let tiUnitId = '';
  for (const u of unitsData) {
    const unit = await prisma.unidad.upsert({
      where: { sigla: u.sigla },
      update: { nombre: u.nombre },
      create: { nombre: u.nombre, sigla: u.sigla }
    });
    if (u.sigla === 'TI') {
      tiUnitId = unit.id;
    }
  }

  console.log('Departamentos y Servicios de SnowPoint Healthcare listos.');

  // 2. Crear ÚNICA Cuenta de Administrador Inicial
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
      unidadId: tiUnitId,
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
  console.log('médicos y especialistas desde el módulo "Gestión de Personal & Consultores".');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
