import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { Rol } from '../types/enums';

export const getUsers = async (req: Request, res: Response) => {
  const { unidadId, all } = req.query;

  try {
    const whereClause: any = {};
    if (!all || all !== 'true') {
      whereClause.active = true;
    }
    if (unidadId) {
      whereClause.unidadId = String(unidadId);
    }

    const users = await prisma.usuario.findMany({
      where: whereClause,
      select: {
        id: true,
        nombre: true,
        cargo: true,
        rol: true,
        username: true,
        email: true,
        active: true,
        createdAt: true,
        unidad: {
          select: {
            id: true,
            nombre: true,
            sigla: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener usuarios del hospital.' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { username, email, password, nombre, cargo, rol, unidadId } = req.body;

  if (!username || !email || !password || !nombre || !cargo || !rol || !unidadId) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios para registrar un nuevo usuario.' });
  }

  try {
    const existingUser = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: username.trim().toLowerCase() }, 
          { email: email.trim().toLowerCase() }
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'El nombre de usuario o correo electrónico ya se encuentra registrado.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const user = await prisma.usuario.create({
      data: {
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password: passwordHash,
        nombre: nombre.trim(),
        cargo: cargo.trim(),
        rol: rol as Rol,
        unidadId,
        active: true,
      },
      include: { unidad: true },
    });

    return res.status(201).json({
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      cargo: user.cargo,
      rol: user.rol,
      active: user.active,
      unidad: {
        id: user.unidad.id,
        nombre: user.unidad.nombre,
        sigla: user.unidad.sigla,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al crear el usuario en el sistema hospitalario.' });
  }
};

export const toggleUserActive = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.usuario.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (user.username === 'admin' && user.active) {
      return res.status(400).json({ message: 'No se puede desactivar la cuenta principal de administrador.' });
    }

    const updated = await prisma.usuario.update({
      where: { id },
      data: { active: !user.active },
      include: { unidad: true },
    });

    return res.json({
      id: updated.id,
      username: updated.username,
      nombre: updated.nombre,
      active: updated.active,
      message: `Usuario ${updated.active ? 'activado' : 'desactivado'} con éxito.`
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al cambiar estado del usuario.' });
  }
};

export const resetUserPassword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const passwordToSet = newPassword || 'Agramont2026!';

  try {
    const user = await prisma.usuario.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(passwordToSet, salt);

    await prisma.usuario.update({
      where: { id },
      data: { password: passwordHash },
    });

    return res.json({ message: `Contraseña restablecida con éxito para ${user.nombre}.` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al restablecer contraseña.' });
  }
};
