// Vercel serverless function: GET /api/health
import { aiAvailable } from '../lib/claude.js'

export default function handler(_req, res) {
  res.status(200).json({ aiAvailable: aiAvailable() })
}
