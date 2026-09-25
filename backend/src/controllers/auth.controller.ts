import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { JWT_SECRET } from '../config';
import { AuthenticatedRequest } from '../middlewares/auth';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { username },
      include: { unidad: true },
    });

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Credenciales inválidas o usuario inactivo en el sistema hospitalario.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        cargo: user.cargo,
        rol: user.rol,
        unidad: {
          id: user.unidad.id,
          nombre: user.unidad.nombre,
          sigla: user.unidad.sigla,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const loginCiudadaniaMock = async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Código de autenticación del Portal Médico requerido.' });
  }

  try {
    let user = await prisma.usuario.findUnique({
      where: { username: 'admin' },
      include: { unidad: true },
    });

    if (!user) {
      user = await prisma.usuario.findFirst({
        where: { active: true },
        include: { unidad: true },
      });
    }

    if (!user || !user.active) {
      return res.status(401).json({ message: 'No hay usuarios activos registrados en el Hospital Agramont.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      portalMedicoVerified: true,
      matricula: 'M-2891 LP',
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        cargo: user.cargo,
        rol: user.rol,
        unidad: {
          id: user.unidad.id,
          nombre: user.unidad.nombre,
          sigla: user.unidad.sigla,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error en la autenticación con el Portal Médico.' });
  }
};

export const loginLDAPMock = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuario y contraseña del Directorio Hospitalario requeridos.' });
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { username },
      include: { unidad: true },
    });

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Usuario no registrado en el Directorio Activo del Hospital Agramont.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      ldapAuth: true,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        cargo: user.cargo,
        rol: user.rol,
        unidad: {
          id: user.unidad.id,
          nombre: user.unidad.nombre,
          sigla: user.unidad.sigla,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error en el servidor de directorio hospitalario.' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;
  if (!authenticatedReq.user) {
    return res.status(401).json({ message: 'No autenticado.' });
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { id: authenticatedReq.user.id },
      include: { unidad: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.json({
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      cargo: user.cargo,
      rol: user.rol,
      unidad: {
        id: user.unidad.id,
        nombre: user.unidad.nombre,
        sigla: user.unidad.sigla,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
