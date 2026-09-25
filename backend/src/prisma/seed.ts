import { PrismaClient } from '@prisma/client';
import { Rol } from '../types/enums';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando sincronización de estructura oficial SPH MOF (MAN-002 Rev 2.0)...');

  // 1. Crear / Actualizar Unidades Oficiales del MOF
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

  let tiUnitId = '';
  for (const u of unitsData) {
    const unit = await prisma.unidad.upsert({
      where: { sigla: u.sigla },
      update: { nombre: u.nombre },
      create: { id: u.id, nombre: u.nombre, sigla: u.sigla }
    });
    if (u.sigla === 'ADM-TI-006' || u.sigla === 'DIR-EXE-001') {
      if (!tiUnitId) tiUnitId = unit.id;
    }
  }

  console.log('Estructura orgánica de Unidades de SnowPoint Healthcare MOF 2.0 sincronizada.');

  // 2. Crear / Actualizar Administrador Inicial
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('SnowPoint2026!', salt);

  await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {
      nombre: 'Dr. Germán Jr Navía Gutiérrez',
      cargo: 'Director General Ejecutivo & Administrador de Plataforma',
      rol: Rol.ADMIN,
      active: true,
    },
    create: {
      username: 'admin',
      email: 'admin@snowpoint.com.bo',
      password: passwordHash,
      nombre: 'Dr. Germán Jr Navía Gutiérrez',
      cargo: 'Director General Ejecutivo & Administrador de Plataforma',
      rol: Rol.ADMIN,
      unidadId: tiUnitId,
      active: true,
    },
  });

  console.log('================================================================');
  console.log('  CUENTA PRINCIPAL DE ADMINISTRADOR SNOWPOINT ACTUALIZADA:');
  console.log(`  Usuario:    admin`);
  console.log(`  Titular:    Dr. Germán Jr Navía Gutiérrez`);
  console.log(`  Cargo:      Director General Ejecutivo (CEO)`);
  console.log(`  Rol:        ADMIN (Control Total y Gestión de Consultores)`);
  console.log('================================================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
