import { Router } from 'express';
import {
  createCorrespondence,
  deriveCorrespondence,
  acceptCorrespondence,
  archiveCorrespondence,
  closeCorrespondence,
  getBandejas,
  getCorrespondenceDetail
} from '../controllers/correspondence.controller';
import { authenticateJWT } from '../middlewares/auth';
import { uploadMiddleware } from '../middlewares/upload';

const router = Router();

// Registro con adjuntos (máximo 5 archivos)
router.post(
  '/',
  authenticateJWT,
  uploadMiddleware.array('files', 5),
  createCorrespondence
);

// Consulta de bandejas del funcionario
router.get('/bandeja/:bandeja', authenticateJWT, getBandejas);

// Detalle de una correspondencia específica
router.get('/:id', authenticateJWT, getCorrespondenceDetail);

// Acciones sobre la correspondencia (derivación, recepción, archivo, resolución)
router.post('/:id/derive', authenticateJWT, deriveCorrespondence);
router.post('/:id/accept', authenticateJWT, acceptCorrespondence);
router.post('/:id/archive', authenticateJWT, archiveCorrespondence);
router.post('/:id/close', authenticateJWT, closeCorrespondence);

export default router;
