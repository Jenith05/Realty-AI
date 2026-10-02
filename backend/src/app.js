require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const authRoutes = require('./routes/auth')
const leadRoutes = require('./routes/leads')

const app = express()
const PORT = process.env.PORT || 5001

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/leads', leadRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.statusCode || 500).json({ message: err.message || 'Internal Server Error' })
})

// ── Connect to MongoDB then start server ──────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected')
    app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err.message)
    process.exit(1)
  })
