import { Router } from 'express';
import { login, loginCiudadaniaMock, loginLDAPMock, getMe } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/ciudadania', loginCiudadaniaMock);
router.post('/ldap', loginLDAPMock);
router.get('/me', authenticateJWT, getMe);

export default router;
