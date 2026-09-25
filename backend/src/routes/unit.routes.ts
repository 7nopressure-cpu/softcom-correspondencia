import { Router } from 'express';
import { getUnits, createUnit } from '../controllers/unit.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth';
import { Rol } from '../types/enums';

const router = Router();

router.get('/', authenticateJWT, getUnits);
router.post('/', authenticateJWT, requireRoles([Rol.ADMIN]), createUnit);

export default router;
