import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { PORT, UPLOADS_DIR } from './config';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import unitRoutes from './routes/unit.routes';
import correspondenceRoutes from './routes/correspondence.routes';
import reportRoutes from './routes/report.routes';

const app = express();

// Middlewares globales
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos adjuntos cargados
app.use('/uploads', express.static(UPLOADS_DIR));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/correspondence', correspondenceRoutes);
app.use('/api/reports', reportRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), version: '2.0.0-hospital-agramont' });
});

// Servir Frontend compilado (Vite React SPA) de forma integrada si existe
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Manejador de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    message: err.message || 'Ocurrió un error inesperado en el servidor.'
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`   SOFTCOM HOSPITAL AGRAMONT`);
  console.log(`   Servidor en linea en el puerto: ${PORT}`);
  console.log(`   URL Local: http://localhost:${PORT}`);
  console.log(`   Directorio de Cargas: ${UPLOADS_DIR}`);
  console.log(`====================================================`);
});
