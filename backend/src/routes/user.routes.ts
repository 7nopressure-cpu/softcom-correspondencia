import { Router } from 'express';
import { 
  getUsers, 
  createUser, 
  toggleUserActive, 
  resetUserPassword,
  deleteUser
} from '../controllers/user.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth';
import { Rol } from '../types/enums';

const router = Router();

// Listar usuarios (disponible para autenticados al derivar, o con ?all=true para el admin)
router.get('/', authenticateJWT, getUsers);

// Rutas de administración exclusivas para el Administrador
router.post('/', authenticateJWT, requireRoles([Rol.ADMIN]), createUser);
router.patch('/:id/toggle', authenticateJWT, requireRoles([Rol.ADMIN]), toggleUserActive);
router.post('/:id/reset-password', authenticateJWT, requireRoles([Rol.ADMIN]), resetUserPassword);
router.delete('/:id', authenticateJWT, requireRoles([Rol.ADMIN]), deleteUser);

export default router;
