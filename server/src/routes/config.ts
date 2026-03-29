import { Router } from 'express'
import { config } from '../config'

const router = Router()

// webhookUrl is an internal server secret — never expose it to clients
router.get('/', (_req, res) => {
  const { webhookUrl: _webhookUrl, ...publicConfig } = config
  res.json(publicConfig)
})

export default router
