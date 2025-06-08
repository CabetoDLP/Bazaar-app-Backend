import express from 'express';
import cors from 'cors';
import { connectDB } from './utils/db';
import productRouter from './controllers/productController';

const app = express();
const PORT = process.env.PORT || 5000;

//Configuracion de CORS
export const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: process.env.CORS_METHODS?.split(',') as string[] || ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
  ],
  credentials: false,
  optionsSuccessStatus: 204,
  preflightContinue: true, 
};

//uso de CORS y middleware
app.use(cors(corsOptions));
app.use(express.json());

//Controladores
app.use('/api', productRouter);

//Arranque del servidor
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  connectDB(); // Conecta a MongoDB
});