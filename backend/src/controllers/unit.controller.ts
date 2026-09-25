import { Request, Response } from 'express';
import prisma from '../config/db';

export const getUnits = async (req: Request, res: Response) => {
  try {
    const units = await prisma.unidad.findMany({
      where: { active: true },
      orderBy: { nombre: 'asc' },
    });
    return res.json(units);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener unidades.' });
  }
};

export const createUnit = async (req: Request, res: Response) => {
  const { nombre, sigla } = req.body;

  if (!nombre || !sigla) {
    return res.status(400).json({ message: 'Nombre y sigla de unidad requeridos.' });
  }

  try {
    const existing = await prisma.unidad.findFirst({
      where: {
        OR: [{ nombre }, { sigla }],
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Ya existe una unidad con ese nombre o sigla.' });
    }

    const unit = await prisma.unidad.create({
      data: { nombre, sigla },
    });

    return res.status(201).json(unit);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al crear la unidad.' });
  }
};
