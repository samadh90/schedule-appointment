import express from 'express';
import cors from 'cors';
import './db'; // triggers DB init + migrations

import healthRouter from './routes/health';
import configRouter from './routes/config';
import blockedDatesRouter from './routes/blockedDates';
import appointmentsRouter from './routes/appointments';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/config', configRouter);
app.use('/api/blocked-dates', blockedDatesRouter);
app.use('/api/appointments', appointmentsRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
