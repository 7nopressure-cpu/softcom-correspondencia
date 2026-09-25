import { Router } from 'express';
import { login, loginCiudadaniaMock, loginLDAPMock, getMe } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth';
import { ensureDatabaseInitialized } from '../services/db-init.service';

const router = Router();

router.post('/login', login);
router.post('/ciudadania', loginCiudadaniaMock);
router.post('/ldap', loginLDAPMock);
router.get('/me', authenticateJWT, getMe);
router.get('/setup-db', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
    res.json({ status: 'ok', message: 'Tablas y cuenta admin de SnowPoint Healthcare inicializadas con éxito.' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;
