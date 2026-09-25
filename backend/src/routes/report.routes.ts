import { Router } from 'express';
import { getStats, getCorrespondenceReportPdf } from '../controllers/report.controller';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Estadísticas de correspondencia de la entidad
router.get('/stats', authenticateJWT, getStats);

// Descarga / visualización de Hoja de Ruta en PDF
router.get('/correspondence/:id/pdf', authenticateJWT, getCorrespondenceReportPdf);

export default router;
