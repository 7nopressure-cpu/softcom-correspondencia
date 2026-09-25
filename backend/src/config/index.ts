import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const PORT = process.env.PORT || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || 'softcom-secret-key-2026-bolivia';
export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
export const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/softcom?schema=public';
