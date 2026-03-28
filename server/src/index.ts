import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import './db' // triggers DB init + migrations

import healthRouter from './routes/health'
import configRouter from './routes/config'
import blockedDatesRouter from './routes/blockedDates'
import appointmentsRouter from './routes/appointments'

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 3000

// Restrict to explicit origins; ALLOWED_ORIGINS is comma-separated in production
const allowedOrigins: string[] = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173']

export const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true },
})

io.on('connection', socket => {
  console.log(`[socket] client connected: ${socket.id}`)
  socket.on('disconnect', () => console.log(`[socket] client disconnected: ${socket.id}`))
})

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

// General rate limiter: 60 req/min/IP applied to all API routes
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

app.use('/api/health', healthRouter)
app.use('/api/config', generalLimiter, configRouter)
app.use('/api/blocked-dates', generalLimiter, blockedDatesRouter)
app.use('/api/appointments', generalLimiter, appointmentsRouter)

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))
