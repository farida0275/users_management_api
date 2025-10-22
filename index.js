import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(helmet());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log('Server running...');
});
