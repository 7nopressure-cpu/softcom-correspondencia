import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import prisma from '../config/db';
import { Rol } from '../types/enums';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    rol: Rol;
    unidadId: string;
    nombre: string;
  };
}

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de autenticación no provisto.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        rol: true,
        unidadId: true,
        nombre: true,
        active: true
      }
    });

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Usuario no válido o inactivo.' });
    }

    (req as AuthenticatedRequest).user = { ...user, rol: user.rol as Rol };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token de autenticación inválido o expirado.' });
  }
};

export const requireRoles = (roles: Rol[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ message: 'No autenticado.' });
    }

    if (!roles.includes(user.rol)) {
      return res.status(403).json({ message: 'No cuenta con los permisos necesarios para esta acción.' });
    }

    next();
  };
};
