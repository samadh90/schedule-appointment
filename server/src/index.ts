import express from 'express'
import cors from 'cors'
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

export const io = new Server(httpServer, {
  cors: { origin: '*' },
})

io.on('connection', socket => {
  console.log(`[socket] client connected: ${socket.id}`)
  socket.on('disconnect', () => console.log(`[socket] client disconnected: ${socket.id}`))
})

app.use(cors())
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/config', configRouter)
app.use('/api/blocked-dates', blockedDatesRouter)
app.use('/api/appointments', appointmentsRouter)

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))
